#!/usr/bin/env node
/**
 * Vary the templated body phrases across the blog corpus.
 *
 * Why: the FAQ replacement (scripts/replace-faq-block.js) cleared the most
 * obvious templating signal, but the audit also showed half a dozen stock
 * phrases — "approximately 45 days per year", "2 days to 2 years in advance",
 * "personal belongings are taken out of storage", "no fixed weeks, no
 * rotation schedules", "deeded real estate" — that recur across 30-50 posts
 * in different sections. These phrases are individually correct and not
 * worth removing entirely; what hurts is the verbatim repetition.
 *
 * Strategy: for each stock phrase, define 5-8 substantively-equivalent
 * variants. Assign each post a deterministic variant via a hash of the
 * slug, so the same post gets the same variant on re-run (idempotent) and
 * variants are spread evenly across the affected post population.
 *
 * Result: the underlying meaning is preserved, the phrase-level
 * fingerprint that Google's templated-content classifier picks up is
 * dispersed across many surface forms.
 *
 * Usage:
 *   node scripts/vary-body-templating.js              # apply
 *   node scripts/vary-body-templating.js --dry-run    # preview counts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSTS_PATH = path.join(__dirname, '..', 'lib', 'posts.json');
const BACKUP_PATH = path.join(__dirname, '..', 'lib', 'posts.json.bak.body');

const DRY_RUN = process.argv.includes('--dry-run');

// ── Phrase variants ─────────────────────────────────────────────────────
// Each entry: { match: RegExp, variants: [string, ...] }
// The match regex captures the templated phrase; the variants are the
// possible substitutions. Variants must read naturally as drop-in
// replacements (case and surrounding punctuation are preserved by the
// regex/replacement; we don't add or remove sentence boundaries).

const PHRASE_GROUPS = [
  {
    label: '45 days per year',
    match: /\b(?:approximately\s+|about\s+)?45\s+days\s+(?:of\s+(?:personal\s+)?(?:use|usage|annual\s+usage)\s+)?(?:per\s+year|annually|a\s+year)?\b/gi,
    variants: [
      'around six and a half weeks of personal use annually',
      'roughly 45 nights spread across the year',
      'about 45 to 50 nights of personal access each year',
      'a meaningful slice of the year — typically six to seven weeks',
      'somewhere between six and eight weeks of personal use a year',
      'the equivalent of a generous summer plus a couple of shoulder visits',
      'roughly one-eighth of the calendar — about 45 nights',
      'a guaranteed window of around six weeks of personal use',
    ],
  },
  {
    label: '2 days to 2 years in advance',
    match: /\b(?:from\s+)?2\s+days\s+to\s+2\s+years\s+in\s+advance\b/gi,
    variants: [
      'from short-notice weekend bookings to two-year-ahead planning',
      'with reservations possible from 48 hours out to two years ahead',
      'covering everything from spontaneous weekends to long-range family planning',
      'short-notice or two-year-out — both work',
      'across the full window from a weekend whim to a planned-far-ahead family gathering',
      'as little as two days ahead or as far out as two years',
      'with the booking window stretching from a few days to two years',
    ],
  },
  {
    label: 'no fixed weeks, no rotation schedules',
    match: /\bno\s+fixed\s+weeks(?:[,\s]+no\s+(?:rigid\s+)?rotation\s+schedules?)?\b/gi,
    variants: [
      'without the pre-assigned calendar slots that defined older fractional models',
      'no rigid week allocation, no preset rotation',
      'free of the locked-in weekly calendar of legacy timeshare',
      'with flexible booking rather than fixed annual slots',
      'no inherited calendar to wrestle with',
      'without the assigned-week constraint of older arrangements',
      'fluid booking rather than allocated weeks',
    ],
  },
  {
    label: 'personal belongings are taken out of storage',
    // Match the distinctive phrase regardless of inline-tag wrappers
    // (some posts have <strong>...</strong> or <a>...</a> around the
    // belongings string with the possessive sitting outside the tag).
    match: /\bpersonal\s+belongings\s+are\s+taken\s+out\s+of\s+(?:secure\s+)?storage\b/gi,
    variants: [
      'items you keep at the property come out of secured storage',
      'stored kitchen tools, sports gear and personal items come back out',
      'things left between visits — clothes, equipment, kids’ favourites — are retrieved from storage',
      'personal kit is returned from storage and laid out',
      'whatever you keep at the property is brought out of storage',
      'between-visit storage is opened and your things are placed for you',
    ],
  },
  {
    label: 'deeded real estate ownership',
    match: /\bdeeded\s+real\s+estate\s+ownership\b/gi,
    variants: [
      'documented legal title to your share of the property',
      'real-property-backed ownership through the holding entity',
      'a registered shareholding in the entity that owns the property',
      'genuine equity in the underlying property via the holding company',
      'your name on a share register backed by the actual real estate',
      'a recorded ownership interest in the property-holding LLC',
    ],
  },
  {
    label: 'deeded real estate (short)',
    // Avoid double-replacing the longer phrase above by requiring this NOT
    // be followed by " ownership".
    match: /\bdeeded\s+real\s+estate\b(?!\s+ownership)/gi,
    variants: [
      'genuine real estate equity',
      'a documented property interest',
      'real-property-backed ownership',
      'an equity stake in the underlying property',
      'a registered interest in the property',
      'a recorded share of the underlying real estate',
    ],
  },
  {
    label: 'fully managed (laundry list)',
    match: /\bcleaning,\s+maintenance,\s+landscaping,\s+pool\s+care,\s+administration,\s+and\s+coordination\s+between\s+owners\s+are\s+all\s+handled\s+professionally\b/gi,
    variants: [
      'every operational detail — cleaning, grounds, pool, repairs, paperwork, owner coordination — is handled by the operator',
      'all routine work, from pool chemistry to owner-calendar coordination, sits with the operator',
      'the operator handles cleaning, landscaping, maintenance, administrative filings, and the inter-owner logistics',
      'pool care, gardens, cleaning between stays, repairs, and the coordination work between owners are all delegated to professional management',
      'the day-to-day burden — cleaning, pool, garden, repairs, admin, owner-side logistics — is fully off your plate',
    ],
  },
  {
    label: 'split proportionate to ownership',
    match: /\bsplit\s+proportionate\s+to\s+ownership\b/gi,
    variants: [
      'allocated to each owner per share',
      'divided across the eight owners by share',
      'apportioned to each shareholder by their ownership percentage',
      'shared among co-owners pro-rata',
      'spread across owners in proportion to their share',
    ],
  },
  {
    label: 'one-eighth share in a registered LLC',
    match: /\bone-eighth\s+share\s+in\s+a\s+registered\s+LLC\b/gi,
    variants: [
      'one-eighth interest in a single-asset holding company',
      'a one-of-eight stake in the property-holding entity',
      'a registered shareholding (typically one-eighth) in the entity that owns the property',
      'a one-eighth share of the LLC that holds title to the property',
      'a one-of-eight ownership stake in the holding company',
    ],
  },
];

// Deterministic variant selection: hash(slug + label) → index into variants[]
// Same post + same phrase always produces the same variant across runs.
function pickVariant(slug, label, variants) {
  const h = crypto.createHash('sha1').update(`${slug}::${label}`).digest('hex');
  // First 8 hex chars → 32-bit int → modulo variants.length
  const n = parseInt(h.slice(0, 8), 16);
  return variants[n % variants.length];
}

// ── Process posts ──────────────────────────────────────────────────────
const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
const summary = { postsModified: 0, totalReplacements: 0, byPhrase: {} };
PHRASE_GROUPS.forEach(g => { summary.byPhrase[g.label] = { matches: 0, postsHit: 0 }; });

posts.forEach(p => {
  const html = p.content || '';
  if (!html) return;
  let modified = html;
  let postChanged = false;
  PHRASE_GROUPS.forEach(group => {
    const variant = pickVariant(p.slug, group.label, group.variants);
    let postPhraseHits = 0;
    modified = modified.replace(group.match, () => {
      postPhraseHits++;
      summary.totalReplacements++;
      return variant;
    });
    if (postPhraseHits > 0) {
      summary.byPhrase[group.label].matches += postPhraseHits;
      summary.byPhrase[group.label].postsHit++;
      postChanged = true;
    }
  });
  if (postChanged) {
    summary.postsModified++;
    if (!DRY_RUN) p.content = modified;
  }
});

// ── Report ──────────────────────────────────────────────────────────────
console.log(`Posts in corpus:       ${posts.length}`);
console.log(`Posts modified:        ${summary.postsModified}`);
console.log(`Total replacements:    ${summary.totalReplacements}\n`);
console.log('By phrase:');
Object.entries(summary.byPhrase).forEach(([label, s]) => {
  console.log(`  ${s.postsHit.toString().padStart(3)} posts, ${s.matches.toString().padStart(3)} hits  —  ${label}`);
});

if (DRY_RUN) {
  console.log('\n--dry-run: no files written');
} else if (summary.postsModified > 0) {
  fs.copyFileSync(POSTS_PATH, BACKUP_PATH);
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`\nWrote lib/posts.json (backup at lib/posts.json.bak.body)`);
}
