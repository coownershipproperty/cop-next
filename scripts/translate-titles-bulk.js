#!/usr/bin/env node
/**
 * scripts/translate-titles-bulk.js
 *
 * Programmatically translates every property title to ES + FR by parsing the
 * formulaic English title and rebuilding it from translated components.
 * Title pattern is consistent across the catalog:
 *
 *   "{City}, {Region}, {Country} — {N}-Bed {Type} With {Feature}"
 *
 * No AI or external API needed — just string mapping. Run with:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/translate-titles-bulk.js
 *
 * Idempotent — only updates rows where title_es / title_fr is NULL unless
 * --force is passed.
 */

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const BASE = `${SUPABASE_URL}/rest/v1`;
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_ROLE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

// ── Translation tables ─────────────────────────────────────────────────────

const COUNTRIES = {
  Austria:    { es: 'Austria',     fr: 'Autriche' },
  Croatia:    { es: 'Croacia',     fr: 'Croatie' },
  England:    { es: 'Inglaterra',  fr: 'Angleterre' },
  France:     { es: 'Francia',     fr: 'France' },
  Germany:    { es: 'Alemania',    fr: 'Allemagne' },
  Italy:      { es: 'Italia',      fr: 'Italie' },
  Mexico:     { es: 'México',      fr: 'Mexique' },
  Portugal:   { es: 'Portugal',    fr: 'Portugal' },
  Spain:      { es: 'España',      fr: 'Espagne' },
  Sweden:     { es: 'Suecia',      fr: 'Suède' },
  USA:        { es: 'EE. UU.',     fr: 'États-Unis' },
};

const REGIONS = {
  // Spain
  'Mallorca':         { es: 'Mallorca',        fr: 'Majorque' },
  'Ibiza':            { es: 'Ibiza',           fr: 'Ibiza' },
  'Menorca':          { es: 'Menorca',         fr: 'Minorque' },
  'Formentera':       { es: 'Formentera',      fr: 'Formentera' },
  'Tenerife':         { es: 'Tenerife',        fr: 'Tenerife' },
  'Costa del Sol':    { es: 'Costa del Sol',   fr: 'Costa del Sol' },
  'Costa Blanca':     { es: 'Costa Blanca',    fr: 'Costa Blanca' },
  'Costa de la Luz':  { es: 'Costa de la Luz', fr: 'Costa de la Luz' },
  'Madrid':           { es: 'Madrid',          fr: 'Madrid' },
  'Barcelona':        { es: 'Barcelona',       fr: 'Barcelone' },
  'Baqueira':         { es: 'Baqueira',        fr: 'Baqueira' },
  'Canary Islands':   { es: 'Islas Canarias',  fr: 'Îles Canaries' },
  'Balearic Islands': { es: 'Islas Baleares',  fr: 'Îles Baléares' },
  // France
  'Paris':            { es: 'París',           fr: 'Paris' },
  "Côte d'Azur":      { es: 'Costa Azul',      fr: "Côte d'Azur" },
  'French Alps':      { es: 'Alpes franceses', fr: 'Alpes françaises' },
  'Portes du Soleil': { es: 'Portes du Soleil',fr: 'Portes du Soleil' },
  // Italy
  'Italian Lakes':    { es: 'Lagos italianos', fr: 'Lacs italiens' },
  'Lake Como':        { es: 'Lago de Como',    fr: 'Lac de Côme' },
  'Lake Garda':       { es: 'Lago de Garda',   fr: 'Lac de Garde' },
  'Lago Maggiore':    { es: 'Lago Mayor',      fr: 'Lac Majeur' },
  'Liguria':          { es: 'Liguria',         fr: 'Ligurie' },
  'Sardinia':         { es: 'Cerdeña',         fr: 'Sardaigne' },
  'Tuscany':          { es: 'Toscana',         fr: 'Toscane' },
  // USA
  'California':       { es: 'California',      fr: 'Californie' },
  'Colorado':         { es: 'Colorado',        fr: 'Colorado' },
  'Florida':          { es: 'Florida',         fr: 'Floride' },
  'Utah':             { es: 'Utah',            fr: 'Utah' },
  'Hawaii':           { es: 'Hawái',           fr: 'Hawaï' },
  'New York':         { es: 'Nueva York',      fr: 'New York' },
  'Texas':            { es: 'Texas',           fr: 'Texas' },
  // UK
  'London':           { es: 'Londres',         fr: 'Londres' },
  'England':          { es: 'Inglaterra',      fr: 'Angleterre' },
  'Cotswolds':        { es: 'Cotswolds',       fr: 'Cotswolds' },
  // Austria
  'Tyrol':            { es: 'Tirol',           fr: 'Tyrol' },
  'Vorarlberg':       { es: 'Vorarlberg',      fr: 'Vorarlberg' },
  'Pinzgau':          { es: 'Pinzgau',         fr: 'Pinzgau' },
  'Salzburg':         { es: 'Salzburgo',       fr: 'Salzbourg' },
  'Salzburger Land':  { es: 'Salzburger Land', fr: 'Salzburger Land' },
  // Croatia
  'Istria':           { es: 'Istria',          fr: 'Istrie' },
  // Germany
  'Bavaria':          { es: 'Baviera',         fr: 'Bavière' },
  'Berlin':           { es: 'Berlín',          fr: 'Berlin' },
  // Mexico
  'Yucatán':          { es: 'Yucatán',         fr: 'Yucatán' },
  'Baja California':  { es: 'Baja California', fr: 'Basse-Californie' },
  'Quintana Roo':     { es: 'Quintana Roo',    fr: 'Quintana Roo' },
  // Portugal
  'Algarve':          { es: 'Algarve',         fr: 'Algarve' },
  'Lisbon':           { es: 'Lisboa',          fr: 'Lisbonne' },
  // Sweden
  'Stockholm':        { es: 'Estocolmo',       fr: 'Stockholm' },
};

