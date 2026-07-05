/**
 * lib/followupSequence.js
 *
 * The Day-2 / Day-5 gallery nurture sequence (SEQ-A / SEQ-B) and the Day-7
 * enquiry check-in (SEQ-C). Copy lives in the follow-up sequence contract
 * (followup-email-copy.md) — same plain, personal style as
 * lib/galleryFollowup.js, sent from Dylan.
 *
 * How it plugs into the existing plumbing (nothing new is invented):
 *   - Emails are rows in email_queue with status 'pending' + send_after set,
 *     exactly like the retired welcome/nurture chasers. The existing
 *     /api/process-email-queue cron picks them up when due.
 *   - sequence_type 'gallery_nurture'  → A-D2/A-D5 (single) or B-D2/B-D5 (multi)
 *   - sequence_type 'enquiry_check'    → C-D7
 *   - template_name / template_props.step carry the step id that is logged to
 *     email_sends on send (e.g. 'nurture_d2_single').
 *
 * Sequencing rules (per the contract):
 *   - Gallery unlock            → queue A-D2 (+2d) and A-D5 (+5d).
 *   - 2nd unlock before a step fires → the still-pending rows are rebuilt as
 *     the B (shortlist) variants, keeping their original send_after.
 *   - ANY enquiry               → all pending gallery_nurture rows cancelled,
 *     C-D7 (+7d) queued.
 *   - C-D7 is cancelled at send time if the lead moved beyond
 *     new_lead/sent_to_partner, or a human interaction (activities type
 *     'email' / 'note' / 'phone_call') was logged after it was queued.
 *   - Suppression list respected; max 1 automated email per contact per 48h
 *     (violations are rescheduled, not dropped).
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { escapeHtml, signatureHtml } from '@/lib/galleryFollowup';
import { unsubUrl } from '@/lib/unsub';

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const ROLE        = 'Co-Founder · Co-Ownership Property';
const BASE_URL    = 'https://co-ownership-property.com';

export const SEQ_GALLERY = 'gallery_nurture';
export const SEQ_ENQUIRY = 'enquiry_check';
export const MANAGED_SEQUENCE_TYPES = [SEQ_GALLERY, SEQ_ENQUIRY];

// ── Tunables ────────────────────────────────────────────────────────────────
const NIGHTS_PER_YEAR = 44;       // ~nights per 1/8 share per year
const COST_RATE       = 0.0375;   // est. annual running costs as share of price
const FREQ_CAP_MS     = 48 * 3600 * 1000;   // max 1 automated email / 48h
const COOLDOWN_DAYS   = 30;       // don't restart nurture for the same contact
const DAY_MS          = 86400000;

// Triggers that count as "automated email" for the 48h frequency cap.
// The floor-plan delivery itself is transactional (they asked for it) and is
// deliberately NOT counted.
const AUTOMATED_TRIGGERS = ['gallery_followup', SEQ_GALLERY, SEQ_ENQUIRY];

// Activity types meaning "this contact enquired" (mirrors galleryFollowup.js).
const ENQUIRY_TYPES = ['enquiry_submitted', 'gallery_enquiry'];

// Activity types only ever written by a human in the CRM — used as the
// "a reply / real interaction happened" signal that cancels C-D7.
const HUMAN_TOUCH_TYPES = ['email', 'note', 'phone_call'];

// Lead statuses that still mean "waiting on the partner" — anything else
// (contacted, registered, reservation_confirmed, won, …) cancels C-D7.
const LEAD_OPEN_STATUSES = ['new_lead', 'sent_to_partner'];

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

function getDb() {
  return createSupabaseAdminClient();
}

// ── Maths (per the copy contract) ───────────────────────────────────────────
export function perNight(price) {
  if (!price) return null;
  return Math.round((price * COST_RATE) / NIGHTS_PER_YEAR);
}

export function annualCosts(price) {
  if (!price) return null;
  return Math.round(price * COST_RATE);
}

/** Rental comparison band by price tier — currency of the listing. */
export function rentBand(price) {
  if (!price) return { low: 700, high: 1200 };
  if (price < 200000) return { low: 400, high: 700 };
  if (price <= 400000) return { low: 700, high: 1200 };
  return { low: 1200, high: 2500 };
}

