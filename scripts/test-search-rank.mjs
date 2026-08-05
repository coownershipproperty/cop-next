/**
 * Offline test for the search ranker.
 *
 *   node scripts/test-search-rank.mjs
 *   node scripts/test-search-rank.mjs --verbose
 *
 * No network, no API key, no bill. It runs David's own example sentences
 * through the free keyword parser and the real ranking code against the real
 * enrichment data, and asserts things that must be true regardless of which
 * model we point at it later — because if the ranking is wrong, no amount of
 * model quality will save the result, and if the ranking is right, the model is
 * only doing translation at either end.
 *
 * The assertions are deliberately about EVIDENCE, not about which house wins.
 * "The top result for 'I dive' has a named dive centre with a measured
 * distance" is a fact we can check. "The top result is the best house" is an
 * opinion we cannot.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { rankProperties, FACET_LABELS } from '../lib/search/rank.js';
import { fallbackIntent, fallbackCopy, buildCopyPayload, directAnswers, mapCopyWhy } from '../lib/search/prompts.js';

// Evidence borrowed by a composite facet reports `via` as a human label, so
// tracing it back to the enrichment file needs the label read backwards.
const LABEL_TO_FACET = Object.fromEntries(
  Object.entries(FACET_LABELS).map(([k, v]) => [v, k])
);

const here = dirname(fileURLToPath(import.meta.url));
const VERBOSE = process.argv.includes('--verbose');

const facets = JSON.parse(readFileSync(join(here, '../lib/search/place-facets.json'), 'utf8'));

// The corpus. Prefer the pipeline's snapshot (it has every field); fall back to
// reconstructing a minimal one from the enrichment file itself so the test can
// run in a clean checkout.
let props;
try {
  props = JSON.parse(readFileSync('/home/claude/cop-search/data/properties.json', 'utf8'));
} catch {
  props = Object.entries(facets.homes || {}).map(([slug, h]) => ({ slug, ...(h.area || {}) }));
}
props = props.filter(p => ['Live', 'for_sale'].includes(p.status));

const vocab = {
  countries: [...new Set(props.map(p => p.country).filter(Boolean))].sort(),
  regions: [...new Set(props.map(p => p.region).filter(Boolean))].sort(),
  cities: [...new Set(props.map(p => p.city).filter(Boolean))].sort(),
};

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) { pass++; return; }
  fail++;
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function search(q) {
  const intent = fallbackIntent(q, vocab);
  return rankProperties(intent, props, facets, { limit: 12 });
}

/** Does this result carry a named, measured piece of proof for the facet? */
function hasNamedEvidence(result, facet) {
  const ev = (result.evidence || []).find(e => e.facet === facet);
  return !!(ev && ev.named && ev.named.length && ev.named[0].name && ev.named[0].km != null);
}

/**
 * The same question for a large feature — a long-distance trail, a lake, a
 * national park. Presence is a hard fact (Overpass tests the real geometry),
 * but the centroid of a 200km trail is not a distance from anybody's front
 * door. So the proof here is a NAME AND NO NUMBER, and demanding a number
 * would be demanding a fabrication.
 */
function hasNamedArea(result, facet) {
  const ev = (result.evidence || []).find(e => e.facet === facet);
  return !!(ev && ev.approx && ev.named && ev.named.length && ev.named[0].name
    && ev.named[0].km == null && ev.nearest_km == null);
}

// --- the cases ------------------------------------------------------------

