/**
 * Pure ranking for the AI property search.
 *
 * Nothing in this file touches the network, the database, or the model. It is a
 * deterministic function from (intent, properties, enrichment) to an ordered
 * list, which means three useful things:
 *
 *   1. It is testable offline. `npm run test:search` exercises it with no key
 *      and no billing.
 *   2. It runs identically in Node (the API route) and in the browser, so when
 *      a visitor drags a slider or removes a chip we re-rank locally, instantly
 *      and for free — no second model call.
 *   3. Every number it produces can be traced back to a real, named place with
 *      a measured distance. There are no opaque vector distances here.
 *
 * The enrichment it ranks over is `data/place-facets.json`, built from
 * OpenStreetMap. See that file's header for the honesty rules governing which
 * numbers may be quoted to a visitor as home-level facts and which are only
 * area-level.
 */

// --- vocabulary ------------------------------------------------------------
// One source of truth, shared by the model prompt, the ranker and the UI. If a
// facet is not in this list the model may not weight it, which is what stops it
// inventing `facets.vibe_luxury` and silently scoring nothing.

/**
 * Proximity facets: 0–100, derived from the distance to the nearest real,
 * mapped feature — or, for the large objects (trails, parks, lakes), from
 * whether one genuinely reaches this area at all.
 *
 * Scuba and padel were the examples in the brief, not the brief. Somebody who
 * hikes, rides, sails, fishes, wants a museum on a wet Tuesday or needs a train
 * station has to be served exactly as well as the diver, and none of that is
 * inferable from a partner's paragraph about a kitchen.
 */
export const PLACE_FACETS = [
  // sport & water
  'dive', 'padel', 'tennis', 'golf', 'beach', 'marina', 'surf', 'ski',
  'climbing', 'horse', 'cycling', 'watersports', 'fishing', 'swim_public',
  'motorsport', 'icerink',
  // outdoors
  'hiking', 'outdoors', 'nature', 'national_park', 'peaks', 'viewpoint', 'lake',
  // culture & going out
  'culture', 'museum', 'arts', 'castle', 'wine', 'brewery', 'casino',
  // family
  'family', 'waterpark', 'themepark', 'zoo_aquarium',
  // living there
  'spa', 'wellness', 'gym', 'coworking', 'hospital', 'supermarket', 'school',
  'intl_school', 'market', 'settlement',
  // getting there
  'connected', 'airport', 'train', 'ferry',
];

/** Character facets: 0–100, derived from density counts around the area. */
export const CHARACTER_FACETS = [
  'food', 'nightlife', 'walkable', 'touristy', 'quiet', 'convenience',
  'things_to_do',
];

/**
 * Listing facets: booleans mined from the partner's own description + amenity
 * list. `trail_access` and `bike_access` are deliberately NOT called hiking and
 * biking — those names belong to the measured map data, and letting a marketing
 * sentence share a namespace with a measured fact is how a ranker starts
 * quietly reading the brochure instead of the ground.
 */
export const LISTING_FACETS = [
  'pool', 'sea_view', 'mountain_view', 'hot_tub', 'garden', 'ski_in_out',
  'air_con', 'fireplace', 'parking', 'golf_onsite', 'pet_friendly',
  'kid_friendly', 'beach_access', 'trail_access', 'bike_access', 'workspace',
  'ev_charger', 'outdoor_cook', 'chefs_kitchen', 'lift', 'rooftop',
];

export const ALL_FACETS = [...PLACE_FACETS, ...CHARACTER_FACETS, ...LISTING_FACETS];
const FACET_SET = new Set(ALL_FACETS);
const LISTING_SET = new Set(LISTING_FACETS);

/**
 * Human labels. Used for the chips the visitor sees and edits, so the interface
 * never shows a raw key like `ski_in_out`.
 */
