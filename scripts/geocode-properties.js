#!/usr/bin/env node
/**
 * geocode-properties.js
 * Fills in missing lat/lng for properties using Nominatim (OpenStreetMap).
 * Rate-limited to 1 req/sec per Nominatim's usage policy.
 *
 * Usage:  node scripts/geocode-properties.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_PATH = path.join(__dirname, '..', 'lib', 'properties.json');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'COP-Next/1.0 (co-ownership-property.com geocoder)' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocode(city, region, country) {
  // Try progressively broader queries until we get a result
  const queries = [
    [city, region, country].filter(Boolean).join(', '),
    [city, country].filter(Boolean).join(', '),
    [region, country].filter(Boolean).join(', '),
  ];

  for (const q of queries) {
    if (!q.trim()) continue;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    try {
      const results = await fetchJSON(url);
      if (results && results[0]) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), query: q };
      }
    } catch (e) {
      console.warn('  geocode error:', e.message);
    }
    await sleep(1100); // Nominatim: max 1 req/sec
  }
  return null;
}

async function main() {
  const props = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  const missing = props.filter(p => !p.lat || !p.lng);
  console.log(`Geocoding ${missing.length} properties missing lat/lng…`);

  let updated = 0;
  let failed = 0;

  for (const p of missing) {
    process.stdout.write(`  ${p.city || p.region}, ${p.country}… `);
    const result = await geocode(p.city, p.region, p.country);
    if (result) {
      p.lat = result.lat;
      p.lng = result.lng;
      console.log(`✓ (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}) via "${result.query}"`);
      updated++;
    } else {
      console.log('✗ not found');
      failed++;
    }
    await sleep(1100); // stay within Nominatim rate limit
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(props, null, 2));
  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