const CASES = [
  {
    q: 'I like scuba diving, I like padel, I want to be near a beach, 3 bed in Mallorca, somewhere quiet, not too touristic',
    name: "David's full sentence",
    assert(r) {
      const w = r.intent.weights;
      check('full: reads diving', w.dive > 0, `dive=${w.dive}`);
      check('full: reads padel', w.padel > 0, `padel=${w.padel}`);
      check('full: reads beach', w.beach > 0, `beach=${w.beach}`);
      check('full: quiet is a want', w.quiet > 0, `quiet=${w.quiet}`);
      check('full: touristy is an AVOID, not a want', w.touristy < 0, `touristy=${w.touristy}`);
      check('full: 3 beds became a filter', r.intent.filters.beds_min === 3, JSON.stringify(r.intent.filters));
      check('full: Mallorca became a place filter',
        (r.intent.filters.places || []).some(p => /mallorca/i.test(p)),
        JSON.stringify(r.intent.filters.places));
      check('full: returned something', r.results.length > 0, `${r.results.length} results`);
    },
  },
  {
    q: 'I like padel',
    name: 'the one-interest case that used to look broken',
    assert(r) {
      check('padel: returned results', r.results.length > 0);
      check('padel: top result has a NAMED padel court', hasNamedEvidence(r.results[0], 'padel'),
        JSON.stringify((r.results[0]?.evidence || []).map(e => e.facet)));
      const withCourts = r.results.filter(x => hasNamedEvidence(x, 'padel')).length;
      check('padel: most of the shortlist has real courts', withCourts >= Math.min(5, r.results.length),
        `${withCourts}/${r.results.length}`);
    },
  },
  {
    q: 'I want to go scuba diving',
    name: 'diving, grounded in real dive shops',
    assert(r) {
      check('dive: returned results', r.results.length > 0);
      check('dive: top result has a NAMED dive facility', hasNamedEvidence(r.results[0], 'dive'));
    },
  },
  {
    q: 'Somewhere quiet, not too touristic',
    name: 'character only, no places, no filters',
    assert(r) {
      check('quiet: quiet positive', r.intent.weights.quiet > 0);
      check('quiet: touristy negative', r.intent.weights.touristy < 0);
      check('quiet: returned results', r.results.length > 0);
      // Nothing was narrowed, so nothing can have been widened.
      check('quiet: a filterless search announces no relaxations',
        r.meta.relaxations.length === 0, JSON.stringify(r.meta.relaxations));
      // An avoid facet should genuinely be low in the winners.
      const top = r.results[0];
      check('quiet: winner is actually quiet', (top?.facets?.quiet ?? 0) >= 55, `quiet=${top?.facets?.quiet}`);
      check('quiet: winner is not a tourist trap', (top?.facets?.touristy ?? 100) <= 65, `touristy=${top?.facets?.touristy}`);
    },
  },
  {
    q: '3 bed in Mallorca',
    name: 'pure filters',
    assert(r) {
      check('3bed: beds_min set', r.intent.filters.beds_min === 3);
      check('3bed: beds_max set (an exact count, not a floor)', r.intent.filters.beds_max === 3);
      const wrong = r.results.filter(x => x.beds != null && x.beds !== 3);
      check('3bed: every result has 3 beds, or a relaxation was announced',
        wrong.length === 0 || r.meta.relaxations.length > 0,
        `${wrong.length} off-spec, relaxations=${JSON.stringify(r.meta.relaxations)}`);
    },
  },
  {
    q: 'Near a beach in Spain under 150000 euros',
    name: 'budget is respected',
    assert(r) {
      check('budget: parsed a maximum', r.intent.filters.budget_max === 150000, String(r.intent.filters.budget_max));
      const over = r.results.filter(x => {
        const eur = x.currency === 'USD' ? x.price / 1.09 : x.price;
        return eur > 150000 * 1.001;
      });
      check('budget: nothing over budget unless relaxation was announced',
        over.length === 0 || r.meta.relaxations.some(t => /budget/i.test(t)),
        `${over.length} over, relaxations=${JSON.stringify(r.meta.relaxations)}`);
    },
  },
  {
    q: 'Somewhere I can rent out when I am not using it',
    name: 'rental derived from the partner, since the column is useless',
    assert(r) {
      check('rental: needs_rental set', r.intent.filters.needs_rental === true);
      // No relaxation can ever admit these: a buyer who needs to let the home
      // out cannot use one whose management forbids letting, full stop.
      const forbidden = r.results.filter(x => ['pacaso', 'andhamlet'].includes(String(x.partner).toLowerCase()));
      check('rental: rental-forbidden homes never shown to a yield-seeker',
        forbidden.length === 0,
        `${forbidden.length} forbidden, relaxations=${JSON.stringify(r.meta.relaxations)}`);
      // And the copy model is told the stance in neutral words, per home.
      const payload = buildCopyPayload('Somewhere I can rent out when I am not using it', r);
      check('rental: copy payload states the letting stance for every home',
        payload.homes.every(h => typeof h.letting_out === 'string' && h.letting_out.length > 0));
    },
  },
  {
    q: 'Somewhere in Japan near a golf course',
    name: 'a country we do not cover must be admitted, not quietly swapped',
    assert(r) {
      check('japan: named the place', (r.intent.filters.places || []).length > 0);
      check('japan: either returned nothing or announced looking elsewhere',
        r.results.length === 0 || r.meta.relaxations.some(t => /beyond the area/i.test(t)),
        `${r.results.length} results, relaxations=${JSON.stringify(r.meta.relaxations)}`);
    },
  },
  {
    q: 'A ski place where I can walk to the lift, with a fireplace',
    name: 'place facet plus listing facet together',
    assert(r) {
      check('ski: ski weighted', r.intent.weights.ski > 0);
      check('ski: fireplace weighted', r.intent.weights.fireplace > 0);
      check('ski: returned results', r.results.length > 0);
      check('ski: top result has a NAMED lift or ski area', hasNamedEvidence(r.results[0], 'ski'));
    },
  },
  {
    q: 'Long walks and hiking trails, somewhere in the mountains',
    name: 'hiking — the thing David said we should not have forgotten',
    assert(r) {
      const w = r.intent.weights;
      check('hike: hiking weighted', w.hiking > 0, `hiking=${w.hiking}`);
      check('hike: outdoors weighted alongside it', w.outdoors > 0, `outdoors=${w.outdoors}`);
      check('hike: "the mountains" read as peaks', w.peaks > 0, `peaks=${w.peaks}`);
      check('hike: returned results', r.results.length > 0);
      check('hike: top result names a real route, with no invented distance',
        hasNamedArea(r.results[0], 'hiking') || hasNamedArea(r.results[0], 'outdoors'),
        JSON.stringify((r.results[0]?.evidence || []).map(e => [e.facet, e.approx, e.named?.[0]?.km])));
    },
  },
  {
    q: 'Somewhere I can cycle, near a train station',
    name: 'cycling and rail — facets that did not exist a day ago',
    assert(r) {
      const w = r.intent.weights;
      check('cycle: cycling weighted', w.cycling > 0, `cycling=${w.cycling}`);
      check('cycle: train weighted', w.train > 0, `train=${w.train}`);
      check('cycle: no orphaned `biking` facet leaked into the weights',
        w.biking === undefined, `biking=${w.biking}`);
      check('cycle: returned results', r.results.length > 0);
    },
  },
  {
    q: 'Museums, galleries and a bit of history, plus good restaurants',
    name: 'culture — broad facet and specific facet together',
    assert(r) {
      const w = r.intent.weights;
      check('culture: culture weighted', w.culture > 0, `culture=${w.culture}`);
      check('culture: museum weighted', w.museum > 0, `museum=${w.museum}`);
      check('culture: food weighted', w.food > 0, `food=${w.food}`);
      check('culture: returned results', r.results.length > 0);
      check('culture: top result has a NAMED museum', hasNamedEvidence(r.results[0], 'museum'),
        JSON.stringify((r.results[0]?.evidence || []).map(e => e.facet)));
    },
  },
  {
    q: 'We sail, and the kids want a water park',
    name: 'not everyone dives or plays padel',
    assert(r) {
      const w = r.intent.weights;
      check('sail: watersports weighted', w.watersports > 0, `watersports=${w.watersports}`);
      check('sail: marina weighted', w.marina > 0, `marina=${w.marina}`);
      check('sail: family weighted', w.family > 0, `family=${w.family}`);
      check('sail: waterpark weighted', w.waterpark > 0, `waterpark=${w.waterpark}`);
      check('sail: returned results', r.results.length > 0);
    },
  },
  {
    q: 'Somewhere warm where I can hire a jet ski',
    name: 'a jet ski is not a ski holiday',
    assert(r) {
      const w = r.intent.weights;
      check('jetski: read as watersports', w.watersports > 0, `watersports=${w.watersports}`);
      check('jetski: did NOT send them to the Alps', !w.ski, `ski=${w.ski}`);
    },
  },
  {
    q: 'Near a beach in Spain',
    name: 'Spain is a country, not a spa',
    assert(r) {
      check('spain: no spa was invented from the letters S-P-A', !r.intent.weights.spa,
        `spa=${r.intent.weights.spa}`);
      check('spain: beach weighted', r.intent.weights.beach > 0);
    },
  },
  {
    q: 'asdf asdf asdf',
    name: 'nonsense must not be dressed up as a match',
    assert(r) {
      check('nonsense: no facets invented', Object.keys(r.intent.weights).length === 0,
        JSON.stringify(r.intent.weights));
    },
  },
];