export const FACET_LABELS = {
  // sport & water
  dive: 'diving', padel: 'padel', tennis: 'tennis', golf: 'golf', beach: 'beaches',
  marina: 'a marina', surf: 'surfing', ski: 'skiing', climbing: 'climbing',
  horse: 'horse riding', cycling: 'cycling', watersports: 'sailing & watersports',
  fishing: 'fishing', swim_public: 'public pools', motorsport: 'karting & motorsport',
  icerink: 'ice skating',
  // outdoors
  hiking: 'hiking', outdoors: 'the outdoors', nature: 'nature reserves',
  national_park: 'a national park', peaks: 'mountains', viewpoint: 'viewpoints',
  lake: 'a lake',
  // culture & going out
  culture: 'museums & culture', museum: 'museums', arts: 'theatre & cinema',
  castle: 'castles & history', wine: 'wine country', brewery: 'breweries',
  casino: 'a casino',
  // family
  family: 'family-friendly', waterpark: 'water parks', themepark: 'theme parks',
  zoo_aquarium: 'zoos & aquariums',
  // living there
  spa: 'spas', wellness: 'spa & fitness', gym: 'gyms', coworking: 'coworking spaces',
  hospital: 'a hospital nearby', supermarket: 'shops nearby', school: 'schools',
  intl_school: 'international schools', market: 'local markets',
  settlement: 'a town nearby',
  // getting there
  connected: 'easy to get to', airport: 'airport access', train: 'a train station',
  ferry: 'a ferry port',
  // character
  food: 'restaurants', nightlife: 'nightlife', walkable: 'walkable',
  touristy: 'touristy', quiet: 'quiet', convenience: 'day-to-day convenience',
  things_to_do: 'plenty to do',
  // the house itself
  pool: 'a pool', sea_view: 'sea views', mountain_view: 'mountain views',
  hot_tub: 'a hot tub', garden: 'outdoor space', ski_in_out: 'ski-in/ski-out',
  air_con: 'air conditioning', fireplace: 'a fireplace', parking: 'parking',
  golf_onsite: 'golf on site', pet_friendly: 'pet friendly',
  kid_friendly: 'kid friendly', beach_access: 'beach access',
  trail_access: 'trails from the door', bike_access: 'cycling from the door',
  workspace: 'somewhere to work', ev_charger: 'EV charging',
  outdoor_cook: 'outdoor cooking', chefs_kitchen: 'a serious kitchen',
  lift: 'a lift', rooftop: 'a roof terrace',

  // Constituents. A buyer never weights these directly — they only ever feed a
  // composite — but a composite reports which constituent its proof came from,
  // and that string is shown on screen and handed to the copy model. Without a
  // label it falls back to the raw key, and the buyer reads "the outdoors ·
  // biking" while the model is invited to write a sentence about "bikeshop".
  bikeshop: 'bike shops', biking: 'cycle routes', cyclehire: 'bike hire',
  winery: 'wineries', vines: 'vineyards', running: 'running tracks',
  playground: 'playgrounds', bowling: 'bowling', library: 'libraries',
  pharmacy: 'pharmacies', clinic: 'doctors & clinics',
  attraction: 'a big day out',
};

// --- constants -------------------------------------------------------------

/**
 * USD→EUR. Matches the rate used across the CRM and commission workpapers so a
 * budget means the same thing everywhere. This is a comparison rate for
 * ranking, not a quoted price — prices are always displayed in their own
 * currency.
 */
export const USD_TO_EUR = 1 / 1.09;

/**
 * A listing that does not mention a hot tub may still have one — partner copy
 * is inconsistent and amenity lists are partial. So an absent listing flag is
 * scored as uncertainty, not as a confirmed absence. A confirmed feature
 * outranks an unknown one; an unknown one is not buried.
 *
 * Place facets are different: if OpenStreetMap has no dive centre within 15km
 * of a real coordinate, that is a real finding and scores 0.
 */
const LISTING_PRESENT = 100;
const LISTING_UNKNOWN = 40;

/**
 * Rental permission is a property of the PARTNER, not of the home, and the
 * `rental` column in Supabase is `false` on all 355 live rows — it carries no
 * information. Deriving it from the partner is the only correct route.
 * Anything not listed is genuinely unknown and is never hard-excluded on the
 * strength of a guess.
 */
const RENTAL_BY_PARTNER = {
  myne: 'allowed',
  vivla: 'allowed',
  abitaro: 'allowed',
  pacaso: 'forbidden',
  andhamlet: 'forbidden',
};

