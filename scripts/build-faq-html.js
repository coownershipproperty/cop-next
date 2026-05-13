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

const SRC = path.join(__dirname, 'audit-output', 'faq-source.json');
const OUT = path.join(__dirname, 'audit-output', 'faq-replacements.json');

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

const src = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const out = {};
for (const [slug, qas] of Object.entries(src)) {
  out[slug] = qas.map(cardFor).join('');
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Wrote ${OUT} with ${Object.keys(out).length} replacements`);
