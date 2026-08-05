/**
 * Prompts for the AI property search, plus a keyword fallback that keeps the
 * search working when no model is configured.
 *
 * Two model calls per search, and they do very different jobs:
 *
 *   1. UNDERSTAND — turn "somewhere quiet in Mallorca, 3 beds, I dive" into a
 *      structured intent. Small, cheap, temperature 0, JSON out.
 *   2. EXPLAIN — having ranked locally against real map data, write one honest
 *      line per home from the evidence we hand it. It is given facts and
 *      forbidden from adding any.
 *
 * The ranking between those two steps is ours, not the model's. That is the
 * whole design: the model reads English and writes English, and never decides
 * which house is a good match. It cannot hallucinate a dive centre into
 * existence because it never sees a home we did not already measure.
 */

import { PLACE_FACETS, CHARACTER_FACETS, LISTING_FACETS, FACET_LABELS } from './rank.js';

// --- 1. understand ---------------------------------------------------------

export function intentSystemPrompt(vocab = {}) {
  const countries = (vocab.countries || []).join(', ');
  const regions = (vocab.regions || []).slice(0, 90).join(', ');

  return `You convert a holiday-home buyer's own words into a structured search intent. You reply with JSON only.

You are searching a curated collection of co-ownership holiday homes. Every home has been enriched with real OpenStreetMap data about what is genuinely near it, so you can weight lifestyle interests confidently.

FACETS YOU MAY WEIGHT
Places nearby: ${PLACE_FACETS.join(', ')}
Character of the area: ${CHARACTER_FACETS.join(', ')}
Features of the house itself: ${LISTING_FACETS.join(', ')}

Use no other facet names. If the buyer wants something outside this list, ignore it rather than inventing a facet.

SPECIFIC BEATS BROAD. Some facets are deliberately broad — outdoors, culture, family, wellness, connected, convenience, things_to_do. Use a broad one when the buyer was vague ("somewhere with plenty going on", "somewhere active"), and the specific one when they were specific. "I play padel" is padel, not things_to_do. "We want the kids entertained" is family. "I want to be able to get there easily" is connected, not airport alone, unless they said flights.

WEIGHTS run -3 to 3.
  3  they said it plainly and it matters most ("I dive", "must be walkable")
  2  clearly wanted
  1  a mild preference, or implied
 -1  mild aversion
 -2  clearly does not want
 -3  explicitly rejected ("nowhere touristy", "not near a town")
Use a negative weight to express avoidance. "Somewhere quiet, not too touristic" is quiet: 3, touristy: -3 — not quiet: 3 alone.
Weight only what the buyer actually implies. Four to seven facets is usually right; twenty is always wrong, because loading in facets they never mentioned drowns out the ones they did.

READ BETWEEN THE LINES, but only one step. "Somewhere for the kids" implies family and kid_friendly and probably beach. "Somewhere I can work from" implies workspace. "Authentic, not a resort" implies touristy negative and market positive. Do not leap from "I like wine" to "must have a wine fridge".

FILTERS are hard constraints. Only set one if the buyer genuinely stated it.
  beds_min / beds_max   "3 bed" means beds_min 3 and beds_max 3. "at least 3" means beds_min 3 only.
  budget_max            a number, with budget_currency "EUR" or "USD". This is the price of a share, not the whole house.
  places                location names. Use a name from the collection's own lists below whenever the buyer's area contains or means one: "south of France" -> ["France"], "the Spanish coast" -> ["Spain"], "Balearics" -> ["Mallorca", "Ibiza"] if those are listed. Keep the buyer's exact words only when no listed place applies.
  exclude_places        places they ruled out.
  property_types        only if stated: villa, apartment, penthouse, chalet, house, finca, farmhouse, estate.
  needs_rental          true only if they want to let the home out for income.
  asks_costs            true only if they directly asked about costs, fees or charges.

Countries in the collection: ${countries}
Some regions: ${regions}
If the buyer names a place not in the collection at all, still put it in places — the search handles a near miss honestly and says so.

SUMMARY: one short sentence, second person, confirming what you understood. British English. No greeting, no emoji, no exclamation marks. "Three bedrooms in Mallorca, somewhere quiet with diving nearby."

Reply with exactly this shape and nothing else:
{
  "summary": "...",
  "filters": { "beds_min": null, "beds_max": null, "budget_max": null, "budget_currency": "EUR", "places": [], "exclude_places": [], "property_types": [], "needs_rental": false, "asks_costs": false },
  "weights": { "facet": 2 },
  "vibe": ["two or three short adjectives"]
}`;
}

