/**
 * GET/POST /api/cron/draft-replies
 *
 * Writes a reply draft for every new enquiry that actually asked something,
 * and puts it in /admin/replies for David to read, edit and send.
 *
 * Why this exists: from 8 to 11 Sep 2026 not one draft was written. The job
 * lived on a Claude scheduled task that fired, hung, and produced nothing —
 * silently, because its notifications were off. Roughly forty runs failed
 * before a lead asking a direct question went unanswered long enough to
 * notice. This moves the work into the app, on the same cron schedule as the
 * other nine jobs, where a failure shows up in the Vercel log and in the
 * daily health check rather than nowhere.
 *
 * It NEVER sends. Every row lands as `pending_review` and goes nowhere until
 * a human presses Send in /admin/replies, at which point the existing
 * five-minute sender takes it with tracking and unsubscribe headers intact.
 *
 * Facts come only from the Supabase fact tables (property_facts,
 * partner_facts). The model is told, explicitly, to say it will confirm
 * rather than guess — and whatever it could not source comes back in
 * `unanswered` and is shown in amber above the draft. A wrong number to a
 * EUR 200k buyer is the worst outcome this system can produce; an honest
 * "I'll check that" is never wrong.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isSuppressed } from '@/lib/suppressions';
import { isCronRequest } from '@/lib/cronAuth';

import { beat } from '@/lib/cronHeartbeat';
export const maxDuration = 300;

const MIN_AGE_MIN = 4;      // let the instant auto-reply land first
const MAX_AGE_H   = 48;     // older than this, a draft is no longer a reply
const MAX_PER_RUN = 5;      // a burst of enquiries drafts over several runs
const MIN_MESSAGE = 12;     // shorter than this is not a question

// floor_plan_requested was missing here until 11 Sep 2026, and it is the bulk
// of what actually comes in: of 26 inbound events in the 24h before this fix,
// 21 were floor-plan requests. The drafter was structurally blind to them, so
// it produced nothing on four consecutive days while people looked at three
// and four homes each.
const ENQUIRY_TYPES = ['enquiry_submitted', 'gallery_enquiry', 'tour_request', 'floor_plan_requested'];
// Only these carry a written message; a floor-plan request never does.
const MESSAGE_TYPES = new Set(['enquiry_submitted', 'gallery_enquiry', 'tour_request']);
const REPEAT_WINDOW_DAYS = 7;   // "looked at more than one home" counts as a question

// Not every enquiry is a buyer asking a question. A developer offering to
// list a building and a Rightmove notification body both clear the length
// test and would get a warm buyer reply, which is worse than no reply at
// all. These go to David as a task instead. Anything subtler - a complaint,
// a commission question, a press approach - the model flags with "escalate".
const NOT_A_BUYER = [
  /developer enquiry/i,
  /list your home/i,
  /rightmove overseas qualified lead/i,
  /\bpromoter\b/i,
];
const DRAFT_TRIGGERS = ['enquiry_reply', 'enquiry_reply_draft'];
// Triggers that fire without a human writing anything.
const AUTOMATED_TRIGGERS = new Set(['floor_plan_requested', 'enquiry_submitted', 'property_watch',
  'gallery_autoreply', 'search_saved', 'newsletter_signup', 'gallery_followup', 'gallery_nurture']);

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const PARTNER_DISPLAY = {
  pacaso: 'Pacaso', myne: 'MYNE', vivla: 'Vivla', andhamlet: '&Hamlet',
  abitaro: 'Abitaro', parispropertygroup: 'Paris Property Group',
};

const SYSTEM = `You are drafting a reply from Dylan Olsson, co-founder of Co-Ownership Property (COP), to someone who has enquired about a fractionally-owned home.

COP is an independent agent. It lists homes managed by six operators and introduces buyers to them.

VOICE
Warm, direct, unfussy. Em-dashes. Short paragraphs. Bold the numbers that matter. Answer the question that was asked, then offer the next step. Sign off "Warm regards," then "Dylan" — no signature block, no phone number, no company footer; those are added when it sends.

TONE — this matters as much as accuracy
Be warm and confident. Answer what they asked and move them forward. Do NOT volunteer objections they never raised, do NOT talk them out of buying, and do NOT hedge the operator's published figures with commentary about whose numbers they are. Constraints that exist to be fair — peak weeks rotating between owners, the owner group being deliberately mixed — are how the system protects them, so present them that way rather than as limitations. Being accurate and being encouraging are not in tension; say the true thing warmly.

FACTS
Use ONLY the facts supplied below. They come from verified tables.
- Never invent or estimate a price, a running cost, a legal structure or a tax consequence.
- If something was asked that the facts do not cover, say plainly that you will confirm it with the team, and list that question in "unanswered".
- If a fact is marked confidence "inferred" rather than "verified", treat it as unconfirmed: do not quote it as fact, and list it in "unanswered".
- Never promise floor plans or documents unless the facts say they exist.

LETTING THE HOME OUT
This is the single most dangerous question to get wrong, because the answer differs by operator AND by property, and a wrong yes sells someone an income they will never receive. Answer it ONLY from the per-property fact "Letting..." line below. If that line is absent, you do not know: say you will confirm it for this specific home and put it in "unanswered". Operator-level policy is context, never the answer — an operator that permits letting in principle may still manage a home where it is not allowed.

THE OPERATOR'S NAME
You are told whether this person has been registered with the operator. If they have NOT, never name the operator or link to its site — write "the team that manages this home". If they HAVE, you may name it.

ESCALATION
Some enquiries should not get a warm buyer reply at all: someone offering to sell or list their own property, a partnership or press approach, a complaint, a price negotiation, or a question about commissions. For those return {"escalate": true, "reason": "..."} and nothing else — David handles them himself.

OUTPUT
Otherwise return ONLY a JSON object, no prose around it:
{
  "subject": "the reply subject line",
  "html": "the body as simple <p> paragraphs, <ul>/<li> lists, <b> for emphasis and <a href> links — no <html>, <head>, <body>, no styles, no signature",
  "unanswered": ["each question you could not answer from the facts"],
  "notes": "one sentence for the reviewer: what you answered and anything you were unsure about"
}
Write the reply in the same language the person wrote in. German enquiries get English.`;

function textOf(v, max = 400) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Everything the model is allowed to know, as compact labelled text. */
// partner_facts now holds 100-180 rows per operator (deep audit, 11 Sep 2026),
// including 'contradictions' and 'open-questions' rows that exist precisely to
// stop the model asserting something we cannot source. Taking an arbitrary
// slice would drop the topic the lead actually asked about, so order by how
// often a buyer asks, and keep every guard row.
const FACT_PRIORITY = [
  'running-costs', 'rental-policy', 'usage-allocation', 'booking-rules',
  'purchase-costs', 'resale-exit', 'peak-and-holidays', 'guests-and-pets',
  'ownership-structure', 'share-sizes', 'taxes', 'financing',
  'management-service', 'pricing', 'trust-risk', 'identity',
  'markets-inventory', 'agent-program',
];
const GUARD_TOPICS = new Set(['contradictions', 'open-questions']);
const MAX_VERIFIED_FACTS = 80;

