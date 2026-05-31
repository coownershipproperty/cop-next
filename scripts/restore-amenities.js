#!/usr/bin/env node
/**
 * scripts/restore-amenities.js
 *
 * Restores amenities in Supabase from the clean `lib/properties.json` snapshot.
 *
 * Background
 *   The admin property editor used to take amenities as a comma-separated input
 *   and split on `,` when saving. Any amenity that itself contained a comma
 *   ("Private, heated pool (Private sauna, optional)") got mangled into orphan
 *   fragments ("Private", "heated pool (Private sauna", "optional)", ...).
 *
 *   `lib/properties.json` was written by the scrapers (add-myne-property.js,
 *   scrape-myne-all.js, sync-sheet.js, etc.) and preserves amenities as proper
 *   array elements with commas-inside-strings intact. So we treat properties.json
 *   as the source of truth and push it back into Supabase.
 *
 * Usage:
 *   node scripts/restore-amenities.js                # dry-run, print diffs
 *   node scripts/restore-amenities.js --apply        # actually update Supabase
 *   node scripts/restore-amenities.js --apply --partner=myne   # one partner only
 *   node scripts/restore-amenities.js --slug=vilamoura-portugal-3-bed-villa-with-pool --apply
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (so it can bypass RLS to update rows).
 */
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).flatMap(a => {
    if (!a.startsWith('--')) return [];
    const [k, v] = a.slice(2).split('=');
    return [[k, v === undefined ? true : v]];
  })
);

const APPLY = !!args.apply;
const FILTER_PARTNER = args.partner || null;
const FILTER_SLUG    = args.slug    || null;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Pull from Vercel:  vercel env pull .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

async function main() {
  const file = path.join(process.cwd(), 'lib', 'properties.json');
  const local = JSON.parse(fs.readFileSync(file, 'utf-8'));

  let candidates = local.filter(p => Array.isArray(p.amenities) && p.amenities.length > 0);
  if (FILTER_PARTNER) candidates = candidates.filter(p => p.partner === FILTER_PARTNER);
  if (FILTER_SLUG)    candidates = candidates.filter(p => p.slug === FILTER_SLUG);

  console.log(`Loaded ${local.length} local properties, ${candidates.length} with amenities to check.`);
  console.log(APPLY ? '🟢 APPLY MODE — will update Supabase.' : '⚪ DRY-RUN — no writes. Re-run with --apply to commit.');
  console.log('');

  // Fetch all Supabase amenities in one go
  const slugs = candidates.map(p => p.slug);
  const all = [];
  // Supabase has a hard 1000-row limit per query; page through 500 at a time
  const PAGE = 500;
  for (let i = 0; i < slugs.length; i += PAGE) {
    const chunk = slugs.slice(i, i + PAGE);
    const { data, error } = await supabase
      .from('properties')
      .select('slug, amenities')
      .in('slug', chunk);
    if (error) { console.error('Supabase fetch error:', error); process.exit(1); }
    all.push(...(data || []));
  }
  const remoteBySlug = Object.fromEntries(all.map(r => [r.slug, r.amenities || []]));

  let toUpdate = 0;
  let alreadyClean = 0;
  let missing = 0;
  const diffs = [];

  for (const p of candidates) {
    const remote = remoteBySlug[p.slug];
    if (remote === undefined) { missing++; continue; }
    if (arraysEqual(remote, p.amenities)) { alreadyClean++; continue; }
    toUpdate++;
    diffs.push({ slug: p.slug, partner: p.partner, remote, local: p.amenities });
  }

  console.log(`Already clean:    ${alreadyClean}`);
  console.log(`Need restore:     ${toUpdate}`);
  console.log(`Missing in DB:    ${missing}`);
  console.log('');

  // Show first 10 diffs
  const preview = diffs.slice(0, 10);
  preview.forEach((d, i) => {
    console.log(`── ${i + 1}. [${d.partner}] ${d.slug}`);
    console.log(`   remote (${d.remote.length}): ${JSON.stringify(d.remote).slice(0, 200)}${JSON.stringify(d.remote).length > 200 ? '…' : ''}`);
    console.log(`   local  (${d.local.length}): ${JSON.stringify(d.local).slice(0, 200)}${JSON.stringify(d.local).length > 200 ? '…' : ''}`);
    console.log('');
  });
  if (diffs.length > preview.length) console.log(`(+ ${diffs.length - preview.length} more)\n`);

  if (!APPLY || toUpdate === 0) {
    if (!APPLY) console.log('Dry-run complete. Re-run with --apply to push these to Supabase.');
    return;
  }

  console.log(`Applying ${toUpdate} updates…`);
  let ok = 0, fail = 0;
  for (const d of diffs) {
    const { error } = await supabase
      .from('properties')
      .update({ amenities: d.local })
      .eq('slug', d.slug);
    if (error) {
      console.error('  ✗', d.slug, error.message);
      fail++;
    } else {
      ok++;
      if (ok % 25 === 0) console.log(`  …${ok}/${toUpdate}`);
    }
  }
  console.log(`Done. ${ok} updated, ${fail} failed.`);
}

main().catch(err => { console.error(err); process.exit(1); });
