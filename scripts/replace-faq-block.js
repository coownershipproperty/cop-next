#!/usr/bin/env node
/**
 * Replace the templated FAQ block in blog posts with unique per-post FAQs.
 *
 * Why: 106/111 posts share an identical FAQ block (same questions,
 * answers vary only by destination name). This is a primary signal Google
 * uses to rank the corpus as "templated content" → "Discovered – currently
 * not indexed" for most of the lifestyle posts.
 *
 * Input: scripts/audit-output/faq-replacements.json — `{ slug: faqBlockHtml }`
 *        Each value is the full inner HTML of the FAQ block (questions +
 *        answers wrapped in the existing card divs). The script wraps it
 *        with the standard "Common Questions / Frequently Asked Questions"
 *        header so we don't repeat that boilerplate per replacement.
 *
 * Output: lib/posts.json updated in place. Backs up to lib/posts.json.bak.
 *
 * Usage:
 *   node scripts/replace-faq-block.js                # apply replacements
 *   node scripts/replace-faq-block.js --dry-run      # preview matches only
 *   node scripts/replace-faq-block.js --slug=X       # restrict to one slug
 */

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '..', 'lib', 'posts.json');
const FAQS_PATH = path.join(__dirname, 'audit-output', 'faq-replacements.json');
const BACKUP_PATH = path.join(__dirname, '..', 'lib', 'posts.json.bak');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONE_SLUG = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1] || null;

if (!fs.existsSync(FAQS_PATH)) {
  console.error(`Missing ${FAQS_PATH}\nCreate it as { "slug": "<faq Q&A html>" } and re-run.`);
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
const faqMap = JSON.parse(fs.readFileSync(FAQS_PATH, 'utf-8'));

// ── FAQ block boundaries ─────────────────────────────────────────────────
// START: the "Common Questions" eyebrow wrapper OR the FAQ heading wrapper.
//        Pattern in the corpus:
//          <div style="padding-top:56px;"><p ...>Common Questions</p>
//             <h2 ...>Frequently Asked Questions</h2></div>
// END:   the gradient-gold CTA at the bottom of the post:
//          <div style="background:linear-gradient(135deg,#A69052...
//        OR end of post body (fallback for posts with no CTA).
//
// Strategy: find the START anchor, then scan forward for END_RE; everything
// between gets replaced with the standard FAQ header + the new Q&A block.

const FAQ_START_RE = /<div[^>]*padding-top:56px[^>]*>\s*<p[^>]*>\s*Common Questions\s*<\/p>/i;
// Some posts use just the H2 with no eyebrow — handle both.
const FAQ_HEADING_RE = /<(?:div[^>]*>\s*)?(?:<p[^>]*>\s*Common Questions\s*<\/p>\s*)?<h2[^>]*>\s*Frequently Asked Questions\s*<\/h2>(?:\s*<\/div>)?/i;
// END candidates (whichever comes first after FAQ start, in this order):
//   1. Author bio paragraph (font-style:italic + border-top is the distinctive
//      pattern across the corpus)
//   2. Gradient gold CTA at the bottom of the post
//   3. End of HTML
const FAQ_END_CANDIDATES = [
  /<p[^>]*font-style:\s*italic[^>]*border-top[^>]*>/i,
  /<p[^>]*border-top[^>]*font-style:\s*italic[^>]*>/i,
  /<div[^>]*background:\s*linear-gradient\(135deg/i,
];

const STANDARD_FAQ_HEADER = (
  '<div style="padding-top:56px;">' +
    '<p style="margin:0 0 6px;font-family:Nunito Sans,sans-serif;font-size:11px;font-weight:700;color:#A69052;letter-spacing:1.5px;text-transform:uppercase;">Common Questions</p>' +
    '<h2 style="margin:0 0 24px;font-family:Playfair Display,serif;font-size:32px;color:#143047;line-height:1.3;">Frequently Asked Questions</h2>' +
  '</div>\n'
);

function findFaqRange(html) {
  // Prefer eyebrow wrapper (cleanest); fallback to heading.
  const m = html.match(FAQ_START_RE);
  let start = m ? m.index : -1;
  if (start === -1) {
    const m2 = html.match(FAQ_HEADING_RE);
    if (!m2) {
      // Final fallback: walk back from any "Frequently Asked Questions" h2
      // and find the nearest opening tag containing "Common Questions" within
      // the preceding 500 chars (catches the splitting-portfolio variant
      // which uses <div>Common Questions</div> instead of the eyebrow <p>).
      const m3 = html.match(/<h2[^>]*>\s*Frequently Asked Questions\s*<\/h2>/i);
      if (!m3) return null;
      const back = html.lastIndexOf('Common Questions', m3.index);
      if (back === -1 || m3.index - back > 500) {
        start = m3.index;
      } else {
        const openTag = html.lastIndexOf('<', back);
        start = openTag !== -1 ? openTag : back;
      }
    } else {
      start = m2.index;
    }
  }
  // Walk back to the nearest <div opener if we matched the heading directly.
  // (Eyebrow wrapper is already at a <div boundary so this is a no-op there.)
  // Find earliest END candidate after FAQ start.
  const tail = html.slice(start);
  let end = html.length;
  for (const re of FAQ_END_CANDIDATES) {
    const m2 = tail.match(re);
    if (m2 && start + m2.index < end) end = start + m2.index;
  }
  return { start, end };
}

let changed = 0, missingFaq = 0, missingReplacement = 0, skipped = 0;
const updates = [];

for (const post of posts) {
  if (ONE_SLUG && post.slug !== ONE_SLUG) continue;
  const replacement = faqMap[post.slug];
  if (!replacement) {
    missingReplacement++;
    continue;
  }
  const range = findFaqRange(post.content || '');
  if (!range) {
    missingFaq++;
    console.warn(`  no FAQ block found: ${post.slug}`);
    continue;
  }
  const before = post.content.slice(0, range.start);
  const after = post.content.slice(range.end);
  const newBlock = STANDARD_FAQ_HEADER + replacement.trim() + '\n';
  const newContent = before + newBlock + after;

  updates.push({ slug: post.slug, oldLen: range.end - range.start, newLen: newBlock.length });
  if (!DRY_RUN) post.content = newContent;
  changed++;
}

console.log(`Replacements available: ${Object.keys(faqMap).length}`);
console.log(`Posts updated:          ${changed}`);
console.log(`No replacement in map:  ${missingReplacement}`);
console.log(`No FAQ block in post:   ${missingFaq}`);
if (DRY_RUN) {
  console.log('\n--dry-run: no files written');
  console.log('Sample size deltas (first 5):');
  updates.slice(0, 5).forEach(u => console.log(`  ${u.slug}  ${u.oldLen} → ${u.newLen} chars`));
} else if (changed > 0) {
  fs.copyFileSync(POSTS_PATH, BACKUP_PATH);
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`\nWrote lib/posts.json (backup at lib/posts.json.bak)`);
}