export function fmtMoney(amount, currency) {
  if (amount == null) return '';
  const sym = CURRENCY_SYM[currency] || '€';
  return `${sym}${Math.round(amount).toLocaleString('en-GB')}`;
}

function cityOf(property) {
  const fromTitle = String(property.title || '').split(',')[0].trim();
  return fromTitle || property.city || 'this home';
}

// ── Shared shell (galleryFollowup style + unsubscribe footer) ───────────────
function footerHtml(email) {
  const unsub = unsubUrl(email); // tokenised — one click on /unsubscribe writes the suppression
  return `
<p style="margin:28px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#999999;line-height:1.6;">
  You're receiving this because you requested photos or made an enquiry on
  <a href="${BASE_URL}" style="color:#999999;">co-ownership-property.com</a>.
  <a href="${unsub}" style="color:#999999;text-decoration:underline;">Unsubscribe</a>
</p>`;
}

function shell(body, email) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:36px 32px 40px;">${body}${signatureHtml(ROLE)}${footerHtml(email)}</td></tr>
  </table>
</body>
</html>`;
}

function greeting(firstName) {
  return firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,';
}

function propLink(p) {
  const title = escapeHtml(p.title);
  return p.url
    ? `<a href="${escapeHtml(p.url)}" style="color:#1E3448;text-decoration:underline;">${title}</a>`
    : `<strong>${title}</strong>`;
}

function joinList(items, andWord) {
  if (items.length <= 1) return items[0] || '';
  return items.slice(0, -1).join(', ') + andWord + items[items.length - 1];
}

/** "P.S." block with up to 3 similar homes (same country, closest in price). */
function similarPs(similar) {
  if (!similar || !similar.length) return '';
  const parts = similar.map(s => {
    const price = s.price ? ` (${fmtMoney(s.price, s.currency)})` : '';
    return `${propLink(s)}${price}`;
  });
  return `
    <p style="margin:32px 0 0;font-size:13px;color:#777777;">P.S. In case this one isn't quite it, a few similar homes: ${joinList(parts, ' and ')}.</p>`;
}

const signoff = `<p style="margin:0;">Warm regards,<br>Dylan</p>`;

// ── Templates ───────────────────────────────────────────────────────────────

/** A-D2 — Day 2, single unlock. */
export function buildNurtureD2Single({ firstName, property, similar }) {
  const city = cityOf(property);
  const priceBullet = property.price
    ? `A 1/8 share is <strong>${fmtMoney(property.price, property.currency)}</strong> — that's the whole cost of entry: taxes, legal fees, renovation and designer furnishing are all included.`
    : `A 1/8 share covers the whole cost of entry: taxes, legal fees, renovation and designer furnishing are all included.`;

  const body = `
    <p style="margin:0 0 20px;">${greeting(firstName)}</p>
    <p style="margin:0 0 20px;">You had a look at the ${propLink(property)} a couple of days ago — I wanted to check back in, since the good ones tend to find their owners quickly.</p>
    <p style="margin:0 0 12px;">Three things worth knowing about this one:</p>
    <ul style="margin:0 0 20px;padding-left:22px;">
      <li style="margin:0 0 10px;">${priceBullet}</li>
      <li style="margin:0 0 10px;">It comes with <strong>around ${NIGHTS_PER_YEAR} nights a year, every year</strong> — booked through a simple app, up to two years ahead, with peak weeks rotated fairly between owners.</li>
      <li style="margin:0;">It's fully managed. You arrive, your things are already there, and someone else worries about the pool.</li>
    </ul>
    <p style="margin:0 0 32px;">If you'd like the exact numbers for this home — running costs, the usage calendar, availability — just reply to this email, or I can put you in touch with the team that manages it. No obligation, ever.</p>
    ${signoff}${similarPs(similar)}`;

  return { subject: `Still thinking about ${city}?`, body };
}