function selectPartnerFacts(rows) {
  if (!rows?.length) return null;
  const guard = rows.filter(r => GUARD_TOPICS.has(r.topic));
  const soft = rows.filter(r => !GUARD_TOPICS.has(r.topic) && r.confidence !== 'verified');
  // Straight priority ordering is not enough: Vivla alone has 23 verified
  // rental-policy rows, which would fill the budget before the model ever sees
  // a running cost. Deal the topics out round by round instead, so every topic
  // is represented and the high-priority ones simply get the deeper end.
  const byTopic = new Map();
  for (const r of rows) {
    if (GUARD_TOPICS.has(r.topic) || r.confidence !== 'verified') continue;
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
    byTopic.get(r.topic).push(r);
  }
  const decks = [...byTopic.entries()].sort((a, b) => {
    const ia = FACT_PRIORITY.indexOf(a[0]), ib = FACT_PRIORITY.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  }).map(e => e[1]);

  const hard = [];
  for (let round = 0; hard.length < MAX_VERIFIED_FACTS; round++) {
    let dealt = false;
    for (const deck of decks) {
      if (round >= deck.length) continue;
      hard.push(deck[round]);
      dealt = true;
      if (hard.length >= MAX_VERIFIED_FACTS) break;
    }
    if (!dealt) break;
  }
  return { verified: hard, unconfirmed: [...guard, ...soft] };
}

/**
 * What "finished" means for a client reply.
 *
 * Every rule below is here because it was broken by a human or a model first:
 * a draft went out on 11 Sep 2026 naming five homes with prices and not one
 * link, which left the reader to go and search the site for the thing we had
 * just recommended. A standard that lives in someone's head is not a standard.
 *
 * Returns a list of problems. An empty list means the draft is shippable.
 */