// --- 2. explain ------------------------------------------------------------

export const COPY_SYSTEM_PROMPT = `You write the short explanation shown under each property in a co-ownership holiday-home search. British English. You reply with JSON only.

You are given the buyer's request and a shortlist that has ALREADY been ranked against real OpenStreetMap data. Your job is to say why each home came up, using only the evidence supplied.

ABSOLUTE RULES
- Use only the facts in the evidence given to you. Never add a place, a distance, a number, a feature or an amenity that is not there. If the evidence lists "Buceo Puerto Javea, 2.1km" you may say that. If it lists nothing about restaurants, you may not mention restaurants.
- Distances given to you are measured from that individual home and may be quoted directly.
- Some evidence has a name but NO distance, and carries a note saying so. That is a large feature — a long-distance trail, a lake, a national park — where no single distance would be honest. Name it and say it reaches the area. Never attach a number to it, not even "nearby in km" phrasing.
- If a piece of evidence carries "evidence_is_for", the named place proves that narrower thing rather than the heading above it. Write about the specific thing you were given. "the Serra de Tramuntana trail network" is supported; "everything the outdoors has to offer, 4km away" is not.
- Never name or hint at the company that manages a property. Not the name, not a description of it, not "the operator behind X". Refer to management only as "the team that manages the home", and only if it is relevant.
- Never state a running cost, service charge, annual fee or maintenance figure. Not even approximately.
- Never use the phrase "floor plan" or "floor plans".
- Never promise rental income or a return.
- No emoji. No exclamation marks. Do not open with "Nestled", "Discover", "Imagine" or "Welcome to".

TONE
Warm, concrete, unhurried. Like a good agent who has actually been there, not a brochure. Lead with the single most relevant fact for THIS buyer. Specific beats enthusiastic: "the dive centre at the marina is a ten-minute drive" is worth more than "a paradise for water sports lovers".

FOR EACH HOME write "why", 15 to 30 words, one or two sentences. It must reference at least one concrete piece of the supplied evidence. If the only evidence is a listing feature such as a pool, say that plainly rather than padding. Key each why by the home's "n" number, as a string.

ALSO write "headline": an honest one-line answer to the whole search, 12 to 25 words.
If told the matches are weak, say so in the headline. Do not oversell. "Nothing here is genuinely quiet and near diving, but these two come closest — both are livelier than you asked for." is a good headline. A buyer who is told the truth once will trust the next thing you say.
If told the search went outside the area the buyer named, the headline MUST say that plainly and name the area, e.g. "We have nothing on the south of France coast right now — these are the closest matches, nearest first." Never present out-of-area homes as though they were in the asked area.
If the buyer asked direct questions (renting out, costs), do not answer them — the site answers those separately. Keep the headline about the homes.

Reply with exactly:
{ "headline": "...", "why": { "1": "...", "2": "..." } }`;

/**
 * The shortlist handed to the copy step. Deliberately narrow: the model sees
 * only what it is allowed to write about, so "use only the supplied evidence"
 * is enforced by what we send rather than by asking nicely.
 */
/** How many homes the copy model writes about. The rest get generated lines.
 * Two reasons, both learned the hard way: a 12-home reply overran the token
 * ceiling and arrived as truncated JSON (David's 23-second broken search), and
 * nobody reads twelve bespoke sentences anyway. */
export const COPY_HOMES = 8;