export function rentalStance(partner) {
  return RENTAL_BY_PARTNER[String(partner || '').toLowerCase()] || 'unknown';
}

// --- helpers ---------------------------------------------------------------

/** Accent- and case-insensitive. "Málaga", "malaga" and "MALAGA" are one place. */
export function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Everything compared in EUR so a mixed-currency corpus can share one budget. */
export function priceInEur(price, currency) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(currency).toUpperCase() === 'USD' ? n * USD_TO_EUR : n;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * The searchable text for a home. Region and country are included because
 * visitors name regions the database stores as cities and vice versa —
 * "Mallorca" is a region to one partner and a city to another.
 */
function placeText(p) {
  return norm([p.city, p.region, p.country, p.title].filter(Boolean).join(' | '));
}

// --- intent normalisation --------------------------------------------------

/**
 * The model is asked for a specific shape but is still a model. Everything it
 * sends is clamped, filtered against the known vocabulary and coerced here, so
 * a malformed intent degrades into a weaker search rather than an exception or
 * a silently empty result set.
 */
export function normalizeIntent(raw) {
  const it = raw && typeof raw === 'object' ? raw : {};
  const f = it.filters && typeof it.filters === 'object' ? it.filters : {};

  const weights = {};
  const rawWeights = it.weights && typeof it.weights === 'object' ? it.weights : {};
  for (const [k, v] of Object.entries(rawWeights)) {
    if (!FACET_SET.has(k)) continue;              // unknown facet: ignored, never guessed at
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) continue;
    weights[k] = clamp(Math.round(n), -3, 3);
  }

  const strArray = (v) => (Array.isArray(v) ? v : v ? [v] : [])
    .map(x => String(x).trim())
    .filter(Boolean)
    .slice(0, 12);

  // "No constraint" must survive as null. Number(null) and Number('') are both
  // 0, which is a perfectly valid bedroom count, so an unset filter would
  // silently become "exactly 0 beds" and cut the collection to a single studio.
  // Check for absence explicitly before touching Number().
  const intInRange = (v, lo, hi) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? clamp(n, lo, hi) : null;
  };

  return {
    summary: typeof it.summary === 'string' ? it.summary.slice(0, 400) : '',
    filters: {
      beds_min: intInRange(f.beds_min, 0, 10),
      beds_max: intInRange(f.beds_max, 0, 10),
      budget_max: Number.isFinite(Number(f.budget_max)) && Number(f.budget_max) > 0
        ? Number(f.budget_max) : null,
      budget_currency: String(f.budget_currency || 'EUR').toUpperCase() === 'USD' ? 'USD' : 'EUR',
      places: strArray(f.places),
      exclude_places: strArray(f.exclude_places),
      property_types: strArray(f.property_types).map(norm),
      needs_rental: f.needs_rental === true,
    },
    weights,
    vibe: strArray(it.vibe).slice(0, 6),
  };
}

// --- filtering -------------------------------------------------------------

function matchesPlaces(p, places) {
  if (!places.length) return false;
  const hay = placeText(p);
  return places.some(q => hay.includes(norm(q)));
}

function matchesType(p, types) {
  if (!types.length) return true;
  const hay = norm([p.property_type, p.property_style].filter(Boolean).join(' '));
  return types.some(t => hay.includes(t));
}

/**
 * Apply the hard constraints, then relax them one at a time until there is
 * enough to rank. Returning three results with an honest note that the budget
 * was stretched 15% beats returning nothing, and it beats quietly ignoring the
 * budget — which is what a search that silently drops constraints does.
 *
 * Order matters: we give ground on the constraint a buyer is most likely to
 * flex on first, and on location last, because someone asking for Mallorca does
 * not want Austria.
 */