/** A-D5 — Day 5, single unlock (needs a price for the per-night maths). */
export function buildNurtureD5Single({ firstName, property, similar }) {
  const city  = cityOf(property);
  const night = fmtMoney(perNight(property.price), property.currency);
  const band  = rentBand(property.price);
  const bandStr = `${fmtMoney(band.low, property.currency)}–${fmtMoney(band.high, property.currency)}`;

  const body = `
    <p style="margin:0 0 20px;">${greeting(firstName)}</p>
    <p style="margin:0 0 20px;">One number that tends to change how people think about the ${propLink(property)}:</p>
    <p style="margin:0 0 20px;">Owning a 1/8 share works out to roughly <strong>${night} per night you stay</strong> — that's the annual running costs (all-in: maintenance, insurance, taxes, management) spread over your ~${NIGHTS_PER_YEAR} nights a year.</p>
    <p style="margin:0 0 20px;">Renting an equivalent home in ${escapeHtml(city)} runs <strong>${bandStr} a night</strong> — every year, forever, building nothing.</p>
    <p style="margin:0 0 20px;">And unlike rent, your share is a real, deeded asset. If the property appreciates, your share does too. When you no longer want it, you sell it — at a price you set.</p>
    <p style="margin:0 0 32px;">Happy to walk you through the full breakdown for this home — just reply, or say the word and the managing team will send you everything.</p>
    ${signoff}${similarPs(similar)}`;

  return { subject: `${city} for ${night} a night`, body };
}

function tableShell(headers, rows) {
  const th = headers.map(h =>
    `<th align="left" style="padding:8px 10px;border-bottom:2px solid #1E3448;font-family:Arial,sans-serif;font-size:11px;color:#1E3448;letter-spacing:0.06em;text-transform:uppercase;">${h}</th>`
  ).join('');
  const trs = rows.map(cells =>
    `<tr>${cells.map(c => `<td style="padding:8px 10px;border-bottom:1px solid #e0e0e0;font-size:14px;">${c}</td>`).join('')}</tr>`
  ).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">
      <tr>${th}</tr>${trs}
    </table>`;
}

/** B-D2 — Day 2, multiple unlocks: the shortlist side by side. */
export function buildNurtureD2Multi({ firstName, properties }) {
  const rows = properties.map(p => [
    propLink(p),
    p.price ? fmtMoney(p.price, p.currency) : '—',
    p.beds ? String(p.beds) : '—',
    `~${NIGHTS_PER_YEAR}`,
    p.price ? fmtMoney(perNight(p.price), p.currency) : '—',
  ]);

  const body = `
    <p style="margin:0 0 20px;">${greeting(firstName)}</p>
    <p style="margin:0 0 20px;">You've been looking at a few of our homes — good taste. Here they are side by side to make the comparing easier:</p>
    ${tableShell(['Home', '1/8 share', 'Beds', 'Nights/yr', 'Est. per night'], rows)}
    <p style="margin:0 0 20px;">All of them work the same way underneath: real deeded ownership, ~${NIGHTS_PER_YEAR} nights a year, fully managed, running costs split eight ways.</p>
    <p style="margin:0 0 32px;">If one of them is pulling ahead, reply and tell me which — I'll get you the full details and can connect you with the team that manages it. And if none is quite right, tell me what's missing; with 370+ homes I can usually find the one you're describing.</p>
    ${signoff}`;

  return { subject: 'Your shortlist, side by side', body };
}

/** B-D5 — Day 5, multiple unlocks: the maths on the shortlist. */
export function buildNurtureD5Multi({ firstName, properties }) {
  const rows = properties.map(p => [
    propLink(p),
    p.price ? fmtMoney(p.price, p.currency) : '—',
    p.price ? fmtMoney(annualCosts(p.price), p.currency) : '—',
    p.price ? fmtMoney(perNight(p.price), p.currency) : '—',
  ]);

  // Band across the shortlist: lowest low – highest high, listing currency.
  const priced = properties.filter(p => p.price);
  const bands  = priced.map(p => rentBand(p.price));
  const cur    = (priced[0] || properties[0] || {}).currency;
  const low    = bands.length ? Math.min(...bands.map(b => b.low))  : 700;
  const high   = bands.length ? Math.max(...bands.map(b => b.high)) : 1200;
  const bandStr = `${fmtMoney(low, cur)}–${fmtMoney(high, cur)}`;

  const body = `
    <p style="margin:0 0 20px;">${greeting(firstName)}</p>
    <p style="margin:0 0 20px;">Quick follow-up on the homes you were comparing — the numbers people usually want next:</p>
    ${tableShell(['Home', '1/8 share', 'Est. annual costs', 'Est. per night'], rows)}
    <p style="margin:0 0 20px;">For context: renting equivalent homes in these locations runs ${bandStr} a night. Owning works out to a fraction of that — while you hold the asset.</p>
    <p style="margin:0 0 32px;">Want the exact figures for any of them? Reply with the one you like and I'll have the full breakdown sent over.</p>
    ${signoff}`;

  return { subject: 'The maths on your shortlist', body };
}

/** C-D7 — Day 7 after the enquiry was passed to the partner. */
export function buildEnquiryCheckD7({ firstName, propertyTitle, propertyUrl }) {
  const intro = propertyTitle
    ? `A week ago I passed your enquiry about the ${propLink({ title: propertyTitle, url: propertyUrl })} to the team that manages it — I just wanted to make sure they've been in touch and answered everything properly.`
    : `A week ago I passed your enquiry to the specialist team — I just wanted to make sure they've been in touch and answered everything properly.`;

  const body = `
    <p style="margin:0 0 20px;">${greeting(firstName)}</p>
    <p style="margin:0 0 20px;">${intro}</p>
    <p style="margin:0 0 20px;">If you're all set: wonderful, ignore me.</p>
    <p style="margin:0 0 32px;">If not — or if new questions have come up — reply here and I'll chase it personally, or help you look at alternatives if that home no longer fits.</p>
    ${signoff}`;

  return { subject: 'Did the team look after you?', body };
}

