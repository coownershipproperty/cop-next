/**
 * /api/admin/backfill-gallery-followups
 *
 * ONE-OFF catch-up. The gallery-follow-up cron was broken all day, so today's
 * unlockers never got their follow-up note. This endpoint sends it to them.
 *
 *   GET   → DRY PREVIEW. Returns exactly who would receive an email and what.
 *           Sends nothing. Safe to hit any time.
 *   POST ?confirm=send → LIVE. Sends the follow-up, writes a gallery_followup
 *           'sent' marker per contact.
 *
 * Scope & safety:
 *   - Only contacts who did a floor_plan unlock since 00:00 UTC today.
 *   - All of a contact's unlocks today are batched into ONE email.
 *   - Skips anyone who submitted an enquiry today (they got the enquiry reply).
 *   - Skips anyone who already has a gallery_followup 'sent' marker.
 *   - Idempotent: a second live run sends nothing (markers already exist).
 *
 * Delete this file once the catch-up has run.
 */
import { createClient } from '@supabase/supabase-js';
import { sendHtml } from '@/lib/resend';
import { isSuppressed } from '@/lib/suppressions';

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';
const ENQUIRY_TYPES = ['enquiry_submitted', 'gallery_enquiry'];

// ── Email copy (en / es / fr) — verbatim from process-gallery-followups.js ──
const COPY = {
  en: {
    role: 'Co-Founder · Co-Ownership Property',
    subjectSingle: (p) => `Questions about ${p}?`,
    subjectMulti:  ()  => `Questions about the homes you've been viewing?`,
    greetingName:  (n) => `Hi ${n},`,
    greetingNoName: 'Hi there,',
    intro: (links) => `Thanks for taking a look at ${links}!`,
    offerSingle: `Is there anything I can help with — questions about the home, or how co-ownership actually works? Just reply to this email.`,
    offerMulti:  `Is there anything I can help with — questions about the homes, or how co-ownership actually works? Just reply to this email.`,
    closeSingle: `And whenever you're ready, I'm happy to connect you directly with the team that manages it.`,
    closeMulti:  `And whenever you're ready, I'm happy to connect you directly with the teams that manage them.`,
    sign: 'Dylan',
    and: ' and ',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subjectSingle: (p) => `¿Alguna pregunta sobre ${p}?`,
    subjectMulti:  ()  => `¿Alguna pregunta sobre las propiedades que has visto?`,
    greetingName:  (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    intro: (links) => `¡Gracias por echar un vistazo a ${links}!`,
    offerSingle: `¿Hay algo en lo que pueda ayudarte — alguna duda sobre la propiedad o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    offerMulti:  `¿Hay algo en lo que pueda ayudarte — alguna duda sobre las propiedades o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    closeSingle: `Y cuando quieras, con mucho gusto te pongo en contacto directo con el equipo que la gestiona.`,
    closeMulti:  `Y cuando quieras, con mucho gusto te pongo en contacto directo con los equipos que las gestionan.`,
    sign: 'Dylan',
    and: ' y ',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subjectSingle: (p) => `Des questions sur ${p} ?`,
    subjectMulti:  ()  => `Des questions sur les biens que vous avez consultés ?`,
    greetingName:  (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    intro: (links) => `Merci d'avoir jeté un œil à ${links} !`,
    offerSingle: `Puis-je vous aider en quoi que ce soit — une question sur le bien, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    offerMulti:  `Puis-je vous aider en quoi que ce soit — une question sur les biens, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    closeSingle: `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec l'équipe qui le gère.`,
    closeMulti:  `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec les équipes qui les gèrent.`,
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
    <p style="margin:0 0 32px;">${single ? t.closeSingle : t.closeMulti}</p>
    <p style="margin:0;">${t.sign}</p>`;

  return { subject, html: emailShell(body, locale, t.role) };
}

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  const isLive = req.method === 'POST' && req.query.confirm === 'send';
  const db = getDb();

  // Start of today, UTC — matches the preview shown to David.
  const todayStart = new Date(new Date().toISOString().slice(0, 10)).toISOString();

  // 1. Today's gallery unlocks.
  const { data: unlocks, error: uErr } = await db
    .from('activities')
    .select('contact_id, created_at, metadata')
    .eq('type', 'floor_plan_requested')
    .gte('created_at', todayStart)
    .not('contact_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(2000);
  if (uErr) return res.status(500).json({ error: uErr.message });

  const byContact = new Map();
  for (const a of unlocks || []) {
    if (!byContact.has(a.contact_id)) byContact.set(a.contact_id, []);
    byContact.get(a.contact_id).push(a);
  }

  // 2. Contacts who already have a gallery_followup 'sent' marker — never double-send.
  const { data: sentMarkers } = await db
    .from('email_queue')
    .select('contact_id')
    .eq('trigger', 'gallery_followup')
    .eq('status', 'sent')
    .not('contact_id', 'is', null);
  const alreadySent = new Set((sentMarkers || []).map(m => m.contact_id));

  const results = [];
  let sent = 0, skippedEnquiry = 0, skippedAlready = 0, skippedNoProp = 0,
      optedOut = 0, errors = 0;

  for (const [contactId, acts] of byContact) {
    if (alreadySent.has(contactId)) {
      skippedAlready++;
      results.push({ decision: 'skipped_already_sent', contactId });
      continue;
    }

    const { data: contact } = await db
      .from('contacts')
      .select('id, email, first_name, locale, tags')
      .eq('id', contactId)
      .maybeSingle();
    if (!contact || !contact.email) { errors++; continue; }

    // Opt-out guard (added 26 Jul 2026). This route had no suppression check
    // at all — a bulk sender that could mail people who had unsubscribed or
    // hard-bounced. Both registers are checked.
    const taggedOut = Array.isArray(contact.tags) && contact.tags.includes('unsubscribed');
    if (taggedOut || await isSuppressed(db, contact.email.toLowerCase())) {
      optedOut++;
      results.push({ email: contact.email, decision: 'skipped_opted_out' });
      continue;
    }

    // Enquiry today? → skip (the enquiry auto-reply already covers them).
    const { data: enq } = await db
      .from('activities')
      .select('id')
      .eq('contact_id', contactId)
      .in('type', ENQUIRY_TYPES)
      .gte('created_at', todayStart)
      .limit(1);
    if ((enq || []).length > 0) {
      skippedEnquiry++;
      results.push({ email: contact.email, decision: 'skipped_enquiry' });
      continue;
    }

    // Batch all of today's unlocked properties (dedup by URL/title).
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
    if (properties.length === 0) {
      skippedNoProp++;
      results.push({ email: contact.email, decision: 'skipped_no_property' });
      continue;
    }

    const locale = ['en', 'es', 'fr'].includes(contact.locale) ? contact.locale : 'en';
    const { subject, html } = buildEmail({ firstName: contact.first_name, properties, locale });

    if (!isLive) {
      results.push({
        email: contact.email,
        decision: 'would_send',
        subject,
        properties: properties.map(p => p.title),
      });
      continue;
    }

    try {
      await sendHtml({ to: contact.email, subject, html, from: DYLAN_FROM, replyTo: DYLAN_REPLY });
      await db.from('email_queue').insert({
        to_email:       contact.email,
        to_name:        contact.first_name || null,
        subject,
        html,
        trigger:        'gallery_followup',
        status:         'sent',
        sent_at:        new Date().toISOString(),
        contact_id:     contactId,
        template_props: { properties },
        notes:          "One-off backfill — today's missed gallery follow-ups",
      });
      await db.from('activities').insert({
        contact_id:  contactId,
        type:        'gallery_followup_sent',
        description: `Gallery follow-up (backfill) — ${properties.map(p => p.title).join(', ')}`,
        metadata:    { properties, subject, backfill: true },
      });
      sent++;
      results.push({ email: contact.email, decision: 'sent', subject });
    } catch (e) {
      errors++;
      results.push({ email: contact.email, decision: 'error', error: e.message });
    }
  }

  return res.status(200).json({
    ok: true,
    mode: isLive ? 'LIVE' : 'dry-preview',
    contactsScanned: byContact.size,
    sent, skippedEnquiry, skippedAlready, skippedNoProperty: skippedNoProp,
    optedOut, errors,
    results,
  });
}