// --- invariants that must hold on EVERY search -----------------------------

function invariants(q, r) {
  const tag = q.slice(0, 28);

  check(`[${tag}] weights are in range`,
    Object.values(r.intent.weights).every(w => w >= -3 && w <= 3 && w !== 0),
    JSON.stringify(r.intent.weights));

  check(`[${tag}] no invented facets`,
    Object.keys(r.intent.weights).every(f => FACET_LABELS[f] !== undefined),
    Object.keys(r.intent.weights).filter(f => FACET_LABELS[f] === undefined).join(','));

  check(`[${tag}] scores are 0-100`,
    r.results.every(x => x.score >= 0 && x.score <= 100),
    r.results.map(x => x.score).join(','));

  check(`[${tag}] results are in descending score order`,
    r.results.every((x, i) => i === 0 || r.results[i - 1].score >= x.score));

  check(`[${tag}] no duplicate homes`,
    new Set(r.results.map(x => x.slug)).size === r.results.length);

  // The rule that keeps the copy model honest: every piece of named evidence
  // must have come from the enrichment file, never from anywhere else. A
  // composite facet borrows its proof from whichever constituent is strongest,
  // and reports which one via `via` — so the trace follows that, not the
  // heading, and stays exact rather than being loosened to "somewhere on this
  // home".
  for (const x of r.results) {
    for (const ev of x.evidence || []) {
      const key = ev.via ? (LABEL_TO_FACET[ev.via] || ev.via) : ev.facet;
      const src = facets.homes?.[x.slug]?.evidence?.[key];
      const names = new Set((src?.top || []).map(t => t.name));
      const leaked = (ev.named || []).filter(t => t.name && !names.has(t.name));
      check(`[${tag}] ${x.slug}: evidence traces to the enrichment file`,
        leaked.length === 0, `${key}: ${leaked.map(t => t.name).join(', ')}`);
    }
  }

  // A large feature must never acquire a distance on its way to the screen.
  // This is the whole reason `approx` exists: the number would be the centroid
  // of a mountain range, and it would look exactly as authoritative as the
  // 2.1km to a dive shop.
  for (const x of r.results) {
    for (const ev of (x.evidence || []).filter(e => e.approx)) {
      check(`[${tag}] ${x.slug}: ${ev.facet} is quoted without a fabricated distance`,
        ev.nearest_km == null && (ev.named || []).every(n => n.km == null),
        JSON.stringify(ev));
    }
  }

  // And it must not reappear as the literal text "nullkm" once the copy layers
  // have formatted it — which is exactly what both of them used to do.
  const payload = JSON.stringify(buildCopyPayload(q, r));
  check(`[${tag}] copy payload carries no broken distance`,
    !/null\s*km|undefined\s*km|NaN/i.test(payload),
    (payload.match(/.{0,40}(null|undefined|NaN)\s*km.{0,20}/i) || [])[0]);

  const fc = JSON.stringify(fallbackCopy(r));
  check(`[${tag}] fallback copy carries no broken distance`,
    !/null\s*km|undefined\s*km|NaN/i.test(fc),
    (fc.match(/.{0,40}(null|undefined|NaN)\s*km.{0,20}/i) || [])[0]);

  // Homes we have not measured are reported, never silently ranked last.
  check(`[${tag}] coverage gap is reported`, typeof r.meta.coverage_gap === 'number');

  // Every relaxation we announce must name a constraint the buyer actually
  // set. The ranker used to escalate through its levels whenever it was short
  // of results — including when nothing had been filtered in the first place —
  // and report all four concessions. Since the copy prompt puts a widened
  // search in the headline, that told buyers we had loosened a search that was
  // never tightened.
  const f = r.intent.filters;
  const RELAXATION_REQUIRES = [
    [/bedroom/i, f.beds_min != null || f.beds_max != null, 'no bedroom filter was set'],
    [/budget/i, f.budget_max != null, 'no budget was set'],
    // No /rental/ entry: the rental filter never relaxes, so a label matching
    // it should fail below as "matches no known relaxation".
    [/kinds of home/i, (f.property_types || []).length > 0, 'no property type was named'],
    [/beyond the area/i, (f.places || []).length > 0, 'no place was named'],
  ];
  for (const label of r.meta.relaxations) {
    const rule = RELAXATION_REQUIRES.find(([re]) => re.test(label));
    check(`[${tag}] relaxation is truthful: "${label}"`,
      !!rule && rule[1], rule ? rule[2] : 'label matches no known relaxation');
  }

  // Partner names must never reach a buyer. The API strips `partner` from each
  // result before responding, so the public JSON — reproduced here exactly as
  // pages/api/search.js builds it — and the copy-model payload must both be
  // clean. `parisproperty` collapses the spaced and unspaced spellings; plain
  // "hamlet" is skipped because it is an ordinary English word, and the DB
  // value is 'andhamlet' anyway.
  const PARTNER_RE = /myne|pacaso|vivla|andhamlet|abitaro|parisproperty/i;
  const publicResults = r.results.map(({ partner, ...rest }) => rest);
  const leak = (s) => (String(s).match(PARTNER_RE) || [null])[0];
  check(`[${tag}] public payload never contains a partner name`,
    !PARTNER_RE.test(JSON.stringify(publicResults)),
    `found "${leak(JSON.stringify(publicResults))}"`);
  const copyStr = JSON.stringify(buildCopyPayload(q, r));
  check(`[${tag}] copy-model payload never contains a partner name`,
    !PARTNER_RE.test(copyStr), `found "${leak(copyStr)}"`);
}

