/**
 * GET/POST /api/process-gallery-followups
 * Cron — runs every minute (see vercel.json).
 *
 * Sends a one-off "let me connect you with the specialist team" follow-up
 * email ~10 minutes after a visitor's FIRST photo / floor-plan gallery unlock.
 *
 * Behaviour (per spec):
 *   - Waits WINDOW_MIN (10) minutes after the first unlock. The delay lets us:
 *       a) batch several unlocks by the same person into ONE email, and
 *       b) detect an enquiry made in that window.
 *   - If the visitor submitted an enquiry within the window → send NOTHING
 *     (the enquiry auto-reply already covers them).
 *   - One follow-up per person per COOLDOWN_DAYS (30). A returning visitor can
 *     get a fresh one once 30+ days have passed since their last follow-up.
 *   - If the first unlock is older than MAX_AGE_MIN (60) the follow-up is
 *     considered too late — it is marked expired and never sent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SAFETY — this endpoint sends NOTHING unless explicitly enabled:
 *
 *   GALLERY_FOLLOWUP_ENABLED   unset / not 'true'  → no-op (this is the default)
 *   GALLERY_FOLLOWUP_ENABLED = 'true'              → live
 *
 *   GALLERY_FOLLOWUP_TEST_EMAILS = 'a@b.com,c@d.com'
 *     → TEST MODE: only those addresses are processed/emailed. Every other
 *       contact is completely ignored (not touched, not marked).
 *
 *   ?dry=1  → DRY RUN: scans and reports every decision it WOULD make, but
 *             sends no email and writes no marker. Safe to run any time.
 *
 * Markers are stored in email_queue with trigger='gallery_followup'
 * (status 'sent' for a real send, 'rejected' for suppressed/expired —
 *  'rejected' because the DB status check constraint allows only
 *  pending/approved/sent/rejected; a 'rejected' row is never sent by the
 *  process-email-queue cron).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createClient } from '@supabase/supabase-js';
import { sendHtml } from '@/lib/resend';
import { isEnvTrue } from '@/lib/email/engine';

// ── Tunables ────────────────────────────────────────────────────────────────
const WINDOW_MIN    = 10;   // wait at least this long after the first unlock
const MAX_AGE_MIN   = 120;  // never send if the first unlock is older than this — wide
                            // margin so a delayed poll never expires a real lead
const COOLDOWN_DAYS = 30;   // at most one follow-up per person per 30 days
const LOOKBACK_MIN  = 240;  // only scan unlocks from the last 4h — keeps every run tiny

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';

// Activity types that count as "they made an enquiry" — both trigger their own
// auto-reply, so the gallery follow-up must stand down if either is present.
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
    close: `Once I hear back, I'll let the team know so they can be in touch with you directly.`,
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
    close: `En cuanto me respondas, se lo haré saber al equipo para que se ponga en contacto contigo directamente.`,
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
    close: `Dès que vous me répondez, j'en informe l'équipe pour qu'elle puisse vous contacter directement.`,
    sign: 'Dylan',
    and: ' et ',
  },
};

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function joinList(items, andWord) {
  if (items.length <= 1) return items[0] || '';
  return items.slice(0, -1).join(', ') + andWord + items[items.length - 1];
}

function signatureHtml(role) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;">
  <tr>
    <td width="108" valign="top" style="padding-right:18px;">
      <img src="${DYLAN_PHOTO}" width="90" height="90"
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

function emailShell(body, locale, role) {
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
 * Build the follow-up email for one contact.
 * @param {string|null} firstName
 * @param {{title:string,url:string|null}[]} properties  — deduplicated
 * @param {'en'|'es'|'fr'} locale
 */
