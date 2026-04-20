/**
 * /api/meta-catalogue
 *
 * Facebook / Meta product catalogue feed.
 * Returns a tab-separated CSV that Meta fetches hourly to keep the
 * "COP Property Catalogue" up-to-date with current property URLs and images.
 *
 * Feed format: https://www.facebook.com/business/help/120325381656392
 *
 * Required fields:  id, title, description, availability, condition,
 *                   price, link, image_link, brand
 */

import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://co-ownership-property.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Escape a value for TSV (replace tabs + newlines) */
function tsv(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
}

/** Build a human-readable description from property fields */
function buildDescription(p) {
  const parts = [];
  if (p.beds) parts.push(`${p.beds}-bedroom`);
  if (p.city && p.country) {
    parts.push(`property in ${p.city}, ${p.country}`);
  } else if (p.country) {
    parts.push(`property in ${p.country}`);
  } else {
    parts.push('luxury co-ownership property');
  }
  parts.push('available for fractional co-ownership.');
  if (p.price && p.currency) {
    const sym = { EUR: '€', GBP: '£', USD: '$' }[p.currency] || p.currency;
    parts.push(`From ${sym}${Number(p.price).toLocaleString('en-GB')}.`);
  }
  parts.push('Real deeded ownership — own only what you use.');
  return parts.join(' ');
}

/** Format price for Meta: "500000.00 EUR" */
function formatPrice(price, currency) {
  if (!price) return '0.00 EUR';
  const cur = currency || 'EUR';
  return `${Number(price).toFixed(2)} ${cur}`;
}

export default async function handler(req, res) {
  // Allow Meta's fetcher (and CDN caching for 55 mins so hourly refreshes work)
  res.setHeader('Cache-Control', 'public, max-age=3300, s-maxage=3300');
  res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');

  try {
    const supabase = getSupabase();
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, slug, title, img, images, price, currency, country, region, city, beds, size, status')
      .order('date_added', { ascending: false });

    if (error) throw error;

    const active = (properties || []).filter(p => p.status !== 'sold' && p.slug && p.title);

    // TSV header
    const headers = [
      'id', 'title', 'description', 'availability', 'condition',
      'price', 'link', 'image_link', 'additional_image_link',
      'brand', 'google_product_category',
    ];

    const rows = [headers.join('\t')];

    for (const p of active) {
      const url = `${BASE_URL}/property/${p.slug}/`;

      // Pick best image: first from images array, else img field
      const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
      const primaryImg = imgs[0] || p.img || '';
      const additionalImgs = imgs.slice(1, 4).join(','); // up to 3 extra

      const row = [
        p.id,                                   // id  — matches pixel content_ids
        p.title,                                // title
        buildDescription(p),                    // description
        'in stock',                             // availability
        'new',                                  // condition
        formatPrice(p.price, p.currency),       // price
        url,                                    // link
        primaryImg,                             // image_link
        additionalImgs,                         // additional_image_link
        'Co-Ownership Property',                // brand
        'Real Estate',                          // google_product_category
      ].map(tsv);

      rows.push(row.join('\t'));
    }

    res.status(200).send(rows.join('\n'));
  } catch (err) {
    console.error('meta-catalogue error:', err);
    res.status(500).json({ error: 'Failed to generate catalogue feed' });
  }
}
