#!/usr/bin/env node
/**
 * Convert scripts/audit-output/faq-source.json (clean Q&A pairs per slug)
 * into scripts/audit-output/faq-replacements.json (HTML strings the
 * splicer expects). Idempotent — overwrites the output file each run.
 *
 * faq-source.json shape:
 *   {
 *     "slug-1": [
 *       { "q": "Question?", "a": "Answer paragraph." },
 *       …
 *     ],
 *     …
 *   }
 *
 * Why split this from the splicer: keeps the HTML wrapper out of the
 * source JSON so we can hand-write Q&As as plain text — much less noisy
 * to read in PR review and easier to spot duplicates / AI-tells.
 */

const fs = require('fs');
const path = require('path');

// Reads faq-source.json and any faq-source-batch*.json siblings so each
// batch of FAQs lives in its own reviewable file. Later files override
// earlier slugs if duplicated.
const SRC_DIR = path.join(__dirname, 'audit-output');
const OUT = path.join(SRC_DIR, 'faq-replacements.json');
const SRC_FILES = fs.readdirSync(SRC_DIR)
  .filter(f => f === 'faq-source.json' || /^faq-source-batch\d+\.json$/.test(f))
  .sort();

const Q_STYLE = 'margin:0 0 10px;font-family:Playfair Display,serif;font-size:17px;font-weight:600;color:#143047;';
const A_STYLE = 'margin:0;font-family:Nunito Sans,sans-serif;font-size:15px;color:#143047;line-height:1.7;';
const CARD_STYLE = 'background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 4px 16px rgba(20,48,71,0.06);';

function escape(s) {
  return String(s)
    .replace(/&(?!(amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cardFor(qa) {
  return `<div style="${CARD_STYLE}">` +
    `<p style="${Q_STYLE}">${escape(qa.q)}</p>` +
    `<p style="${A_STYLE}">${escape(qa.a)}</p>` +
  `</div>`;
}

const merged = {};
for (const file of SRC_FILES) {
  const data = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf-8'));
  for (const [slug, qas] of Object.entries(data)) merged[slug] = qas;
}
const out = {};
for (const [slug, qas] of Object.entries(merged)) {
  out[slug] = qas.map(cardFor).join('');
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Read ${SRC_FILES.length} source files, ${Object.keys(merged).length} unique slugs`);
console.log(`Wrote ${OUT}`);