export function applyFilters(props, filters, minResults = 4) {
  const relaxations = [];

  // `relaxed` is the set of constraints we have given ground on so far, rather
  // than an opaque level number. Naming them individually is what lets us say
  // truthfully which one moved — and, just as importantly, stay silent about
  // the ones that never moved.
  const test = (p, relaxed) => {
    // Beds. Relaxing allows one bedroom either side of the stated range.
    const slack = relaxed.has('beds') ? 1 : 0;
    const beds = Number(p.beds);
    if (filters.beds_min != null && Number.isFinite(beds) && beds < filters.beds_min - slack) return false;
    if (filters.beds_max != null && Number.isFinite(beds) && beds > filters.beds_max + slack) return false;

    // Budget. Relaxing stretches it by 15%.
    if (filters.budget_max != null) {
      const capEur = filters.budget_currency === 'USD'
        ? filters.budget_max * USD_TO_EUR
        : filters.budget_max;
      const cap = capEur * (relaxed.has('budget') ? 1.15 : 1);
      const eur = priceInEur(p.price, p.currency);
      if (eur != null && eur > cap) return false;
    }

    // Rental income. Only ever excludes partners we know forbid it; an unknown
    // stance is not treated as a no. This one never relaxes: a buyer who said
    // they need to let the place out cannot use a home whose management
    // forbids letting, so offering one is not "widening the search" — it is
    // showing them a home that fails their stated purpose.
    if (filters.needs_rental && rentalStance(p.partner) === 'forbidden') return false;

    // A type mismatch used to `return level >= 3`, which returned TRUE and so
    // jumped clean over the location checks below it — meaning the moment the
    // type constraint relaxed, a buyer who asked for a villa in Mallorca could
    // be handed an apartment in Austria. It has to fall through, not short out.
    if (!relaxed.has('type') && !matchesType(p, filters.property_types)) return false;

    // Location. Held to the end, because someone asking for Mallorca does not
    // want Austria. An exclusion is never relaxed at all: "not Spain" means it.
    if (filters.exclude_places.length && matchesPlaces(p, filters.exclude_places)) return false;
    if (filters.places.length && !relaxed.has('place') && !matchesPlaces(p, filters.places)) return false;

    return true;
  };

  // Ordered by what a buyer is most likely to flex on. `live` is the crucial
  // part: a constraint the buyer never set cannot be relaxed, so it is skipped
  // outright rather than silently counted as a concession.
  const STEPS = [
    { key: 'beds', label: 'widened the bedroom count by one either way',
      live: f => f.beds_min != null || f.beds_max != null },
    { key: 'budget', label: 'stretched the budget by about 15%',
      live: f => f.budget_max != null },
    // There is deliberately no 'rental' step here — see the filter above.
    { key: 'type', label: 'looked at other kinds of home too',
      live: f => f.property_types.length > 0 },
    { key: 'place', label: 'looked beyond the area you named',
      live: f => f.places.length > 0 },
  ];

  const relaxed = new Set();
  let kept = props.filter(p => test(p, relaxed));

  for (const step of STEPS) {
    if (kept.length >= minResults) break;
    if (!step.live(filters)) continue;
    relaxed.add(step.key);
    const next = props.filter(p => test(p, relaxed));
    // Announce it only if giving ground actually admitted homes. Permitting
    // something that turns out not to exist in the collection is not a widened
    // search, and telling a buyer we widened one is a small lie that the copy
    // model will happily put in the headline.
    if (next.length > kept.length) relaxations.push(step.label);
    kept = next;
  }

  return { kept, relaxations, exhausted: kept.length < minResults };
}

// --- scoring ---------------------------------------------------------------

/**
 * Resolve one facet to 0–100 for one home. Returns null when we genuinely
 * cannot know — a missing enrichment record — so the caller can distinguish
 * "no diving here" from "we have not looked".
 */
export function facetValue(enrich, facet) {
  if (!enrich) return null;
  if (LISTING_SET.has(facet)) {
    return enrich.listing && enrich.listing[facet] ? LISTING_PRESENT : LISTING_UNKNOWN;
  }
  const v = enrich.facets ? enrich.facets[facet] : undefined;
  // null means the enrichment build never measured this facet here — a category
  // whose Overpass group had not been fetched for that area yet. undefined means
  // the same thing from an older file that predates the facet entirely. Both are
  // "we have not looked", which is emphatically not "there is none here", and
  // returning 0 for either would invent a finding we never made.
  if (v === null || v === undefined) return null;
  // Clamped on the way in as well as on the way out of the enrichment build.
  // This function is the only door between a static JSON file and the score a
  // visitor sees, and a file is a thing that can be regenerated by a script
  // with a bug in it. One out-of-range value here becomes a 113% match.
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}