export function buildCopyPayload(query, ranked) {
  return {
    buyer_asked_for: query,
    understood_as: ranked.intent.summary,
    matches_are_weak: ranked.meta.weak,
    // Omitted entirely when nothing was widened. An empty array is an invitation
    // to hedge — the field simply should not be in front of the model unless a
    // constraint the buyer actually set was genuinely given ground on.
    ...(ranked.meta.relaxations.length ? { search_was_widened: ranked.meta.relaxations } : {}),
    ...(ranked.meta.place_widened ? {
      outside_asked_area: `the buyer asked for "${ranked.meta.asked_place_label}"; these homes are elsewhere, ranked nearest first`,
    } : {}),
    homes: ranked.results.slice(0, COPY_HOMES).map((r, i) => ({
      n: String(i + 1),
      title: r.title,
      where: [r.city, r.region, r.country].filter(Boolean).join(', '),
      // Straight-line distance from the area the buyer actually asked for,
      // present only when the search went outside it. Quotable.
      ...(r.km_from_asked != null ? { km_from_asked_area: r.km_from_asked } : {}),
      beds: r.beds,
      match_score: r.score,
      // Real, named, measured. Distances are from this home's own coordinates.
      //
      // Except where they cannot be. A hiking route or a national park is not a
      // point, so the only honest facts about it are that it reaches this area
      // and what it is called — `km` is null and we simply do not send a
      // number. Sending "GR221, nullkm" would be worse than sending nothing,
      // because the model would tidy it into a plausible distance.
      nearby: r.evidence.map(e => {
        const fmt = n => (n.km != null ? `${n.name}, ${n.km}km` : n.name);
        const out = { what: e.label };
        if (e.via) out.evidence_is_for = e.via;
        if (e.named.length) {
          out.nearest = fmt(e.named[0]);
          const rest = e.named.slice(1).map(fmt);
          if (rest.length) out.others = rest;
        } else if (e.nearest_km != null) {
          out.nearest = `${e.nearest_km}km`;
        }
        if (e.within_15km != null) out[e.approx ? 'count_in_the_area' : 'count_within_15km'] = e.within_15km;
        if (e.approx) out.note = 'large feature — it reaches this area, but no single distance is meaningful. Do not give a distance for this one.';
        return out;
      }),
      // Claimed by the listing itself rather than mapped.
      the_home_has: r.listing_hits,
      // Only when the buyer asked about letting the place out. Every home that
      // forbids it has already been filtered out upstream, so the only stances
      // left are yes and unconfirmed — stated neutrally, because the system
      // prompt bans naming or hinting at whoever manages the home.
      ...(ranked.intent.filters.needs_rental ? {
        letting_out: r.rental === 'allowed'
          ? 'permitted when you are not using the home'
          : 'rules unconfirmed — we check before you commit',
      } : {}),
    })),
  };
}

// --- fallback --------------------------------------------------------------

/**
 * A keyword parser, used when no model is configured or when the model call
 * fails. It is not as good — it cannot read "somewhere my mother would like" —
 * but it is instant, free, and it means the search always returns real,
 * correctly-ranked homes instead of an error page.
 *
 * It also makes the whole system testable without a key or a bill, which is
 * how the ranking was tuned before any model was wired in at all.
 */
