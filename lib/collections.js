// lib/collections.js
//
// Multi-home collections (first partner: 21-5, from Sep 2026).
//
// House rules for everything that renders a collection — site, emails, copy:
//   • Never say how many owners share a collection ("21", "21 families",
//     "1/21"). It names the partner. The pitch is the homes: five homes,
//     around twelve weeks a year, one price.
//   • Never name the operator on the site.
//   • New-share collections are the product we push; resale collections
//     (share_type = 'resale') pay us far less and are never featured.
//
// Preview: rows with status 'preview' are only visible when the build runs
// with NEXT_PUBLIC_COLLECTIONS_PREVIEW=1 (local only). On Vercel the flag is
// unset, so only status 'Live' collections exist, and while there are none
// the Collections nav item, the collection cards in Our Homes and the
// /collections/* pages all stay invisible.
import { createClient } from '@supabase/supabase-js';

export const COLLECTIONS_PREVIEW = process.env.NEXT_PUBLIC_COLLECTIONS_PREVIEW === '1';
const VISIBLE_STATUSES = COLLECTIONS_PREVIEW ? ['Live', 'preview'] : ['Live'];

async function db() {
  // Preview rows are hidden from the anon key by RLS, so the local preview
  // reads with the service role. getStaticProps only — never in the browser.
  if (COLLECTIONS_PREVIEW && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createSupabaseAdminClient } = await import('@/lib/supabaseAdmin');
    return createSupabaseAdminClient();
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const COLLECTION_COLS = 'slug, name, tagline, description, share_type, status, price, currency, price_note, monthly_cost, homes_count, weeks_per_year, availability_note, highlights, faqs, hero_image, sort';
const HOME_COLS = 'collection_slug, position, key, name, city, region, country, home_type, size_m2, plot_m2, bedrooms, bathrooms, guest_toilets, extra_beds, readiness, description, features, airport_note, photos, photos_note, floorplans, search_terms';

function clean(row) {
  // Supabase numerics arrive as strings; JSON props must be serialisable.
  const out = { ...row };
  for (const k of ['price', 'monthly_cost', 'weeks_per_year', 'size_m2', 'plot_m2']) {
    if (out[k] != null) out[k] = Number(out[k]);
  }
  return out;
}

export async function loadCollections({ withHomes = true } = {}) {
  try {
    const client = await db();
    const { data: cols, error } = await client.from('collections').select(COLLECTION_COLS)
      .in('status', VISIBLE_STATUSES).order('sort', { ascending: true });
    if (error) throw error;
    if (!cols?.length || !withHomes) return (cols || []).map(clean);
    const { data: homes, error: hErr } = await client.from('collection_homes').select(HOME_COLS)
      .in('collection_slug', cols.map(c => c.slug)).order('position', { ascending: true });
    if (hErr) throw hErr;
    return cols.map(c => ({ ...clean(c), homes: (homes || []).filter(h => h.collection_slug === c.slug).map(clean) }));
  } catch (e) {
    // A collections outage must never cost us the page that embeds them.
    console.error('collections: load failed -', e?.message);
    return [];
  }
}

export async function loadCollection(slug) {
  const all = await loadCollections();
  return all.find(c => c.slug === slug) || null;
}

// Card data for grids. Keeps the payload small: only what a card shows.
export function collectionCardData(c) {
  return {
    slug: c.slug,
    name: c.name,
    tagline: c.tagline || '',
    share_type: c.share_type,
    price: c.price,
    currency: c.currency,
    homes_count: c.homes_count || c.homes?.length || 0,
    weeks_per_year: c.weeks_per_year,
    homes: (c.homes || []).map(h => ({
      key: h.key, name: h.name, city: h.city, region: h.region, country: h.country,
      photo: (h.photos || [])[0] || null, search_terms: h.search_terms || [], readiness: h.readiness,
    })),
  };
}

// Which home should lead a collection card for the current search?
// Returns the first matching home, or null when the collection has none.
export function leadHomeFor(card, matchesHome) {
  if (!card?.homes?.length) return null;
  if (!matchesHome) return card.homes[0];
  return card.homes.find(matchesHome) || null;
}

export function collectionHref(slug, homeKey) {
  return `/collections/${slug}/${homeKey ? `?home=${encodeURIComponent(homeKey)}` : ''}`;
}

export function formatMoney(amount, currency = 'EUR') {
  if (amount == null) return '';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${amount}`; }
}

export function placeLabel(h) {
  return [h.city, h.country].filter(Boolean).join(', ');
}
