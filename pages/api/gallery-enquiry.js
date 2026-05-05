import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, logActivity, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendTeamNotification, sendHtml } from '@/lib/resend';

const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';

function autoReplyHtml({ firstName, propertyTitle, propertyUrl }) {
  const greeting = firstName || 'there';
  const propLink  = propertyUrl
    ? `<a href="${propertyUrl}" style="color:#1E3448;text-decoration:underline;">${propertyTitle}</a>`
    : propertyTitle;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#222222;line-height:1.65;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:32px 28px 0;">

      <p style="margin:0 0 18px;">Hi ${greeting},</p>

      <p style="margin:0 0 18px;">Thanks for your interest in the ${propLink}!</p>

      <p style="margin:0 0 18px;">I'd love to connect you with the specialist team behind it — before I do, do you have any questions I can pass along to them about the property or the co-ownership model?</p>

      <p style="margin:0 0 32px;">Once I hear back I'll make the introduction straight away.</p>

      <p style="margin:0 0 24px;">Dylan</p>

      <!-- Signature divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:4px;">
        <tr>
          <td width="72" valign="top" style="padding-right:16px;">
            <img src="${DYLAN_PHOTO}" width="60" height="60"
              style="border-radius:50%;display:block;object-fit:cover;"
              alt="Dylan Olsson">
          </td>
          <td valign="middle">
            <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1E3448;">Dylan Olsson</p>
            <p style="margin:0 0 6px;font-size:12px;color:#777;">Co-Founder &nbsp;·&nbsp; COP – Co-Ownership Property</p>
            <p style="margin:0 0 2px;font-size:12px;color:#555;">
              <a href="tel:+447901002763" style="color:#555;text-decoration:none;">+44 7901 002763</a>
            </p>
            <p style="margin:0 0 2px;font-size:12px;color:#555;">
              <a href="mailto:dylan@co-ownership-property.com" style="color:#555;text-decoration:none;">dylan@co-ownership-property.com</a>
            </p>
            <p style="margin:0;font-size:12px;">
              <a href="https://co-ownership-property.com" style="color:#C9A84C;text-decoration:none;">co-ownership-property.com</a>
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, message, propertySlug, propertyTitle, propertyUrl } = req.body;

  if (!email || !phone) return res.status(400).json({ error: 'Missing required fields' });

  // Rate limit: max 3 gallery enquiries per email per 10 minutes
  const { limited } = await checkRateLimit(email, 'gallery_enquiry', 10 * 60 * 1000, 3);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── Look up property region from DB ──────────────────────────────────────
  let resolvedRegion = null;
  let resolvedCity   = null;
  let resolvedSlug   = propertySlug || null;
  try {
    const db = getDb();
    let prop = null;
    if (propertySlug) {
      const { data } = await db.from('properties').select('slug, region, city').eq('slug', propertySlug).single();
      prop = data;
    }
    if (!prop && propertyTitle) {
      const { data } = await db.from('properties').select('slug, region, city').eq('title', propertyTitle).single();
      prop = data;
    }
    if (prop) {
      resolvedSlug   = prop.slug   || resolvedSlug;
      resolvedRegion = prop.region || null;
      resolvedCity   = prop.city   || null;
    }
  } catch (_) {}

  // ── CRM ───────────────────────────────────────────────────────────────────
  try {
    const contact = await upsertContact({
      email, firstName, lastName,
      phone: phone || null,
      source: 'gallery_enquiry',
    });

    if (contact) {
      await incrementScore(contact.id, 20);
      await createLead({
        contactId:     contact.id,
        propertySlug:  resolvedSlug   || null,
        propertyTitle: propertyTitle  || null,
        mainRegion:    resolvedRegion || null,
        subregion:     resolvedCity   || null,
      });
      await logActivity({
        contactId:   contact.id,
        type:        'gallery_enquiry',
        description: `Gallery enquiry submitted for ${propertyTitle || propertySlug}`,
        metadata:    { propertyTitle, propertyUrl, phone, message },
      });
    }
  } catch (e) {
    console.error('[CRM] gallery-enquiry write failed:', e.message);
  }

  // ── Team notification ─────────────────────────────────────────────────────
  try {
    await sendTeamNotification({
      subject: `Gallery Enquiry — ${name || email} — ${propertyTitle || propertySlug}`,
      html: `
        <h2 style="font-family:Georgia,serif;color:#1E3448;margin:0 0 24px">Gallery Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr>
            <td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase;width:120px">Property</td>
            <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448">
              ${propertyTitle || propertySlug}${propertyUrl ? ` — <a href="${propertyUrl}" style="color:#C9A84C">${propertyUrl}</a>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Name</td>
            <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448">${name || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Email</td>
            <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><a href="mailto:${email}" style="color:#C9A84C">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Phone</td>
            <td style="padding:10px 16px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><a href="tel:${phone}" style="color:#C9A84C">${phone}</a></td>
          </tr>
          ${message ? `
          <tr>
            <td style="padding:10px 16px;background:#F5F2EC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;letter-spacing:1px;text-transform:uppercase">Message</td>
            <td style="padding:10px 16px;background:#FAF8F5;font-family:Arial,sans-serif;font-size:14px;color:#1E3448;line-height:1.6">${message}</td>
          </tr>` : ''}
        </table>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#9AACBB;margin-top:24px">
          This enquiry came from the private gallery page — the lead has already seen the full photo pack and floor plans.
        </p>
      `,
    });
  } catch (e) {
    console.error('[Mail] gallery-enquiry team notification failed:', e.message);
  }

  // ── Auto-reply to lead ────────────────────────────────────────────────────
  try {
    await sendHtml({
      to:      email,
      subject: `Your enquiry — ${propertyTitle || propertySlug}`,
      html:    autoReplyHtml({ firstName, propertyTitle: propertyTitle || propertySlug, propertyUrl }),
      from:    DYLAN_FROM,
      replyTo: DYLAN_REPLY,
    });
  } catch (e) {
    console.error('[Mail] gallery-enquiry auto-reply failed:', e.message);
  }

  return res.status(200).json({ ok: true });
}
