/**
 * lib/galleryFollowup.js
 *
 * The "let me connect you with the specialist team" follow-up email that goes
 * out ~10 minutes after a visitor's first photo / floor-plan gallery unlock.
 *
 * No cron, no background job — the 10-minute delay is handled by Resend's
 * native scheduled send. The unlock endpoint calls scheduleOrUpdateGalleryFollowup()
 * synchronously on every unlock; the enquiry endpoints call cancelGalleryFollowup().
 *
 * Behaviour:
 *   - First unlock            → schedule a follow-up with Resend for now + 10 min.
 *   - More unlocks (same person, still pending) → update that one email to list
 *     every property — one email, never five. Original send time is kept.
 *   - Contact submits enquiry → cancel the pending follow-up (the enquiry
 *     auto-reply already covers them).
 *   - Already had a follow-up in the last 30 days → skip.
 *
 * Tracking lives in one email_queue row per follow-up (trigger='gallery_followup'):
 *   status 'pending'  → scheduled with Resend; template_props.scheduledAt holds
 *                       the send time, template_props.resendId the Resend id.
 *   status 'rejected' → cancelled.
 *   send_after is always NULL, so the process-email-queue cron never touches it.
 */
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const DELAY_MIN          = 10;           // send this long after the first unlock
const COOLDOWN_DAYS      = 30;           // at most one follow-up per person per 30 days
const MIN_UPDATE_LEAD_MS = 90 * 1000;    // don't try to update if it sends within 90s

const FROM     = 'Dylan Olsson <dylan@co-ownership-property.com>';
const REPLY_TO = 'dylan@co-ownership-property.com';
const PHOTO    = 'https://co-ownership-property.com/images/dylan-olsson.jpg';
const ENQUIRY_TYPES = ['enquiry_submitted', 'gallery_enquiry'];

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