// ── DB helpers ──────────────────────────────────────────────────────────────

async function isSuppressed(db, email) {
  const { data } = await db
    .from('suppressions')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

/**
 * 3 live properties in the same country, closest by price, excluding the
 * unlocked ones. Used for the similar-homes P.S. in the A-emails.
 */
async function getSimilarByPrice(db, { country, price, excludeSlugs }) {
  if (!country || !price) return [];
  const { data } = await db
    .from('properties')
    .select('slug, title, price, currency')
    .eq('country', country)
    .in('status', ['Live', 'for_sale'])
    .not('price', 'is', null)
    .limit(200);
  const exclude = new Set(excludeSlugs || []);
  return (data || [])
    .filter(p => !exclude.has(p.slug))
    .sort((a, b) => Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price))
    .slice(0, 3)
    .map(p => ({
      title: p.title,
      price: Number(p.price),
      currency: p.currency,
      url: `${BASE_URL}/property/${p.slug}/`,
    }));
}

/**
 * Reliable status write for email_queue rows.
 *
 * THE CANCELLATION BUG lived here (see docs/email-automation-blueprint.md,
 * "Two real bugs this already fixes"): status was written blind. On databases
 * where the email_queue status CHECK constraint predates 'cancelled'/'error',
 * Postgres rejected the UPDATE, supabase-js returned the error in the result
 * object (it does not throw), nobody looked at it — and the rows silently
 * stayed 'pending'. So "cancelled" sequences still sent, and failed sends were
 * retried by the cron forever. Every status write now checks the result and
 * falls back to 'rejected' (allowed by every version of the constraint).
 */
