#!/usr/bin/env node
/**
 * One-time script: corrects known region errors in properties.json
 * Run: node scripts/fix-regions.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/properties.json');
const props = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let fixed = 0;

// ── Rules: city substring → correct region ────────────────────────────────
const CITY_REGION_FIXES = [
  // Wrong US states
  { cityMatch: /hilton head/i,             country: 'USA', correctRegion: 'South Carolina' },
  { cityMatch: /scottsdale/i,              country: 'USA', correctRegion: 'Arizona' },
  { cityMatch: /sedona/i,                  country: 'USA', correctRegion: 'Arizona' },
  { cityMatch: /phoenix/i,                 country: 'USA', correctRegion: 'Arizona' },
  { cityMatch: /jackson hole/i,            country: 'USA', correctRegion: 'Wyoming' },
  { cityMatch: /nantucket/i,               country: 'USA', correctRegion: 'Massachusetts' },
  { cityMatch: /martha.?s vineyard/i,      country: 'USA', correctRegion: 'Massachusetts' },
  { cityMatch: /avalon/i,                  country: 'USA', correctRegion: 'New Jersey' },
  { cityMatch: /stone harbor/i,            country: 'USA', correctRegion: 'New Jersey' },
  { cityMatch: /sullivans island/i,        country: 'USA', correctRegion: 'South Carolina' },
  { cityMatch: /sullivan.?s island/i,      country: 'USA', correctRegion: 'South Carolina' },
  { cityMatch: /charleston/i,              country: 'USA', correctRegion: 'South Carolina' },
  { cityMatch: /savannah/i,                country: 'USA', correctRegion: 'Georgia' },

  // Mexico missing regions
  { cityMatch: /cabo san lucas/i,          country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /san jos[eé] del? cabo/i,   country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /san jose corridor/i,       country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /corredor tur/i,            country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /baja california/i,         country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /los cabos/i,               country: 'MEX', correctRegion: 'Baja California Sur' },
  { cityMatch: /bahia de banderas/i,       country: 'MEX', correctRegion: 'Jalisco' },
  { cityMatch: /puerto vallarta/i,         country: 'MEX', correctRegion: 'Jalisco' },
  { cityMatch: /punta mita/i,              country: 'MEX', correctRegion: 'Nayarit' },
  { cityMatch: /sayulita/i,                country: 'MEX', correctRegion: 'Nayarit' },
  { cityMatch: /mexico city/i,             country: 'MEX', correctRegion: 'Mexico City' },
  { cityMatch: /tulum/i,                   country: 'MEX', correctRegion: 'Quintana Roo' },
  { cityMatch: /playa del carmen/i,        country: 'MEX', correctRegion: 'Quintana Roo' },
  { cityMatch: /cancun/i,                  country: 'MEX', correctRegion: 'Quintana Roo' },
  { cityMatch: /riviera maya/i,            country: 'MEX', correctRegion: 'Quintana Roo' },
  { cityMatch: /oaxaca/i,                  country: 'MEX', correctRegion: 'Oaxaca' },
  { cityMatch: /san miguel/i,              country: 'MEX', correctRegion: 'Guanajuato' },
];

for (const p of props) {
  const city = p.city || '';
  const country = (p.country || '').toUpperCase();

  for (const rule of CITY_REGION_FIXES) {
    const countryMatch = rule.country === 'MEX'
      ? (country === 'MEX' || country === 'MEXICO')
      : (country === rule.country || country === 'USA' || country === 'US');

    if (rule.cityMatch.test(city) && countryMatch) {
      if (p.region !== rule.correctRegion) {
        console.log(`FIX: "${p.title}"`);
        console.log(`     city="${city}" country="${p.country}"`);
        console.log(`     region: "${p.region}" → "${rule.correctRegion}"\n`);
        p.region = rule.correctRegion;
        fixed++;
      }
      break;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(props, null, 2), 'utf8');
console.log(`\n✓ Fixed ${fixed} properties. Saved to lib/properties.json`);
