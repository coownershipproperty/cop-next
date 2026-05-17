#!/usr/bin/env node
// Updates "Explore Properties" buttons in the Our Destinations section on
// all 4 locale homepages so each country panel points to that country's
// pillar page instead of the generic /our-homes/ catalog.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Per-locale: which panel (by the country-name span content that sits just
// above the Explore button) → which pillar URL the button should link to.
//
// The country pillar slugs are the same English slug across all locales —
// only the URL path prefix differs (/de/destinationen, /es/destinos, etc).
const COUNTRY_TO_SLUG = {
  // DE country names (Spanien, Frankreich, ...)
  Spanien:     'spain-fractional-ownership-properties',
  Frankreich:  'france-fractional-ownership-properties',
  Italien:     'italy-fractional-ownership-properties',
  Portugal:    'portugal-fractional-ownership-properties',
  Österreich:  'austria-fractional-ownership-properties',
  England:     'england-fractional-ownership-properties',
  Schweden:    'sweden-fractional-ownership-properties',
  Deutschland: 'germany-fractional-ownership-properties',
  Kroatien:    'croatia-fractional-ownership-properties',
  USA:         'usa-fractional-ownership-properties',
  Mexiko:      'mexico-fractional-ownership-properties',
  // ES country names (España, Francia, ...)
  España:    'spain-fractional-ownership-properties',
  Francia:   'france-fractional-ownership-properties',
  Italia:    'italy-fractional-ownership-properties',
  // Portugal: already mapped above
  Austria:   'austria-fractional-ownership-properties',
  Inglaterra:'england-fractional-ownership-properties',
  Suecia:    'sweden-fractional-ownership-properties',
  Alemania:  'germany-fractional-ownership-properties',
  Croacia:   'croatia-fractional-ownership-properties',
  // USA already mapped
  México:    'mexico-fractional-ownership-properties',
  // FR country names (Espagne, France, ...)
  Espagne:   'spain-fractional-ownership-properties',
  France:    'france-fractional-ownership-properties',
  Italie:    'italy-fractional-ownership-properties',
  Autriche:  'austria-fractional-ownership-properties',
  Angleterre:'england-fractional-ownership-properties',
  Suède:     'sweden-fractional-ownership-properties',
  Allemagne: 'germany-fractional-ownership-properties',
  Croatie:   'croatia-fractional-ownership-properties',
  'États-Unis': 'usa-fractional-ownership-properties',
  Mexique:   'mexico-fractional-ownership-properties',
};

const FILES = [
  { path: 'pages/de/index.js', urlPrefix: '/de/destinationen/' },
  { path: 'pages/es/index.js', urlPrefix: '/es/destinos/' },
  { path: 'pages/fr/index.js', urlPrefix: '/fr/destinations/' },
];

for (const { path: rel, urlPrefix } of FILES) {
  const abs = path.join(ROOT, rel);
  let content = fs.readFileSync(abs, 'utf8');
  const before = content;
  let totalChanges = 0;

  // Find each <div className="dest-info-name">COUNTRY</div> block and rewrite
  // the next dest-explore-btn href on the next ~3 lines.
  // Use a regex that captures (info-name + desc + button line) and only
  // rewrites the button href.
  for (const [country, slug] of Object.entries(COUNTRY_TO_SLUG)) {
    // Escape country name for regex
    const esc = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match: <div className="dest-info-name">{country}</div> [whitespace+desc]
    //        <a href="..." className="dest-explore-btn">{anything}</a>
    const re = new RegExp(
      `(<div className="dest-info-name">${esc}</div>[\\s\\S]{0,2000}?<a href=")[^"]+(" className="dest-explore-btn">)`,
      'g'
    );
    const targetUrl = `${urlPrefix}${slug}/`;
    const newContent = content.replace(re, (m, prefix, suffix) => {
      totalChanges += 1;
      return `${prefix}${targetUrl}${suffix}`;
    });
    content = newContent;
  }

  if (content !== before) {
    fs.writeFileSync(abs, content, 'utf8');
    console.log(`  ✓ ${rel}  (${totalChanges} links updated)`);
  } else {
    console.log(`  = ${rel}  (no changes)`);
  }
}