export async function safeStatusUpdate(db, match, status, fields = {}) {
  for (const s of [status, 'rejected']) {
    let q = db.from('email_queue').update({ status: s, ...fields });
    for (const [col, val] of Object.entries(match)) q = q.eq(col, val);
    const { error } = await q;
    if (!error) return true;
    console.error(`[followupSequence] email_queue status='${s}' update failed:`, error.message);
    if (s === 'rejected') break;
  }
  return false;
}

function queueRow({ email, firstName, contactId, leadId, sequenceType, step, subject, html, sendAfter, props }) {
  return {
    to_email:      email,
    to_name:       firstName || null,
    subject,
    html,
    template_name: step,
    template_props: { step, from: DYLAN_FROM, replyTo: DYLAN_REPLY, ...props },
    trigger:       sequenceType,
    notes:         `Follow-up sequence step ${step}`,
    status:        'pending',
    send_after:    new Date(sendAfter).toISOString(),
    sequence_type: sequenceType,
    contact_id:    contactId || null,
    lead_id:       leadId || null,
  };
}

// ── Scheduling: gallery unlock → A-D2/A-D5 (or upgrade to B) ────────────────

/**
 * Called from /api/unlock-drive on every successful unlock. Best-effort —
 * never throws into the caller.
 *
 *   - No pending gallery_nurture rows → queue A-D2 (+2d) and A-D5 (+5d).
 *   - Pending rows exist and this is a NEW property → rebuild them as the
 *     B (shortlist) variants, keeping each row's original send_after.
 */
export async function scheduleGalleryNurture({ contactId, email, firstName, locale, propertySlug, propertyTitle, propertyUrl }) {
  try {
    if (!email || !propertySlug) return;
    const db = getDb();
    const cleanEmail = String(email).toLowerCase().trim();

    if (await isSuppressed(db, cleanEmail)) return;

    // Authoritative property details (price/beds/currency for the maths).
    const { data: prop } = await db
      .from('properties')
      .select('slug, title, city, country, price, currency, beds')
      .eq('slug', propertySlug)
      .maybeSingle();
    if (!prop) return;

    const property = {
      slug:     prop.slug,
      title:    prop.title || propertyTitle || prop.slug,
      url:      propertyUrl || `${BASE_URL}/property/${prop.slug}/`,
      city:     prop.city || null,
      country:  prop.country || null,
      price:    prop.price ? Number(prop.price) : null,
      currency: prop.currency || 'EUR',
      beds:     prop.beds || null,
    };

    // Still-pending steps for this person?
    let pq = db.from('email_queue')
      .select('id, send_after, template_name, template_props')
      .eq('sequence_type', SEQ_GALLERY)
      .eq('status', 'pending');
    pq = contactId ? pq.eq('contact_id', contactId) : pq.eq('to_email', cleanEmail);
    const { data: pending } = await pq;

    if (pending && pending.length) {
      // ── Upgrade to SEQ-B ─────────────────────────────────────────────────
      const bySlug = new Map();
      for (const row of pending) {
        for (const p of (row.template_props && row.template_props.properties) || []) {
          bySlug.set(p.slug || p.title, p);
        }
      }
      bySlug.set(property.slug, property);
      const properties = [...bySlug.values()];
      if (properties.length < 2) return; // same property unlocked again — nothing to change

      for (const row of pending) {
        const isD2  = String(row.template_name || '').includes('d2');
        const step  = isD2 ? 'nurture_d2_multi' : 'nurture_d5_multi';
        const built = isD2
          ? buildNurtureD2Multi({ firstName, properties })
          : buildNurtureD5Multi({ firstName, properties });
        const { error } = await db.from('email_queue').update({
          subject:        built.subject,
          html:           shell(built.body, cleanEmail),
          template_name:  step,
          template_props: { step, properties, from: DYLAN_FROM, replyTo: DYLAN_REPLY },
          notes:          `Follow-up sequence step ${step} (upgraded from single)`,
        }).eq('id', row.id);
        if (error) console.error('[followupSequence] B-upgrade failed:', error.message);
      }
      return;
    }

    // ── Fresh SEQ-A — but never restart a sequence inside the cooldown ──────
    const since = new Date(Date.now() - COOLDOWN_DAYS * DAY_MS).toISOString();
    let cq = db.from('email_queue')
      .select('id')
      .eq('sequence_type', SEQ_GALLERY)
      .gte('created_at', since)
      .limit(1);
    cq = contactId ? cq.eq('contact_id', contactId) : cq.eq('to_email', cleanEmail);
    const { data: recent } = await cq;
    if (recent && recent.length) return;

    // The sequence is for people who did NOT enquire.
    if (contactId) {
      const { data: enq } = await db
        .from('activities')
        .select('id')
        .eq('contact_id', contactId)
        .in('type', ENQUIRY_TYPES)
        .gte('created_at', since)
        .limit(1);
      if (enq && enq.length) return;
    }

    const similar = await getSimilarByPrice(db, {
      country: property.country,
      price: property.price,
      excludeSlugs: [property.slug],
    });

    const now  = Date.now();
    const base = { email: cleanEmail, firstName, contactId, sequenceType: SEQ_GALLERY };
    const props = { properties: [property], propertyTitle: property.title, propertyUrl: property.url };

    const rows = [];
    const d2 = buildNurtureD2Single({ firstName, property, similar });
    rows.push(queueRow({
      ...base, step: 'nurture_d2_single',
      subject: d2.subject, html: shell(d2.body, cleanEmail),
      sendAfter: now + 2 * DAY_MS, props,
    }));
    if (property.price) { // D5 is the per-night maths email — pointless without a price
      const d5 = buildNurtureD5Single({ firstName, property, similar });
      rows.push(queueRow({
        ...base, step: 'nurture_d5_single',
        subject: d5.subject, html: shell(d5.body, cleanEmail),
        sendAfter: now + 5 * DAY_MS, props,
      }));
    }

    const { error } = await db.from('email_queue').insert(rows);
    if (error) console.error('[followupSequence] nurture queue insert failed:', error.message);
  } catch (e) {
    console.error('[followupSequence] scheduleGalleryNurture failed:', e.message);
  }
}

