#!/usr/bin/env node
/**
 * migrate-images-to-supabase.js
 *
 * Migrates property hero images and first 3 gallery images from external hosts
 * (Google Drive, Storyblok, Webflow CDN) to Supabase Storage.
 *
 * What it does per property:
 *   - Downloads: img (hero) + images[0], images[1], images[2]
 *   - Uploads to: property-images/{slug}/hero.jpg|png|webp
 *                 property-images/{slug}/gallery-0.jpg etc.
 *   - Updates DB: img column + images array (first 3 entries replaced)
 *   - Skips:     images already on supabase.co (already migrated)
 *   - Logs:      failures to migration-failures.json for manual review
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate-images-to-supabase.js
 *
 * Find your service role key:
 *   Supabase dashboard → Settings → API → service_role (secret)
 *
 * Options:
 *   --dry-run   Print what would happen without downloading/uploading anything
 *   --slug xyz  Only migrate one specific property slug
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET          = 'property-images';
const CONCURRENCY     = 4;   // properties processed in parallel
const RETRY_ATTEMPTS  = 3;
const RETRY_DELAY_MS  = 1500;
const FAILURES_LOG    = path.join(__dirname, 'migration-failures.json');
const DRY_RUN         = process.argv.includes('--dry-run');
const ONLY_SLUG       = (() => { const i = process.argv.indexOf('--slug'); return i !== -1 ? process.argv[i + 1] : null; })();

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extFromContentType(ct) {
  if (!ct) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('png'))  return 'png';
  if (ct.includes('gif'))  return 'gif';
  return 'jpg';
}

function isAlreadyMigrated(url) {
  return url && url.includes('supabase.co/storage');
}

function isExternalImage(url) {
  return url && (
    url.includes('lh3.googleusercontent.com') ||
    url.includes('storyblok.com') ||
    url.includes('website-files.com')
  );
}

async function downloadImage(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COP-Migration/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: contentType.split(';')[0].trim() };
  } catch (err) {
    if (attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      return downloadImage(url, attempt + 1);
    }
    throw err;
  }
}

async function uploadToSupabase(supabase, storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000', // 1 year
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Per-property migration ────────────────────────────────────────────────────

async function migrateProperty(supabase, property, failures) {
  const { slug, img, images } = property;
  const galleryUrls = Array.isArray(images) ? images.slice(0, 3) : [];

  let newHero = img;
  const newGallery = [...(Array.isArray(images) ? images : [])];

  let changed = false;

  // ── Hero image ──────────────────────────────────────────────────────────────
  if (img && !isAlreadyMigrated(img) && isExternalImage(img)) {
    if (DRY_RUN) {
      console.log(`  [dry-run] Would migrate hero: ${img.slice(0, 70)}`);
    } else {
      try {
        const { buffer, contentType } = await downloadImage(img);
        const ext = extFromContentType(contentType);
        const storagePath = `${slug}/hero.${ext}`;
        newHero = await uploadToSupabase(supabase, storagePath, buffer, contentType);
        changed = true;
        process.stdout.write('h');
      } catch (err) {
        failures.push({ slug, field: 'hero', url: img, error: err.message });
        process.stdout.write('!');
      }
    }
  }

  // ── Gallery images [0..2] ───────────────────────────────────────────────────
  for (let i = 0; i < galleryUrls.length; i++) {
    const url = galleryUrls[i];
    if (!url || isAlreadyMigrated(url) || !isExternalImage(url)) continue;

    if (DRY_RUN) {
      console.log(`  [dry-run] Would migrate gallery[${i}]: ${url.slice(0, 70)}`);
      continue;
    }

    try {
      const { buffer, contentType } = await downloadImage(url);
      const ext = extFromContentType(contentType);
      const storagePath = `${slug}/gallery-${i}.${ext}`;
      newGallery[i] = await uploadToSupabase(supabase, storagePath, buffer, contentType);
      changed = true;
      process.stdout.write('g');
    } catch (err) {
      failures.push({ slug, field: `gallery[${i}]`, url, error: err.message });
      process.stdout.write('!');
    }
  }

  // ── Update DB if anything changed ───────────────────────────────────────────
  if (changed && !DRY_RUN) {
    const { error } = await supabase
      .from('properties')
      .update({ img: newHero, images: newGallery })
      .eq('slug', slug);
    if (error) {
      failures.push({ slug, field: 'db_update', error: error.message });
      process.stdout.write('X');
    } else {
      process.stdout.write('.');
    }
  }
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fcyNryHCv8uzNCDOvE_SEg_skAqobvs';

  if (!SERVICE_KEY && !DRY_RUN) {
    console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.error('   Find it: Supabase dashboard → Settings → API → service_role\n');
    console.error('   Run as:  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate-images-to-supabase.js\n');
    console.error('   To preview what would be migrated, add --dry-run (no key needed)\n');
    process.exit(1);
  }

  // Dry run uses anon key (read-only), live run requires service role key
  const supabase = createClient(SUPABASE_URL, DRY_RUN ? ANON_KEY : SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch properties
  let query = supabase.from('properties').select('slug, img, images');
  if (ONLY_SLUG) query = query.eq('slug', ONLY_SLUG);
  const { data: properties, error } = await query;
  if (error) { console.error('Failed to fetch properties:', error.message); process.exit(1); }

  const toMigrate = properties.filter(p =>
    (p.img && !isAlreadyMigrated(p.img) && isExternalImage(p.img)) ||
    (Array.isArray(p.images) && p.images.slice(0, 3).some(u => u && !isAlreadyMigrated(u) && isExternalImage(u)))
  );

  console.log(`\n🚀  Migrating images to Supabase Storage`);
  console.log(`    Bucket:     property-images`);
  console.log(`    Properties: ${properties.length} total, ${toMigrate.length} need migration`);
  console.log(`    Concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log(`    DRY RUN — no changes will be made`);
  console.log(`\n    Legend: h=hero g=gallery .=db updated !=failed X=db error\n`);

  const failures = [];
  const tasks = toMigrate.map(p => () => migrateProperty(supabase, p, failures));

  const startTime = Date.now();
  await runPool(tasks, CONCURRENCY);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n\n✅  Done in ${elapsed}s`);
  console.log(`    Migrated: ${toMigrate.length - failures.length} properties`);
  console.log(`    Failures: ${failures.length}`);

  if (failures.length > 0) {
    fs.writeFileSync(FAILURES_LOG, JSON.stringify(failures, null, 2));
    console.log(`\n⚠️   Failed items logged to: ${FAILURES_LOG}`);
    console.log('    Review and re-run with --slug <slug> for individual retries.');
  }

  console.log('\n📋  Next step: add a.storyblok.com and cdn.prod.website-files.com to');
  console.log('    next.config.js remotePatterns, then switch <img> → <Image> site-wide.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