const KEYWORDS = [
  // --- sport on and in the water ---
  [/\b(scuba|diving|dive|snorkel)/i, { dive: 3 }],
  [/\bsurf/i, { surf: 3 }],
  [/\b(sail|boat|yacht|marina|mooring)/i, { marina: 3 }],
  [/\b(sail|yacht|kayak|canoe|paddleboard|paddle board|windsurf|kitesurf|kite surf|jet ?ski|rowing|water ?sports|watersport)/i, { watersports: 3 }],
  [/\b(fishing|angling|fly fishing)\b/i, { fishing: 3 }],
  [/\b(lido|public pool|swimming club|open water swim|wild swim)/i, { swim_public: 2 }],

  // --- sport on land ---
  [/\bpadel\b/i, { padel: 3 }],
  [/\btennis\b/i, { tennis: 3 }],
  [/\bgolf/i, { golf: 3 }],
  [/\b(climb|bouldering)/i, { climbing: 2 }],
  [/\b(horse|riding|equestrian)/i, { horse: 2 }],
  [/\b(cycl|bike|biking|mountain bik|road bike)/i, { cycling: 3 }],
  [/\b(karting|go.?kart|motorsport|motor racing|race track|racing circuit)/i, { motorsport: 2 }],
  [/\b(ice skat|ice rink|ice hockey)/i, { icerink: 2 }],
  [/\b(gym|fitness|workout|crossfit)/i, { gym: 2 }],
  // Not a bare \brunning\b: "running costs" is a different conversation, and
  // one we are not allowed to have.
  [/\b(go running|running trails|jogging|park run|marathon|athletics)\b/i, { wellness: 2 }],

  // --- snow. "Jet ski" is not skiing, and the word order gives no warning, so
  // the whole sentence has to be checked before either ski reading is allowed.
  // \bski also has to be closed at both ends or it matches "skin". ---
  [/^(?![\s\S]*\bjet[ -]?ski)[\s\S]*(\bski\b|\bskiing\b|\bsnowboard|\bpiste|\bslopes\b|\balpine\b|\bchalet)/i, { ski: 3 }],
  [/^(?![\s\S]*\bjet[ -]?ski)[\s\S]*\b(ski-in|ski in|ski out|slopeside)/i, { ski_in_out: 3, ski: 3 }],

  // --- outdoors ---
  [/\b(hike|hiking|walking trails|walking routes|trekking|rambl|long walks)/i, { hiking: 3, outdoors: 2 }],
  [/\b(outdoors|outdoorsy|the great outdoors|active\b|adventure|fresh air)/i, { outdoors: 3 }],
  [/\b(nature|countryside|green|wild|scenery|scenic|unspoilt landscape)/i, { nature: 3 }],
  [/\b(national parks?|nature parks?|protected land)/i, { national_park: 3, nature: 2 }],
  [/\b(mountains?|peaks?|summit|alps|pyrenees|dolomites|sierra)\b/i, { peaks: 2 }],
  [/\b(viewpoints?|panoramic|lookout|vista)\b/i, { viewpoint: 2 }],
  [/\b(lake|lakes|lakeside|lakefront|by the water)\b/i, { lake: 3 }],

  // --- coast ---
  [/\b(beach|seaside|by the sea|coastal|sea view)/i, { beach: 3 }],

  // --- culture and going out ---
  [/\b(museum|gallery|galleries|culture|cultural|history|historic|heritage)/i, { culture: 3, museum: 2 }],
  [/\b(theatre|theater|cinema|opera|concert|live music|arts cent)/i, { arts: 3, culture: 1 }],
  [/\b(castle|ch[aâ]teau|palace|ruins|old town|medieval)/i, { castle: 2 }],
  [/\b(wine|vineyard|winery|bodega|wine tasting)/i, { wine: 3 }],
  [/\b(brewer(y|ies)|craft beer|distiller|gin school|whisky)/i, { brewery: 2 }],
  [/\b(casino|roulette|poker)\b/i, { casino: 2 }],
  // "busy" is deliberately absent: it appears negated ("not too busy") more
  // often than not, and reading that as a request for nightlife inverts it.
  [/\b(lively|buzzy|vibrant|nightlife|bars|clubbing|party)/i, { nightlife: 3, food: 1 }],
  [/\b(restaurant|food|dining|eat|foodie|gastronom|cuisine)/i, { food: 3 }],
  [/\b(things to do|plenty to do|lots to do|lots going on|plenty going on|never bored|something for everyone|stuff to do|activities)/i, { things_to_do: 3 }],

  // --- family ---
  [/\b(kids|children|family|toddler|grandchildren)/i, { family: 3, kid_friendly: 2 }],
  [/\b(theme park|themepark|amusement park)/i, { themepark: 2 }],
  [/\b(water park|waterpark|aqua ?park)/i, { waterpark: 2 }],
  [/\b(zoo|aquarium|safari park)\b/i, { zoo_aquarium: 2 }],
  [/\b(playground|somewhere for the little ones)/i, { family: 2 }],

  // --- character of the place ---
  [/\b(quiet|peaceful|calm|tranquil|secluded|away from it all|escape|switch off|unwind|not too busy)/i, { quiet: 3 }],
  [/\b(not too touristic|not touristy|untouristy|non-touristic|avoid the crowds|no crowds|off the beaten|authentic|local|unspoilt|undiscovered)/i, { touristy: -3, market: 1 }],
  [/\b(walkable|walk to|on foot|no car|without a car)/i, { walkable: 3, convenience: 1 }],
  [/\b(town|village|near a town|into town)\b/i, { settlement: 2 }],
  [/\b(market|markets|farmers market)/i, { market: 2 }],

  // --- living there ---
  // \bspa without a closing boundary matches SPAin, which quietly weighted a
  // spa into every single Spanish search this collection has ever run.
  [/\b(spas?\b|wellness|thermal|massage|retreat|yoga|hot spring)/i, { spa: 3, wellness: 2 }],
  [/\b(shops|supermarket|amenities|convenient|convenience|day.to.day)/i, { convenience: 2, supermarket: 2 }],
  [/\b(hospital|medical|healthcare|doctor|clinic|pharmac)/i, { hospital: 2 }],
  [/\b(co-?working|coworking|digital nomad|work from|work remotely)/i, { coworking: 3, workspace: 2 }],
  [/\b(work|remote|laptop|office|wifi|internet)/i, { workspace: 2 }],
  [/\b(international schools?)\b/i, { intl_school: 3, school: 2 }],
  [/\b(school|schools|education)/i, { school: 2 }],
  [/\b(dog|dogs|pet|pets)/i, { pet_friendly: 3 }],

  // --- getting there ---
  [/\b(easy to get to|easy to reach|well connected|good transport|short flight|getting there|not a trek)/i, { connected: 3 }],
  [/\b(airport|fly|flights|direct flight)/i, { airport: 3 }],
  [/\b(trains?\b|railway|by rail|eurostar|tgv|high.speed rail)/i, { train: 3 }],
  [/\b(ferry|ferries|island hopping)\b/i, { ferry: 3 }],

  // --- the house itself ---
  [/\b(pool|swimming pool)/i, { pool: 3 }],
  [/\b(hot tub|jacuzzi)/i, { hot_tub: 2 }],
  [/\b(sea views?|ocean views?)/i, { sea_view: 3 }],
  [/\b(mountain views?)/i, { mountain_view: 3 }],
  [/\b(barbecue|bbq|grill|outdoor kitchen|entertain)/i, { outdoor_cook: 2 }],
  [/\b(cook|kitchen|chef)/i, { chefs_kitchen: 2 }],
  [/\b(fireplace|log fire|cosy|cozy)/i, { fireplace: 2 }],
  [/\b(garden|terrace|outdoor space|patio)/i, { garden: 2 }],
  [/\b(air.?con|air conditioning|a\/c)\b/i, { air_con: 2 }],
  [/\b(golf on site|golf course on site|golf resort|on a golf course)/i, { golf_onsite: 3, golf: 3 }],
  [/\b(beach access|walk to the beach|steps from the beach|beachfront|on the beach)/i, { beach_access: 3, beach: 3 }],
  [/\b(trails? from the door|hik\w* from the door|walk\w* from the door)/i, { trail_access: 3, hiking: 2 }],
  [/\b(cycl\w* from the door|bike from the door|ride from the door)/i, { bike_access: 3, cycling: 2 }],
  [/\b(roof ?terrace|rooftop|roof top)/i, { rooftop: 2 }],
  [/\b(parking|garage|cars?)\b/i, { parking: 1 }],
  // "Lift" is a ski lift or an elevator depending on the sentence around it.
  // "Walk to the lift" in a ski search means the mountain, not the building, so
  // the elevator reading requires the word "elevator" or a lift with no skiing
  // anywhere in sight.
  [/\belevator\b/i, { lift: 2 }],
  [/^(?![\s\S]*\bski)[\s\S]*\blift\b/i, { lift: 2 }],
  // Case-sensitive on the acronym alone: /\bev/i matches "every".
  [/\b(ev charger|ev charging|electric car|electric vehicle|tesla)\b/i, { ev_charger: 2 }],
  [/\bEV\b/, { ev_charger: 2 }],
];

