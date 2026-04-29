#!/usr/bin/env node
/**
 * sync-drive-gallery.js
 * ─────────────────────────────────────────────────────────────
 * Syncs a property's Google Drive folder into the Supabase
 * `photos` and `documents` columns, uploading files to Supabase Storage.
 *
 * Classification rules:
 *   photos    → files whose name starts with "photo-" (case-insensitive)
 *   documents → everything else: floor plans, screenshots, PDFs, info sheets
 *
 * USAGE:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/sync-drive-gallery.js --slug=ericeira-portugal-2-bed-apartment-with-infinity-pool
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/sync-drive-gallery.js --slug=palm-springs-california-3-bed-house,ibiza-spain-3-bed-house-with-sea-views-3
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/sync-drive-gallery.js --all   (sync all properties with a drive_url)
 */

'use strict';

const { google }     = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const https          = require('https');
const http           = require('http');

// ── Config ──────────────────────────────────────────────────────────────────
const CREDS_FILE    = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = 'property-photos';

// ── Args ─────────────────────────────────────────────────────────────────────
const slugArg = process.argv.find(a => a.startsWith('--slug='));
const allMode = process.argv.includes('--all');
const SLUGS   = slugArg ? slugArg.split('=')[1].split(',').map(s => s.trim()) : [];

if (!SERVICE_KEY) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('   Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/sync-drive-gallery.js --slug=SLUG\n');
  process.exit(1);
}
if (!allMode && SLUGS.length === 0) {
  console.error('\n❌  Provide --slug=SLUG or --all\n');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractFolderId(driveUrl) {
  const m = driveUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// Classification by filename prefix:
//   photo-*   → full-bleed hero photos
//   extra-*   → brochure/secondary photos (contained, smaller display)
//   anything else → floor plans & documents (contained)
function classifyFile(name) {
  if (/^photo[-_]/i.test(name)) return 'photo';
  if (/^extra[-_]/i.test(name)) return 'extra';
  return 'document';
}

function downloadBuffer(url, auth) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    if (auth) opts.headers['Authorization'] = `Bearer ${auth}`;
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, opts, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location, auth).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'image/jpeg',
      }));
    }).on('error', reject).setTimeout(30000, function () { this.destroy(); reject(new Error('timeout')); });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Init Google auth
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDS_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  // Init Supabase
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Get properties to sync
  let query = sb.from('properties').select('slug, title, drive_url');
  if (!allMode) {
    query = query.in('slug', SLUGS);
  } else {
    query = query.not('drive_url', 'is', null).neq('drive_url', '');
  }
  const { data: props, error: propErr } = await query;
  if (propErr) { console.error('DB error:', propErr.message); process.exit(1); }
  if (!props || props.length === 0) { console.log('No matching properties found.'); return; }

  console.log(`\n🔄  Syncing ${props.length} properties...\n`);

  for (const prop of props) {
    console.log(`\n── ${prop.slug}`);
    if (!prop.drive_url) { console.log('   ⚠️  No drive_url, skipping'); continue; }

    const folderId = extractFolderId(prop.drive_url);
    if (!folderId) { console.log(`   ⚠️  Could not parse folder ID from: ${prop.drive_url}`); continue; }

    // List files in Drive folder
    let files = [];
    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        orderBy: 'name',
      });
      files = res.data.files || [];
    } catch (e) {
      console.log(`   ❌  Drive list failed: ${e.message}`);
      continue;
    }

    console.log(`   Found ${files.length} files in Drive`);

    const photoUrls = [];
    const extraUrls = [];
    const docUrls   = [];

    for (const file of files) {
      // Only handle images and PDFs
      const isImg = file.mimeType.startsWith('image/');
      const isPdf = file.mimeType === 'application/pdf';
      if (!isImg && !isPdf) {
        console.log(`   ⏭  Skipping ${file.name} (${file.mimeType})`);
        continue;
      }

      const classify = classifyFile(file.name);
      const icon = classify === 'photo' ? '📷' : classify === 'extra' ? '🖼 ' : '📄';
      process.stdout.write(`   ${icon}  ${file.name} → `);

      // Download from Drive
      let buffer, contentType;
      try {
        const token = await authClient.getAccessToken();
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const result = await downloadBuffer(downloadUrl, token.token);
        buffer = result.buffer;
        contentType = result.contentType.split(';')[0] || (isPdf ? 'application/pdf' : 'image/jpeg');
      } catch (e) {
        console.log(`DOWNLOAD FAILED: ${e.message}`);
        continue;
      }

      // Upload to Supabase Storage
      const ext  = isPdf ? 'pdf' : (file.name.match(/\.(jpe?g|png|webp|gif)$/i)?.[1] || 'jpg');
      const path = `${prop.slug}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await sb.storage
        .from(STORAGE_BUCKET)
        .upload(path, buffer, { contentType, upsert: true });

      if (upErr) {
        console.log(`UPLOAD FAILED: ${upErr.message}`);
        continue;
      }

      const { data: { publicUrl } } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (classify === 'photo')         photoUrls.push(publicUrl);
      else if (classify === 'extra')    extraUrls.push(publicUrl);
      else                              docUrls.push(publicUrl);
      console.log(`✅`);
    }

    // Update Supabase DB
    const updates = {};
    if (photoUrls.length > 0) updates.photos       = photoUrls;
    if (extraUrls.length > 0) updates.extra_photos  = extraUrls;
    if (docUrls.length > 0)   updates.documents     = docUrls;

    if (Object.keys(updates).length > 0) {
      const { error: dbErr } = await sb.from('properties').update(updates).eq('slug', prop.slug);
      if (dbErr) {
        console.log(`   ❌  DB update failed: ${dbErr.message}`);
      } else {
        console.log(`   ✅  Saved: ${photoUrls.length} photos, ${extraUrls.length} extras, ${docUrls.length} documents`);
      }
    } else {
      console.log(`   ⚠️  No files to update`);
    }
  }

  console.log('\n✅  Sync complete.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
