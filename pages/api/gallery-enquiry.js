import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, logActivity, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendTeamNotification } from '@/lib/resend';

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
      // Gallery enquiry is high-intent — +20 points
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

  return res.status(200).json({ ok: true });
}
