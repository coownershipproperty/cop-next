/**
 * Newsletter personalization helpers.
 *
 * Refactored out of pages/api/admin/newsletter/prepare.js so the UI-driven
 * endpoints can reuse the same logic.
 */

// ── Lifestyle sibling groups ───────────────────────────────────────────────────
// Used to find "similar enough" regions when a contact's exact region
// doesn't have enough live properties.
export const SIBLING_GROUPS = [
  ['Baqueira', 'French Alps', 'Portes du Soleil', 'Vorarlberg', 'Tyrol', 'Salzburger Land', 'Salzburgerland', 'Salzburg', 'Pinzgau', 'South Tyrol', 'Bavaria', 'Mont Blanc'],
  ['Colorado', 'Utah', 'Wyoming'],
  ['Ibiza', 'Mallorca', 'Formentera', 'Menorca', 'Sardinia', 'Tenerife'],
  ['Lake Como', 'Lake Garda', 'Lago Maggiore', 'Italian Lakes'],
  ['Costa del Sol', 'Costa Blanca', 'Costa Brava', 'Costa de la Luz', 'Sotogrande', 'Cantabria', 'Asturias'],
  ["Côte d'Azur", 'Liguria', 'French Riviera'],
  ['South of France', 'Burgundy', 'Provence', 'Dordogne'],
  ['Tuscany', 'Umbria'],
  ['London', 'Paris', 'Madrid', 'Milan', 'Amsterdam', 'Lisbon', 'Vienna', 'Dublin', 'Berlin'],
  ['Baltic Sea', 'Rügen', 'Sylt', 'Usedom', 'Stockholm Archipelago', 'Värmdö'],
  ['Adriatic', 'Istria'],
  ['South Carolina', 'Florida', 'New Jersey', 'Massachusetts', 'Oregon'],
  ['Arizona', 'Nevada', 'California'],
  ['Algarve', 'Silver Coast'],
  ['Baja California', 'Mexico'],
];

export function getSiblings(region) {
  const lc = (region || '').toLowerCase().trim();
  if (!lc) return [];
  for (const group of SIBLING_GROUPS) {
    if (group.some(r => r.toLowerCase() === lc)) {
      return group.filter(r => r.toLowerCase() !== lc);
    }
  }
  return [];
}

function matchesAny(prop, terms) {
  if (!terms.length) return false;
  const lc = terms.map(t => (t || '').toLowerCase().trim()).filter(Boolean);
  return lc.includes((prop.region || '').toLowerCase().trim()) ||
         lc.includes((prop.city   || '').toLowerCase().trim());
}

function pickWithVariety(pool, count) {
  if (!pool.length || count <= 0) return [];
  const sorted = [...pool].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sorted.length <= count) return sorted;
  if (count === 1) return [sorted[Math.floor(sorted.length / 2)]];
  const step = (sorted.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => sorted[Math.round(i * step)]);
}

/**
 * Build an automatic property selection for one contact based on their region interests.
 * Used when the operator hasn't picked a fixed set (the original prepare.js behaviour).
 */
