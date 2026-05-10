#!/usr/bin/env node
/**
 * scripts/translate-content.js
 *
 * Backfills the _es and _fr translation columns on the `properties` and
 * `posts` Supabase tables using Anthropic's Claude API.
 *
 * Locale-specific terminology comes from keyword-research-{spanish,french}.md:
 *   • Spanish:  primary `copropiedad`, secondary `propiedad fraccionada`
 *   • French:   primary compound `copropriété résidence secondaire`,
 *               secondary `co-ownership` (used in French press)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-… SUPABASE_SERVICE_ROLE_KEY=eyJ… \
 *     node scripts/translate-content.js [options]
 *
 * Options:
 *   --table=properties    only translate properties (default: both)
 *   --table=posts         only translate posts
 *   --locale=es           only Spanish (default: both es and fr)
 *   --locale=fr           only French
 *   --include-content     include full post body in translation (expensive)
 *   --limit=N             stop after N rows per table (default: all)
 *   --start=N             resume from row index N (0-indexed)
 *   --dry-run             generate translations but don't write to DB
 *   --force               re-translate even if _es / _fr already populated
 *
 * Cost estimate at default scope (title + description for properties; title,
 * subtitle, excerpt for posts) using Claude Sonnet:
 *   • ~347 properties × 2 locales × ~500 input tokens = $5–10
 *   • ~120 posts × 2 locales × ~300 input tokens = $1–3
 *   • Total: ~$10–15 USD for the full backfill.
 *
 * The script is idempotent — re-running skips rows that already have
 * translations unless --force is passed. Saves to the DB after every row,
 * so it's safe to interrupt and resume with --start.
 */

const { createClient } = require('@supabase/supabase-js');

// ── Config ──────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY env var');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── CLI arg parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  table: 'both',
  locale: 'both',
  includeContent: false,
  limit: null,
  start: 0,
  dryRun: false,
  force: false,
};
for (const a of args) {
  if (a.startsWith('--table=')) opts.table = a.split('=')[1];
  else if (a.startsWith('--locale=')) opts.locale = a.split('=')[1];
  else if (a === '--include-content') opts.includeContent = true;
  else if (a.startsWith('--limit=')) opts.limit = parseInt(a.split('=')[1], 10);
  else if (a.startsWith('--start=')) opts.start = parseInt(a.split('=')[1], 10);
  else if (a === '--dry-run') opts.dryRun = true;
  else if (a === '--force') opts.force = true;
}

const localesToProcess = opts.locale === 'both' ? ['es', 'fr'] : [opts.locale];

// ── Locale-specific translation prompts ──────────────────────────────────────
const PROMPTS = {
  es: {
    languageName: 'Spanish (Castilian)',
    productTerm: 'copropiedad',
    secondaryTerms: 'propiedad fraccionada, segunda residencia compartida',
    avoidTerms: 'multipropiedad (this means timeshare and has negative connotations in Spain — never use as self-description)',
    cultural: 'Spain — use European Spanish (Castilian), not Latin American. Use formal "usted" sparingly; informal "tú" is fine for marketing copy. Use European number format (comma as decimal, period as thousands). Currency: € symbol after amount in some contexts, before in others — match what feels natural.',
  },
  fr: {
    languageName: 'French (France)',
    productTerm: 'copropriété de résidence secondaire',
    secondaryTerms: 'co-ownership (anglicism used in French press), propriété fractionnée',
    avoidTerms: 'multipropriété (timeshare — strongly negative), temps partagé (legal timeshare term, regulated), immobilier fractionné (associated with crowdfunded investment platforms, wrong audience). Note: copropriété alone is legally ambiguous in French (means apartment-building common areas) — always pair with résidence secondaire when context is unclear.',
    cultural: 'Metropolitan French. Use formal "vous" in marketing copy. Use French number format (space as thousands separator, comma as decimal). Currency: € symbol after amount with non-breaking space.',
  },
};

// ── Translation function (calls Anthropic API) ───────────────────────────────
async function translate(fields, targetLocale, contextLabel) {
  const prompt = PROMPTS[targetLocale];
  const fieldNames = Object.keys(fields);

  const userPrompt = `You are translating real-estate copy from English into ${prompt.languageName} for a luxury co-ownership property marketplace called Co-Ownership Property (COP).

Translation rules:
1. Use "${prompt.productTerm}" as the primary product term. Secondary acceptable terms: ${prompt.secondaryTerms}.
2. AVOID these terms: ${prompt.avoidTerms}.
3. Cultural notes: ${prompt.cultural}
4. Preserve all proper nouns (place names, property names) — but adapt to native form when standard (e.g., "Mallorca" stays "Mallorca" in Spanish but becomes "Majorque" in French; "London" → "Londres" in both).
5. Preserve any **markdown bold markers** and other formatting exactly.
6. Strip any partner brand mentions (MYNE, Vivla, Pacaso, And Hamlet, Lazazu, Prello) — replace with generic descriptions. COP is an independent aggregator and cannot name partner brands on its own pages.
7. Do not translate the bare phrase "Co-Ownership Property" or "COP" — that's the brand name.
8. Match the tone: upscale, aspirational, factual. Not AI-translated-sounding. Read the English carefully and produce a translation that a native ${prompt.languageName} speaker would write naturally.

Context: this content is from ${contextLabel}.

Return ONLY a JSON object mapping each input field name to its translated value. No prose, no markdown fences, just raw JSON.

Input fields to translate:
${JSON.stringify(fields, null, 2)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  // Strip markdown fences if Claude adds them despite instructions.
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${cleaned.slice(0, 300)}`);
  }

  // Sanity check: every requested field came back.
  for (const name of fieldNames) {
    if (parsed[name] === undefined) {
      throw new Error(`Missing field "${name}" in translation response`);
    }
  }

  return parsed;
}

