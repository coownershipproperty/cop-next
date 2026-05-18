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
  ['Baqueira', 'French Alps', 'Portes du Soleil', 'Vorarlberg', 'Tyrol', 'Salzburger Land', 'Salzburg', 'Pinzgau', 'South Tyrol', 'Bavaria'],
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
 * recipient based on their region interests. Properties that match their
 * regions go first ("primary"); the rest follow in the operator's order ("fallback").
 *
 * @param {string[]} propertySlugs        — operator-picked, ordered slugs
 * @param {object}   propBySlug           — slug → property
 * @param {Array}    regionInterests      — [{mainRegion, subregion}]
 * @returns {{primary: string[], fallback: string[]}}
 */
export function reorderForRecipient(propertySlugs, propBySlug, regionInterests) {
  if (!propertySlugs?.length) return { primary: [], fallback: [] };

  // Build set of interest regions + sibling regions for soft match
  const interestSet = new Set();
  for (const { mainRegion, subregion } of regionInterests || []) {
    if (mainRegion) interestSet.add(mainRegion.toLowerCase().trim());
    if (subregion) interestSet.add(subregion.toLowerCase().trim());
  }
  const siblingSet = new Set();
  for (const r of interestSet) {
    for (const s of getSiblings(r)) siblingSet.add(s.toLowerCase().trim());
  }

  const primary = [];
  const fallback = [];

  for (const slug of propertySlugs) {
    const p = propBySlug[slug];
    if (!p) { fallback.push(slug); continue; }
    const region = (p.region || '').toLowerCase().trim();
    const city = (p.city || '').toLowerCase().trim();
    const matches = interestSet.has(region) || interestSet.has(city) ||
                    siblingSet.has(region) || siblingSet.has(city);
    if (matches) primary.push(slug);
    else fallback.push(slug);
  }

  return { primary, fallback };
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