export function buildPropertySelection(regionInterests, allProps, budgetMax, TOTAL = 6) {
  const chosen = [];
  const chosenSet = new Set();

  const tryAdd = (p) => {
    if (!chosenSet.has(p.slug) && chosen.length < TOTAL) {
      chosen.push(p);
      chosenSet.add(p.slug);
    }
  };

  const withinBudget = (p) => !budgetMax || Number(p.price || 0) <= budgetMax * 1.2;
  const available = allProps.filter(withinBudget);

  const regionMap = new Map();
  for (const { mainRegion, subregion } of regionInterests) {
    const key = (mainRegion || subregion || '').trim();
    if (!key) continue;
    if (!regionMap.has(key)) regionMap.set(key, new Set());
    if (subregion && subregion.trim()) regionMap.get(key).add(subregion.trim());
  }

  const uniqueRegions = [...regionMap.keys()];
  const n = uniqueRegions.length;
  if (!n) return [];

  const baseSlots = Math.floor(TOTAL / n);
  const extraCount = TOTAL % n;
  const allocations = uniqueRegions.map((r, i) => ({
    region: r,
    subs: [...regionMap.get(r)],
    slots: baseSlots + (i < extraCount ? 1 : 0),
    shortfall: 0,
  }));

  for (const alloc of allocations) {
    const { region, subs, slots } = alloc;
    const avail = available.filter(p => !chosenSet.has(p.slug));
    const inRegion = avail.filter(p => matchesAny(p, [region]));
    const subMatches = subs.length ? inRegion.filter(p => matchesAny(p, subs)) : [];
    const nonSubMatches = inRegion.filter(p => !subMatches.includes(p));
    const regionPool = [...subMatches, ...nonSubMatches];
    const picks = pickWithVariety(regionPool.filter(p => !chosenSet.has(p.slug)), slots);
    picks.forEach(tryAdd);
    alloc.shortfall = slots - picks.length;
  }

  if (chosen.length < TOTAL) {
    for (const alloc of allocations) {
      if (chosen.length >= TOTAL) break;
      const avail = available.filter(p =>
        !chosenSet.has(p.slug) && matchesAny(p, [alloc.region])
      );
      const needed = TOTAL - chosen.length;
      pickWithVariety(avail, needed).forEach(tryAdd);
    }
  }

  if (chosen.length < TOTAL) {
    const allSiblings = [...new Set(
      uniqueRegions.flatMap(r => getSiblings(r))
    )].filter(s => !uniqueRegions.includes(s));
    const siblingPool = available.filter(p =>
      !chosenSet.has(p.slug) && matchesAny(p, allSiblings)
    );
    const needed = TOTAL - chosen.length;
    pickWithVariety(siblingPool, needed).forEach(tryAdd);
  }

  if (chosen.length < TOTAL) {
    const matchedCountries = [...new Set(chosen.map(p => p.country).filter(Boolean))];
    if (matchedCountries.length) {
      const countryPool = available.filter(p =>
        !chosenSet.has(p.slug) &&
        matchedCountries.includes(p.country)
      );
      const needed = TOTAL - chosen.length;
      pickWithVariety(countryPool, needed).forEach(tryAdd);
    }
  }

  return chosen;
}

/**
 * Re-order an operator-picked list of properties (`propertySlugs`) for a single
 * recipient based on everything they have looked at.
 *
 * Ranking (David, 14 Sep 2026: "the most appropriate ones at the top, then
 * diverse"):
 *   1. Homes in a place they have actually looked at come first — an exact
 *      town/city match outranks a region match, which outranks a "sibling"
 *      region (Ibiza ↔ Mallorca). Ties keep the operator's order.
 *   2. Only the first `maxPrimary` matches stay at the top, and at most
 *      `perRegion` from any one region, so a Mallorca reader with fourteen
 *      Mallorca homes on offer still sees the rest of the collection in the
 *      eight cards the email shows, and a reader with two places sees both.
 *   3. Everything else is dealt out round-robin by region, so the tail reads
 *      as a tour of the collection rather than one place repeated.
 *   4. Any matches beyond MAX_PRIMARY follow, then the remaining rest.
 *
 * Interests come from lib/newsletter/audience (leads, floor-plan and gallery
 * requests, watches, unlocks, tour requests, the gallery emails we sent them,
 * saved searches). Each is {mainRegion, subregion} — subregion may be a town.
 *
 * @param {string[]} propertySlugs   — operator-picked, ordered slugs
 * @param {object}   propBySlug      — slug → property
 * @param {Array}    regionInterests — [{mainRegion, subregion}]
 * @param {object}   [opts]          — { maxPrimary = 5, perRegion = 3, diversify = true }
 * @returns {{primary: string[], fallback: string[]}}
 */
