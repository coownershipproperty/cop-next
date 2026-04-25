/**
 * POST /api/save-search
 * Saves a visitor's search criteria so they can receive alerts when matching
 * properties are added.
 *
 * Body: { email, name?, regions[], maxPrice?, minBeds? }
 */
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { upsertContact, logActivity } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, regions, maxPrice, minBeds } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  if (!regions || regions.length === 0) return res.status(400).json({ error: 'Select at least one region' });

  const { limited } = await checkRateLimit(email, 'save-search', 10 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = getDb();

  // Save the search
  const { data: saved, error } = await db
    .from('saved_searches')
    .upsert(
      {
        email:     email.toLowerCase().trim(),
        name:      name   || null,
        regions:   regions,
        max_price: maxPrice ? parseInt(maxPrice, 10) : null,
        min_beds:  minBeds  ? parseInt(minBeds,  10) : null,
        active:    true,
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    console.error('[SaveSearch] DB error:', error.message);
    return res.status(500).json({ error: 'Could not save search' });
  }

  // CRM: upsert contact + log activity
  try {
    const nameParts = (name || '').trim().split(' ');
    const contact = await upsertContact({
      email,
      firstName: nameParts[0] || null,
      lastName:  nameParts.slice(1).join(' ') || null,
      source:    'saved_search',
    });
    if (contact) {
      await logActivity({
        contactId:   contact.id,
        type:        'search_saved',
        description: `Saved search: ${regions.join(', ')}${maxPrice ? `, max €${parseInt(maxPrice).toLocaleString()}` : ''}`,
        metadata:    { regions, maxPrice, minBeds },
      });
    }
  } catch (e) {
    console.error('[CRM] save-search write failed:', e.message);
  }

  // Send confirmation email
  try {
    const fromEmail = process.env.SMTP_FROM || 'info@domosno.com';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER || 'a373bb001@smtp-brevo.com', pass: process.env.SMTP_PASS },
    });

    const regionList = regions.join(', ');
    const criteria = [
      `Destinations: <strong>${regionList}</strong>`,
      maxPrice ? `Max budget: <strong>€${parseInt(maxPrice).toLocaleString()}</strong>` : '',
      minBeds  ? `Min bedrooms: <strong>${minBeds}</strong>` : '',
    ].filter(Boolean).join('<br>');

    await transporter.sendMail({
      from:    `"Co-Ownership Property" <${fromEmail}>`,
      to:      email,
      subject: `Property alert set — we'll notify you of new listings`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#143047;">
          <p style="font-size:15px;">Hi ${name || 'there'},</p>
          <p style="font-size:15px;">Your property alert is active. We'll email you as soon as a new property matching your criteria is listed.</p>
          <div style="background:#f8f9fa;border-radius:6px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#C9A84C;">Your search</p>
            <p style="margin:0;font-size:14px;line-height:1.8;">${criteria}</p>
          </div>
          <p style="font-size:14px;color:#6b7d8d;">In the meantime, browse everything that's available now:</p>
          <p style="margin:20px 0;">
            <a href="https://co-ownership-property.com/our-homes/" style="display:inline-block;background:#143047;color:#ffffff;padding:12px 24px;text-decoration:none;font-size:14px;font-weight:600;border-radius:3px;">Browse Properties →</a>
          </p>
          <p style="font-size:13px;color:#9ca3af;">You can unsubscribe from these alerts at any time by replying to this email.</p>
          <p style="font-size:14px;">Best,<br>The Co-Ownership Property Team</p>
        </div>
      `,
      replyTo: fromEmail,
    });
  } catch (e) {
    console.error('[Mail] save-search confirmation failed:', e.message);
  }

  return res.status(200).json({ ok: true });
}
