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

export const maxDuration = 300;

const MIN_AGE_MIN = 4;      // let the instant auto-reply land first
const MAX_AGE_H   = 48;     // older than this, a draft is no longer a reply
const MAX_PER_RUN = 5;      // a burst of enquiries drafts over several runs
const MIN_MESSAGE = 12;     // shorter than this is not a question

const ENQUIRY_TYPES = ['enquiry_submitted', 'gallery_enquiry', 'tour_request'];

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
  const hard = rows
    .filter(r => !GUARD_TOPICS.has(r.topic) && r.confidence === 'verified')
    .sort((a, b) => {
      const ia = FACT_PRIORITY.indexOf(a.topic), ib = FACT_PRIORITY.indexOf(b.topic);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    })
    .slice(0, MAX_VERIFIED_FACTS);
  return { verified: hard, unconfirmed: [...guard, ...soft] };
}

function buildContext({ contact, activity, lead, property, facts, partnerFacts, mayName, alsoViewed }) {
  const L = [];
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email;
  L.push(`PERSON: ${name} <${contact.email}>`);
  if (contact.locale) L.push(`Their site language: ${contact.locale}`);
  if (contact.residence_country || contact.country) L.push(`Country: ${contact.residence_country || contact.country}`);
  if (contact.phone) L.push(`They gave a phone number.`);
  L.push('');
  L.push(`THEY WROTE (${activity.created_at}):`);
  L.push(textOf(activity.metadata?.message, 2000) || '(no message)');
  L.push('');

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

    for (const activity of acts || []) {
      if (drafted.length >= MAX_PER_RUN) break;
      const label = activity.contact_id || activity.id;

      // A gallery or floor-plan request with nothing written is already
      // covered by the instant auto-reply. Drafting a second generic note
      // is how a lead ends up with two emails saying the same thing.
      const message = textOf(activity.metadata?.message, 4000);
      if (message.length < MIN_MESSAGE) { skipped.push(`${label}: no question`); continue; }
      if (!activity.contact_id) { skipped.push(`${label}: no contact`); continue; }
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

      const { data: seen } = await db.from('activities')
        .select('description').eq('contact_id', contact.id)
        .in('type', ['floor_plan_requested', 'gallery_enquiry', 'enquiry_submitted', 'discreet_unlocked'])
        .order('created_at', { ascending: false }).limit(12);
      const alsoViewed = [...new Set((seen || []).map(s => textOf(s.description, 90)).filter(Boolean))];

      const context = buildContext({ contact, activity, lead, property, facts, partnerFacts, mayName, alsoViewed });

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

      const { error: iErr } = await db.from('email_queue').insert({
        to_email: contact.email,
        to_name: contact.first_name || null,
        subject: textOf(out.subject, 200),
        html: String(out.html || ''),
        trigger: 'enquiry_reply_draft',
        status: 'pending_review',
        contact_id: contact.id,
        lead_id: lead?.id || null,
        template_props: {
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

    return res.status(200).json({
      ok: failed.length === 0,
      drafted: drafted.length,
      failed: failed.length,
      skipped: skipped.length,
      detail: { drafted, failed, skipped: skipped.slice(0, 10) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, drafted: drafted.length, failed, });
  }
}