const TYPE_WORDS = ['villa', 'apartment', 'penthouse', 'chalet', 'house', 'finca', 'farmhouse', 'estate'];

export function fallbackIntent(query, vocab = {}) {
  const q = String(query || '');
  const weights = {};
  for (const [re, add] of KEYWORDS) {
    if (!re.test(q)) continue;
    for (const [k, v] of Object.entries(add)) {
      // A facet named twice by different phrases is wanted more, not twice.
      weights[k] = Math.max(weights[k] || 0, v);
      if (v < 0) weights[k] = Math.min(weights[k], v);
    }
  }

  // Bedrooms. "3 bed", "3-bedroom", "three bedrooms".
  const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
  let beds = null;
  const digit = q.match(/(\d+)\s*[- ]?\s*(?:bed|bedroom|bedrooms|br)\b/i);
  if (digit) beds = Number(digit[1]);
  if (beds == null) {
    const word = q.match(/\b(one|two|three|four|five|six|seven)\s*[- ]?\s*(?:bed|bedroom)/i);
    if (word) beds = WORD_NUM[word[1].toLowerCase()];
  }
  const atLeast = /\b(at least|minimum|min|or more|\+)\s*\d*\s*(?:bed|bedroom)/i.test(q);

  // Budget. "under 200k", "€150,000", "$300k", "up to 250000".
  let budget = null, cur = 'EUR';
  const money = q.match(/(?:under|below|max|maximum|up to|budget(?: of)?|less than)?\s*([€$£])?\s*([\d][\d,.\s]{2,})\s*(k|m)?\b/i);
  if (money) {
    let n = Number(String(money[2]).replace(/[,\s]/g, ''));
    if (money[3] && money[3].toLowerCase() === 'k') n *= 1000;
    if (money[3] && money[3].toLowerCase() === 'm') n *= 1000000;
    // Only believe it if it looks like a share price rather than a stray number.
    if (n >= 20000 && n <= 10000000) {
      budget = n;
      if (money[1] === '$') cur = 'USD';
    }
  }

  // Locations: match against the vocabulary we actually hold rather than
  // guessing at capitalised words, which picks up "I" and "Padel".
  const places = [];
  const hay = q.toLowerCase();
  for (const name of [...(vocab.cities || []), ...(vocab.regions || []), ...(vocab.countries || [])]) {
    const n = String(name).toLowerCase();
    if (n.length >= 4 && hay.includes(n) && !places.includes(name)) places.push(name);
  }

  // A place we do NOT cover still has to be captured. If someone asks for Japan
  // and we say nothing, the search quietly returns Spain and looks like it
  // ignored them. Capturing it means it filters to nothing, which makes the
  // ranker announce that it looked beyond the area they named — the honest
  // answer. Only capitalised words directly after a locational preposition
  // qualify, which is what keeps "near a beach" out of it.
  if (!places.length) {
    const PREP = /\b(?:in|near|around|close to|on|within)\s+((?:[A-Z][\wÀ-ÿ'’-]+)(?:\s+(?:de|del|la|le|les|du|des|of|the)?\s*[A-Z][\wÀ-ÿ'’-]+){0,2})/g;
    const NOT_A_PLACE = /^(i|a|the|my|we|it|there|somewhere|anywhere|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
    let m;
    while ((m = PREP.exec(q)) !== null) {
      const cand = m[1].trim();
      if (NOT_A_PLACE.test(cand) || cand.length < 3) continue;
      if (!places.some(p => p.toLowerCase() === cand.toLowerCase())) places.push(cand);
    }
  }

  const types = TYPE_WORDS.filter(t => new RegExp(`\\b${t}s?\\b`, 'i').test(q));

  const wanted = Object.keys(weights)
    .filter(k => weights[k] > 0)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, 3)
    .map(k => FACET_LABELS[k] || k);

  const bits = [];
  if (beds != null) bits.push(`${beds}${atLeast ? '+' : ''} bedroom${beds === 1 ? '' : 's'}`);
  if (places.length) bits.push(`in ${places.slice(0, 2).join(' or ')}`);
  if (wanted.length) bits.push(`with ${wanted.join(', ')}`);

  return {
    summary: bits.length ? `Looking for ${bits.join(', ')}.` : 'Showing what best fits what you described.',
    filters: {
      beds_min: beds,
      beds_max: atLeast ? null : beds,
      budget_max: budget,
      budget_currency: cur,
      places: places.slice(0, 3),
      exclude_places: [],
      property_types: types,
      needs_rental: /\b(rent (it )?out|rental income|letting|let it|yield|income)\b/i.test(q),
      asks_costs: /\b(costs?|fees?|charges?|expenses?|maintenance|outgoings?)\b/i.test(q),
    },
    weights,
    vibe: [],
  };
}

