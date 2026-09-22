#!/usr/bin/env node
/**
 * scripts/translate-property-titles.mjs
 *
 * Fills title_{locale} on the properties table from lib/propertyTitles.js.
 * The vocabulary and the composer live there so /api/cron/translate-titles
 * can use exactly the same ones; this file is the manual runner and the
 * place to see what is still being skipped.
 *
 *   node scripts/translate-property-titles.mjs            # dry run, all locales
 *   node scripts/translate-property-titles.mjs it nl      # dry run, two locales
 *   node scripts/translate-property-titles.mjs --write    # write to Supabase
 *   node scripts/translate-property-titles.mjs --emit-sql # /tmp/titles-{locale}.sql
 *
 * Adding a missing token: put it in TYPES/FEATURES (it, nl, pt, sv, da, no)
 * AND in LEGACY_TYPES/LEGACY_FEATURES (es, fr, de) in lib/propertyTitles.js,
 * then dry-run to see the skip list shrink.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { translateTitle, LOCALES } from '../lib/propertyTitles.js';

// ── Runner ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const write = args.includes('--write');
const locales = args.filter((a) => LOCALES.includes(a));
const targets = locales.length ? locales : LOCALES;

// Reads with the public anon key; writes need SUPABASE_SERVICE_ROLE_KEY in the
// environment (never committed). Without --write the script only prints, which
// is how you check coverage before touching the database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
// The anon key is public (next.config.js already ships it to the browser), so
// a dry run needs no secrets at all — read it straight out of the config.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || (readFileSync(new URL('../next.config.js', import.meta.url), 'utf-8')
        .match(/NEXT_PUBLIC_SUPABASE_ANON_KEY: process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY \|\| '([^']+)'/) || [])[1];
const key = write ? process.env.SUPABASE_SERVICE_ROLE_KEY : anonKey;
if (write && !key) {
  console.error('--write needs SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}
const supabase = createClient(url, key);

// --emit-sql prints UPDATE statements instead of writing, so the change can be
// applied through whatever authenticated path is to hand and reviewed first.
const emitSql = args.includes('--emit-sql');

const { data: rows, error } = await supabase.from('properties').select('slug, title');
if (error) { console.error(error.message); process.exit(1); }

const unknown = new Map();
for (const locale of targets) {
  let ok = 0, skipped = 0;
  const updates = [];
  for (const row of rows) {
    if (!row.title) { skipped++; continue; }
    const t = translateTitle(row.title, locale);
    if (!t) {
      skipped++;
      unknown.set(row.title, (unknown.get(row.title) || 0) + 1);
      continue;
    }
    ok++;
    updates.push({ slug: row.slug, value: t });
  }
  console.log(`${locale}: ${ok} translated, ${skipped} skipped  ` +
    (updates[0] ? `e.g. ${updates[0].value}` : ''));

  if (emitSql) {
    const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
    const sql = 'update public.properties as p set title_' + locale +
      ' = v.t from (values\n' +
      updates.map((u) => `  (${esc(u.slug)}, ${esc(u.value)})`).join(',\n') +
      `\n) as v(slug, t) where p.slug = v.slug;\n`;
    writeFileSync(`/tmp/titles-${locale}.sql`, sql);
    console.log(`  → wrote /tmp/titles-${locale}.sql (${updates.length} rows)`);
  }

  if (write) {
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      await Promise.all(batch.map((u) =>
        supabase.from('properties').update({ [`title_${locale}`]: u.value }).eq('slug', u.slug)
      ));
    }
    console.log(`  → wrote ${updates.length} title_${locale} values`);
  }
}

if (unknown.size) {
  console.log(`\n${unknown.size} distinct titles skipped (unknown type or feature). Top 15:`);
  [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([t]) => console.log('  ', t.split(' — ')[1]));
  console.log('\nAdd the missing token to TYPES or FEATURES to cover these.');
}