/**
 * Weighted mean over the requested facets, normalised to 0–100.
 *
 * A positive weight rewards the facet; a negative weight rewards its absence,
 * which is how "not too touristic" is expressed without a separate mechanism.
 * Dividing by the total absolute weight keeps a five-facet query and a
 * one-facet query on the same scale, so scores stay comparable across searches.
 */
export function scoreHome(enrich, weights) {
  const keys = Object.keys(weights);
  if (!keys.length) return { score: 50, parts: [] };

  let total = 0, denom = 0;
  const parts = [];

  for (const k of keys) {
    const w = weights[k];
    const f = facetValue(enrich, k);
    if (f == null) continue;
    const contribution = w > 0 ? w * f : Math.abs(w) * (100 - f);
    total += contribution;
    denom += Math.abs(w);
    parts.push({ facet: k, weight: w, value: f, contribution: Math.round(contribution) });
  }

  if (!denom) return { score: 0, parts: [] };
  // Strongest pull first, so "why this one" leads with what actually decided it.
  parts.sort((a, b) => b.contribution - a.contribution);
  return { score: Math.round(total / denom), parts };
}

// --- evidence --------------------------------------------------------------

/**
 * Pull the real, named, measured proof behind a home's score.
 *
 * Only named features are ever quoted. An unnamed dive centre still counted
 * toward the score — it is a real mapped facility — but we will not write "an
 * unnamed dive centre 2km away" to a visitor, so it stays out of the copy.
 *
 * Distances are home-level: measured from this listing's own coordinates. The
 * `area` counts in the enrichment file are deliberately not surfaced here,
 * because they were measured at a cluster centre up to 1.1km away and must not
 * be phrased as "within 1km of this house".
 */
