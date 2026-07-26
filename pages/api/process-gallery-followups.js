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
import { isSuppressed } from '@/lib/suppressions';

// ── Tunables ────────────────────────────────────────────────────────────────
const WINDOW_MIN    = 10;   // wait at least this long after the first unlock
const MAX_AGE_MIN   = 120;  // never send if the first unlock is older than this — wide
                            // margin so a delayed poll never expires a real lead
const COOLDOWN_DAYS = 30;   // at most one follow-up per person per 30 days
const LOOKBACK_MIN  = 240;  // only scan unlocks from the last 4h — keeps every run tiny
const BURST_GAP_MIN = 45;   // unlocks >45 min apart are SEPARATE visits, not one
                            // batch — the follow-up is timed off the latest visit

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
    intro: (links) => `Thanks for taking a look at ${links}!`,
    home: (city) => `the ${city} home`,
    offerSingle: `Is there anything I can help with — questions about the home, or how co-ownership actually works? Just reply to this email.`,
    offerMulti:  `Is there anything I can help with — questions about the homes, or how co-ownership actually works? Just reply to this email.`,
    closeSingle: `And whenever you're ready, I'm happy to connect you directly with the team that manages it.`,
    closeMulti:  `And whenever you're ready, I'm happy to connect you directly with the teams that manage them.`,
    sign: 'Dylan',
    and: ' and ',
    galleryLinksIntro: 'Here are your photo links, in case you need them again:',
    galleryLinkLabel: 'photos',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subjectSingle: (p) => `¿Alguna pregunta sobre ${p}?`,
    subjectMulti:  ()  => `¿Alguna pregunta sobre las propiedades que has visto?`,
    greetingName:  (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    intro: (links) => `¡Gracias por echar un vistazo a ${links}!`,
    home: (city) => `la propiedad en ${city}`,
    offerSingle: `¿Hay algo en lo que pueda ayudarte — alguna duda sobre la propiedad o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    offerMulti:  `¿Hay algo en lo que pueda ayudarte — alguna duda sobre las propiedades o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    closeSingle: `Y cuando quieras, con mucho gusto te pongo en contacto directo con el equipo que la gestiona.`,
    closeMulti:  `Y cuando quieras, con mucho gusto te pongo en contacto directo con los equipos que las gestionan.`,
    sign: 'Dylan',
    and: ' y ',
    galleryLinksIntro: 'Aquí tienes tus enlaces a las fotos, por si los necesitas de nuevo:',
    galleryLinkLabel: 'fotos',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subjectSingle: (p) => `Des questions sur ${p} ?`,
    subjectMulti:  ()  => `Des questions sur les biens que vous avez consultés ?`,
    greetingName:  (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    intro: (links) => `Merci d'avoir jeté un œil à ${links} !`,
    home: (city) => `la propriété à ${city}`,
    offerSingle: `Puis-je vous aider en quoi que ce soit — une question sur le bien, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    offerMulti:  `Puis-je vous aider en quoi que ce soit — une question sur les biens, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    closeSingle: `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec l'équipe qui le gère.`,
    closeMulti:  `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec les équipes qui les gèrent.`,
    sign: 'Dylan',
    and: ' et ',
    galleryLinksIntro: 'Voici vos liens vers les photos, si vous en avez encore besoin :',
    galleryLinkLabel: 'photos',
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

/**
 * Turn the full SEO title ("Rosemary Beach, Florida, USA — 6-Bed House With
 * Beach Access") into a short, human name for prose ("the Rosemary Beach home")
 * so the email doesn't read like a machine repeating a listing title. Falls
 * back to the raw title for any title that isn't in the standard format.
 */
function friendlyName(title, t) {
  const raw = String(title || '').trim();
  const structured = raw.includes(',') || /\s[—–-]\s/.test(raw);
  if (!structured) return raw;
  const city = raw.split(/\s[—–-]\s/)[0].split(',')[0].trim();
  return city ? t.home(city) : raw;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Per-property "photos" links block (no floor-plan promise — galleries vary
 * and not every listing has plans). Rapid multi-unlocks SKIP
 * the individual per-property gallery emails (see /api/unlock-drive's 24h
 * batching), so THIS email is what delivers the gallery links — every
 * property in the batch with a known gallery URL is listed here.
 */
function galleryLinksHtml(properties, t) {
  const withLinks = (properties || []).filter(p => p.galleryUrl);
  if (!withLinks.length) return '';
  const items = withLinks.map(p =>
    `<li style="margin:0 0 6px;">${escapeHtml(capitalize(friendlyName(p.title, t)))} — <a href="${escapeHtml(p.galleryUrl)}" style="color:#C9A84C;text-decoration:underline;">${t.galleryLinkLabel}</a></li>`
  ).join('');
  return `
    <p style="margin:0 0 8px;">${t.galleryLinksIntro}</p>
    <ul style="margin:0 0 20px;padding-left:22px;">${items}</ul>`;
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
    const label = escapeHtml(friendlyName(p.title, t));
    return p.url
      ? `<a href="${escapeHtml(p.url)}" style="color:#1E3448;text-decoration:underline;">${label}</a>`
      : `<strong>${label}</strong>`;
  });
  const links = joinList(linkParts, t.and);

  const subject  = single ? t.subjectSingle(friendlyName(properties[0].title, t)) : t.subjectMulti();
  const greeting = firstName ? t.greetingName(escapeHtml(firstName)) : t.greetingNoName;
  const offer    = single ? t.offerSingle : t.offerMulti;

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${t.intro(links)}</p>${galleryLinksHtml(properties, t)}
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${single ? t.closeSingle : t.closeMulti}</p>
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
  let sent = 0, suppressed = 0, expired = 0, notDue = 0, optedOut = 0,
      skippedCooldown = 0, skippedTest = 0, skippedNoProp = 0, errors = 0;

  for (const [contactId, allActs] of byContact) {
    if (onCooldown.has(contactId)) { skippedCooldown++; continue; }

    // Only the MOST RECENT burst of unlocks counts. allActs is ascending; walk
    // back from the newest and stop at the first gap >BURST_GAP_MIN. A visit
    // hours ago and a fresh visit now are separate sessions — without this, a
    // returning visitor's new unlock is measured against their old one and
    // wrongly expires.
    const acts = [allActs[allActs.length - 1]];
    for (let i = allActs.length - 2; i >= 0; i--) {
      const gapMin = (new Date(acts[0].created_at) - new Date(allActs[i].created_at)) / 60000;
      if (gapMin > BURST_GAP_MIN) break;
      acts.unshift(allActs[i]);
    }

    const burstStart = new Date(acts[0].created_at).getTime();
    const ageMin = (now - burstStart) / 60000;
    if (ageMin < WINDOW_MIN) { notDue++; continue; }   // still inside the 10-min wait

    // Contact details.
    const { data: contact } = await db
      .from('contacts')
      .select('id, email, first_name, locale, tags')
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

    // ── Opt-out guard (added 26 Jul 2026) ───────────────────────────────────
    // NOTE: `suppressed` elsewhere in this file means "an enquiry arrived in
    // the window, stand down" — nothing to do with the suppression LIST. This
    // cron had no opt-out check at all, so an unsubscribed or hard-bounced
    // person who opened a gallery was still emailed ten minutes later. It runs
    // every 5 minutes, which made it the most frequently firing unguarded
    // sender in the system. Both registers are checked: the suppressions row
    // and the contacts.tags mirror.
    const taggedOut = Array.isArray(contact.tags) && contact.tags.includes('unsubscribed');
    if (taggedOut || await isSuppressed(db, email)) {
      if (!dryRun) {
        await insertMarker(db, {
          contact, status: 'rejected',
          subject: 'Gallery follow-up — not sent (recipient opted out)',
          notes: taggedOut
            ? 'contact is tagged unsubscribed in the CRM'
            : 'address is on the suppression list',
        });
      }
      optedOut++;
      results.push({ email: contact.email, decision: dryRun ? 'would_skip_opted_out' : 'skipped_opted_out' });
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
      // Written by /api/unlock-drive since the 24h email batching landed;
      // older activities fall back to the slug, or carry no gallery link.
      const galleryUrl = (a.metadata && a.metadata.galleryUrl)
        || (a.metadata && a.metadata.propertySlug
            ? `https://co-ownership-property.com/gallery/${a.metadata.propertySlug}`
            : null);
      if (!title) continue;
      const key = String(url || title).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      properties.push({ title, url, galleryUrl });
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
    sent, suppressed, expired, optedOut,
    notDue, skippedCooldown, skippedTestMode: skippedTest, skippedNoProperty: skippedNoProp,
    errors,
    results,
  });
}
