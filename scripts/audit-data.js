#!/usr/bin/env node
/**
 * Data quality audit for properties.json
 * Flags likely errors: wrong region/country combos, missing critical fields, etc.
 */

const fs = require('fs');
const path = require('path');

const props = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../lib/properties.json'), 'utf8')
);

// ── Known US states (full name and abbreviation) ──────────────────────────
const US_STATES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};
const STATE_NAMES = Object.keys(US_STATES);
const STATE_ABBRS = Object.values(US_STATES);

// City → correct US state (known anchors)
const CITY_STATE = {
  'avalon': 'New Jersey', 'stone harbor': 'New Jersey', 'cape may': 'New Jersey',
  'ocean city': 'New Jersey', 'long beach island': 'New Jersey',
  'miami': 'Florida', 'miami beach': 'Florida', 'key west': 'Florida',
  'orlando': 'Florida', 'naples': 'Florida', 'sarasota': 'Florida',
  'palm beach': 'Florida', 'boca raton': 'Florida', 'fort lauderdale': 'Florida',
  'destin': 'Florida', 'santa rosa beach': 'Florida', '30a': 'Florida',
  'aspen': 'Colorado', 'telluride': 'Colorado', 'vail': 'Colorado',
  'breckenridge': 'Colorado', 'steamboat springs': 'Colorado',
  'park city': 'Utah', 'st george': 'Utah',
  'scottsdale': 'Arizona', 'sedona': 'Arizona', 'phoenix': 'Arizona',
  'lake tahoe': 'California', 'napa': 'California', 'malibu': 'California',
  'palm springs': 'California', 'carmel': 'California', 'los angeles': 'California',
  'santa barbara': 'California', 'san diego': 'California',
  'nashville': 'Tennessee', 'memphis': 'Tennessee',
  'charleston': 'South Carolina', 'hilton head': 'South Carolina',
  'savannah': 'Georgia', 'atlanta': 'Georgia',
  'new orleans': 'Louisiana',
  'austin': 'Texas', 'dallas': 'Texas', 'houston': 'Texas',
  'hamptons': 'New York', 'southampton': 'New York', 'montauk': 'New York',
  'nantucket': 'Massachusetts', 'marthas vineyard': 'Massachusetts',
  'jackson hole': 'Wyoming',
  'stowe': 'Vermont',
};

// ── Known Europe countries and some city anchors ──────────────────────────
const EU_COUNTRIES = [
  'Spain', 'France', 'Italy', 'Portugal', 'Greece', 'Germany',
  'Switzerland', 'Austria', 'Croatia', 'Montenegro', 'Netherlands',
  'Belgium', 'Sweden', 'Norway', 'Denmark', 'United Kingdom', 'UK',
];

// ── Valid partners ────────────────────────────────────────────────────────
const VALID_PARTNERS = ['Pacaso', 'Andhamlet', 'Vivla', 'Myne'];

// ── Collect issues ────────────────────────────────────────────────────────
const issues = [];

function flag(p, category, message) {
  issues.push({
    slug: p.slug,
    title: p.title,
    partner: p.partner,
    country: p.country,
    region: p.region,
    city: p.city,
    category,
    message,
  });
}

for (const p of props) {
  const cityLower = (p.city || '').toLowerCase().trim();
  const regionLower = (p.region || '').toLowerCase().trim();
  const countryLower = (p.country || '').toLowerCase().trim();

  // ── Missing critical fields ──
  if (!p.title)   flag(p, 'MISSING', 'No title');
  if (!p.country) flag(p, 'MISSING', 'No country');
  if (!p.city)    flag(p, 'MISSING', 'No city');
  if (!p.region)  flag(p, 'MISSING', 'No region');
  if (!p.price)   flag(p, 'MISSING', 'No price');
  if (!p.beds)    flag(p, 'MISSING', 'No beds');
  if (!p.img && (!p.images || p.images.length === 0)) flag(p, 'MISSING', 'No images');

  // ── US-specific checks ──
  if (countryLower === 'usa' || countryLower === 'united states' || countryLower === 'us') {
    // Region should be a valid US state name
    const regionIsState = STATE_NAMES.some(s => s.toLowerCase() === regionLower);
    const regionIsAbbr = STATE_ABBRS.some(a => a.toLowerCase() === regionLower);
    if (!regionIsState && !regionIsAbbr) {
      flag(p, 'WRONG_REGION', `US property but region "${p.region}" is not a US state`);
    }

    // City-based state cross-check
    for (const [knownCity, correctState] of Object.entries(CITY_STATE)) {
      if (cityLower.includes(knownCity)) {
        const correctStateLower = correctState.toLowerCase();
        if (regionLower !== correctStateLower && regionLower !== US_STATES[correctState]?.toLowerCase()) {
          flag(p, 'WRONG_STATE', `City "${p.city}" should be in ${correctState}, but region is "${p.region}"`);
        }
        break;
      }
    }
  }

  // ── Non-US property listed with a US state as region ──
  if (countryLower !== 'usa' && countryLower !== 'united states' && countryLower !== 'us') {
    const regionIsUSState = STATE_NAMES.some(s => s.toLowerCase() === regionLower);
    if (regionIsUSState) {
      flag(p, 'WRONG_REGION', `Non-US country "${p.country}" but region "${p.region}" is a US state`);
    }
  }

  // ── Slug looks like external URL ──
  if ((p.slug || '').startsWith('http')) {
    flag(p, 'BAD_SLUG', `Slug is a URL: ${p.slug}`);
  }

  // ── Partner check ──
  if (p.partner && !VALID_PARTNERS.some(vp => p.partner.toLowerCase().includes(vp.toLowerCase()))) {
    flag(p, 'UNKNOWN_PARTNER', `Unrecognised partner: "${p.partner}"`);
  }
}

// ── Print report ──────────────────────────────────────────────────────────
const byCategory = {};
for (const iss of issues) {
  if (!byCategory[iss.category]) byCategory[iss.category] = [];
  byCategory[iss.category].push(iss);
}

console.log(`\n========================================`);
console.log(`  DATA QUALITY AUDIT — ${props.length} properties`);
console.log(`========================================\n`);

for (const [cat, list] of Object.entries(byCategory)) {
  console.log(`── ${cat} (${list.length}) ─────────────────────`);
  for (const iss of list) {
    console.log(`  [${iss.partner || '?'}] ${iss.title}`);
    console.log(`    city="${iss.city}" region="${iss.region}" country="${iss.country}"`);
    console.log(`    ⚠  ${iss.message}`);
    console.log(`    slug: ${iss.slug}`);
    console.log();
  }
}

console.log(`========================================`);
console.log(`  TOTAL ISSUES: ${issues.length} across ${Object.keys(byCategory).length} categories`);
console.log(`========================================\n`);

// Also write a CSV for easy fixing in sheets
const csvLines = [
  'slug,title,partner,country,region,city,category,message'
];
for (const iss of issues) {
  const row = [iss.slug, iss.title, iss.partner, iss.country, iss.region, iss.city, iss.category, iss.message]
    .map(v => `"${(v||'').replace(/"/g,'""')}"`)
    .join(',');
  csvLines.push(row);
}
const csvPath = path.join(__dirname, '../lib/audit-report.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
console.log(`CSV saved to lib/audit-report.csv\n`);