/**
 * The 5 August regression, verbatim. A father asked for a family beach home in
 * the south of France, plus two direct questions, and got: Baltic Germany in
 * the shortlist above nearer options, a headline claiming everything "fit",
 * and neither question answered. Each assertion below is one of those wounds.
 */
function southOfFranceRegression() {
  const q = 'so i have 2 kids, looking for something south of france, we are an active family, like beach and activities. can i rent it out when not using? and do u have costs?';

  // The intent as the model actually produced it that day: the raw phrase,
  // unmapped. The ranker has to survive this shape, not the ideal one.
  const intent = fallbackIntent(q, vocab);
  intent.filters.places = ['south of france'];

  const r = rankProperties(intent, props, facets, { limit: 12 });
  invariants(q, r);

  check('sof: the raw phrase was resolved to a place we actually have',
    r.intent.filters.places.some(p => /france/i.test(p)), JSON.stringify(r.intent.filters.places));
  check('sof: the buyer\'s own words survive for display',
    r.meta.asked_place_label === 'south of france', r.meta.asked_place_label);

  // The actual wound from 5 August: Baltic Germany in the shortlist with no
  // explanation. The rule now is either/or — every result honours the asked
  // place, or the widening is declared and every outside home carries a
  // measured distance. Both at once is the one forbidden state: an
  // out-of-area home presented as though it were not.
  if (!r.meta.place_widened) {
    check('sof: place held, so every result is in France',
      r.results.every(x => /france/i.test(String(x.country))),
      r.results.map(x => x.country).join(', '));
  } else {
    check('sof: widening declared',
      r.meta.relaxations.some(t => /beyond the area/i.test(t)), JSON.stringify(r.meta.relaxations));
    check('sof: out-of-area homes carry a measured distance',
      r.results.filter(x => !/france/i.test(String(x.country))).every(x => x.km_from_asked != null));
    check('sof: no 1000km+ home in the top three',
      r.results.slice(0, 3).every(x => x.km_from_asked == null || x.km_from_asked < 1000),
      r.results.slice(0, 3).map(x => `${x.country}:${x.km_from_asked}km`).join(', '));
    const copy = fallbackCopy(r);
    check('sof: headline admits the area miss', /south of france/i.test(copy.headline), copy.headline);
  }
  check('sof: a real match leads',
    r.results.length > 0 && r.results[0].score >= 62,
    r.results[0] && `top=${r.results[0].score}`);

  // Both direct questions get direct, figure-free answers.
  check('sof: rental question detected', r.intent.filters.needs_rental === true);
  check('sof: costs question detected', r.intent.filters.asks_costs === true);
  const answers = directAnswers(r.intent.filters);
  check('sof: both questions answered', answers.length === 2);
  check('sof: the costs answer quotes the 1/8th rule and no money figure',
    answers.every(a => /1\/8th/.test(a.answer) ? !/[€$£]|\d{3,}/.test(a.answer) : true) &&
    answers.some(a => /1\/8th of the home/.test(a.answer)),
    JSON.stringify(answers));
  check('sof: answers never use the banned phrase or name a partner',
    answers.every(a => !/floor plan|myne|pacaso|vivla|andhamlet|abitaro|parisproperty/i.test(a.answer)));

  // And since letting was asked for: nothing shown may forbid it.
  check('sof: no rental-forbidden home in the shortlist',
    r.results.every(x => !['pacaso', 'andhamlet'].includes(String(x.partner).toLowerCase())));
}

