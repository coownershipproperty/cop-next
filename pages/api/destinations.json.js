/**
 * /api/destinations.json
 *
 * Public JSON feed of all destination pillar + region pages on COP, wrapped
 * as a Schema.org DataFeed. Lets AI engines map the editorial geography of
 * the site (countries, regions, cities) and the canonical URL for each
 * destination guide without having to crawl every page.
 *
 * For each EN destination file (content/destinations/*.html), emits:
 *   slug, url, locale variants (de/es/fr), property count for the country,
 *   first 240 chars of body for context, and a tier flag (pillar vs region).
 *
 * Cached at the edge for 1 hour. CORS-open.
 *
 * Linked from:  /llms.txt, /llms-full.txt, robots.txt, sitemap.xml
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://co-ownership-property.com';

// Pillar slugs — country-level guides that anchor the destination tree.
// Anything not in this set is treated as a region/city sub-page.
const PILLAR_SLUGS = new Set([
  'spain', 'france', 'italy', 'portugal', 'usa', 'mexico', 'germany',
  'austria', 'croatia', 'sweden', 'england',
].map(s => `${s}-fractional-ownership-properties`));

const LOCALE_PATHS = {
  de: 'destinationen',
  es: 'destinos',
  fr: 'destinations',
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function stripTags(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  // Try H1 first (destination renderer pattern)
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  return null;
}

function firstParagraphSnippet(html, maxChars) {
  // Find first substantive <p> after any hero/eyebrow chrome
  const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const m of ps) {
    const text = stripTags(m[1]);
    if (text.length > 60) {
      if (text.length <= maxChars) return text;
      return text.slice(0, maxChars - 1).replace(/\s+\S*$/, '') + '…';
    }
  }
  return null;
}

function inferCountry(slug) {
  // Slug pattern: <region>-fractional-ownership[-properties].html
  // Pillar prefix → canonical country (must match Supabase country values).
  const PILLAR_TO_COUNTRY = {
    spain: 'Spain', france: 'France', italy: 'Italy', portugal: 'Portugal',
    usa: 'USA', mexico: 'Mexico', germany: 'Germany', austria: 'Austria',
    croatia: 'Croatia', sweden: 'Sweden', england: 'England',
  };
  // Region/city → country mapping (regions where the page is a sub-pillar).
  // Keys are the slug prefix BEFORE the -fractional-ownership... suffix.
  const REGION_TO_COUNTRY = {
    mallorca: 'Spain', ibiza: 'Spain', menorca: 'Spain', balearics: 'Spain',
    marbella: 'Spain', 'costa-del-sol': 'Spain', 'costa-blanca': 'Spain',
    'costa-de-la-luz': 'Spain', 'canary-islands': 'Spain', 'spanish-costas': 'Spain',
    madrid: 'Spain', barcelona: 'Spain', 'pyrenees-mountains': 'Spain',
    'french-alps': 'France', 'south-of-france': 'France', paris: 'France',
    'italian-lakes': 'Italy', 'lake-como': 'Italy', sardinia: 'Italy', liguria: 'Italy',
    cotswolds: 'England', london: 'England',
    california: 'USA', florida: 'USA', colorado: 'USA',
    'lake-tahoe': 'USA', aspen: 'USA', vail: 'USA', breckenridge: 'USA',
    'park-city': 'USA', miami: 'USA', 'newport-beach': 'USA',
    'malibu-santa-barbara': 'USA', 'napa-sonoma': 'USA',
    brickell: 'USA', 'florida-keys': 'USA', 'palm-springs': 'USA', '30a': 'USA',
    arizona: 'USA', nevada: 'USA', wyoming: 'USA', utah: 'USA', 'south-carolina': 'USA',
  };
  // Strip the suffix to get the base. Cover the various tail patterns used
  // across the corpus (some pages have descriptive suffixes beyond the
  // standard -fractional-ownership-properties).
  const base = slug
    .replace(/-fractional-ownership-properties$/, '')
    .replace(/-fractional-ownership-emerald-coast-co-ownership-beach-homes$/, '')
    .replace(/-fractional-ownership-wine-country-estates$/, '')
    .replace(/-fractional-ownership-desert-modern-luxury$/, '')
    .replace(/-fractional-ownership-for-sale$/, '')
    .replace(/-fractional-ownership-miami$/, '')
    .replace(/-fractional-ownership-2$/, '')
    .replace(/-fractional-ownership$/, '');
  // Pillar match
  if (PILLAR_TO_COUNTRY[base]) return PILLAR_TO_COUNTRY[base];
  // Region match
  return REGION_TO_COUNTRY[base] || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const enDir = path.join(process.cwd(), 'content', 'destinations');
    const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.html'));

    // Per-country property counts (for context)
    let countByCountry = {};
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('properties')
        .select('country')
        .in('status', ['Live', 'for_sale']);
      (data || []).forEach(p => {
        if (p.country) countByCountry[p.country] = (countByCountry[p.country] || 0) + 1;
      });
    } catch (_) { /* fall through with empty counts */ }

    const items = enFiles.map(file => {
      const slug = file.replace(/\.html$/, '');
      const html = fs.readFileSync(path.join(enDir, file), 'utf8');
      const title = extractTitle(html) || slug;
      const summary = firstParagraphSnippet(html, 240);
      const country = inferCountry(slug);
      const isPillar = PILLAR_SLUGS.has(slug);

      // Locale variants — only emit URLs whose source file exists
      const localeUrls = {};
      ['de', 'es', 'fr'].forEach(loc => {
        const localePath = path.join(enDir, loc, file);
        if (fs.existsSync(localePath)) {
          localeUrls[loc] = `${SITE_URL}/${loc}/${LOCALE_PATHS[loc]}/${slug}/`;
        }
      });

      return {
        '@type': isPillar ? 'WebPage' : 'WebPage',
        '@id': `${SITE_URL}/${slug}/#webpage`,
        url: `${SITE_URL}/${slug}/`,
        identifier: slug,
        name: title,
        ...(summary ? { description: summary } : {}),
        ...(country ? {
          about: {
            '@type': 'Place',
            name: country,
            ...(isPillar ? {} : { containedInPlace: country }),
          },
          ...(countByCountry[country] ? { numberOfItems: countByCountry[country] } : {}),
        } : {}),
        tier: isPillar ? 'pillar' : 'region',
        ...(Object.keys(localeUrls).length > 0 ? { workTranslation: localeUrls } : {}),
        inLanguage: 'en',
      };
    });

    // Order: pillars first (by country count desc), then regions (alphabetical by slug)
    items.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'pillar' ? -1 : 1;
      if (a.tier === 'pillar') {
        const aCount = a.numberOfItems || 0;
        const bCount = b.numberOfItems || 0;
        return bCount - aCount;
      }
      return a.identifier.localeCompare(b.identifier);
    });

    const feed = {
      '@context': 'https://schema.org',
      '@type': 'DataFeed',
      '@id': `${SITE_URL}/api/destinations.json`,
      url: `${SITE_URL}/api/destinations.json`,
      name: 'Co-Ownership Property — destination guides index',
      description: 'Index of all destination buyer\'s guides on co-ownership-property.com. ~50 pages spanning 11 countries, with pillar guides (country-level) and region/city sub-pages. Each entry has its URL, summary, country, available locale variants (de/es/fr), and the live count of properties in that country.',
      provider: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Co-Ownership Property',
        url: SITE_URL,
      },
      license: 'https://co-ownership-property.com/terms-and-conditions/',
      dateModified: new Date().toISOString(),
      totalItems: items.length,
      dataFeedElement: items,
    };

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400, s-maxage=3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(feed);
  } catch (err) {
    console.error('destinations.json — fatal:', err);
    return res.status(500).json({ error: 'Destinations feed unavailable' });
  }
}
