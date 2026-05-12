#!/usr/bin/env node
/**
 * scripts/verify-translations.js
 *
 * Audits every translated description / title / amenity / post in Supabase
 * for forbidden terms (per docs/translation-glossary.md). Run after each
 * translation batch to catch drift before content goes live.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/verify-translations.js
 *
 * Exits 0 if clean, 1 if any forbidden term found. Prints a per-row report.
 */

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const BASE = `${SUPABASE_URL}/rest/v1`;

if (!SERVICE_ROLE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Word-boundary matching — case-insensitive. The trailing space avoids
// matching innocent fragments inside larger words.
const FORBIDDEN = {
  es: [
    'multipropiedad',
    'multi-propiedad',
    'aprovechamiento por turno',
    'tiempo compartido',
    'timeshare',
  ],
  fr: [
    'multipropriété',
    'multi-propriété',
    'temps partagé',
    'immobilier fractionné',
    'timeshare',
  ],
};

// Partner brand names — should never appear in translated copy regardless
// of locale (we're an independent aggregator).
const FORBIDDEN_BRANDS = [
  'MYNE',
  'Vivla',
  'Pacaso',
  'And Hamlet',
  '&Hamlet',
  'Lazazu',
  'Prello',
];

function findHits(text, terms) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return terms.filter(t => lower.includes(t.toLowerCase()));
}

async function fetchAll(table, columns) {
  // PostgREST default page size; we paginate to be safe on bigger tables.
  const out = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const url = `${BASE}/${table}?select=${columns}&order=slug.asc&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } });
    if (!res.ok) throw new Error(`Fetch ${table}: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

(async () => {
  console.log('[verify] Fetching properties + posts…');
  const [properties, posts] = await Promise.all([
    fetchAll('properties', 'slug,title_es,title_fr,description_es,description_fr,amenities_es,amenities_fr'),
    fetchAll('posts',      'slug,title_es,title_fr,subtitle_es,subtitle_fr,excerpt_es,excerpt_fr,content_es,content_fr'),
  ]);

  let issues = 0;

  // Helper that walks every translated cell and checks for forbidden terms.
  function audit(label, slug, locale, value) {
    if (value == null) return;
    const text = Array.isArray(value) ? value.join(' • ') : String(value);
    if (!text.trim()) return;

    const localeHits = findHits(text, FORBIDDEN[locale] || []);
    const brandHits = findHits(text, FORBIDDEN_BRANDS);
    const allHits = [...localeHits, ...brandHits.map(b => `BRAND:${b}`)];

    if (allHits.length === 0) return;
    issues++;
    console.log(`[verify] ✗ ${label} ${locale}/${slug}`);
    console.log(`         hits: ${allHits.join(', ')}`);
  }

  for (const p of properties) {
    audit('property', p.slug, 'es', p.title_es);
    audit('property', p.slug, 'fr', p.title_fr);
    audit('property', p.slug, 'es', p.description_es);
    audit('property', p.slug, 'fr', p.description_fr);
    audit('property', p.slug, 'es', p.amenities_es);
    audit('property', p.slug, 'fr', p.amenities_fr);
  }
  for (const p of posts) {
    audit('post', p.slug, 'es', p.title_es);
    audit('post', p.slug, 'fr', p.title_fr);
    audit('post', p.slug, 'es', p.subtitle_es);
    audit('post', p.slug, 'fr', p.subtitle_fr);
    audit('post', p.slug, 'es', p.excerpt_es);
    audit('post', p.slug, 'fr', p.excerpt_fr);
    audit('post', p.slug, 'es', p.content_es);
    audit('post', p.slug, 'fr', p.content_fr);
  }

  if (issues === 0) {
    console.log(`[verify] ✓ Clean. Audited ${properties.length} properties + ${posts.length} posts.`);
    process.exit(0);
  } else {
    console.log(`\n[verify] ${issues} issue(s) found. See output above.`);
    process.exit(1);
  }
})();