// ── Enquiry: cancel gallery_nurture, queue C-D7 ─────────────────────────────

/**
 * Called from /api/enquiry and /api/gallery-enquiry. Best-effort.
 * Cancels every pending gallery_nurture email (reliably — see
 * safeStatusUpdate) and schedules the Day-7 "did the team look after you?"
 * check-in with sequence_type 'enquiry_check'.
 */
export async function handleEnquiryFollowups({ contactId, leadId, email, firstName, locale, propertyTitle, propertyUrl }) {
  try {
    if (!email) return;
    const db = getDb();
    const cleanEmail = String(email).toLowerCase().trim();
    const cancelFields = {
      rejected_at: new Date().toISOString(),
      notes: 'Cancelled — contact submitted an enquiry',
    };

    // Cancel by contact AND by address, so rows queued before the CRM contact
    // existed (contact_id NULL) are caught too.
    if (contactId) {
      await safeStatusUpdate(db,
        { contact_id: contactId, sequence_type: SEQ_GALLERY, status: 'pending' },
        'cancelled', cancelFields);
    }
    await safeStatusUpdate(db,
      { to_email: cleanEmail, sequence_type: SEQ_GALLERY, status: 'pending' },
      'cancelled', cancelFields);

    if (await isSuppressed(db, cleanEmail)) return;

    // One pending check-in per person is plenty.
    let dq = db.from('email_queue')
      .select('id')
      .eq('sequence_type', SEQ_ENQUIRY)
      .eq('status', 'pending')
      .limit(1);
    dq = contactId ? dq.eq('contact_id', contactId) : dq.eq('to_email', cleanEmail);
    const { data: existing } = await dq;
    if (existing && existing.length) return;

    const built = buildEnquiryCheckD7({ firstName, propertyTitle, propertyUrl });
    const { error } = await db.from('email_queue').insert(queueRow({
      email: cleanEmail, firstName, contactId, leadId,
      sequenceType: SEQ_ENQUIRY, step: 'enquiry_check_d7',
      subject: built.subject, html: shell(built.body, cleanEmail),
      sendAfter: Date.now() + 7 * DAY_MS,
      props: { propertyTitle: propertyTitle || null, propertyUrl: propertyUrl || null },
    }));
    if (error) console.error('[followupSequence] enquiry_check insert failed:', error.message);
  } catch (e) {
    console.error('[followupSequence] handleEnquiryFollowups failed:', e.message);
  }
}