const TYPES = {
  apartment: { es: 'Apartamento',  fr: 'Appartement' },
  house:     { es: 'Casa',         fr: 'Maison' },
  villa:     { es: 'Villa',        fr: 'Villa' },
  penthouse: { es: 'Ático',        fr: 'Penthouse' },
  chalet:    { es: 'Chalet',       fr: 'Chalet' },
  cabin:     { es: 'Cabaña',       fr: 'Cabane' },
  cottage:   { es: 'Casita',       fr: 'Cottage' },
  townhouse: { es: 'Casa adosada', fr: 'Maison de ville' },
  finca:     { es: 'Finca',        fr: 'Finca' },
};

// Features come after "With ..." in the suffix. Order longer phrases first
// so they match before shorter substrings (e.g. "Sea View & Heated Pool"
// before "Sea View").
const FEATURES = [
  ['Sea View & Heated Pool',    { es: 'vistas al mar y piscina climatizada', fr: 'vue mer et piscine chauffée' }],
  ['Sea Views & Heated Pool',   { es: 'vistas al mar y piscina climatizada', fr: 'vue mer et piscine chauffée' }],
  ['Pool & Sea Views',          { es: 'piscina y vistas al mar',             fr: 'piscine et vue mer' }],
  ['Pool & Sea View',           { es: 'piscina y vistas al mar',             fr: 'piscine et vue mer' }],
  ['Sea View and Pool',         { es: 'vistas al mar y piscina',             fr: 'vue mer et piscine' }],
  ['Sea Views and Pool',        { es: 'vistas al mar y piscina',             fr: 'vue mer et piscine' }],
  ['Pool and Sea Views',        { es: 'piscina y vistas al mar',             fr: 'piscine et vue mer' }],
  ['Beach Access',              { es: 'acceso a la playa',                   fr: 'accès plage' }],
  ['Infinity Pool',             { es: 'piscina infinita',                    fr: 'piscine à débordement' }],
  ['Heated Pool',               { es: 'piscina climatizada',                 fr: 'piscine chauffée' }],
  ['Mountain Views',            { es: 'vistas a la montaña',                 fr: 'vue sur la montagne' }],
  ['Mountain View',             { es: 'vistas a la montaña',                 fr: 'vue sur la montagne' }],
  ['Lake Views',                { es: 'vistas al lago',                      fr: 'vue sur le lac' }],
  ['Lake View',                 { es: 'vistas al lago',                      fr: 'vue sur le lac' }],
  ['Sea Views',                 { es: 'vistas al mar',                       fr: 'vue mer' }],
  ['Sea View',                  { es: 'vistas al mar',                       fr: 'vue mer' }],
  ['Hot Tub',                   { es: 'jacuzzi',                             fr: 'jacuzzi' }],
  ['Ski-in/Ski-out',            { es: 'ski-in/ski-out',                      fr: 'ski au pied' }],
  ['Ski In/Ski Out',            { es: 'ski-in/ski-out',                      fr: 'ski au pied' }],
  ['Fireplace',                 { es: 'chimenea',                            fr: 'cheminée' }],
  ['Sauna',                     { es: 'sauna',                               fr: 'sauna' }],
  ['Garden',                    { es: 'jardín',                              fr: 'jardin' }],
  ['Terrace',                   { es: 'terraza',                             fr: 'terrasse' }],
  ['Pool',                      { es: 'piscina',                             fr: 'piscine' }],
  ['Marina',                    { es: 'marina',                              fr: 'marina' }],
  ['Golf',                      { es: 'golf',                                fr: 'golf' }],
];

