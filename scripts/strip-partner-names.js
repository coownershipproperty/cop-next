#!/usr/bin/env node
/**
 * Strip partner brand names (Pacaso, Vivla, MYNE, &Hamlet) from the blog
 * corpus. Project rule: descriptions never mention partner names.
 *
 * Replaces partner-specific citations with neutral language while
 * preserving the surrounding sentence structure. Ignores the lowercase
 * common-noun "hamlet" (small village) which collides only on case.
 *
 * Usage: node scripts/strip-partner-names.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '..', 'lib', 'posts.json');
const BACKUP_PATH = POSTS_PATH + '.bak.partners';
const DRY_RUN = process.argv.includes('--dry-run');

// Replacements ordered most-specific → least-specific so longer phrases
// match first. Each rule: [pattern, replacement, note].
//
// Curly-quote / encoded-apostrophe variants explicitly handled because
// the corpus mixes &#8217;, &rsquo; and straight ' / ’.
const RULES = [
  // --- Pacaso citations ---
  [/Pacaso(?:&#8217;|&rsquo;|['’])s 2024 market data/gi, 'industry market data', 'pacaso 2024 data'],
  [/Pacaso(?:&#8217;|&rsquo;|['’])s 2025 (?:survey|research)/gi, 'industry research from 2025', 'pacaso 2025 research'],
  [/Pacaso(?:&#8217;|&rsquo;|['’])s research/gi, 'industry research', 'pacaso possessive research'],
  [/Pacaso(?:&#8217;|&rsquo;|['’])s survey/gi, 'an industry survey', 'pacaso survey'],
  [/Pacaso(?:&#8217;|&rsquo;|['’])s data/gi, 'industry data', 'pacaso data'],
  [/Pacaso(?:&#8217;|&rsquo;|['’])s/gi, 'the industry research', 'pacaso possessive bare'],
  [/A Pacaso survey/g, 'An industry survey', 'a-pacaso-survey'],
  [/Pacaso survey/gi, 'an industry survey', 'pacaso survey bare'],
  [/Pacaso research/gi, 'industry research', 'pacaso research'],
  [/\(Pacaso, (\d{4})\)/g, '(Industry research, $1)', 'pacaso citation parens'],
  [/Pacaso and similar platforms/gi, 'major fractional ownership platforms', 'pacaso and similar'],
  [/Pacaso/g, 'major operators', 'pacaso bare fallback'],
  // --- Vivla, Myne, &Hamlet ---
  [/Vivla and Myne/gi, 'leading European platforms', 'vivla-and-myne'],
  [/Vivla, Myne(?: and (?:&|&amp;)Hamlet)?/gi, 'leading European platforms', 'vivla-myne-hamlet list'],
  [/\bVivla\b/g, 'a leading European platform', 'vivla bare'],
  [/\bMYNE\b/g, 'a leading European platform', 'MYNE bare'],
  [/\bMyne\b/g, 'a leading European platform', 'Myne bare'],
  [/(?:&|&amp;)Hamlet/g, 'a curated European operator', 'andhamlet'],
  // The lowercase common noun "hamlet" (village) is intentionally NOT
  // matched — it appears in destination descriptions and is not a
  // partner name reference.
];

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
const summary = { postsModified: 0, totalReplacements: 0, byRule: {} };
RULES.forEach(([, , note]) => { summary.byRule[note] = { matches: 0, postsHit: 0 }; });

posts.forEach(p => {
  const html = p.content || '';
  if (!html) return;
  let modified = html;
  let postChanged = false;
  RULES.forEach(([pattern, replacement, note]) => {
    let postHits = 0;
    modified = modified.replace(pattern, () => {
      postHits++;
      summary.totalReplacements++;
      return replacement;
    });
    if (postHits > 0) {
      summary.byRule[note].matches += postHits;
      summary.byRule[note].postsHit++;
      postChanged = true;
    }
  });
  if (postChanged) {
    summary.postsModified++;
    if (!DRY_RUN) p.content = modified;
  }
});

console.log(`Posts in corpus:    ${posts.length}`);
console.log(`Posts modified:     ${summary.postsModified}`);
console.log(`Total replacements: ${summary.totalReplacements}\n`);
console.log('By rule:');
Object.entries(summary.byRule)
  .filter(([, s]) => s.matches > 0)
  .forEach(([note, s]) => {
    console.log(`  ${s.postsHit.toString().padStart(2)} posts, ${s.matches.toString().padStart(2)} hits  —  ${note}`);
  });

if (DRY_RUN) {
  console.log('\n--dry-run: no files written');
} else if (summary.postsModified > 0) {
  fs.copyFileSync(POSTS_PATH, BACKUP_PATH);
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`\nWrote lib/posts.json (backup at lib/posts.json.bak.partners)`);
}