// ── Send-time guard rails (called by /api/process-email-queue) ──────────────

/**
 * Decide what to do with a due queue row right before sending.
 * Returns { action: 'send' } |
 *         { action: 'cancel', notes } |
 *         { action: 'reschedule', sendAfter, notes }
 *
 * The suppression check runs for EVERY row (the /unsubscribe flow writes
 * `suppressions` and promises nothing further will send); the late-cancel
 * and frequency-cap rules only apply to the managed sequence types.
 */
export async function preflightSequenceEmail(db, row, nowMs = Date.now()) {
  const email = String(row.to_email || '').toLowerCase().trim();

  // Suppression list — always wins, for every queued email.
  if (await isSuppressed(db, email)) {
    return { action: 'cancel', notes: 'Cancelled — recipient is on the suppression list' };
  }

  if (!MANAGED_SEQUENCE_TYPES.includes(row.sequence_type)) return { action: 'send' };

  // Belt and braces: a nurture email never sends if the contact enquired
  // after it was queued, even if the enquiry-time cancellation was missed.
  if (row.sequence_type === SEQ_GALLERY && row.contact_id) {
    const { data: enq } = await db
      .from('activities')
      .select('id')
      .eq('contact_id', row.contact_id)
      .in('type', ENQUIRY_TYPES)
      .gte('created_at', row.created_at)
      .limit(1);
    if (enq && enq.length) {
      return { action: 'cancel', notes: 'Cancelled — contact enquired after this was queued' };
    }
  }

  // C-D7 stands down once the lead moved on, or a human interaction was logged.
  if (row.sequence_type === SEQ_ENQUIRY) {
    if (row.lead_id) {
      const { data: lead } = await db
        .from('leads')
        .select('status')
        .eq('id', row.lead_id)
        .maybeSingle();
      if (lead && lead.status && !LEAD_OPEN_STATUSES.includes(lead.status)) {
        return { action: 'cancel', notes: `Cancelled — lead progressed to '${lead.status}'` };
      }
    }
    if (row.lead_id || row.contact_id) {
      let tq = db.from('activities')
        .select('id')
        .in('type', HUMAN_TOUCH_TYPES)
        .gte('created_at', row.created_at)
        .limit(1);
      tq = row.lead_id ? tq.eq('lead_id', row.lead_id) : tq.eq('contact_id', row.contact_id);
      const { data: touched } = await tq;
      if (touched && touched.length) {
        return { action: 'cancel', notes: 'Cancelled — a reply/interaction was logged for this lead' };
      }
    }
  }

  // Frequency cap: max 1 automated email per contact per 48h → reschedule.
  const capFrom = new Date(nowMs - FREQ_CAP_MS).toISOString();
  let fq = db.from('email_queue')
    .select('sent_at, sequence_type, trigger')
    .eq('status', 'sent')
    .gte('sent_at', capFrom);
  fq = row.contact_id ? fq.eq('contact_id', row.contact_id) : fq.eq('to_email', email);
  const { data: recentSent } = await fq;
  const automated = (recentSent || []).filter(r =>
    r.sequence_type || AUTOMATED_TRIGGERS.includes(r.trigger)
  );
  if (automated.length) {
    const lastMs = Math.max(...automated.map(r => Date.parse(r.sent_at) || 0));
    return {
      action: 'reschedule',
      sendAfter: new Date(lastMs + FREQ_CAP_MS + 5 * 60000).toISOString(),
      notes: 'Deferred — 48h frequency cap',
    };
  }

  return { action: 'send' };
}
