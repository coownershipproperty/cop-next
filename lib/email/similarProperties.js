/**
 * lib/email/similarProperties.js
 *
 * The three homes shown under "You may also like" in the gallery unlock email.
 *
 * This is the only place in that email where COP gets to say "and if not this
 * one, how about these" — so it must always have something to show, and what
 * it shows has to be defensibly similar to the home the person just opened.
 *
 * The previous version did none of that. It returned NOTHING when the country
 * was unknown, looked only at city then country, never considered bedrooms,
 * excluded `for_sale` listings, and took whichever three rows Postgres handed
 * back first — so a Côte d'Azur villa could be followed by a Paris studio for
 * no better reason than both being in France.
 *
 * Now: build a candidate pool, score every candidate on how close it actually
 * is, and take the best three.
 */

const FIELDS   = 'slug, title, img, price, currency, beds, size, city, region, country';
const STATUSES = ['Live', 'for_sale'];

const norm = (v) => String(v == null ? '' : v).trim().toLowerCase();

/**
 * Higher is closer. The weights say, in order: same town beats same region,
 * a similar price beats a similar size of house, and a card with no photo is
 * worth avoiding because it looks broken in the email.
 *
 *   same city        +100
 *   same region       +55
 *   price           0–40   full marks when identical, zero at 100% out
 *   bedrooms        0–30   full marks for an exact match, −10 per bedroom
 *   has a photo        +6
 */
export function scoreSimilar(candidate, ref) {
  let score = 0;

  if (ref.city && norm(candidate.city) === norm(ref.city)) score += 100;
  else if (ref.region && norm(candidate.region) === norm(ref.region)) score += 55;

  const refPrice = Number(ref.price) || 0;
  const candPrice = Number(candidate.price) || 0;
  if (refPrice > 0 && candPrice > 0) {
    const delta = Math.abs(candPrice - refPrice) / refPrice;
    score += 40 * Math.max(0, 1 - Math.min(1, delta));
  }

  if (ref.beds != null && candidate.beds != null) {
    score += Math.max(0, 30 - 10 * Math.abs(Number(candidate.beds) - Number(ref.beds)));
  }

  if (candidate.img) score += 6;

  return score;
}

/**
 * @param {object} db     Supabase admin client
 * @param {object} ref    { slug, country, city, region, price, beds }
 * @param {number} limit
 * @returns {Promise<object[]>} up to `limit` property rows, closest first
 */
export async function getSimilarProperties(db, ref = {}, limit = 3) {
  const exclude = ref.slug || '';
  const pool = new Map();

  const add = (rows) => {
    for (const p of rows || []) {
      if (p && p.slug && p.slug !== exclude && !pool.has(p.slug)) pool.set(p.slug, p);
    }
  };

  try {
    // Same country is almost always enough — the catalogue is a few hundred
    // homes across a handful of countries, so this is one small query.
    if (ref.country) {
      const { data } = await db.from('properties').select(FIELDS)
        .eq('country', ref.country).neq('slug', exclude).in('status', STATUSES).limit(200);
      add(data);
    }

    // Widen rather than show nothing. An unknown or thinly stocked country
    // still gets three real homes — ranked on price and size instead of place.
    if (pool.size < limit) {
      const { data } = await db.from('properties').select(FIELDS)
        .neq('slug', exclude).in('status', STATUSES)
        .order('date_added', { ascending: false }).limit(60);
      add(data);
    }
  } catch (e) {
    console.error('[similarProperties] lookup failed:', e.message);
  }

  return [...pool.values()]
    .map((p) => ({ p, s: scoreSimilar(p, ref) }))
    // Ties broken on slug so the same input always produces the same email.
    .sort((a, b) => b.s - a.s || String(a.p.slug).localeCompare(String(b.p.slug)))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Shape a property row for FloorPlanEmail's SimilarProperty prop. */
export function toSimilarCard(p) {
  const symbol = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || '€';
  return {
    title:    p.title,
    price:    p.price ? `${symbol}${Number(p.price).toLocaleString('en-GB')}` : '',
    beds:     p.beds || 0,
    size:     p.size || 0,
    slug:     p.slug,
    imageUrl: p.img || undefined,
  };
}