// ── Properties ──────────────────────────────────────────────────────────────
async function translateProperties() {
  console.log('\n=== PROPERTIES ===');

  // Fetch all candidates. We filter "needs translation" client-side because
  // the OR conditions across multiple locales are awkward in PostgREST.
  const { data: rows, error } = await supabase
    .from('properties')
    .select('slug, title, description, title_es, description_es, title_fr, description_fr')
    .order('slug');

  if (error) throw error;

  const candidates = rows
    .map((r, i) => ({ ...r, idx: i }))
    .filter(r => {
      if (opts.force) return true;
      // Need translation if any target locale has missing _es or _fr.
      const needsES = localesToProcess.includes('es') && (!r.title_es || !r.description_es);
      const needsFR = localesToProcess.includes('fr') && (!r.title_fr || !r.description_fr);
      return needsES || needsFR;
    })
    .slice(opts.start, opts.limit ? opts.start + opts.limit : undefined);

  console.log(`${candidates.length} properties need translation (start=${opts.start}, limit=${opts.limit ?? 'none'})`);

  for (const [i, p] of candidates.entries()) {
    console.log(`\n[${i + 1}/${candidates.length}] ${p.slug}`);

    for (const locale of localesToProcess) {
      const titleKey = `title_${locale}`;
      const descKey = `description_${locale}`;

      // Skip if already translated and not forcing.
      if (!opts.force && p[titleKey] && p[descKey]) {
        console.log(`  ${locale}: already translated, skip`);
        continue;
      }

      try {
        const fields = {
          title: p.title || '',
          description: p.description || '',
        };
        const out = await translate(fields, locale, `a property listing titled "${p.title}"`);

        if (opts.dryRun) {
          console.log(`  ${locale} [DRY RUN]:`);
          console.log(`    title:       ${out.title}`);
          console.log(`    description: ${(out.description || '').slice(0, 100)}…`);
        } else {
          const update = {};
          update[titleKey] = out.title;
          update[descKey] = out.description;
          const { error: upErr } = await supabase
            .from('properties')
            .update(update)
            .eq('slug', p.slug);
          if (upErr) throw upErr;
          console.log(`  ${locale}: ✓ saved`);
        }
      } catch (e) {
        console.error(`  ${locale}: ✗ ${e.message}`);
      }
    }
  }
}

// ── Posts ───────────────────────────────────────────────────────────────────
async function translatePosts() {
  console.log('\n=== POSTS ===');

  const baseFields = ['slug', 'title', 'subtitle', 'excerpt'];
  const contentFields = opts.includeContent ? ['content'] : [];
  const allFields = [...baseFields, ...contentFields];
  const localeColumns = ['es', 'fr'].flatMap(loc => allFields.filter(f => f !== 'slug').map(f => `${f}_${loc}`));
  const selectStr = [...allFields, ...localeColumns].join(', ');

  const { data: rows, error } = await supabase
    .from('posts')
    .select(selectStr)
    .eq('published', true)
    .order('slug');

  if (error) throw error;

  const candidates = rows
    .map((r, i) => ({ ...r, idx: i }))
    .filter(r => {
      if (opts.force) return true;
      const needsLocale = (loc) => allFields.filter(f => f !== 'slug').some(f => !r[`${f}_${loc}`]);
      return localesToProcess.some(needsLocale);
    })
    .slice(opts.start, opts.limit ? opts.start + opts.limit : undefined);

  console.log(`${candidates.length} posts need translation (start=${opts.start}, limit=${opts.limit ?? 'none'})`);

  for (const [i, p] of candidates.entries()) {
    console.log(`\n[${i + 1}/${candidates.length}] ${p.slug}`);

    for (const locale of localesToProcess) {
      // Build the set of fields that still need translating for this locale.
      const fieldsToTranslate = {};
      for (const f of allFields) {
        if (f === 'slug') continue;
        const localeKey = `${f}_${locale}`;
        if ((opts.force || !p[localeKey]) && p[f]) {
          fieldsToTranslate[f] = p[f];
        }
      }

      if (Object.keys(fieldsToTranslate).length === 0) {
        console.log(`  ${locale}: already translated, skip`);
        continue;
      }

      try {
        const out = await translate(fieldsToTranslate, locale, `a blog post titled "${p.title}"`);

        if (opts.dryRun) {
          console.log(`  ${locale} [DRY RUN]:`);
          for (const [k, v] of Object.entries(out)) {
            console.log(`    ${k}: ${(v || '').slice(0, 80).replace(/\n/g, ' ')}…`);
          }
        } else {
          const update = {};
          for (const [k, v] of Object.entries(out)) {
            update[`${k}_${locale}`] = v;
          }
          const { error: upErr } = await supabase
            .from('posts')
            .update(update)
            .eq('slug', p.slug);
          if (upErr) throw upErr;
          console.log(`  ${locale}: ✓ saved (${Object.keys(out).length} fields)`);
        }
      } catch (e) {
        console.error(`  ${locale}: ✗ ${e.message}`);
      }
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`Translation script starting`);
  console.log(`  table:           ${opts.table}`);
  console.log(`  locales:         ${localesToProcess.join(', ')}`);
  console.log(`  include-content: ${opts.includeContent}`);
  console.log(`  dry-run:         ${opts.dryRun}`);
  console.log(`  force:           ${opts.force}`);
  console.log(`  model:           ${CLAUDE_MODEL}`);

  try {
    if (opts.table === 'both' || opts.table === 'properties') {
      await translateProperties();
    }
    if (opts.table === 'both' || opts.table === 'posts') {
      await translatePosts();
    }
    console.log('\nDone.');
  } catch (e) {
    console.error('\nFatal error:', e.message);
    process.exit(1);
  }
})();
