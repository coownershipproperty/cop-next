#!/usr/bin/env node
/**
 * Translate property titles EN → DE using a hand-written deterministic
 * mapping table. No API calls — every German word in here was chosen by
 * the maintainer (Claude/David) and applies mechanically across the
 * 347-property catalogue.
 *
 * Title pattern (verified across all 347):
 *   "<City>, <Region>, <Country> — <N>-Bed <Type> With <Feature>"
 *   "<City>, <Country> — <N>-Bed <Type> With <Feature>"   (no region)
 *   "<City>, <Country> — <N>-Bed <Type>"                  (no feature)
 *
 * The script translates Country / Region / Type / Feature tokens, leaves
 * the city name intact, and rebuilds the German title using the standard
 * German pattern:
 *   "<City>, <Region (DE)>, <Country (DE)> — <N>-Schlafzimmer-<Type (DE)> Mit <Feature (DE)>"
 *
 * Usage:
 *   ANTHROPIC_API_KEY unused; SUPABASE_SERVICE_ROLE_KEY required.
 *   node scripts/translate-titles-de.js [--dry-run] [--limit=N]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = (args.find(a => a.startsWith('--limit=')) || '').split('=')[1] ? parseInt(args.find(a => a.startsWith('--limit=')).split('=')[1], 10) : null;

// ── Translation tables ──────────────────────────────────────────────────
// Countries (EN → DE)
const COUNTRY_DE = {
  'Spain': 'Spanien',
  'France': 'Frankreich',
  'Italy': 'Italien',
  'Portugal': 'Portugal',
  'Germany': 'Deutschland',
  'Austria': 'Österreich',
  'England': 'England',
  'United Kingdom': 'Vereinigtes Königreich',
  'UK': 'Großbritannien',
  'USA': 'USA',
  'United States': 'USA',
  'Mexico': 'Mexiko',
  'Croatia': 'Kroatien',
  'Sweden': 'Schweden',
  'Switzerland': 'Schweiz',
  'Netherlands': 'Niederlande',
};

// Regions (EN → DE). Most stay in their original form (Mallorca, Ibiza, Sardinia,
// etc. are not translated in German). The ones below have established German
// names that differ from the English/local form.
const REGION_DE = {
  'Mallorca': 'Mallorca',
  'Majorca': 'Mallorca',
  'Ibiza': 'Ibiza',
  'Menorca': 'Menorca',
  'Formentera': 'Formentera',
  'Tenerife': 'Teneriffa',
  'Gran Canaria': 'Gran Canaria',
  'Lanzarote': 'Lanzarote',
  'Fuerteventura': 'Fuerteventura',
  'Sardinia': 'Sardinien',
  'Sicily': 'Sizilien',
  'Tuscany': 'Toskana',
  'Liguria': 'Ligurien',
  'Lombardy': 'Lombardei',
  'South Tyrol': 'Südtirol',
  'Veneto': 'Venetien',
  'Lake Como': 'Comer See',
  'Lake Garda': 'Gardasee',
  'Lake Maggiore': 'Lago Maggiore',
  'Andalusia': 'Andalusien',
  'Andalucia': 'Andalusien',
  'Andalucía': 'Andalusien',
  'Catalonia': 'Katalonien',
  'Cataluña': 'Katalonien',
  'Costa Brava': 'Costa Brava',
  'Costa del Sol': 'Costa del Sol',
  'Costa Blanca': 'Costa Blanca',
  'Costa de la Luz': 'Costa de la Luz',
  'Balearic Islands': 'Balearen',
  'Canary Islands': 'Kanarische Inseln',
  'Algarve': 'Algarve',
  'Madeira': 'Madeira',
  'Azores': 'Azoren',
  'Lisbon': 'Lissabon',
  'Côte d\'Azur': 'Côte d\'Azur',
  'French Alps': 'Französische Alpen',
  'Provence': 'Provence',
  'Normandy': 'Normandie',
  'Brittany': 'Bretagne',
  'Bavaria': 'Bayern',
  'Baltic Sea': 'Ostsee',
  'North Sea': 'Nordsee',
  'Rügen': 'Rügen',
  'Sylt': 'Sylt',
  'Black Forest': 'Schwarzwald',
  'Tyrol': 'Tirol',
  'Tirol': 'Tirol',
  'Salzburg': 'Salzburger Land',
  'Vienna': 'Wien',
  'Vorarlberg': 'Vorarlberg',
  'Adriatic Coast': 'Adriaküste',
  'Dalmatia': 'Dalmatien',
  'Istria': 'Istrien',
  'California': 'Kalifornien',
  'Colorado': 'Colorado',
  'Florida': 'Florida',
  'Utah': 'Utah',
  'Hawaii': 'Hawaii',
  'New York': 'New York',
  'Lake Tahoe': 'Lake Tahoe',
  'Aspen': 'Aspen',
  'Park City': 'Park City',
  'Riviera Maya': 'Riviera Maya',
  'Los Cabos': 'Los Cabos',
  'Stockholm': 'Stockholm',
  'Paris': 'Paris',
  'Sussex': 'Sussex',
  'Cornwall': 'Cornwall',
  'Cotswolds': 'Cotswolds',
  'London': 'London',
};

// Property types (EN → DE)
const TYPE_DE = {
  'Villa': 'Villa',
  'Apartment': 'Apartment',
  'House': 'Haus',
  'Townhouse': 'Stadthaus',
  'Penthouse': 'Penthouse',
  'Chalet': 'Chalet',
  'Finca': 'Finca',
  'Cottage': 'Cottage',
  'Loft': 'Loft',
  'Studio': 'Studio',
  'Cabin': 'Hütte',
  'Estate': 'Landgut',
  'Mansion': 'Anwesen',
  'Farmhouse': 'Bauernhaus',
  'Bungalow': 'Bungalow',
  'Duplex': 'Maisonette',
  'Condo': 'Eigentumswohnung',
  'Condominium': 'Eigentumswohnung',
  'Manor': 'Herrenhaus',
};

// Features (EN → DE) — order matters: longer compound features first so
// "Infinity Pool" matches before "Pool", "Sea Views" before "Sea", etc.
const FEATURE_DE = [
  ['Infinity Pool', 'Infinity-Pool'],
  ['Heated Pool', 'beheiztem Pool'],
  ['Private Pool', 'privatem Pool'],
  ['Rooftop Pool', 'Dach-Pool'],
  ['Indoor Pool', 'Innenpool'],
  ['Sea Views', 'Meerblick'],
  ['Sea View', 'Meerblick'],
  ['Ocean Views', 'Meerblick'],
  ['Ocean View', 'Meerblick'],
  ['Lake Views', 'Seeblick'],
  ['Lake View', 'Seeblick'],
  ['Mountain Views', 'Bergblick'],
  ['Mountain View', 'Bergblick'],
  ['Panoramic Views', 'Panoramablick'],
  ['Beach Access', 'Strandzugang'],
  ['Private Beach', 'Privatstrand'],
  ['Ski-In Ski-Out', 'Ski-In Ski-Out'],
  ['Ski In Ski Out', 'Ski-In Ski-Out'],
  ['Hot Tub', 'Whirlpool'],
  ['Wine Cellar', 'Weinkeller'],
  ['Tennis Court', 'Tennisplatz'],
  ['Private Garden', 'privatem Garten'],
  ['Roof Terrace', 'Dachterrasse'],
  ['Large Terrace', 'großer Terrasse'],
  ['Garage', 'Garage'],
  ['Pool', 'Pool'],
  ['Garden', 'Garten'],
  ['Sauna', 'Sauna'],
  ['Fireplace', 'Kamin'],
  ['Terrace', 'Terrasse'],
  ['Balcony', 'Balkon'],
  ['Gym', 'Fitnessraum'],
  ['Spa', 'Spa'],
  ['Cinema Room', 'Kinoraum'],
  ['Concierge', 'Concierge-Service'],
  ['Boat Mooring', 'Bootsanlegestelle'],
  ['Lift', 'Aufzug'],
  ['Elevator', 'Aufzug'],
];

function translateCountry(s) { return COUNTRY_DE[s] || s; }
function translateRegion(s)  { return REGION_DE[s] || s; }
function translateType(s)    { return TYPE_DE[s] || s; }
function translateFeature(s) {
  for (const [en, de] of FEATURE_DE) {
    if (s.toLowerCase() === en.toLowerCase()) return de;
  }
  return s;
}

// Parse the title pattern into parts.
function parseTitle(title) {
  // Split on em-dash (—) or hyphen with spaces (" - ")
  const parts = title.split(/\s+—\s+|\s+-\s+/);
  if (parts.length !== 2) return null;
  const [locationPart, typePart] = parts;
  const locParts = locationPart.split(/,\s*/).map(s => s.trim()).filter(Boolean);
  // typePart looks like "5-Bed Villa With Pool" or "Villa With Pool" or "5-Bed Villa"
  const m = typePart.match(/^(?:(\d+)-Bed\s+)?([A-Za-zÀ-ÿ'\- ]+?)(?:\s+With\s+(.+))?$/);
  if (!m) return null;
  const beds = m[1] ? parseInt(m[1], 10) : null;
  const type = m[2].trim();
  const feature = m[3] ? m[3].trim() : null;
  return { locParts, beds, type, feature };
}

function buildGermanTitle(parsed) {
  const { locParts, beds, type, feature } = parsed;
  // Translate the last loc element (country) and the second-to-last (region)
  let germanLoc = [...locParts];
  if (germanLoc.length >= 1) {
    germanLoc[germanLoc.length - 1] = translateCountry(germanLoc[germanLoc.length - 1]);
  }
  if (germanLoc.length >= 2) {
    germanLoc[germanLoc.length - 2] = translateRegion(germanLoc[germanLoc.length - 2]);
  }
  // City stays as-is (germanLoc[0])

  let germanType = translateType(type);
  let bedsPart = '';
  if (beds) {
    // "5-Bed Villa" → "Villa Mit 5 Schlafzimmern"
    bedsPart = ` Mit ${beds} Schlafzimmer${beds === 1 ? '' : 'n'}`;
  }
  let featurePart = '';
  if (feature) {
    const germanFeature = translateFeature(feature);
    if (beds) {
      // Already has "Mit N Schlafzimmern" — append " Und German feature"
      featurePart = ` Und ${germanFeature}`;
    } else {
      featurePart = ` Mit ${germanFeature}`;
    }
  }
  return `${germanLoc.join(', ')} — ${germanType}${bedsPart}${featurePart}`;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  let q = supabase.from('properties').select('slug, title, title_de').order('slug');
  if (LIMIT) q = q.limit(LIMIT);
  const { data: rows, error } = await q;
  if (error) { console.error(error); process.exit(1); }

  const updates = [];
  const skipped = [];
  for (const row of rows) {
    if (row.title_de && !args.includes('--force')) continue;
    const parsed = parseTitle(row.title || '');
    if (!parsed) {
      skipped.push({ slug: row.slug, reason: 'unparseable', title: row.title });
      continue;
    }
    const titleDe = buildGermanTitle(parsed);
    updates.push({ slug: row.slug, en: row.title, de: titleDe });
  }

  console.log(`Total: ${rows.length}`);
  console.log(`To update: ${updates.length}`);
  console.log(`Skipped (unparseable): ${skipped.length}`);
  console.log('\nFirst 8 translations:');
  for (const u of updates.slice(0, 8)) {
    console.log(`  EN: ${u.en}`);
    console.log(`  DE: ${u.de}\n`);
  }
  if (skipped.length) {
    console.log('\nSkipped:');
    for (const s of skipped.slice(0, 8)) {
      console.log(`  [${s.slug}] ${s.reason}: ${s.title}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: no DB writes');
    return;
  }

  let n = 0;
  for (const u of updates) {
    const { error: e } = await supabase
      .from('properties')
      .update({ title_de: u.de })
      .eq('slug', u.slug);
    if (e) console.error(`UPDATE failed for ${u.slug}:`, e.message);
    else n++;
  }
  console.log(`\nWrote ${n} of ${updates.length} title_de values.`);
}

main().catch(e => { console.error(e); process.exit(1); });