// ── Email copy (en / es / fr) ───────────────────────────────────────────────
const COPY = {
  en: {
    role: 'Co-Founder · Co-Ownership Property',
    subjectSingle: (p) => `Questions about ${p}?`,
    subjectMulti:  ()  => `Questions about the homes you've been viewing?`,
    greetingName:  (n) => `Hi ${n},`,
    greetingNoName: 'Hi there,',
    intro: (links) => `Thanks for your interest in ${links}!`,
    offerSingle: `I'd love to connect you with the specialist team behind it — before I do, do you have any questions I can pass along to them about the property or the co-ownership model?`,
    offerMulti:  `I'd love to connect you with the specialist teams behind them — before I do, do you have any questions I can pass along about these homes or the co-ownership model?`,
    close: `Once I hear back I'll make the introduction straight away.`,
    sign: 'Dylan',
    and: ' and ',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subjectSingle: (p) => `¿Alguna pregunta sobre ${p}?`,
    subjectMulti:  ()  => `¿Alguna pregunta sobre las propiedades que has visto?`,
    greetingName:  (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    intro: (links) => `¡Gracias por tu interés en ${links}!`,
    offerSingle: `Me encantaría ponerte en contacto con el equipo especialista que hay detrás — antes de hacerlo, ¿tienes alguna pregunta que pueda trasladarles sobre la propiedad o el modelo de copropiedad?`,
    offerMulti:  `Me encantaría ponerte en contacto con los equipos especialistas que hay detrás — antes de hacerlo, ¿tienes alguna pregunta que pueda trasladarles sobre estas propiedades o el modelo de copropiedad?`,
    close: `En cuanto me respondas, haré la presentación de inmediato.`,
    sign: 'Dylan',
    and: ' y ',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subjectSingle: (p) => `Des questions sur ${p} ?`,
    subjectMulti:  ()  => `Des questions sur les biens que vous avez consultés ?`,
    greetingName:  (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    intro: (links) => `Merci de l'intérêt que vous portez à ${links} !`,
    offerSingle: `Je serais ravi de vous mettre en contact avec l'équipe spécialisée qui s'en occupe — avant cela, avez-vous des questions que je pourrais leur transmettre sur le bien ou sur le modèle de copropriété ?`,
    offerMulti:  `Je serais ravi de vous mettre en contact avec les équipes spécialisées qui s'en occupent — avant cela, avez-vous des questions que je pourrais leur transmettre sur ces biens ou sur le modèle de copropriété ?`,
    close: `Dès que vous me répondez, je fais l'introduction sans tarder.`,
    sign: 'Dylan',
    and: ' et ',
  },
};

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function joinList(items, andWord) {
  if (items.length <= 1) return items[0] || '';
  return items.slice(0, -1).join(', ') + andWord + items[items.length - 1];
}

export function signatureHtml(role) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;">
  <tr>
    <td width="108" valign="top" style="padding-right:18px;">
      <img src="${PHOTO}" width="90" height="90"
        style="border-radius:50%;display:block;object-fit:cover;" alt="Dylan Olsson">
    </td>
    <td valign="middle">
      <p style="margin:0 0 3px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1E3448;">Dylan Olsson</p>
      <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">${role}</p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#555;">+44 7901 002763</p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#555;">dylan@co-ownership-property.com</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;">
        <a href="https://co-ownership-property.com" style="color:#C9A84C;text-decoration:none;">co-ownership-property.com</a>
      </p>
    </td>
  </tr>
</table>`;
}

export function emailShell(body, locale, role) {
  return `<!DOCTYPE html>
<html lang="${locale || 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:36px 32px 40px;">${body}${signatureHtml(role)}</td></tr>
  </table>
</body>
</html>`;
}

/**
 * Build the follow-up email.
 * @param {string|null} firstName
 * @param {{title:string,url:string|null}[]} properties  — deduplicated, ≥1
 * @param {'en'|'es'|'fr'} locale
 * @returns {{subject:string, html:string}}
 */
export function buildFollowupEmail({ firstName, properties, locale }) {
  const t = COPY[locale] || COPY.en;
  const single = properties.length === 1;

  const linkParts = properties.map(p => {
    const title = escapeHtml(p.title);
    return p.url
      ? `<a href="${escapeHtml(p.url)}" style="color:#1E3448;text-decoration:underline;">${title}</a>`
      : `<strong>${title}</strong>`;
  });
  const links = joinList(linkParts, t.and);

  const subject  = single ? t.subjectSingle(properties[0].title) : t.subjectMulti();
  const greeting = firstName ? t.greetingName(escapeHtml(firstName)) : t.greetingNoName;
  const offer    = single ? t.offerSingle : t.offerMulti;

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${t.intro(links)}</p>
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${t.close}</p>
    <p style="margin:0;">${t.sign}</p>`;

  return { subject, html: emailShell(body, locale, t.role) };
}

// Dedupe a property list by url||title, dropping anything without a title.
function normProps(arr) {
  const seen = new Set();
  const out = [];
  for (const p of arr || []) {
    if (!p || !p.title) continue;
    const key = String(p.url || p.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: p.title, url: p.url || null });
  }
  return out;
}

/**
 * Called from the unlock endpoint on every gallery unlock.
 * Schedules a follow-up, or extends the still-pending one with the new property.
 * Best-effort — any failure is logged and swallowed so it never breaks the unlock.
 */
