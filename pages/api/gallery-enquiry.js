import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, logActivity, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendTeamNotification, sendHtml } from '@/lib/resend';

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';

const SIGNATURE = `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="border-top:1px solid #C9A84C;margin-top:36px;padding-top:24px;">
  <tr>
    <td width="104" valign="top" style="padding-right:20px;">
      <img src="${DYLAN_PHOTO}" width="84" height="84"
        style="border-radius:50%;display:block;object-fit:cover;border:2px solid #C9A84C;"
        alt="Dylan Olsson">
    </td>
    <td valign="middle">
      <p style="margin:0 0 2px;font-family:Georgia,serif;font-size:17px;font-weight:700;color:#1E3448;letter-spacing:0.01em;">Dylan Olsson</p>
      <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;color:#C9A84C;letter-spacing:0.1em;text-transform:uppercase;">Co-Founder &nbsp;·&nbsp; Co-Ownership Property</p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#444;">
        <a href="tel:+447901002763" style="color:#444;text-decoration:none;">+44 7901 002763</a>
      </p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#444;">
        <a href="mailto:dylan@co-ownership-property.com" style="color:#444;text-decoration:none;">dylan@co-ownership-property.com</a>
      </p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;">
        <a href="https://co-ownership-property.com" style="color:#C9A84C;text-decoration:none;font-weight:600;letter-spacing:0.02em;">co-ownership-property.com</a>
      </p>
    </td>
  </tr>
</table>`;

function emailShell(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:36px 32px 40px;">${body}${SIGNATURE}</td></tr>
  </table>
</body>
</html>`;
}

function firstReplyHtml({ firstName, propertyTitle, propertyUrl }) {
  const name    = firstName || 'there';
  const propLink = propertyUrl
    ? `<a href="${propertyUrl}" style="color:#1E3448;text-decoration:underline;">${propertyTitle}</a>`
    : `<strong>${propertyTitle}</strong>`;
  return emailShell(`
    <p style="margin:0 0 20px;">Hi ${name},</p>
    <p style="margin:0 0 20px;">Thanks for your interest in the ${propLink}!</p>
    <p style="margin:0 0 20px;">I'd love to connect you with the specialist team behind it — before I do, do you have any questions I can pass along to them about the property or the co-ownership model?</p>
    <p style="margin:0 0 32px;">Once I hear back I'll make the introduction straight away.</p>
    <p style="margin:0 0 4px;">Dylan</p>`);
}

function followUpHtml({ firstName, propertyTitle, propertyUrl, prevPropertyTitle }) {
  const name    = firstName || 'there';
  const propLink = propertyUrl
    ? `<a href="${propertyUrl}" style="color:#1E3448;text-decoration:underline;">${propertyTitle}</a>`
    : `<strong>${propertyTitle}</strong>`;
  return emailShell(`
    <p style="margin:0 0 20px;">Hi ${name},</p>
    <p style="margin:0 0 20px;">I also saw you enquired about the ${propLink}${prevPropertyTitle ? ` — alongside the ${prevPropertyTitle}` : ''}.</p>
    <p style="margin:0 0 20px;">Same goes — do you have any questions I can pass along to the team about this one?</p>
    <p style="margin:0 0 32px;">Happy to make both introductions at once if that's helpful.</p>
    <p style="margin:0 0 4px;">Dylan</p>`);
}

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, message, propertySlug, propertyTitle, propertyUrl } = req.body;
  if (!email || !phone) return res.status(400).json({ error: 'Missing required fields' });

  const { limited } = await checkRateLimit(email, 'gallery_enquiry', 10 * 60 * 1000, 3);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── Resolve property details ──────────────────────────────────────────────
  let resolvedRegion = null, resolvedCity = null, resolvedSlug = propertySlug || null;
  const db = getDb();
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

  // ── Check previous auto-replies to this lead ──────────────────────────────
  let prevReply = null;
  let alreadySentForThisProperty = false;
  try {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days
    const { data: prev } = await db.from('email_queue')
      .select('id, template_props, created_at')
      .eq('to_email', email)
      .eq('trigger', 'gallery_autoreply')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (prev && prev.length > 0) {
      prevReply = prev[0];
      alreadySentForThisProperty = prev.some(r =>
        r.template_props?.propertySlug === resolvedSlug
      );
    }
  } catch (_) {}

  // ── CRM ───────────────────────────────────────────────────────────────────
  try {
    const contact = await upsertContact({ email, firstName, lastName, phone: phone || null, source: 'gallery_enquiry' });
    if (contact) {
      await incrementScore(contact.id, 20);
      await createLead({ contactId: contact.id, propertySlug: resolvedSlug, propertyTitle, mainRegion: resolvedRegion, subregion: resolvedCity });
      await logActivity({ contactId: contact.id, type: 'gallery_enquiry', description: `Gallery enquiry for ${propertyTitle || propertySlug}`, metadata: { propertyTitle, propertyUrl, phone, message } });
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
          <tr><td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Phone</td>
              <td style="padding:10px 16px;background:#FAF8F5;${message ? 'border-bottom:1px solid #E8E3DC;' : ''}font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><a href="tel:${phone}" style="color:#C9A84C">${phone}</a></td></tr>
          ${message ? `<tr><td style="padding:10px 16px;background:#F5F2EC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Message</td>
              <td style="padding:10px 16px;background:#FAF8F5;font-family:Arial,sans-serif;font-size:14px;color:#1E3448;line-height:1.6">${message}</td></tr>` : ''}
        </table>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#9AACBB;margin-top:24px">Lead has already seen the full photo pack and floor plans.</p>`,
    });
  } catch (e) { console.error('[Mail] team notification failed:', e.message); }

  // ── Return immediately, then auto-reply after 30s delay ───────────────────
  res.status(200).json({ ok: true });

  if (!alreadySentForThisProperty) {
    setTimeout(async () => {
      try {
        const isFollowUp = !!prevReply;
        const subject = isFollowUp
          ? `Also — ${propertyTitle || propertySlug}`
          : `Your enquiry — ${propertyTitle || propertySlug}`;
        const html = isFollowUp
          ? followUpHtml({ firstName, propertyTitle: propertyTitle || propertySlug, propertyUrl, prevPropertyTitle: prevReply.template_props?.propertyTitle })
          : firstReplyHtml({ firstName, propertyTitle: propertyTitle || propertySlug, propertyUrl });

        // Save to queue for dedup tracking
        await db.from('email_queue').insert({
          to_email:       email,
          subject,
          html,
          trigger:        'gallery_autoreply',
          template_props: { propertyTitle, propertySlug: resolvedSlug, propertyUrl },
          status:         'sent',
          sent_at:        new Date().toISOString(),
        });

        await sendHtml({ to: email, subject, html, from: DYLAN_FROM, replyTo: DYLAN_REPLY });
      } catch (e) { console.error('[Mail] auto-reply failed:', e.message); }
    }, 30000);
  }
}
