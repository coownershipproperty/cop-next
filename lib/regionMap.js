/**
 * Maps form-level destination labels → actual DB region/country/city values.
 *
 * The contact form and saved-search form use display labels like "Italian Lakes"
 * or "South of France", but properties in the DB have specific region values
 * like "Lake Como", "Lake Garda", "Côte d'Azur" etc.
 *
 * expandRegions(terms) takes an array of form labels and returns a flat array
 * of the DB terms to use in ilike queries.
 */

const REGION_MAP = {
  // Italy
  'Italian Lakes':    ["Lake Como", "Lake Garda", "Lago Maggiore"],
  'Lake Como':        ["Lake Como"],
  'Lake Garda':       ["Lake Garda"],
  'Lago Maggiore':    ["Lago Maggiore"],
  'Sardinia':         ["Sardinia"],
  'Liguria':          ["Liguria"],
  'Tuscany':          ["Tuscany"],
  'South Tyrol':      ["South Tyrol"],
  'Milan':            ["Milan"],

  // France
  'South of France':  ["Côte d'Azur", "Provence", "France"],
  "Côte d'Azur":      ["Côte d'Azur"],
  'French Alps':      ["French Alps", "Portes du Soleil"],
  'Paris':            ["Paris"],

  // Spain
  'Mallorca':         ["Mallorca"],
  'Ibiza':            ["Ibiza"],
  'Menorca':          ["Menorca"],
  'Balearic Islands': ["Mallorca", "Ibiza", "Menorca"],
  'Costa del Sol':    ["Costa del Sol"],
  'Costa Blanca':     ["Costa Blanca"],
  'Costa de la Luz':  ["Costa de la Luz"],
  'Spanish Costas':   ["Costa del Sol", "Costa Blanca", "Costa de la Luz"],
  'Barcelona':        ["Barcelona"],
  'Madrid':           ["Madrid"],
  'Canary Islands':   ["Tenerife", "Canary Islands"],
  'Pyrenees':         ["Baqueira", "Pyrenees"],

  // Portugal
  'Algarve':          ["Algarve"],
  'Silver Coast':     ["Silver Coast"],

  // Austria / ski
  'Tyrol':            ["Tyrol"],
  'Salzburg':         ["Salzburg", "Salzburger Land"],
  'Vorarlberg':       ["Vorarlberg"],
  'Pinzgau':          ["Pinzgau"],

  // UK
  'Cotswolds':        ["Cotswolds"],
  'London':           ["London"],

  // USA
  'Miami':            ["Miami", "Florida"],
  'Brickell':         ["Brickell", "Florida"],
  'Florida Keys':     ["Florida Keys", "Florida"],
  '30A Emerald Coast':["30A", "Emerald Coast", "Florida"],
  'Park City':        ["Park City", "Utah"],
  'Aspen':            ["Aspen", "Colorado"],
  'Telluride':        ["Telluride", "Colorado"],
  'Malibu':           ["Malibu", "California"],
  'Scottsdale':       ["Scottsdale", "Arizona"],
  'Las Vegas':        ["Las Vegas", "Nevada"],
  'Cape Cod':         ["Massachusetts"],
  'Hamptons':         ["New Jersey"],
  'Jackson Hole':     ["Wyoming"],
};

/**
 * Expand an array of form label strings into DB-level search terms.
 * Falls back to the original term if no mapping found.
 *
 * @param {string[]} labels - array of form destination labels
 * @returns {string[]} deduplicated array of DB search terms
 */
export function expandRegions(labels) {
  const expanded = new Set();
  for (const label of (labels || [])) {
    const mapped = REGION_MAP[label];
    if (mapped) {
      mapped.forEach(t => expanded.add(t));
    } else {
      // No mapping — use the label itself (covers exact matches and new regions)
      expanded.add(label);
    }
  }
  return [...expanded];
}