const PARTNER_NAMES = /\b(pacaso|vivla|myne|&\s*hamlet|and\s*hamlet|abitaro|paris property group)\b/i;

function validateDraft(out, { property, alternatives, mayName, knownForDays, hadHumanEmail }) {
  const problems = [];
  const html = String(out?.html || '');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  if (!text.trim()) problems.push('empty body');
  if (!textOf(out?.subject, 200)) problems.push('no subject');

  // 1. Every home we name has to be one click away.
  const homes = [property, ...(alternatives || [])].filter(Boolean);
  for (const h of homes) {
    const url = `/property/${h.slug}/`;
    const named = h.title && text.toLowerCase().includes(String(h.title).split('—')[0].trim().toLowerCase());
    if (named && !html.includes(url)) {
      problems.push(`names "${String(h.title).split('—')[0].trim()}" without linking it`);
    }
  }

  // 2. Never name an operator the lead has not been registered with.
  const named = text.match(PARTNER_NAMES);
  if (named && !mayName) {
    problems.push(`names the operator "${named[0]}" — this lead is not registered with them`);
  }

  // 3. A money figure the lead can act on has to come with the home it belongs
  //    to. A bare number with no listing beside it is how the wrong price gets
  //    attached to the wrong house.
  const money = text.match(/[€$£]\s?\d[\d,.]{2,}/g) || [];
  if (money.length && !homes.some(h => html.includes(`/property/${h.slug}/`))) {
    problems.push(`quotes ${money.length} figure(s) with no property link in the email`);
  }

  // 4. A visible URL is not a link. Gmail rewrites a bare URL in the body into
  //    a google.com/url redirect, so the reader sees a wall of tracking
  //    gibberish where a home's name should be.
  if (/https?:\/\//i.test(text)) {
    problems.push('a URL is visible in the body — link the home on its name instead');
  }

  // 5. Never tell a client about a failure they did not experience. A draft on
  //    11 Sep 2026 apologised to a lead for a photo gallery that had failed to
  //    send; she had no idea one was coming. It invented a problem in her head
  //    and then apologised for it.
  const INTERNAL_FAILURE = /(did ?n'?t (reach|go out|arrive|get (to you|sent))|never (reached|arrived|went out)|my fault|our (fault|mistake|end)|on us\b|slipped past|apologi[sz]e for the (delay|galler|photos))/i;
  const owned = text.match(INTERNAL_FAILURE);
  if (owned) {
    problems.push(`mentions an internal failure ("${owned[0]}") — did the client actually experience it?`);
  }

  // 6. A promise creates a task for David and a deadline for us. An offer costs
  //    nothing. "Happy to send the running costs if useful" beats "I'll confirm
  //    and come back to you" every time — and if the email already links the
  //    page, there is nothing left to promise.
  const PROMISE = /\bI'?ll\s+(send|get|forward|confirm|chase|come back|have (it|them|these)|chase (it|them) up)\b/i;
  const promised = text.match(PROMISE);
  if (promised) {
    problems.push(`makes a promise ("${promised[0]}…") — offer instead, unless it is something we will genuinely do`);
  }

  // 7. This job cannot read Gmail, so the thread is the truth and every draft is
  //    a guess until a human has compared the two. No age threshold: 70% of the
  //    contacts who have a real conversation started it within 30 days, and 20%
  //    within a day.
  problems.push('READ THE GMAIL THREAD before sending — this draft was written without it');
  const COLD_OPEN = /(thanks for (getting in touch|your enquiry)|nice to (meet|hear from) you|let me introduce)/i;
  if (COLD_OPEN.test(text) && (knownForDays > 2 || hadHumanEmail)) {
    problems.push('opens like a first contact to someone we have spoken to before');
  }

  return problems;
}

function buildContext({ contact, activity, lead, property, facts, partnerFacts, mayName, alsoViewed, alreadySent, alternatives, earlierMessages, knownForDays, hadHumanEmail }) {
  const L = [];
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email;
  L.push(`PERSON: ${name} <${contact.email}>`);
  if (contact.locale) L.push(`Their site language: ${contact.locale}`);
  if (contact.residence_country || contact.country) L.push(`Country: ${contact.residence_country || contact.country}`);
  if (contact.phone) L.push(`They gave a phone number.`);
  L.push('');
  const wrote = textOf(activity.metadata?.message, 2000);
  if (wrote) {
    L.push(`THEY WROTE (${activity.created_at}):`);
    L.push(wrote);
  } else {
    // Most people never type anything — they open galleries. Saying "thanks
    // for your question" to someone who asked none is the giveaway.
    L.push(`THEY DID NOT WRITE ANYTHING. What they did (${activity.created_at}):`);
    L.push(`- ${activity.type.replace(/_/g, ' ')}${property ? ` on ${property.title}` : ''}`);
    L.push('Open with what they looked at and give them the numbers. Do not thank them for a question they did not ask, and do not invent one.');
  }
  L.push('');

  // Requirements arrive in pieces. Guillaume told us "house not apartment",
  // "can it be let", and "sea view, detached, 4 beds, Ibiza" across three
  // separate messages; a reply built only from the latest one misses two
  // thirds of what he actually asked for.
  if (earlierMessages?.length) {
    L.push('THEY ALSO SAID EARLIER (oldest first) — treat all of this as live:');
    for (const m of earlierMessages) L.push(`- ${textOf(m, 400)}`);
    L.push('');
  }

  const brief = [];
  if (lead?.main_region || lead?.subregion) {
    brief.push(`Looking in: ${[lead.subregion, lead.main_region].filter(Boolean).join(', ')}`);
  }
  if (lead?.budget_min || lead?.budget_max) {
    const lo = lead.budget_min ? Number(lead.budget_min).toLocaleString('en-GB') : null;
    const hi = lead.budget_max ? Number(lead.budget_max).toLocaleString('en-GB') : null;
    brief.push(`Budget: ${lo && hi ? `${lo}-${hi}` : (hi ? `up to ${hi}` : `from ${lo}`)}`);
  }
  if (lead?.timeframe) brief.push(`Timeframe: ${textOf(lead.timeframe, 80)}`);
  if (lead?.message && lead.message !== activity.metadata?.message) {
    brief.push(`Their original enquiry: ${textOf(lead.message, 400)}`);
  }
  if (brief.length) {
    L.push('WHAT THEY TOLD US THEY WANT:');
    for (const b of brief) L.push(`- ${b}`);
    L.push('');
  }

  if (property) {
    L.push(`THE HOME THEY ASKED ABOUT: ${property.title}`);
    L.push(`URL: https://co-ownership-property.com/property/${property.slug}/`);
    const bits = [];
    if (property.beds) bits.push(`${property.beds} bedrooms`);
    if (property.baths) bits.push(`${property.baths} bathrooms`);
    if (property.size) bits.push(`${property.size} m²`);
    if (bits.length) L.push(bits.join(', '));
    if (property.price) L.push(`Share price: ${property.currency || 'EUR'} ${Number(property.price).toLocaleString('en-GB')} per 1/${property.share_denominator || 8}`);
    L.push('');
  }

  if (facts) {
    L.push('VERIFIED FACTS FOR THIS HOME:');
    if (facts.share_price)   L.push(`- Share price: ${facts.currency || 'EUR'} ${Number(facts.share_price).toLocaleString('en-GB')} per 1/${facts.share_denominator || 8}`);
    if (facts.monthly_cost)  L.push(`- Running costs: ${facts.currency || 'EUR'} ${facts.monthly_cost}/month per share${facts.annual_cost ? ` (${facts.currency || 'EUR'} ${facts.annual_cost}/year)` : ''}`);
    if (facts.cost_breakdown && Object.keys(facts.cost_breakdown).length) {
      L.push(`- Cost breakdown: ${textOf(JSON.stringify(facts.cost_breakdown), 700)}`);
    }
    if (facts.usage_nights)  L.push(`- Usage: ${facts.usage_nights} nights a year minimum per share`);
    if (facts.usage_model)   L.push(`- Booking: ${textOf(facts.usage_model, 300)}`);
    if (facts.shares_remaining != null) L.push(`- Shares still available: ${facts.shares_remaining} of ${facts.share_denominator || 8}`);
    if (facts.rental_allowed === false) L.push(`- Letting the home out is NOT permitted — owners and their guests only.`);
    if (facts.rental_allowed === true)  L.push(`- Letting is permitted: ${textOf(facts.rental_notes, 300) || 'subject to licence'}`);
    if (facts.rental_allowed == null) {
      L.push(`- Letting: NOT ON FILE for this home. If they asked about letting, say you will confirm it and list it in "unanswered".`);
    }
    if (facts.resale_notes)  L.push(`- Resale: ${textOf(facts.resale_notes, 400)}`);
    if (facts.financing_available != null) L.push(`- Financing available: ${facts.financing_available ? 'yes' : 'no'}${facts.financing_notes ? ` — ${textOf(facts.financing_notes, 300)}` : ''}`);
    L.push(`- Confidence on these figures: ${facts.confidence || 'unknown'}`);
    L.push('');
  } else if (property) {
    L.push('VERIFIED FACTS FOR THIS HOME: none on file. Do not quote costs or terms — say you will confirm them.');
    L.push('');
  }

  if (partnerFacts?.verified?.length) {
    L.push('VERIFIED FACTS ABOUT THE OPERATOR THAT MANAGES IT:');
    for (const f of partnerFacts.verified) {
      const scope = f.applies_to && f.applies_to !== 'all' ? ` (applies to: ${textOf(f.applies_to, 90)})` : '';
      L.push(`- ${f.question ? f.question + ' ' : ''}${textOf(f.answer_short, 420)}${scope}`);
    }
    L.push('');
  }

  if (partnerFacts?.unconfirmed?.length) {
    L.push('OPERATOR CLAIMS THAT ARE **NOT** CONFIRMED — NEVER STATE THESE AS FACT.');
    L.push('Either leave the point out, or say you will confirm it and add it to "unanswered".');
    for (const f of partnerFacts.unconfirmed) {
      L.push(`- ${f.question ? f.question + ' ' : ''}${textOf(f.answer_short, 300)}`);
    }
    L.push('');
  }

  L.push(`THEY HAVE BEEN TALKING TO US FOR ${knownForDays} DAY(S).`);
  L.push('THERE MAY BE AN EMAIL THREAD WITH THEM THAT THIS JOB CANNOT READ — possibly in');
  L.push('another language, possibly with figures already quoted or a promise already made.');
  L.push('Age is no guide: most real conversations start in the first week. Write something');
  L.push('that could not contradict a thread you have not seen — no "thanks for getting in');
  L.push('touch", no re-introducing the company, no re-offering a home they may already have');
  L.push('been sent, and no claim about what we have or have not done for them.');
  if (hadHumanEmail) {
    L.push('WE HAVE WRITTEN TO THEM BY HAND BEFORE. A conversation certainly exists.');
  }
  L.push('');

  if (alreadySent?.length) {
    L.push('WE HAVE ALREADY SENT THEM (newest first). Do NOT repeat this back to them —');
    L.push('build on it, and never re-introduce something they were told days ago:');
    for (const e of alreadySent) L.push(`- ${e.when}: "${textOf(e.subject, 120)}"`);
    L.push('');
  }

  if (alternatives?.length) {
    L.push('OTHER HOMES WE HAVE LIVE THAT FIT WHAT THEY ASKED FOR:');
    L.push('Offer these ONLY if they asked for alternatives, or if the home they asked about is gone.');
    L.push('Use our own title and our own URL. Do not name the operator.');
    for (const a of alternatives) {
      const bits = [a.beds ? `${a.beds} bed` : null,
        a.price ? `${a.currency || 'EUR'} ${Number(a.price).toLocaleString('en-GB')} per 1/${a.share_denominator || 8}` : null,
        a.monthly_cost ? `${a.currency || 'EUR'} ${a.monthly_cost}/month` : null].filter(Boolean);
      L.push(`- ${a.title} — ${bits.join(', ')}`);
      L.push(`  https://co-ownership-property.com/property/${a.slug}/`);
    }
    L.push('');
  }

  L.push(mayName
    ? `NAMING: this person has already been registered with ${mayName}. You may name them.`
    : `NAMING: this person has NOT been registered with the operator. Do NOT name the operator or link to its site.`);

  if (alsoViewed?.length) {
    L.push('');
    L.push(`ALSO LOOKED AT RECENTLY: ${alsoViewed.slice(0, 8).join(' | ')}`);
    L.push('If it helps them, you may acknowledge that and offer to narrow it down.');
  }
  return L.join('\n');
}

async function callClaude(context) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: context }],
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${textOf(j?.error?.message || JSON.stringify(j), 300)}`);
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  const body = text.startsWith('{') ? text : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  let out;
  try { out = JSON.parse(body); } catch { throw new Error('Model did not return JSON'); }
  if (out.escalate) return { escalate: true, reason: textOf(out.reason, 300) };
  if (!out.html || !out.subject) throw new Error('Model returned no subject or body');
  return out;
}

/**
 * Something that needs David rather than a draft. One admin task, deduped on
 * the activity id so a repeated run cannot pile them up.
 */
async function flag(db, activity, email, reason) {
  const tag = `Enquiry needs you (${String(activity.id).slice(0, 8)})`;
  const { data: open } = await db.from('admin_tasks')
    .select('id').is('completed_at', null).ilike('task', `${tag}%`).limit(1);
  if ((open || []).length) return;
  await db.from('admin_tasks').insert({
    task: textOf(`${tag}: ${email || 'a lead'} — ${reason}`, 220),
    due_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    reminder_at: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
    reminder_status: 'pending',
    created_by_email: 'claude@co-ownership-property.com',
  });
}

export default async function handler(req, res) {
  const __beatStart = Date.now();
  if (!isCronRequest(req)) return res.status(401).json({ message: 'Unauthorised' });

  const db = createSupabaseAdminClient();
  const now = Date.now();
  const since = new Date(now - MAX_AGE_H * 3600 * 1000).toISOString();
  const until = new Date(now - MIN_AGE_MIN * 60 * 1000).toISOString();

  const drafted = [];
  const skipped = [];
  const failed = [];

  try {
    const { data: acts, error: aErr } = await db.from('activities')
      .select('id, contact_id, lead_id, type, metadata, created_at')
      .in('type', ENQUIRY_TYPES)
      .gte('created_at', since)
      .lte('created_at', until)
      .order('created_at', { ascending: false })
      .limit(60);
    if (aErr) throw new Error(aErr.message);

    // One draft per person per run. Barbara asked for three galleries in three
    // minutes; she needs one reply covering all three, not three replies.
    const seenContacts = new Set();

    for (const activity of acts || []) {
      if (drafted.length >= MAX_PER_RUN) break;
      const label = activity.contact_id || activity.id;

      if (!activity.contact_id) { skipped.push(`${label}: no contact`); continue; }
      if (seenContacts.has(activity.contact_id)) continue;

      const message = textOf(activity.metadata?.message, 4000);
      const wroteSomething = MESSAGE_TYPES.has(activity.type) && message.length >= MIN_MESSAGE;

      // A single gallery click with nothing written belongs to
      // process-gallery-followups, not here — that cron exists precisely to
      // send one nudge per visit. But somebody opening two or more homes is
      // shopping, and that is a question even when they never typed one.
      let repeatSignal = 0;
      if (!wroteSomething) {
        const repeatSince = new Date(now - REPEAT_WINDOW_DAYS * 86400000).toISOString();
        const { count } = await db.from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', activity.contact_id)
          .in('type', ENQUIRY_TYPES)
          .gte('created_at', repeatSince);
        repeatSignal = count || 0;
        if (repeatSignal < 2) { skipped.push(`${label}: one gallery click, left to the follow-up cron`); continue; }
      }
      seenContacts.add(activity.contact_id);
      if (NOT_A_BUYER.some(rx => rx.test(message))) {
        await flag(db, activity, null, 'Seller, developer or portal enquiry — needs David, not a buyer reply');
        skipped.push(`${label}: not a buyer enquiry`); continue;
      }

      const { data: existing } = await db.from('email_queue')
        .select('id').eq('contact_id', activity.contact_id)
        .in('trigger', DRAFT_TRIGGERS)
        .gte('created_at', activity.created_at)
        .limit(1);
      if ((existing || []).length) { skipped.push(`${label}: already drafted`); continue; }

      // A person (or a Claude session) may already have answered this in Gmail.
      // That leaves a track in activities: 'reply_drafted' (a Gmail draft was
      // written) or 'email' with direction 'outbound' (a hand-written email
      // went out). Either one newer than the enquiry means this is not ours.
      const { data: handled } = await db.from('activities')
        .select('id, type')
        .eq('contact_id', activity.contact_id)
        .in('type', ['reply_drafted', 'email'])
        .gte('created_at', activity.created_at)
        .limit(5);
      const humanHandled = (handled || []).some(h => h.type === 'reply_drafted' || h.type === 'email');
      if (humanHandled) { skipped.push(`${label}: answered in Gmail already`); continue; }

      const { data: contact } = await db.from('contacts')
        .select('id, email, first_name, last_name, phone, locale, country, residence_country, tags')
        .eq('id', activity.contact_id).maybeSingle();
      if (!contact?.email) { skipped.push(`${label}: no email`); continue; }
      if ((Array.isArray(contact.tags) && contact.tags.includes('unsubscribed')) || await isSuppressed(db, contact.email)) {
        skipped.push(`${contact.email}: suppressed`); continue;
      }

      const { data: lead } = await db.from('leads')
        .select('id, property_slug, property_title, partner')
        .eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

      const slug = activity.metadata?.slug || lead?.property_slug || null;
      let property = null, facts = null, partnerFacts = null, mayName = null;

      if (slug) {
        const { data: p } = await db.from('properties')
          .select('slug, title, partner, price, currency, beds, baths, size, share_denominator, status, city, region, country')
          .eq('slug', slug).maybeSingle();
        property = p || null;

        const { data: f } = await db.from('property_facts').select('*').eq('slug', slug).maybeSingle();
        facts = f || null;

        if (property?.partner) {
          const { data: pf } = await db.from('partner_facts')
            .select('topic, question, answer_short, confidence, applies_to')
            .eq('partner', property.partner).limit(400);
          partnerFacts = selectPartnerFacts(pf);

          const { data: ref } = await db.from('partner_referrals')
            .select('partner, status').eq('contact_id', contact.id)
            .eq('status', 'sent_to_partner').limit(1).maybeSingle();
          if (ref) mayName = PARTNER_DISPLAY[String(ref.partner).toLowerCase()] || ref.partner;
        }
      }

      // What have we already said to this person? Repeating the brochure email
      // back at someone three days later is the clearest tell that nobody read
      // the thread.
      const { data: prior } = await db.from('email_queue')
        .select('subject, created_at, status, trigger')
        .eq('to_email', contact.email)
        .in('status', ['sent', 'approved'])
        .order('created_at', { ascending: false }).limit(12);

      // How long we have known someone does NOT predict whether a real
      // conversation exists. Of 417 contacts who have had a non-automated
      // email from us, 294 got it within 30 days of first contact and 82
      // within 24 hours. Mary Said was four days old and had the richest
      // thread of anyone drafted on 11 Sep 2026. An age threshold would skip
      // the check on 70% of the people it exists to catch, so there is no
      // threshold: every draft carries the warning.
      const { data: firstSeen } = await db.from('activities')
        .select('created_at').eq('contact_id', contact.id)
        .order('created_at', { ascending: true }).limit(1).maybeSingle();
      const knownForDays = firstSeen
        ? Math.round((Date.now() - new Date(firstSeen.created_at).getTime()) / 86400000)
        : 0;
      // This IS a real signal: we have written to them by hand before, so a
      // thread certainly exists. Its absence proves nothing — David types
      // replies straight into Gmail and those never touch email_queue.
      const hadHumanEmail = (prior || []).some(e => !AUTOMATED_TRIGGERS.has(e.trigger));
      const alreadySent = (prior || []).map(e => ({
        subject: e.subject,
        when: new Date(e.created_at).toISOString().slice(0, 10),
      }));

      // Everything else they have written to us, oldest first — requirements
      // arrive a piece at a time.
      const { data: msgs } = await db.from('activities')
        .select('metadata, created_at')
        .eq('contact_id', contact.id)
        .in('type', ['enquiry_submitted', 'gallery_enquiry', 'tour_request', 'email'])
        .neq('id', activity.id)
        .order('created_at', { ascending: true }).limit(8);
      const earlierMessages = [...new Set((msgs || [])
        .map(m => textOf(m.metadata?.message, 400))
        .filter(t => t && t.length > 20))];

      // Three live homes that fit what they asked for, so "do you have anything
      // else?" and "that one has gone" both have a real answer in the draft.
      let alternatives = [];
      {
        const region = property?.region || lead?.main_region || null;
        const country = property?.country || null;
        const target = Number(property?.price || lead?.budget_max || 0);
        let qb = db.from('properties')
          .select('slug, title, price, currency, beds, share_denominator, region, country')
          .in('status', ['Live', 'for_sale']).limit(24);
        if (region) qb = qb.eq('region', region);
        else if (country) qb = qb.eq('country', country);
        const { data: cand } = await qb;
        const pool = (cand || []).filter(c => c.slug !== property?.slug);
        const scored = pool.map(c => {
          let score = 0;
          if (property?.beds && c.beds) score += Math.abs(c.beds - property.beds) * 2;
          if (target && c.price) score += Math.abs(Number(c.price) - target) / Math.max(target, 1) * 10;
          if (lead?.budget_max && c.price && Number(c.price) > Number(lead.budget_max) * 1.15) score += 8;
          return { c, score };
        }).sort((a, b) => a.score - b.score);
        // Ibiza alone has three near-identical Playa d'en Bossa 2-beds. Offering
        // all three reads like a spreadsheet; take the best of each title first.
        const picked = [], titlesSeen = new Set();
        for (const { c } of scored) {
          const key = String(c.title || '').split('—')[0].trim().toLowerCase();
          if (titlesSeen.has(key)) continue;
          titlesSeen.add(key); picked.push(c);
          if (picked.length >= 3) break;
        }
        for (const { c } of scored) {
          if (picked.length >= 3) break;
          if (!picked.includes(c)) picked.push(c);
        }
        if (picked.length) {
          const { data: af } = await db.from('property_facts')
            .select('slug, monthly_cost').in('slug', picked.map(c => c.slug));
          const costs = Object.fromEntries((af || []).map(f => [f.slug, f.monthly_cost]));
          alternatives = picked.map(c => ({ ...c, monthly_cost: costs[c.slug] || null }));
        }
      }

      const { data: seen } = await db.from('activities')
        .select('description').eq('contact_id', contact.id)
        .in('type', ['floor_plan_requested', 'gallery_enquiry', 'enquiry_submitted', 'discreet_unlocked'])
        .order('created_at', { ascending: false }).limit(12);
      const alsoViewed = [...new Set((seen || []).map(s => textOf(s.description, 90)).filter(Boolean))];

      const context = buildContext({ contact, activity, lead, property, facts, partnerFacts, mayName, alsoViewed, alreadySent, alternatives, earlierMessages, knownForDays, hadHumanEmail });

      let out;
      try {
        out = await callClaude(context);
      } catch (e) {
        failed.push(`${contact.email}: ${e.message}`);
        continue;
      }

      if (out.escalate) {
        await flag(db, activity, contact.email, out.reason || 'Model asked for a human');
        skipped.push(`${contact.email}: escalated — ${textOf(out.reason, 80)}`);
        continue;
      }

      // The standard, enforced. A draft that fails still reaches the review
      // desk — silently dropping it would just be a different kind of silence —
      // but it arrives labelled with exactly what is wrong with it.
      const problems = validateDraft(out, { property, alternatives, mayName, knownForDays, hadHumanEmail });
      if (problems.length) {
        skipped.push(`${contact.email}: draft failed review — ${problems.join('; ')}`);
      }

      const { error: iErr } = await db.from('email_queue').insert({
        to_email: contact.email,
        to_name: contact.first_name || null,
        subject: textOf(out.subject, 200),
        html: String(out.html || ''),
        trigger: 'enquiry_reply_draft',
        status: 'pending_review',
        contact_id: contact.id,
        lead_id: lead?.id || null,
        notes: problems.length ? `NEEDS FIXING BEFORE SENDING: ${problems.join('; ')}` : null,
        template_props: {
          draftProblems: problems.length ? problems : null,
          locale: contact.locale || 'en',
          property: property?.title || lead?.property_title || null,
          propertyUrl: property ? `https://co-ownership-property.com/property/${property.slug}/` : null,
          partner: mayName || null,
          unanswered: Array.isArray(out.unanswered) ? out.unanswered.map(u => textOf(u, 200)) : [],
          model: MODEL,
          activity_id: activity.id,
        },
        notes: textOf(out.notes, 500),
      });
      if (iErr) { failed.push(`${contact.email}: ${iErr.message}`); continue; }

      await db.from('activities').insert({
        contact_id: contact.id,
        lead_id: lead?.id || null,
        type: 'reply_drafted',
        description: `Reply drafted for review — ${property?.title || 'general enquiry'}`,
        metadata: { activity_id: activity.id, unanswered: out.unanswered || [] },
      });

      drafted.push(contact.email);
    }
    // A run that failed every draft is not a healthy run, whatever the HTTP
    // status says — record it so cron_health and /admin/today show it red.
    await beat(db, 'draft-replies', {
      startedAt: __beatStart,
      ok: failed.length === 0,
      summary: `drafted ${drafted.length}, failed ${failed.length}, skipped ${skipped.length}`,
      error: failed.length ? failed[0] : null,
    });

    return res.status(200).json({
      ok: failed.length === 0,
      drafted: drafted.length,
      failed: failed.length,
      skipped: skipped.length,
      detail: { drafted, failed, skipped: skipped.slice(0, 10) },
    });
  } catch (e) {
    await beat(db, 'draft-replies', { startedAt: __beatStart, ok: false, error: e.message });
    return res.status(500).json({ ok: false, error: e.message, drafted: drafted.length, failed, });
  }
}