export function reorderForRecipient(propertySlugs, propBySlug, regionInterests, opts = {}) {
  if (!propertySlugs?.length) return { primary: [], fallback: [] };
  const maxPrimary = opts.maxPrimary ?? 5;
  const diversify  = opts.diversify ?? true;

  // Some leads store several regions in one field, comma-joined
  // (e.g. "Italian Lakes, Sardinia, Liguria") — split those so each
  // region can match individually.
  // Interests arrive most recent first; remember each term's rank so that,
  // between two equally good matches, the place they looked at LAST wins
  // (Andy: Port d'Andratx yesterday beats Cannes in June).
  const regionRank  = new Map();
  const placeRank   = new Map();
  const siblingRank = new Map();
  const addTo = (map, val, rank) => {
    if (!val) return;
    for (const part of String(val).split(',')) {
      const r = part.toLowerCase().trim();
      if (r && !map.has(r)) map.set(r, rank);
    }
  };
  (regionInterests || []).forEach(({ mainRegion, subregion }, rank) => {
    addTo(regionRank, mainRegion, rank);
    addTo(placeRank, subregion, rank);
  });
  for (const [r, rank] of [...regionRank, ...placeRank]) {
    for (const s of getSiblings(r)) addTo(siblingRank, s, rank);
  }

  const BIG = 1000;
  const score = (p) => {
    const region  = (p.region  || '').toLowerCase().trim();
    const city    = (p.city    || '').toLowerCase().trim();
    const country = (p.country || '').toLowerCase().trim();
    const tiers = [
      [3, city && placeRank.has(city) ? placeRank.get(city) : null],            // the very town they looked at
      [2, [regionRank.get(region), regionRank.get(city), placeRank.get(region)].filter(x => x != null).sort((a, b) => a - b)[0] ?? null], // same region
      [1, [siblingRank.get(region), siblingRank.get(city), regionRank.get(country)].filter(x => x != null).sort((a, b) => a - b)[0] ?? null], // similar lifestyle, or they only named the country
    ];
    for (const [tier, rank] of tiers) if (rank != null) return tier * BIG - rank;
    return 0;
  };

  const scored = propertySlugs.map((slug, i) => ({ slug, i, p: propBySlug[slug], s: propBySlug[slug] ? score(propBySlug[slug]) : 0 }));
  const matches = scored.filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
  const rest    = scored.filter(x => x.s === 0);

  // At most `perRegion` homes from any one region at the top, so a reader
  // who looked at two places sees both (Andy: three Mallorca, then his two
  // Côte d'Azur homes — not five Mallorca and the Riviera pushed to the end).
  const perRegion = opts.perRegion ?? 3;
  const regionCount = new Map();
  const primary = [];
  const overflow = [];
  for (const x of matches) {
    const key = ((x.p && x.p.region) || '').toLowerCase().trim();
    const n = regionCount.get(key) || 0;
    if (primary.length < maxPrimary && n < perRegion) {
      primary.push(x.slug);
      regionCount.set(key, n + 1);
    } else {
      overflow.push(x.slug);
    }
  }

  let tail;
  if (diversify) {
    // Deal the rest out one region at a time, in the operator's order of
    // first appearance, so consecutive cards are different places.
    const byRegion = new Map();
    for (const x of rest) {
      const key = ((x.p && (x.p.region || x.p.country)) || '').toLowerCase().trim() || '~';
      if (!byRegion.has(key)) byRegion.set(key, []);
      byRegion.get(key).push(x.slug);
    }
    const queues = [...byRegion.values()];
    tail = [];
    let added = true;
    while (added) {
      added = false;
      for (const q of queues) {
        if (q.length) { tail.push(q.shift()); added = true; }
      }
    }
  } else {
    tail = rest.map(x => x.slug);
  }

  return { primary, fallback: [...tail, ...overflow] };
}

export const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', SEK: 'SEK ' };

export function formatPrice(price, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
  return `${sym}${Number(price || 0).toLocaleString('en-GB')}`;
}

/**
 * Country → preferred display currency (rough map; falls back to property's own currency).
 */
export const COUNTRY_CURRENCY = {
  US: 'USD', 'United States': 'USD',
  GB: 'GBP', 'United Kingdom': 'GBP', UK: 'GBP',
  SE: 'SEK', Sweden: 'SEK',
  CH: 'CHF', Switzerland: 'CHF',
};
