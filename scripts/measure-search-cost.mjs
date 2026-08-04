/**
 * What does one search actually cost?
 *
 * The figure quoted to David early on ($0.84 per 1,000 searches on GPT-5.6
 * Luna) was estimated before the prompts were finished. Both have since grown,
 * so this re-measures it from the real strings rather than re-guessing.
 *
 * A search makes at most TWO model calls:
 *   1. understand — intentSystemPrompt(vocab) + the buyer's sentence
 *   2. explain    — COPY_SYSTEM_PROMPT + JSON.stringify(buildCopyPayload(...))
 * The ranking in between is ours and free. Call 2 is skipped when the ranking
 * returns nothing, and BOTH are skipped when the daily budget is spent, so the
 * numbers here are a per-search ceiling, not an average.
 *
 * Input tokens are counted exactly with tiktoken (o200k_base, which is the
 * encoding GPT-5.x uses). Output cannot be counted before it exists, so it is
 * bounded by the maxTokens actually passed at the call site — 500 and 900 —
 * and also measured against what the local fallback generators produce, which
 * is a fair proxy for the real reply's shape and length.
 *
 *   node scripts/measure-search-cost.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { rankProperties } from '../lib/search/rank.js';
import { intentSystemPrompt, COPY_SYSTEM_PROMPT, buildCopyPayload, fallbackIntent, fallbackCopy }
  from '../lib/search/prompts.js';

const here = dirname(fileURLToPath(import.meta.url));

// Per million tokens, in USD. Kept beside the code that uses them so a price
// change is one edit. Luna is the model configured in Vercel (SEARCH_MODEL).
//
// Checked against the published rates on 4 Aug 2026. Luna's price fell by 80%
// on 30 July 2026 ($1/$6 → $0.20/$1.20) and Terra's by 20% ($2.50/$15 → $2/$12),
// which is recent enough that any figure quoted before that date is wrong.
// Sources: openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6
// and benchlm.ai/moonshot/api-pricing for the Kimi tiers.
const PRICES = {
  'gpt-5.6-luna':  { in: 0.20, out: 1.20, label: 'GPT-5.6 Luna  (configured)' },
  'kimi-k2.5':     { in: 0.60, out: 3.00, label: 'Kimi K2.5' },
  'gpt-5.6-terra': { in: 2.00, out: 12.0, label: 'GPT-5.6 Terra' },
  'kimi-k3':       { in: 3.00, out: 15.0, label: 'Kimi K3      (flagship, not cheap)' },
  'gpt-5.6-sol':   { in: 5.00, out: 30.0, label: 'GPT-5.6 Sol' },
};

// Repeated prompt prefixes bill at 10% of the input rate, automatically, and the
// cache lives at least 30 minutes. Both system prompts are byte-identical on
// every single search, so in steady traffic that 1,802-token fixed cost is
// charged at a tenth. Only the first search of a quiet period pays full price.
const CACHE_DISCOUNT = 0.10;

const MAX_TOKENS = { intent: 500, copy: 900 };   // from pages/api/search.js
const DAILY_CAP = 800;                            // SEARCH_DAILY_CAP default

// --- token counting ---------------------------------------------------------
// tiktoken is a Python package here, so count in one batched subprocess call
// rather than shelling out per string.
function countAll(strings) {
  const py = `
import sys, json, tiktoken
enc = tiktoken.get_encoding('o200k_base')
items = json.load(sys.stdin)
print(json.dumps([len(enc.encode(s)) for s in items]))
`;
  const out = execFileSync('python3', ['-c', py], {
    input: JSON.stringify(strings),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

// --- corpus -----------------------------------------------------------------
const facets = JSON.parse(readFileSync(join(here, '../lib/search/place-facets.json'), 'utf8'));
let props = JSON.parse(readFileSync('/home/claude/cop-search/data/properties.json', 'utf8'))
  .filter(p => ['Live', 'for_sale'].includes(p.status));

const vocab = {
  countries: [...new Set(props.map(p => p.country).filter(Boolean))].sort(),
  regions: [...new Set(props.map(p => p.region).filter(Boolean))].sort(),
  cities: [...new Set(props.map(p => p.city).filter(Boolean))].sort(),
};

// Real questions of varying shape. A one-word query and a paragraph cost almost
// the same, because the system prompt dominates — which is worth showing.
const QUERIES = [
  'I like padel',
  '3 bed in Mallorca',
  'Near a beach, under 150k',
  'Somewhere quiet, not too touristic',
  'I like scuba diving, I like padel, I want to be near a beach — 3 bed in Mallorca, somewhere quiet, not too touristic',
  'Long walks and hiking trails, somewhere in the mountains',
  'Museums, galleries and a bit of history, plus good restaurants',
  'Somewhere I can work from for a month — coworking, decent wifi, a town nearby',
];

const SYSTEM_INTENT = intentSystemPrompt(vocab);

const rows = QUERIES.map(q => {
  const intent = fallbackIntent(q, vocab);
  const ranked = rankProperties(intent, props, facets, { limit: 12 });
  const copyUser = JSON.stringify(buildCopyPayload(q, ranked));
  const fb = fallbackCopy(ranked);
  // What the copy model is actually asked to produce: a headline plus one
  // sentence per shortlisted home, as JSON. The fallback generator writes the
  // same shape from the same evidence, so its size is a sane stand-in.
  const likelyOut = JSON.stringify({ headline: fb.headline, why: fb.why });
  return { q, copyUser, likelyOut, n: ranked.results.length };
});

const counts = countAll([
  SYSTEM_INTENT,
  COPY_SYSTEM_PROMPT,
  ...rows.map(r => r.q),
  ...rows.map(r => r.copyUser),
  ...rows.map(r => r.likelyOut),
]);

const sysIntent = counts[0];
const sysCopy = counts[1];
const N = rows.length;
rows.forEach((r, i) => {
  r.tQuery = counts[2 + i];
  r.tCopyUser = counts[2 + N + i];
  r.tLikelyOut = counts[2 + 2 * N + i];
  r.inTotal = sysIntent + r.tQuery + sysCopy + r.tCopyUser;
});

const money = (n) => n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
const pad = (s, w) => String(s).padEnd(w);
const num = (s, w) => String(s).padStart(w);

console.log('\nFIXED COST OF EVERY SEARCH (the two system prompts)');
console.log(`  intent system prompt          ${num(sysIntent, 6)} tokens  (${SYSTEM_INTENT.length} chars)`);
console.log(`  copy system prompt            ${num(sysCopy, 6)} tokens  (${COPY_SYSTEM_PROMPT.length} chars)`);
console.log(`  ------------------------------${'-'.repeat(7)}`);
console.log(`  unavoidable input per search  ${num(sysIntent + sysCopy, 6)} tokens`);

console.log('\nPER QUERY (input tokens across both calls)');
console.log(`  ${pad('query', 62)} ${num('res', 4)} ${num('q', 6)} ${num('payload', 8)} ${num('IN', 7)} ${num('~OUT', 7)}`);
for (const r of rows) {
  const q = r.q.length > 60 ? r.q.slice(0, 57) + '...' : r.q;
  console.log(`  ${pad(q, 62)} ${num(r.n, 4)} ${num(r.tQuery, 6)} ${num(r.tCopyUser, 8)} ${num(r.inTotal, 7)} ${num(r.tLikelyOut, 7)}`);
}

const avgIn = Math.round(rows.reduce((s, r) => s + r.inTotal, 0) / N);
const maxIn = Math.max(...rows.map(r => r.inTotal));
const avgOutObserved = Math.round(rows.reduce((s, r) => s + r.tLikelyOut, 0) / N);
const ceilingOut = MAX_TOKENS.intent + MAX_TOKENS.copy;

console.log(`\n  average input  ${avgIn} tokens   worst  ${maxIn} tokens`);
console.log(`  output: ~${avgOutObserved} tokens on the evidence we hand it; hard ceiling ${ceilingOut} (maxTokens 500 + 900)`);

// The fixed part of the input is the two system prompts; everything else — the
// buyer's sentence and the shortlist we hand the copy model — is different every
// time and never cached.
const fixedIn = sysIntent + sysCopy;

// Three scenarios, because the honest answer is a range. The middle one is what
// a live site actually pays once traffic is steady enough to keep the prefix warm.
const cost = (p, { i, o, cached = 0 }) =>
  ((i - cached) * p.in + cached * p.in * CACHE_DISCOUNT + o * p.out) / 1e6;

const SCENARIOS = [
  { name: 'cold', i: avgIn, o: avgOutObserved, cached: 0 },
  { name: 'cached', i: avgIn, o: avgOutObserved, cached: fixedIn },
  { name: 'worst', i: maxIn, o: ceilingOut, cached: 0 },
];

console.log('\nCOST PER 1,000 SEARCHES');
console.log(`  ${pad('model', 36)} ${num('cold', 10)} ${num('cached', 10)} ${num('worst case', 12)}`);
for (const [, p] of Object.entries(PRICES)) {
  const c = SCENARIOS.map(s => money(cost(p, s) * 1000));
  console.log(`  ${pad(p.label, 36)} ${num(c[0], 10)} ${num(c[1], 10)} ${num(c[2], 12)}`);
}
console.log(`  (cached = the ${fixedIn} fixed system-prompt tokens billed at ${CACHE_DISCOUNT * 100}%, which is`);
console.log('   what happens automatically once a search has run in the last 30 minutes)');

const luna = PRICES['gpt-5.6-luna'];
const perSearchExp = cost(luna, SCENARIOS[1]);
const perSearchWorst = cost(luna, SCENARIOS[2]);

console.log('\nWHAT THE SAFEGUARDS CAP THE BILL AT (Luna)');
console.log(`  one search                       ${money(perSearchExp)}  (worst ${money(perSearchWorst)})`);
console.log(`  ${DAILY_CAP}/day global cap             ${money(perSearchExp * DAILY_CAP)}/day  (worst ${money(perSearchWorst * DAILY_CAP)}/day)`);
console.log(`  a full month at the cap          ${money(perSearchExp * DAILY_CAP * 30)}  (worst ${money(perSearchWorst * DAILY_CAP * 30)})`);
console.log(`  one visitor, 40/day per-IP max   ${money(perSearchExp * 40)}  (worst ${money(perSearchWorst * 40)})`);
console.log('\n  Identical queries are cached for 15 minutes and cost nothing, and a');
console.log('  keyword-parsed search costs nothing at all, so real spend sits below');
console.log('  the expected column.\n');