/**
 * The widen-and-blend machinery, exercised deliberately: a ski search pinned
 * to Paris. Paris exists in the corpus (so the place filter holds and the
 * count-based waterfall never fires) but nothing there can score on ski —
 * exactly the shape where the old code served up 30% Paris homes under a
 * headline claiming they fit, and the buyer deserved the Alps with distances.
 */
function widenBlendChecks() {
  const intent = fallbackIntent('a ski chalet, walking distance to the lifts', vocab);
  intent.filters.places = ['paris'];
  const r = rankProperties(intent, props, facets, { limit: 12 });
  invariants('ski in paris (synthetic)', r);

  check('blend: widening happened and was declared',
    r.meta.place_widened === true && r.meta.relaxations.some(t => /beyond the area/i.test(t)),
    JSON.stringify(r.meta.relaxations));
  check('blend: a real ski place leads, not a Paris consolation prize',
    r.results.length > 0 && r.results[0].score >= 62 && !/paris/i.test(String(r.results[0].city)),
    r.results[0] && `${r.results[0].score} ${r.results[0].city}`);
  check('blend: every out-of-area home carries its distance from Paris',
    r.results.filter(x => !/paris/i.test(placeStr(x))).every(x => x.km_from_asked != null),
    r.results.slice(0, 3).map(x => `${x.city}:${x.km_from_asked}`).join(', '));
  check('blend: nothing absurdly far outranks the Alps',
    r.results.slice(0, 3).every(x => x.km_from_asked == null || x.km_from_asked < 1500),
    r.results.slice(0, 3).map(x => `${x.city}:${x.km_from_asked}km`).join(', '));

  function placeStr(x) { return [x.city, x.region, x.country].filter(Boolean).join(' '); }
}