export async function scheduleOrUpdateGalleryFollowup({ contactId, email, firstName, locale, property }) {
  if (!contactId || !email || !property || !property.title) return;
  const loc = ['en', 'es', 'fr'].includes(locale) ? locale : 'en';
  const db = getDb();
  const nowMs = Date.now();

  // Most recent follow-up tracking row for this contact.
  const { data: row } = await db
    .from('email_queue')
    .select('id, status, template_props, created_at')
    .eq('trigger', 'gallery_followup')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row) {
    const tp = row.template_props || {};
    const schedMs = tp.scheduledAt ? Date.parse(tp.scheduledAt) : 0;
    const ageMs = nowMs - Date.parse(row.created_at);

    // Still pending and comfortably before its send time → add this property.
    if (row.status === 'pending' && schedMs > nowMs + MIN_UPDATE_LEAD_MS) {
      const existing = Array.isArray(tp.properties) ? tp.properties : [];
      const merged = normProps([...existing, property]);
      if (merged.length === existing.length) return; // already listed — nothing to do

      const { subject, html } = buildFollowupEmail({ firstName, properties: merged, locale: loc });
      let resendId = tp.resendId || null;
      try {
        if (tp.resendId) await resend.emails.cancel(tp.resendId);
        const r = await resend.emails.send({
          from: FROM, to: email, replyTo: REPLY_TO, subject, html, scheduledAt: tp.scheduledAt,
        });
        if (r && r.error) { console.error('[galleryFollowup] update send error:', r.error.message || r.error); return; }
        resendId = (r && r.data && r.data.id) || null;
      } catch (e) {
        console.error('[galleryFollowup] update failed:', e.message);
        return;
      }
      await db.from('email_queue').update({
        subject, html,
        template_props: { resendId, scheduledAt: tp.scheduledAt, properties: merged },
      }).eq('id', row.id);
      return;
    }

    // Pending-but-imminent, already sent, or cancelled — within cooldown → skip.
    if (ageMs < COOLDOWN_DAYS * 86400000) return;
    // Older than the cooldown → fall through and schedule a fresh follow-up.
  }

  // No row (or past cooldown). Skip if this contact already submitted an enquiry.
  const since = new Date(nowMs - COOLDOWN_DAYS * 86400000).toISOString();
  const { data: enq } = await db
    .from('activities')
    .select('id')
    .eq('contact_id', contactId)
    .in('type', ENQUIRY_TYPES)
    .gte('created_at', since)
    .limit(1);
  if (enq && enq.length) return;

  // Schedule a fresh follow-up.
  const scheduledAt = new Date(nowMs + DELAY_MIN * 60000).toISOString();
  const properties = normProps([property]);
  const { subject, html } = buildFollowupEmail({ firstName, properties, locale: loc });
  let resendId = null;
  try {
    const r = await resend.emails.send({
      from: FROM, to: email, replyTo: REPLY_TO, subject, html, scheduledAt,
    });
    if (r && r.error) { console.error('[galleryFollowup] schedule error:', r.error.message || r.error); return; }
    resendId = (r && r.data && r.data.id) || null;
  } catch (e) {
    console.error('[galleryFollowup] schedule failed:', e.message);
    return;
  }

  await db.from('email_queue').insert({
    to_email:       email,
    to_name:        firstName || null,
    subject,
    html,
    trigger:        'gallery_followup',
    status:         'pending',
    send_after:     null,
    contact_id:     contactId,
    template_props: { resendId, scheduledAt, properties },
  });
}

/**
 * Called from the enquiry endpoints. Cancels a still-pending follow-up so a
 * contact who enquires doesn't get both the enquiry reply and the follow-up.
 * Best-effort — failures are logged and swallowed.
 */
export async function cancelGalleryFollowup(contactId) {
  if (!contactId) return;
  try {
    const db = getDb();
    const { data: row } = await db
      .from('email_queue')
      .select('id, status, template_props')
      .eq('trigger', 'gallery_followup')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row || row.status !== 'pending') return;

    const tp = row.template_props || {};
    const schedMs = tp.scheduledAt ? Date.parse(tp.scheduledAt) : 0;
    if (schedMs <= Date.now()) return; // already sent — nothing to cancel

    try {
      if (tp.resendId) await resend.emails.cancel(tp.resendId);
    } catch (e) {
      console.error('[galleryFollowup] cancel send failed:', e.message);
    }
    await db.from('email_queue').update({
      status: 'rejected',
      notes:  'Cancelled — contact submitted an enquiry within the follow-up window',
    }).eq('id', row.id);
  } catch (e) {
    console.error('[galleryFollowup] cancel failed:', e.message);
  }
}