export function evidenceFor(enrich, weights, limit = 3, composites = null) {
  if (!enrich || !enrich.evidence) return [];
  const wanted = Object.keys(weights)
    .filter(k => weights[k] > 0 && !LISTING_SET.has(k))
    .sort((a, b) => weights[b] - weights[a]);

  /**
   * Composite facets — "the outdoors", "museums & culture" — have a score but no
   * evidence entry of their own, because nothing in OpenStreetMap is tagged
   * `outdoors`. Their proof lives in the raw categories they were blended from,
   * so we borrow it from the strongest one that actually has named places. A
   * composite that cannot produce a real name is dropped rather than shown bare:
   * an unexplained 84% is precisely the thing this design refuses to ship.
   */
  const resolve = (facet) => {
    const direct = enrich.evidence[facet];
    if (direct && direct.top && direct.top.length) return { src: direct, from: null };
    const sources = composites && composites[facet];
    if (!sources) return null;
    let best = null;
    for (const s of sources) {
      const e = enrich.evidence[s];
      if (!e || !e.top || !e.top.length) continue;
      const strength = enrich.facets ? (enrich.facets[s] ?? 0) : 0;
      if (!best || strength > best.strength) best = { src: e, from: s, strength };
    }
    return best;
  };

  const out = [];
  for (const facet of wanted) {
    const hit = resolve(facet);
    if (!hit) continue;
    const e = hit.src;
    out.push({
      facet,
      label: FACET_LABELS[facet] || facet,
      // Borrowed evidence says so, so the copy can write "the outdoors — via the
      // hiking trails" instead of implying we measured a thing called outdoors.
      via: hit.from ? (FACET_LABELS[hit.from] || hit.from) : null,
      // Large objects (trails, parks, lakes) have no meaningful distance. The
      // flag travels with the evidence so nothing downstream invents one.
      approx: !!e.approx,
      nearest_km: e.approx ? null : e.nearest_km,
      within_15km: e.n15,
      named: e.top.slice(0, 2).map(t => ({ name: t.name, km: e.approx ? null : (t.km ?? null) })),
    });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Confirmed listing features the visitor asked for. Kept separate from place
 * evidence because the source is different — this is the partner's own claim
 * about the house, not a mapped fact about the area — and the interface labels
 * it as such.
 */
export function listingHits(enrich, weights) {
  if (!enrich || !enrich.listing) return [];
  return Object.keys(weights)
    .filter(k => weights[k] > 0 && LISTING_SET.has(k) && enrich.listing[k])
    .map(k => FACET_LABELS[k] || k);
}

// --- the whole thing -------------------------------------------------------

/**
 * Rank the corpus against a parsed intent.
 *
 * @param {object}   intent    raw or normalised intent from the model
 * @param {object[]} props     live properties
 * @param {object}   enrichment `{ homes: { [slug]: {...} } }`
 * @param {object}   opts      `{ limit }`
 */
export function rankProperties(intent, props, enrichment, opts = {}) {
  const limit = opts.limit || 12;
  const it = normalizeIntent(intent);
  const homes = (enrichment && enrichment.homes) || {};
  // Which raw categories each composite facet was blended from, so composite
  // scores can still be backed by a real named place.
  const composites = (enrichment && enrichment.composites) || null;

  const { kept, relaxations, exhausted } = applyFilters(props, it.filters);

  const usesPlaceFacets = Object.keys(it.weights).some(k => !LISTING_SET.has(k));
  const scored = [];
  let coverageGap = 0;

  for (const p of kept) {
    const enrich = homes[p.slug];
    // A home we have not enriched cannot be honestly compared on place facets.
    // It is counted and reported, never silently ranked last.
    if (!enrich && usesPlaceFacets) { coverageGap++; continue; }

    const { score, parts } = scoreHome(enrich, it.weights);
    // Enriched, but not for anything this visitor asked about — every weighted
    // facet came back "we have not measured that here". Scoring it would be
    // scoring nothing, so it joins the coverage gap and gets counted honestly
    // instead of appearing at 0% as though we had checked and found none.
    if (Object.keys(it.weights).length && !parts.length) { coverageGap++; continue; }

    scored.push({
      slug: p.slug,
      title: p.title,
      city: p.city,
      region: p.region,
      country: p.country,
      beds: p.beds,
      baths: p.baths,
      size: p.size,
      price: p.price,
      currency: p.currency,
      img: p.img || null,
      partner: p.partner,
      rental: rentalStance(p.partner),
      score,
      parts: parts.slice(0, 6),
      evidence: evidenceFor(enrich, it.weights, 3, composites),
      listing_hits: listingHits(enrich, it.weights),
      // Sent to the browser so that removing a chip or flipping it from "want"
      // to "avoid" re-ranks locally — instantly, and at no cost, because
      // scoreHome() is pure and runs just as happily in the browser. This is
      // the part a chat interface cannot do: the visitor edits what we
      // understood and watches the shortlist rearrange itself.
      facets: enrich ? enrich.facets : null,
      listing: enrich ? enrich.listing : null,
      // The named places behind every facet, not just the weighted ones, so a
      // newly-added chip can show real evidence without another request.
      all_evidence: enrich ? enrich.evidence : null,
    });
  }

  scored.sort((a, b) =>
    b.score - a.score ||
    (priceInEur(a.price, a.currency) || 0) - (priceInEur(b.price, b.currency) || 0) ||
    a.slug.localeCompare(b.slug));

  return {
    intent: it,
    results: scored.slice(0, limit),
    meta: {
      considered: props.length,
      after_filters: kept.length,
      scored: scored.length,
      coverage_gap: coverageGap,
      // Sent to the browser so a chip added after the fact can still resolve its
      // evidence locally, without another request and without another model call.
      composites,
      relaxations,
      exhausted,
      // The honest-shortfall signal. A best score in the 50s against a
      // strongly-weighted query means nothing in the corpus genuinely fits,
      // and the answer is required to say so rather than presenting the least
      // bad option as a match.
      best_score: scored.length ? scored[0].score : 0,
      weak: scored.length > 0 && scored[0].score < 62 && Object.keys(it.weights).length > 0,
    },
  };
}