/** The copy model now keys its lines by position; mapping back must be exact. */
function copyMappingChecks() {
  const r = search('Near a beach, under 150k');
  const modelShaped = { headline: 'H.', why: { 1: 'First line.', 3: 'Third line.' } };
  const mapped = mapCopyWhy(modelShaped, r);
  check('map: index 1 lands on the first slug', mapped.why[r.results[0].slug] === 'First line.');
  check('map: index 3 lands on the third slug', mapped.why[r.results[2].slug] === 'Third line.');
  check('map: uncovered homes keep a generated line',
    typeof mapped.why[r.results[1].slug] === 'string' && mapped.why[r.results[1].slug].length > 0);
  check('map: model headline wins', mapped.headline === 'H.');
  const noCopy = mapCopyWhy(null, r);
  check('map: no model copy still yields a full set',
    r.results.every(x => typeof noCopy.why[x.slug] === 'string' && noCopy.why[x.slug].length > 0));
}

// --- run -------------------------------------------------------------------

console.log(`corpus     : ${props.length} live homes`);
console.log(`enriched   : ${Object.keys(facets.homes || {}).length} homes have map data`);
console.log('');

for (const c of CASES) {
  const r = search(c.q);
  c.assert(r);
  invariants(c.q, r);

  const top = r.results[0];
  const chips = Object.entries(r.intent.weights)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([f, w]) => `${w > 0 ? '+' : '−'}${FACET_LABELS[f] || f}`)
    .join(' ');

  console.log(`${c.name}`);
  console.log(`  "${c.q.length > 66 ? c.q.slice(0, 66) + '…' : c.q}"`);
  console.log(`  understood : ${chips || '(nothing)'}`);
  console.log(`  pool       : ${r.meta.considered} → ${r.meta.after_filters} after filters → ${r.results.length} shown`);
  if (r.meta.relaxations.length) console.log(`  relaxed    : ${r.meta.relaxations.join('; ')}`);
  if (r.meta.coverage_gap) console.log(`  no map data: ${r.meta.coverage_gap}`);
  if (top) {
    console.log(`  top        : ${top.score}% ${top.city}, ${top.country} — ${top.slug}`);
    for (const ev of (top.evidence || []).slice(0, 3)) {
      const proof = (ev.named || []).slice(0, 2)
        .map(t => (t.km != null ? `${t.name} ${t.km}km` : `${t.name} (in the area)`))
        .join(', ');
      const head = ev.via ? `${ev.label} via ${ev.via}` : ev.label;
      console.log(`               ${head}: ${proof || `${ev.within_15km} within 15km`}`);
    }
    if (VERBOSE) {
      for (const x of r.results.slice(1, 6)) {
        console.log(`               · ${x.score}% ${x.city}, ${x.country}`);
      }
    }
  } else {
    console.log('  top        : (nothing matched — correctly said so)');
  }
  console.log('');
}

southOfFranceRegression();
widenBlendChecks();
copyMappingChecks();

console.log('─'.repeat(60));
if (fail) {
  console.log(`FAILED  ${fail} of ${pass + fail}`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`PASSED  ${pass} checks`);
