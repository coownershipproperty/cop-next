/**
 * Cron: POST /api/send-property-alerts
 * Runs daily. Finds properties added in the last 24 hours,
 * matches them against saved_searches, and emails subscribers.
 *
 * Authorization: Bearer <CRON_SECRET>
 */
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

function propertyCardHtml(p) {
  const sym = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || '€';
  const price = p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : '';
  const meta  = [p.beds ? `${p.beds} bed` : '', p.size ? `${p.size} m²` : '']
    .filter(Boolean).join(' · ');
  const url   = `https://co-ownership-property.com/property/${p.slug}/`;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <tr>
        ${p.img ? `<td width="120" style="padding:0;vertical-align:top;"><a href="${url}"><img src="${p.img}" width="120" height="85" alt="${p.title}" style="display:block;width:120px;height:85px;object-fit:cover;" /></a></td>` : ''}
        <td style="padding:12px 16px;vertical-align:top;">
          <a href="${url}" style="font-family:Georgia,serif;font-size:15px;font-weight:600;color:#143047;text-decoration:none;">${p.title}</a>
          ${p.city ? `<p style="margin:3px 0 0;font-family:sans-serif;font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:0.08em;">${p.city}, ${p.country}</p>` : ''}
          ${meta  ? `<p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:#6b7d8d;">${meta}</p>` : ''}
          ${price ? `<p style="margin:6px 0 0;font-family:sans-serif;font-size:14px;font-weight:700;color:#143047;">${price}</p>` : ''}
        </td>
        <td style="padding:12px 16px;vertical-align:middle;white-space:nowrap;">
          <a href="${url}" style="display:inline-block;padding:8px 16px;background:#C9A84C;color:#fff;font-family:sans-serif;font-size:12px;font-weight:700;text-decoration:none;border-radius:3px;">View →</a>
        </td>
      </tr>
    </table>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const db = getDb();

  // 1. Find properties added in the last 25 hours (slightly wider window for cron drift)
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data: newProps } = await db
    .from('properties')
    .select('slug, title, img, price, currency, beds, size, country, city')
    .gte('date_added', since)
    .in('status', ['available', 'new']);

  if (!newProps || newProps.length === 0) {
    return res.status(200).json({ ok: true, message: 'No new properties', sent: 0 });
  }

  // 2. Get all active saved searches
  const { data: searches } = await db
    .from('saved_searches')
    .select('*')
    .eq('active', true);

  if (!searches || searches.length === 0) {
    return res.status(200).json({ ok: true, message: 'No saved searches', sent: 0 });
  }

  const fromEmail   = process.env.SMTP_FROM || 'info@domosno.com';
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port:   587,
    secure: false,
    auth:   { user: process.env.SMTP_USER || 'a373bb001@smtp-brevo.com', pass: process.env.SMTP_PASS },
  });

  let sent = 0;

  for (const search of searches) {
    // Match new properties against this search's criteria
    const matches = newProps.filter(p => {
      const regionMatch = !search.regions || search.regions.length === 0
        || search.regions.some(r => p.country === r || (p.city || '').includes(r));
      const priceMatch  = !search.max_price || !p.price || p.price <= search.max_price;
      const bedsMatch   = !search.min_beds  || !p.beds  || p.beds  >= search.min_beds;
      return regionMatch && priceMatch && bedsMatch;
    });

    if (matches.length === 0) continue;

    try {
      const greeting = search.name ? `Hi ${search.name.split(' ')[0]},` : 'Hi there,';
      const plural   = matches.length === 1 ? 'a new property' : `${matches.length} new properties`;

      await transporter.sendMail({
        from:    `"Co-Ownership Property" <${fromEmail}>`,
        to:      search.email,
        subject: `🏡 New: ${matches.length === 1 ? matches[0].title : `${matches.length} new properties matching your alert`}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#143047;">
            <p style="font-size:15px;">${greeting}</p>
            <p style="font-size:15px;">We just listed ${plural} that match your saved search.</p>
            <div style="margin:24px 0;">
              ${matches.map(propertyCardHtml).join('')}
            </div>
            <p style="font-size:14px;">
              <a href="https://co-ownership-property.com/our-homes/" style="color:#C9A84C;font-weight:600;text-decoration:none;">Browse all properties →</a>
            </p>
            <p style="margin-top:32px;font-size:14px;">Best,<br>The Co-Ownership Property Team</p>
            <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
              You're receiving this because you set up a property alert on co-ownership-property.com.
              To unsubscribe, reply with "unsubscribe".
            </p>
          </div>
        `,
        replyTo: fromEmail,
      });

      // Update last_notified_at
      await db.from('saved_searches')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', search.id);

      sent++;
    } catch (e) {
      console.error('[PropertyAlerts] email failed for', search.email, e.message);
    }
  }

  return res.status(200).json({ ok: true, newProperties: newProps.length, alertsSent: sent });
}
