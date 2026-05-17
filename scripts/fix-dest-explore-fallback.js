#!/usr/bin/env node
// For ES/FR homepages, fall back to the EN pillar URL for countries that
// don't have a localised pillar yet (austria, england, sweden, germany,
// croatia, mexico). Otherwise those buttons 404. Once those countries
// get translated, this script's effects can be re-run with the script
// from earlier to point them back to /es/destinos/... or /fr/destinations/...

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Countries that exist only as English pillars (no ES/FR yet)
const EN_ONLY_COUNTRIES = ['austria', 'england', 'sweden', 'germany', 'croatia', 'mexico'];

const TARGETS = [
  { path: 'pages/es/index.js', fromPrefix: '/es/destinos/' },
  { path: 'pages/fr/index.js', fromPrefix: '/fr/destinations/' },
];

let total = 0;
for (const { path: rel, fromPrefix } of TARGETS) {
  const abs = path.join(ROOT, rel);
  let content = fs.readFileSync(abs, 'utf8');
  const before = content;
  for (const country of EN_ONLY_COUNTRIES) {
    const fromUrl = `${fromPrefix}${country}-fractional-ownership-properties/`;
    const toUrl = `/${country}-fractional-ownership-properties/`;
    if (content.includes(fromUrl)) {
      content = content.split(fromUrl).join(toUrl);
      total += 1;
      console.log(`  ✓ ${rel}  ${country}  →  ${toUrl}`);
    }
  }
  if (content !== before) fs.writeFileSync(abs, content, 'utf8');
}
console.log(`\nDone. ${total} fallback links applied.`);
