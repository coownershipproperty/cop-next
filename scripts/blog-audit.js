#!/usr/bin/env node
/**
 * Blog duplication audit — surface what's making Google flag the lifestyle
 * series as templated content.
 *
 * Outputs (all to scripts/audit-output/):
 *   1. opening-sentences.csv   — first sentence per post, sorted by similarity cluster
 *   2. heading-frequency.csv   — every H2/H3 across the corpus, with count
 *   3. ngram-overlap.csv       — 5-, 6-, 7-grams that appear in ≥3 posts (the smoking gun)
 *   4. ai-phrases-hits.csv     — known AI-tells: "44-45 days", "one-eighth share", etc.
 *   5. post-templating-score.csv — per post, what % of its sentences appear ≥2× elsewhere.
 *      This is the ranked list of rewrite priorities.
 *   6. summary.md              — human-readable digest
 *
 * Usage: node scripts/blog-audit.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '..', 'lib', 'posts.json');
const OUT_DIR = path.join(__dirname, 'audit-output');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────
const stripTags = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z"'])/g).map(s => s.trim()).filter(s => s.length > 25 && s.length < 400);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const csvEscape = (v) => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const writeCsv = (file, rows) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(',')].concat(rows.map(r => cols.map(c => csvEscape(r[c])).join(',')));
  fs.writeFileSync(path.join(OUT_DIR, file), lines.join('\n'));
};

// ── Load posts ───────────────────────────────────────────────────────────
const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
console.log(`Loaded ${posts.length} posts`);

// Pre-process: extract clean text + sentences + headings per post
const docs = posts.map(p => {
  const html = p.content || '';
  const text = stripTags(html);
  const sents = sentences(text);
  const headings = [];
  const reH = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/g;
  let m;
  while ((m = reH.exec(html))) headings.push({ level: m[1], text: stripTags(m[2]) });
  return { slug: p.slug, title: p.title, category: p.category, html, text, sents, headings };
});

// ── 1. Opening sentences ─────────────────────────────────────────────────
const openings = docs.map(d => ({
  slug: d.slug,
  title: d.title.slice(0, 80),
  opening: (d.sents[0] || '').slice(0, 200),
  opening_norm: norm((d.sents[0] || '').slice(0, 120)),
}));
// Cluster by first 6 normalized words
const openingCluster = {};
openings.forEach(o => {
  const key = o.opening_norm.split(' ').slice(0, 6).join(' ') || '(empty)';
  (openingCluster[key] = openingCluster[key] || []).push(o);
});
const openingRows = [];
Object.entries(openingCluster)
  .sort(([, a], [, b]) => b.length - a.length)
  .forEach(([key, group]) => {
    group.forEach(o => openingRows.push({ cluster_key: key, cluster_size: group.length, slug: o.slug, opening: o.opening }));
  });
writeCsv('opening-sentences.csv', openingRows);
console.log(`Wrote opening-sentences.csv (${openingRows.length} rows, ${Object.keys(openingCluster).length} clusters)`);

// ── 2. Heading frequency ─────────────────────────────────────────────────
const headingCount = {};
docs.forEach(d => d.headings.forEach(h => {
  const key = `H${h.level}: ${norm(h.text)}`;
  if (!headingCount[key]) headingCount[key] = { heading: h.text, level: h.level, count: 0, slugs: new Set() };
  headingCount[key].count++;
  headingCount[key].slugs.add(d.slug);
}));
const headingRows = Object.values(headingCount)
  .filter(h => h.count >= 2)
  .sort((a, b) => b.count - a.count)
  .map(h => ({ heading: h.heading, level: `H${h.level}`, count: h.count, posts_using_it: h.slugs.size, sample_slugs: [...h.slugs].slice(0, 5).join(' | ') }));
writeCsv('heading-frequency.csv', headingRows);
console.log(`Wrote heading-frequency.csv (${headingRows.length} repeated headings)`);

// ── 3. N-gram overlap (5/6/7 grams appearing in ≥3 posts) ────────────────
const ngramCount = new Map();
const ngramSlugs = new Map();
const STOP_PREFIX = /^(the|and|but|with|from|for|that|this|these|those|here|there|where|when|what|which|while|after|before|over|under|into|onto|out|in|on|at|to|of|a|an|or|is|are|was|were|be|been|being|by|as|it|its|you|your|we|our|they|their)$/i;
docs.forEach(d => {
  const words = norm(d.text).split(' ').filter(w => w.length > 1);
  for (let n = 5; n <= 7; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const window = words.slice(i, i + n);
      // Skip windows where >half the tokens are stop-words (low-signal)
      const stopFrac = window.filter(w => STOP_PREFIX.test(w)).length / n;
      if (stopFrac > 0.5) continue;
      const gram = window.join(' ');
      ngramCount.set(gram, (ngramCount.get(gram) || 0) + 1);
      if (!ngramSlugs.has(gram)) ngramSlugs.set(gram, new Set());
      ngramSlugs.get(gram).add(d.slug);
    }
  }
});
const ngramRows = [...ngramCount.entries()]
  .filter(([, c]) => c >= 3)
  .map(([gram, count]) => ({
    ngram: gram,
    word_count: gram.split(' ').length,
    total_occurrences: count,
    posts_using_it: ngramSlugs.get(gram).size,
    sample_slugs: [...ngramSlugs.get(gram)].slice(0, 4).join(' | '),
  }))
  .filter(r => r.posts_using_it >= 3)
  .sort((a, b) => b.posts_using_it - a.posts_using_it || b.total_occurrences - a.total_occurrences);
writeCsv('ngram-overlap.csv', ngramRows);
console.log(`Wrote ngram-overlap.csv (${ngramRows.length} repeated phrases)`);

// ── 4. AI-tell phrase hits ───────────────────────────────────────────────
const AI_TELLS = [
  '44 to 45 days', '44-45 days', '45 days per year', '44 days per year',
  'one-eighth share', 'one eighth share', '1/8 share',
  'properly structured llc', 'properly structured spv',
  'split eight ways', 'divided eight ways', 'shared eight ways',
  'co-ownership offers', 'co-ownership allows', 'co-ownership represents',
  'world-class', 'world class luxury',
  'unparalleled', 'unrivalled', 'unrivaled',
  'breathtaking', 'stunning views', 'sweeping views',
  'a fraction of the cost', 'fraction of the price',
  'in this guide', 'in this article', 'in this post',
  'whether you', 'whether or not',
  'it is half past', 'half past seven',
  'sun-drenched', 'sun drenched',
  'nestled in', 'nestled among', 'nestled between',
  'tucked away', 'tucked into',
  'crystal clear waters', 'crystal-clear waters',
  'a true gem', 'hidden gem', 'true paradise',
  'discerning buyer', 'discerning investor',
  'bespoke', 'curated experience',
  'in summary', 'to sum up', 'in conclusion',
  'final thoughts',
];
const aiHits = [];
docs.forEach(d => {
  const lc = d.text.toLowerCase();
  AI_TELLS.forEach(phrase => {
    let i = 0, count = 0;
    while ((i = lc.indexOf(phrase, i)) !== -1) { count++; i += phrase.length; }
    if (count > 0) aiHits.push({ slug: d.slug, phrase, count });
  });
});
const aiRows = aiHits.sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));
writeCsv('ai-phrases-hits.csv', aiRows);

// Aggregate by phrase
const aiByPhrase = {};
aiHits.forEach(h => {
  if (!aiByPhrase[h.phrase]) aiByPhrase[h.phrase] = { phrase: h.phrase, total: 0, posts: new Set() };
  aiByPhrase[h.phrase].total += h.count;
  aiByPhrase[h.phrase].posts.add(h.slug);
});
const aiSummary = Object.values(aiByPhrase)
  .map(p => ({ phrase: p.phrase, total_occurrences: p.total, posts_with_phrase: p.posts.size }))
  .sort((a, b) => b.posts_with_phrase - a.posts_with_phrase || b.total_occurrences - a.total_occurrences);
writeCsv('ai-phrases-summary.csv', aiSummary);
console.log(`Wrote ai-phrases-hits.csv (${aiRows.length}) + ai-phrases-summary.csv (${aiSummary.length})`);

// ── 5. Per-post templating score ─────────────────────────────────────────
// "What % of this post's sentences are also found (normalized) in another post?"
const sentToSlug = new Map();
docs.forEach(d => {
  d.sents.forEach(s => {
    const key = norm(s);
    if (key.length < 30) return;
    if (!sentToSlug.has(key)) sentToSlug.set(key, new Set());
    sentToSlug.get(key).add(d.slug);
  });
});
const scoreRows = docs.map(d => {
  const total = d.sents.length || 1;
  let shared = 0;
  let aiTellHits = 0;
  d.sents.forEach(s => {
    const key = norm(s);
    if (sentToSlug.get(key) && sentToSlug.get(key).size >= 2) shared++;
  });
  const lc = d.text.toLowerCase();
  AI_TELLS.forEach(p => { if (lc.includes(p)) aiTellHits++; });
  return {
    slug: d.slug,
    title: d.title.slice(0, 100),
    category: d.category,
    sentence_count: total,
    shared_sentences: shared,
    template_pct: ((shared / total) * 100).toFixed(1),
    ai_tells_hit: aiTellHits,
    rewrite_priority_score: (shared / total) * 100 + aiTellHits * 5,
  };
}).sort((a, b) => b.rewrite_priority_score - a.rewrite_priority_score);
writeCsv('post-templating-score.csv', scoreRows.map(r => {
  const { rewrite_priority_score, ...rest } = r;
  return { ...rest, rewrite_priority_score: rewrite_priority_score.toFixed(1) };
}));
console.log(`Wrote post-templating-score.csv (${scoreRows.length} rows)`);

// ── 6. Summary digest ────────────────────────────────────────────────────
const top10Worst = scoreRows.slice(0, 10);
const topNgrams = ngramRows.slice(0, 15);
const topHeadings = headingRows.slice(0, 15);
const topAiPhrases = aiSummary.slice(0, 15);
const biggestOpeningCluster = Object.entries(openingCluster).sort(([, a], [, b]) => b.length - a.length).slice(0, 5);

const md = `# Blog corpus duplication audit
Run: ${new Date().toISOString()}
Posts analyzed: **${posts.length}**

## TL;DR
- ${ngramRows.length} distinct phrases (5–7 words) appear in ≥3 different posts.
- ${headingRows.length} H2/H3 headings are repeated across multiple posts.
- ${scoreRows.filter(r => +r.template_pct >= 20).length} posts have ≥20% of their sentences appearing in other posts.
- ${aiSummary.length} of the AI-tell phrases were found at least once.

## Top 10 worst-offender posts (rewrite first)
| Rank | Template % | AI-tells | Slug |
|------|-----------|----------|------|
${top10Worst.map((r, i) => `| ${i + 1} | ${r.template_pct}% | ${r.ai_tells_hit} | \`${r.slug}\` |`).join('\n')}

## Top 5 most-shared opening patterns
${biggestOpeningCluster.map(([key, group]) => `- **${group.length} posts** start with: _"${key}…"_`).join('\n')}

## Top 15 repeated headings
${topHeadings.map(h => `- (${h.count}×) **${h.level}**: ${h.heading}`).join('\n')}

## Top 15 repeated phrases (5-7 word n-grams)
${topNgrams.map(n => `- (in ${n.posts_using_it} posts) "${n.ngram}"`).join('\n')}

## Top 15 AI-tell phrases by post-coverage
${topAiPhrases.map(p => `- **${p.posts_with_phrase} posts** use "${p.phrase}" (${p.total_occurrences} total occurrences)`).join('\n')}

## Files
- \`opening-sentences.csv\` — every post's opening, clustered
- \`heading-frequency.csv\` — repeated H2/H3 across the corpus
- \`ngram-overlap.csv\` — repeated 5–7 word phrases
- \`ai-phrases-hits.csv\` — per-post AI-tell hits
- \`ai-phrases-summary.csv\` — AI-tell phrases ranked by post-coverage
- \`post-templating-score.csv\` — **start here** — every post ranked by rewrite priority
`;
fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), md);
console.log(`Wrote summary.md`);
console.log(`\nAll outputs in: ${OUT_DIR}`);
