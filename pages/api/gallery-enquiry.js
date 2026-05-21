import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, logActivity, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { sendHtml, sendTeamNotification } from '@/lib/resend';
import { cancelGalleryFollowup } from '@/lib/galleryFollowup';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';

function tr(key, locale, vars) {
  let v = t(`emails.gallery_enquiry.${key}`, locale);
  if (vars) {
    v = v.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  }
  return v;
}

function signatureHtml(locale) {
  const role = tr('signoff_role', locale);
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;">
  <tr>
    <td width="108" valign="top" style="padding-right:18px;">
      <img src="${DYLAN_PHOTO}" width="90" height="90"
        style="border-radius:50%;display:block;object-fit:cover;"
        alt="Dylan Olsson">
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

function emailShell(body, locale) {
  const htmlLang = locale || 'en';
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:36px 32px 40px;">${body}${signatureHtml(locale)}</td></tr>
  </table>
</body>
</html>`;
}

function firstReplyHtml({ firstName, propertyTitle, propertyUrl, locale }) {
  const greeting = firstName ? tr('greeting_name', locale, { firstName }) : tr('greeting_no_name', locale);
  const propLink = propertyUrl
    ? `<a href="${propertyUrl}" style="color:#1E3448;text-decoration:underline;">${propertyTitle}</a>`
    : `<strong>${propertyTitle}</strong>`;
  const intro    = tr('first_intro',  locale, { propertyLink: propLink });
  const offer    = tr('first_offer',  locale);
  const close    = tr('first_close',  locale);
  const signName = tr('signoff_name', locale);
  return emailShell(`
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${intro}</p>
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${close}</p>
    <p style="margin:0;">${signName}</p>`, locale);
}

function followUpHtml({ firstName, propertyTitle, propertyUrl, prevPropertyTitle, locale }) {
  const greeting = firstName ? tr('greeting_name', locale, { firstName }) : tr('greeting_no_name', locale);
  const propLink = propertyUrl
    ? `<a href="${propertyUrl}" style="color:#1E3448;text-decoration:underline;">${propertyTitle}</a>`
    : `<strong>${propertyTitle}</strong>`;
  const intro = prevPropertyTitle
    ? tr('followup_intro_with_prev', locale, { propertyLink: propLink, prevPropertyTitle })
    : tr('followup_intro_no_prev',   locale, { propertyLink: propLink });
  const offer    = tr('followup_offer',  locale);
  const close    = tr('followup_close',  locale);
  const signName = tr('signoff_name',    locale);
  return emailShell(`
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${intro}</p>
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${close}</p>
    <p style="margin:0;">${signName}</p>`, locale);
}

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — bots fill hidden fields. Silently accept (no email, no CRM) so
  // the bot sees a normal success response and does not retry or adapt.
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const { name, email, phone, message, propertySlug, propertyTitle, propertyUrl, locale: rawLocale } = req.body;
  if (!email || !phone) return res.status(400).json({ error: 'Missing required fields' });

  // Validate locale — defaults to 'en' for unknown values
  let locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const { limited } = await checkRateLimit(email, 'gallery_enquiry', 10 * 60 * 1000, 3);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  const db = getDb();

  // ── Resolve property ──────────────────────────────────────────────────────
  let resolvedRegion = null, resolvedCity = null, resolvedSlug = propertySlug || null;
  try {
    let prop = null;
    if (propertySlug) {
      const { data } = await db.from('properties').select('slug,region,city').eq('slug', propertySlug).single();
      prop = data;
    }
    if (!prop && propertyTitle) {
      const { data } = await db.from('properties').select('slug,region,city').eq('title', propertyTitle).single();
      prop = data;
    }
    if (prop) { resolvedSlug = prop.slug || resolvedSlug; resolvedRegion = prop.region; resolvedCity = prop.city; }
  } catch (_) {}

  // If no locale came in from the form, fall back to the contact's stored preference
  // (set on a previous form submission). Falls through to 'en' if unknown.
  if (!SUPPORTED_LOCALES.includes(rawLocale)) {
    try {
      const { data: existing } = await db
        .from('contacts')
        .select('locale')
        .eq('email', (email || '').toLowerCase().trim())
        .single();
      if (existing?.locale && SUPPORTED_LOCALES.includes(existing.locale)) {
        locale = existing.locale;
      }
    } catch (_) { /* no contact yet — stay with default */ }
  }

  // ── CRM ───────────────────────────────────────────────────────────────────
  try {
    const contact = await upsertContact({ email, firstName, lastName, phone: phone || null, source: 'gallery_enquiry', locale });
    if (contact) {
      await incrementScore(contact.id, 20);
      await createLead({ contactId: contact.id, propertySlug: resolvedSlug, propertyTitle, mainRegion: resolvedRegion, subregion: resolvedCity });
      await logActivity({ contactId: contact.id, type: 'gallery_enquiry', description: `Gallery enquiry for ${propertyTitle || propertySlug}`, metadata: { propertyTitle, propertyUrl, phone, message } });
      // They've enquired — cancel any pending gallery follow-up so it doesn't double up.
      await cancelGalleryFollowup(contact.id);
    }
  } catch (e) { console.error('[CRM] gallery-enquiry failed:', e.message); }

  // ── Team notification ─────────────────────────────────────────────────────
  try {
    await sendTeamNotification({
      subject: `Gallery Enquiry — ${name || email} — ${propertyTitle || propertySlug}`,
      html: `
        <h2 style="font-family:Georgia,serif;color:#1E3448;margin:0 0 24px">Gallery Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase;width:120px">Property</td>
              <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448">${propertyTitle || propertySlug}${propertyUrl ? ` — <a href="${propertyUrl}" style="color:#C9A84C">${propertyUrl}</a>` : ''}</td></tr>
          <tr><td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Name</td>
              <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448">${name || 'Not provided'}</td></tr>
          <tr><td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Email</td>
              <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><a href="mailto:${email}" style="color:#C9A84C">${email}</a></td></tr>
          <tr><td style="padding:10px 16px;background:#F5F2EC;${message ? 'border-bottom:1px solid #E8E3DC;' : ''}font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Phone</td>
              <td style="padding:10px 16px;background:#FAF8F5;${message ? 'border-bottom:1px solid #E8E3DC;' : ''}font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><a href="tel:${phone}" style="color:#C9A84C">${phone}</a></td></tr>
          ${message ? `<tr><td style="padding:10px 16px;background:#F5F2EC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Message</td>
              <td style="padding:10px 16px;background:#FAF8F5;font-family:Arial,sans-serif;font-size:14px;color:#1E3448">${message}</td></tr>` : ''}
        </table>`,
    });
  } catch (e) { console.error('[Mail] team notification failed:', e.message); }

  // ── Auto-reply: send directly (deduplication + follow-up) ─────────────────
  try {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: prev } = await db.from('email_queue')
      .select('id, template_props')
      .eq('to_email', email)
      .eq('trigger', 'gallery_autoreply')
      .eq('status', 'sent')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const alreadySentForThisProperty = (prev || []).some(r => r.template_props?.propertySlug === resolvedSlug);

    if (!alreadySentForThisProperty) {
      const prevReply = prev?.[0] || null;
      const isFollowUp = !!prevReply;
      const subjectKey = isFollowUp ? 'subject_followup' : 'subject_first';
      const subject    = tr(subjectKey, locale, { propertyTitle: propertyTitle || propertySlug });
      const html = isFollowUp
        ? followUpHtml({ firstName, propertyTitle: propertyTitle || propertySlug, propertyUrl, prevPropertyTitle: prevReply.template_props?.propertyTitle, locale })
        : firstReplyHtml({ firstName, propertyTitle: propertyTitle || propertySlug, propertyUrl, locale });

      // Send immediately — reliable, no cron dependency
      await sendHtml({ to: email, subject, html, from: DYLAN_FROM, replyTo: DYLAN_REPLY });

      // Log to email_queue for audit trail
      await db.from('email_queue').insert({
        to_email:       email,
        to_name:        name || null,
        subject,
        html,
        trigger:        'gallery_autoreply',
        template_props: { propertyTitle, propertySlug: resolvedSlug, propertyUrl, from: DYLAN_FROM, replyTo: DYLAN_REPLY },
        status:         'sent',
        sent_at:        new Date().toISOString(),
      });
    }
  } catch (e) { console.error('[Mail] auto-reply failed:', e.message); }

  return res.status(200).json({ ok: true });
}