/**
 * Deterministic answers to the two questions buyers actually type into the
 * box. Not model output, and deliberately so: the rental answer is guaranteed
 * true by the filter (homes that forbid letting are excluded, without
 * relaxation, whenever letting was asked for), and the costs answer is the one
 * approved wording — no figures, ever, because the numbers are estimates the
 * site cannot stand behind.
 */
export function directAnswers(filters) {
  const out = [];
  if (filters.needs_rental) {
    out.push({
      asked: 'Can I rent it out?',
      answer: 'Yes. Every home shown here can be let out when you are not using it — none of them forbids letting, and we confirm the exact rules with you before you commit to anything.',
    });
  }
  if (filters.asks_costs) {
    out.push({
      asked: 'What about costs?',
      answer: 'As a co-owner you pay 1/8th of the home\'s total running costs, shared between all owners. We\'ll walk you through the exact budget for any home that catches your eye.',
    });
  }
  return out;
}

/**
 * The copy model keys its "why" lines by position ("1".."8") — shorter and
 * safer than repeating long slugs. This turns that back into slug-keyed text,
 * with generated lines filling every home the model did not cover.
 */
export function mapCopyWhy(copy, ranked) {
  const fallback = fallbackCopy(ranked);
  const why = { ...fallback.why };
  if (copy && copy.why && typeof copy.why === 'object') {
    ranked.results.forEach((r, i) => {
      const line = copy.why[String(i + 1)];
      if (typeof line === 'string' && line.trim()) why[r.slug] = line.trim();
    });
  }
  return {
    headline: (copy && typeof copy.headline === 'string' && copy.headline.trim()) || fallback.headline,
    why,
  };
}