function buildEmail({ firstName, properties, locale }) {
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

/**
 * Insert a marker row into email_queue so this contact is not reprocessed.
 * status 'sent'     → a real follow-up was emailed
 * status 'rejected' → suppressed (enquiry) or expired (too old) — never sent
 */
async function insertMarker(db, { contact, status, subject, html, notes, properties }) {
  await db.from('email_queue').insert({
    to_email:       contact.email,
    to_name:        contact.first_name || null,
    subject:        subject || 'Gallery follow-up',
    html:           html || '',
    trigger:        'gallery_followup',
    template_props: properties ? { properties } : null,
    status,
    sent_at:        status === 'sent' ? new Date().toISOString() : null,
    contact_id:     contact.id,
    notes:          notes || null,
  });
}

export default async function handler(req, res) {
  // Auth — Vercel cron (GET / x-vercel-cron) or an internal call with CRM_SECRET.
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.method === 'GET';
  const isAuthed     = req.headers['authorization'] === `Bearer ${process.env.CRM_SECRET}`;
  if (!isVercelCron && !isAuthed) return res.status(401).json({ error: 'Unauthorised' });

  // ── SUPERSEDED BY THE EMAIL ENGINE ────────────────────────────────────────
  // Once the unified engine is live it owns the gallery_followup journey, so
  // this legacy processor stands down — guaranteeing there is never a
  // double-send. Cut over by setting EMAIL_ENGINE_ENABLED='true'.
  if (isEnvTrue('EMAIL_ENGINE_ENABLED')) {
    return res.status(200).json({
      ok: true, superseded: true,
      note: 'Handled by /api/email-engine (EMAIL_ENGINE_ENABLED=true).',
    });
  }

  // ── SAFETY GATE ───────────────────────────────────────────────────────────
  // Until this is explicitly switched on, the endpoint does nothing at all.
  if (!isEnvTrue('GALLERY_FOLLOWUP_ENABLED')) {
    return res.status(200).json({
      ok: true, disabled: true,
      note: "Inactive. Set GALLERY_FOLLOWUP_ENABLED='true' to activate.",
    });
  }

  const dryRun     = req.query.dry === '1' || req.query.dry === 'true';
  const testEmails = (process.env.GALLERY_FOLLOWUP_TEST_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const testMode   = testEmails.length > 0;

  const db  = getDb();
  const now = Date.now();
  const lookbackFrom = new Date(now - LOOKBACK_MIN * 60000).toISOString();
  const cooldownFrom = new Date(now - COOLDOWN_DAYS * 86400000).toISOString();

  // 1. Recent gallery-unlock activity, oldest first.
  const { data: unlocks, error: uErr } = await db
    .from('activities')
    .select('contact_id, created_at, metadata')
    .eq('type', 'floor_plan_requested')
    .gte('created_at', lookbackFrom)
    .not('contact_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(2000);
  if (uErr) return res.status(500).json({ error: uErr.message });

  const byContact = new Map();
  for (const a of unlocks || []) {
    if (!byContact.has(a.contact_id)) byContact.set(a.contact_id, []);
    byContact.get(a.contact_id).push(a);
  }

  // 2. Contacts already given a follow-up within the cooldown window.
  const { data: markers } = await db
    .from('email_queue')
    .select('contact_id')
    .eq('trigger', 'gallery_followup')
    .gte('created_at', cooldownFrom)
    .not('contact_id', 'is', null);
  const onCooldown = new Set((markers || []).map(m => m.contact_id));

  const results = [];
  let sent = 0, suppressed = 0, expired = 0, notDue = 0,
      skippedCooldown = 0, skippedTest = 0, skippedNoProp = 0, errors = 0;

  for (const [contactId, acts] of byContact) {
    if (onCooldown.has(contactId)) { skippedCooldown++; continue; }

    const burstStart = new Date(acts[0].created_at).getTime();
    const ageMin = (now - burstStart) / 60000;
    if (ageMin < WINDOW_MIN) { notDue++; continue; }   // still inside the 10-min wait

    // Contact details.
    const { data: contact } = await db
      .from('contacts')
      .select('id, email, first_name, locale')
      .eq('id', contactId)
      .maybeSingle();
    if (!contact || !contact.email) { errors++; continue; }

    const email   = contact.email.toLowerCase();
    const allowed = !testMode || testEmails.includes(email);

    // Test mode: contacts not on the allowlist are left completely untouched.
    if (testMode && !allowed && !dryRun) {
      skippedTest++;
      results.push({ email: contact.email, decision: 'skipped_test_mode' });
      continue;
    }

    // Too old — never send a stale follow-up.
    if (ageMin > MAX_AGE_MIN) {
      if (!dryRun) {
        await insertMarker(db, {
          contact, status: 'rejected',
          subject: 'Gallery follow-up — expired (unlock too old)',
          notes: `first unlock ${Math.round(ageMin)} min ago`,
        });
      }
      expired++;
      results.push({ email: contact.email, decision: dryRun ? 'would_expire' : 'expired', ageMin: Math.round(ageMin) });
      continue;
    }

    // Enquiry in the window [firstUnlock, now]? → stand down.
    const { data: enq } = await db
      .from('activities')
      .select('id')
      .eq('contact_id', contactId)
      .in('type', ENQUIRY_TYPES)
      .gte('created_at', acts[0].created_at)
      .limit(1);
    const hasEnquiry = (enq || []).length > 0;

    // Batch the unlocked properties (dedup by URL/title).
    const seen = new Set();
    const properties = [];
    for (const a of acts) {
      const title = a.metadata && a.metadata.propertyTitle;
      const url   = (a.metadata && a.metadata.propertyUrl) || null;
      if (!title) continue;
      const key = String(url || title).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      properties.push({ title, url });
    }

    if (hasEnquiry) {
      if (!dryRun) {
        await insertMarker(db, {
          contact, status: 'rejected',
          subject: 'Gallery follow-up — suppressed (enquiry in window)',
          notes: 'contact submitted an enquiry within the 10-minute window',
          properties,
        });
      }
      suppressed++;
      results.push({
        email: contact.email,
        decision: dryRun ? 'would_suppress_enquiry' : 'suppressed_enquiry',
        properties: properties.map(p => p.title),
      });
      continue;
    }

    if (properties.length === 0) {
      if (!dryRun) {
        await insertMarker(db, {
          contact, status: 'rejected',
          subject: 'Gallery follow-up — skipped (no property data)',
          notes: 'unlock activity carried no property title',
        });
      }
      skippedNoProp++;
      results.push({ email: contact.email, decision: dryRun ? 'would_skip_no_property' : 'skipped_no_property' });
      continue;
    }

    const locale = ['en', 'es', 'fr'].includes(contact.locale) ? contact.locale : 'en';
    const { subject, html } = buildEmail({ firstName: contact.first_name, properties, locale });

    if (dryRun) {
      results.push({
        email: contact.email,
        decision: allowed ? 'would_send' : 'would_send_but_not_on_test_allowlist',
        subject,
        properties: properties.map(p => p.title),
      });
      continue;
    }

    // ── Live send ───────────────────────────────────────────────────────────
    try {
      await sendHtml({ to: contact.email, subject, html, from: DYLAN_FROM, replyTo: DYLAN_REPLY });
      await insertMarker(db, { contact, status: 'sent', subject, html, properties });
      await db.from('activities').insert({
        contact_id:  contactId,
        type:        'gallery_followup_sent',
        description: `Gallery follow-up sent — ${properties.map(p => p.title).join(', ')}`,
        metadata:    { properties, subject },
      });
      sent++;
      results.push({ email: contact.email, decision: 'sent', subject, properties: properties.map(p => p.title) });
    } catch (e) {
      errors++;
      console.error(`[gallery-followup] send failed for ${contact.email}:`, e.message);
      results.push({ email: contact.email, decision: 'error', error: e.message });
    }
  }

  return res.status(200).json({
    ok: true,
    dryRun,
    testMode,
    testEmails: testMode ? testEmails : undefined,
    contactsScanned: byContact.size,
    sent, suppressed, expired,
    notDue, skippedCooldown, skippedTestMode: skippedTest, skippedNoProperty: skippedNoProp,
    errors,
    results,
  });
}
