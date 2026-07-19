/**
 * Cron: POST /api/send-property-alerts
 * Runs daily. Finds properties added in the last 24 hours,
 * matches them against saved_searches, and emails subscribers.
 *
 * Authorization: Bearer <CRON_SECRET>
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { queueEmail } from '@/lib/resend';
import PropertyAlert from '@/emails/property-alert';
import * as React from 'react';

function getDb() {
  return createSupabaseAdminClient();
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
    .select('slug, title, img, price, currency, beds, size, country, city, status')
    .gte('date_added', since)
    // 'available'/'new' never existed in the DB (statuses are Live/for_sale/
    // sold/hidden) — alerts silently matched nothing until this was fixed.
    .in('status', ['Live', 'for_sale']);

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
      const firstName = search.name ? search.name.split(' ')[0] : undefined;

      // Map matched properties to PropertyAlert shape
      const alertProperties = matches.map(p => {
        const sym   = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || '€';
        const price = p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : '';
        return {
          title:    p.title,
          price,
          beds:     p.beds  || 0,
          size:     p.size  || 0,
          location: [p.city, p.country].filter(Boolean).join(', '),
          slug:     p.slug,
          imageUrl: p.img || undefined,
          isNew:    p.status === 'new',
        };
      });

      // Build a human-readable criteria string
      const criteriaParts = [];
      if (search.regions?.length) criteriaParts.push(search.regions.join(', '));
      if (search.min_beds) criteriaParts.push(`${search.min_beds}+ bed`);
      if (search.max_price) {
        criteriaParts.push(`up to €${search.max_price.toLocaleString('en-GB')}`);
      }
      const searchCriteria = criteriaParts.join(' · ') || 'All properties';

      const subject = matches.length === 1
        ? `New: ${matches[0].title}`
        : `${matches.length} new properties matching your alert`;

      await queueEmail({
        to:            search.email,
        toName:        search.name || null,
        subject,
        template:      React.createElement(PropertyAlert, {
          firstName,
          searchCriteria,
          matchCount:    matches.length,
          properties:    alertProperties,
          editAlertUrl:  `https://co-ownership-property.com/our-homes/`,
          unsubscribeUrl: `https://co-ownership-property.com/unsubscribe/?email=${encodeURIComponent(search.email)}`,
        }),
        templateName:  'property-alert',
        templateProps: { searchCriteria, matchCount: matches.length },
        trigger:       'new_property_match',
        notes:         `${matches.length} new propert${matches.length === 1 ? 'y' : 'ies'} matching saved search`,
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
