/**
 * Cron: GET /api/send-property-alerts  (vercel.json — daily, 07:30 UTC)
 * Finds properties added in the last ~25 hours, matches them against
 * saved_searches, and emails subscribers.
 *
 * History (David, 6 Sep 2026): this endpoint was never in vercel.json, only
 * accepted POST + Bearer, matched regions against country/city only (so a
 * "Mallorca" alert could never match anything), and would have queued the
 * email as 'pending' with no send_after — which the queue processor never
 * sends. 18 saved searches, last_notified_at null on every one. Now: runs as
 * a Vercel cron, matches the way the confirmation email does (expandRegions
 * against country / region / city), and sends immediately — an alert is an
 * explicit subscription ("we'll notify you"), so it does not wait for review.
 *
 * Auth: Vercel cron GET (x-vercel-cron) or Bearer CRON_SECRET / CRM_SECRET.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { queueEmail } from '@/lib/resend';
import { unsubUrl } from '@/lib/unsub';
import { filterSuppressed } from '@/lib/suppressions';
import { expandRegions } from '@/lib/regionMap';
import PropertyAlert from '@/emails/property-alert';
import * as React from 'react';

function getDb() {
  return createSupabaseAdminClient();
}

const norm = (v) => String(v == null ? '' : v).trim().toLowerCase();

/** Does a property fall inside a saved search's regions? Same expansion the
 *  confirmation email uses, so what we promised is what we match. */
function regionMatches(p, regions) {
  const active = (regions || []).filter((r) => r && r !== 'All');
  if (!active.length) return true;
  const terms = expandRegions(active).map(norm).filter(Boolean);
  const hay = [norm(p.country), norm(p.region), norm(p.city)];
  return terms.some((t) => hay.some((h) => h && h.includes(t)));
}

export default async function handler(req, res) {
  const isCron   = req.method === 'GET' || req.headers['x-vercel-cron'] === '1';
  const auth     = req.headers['authorization'] || '';
  const isAuthed = (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
                || (process.env.CRM_SECRET  && auth === `Bearer ${process.env.CRM_SECRET}`);
  if (!isCron && !isAuthed) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const db = getDb();

  // 1. Find properties added in the last 25 hours (slightly wider window for cron drift)
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data: newProps } = await db
    .from('properties')
    .select('slug, title, img, price, currency, beds, size, country, region, city, status')
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

  // Never mail a suppressed address, whatever they saved.
  let allowed = new Set();
  try {
    const { kept } = await filterSuppressed(db, searches);
    allowed = new Set((kept || []).map((s) => norm(s.email)));
  } catch (e) {
    console.error('[PropertyAlerts] suppression check failed:', e.message);
    allowed = new Set(searches.map((s) => norm(s.email)));
  }

  let sent = 0;

  for (const search of searches) {
    if (!allowed.has(norm(search.email))) continue;
    // Match new properties against this search's criteria
    const matches = newProps.filter(p => {
      const regionMatch = regionMatches(p, search.regions);
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
          // Tokenised — the plain `?email=` form dead-ends. See lib/unsub.js.
          unsubscribeUrl: unsubUrl(search.email),
        }),
        templateName:  'property-alert',
        templateProps: { searchCriteria, matchCount: matches.length, recommended: matches.map((p) => ({ slug: p.slug, title: p.title, price: p.price })) },
        trigger:       'new_property_match',
        // An explicit alert subscription: send now, record as sent.
        autoSend:      true,
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