// "Bed/Beds" rendering per locale. Capitalised for marketing title-case parity
// with the English "{N}-Bed" style — Spanish/French nouns get capitalised but
// stop-words ("de", "con", "avec") stay lowercase via titleCaseSuffix() below.
function bedsText(n, locale) {
  if (locale === 'es') return `${n} Dormitorio${n === 1 ? '' : 's'}`;
  if (locale === 'fr') return `${n} Chambre${n === 1 ? '' : 's'}`;
  return `${n}-Bed`;
}

// Marketing title-case for ES/FR suffixes: capitalise every word except a small
// set of articles / prepositions / conjunctions. Matches Spanish & French
// editorial convention while keeping nouns prominent (e.g. "Villa de 3
// Dormitorios con Piscina" / "Penthouse de 3 Chambres avec Piscine"). Also
// recurses across '/' so "ski-in/ski-out" → "Ski-in/Ski-out".
const ES_STOP = new Set(['de','del','con','en','a','al','y','o','la','el','los','las','un','una','sin','sobre','para','por']);
const FR_STOP = new Set(['de','du','des','à','au','aux','en','sur','avec','sans','pour','dans','par','le','la','les','un','une','et','ou']);
function titleCaseWord(w) {
  if (!w) return w;
  return w.split('/').map(p => p.length ? p[0].toUpperCase() + p.slice(1) : p).join('/');
}
function titleCaseSuffix(suffix, locale) {
  if (locale !== 'es' && locale !== 'fr') return suffix;
  const stop = locale === 'es' ? ES_STOP : FR_STOP;
  return suffix.split(/\s+/).map((w, i) => {
    const lower = w.toLowerCase();
    if (i > 0 && stop.has(lower)) return lower;
    return titleCaseWord(w);
  }).join(' ');
}

// Translate the property type in title-case ("Apartamento" / "Appartement").
function typeText(type, locale) {
  const key = (type || '').toLowerCase().trim();
  if (TYPES[key]) return TYPES[key][locale];
  // Capitalise raw English fallback so we don't crash on unknown types.
  return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '';
}

// Try to translate a feature phrase using the lookup table. Returns null if
// no match — caller falls back to original English.
function featureText(feature, locale) {
  const trimmed = (feature || '').trim();
  for (const [en, lang] of FEATURES) {
    if (en.toLowerCase() === trimmed.toLowerCase()) return lang[locale];
  }
  return null;
}

// Translate a single name (city, region, or country). Country/region tables
// override; otherwise return the original (most cities are proper nouns
// preserved across locales).
function translateName(name, locale) {
  if (!name) return name;
  if (COUNTRIES[name]) return COUNTRIES[name][locale];
  if (REGIONS[name])   return REGIONS[name][locale];
  return name;
}

/**
 * Translate the prefix (everything before the em-dash):
 *   "Brixen, Tyrol, Austria"  → "Brixen, Tirol, Austria" (es)
 *   "London, England"          → "Londres, Inglaterra"   (es)
 */
function translatePrefix(prefix, locale) {
  return prefix
    .split(',')
    .map(part => translateName(part.trim(), locale))
    .join(', ');
}

/**
 * Translate the suffix:
 *   "2-Bed Apartment With Sauna" → "Apartamento de 2 dormitorios con sauna"
 *   "3-Bed Villa With Pool"      → "Villa de 3 chambres avec piscine"
 *   "4-Bed House"                → "Casa de 4 dormitorios"
 */
