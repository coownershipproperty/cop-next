/**
 * lib/placeSetting.js
 *
 * What kind of place a home is in — mountains, coast, lake, city, wine
 * country, desert. There is no column for this, and it matters: someone who
 * asked to see a ski apartment in Morzine is not in the market for a beach
 * flat in Antibes, however close the two prices happen to be.
 *
 * Region is a short controlled vocabulary in this database (about fifty
 * values), so a lookup is honest and predictable. A handful of US and
 * Spanish regions span two kinds of place, and those are resolved by town.
 * Anything unrecognised returns null and is simply never used as a signal.
 */

const BY_REGION = {
  // ── Mountains ──────────────────────────────────────────────────────────
  'salzburg': 'mountain', 'salzburger land': 'mountain', 'salzburgerland': 'mountain',
  'tyrol': 'mountain', 'vorarlberg': 'mountain', 'bavaria': 'mountain',
  'mont blanc': 'mountain', 'portes du soleil': 'mountain',
  'baqueira': 'mountain', 'colorado': 'mountain', 'utah': 'mountain',
  'wyoming': 'mountain', 'nevada': 'mountain', 'oregon': 'mountain',
  // ── Lakes ──────────────────────────────────────────────────────────────
  'lake garda': 'lake', 'lake como': 'lake', 'lago maggiore': 'lake',
  // ── Coast and islands ──────────────────────────────────────────────────
  "côte d'azur": 'coast', "cote d'azur": 'coast', 'liguria': 'coast',
  'sardinia': 'coast', 'istria': 'coast', 'algarve': 'coast',
  'baltic sea': 'coast', 'rügen': 'coast', 'rugen': 'coast', 'sylt': 'coast',
  'costa blanca': 'coast', 'costa brava': 'coast', 'costa de la luz': 'coast',
  'costa del sol': 'coast', 'ibiza': 'coast', 'mallorca': 'coast',
  'menorca': 'coast', 'tenerife': 'coast', 'asturias': 'coast',
  'cantabria': 'coast', 'stockholm archipelago': 'coast',
  'florida': 'coast', 'south carolina': 'coast', 'hawaii': 'coast',
  'massachusetts': 'coast', 'los cabos': 'coast',
  // ── Cities ─────────────────────────────────────────────────────────────
  'paris': 'city', 'london': 'city', 'madrid': 'city', 'lisboa': 'city', 'lisbon': 'city',
  // ── Countryside ────────────────────────────────────────────────────────
  'tuscany': 'countryside', 'umbria': 'countryside',
  // ── Split regions, resolved by town below ──────────────────────────────
  'california': null, 'arizona': null,
};

// Towns that decide a split region.
const BY_CITY = {
  // California — three quite different places wearing one name.
  'olympic valley': 'mountain', 'truckee': 'mountain', 'tahoma': 'mountain',
  'south lake tahoe': 'mountain', 'carnelian bay': 'mountain',
  'lake arrowhead': 'mountain', 'incline village': 'mountain',
  'napa': 'countryside', 'st. helena': 'countryside', 'st helena': 'countryside',
  'healdsburg': 'countryside',
  'palm springs': 'desert', 'palm desert': 'desert', 'indian wells': 'desert',
  'la quinta': 'desert', 'scottsdale': 'desert', 'cave creek': 'desert',
  'malibu': 'coast', 'newport beach': 'coast', 'la jolla': 'coast',
  'encinitas': 'coast', 'santa cruz': 'coast', 'san diego': 'coast',
  // Elsewhere, where the town is the clearer signal than the region.
  'florence': 'city', 'bend': 'mountain', 'tegernsee': 'lake',
};

/** 'mountain' | 'coast' | 'lake' | 'city' | 'countryside' | 'desert' | null */
export function settingOf(p) {
  if (!p) return null;
  const city = String(p.city || '').toLowerCase().trim();
  if (BY_CITY[city]) return BY_CITY[city];
  const region = String(p.region || '').toLowerCase().trim();
  return BY_REGION[region] || null;
}

// The phrase carries its own preposition, because English will not let one
// preposition serve them all: you are IN the mountains but ON the coast.
const PHRASE = {
  mountain:    'in the mountains',
  coast:       'on the coast',
  lake:        'on the lakes',
  city:        'in the city',
  countryside: 'in the countryside',
  desert:      'in the desert',
};

/** "in the mountains" / "on the coast" — drops straight into a sentence. */
export function settingPhrase(setting) {
  return PHRASE[setting] || '';
}

// Places you are ON rather than IN: lakes, islands and a couple of spits.
const ON_PLACES = /^(lake |lago |ibiza|mallorca|menorca|tenerife|sardinia|sylt|rügen|rugen|hilton head|nantucket|isle of|sullivans)/i;

/** "on Lake Garda", "in the Portes du Soleil", "in Mexico". */
export function placePhrase(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  return `${ON_PLACES.test(n) ? 'on' : 'in'} ${n}`;
}