/**
 * Deterministic copy for when the model is unavailable. Not as fluent, but
 * every word of it is true, which is the part that matters.
 */
export function fallbackCopy(ranked) {
  const why = {};
  for (const r of ranked.results) {
    const e = r.evidence[0];
    if (e && e.named[0] && e.named[0].km != null) {
      why[r.slug] = `${e.named[0].name} is ${e.named[0].km}km away${e.within_15km > 1 ? `, one of ${e.within_15km} within 15km` : ''}.`;
    } else if (e && e.named[0]) {
      // A trail, a lake, a park. It reaches this area; where its centre happens
      // to fall is not a fact about this home, so no number is offered.
      why[r.slug] = `${e.named[0].name} reaches this area${e.within_15km > 1 ? `, one of ${e.within_15km} nearby` : ''}.`;
    } else if (e && e.nearest_km != null) {
      why[r.slug] = `Nearest ${e.label}: ${e.nearest_km}km.`;
    } else if (e && e.within_15km) {
      why[r.slug] = `${e.within_15km} within 15km of the home.`;
    } else if (r.listing_hits.length) {
      why[r.slug] = `This home has ${r.listing_hits.slice(0, 3).join(', ')}.`;
    } else {
      why[r.slug] = `${[r.city, r.country].filter(Boolean).join(', ')}.`;
    }
  }
  const n = ranked.results.length;
  const area = ranked.meta.asked_place_label;
  // Order matters: an empty result set is the biggest truth, going outside the
  // asked area is the next biggest, and "these are weak" comes after that. The
  // one unforgivable headline is "12 homes that fit what you described" above
  // a page of homes in the wrong country.
  // "Nearest first" is only claimed when distances were actually measured — a
  // place we have no anchor for (Japan) gets the plainer truth instead.
  const anchored = ranked.results.some(r => r.km_from_asked != null);
  const headline = !n
    ? 'Nothing in the collection matches that closely enough to show you.'
    : ranked.meta.place_widened && area
      ? anchored
        ? `We don't have a strong match in ${area} right now — these are the closest alternatives, nearest first.`
        : `We don't have homes in ${area} right now — here is what fits the rest of what you asked for.`
      : ranked.meta.weak
        ? `Nothing here is a strong match for that, but these ${n} come closest.`
        : `${n} home${n === 1 ? '' : 's'} that fit what you described.`;
  return { headline, why };
}