function translateSuffix(suffix, locale) {
  // Capture: N, type word(s), optional " With <feature>" or " Ski-in/Ski-out"
  const m = suffix.match(/^(\d+)-Bed\s+(.+?)(?:\s+With\s+(.+))?$/i);
  if (!m) {
    // Couldn't parse — return as-is. Logged below.
    return null;
  }
  const beds = parseInt(m[1], 10);
  const typeRaw = m[2].replace(/\s+Ski-in\/Ski-out$/i, '').trim();
  const skiInOut = /\s+Ski-in\/Ski-out$/i.test(m[2]);
  const featureRaw = m[3] || (skiInOut ? 'Ski-in/Ski-out' : null);

  const typeStr = typeText(typeRaw, locale);
  const bedsStr = bedsText(beds, locale);
  const withWord = locale === 'es' ? 'con' : 'avec';

  let suffixOut;
  if (locale === 'es' || locale === 'fr') {
    // Format: "{Type} de {N} dormitorios con {feature}"
    //        / "{Type} de {N} chambres avec {feature}"
    suffixOut = `${typeStr} de ${bedsStr}`;
  } else {
    suffixOut = `${beds}-Bed ${typeRaw}`;
  }

  if (featureRaw) {
    const featTranslated = featureText(featureRaw, locale);
    if (featTranslated) {
      suffixOut += ` ${withWord} ${featTranslated}`;
    } else {
      // Fall back to keeping the English feature.
      suffixOut += ` ${withWord} ${featureRaw}`;
    }
  }

  // Apply marketing title-case to the whole suffix (handles feature phrases
  // like "vistas al mar y piscina" → "Vistas al Mar y Piscina").
  return titleCaseSuffix(suffixOut, locale);
}

/** Translate a full property title to the target locale. */
function translateTitle(title, locale) {
  if (!title) return null;
  // Em-dash with surrounding spaces is the canonical separator.
  const idx = title.indexOf(' — ');
  if (idx === -1) return null;
  const prefix = title.slice(0, idx);
  const suffix = title.slice(idx + 3);

  const prefixT = translatePrefix(prefix, locale);
  const suffixT = translateSuffix(suffix, locale);
  if (suffixT === null) return null;

  return `${prefixT} — ${suffixT}`;
}

// ── Supabase REST helpers ──────────────────────────────────────────────────

async function fetchProperties() {
  const url = `${BASE}/properties?select=slug,title,title_es,title_fr&order=slug`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function updateProperty(slug, fields) {
  const url = `${BASE}/properties?slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Update ${slug} failed: ${res.status} ${await res.text()}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`[titles-bulk] Fetching properties from ${SUPABASE_URL}…`);
  const rows = await fetchProperties();
  console.log(`[titles-bulk] ${rows.length} properties fetched`);

  let updated = 0, skipped = 0, failed = 0;
  const failures = [];

  // Build the work list first (rows that actually need an update).
  const work = [];
  for (const r of rows) {
    const needsES = FORCE || !r.title_es;
    const needsFR = FORCE || !r.title_fr;
    if (!needsES && !needsFR) { skipped++; continue; }

    const fields = {};
    if (needsES) {
      const t = translateTitle(r.title, 'es');
      if (t) fields.title_es = t;
      else failures.push({ slug: r.slug, locale: 'es', title: r.title });
    }
    if (needsFR) {
      const t = translateTitle(r.title, 'fr');
      if (t) fields.title_fr = t;
      else failures.push({ slug: r.slug, locale: 'fr', title: r.title });
    }

    if (Object.keys(fields).length === 0) { failed++; continue; }

    if (DRY_RUN) {
      console.log(`[titles-bulk] [DRY] ${r.slug}`);
      console.log(`              EN: ${r.title}`);
      if (fields.title_es) console.log(`              ES: ${fields.title_es}`);
      if (fields.title_fr) console.log(`              FR: ${fields.title_fr}`);
    } else {
      work.push({ slug: r.slug, fields });
    }
  }

  // Execute updates in parallel batches of 20 — fast enough to finish 347
  // rows well inside the 45s sandbox timeout while staying gentle on Supabase.
  const CONCURRENCY = 20;
  for (let i = 0; i < work.length; i += CONCURRENCY) {
    const batch = work.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(w => updateProperty(w.slug, w.fields))
    );
    results.forEach((res, j) => {
      if (res.status === 'fulfilled') updated++;
      else { failed++; console.error(`[titles-bulk] ✗ ${batch[j].slug}: ${res.reason.message}`); }
    });
    if (i + CONCURRENCY < work.length) {
      process.stdout.write(`[titles-bulk] ${updated}/${work.length} updated…\r`);
    }
  }

  console.log(`\n[titles-bulk] Done. updated=${updated} skipped=${skipped} failed=${failed}`);
  if (failures.length) {
    console.log(`[titles-bulk] ${failures.length} titles couldn't be parsed:`);
    failures.slice(0, 20).forEach(f => console.log(`    ${f.locale}  ${f.slug}: "${f.title}"`));
  }
})();
