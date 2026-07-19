/**
 * /api/properties.json
 *
 * Public JSON feed of all live co-ownership properties on COP, wrapped as a
 * Schema.org DataFeed for AI search engines. Lets ChatGPT / Claude /
 * Perplexity / Gemini ingest the entire inventory in one fetch instead of
 * scraping 300+ HTML property pages.
 *
 * Cached at the edge for 1 hour, stale-while-revalidate for 24h.
 * CORS-open so any AI agent can fetch.
 *
 * Linked from:  /llms.txt, /llms-full.txt, robots.txt, sitemap.xml
 */

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://co-ownership-property.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function countryToPillarSlug(country) {
  if (!country) return null;
  return country.toLowerCase().replace(/\s+/g, '-');
}

function truncate(str, max) {
  if (!str) return '';
  const clean = String(str).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

export default async function handler(req, res) {
  // CORS — open to AI agents and any third-party consumer
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('properties')
      .select('slug, title, description, country, region, city, beds, baths, size, price, currency, lat, lng, img, images, status, partner, date_added')
      .in('status', ['Live', 'for_sale'])
      .order('date_added', { ascending: false });

    if (error) {
      console.error('properties.json — Supabase error:', error);
      return res.status(500).json({ error: 'Inventory feed unavailable' });
    }

    const generated = new Date().toISOString();
    const items = (data || []).map(p => {
      const url = `${SITE_URL}/property/${p.slug}/`;
      const pillarSlug = countryToPillarSlug(p.country);
      const pillarUrl = pillarSlug ? `${SITE_URL}/${pillarSlug}-fractional-ownership-properties/` : null;
      const description = truncate(p.description, 320);
      const firstImages = Array.isArray(p.images) ? p.images.slice(0, 3) : (p.img ? [p.img] : []);

      return {
        '@type': 'RealEstateListing',
        '@id': url + '#listing',
        url,
        identifier: p.slug,
        name: p.title,
        description,
        image: firstImages,
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.city || p.region || null,
          addressRegion: p.region || null,
          addressCountry: p.country || null,
        },
        ...(typeof p.lat === 'number' && typeof p.lng === 'number' ? {
          geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
        } : {}),
        ...(p.beds ? { numberOfBedrooms: p.beds, numberOfRooms: p.beds } : {}),
        ...(p.baths ? { numberOfBathroomsTotal: p.baths } : {}),
        ...(p.size > 0 ? {
          floorSize: { '@type': 'QuantitativeValue', value: p.size, unitCode: 'MTK' },
        } : {}),
        accommodationCategory: 'Fractional ownership — 1/8 deeded share',
        ...(p.price ? {
          offers: {
            '@type': 'Offer',
            url,
            price: p.price,
            priceCurrency: p.currency || 'EUR',
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${SITE_URL}/#organization` },
          },
        } : {}),
        ...(pillarUrl ? {
          mentions: [{
            '@type': 'Place',
            name: p.country,
            url: pillarUrl,
          }],
        } : {}),
        datePosted: p.date_added || null,
      };
    });

    const feed = {
      '@context': 'https://schema.org',
      '@type': 'DataFeed',
      '@id': `${SITE_URL}/api/properties.json`,
      url: `${SITE_URL}/api/properties.json`,
      name: 'Co-Ownership Property — full property inventory',
      description: 'Complete public feed of all live fractional co-ownership listings on co-ownership-property.com — 350+ properties across Europe, the USA, and Mexico. Updated continuously; cached at the edge for 1 hour.',
      provider: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Co-Ownership Property',
        url: SITE_URL,
      },
      license: 'https://co-ownership-property.com/terms-and-conditions/',
      dateModified: generated,
      totalItems: items.length,
      dataFeedElement: items,
    };

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400, s-maxage=3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(feed);
  } catch (err) {
    console.error('properties.json — fatal:', err);
    return res.status(500).json({ error: 'Inventory feed unavailable' });
  }
}
