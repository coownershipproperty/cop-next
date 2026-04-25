import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

/** Fetch up to 3 similar properties (same country, different slug, available) */
async function getSimilarProperties(propertySlug, propertyCountry) {
  if (!propertyCountry) return [];
  const db = getDb();
  const { data } = await db
    .from('properties')
    .select('slug, title, img, price, currency, beds, size, city')
    .eq('country', propertyCountry)
    .neq('slug', propertySlug || '')
    .in('status', ['available', 'new'])
    .limit(3);
  return data || [];
}

/** Render a single property card for the email */
function propertyCard(p) {
  const sym = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || p.currency || '€';
  const price = p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : '';
  const location = p.city || '';
  const meta = [p.beds ? `${p.beds} bed` : '', p.size ? `${p.size} m²` : '']
    .filter(Boolean).join(' · ');
  const url = `https://co-ownership-property.com/property/${p.slug}/`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <tr>
        ${p.img ? `<td width="110" style="padding:0;vertical-align:top;">
          <a href="${url}" style="display:block;"><img src="${p.img}" width="110" height="80" alt="${p.title}" style="display:block;object-fit:cover;width:110px;height:80px;" /></a>
        </td>` : ''}
        <td style="padding:12px 14px;vertical-align:top;">
          <a href="${url}" style="font-family:Georgia,serif;font-size:14px;font-weight:600;color:#143047;text-decoration:none;line-height:1.3;">${p.title}</a>
          ${location ? `<p style="margin:3px 0 0;font-family:sans-serif;font-size:11px;color:#C9A84C;letter-spacing:0.08em;text-transform:uppercase;">${location}</p>` : ''}
          ${meta ? `<p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:#6b7d8d;">${meta}</p>` : ''}
          ${price ? `<p style="margin:6px 0 0;font-family:sans-serif;font-size:13px;font-weight:700;color:#143047;">${price}</p>` : ''}
        </td>
        <td style="padding:12px 14px;vertical-align:middle;white-space:nowrap;">
          <a href="${url}" style="display:inline-block;padding:7px 14px;background:#143047;color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:600;text-decoration:none;border-radius:3px;">View →</a>
        </td>
      </tr>
    </table>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, propertyTitle, driveUrl, propertyUrl, propertyCountry } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

  // Rate limit: max 5 unlock requests per email per 5 minutes
  const { limited } = await checkRateLimit(email, 'unlock', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const smtpUser = process.env.SMTP_USER || 'a373bb001@smtp-brevo.com';
  const fromEmail = process.env.SMTP_FROM || 'info@domosno.com';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: process.env.SMTP_PASS },
  });

  // Extract slug from propertyUrl
  const propertySlug = propertyUrl
    ? propertyUrl.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null
    : null;

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── CRM ────────────────────────────────────────────────────────────────────
  let contact   = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, source: 'floor_plan' });

    if (contact) {
      // +10 points for requesting floor plans (high-intent action)
      await incrementScore(contact.id, 10);

      await createLead({
        contactId:     contact.id,
        propertySlug:  propertySlug || null,
        propertyTitle: propertyTitle || null,
      });

      emailSend = await createEmailSend({
        contactId:     contact.id,
        type:          'floor_plan',
        subject:       `Floor Plans & More Photos — ${propertyTitle}`,
        toEmail:       email,
        propertyTitle: propertyTitle || null,
        propertyUrl:   propertyUrl   || null,
      });

      await logActivity({
        contactId: contact.id,
        type:      'floor_plan_requested',
        description: `Floor plan requested for ${propertyTitle}`,
        metadata: { propertyTitle, propertyUrl },
      });
    }
  } catch (e) {
    console.error('[CRM] unlock-drive write failed:', e.message);
  }

  // ── Fetch similar properties for email ────────────────────────────────────
  const similar = await getSimilarProperties(propertySlug, propertyCountry);

  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';
    const similarHtml = similar.length > 0
      ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
          <tr><td style="padding-bottom:12px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#143047;">You might also like</p>
            <p style="margin:4px 0 0;font-family:sans-serif;font-size:13px;color:#6b7d8d;">Similar properties in the same destination</p>
          </td></tr>
          <tr><td>${similar.map(propertyCard).join('')}</td></tr>
          <tr><td style="padding-top:8px;">
            <a href="https://co-ownership-property.com/our-homes/" style="font-family:sans-serif;font-size:13px;color:#C9A84C;text-decoration:none;font-weight:600;">Browse all properties →</a>
          </td></tr>
        </table>`
      : '';

    // Email to visitor
    await transporter.sendMail({
      from:    `"Co-Ownership Property" <${fromEmail}>`,
      to:      email,
      subject: `Floor Plans & More Photos — ${propertyTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#143047;">
          <p style="font-size:15px;">Hi ${name || 'there'},</p>
          <p style="font-size:15px;">Thanks for your interest in <strong>${propertyTitle}</strong>.</p>
          <p style="font-size:15px;">Here are the additional photos and floor plans you requested:</p>

          <p style="margin:24px 0;">
            <a href="${driveUrl}" style="display:inline-block;background:#C9A84C;color:#ffffff;padding:13px 28px;text-decoration:none;font-size:15px;font-weight:600;border-radius:3px;font-family:sans-serif;">
              View Full Gallery &amp; Floor Plans →
            </a>
          </p>

          <p style="font-size:14px;color:#6b7d8d;">
            Have questions or want to learn more? Simply reply to this email or
            <a href="https://co-ownership-property.com/contact/" style="color:#143047;">speak to one of our experts</a> —
            we typically respond within a few hours.
          </p>

          ${similarHtml}

          <p style="margin-top:32px;font-size:14px;">Best,<br>The Co-Ownership Property Team</p>
          ${pixel}
        </div>
      `,
      replyTo: fromEmail,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId: contact.id,
        type:      'email_sent',
        description: `Floor plan email sent to ${email}`,
        metadata:  { email_send_id: emailSend.id },
      });
    }

    // Team notification
    await transporter.sendMail({
      from:    `"COP Website" <${fromEmail}>`,
      to:      ['dylan@domosno.com', 'info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
      subject: `Floor Plan Request — ${name || email}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}${propertyUrl ? ` — <a href="${propertyUrl}">${propertyUrl}</a>` : ''}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Drive link sent: <a href="${driveUrl}">${driveUrl}</a></p>
      `,
      replyTo: email,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
