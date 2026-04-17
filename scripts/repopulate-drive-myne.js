#!/usr/bin/env node
/**
 * repopulate-drive-myne.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Upload (or re-upload) photos to Google Drive for MYNE properties.
 * Run in batches of ~8 to stay within the 10-minute tool timeout.
 *
 * USAGE:
 *   node scripts/repopulate-drive-myne.js                          # missing driveUrl only
 *   node scripts/repopulate-drive-myne.js --force                  # redo ALL
 *   node scripts/repopulate-drive-myne.js --force --start=N        # resume from index N
 *   node scripts/repopulate-drive-myne.js --force --start=N --count=8  # safe batch of 8
 *
 * - Folder name: "{H1 title from notes URL} - Myne"  (e.g. "Casita Ses Salines - Myne")
 * - Saves lib/properties.json after EACH property (resumable if killed)
 * - Trashes any existing same-name folder before creating fresh one
 */

'use strict';

const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');

// ─── Config ──────────────────────────────────────────────────────────────────
const PROPS_FILE   = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE   = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const DRIVE_PARENT = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl';

// ─── CLI flags ────────────────────────────────────────────────────────────────
const FORCE     = process.argv.includes('--force');
const startArg  = process.argv.find(a => a.startsWith('--start='));
const countArg  = process.argv.find(a => a.startsWith('--count='));
const START_IDX = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
const MAX_COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : Infinity;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── Extract H1 title from a MYNE listing page ───────────────────────────────
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractH1Title(html) {
  const m = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  return m ? decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim()) : '';
}

// ─── Drive helpers ────────────────────────────────────────────────────────────
async function createDriveFolder(drive, name) {
  const existing = await drive.files.list({
    q: `name='${name}' and '${DRIVE_PARENT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  for (const f of existing.data.files || []) {
    console.log(`   🗑  Trashing old folder: ${f.id}`);
    await drive.files.update({ fileId: f.id, requestBody: { trashed: true }, supportsAllDrives: true });
  }
  const folder = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [DRIVE_PARENT] },
    fields: 'id', supportsAllDrives: true,
  });
  const folderId = folder.data.id;
  await drive.permissions.create({
    fileId: folderId, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true,
  });
  return folderId;
}

async function uploadImages(drive, folderId, imageUrls) {
  const { Readable } = require('stream');
  for (let i = 0; i < imageUrls.length; i++) {
    const url     = imageUrls[i];
    const num     = String(i + 1).padStart(2, '0');
    const ext     = url.split('.').pop().split('?')[0].toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    try {
      const { buffer, contentType } = await downloadBuffer(url);
      await drive.files.create({
        requestBody: { name: `photo-${num}.${safeExt}`, parents: [folderId] },
        media: { mimeType: contentType, body: Readable.from(buffer) },
        fields: 'id', supportsAllDrives: true,
      });
      process.stdout.write(`   📤 ${i + 1}/${imageUrls.length}   `);
    } catch (e) {
      console.warn(`\n   ⚠ Failed photo ${num}: ${e.message}`);
    }
  }
  process.stdout.write('\n');
}

// ─── Get folder name for a MYNE property ─────────────────────────────────────
// Uses the H1 title from the live MYNE page (stored in p.notes as source URL)
async function getFolderName(p) {
  if (p.notes && p.notes.includes('myne-homes.com/listings/')) {
    try {
      const html  = await fetchHtml(p.notes);
      const title = extractH1Title(html);
      if (title) return `${title} - Myne`;
    } catch (e) {
      console.warn(`   ⚠ Could not fetch page for title: ${e.message}`);
    }
  }
  // Fallback: derive from COP title (strip country + bed info = first part)
  const firstPart = p.title.split('—')[0].replace(/,\s*[^,]+$/, '').trim();
  return `${firstPart} - Myne`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('☁️  MYNE Drive repopulator\n');

  if (!fs.existsSync(CREDS_FILE)) {
    console.error('❌ Drive credentials not found at:', CREDS_FILE);
    process.exit(1);
  }

  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
  const drive = google.drive({ version: 'v3', auth });
  console.log('☁️  Google Drive connected');

  const allProps = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const myne     = allProps.filter(p => p.partner === 'myne');
  console.log(`Found ${myne.length} MYNE properties\n`);

  let updated = 0;

  for (let i = START_IDX; i < myne.length; i++) {
    const p = myne[i];

    // Skip if already has driveUrl and not forcing
    if (!FORCE && p.driveUrl) {
      continue;
    }

    if (!p.allImages || p.allImages.length === 0) {
      console.log(`[${i + 1}/${myne.length}] ${p.title} — ⚠ No images, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${myne.length}] ${p.title} — ${p.allImages.length} photos`);

    const folderName = await getFolderName(p);
    console.log(`   Creating folder: "${folderName}"`);

    const folderId = await createDriveFolder(drive, folderName);
    await uploadImages(drive, folderId, p.allImages);
    const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log(`   ✅ ${driveUrl}`);

    // Update in-place
    const globalIdx = allProps.findIndex(x => x.slug === p.slug);
    if (globalIdx >= 0) allProps[globalIdx].driveUrl = driveUrl;
    myne[i].driveUrl = driveUrl;
    updated++;

    // Save after each property
    fs.writeFileSync(PROPS_FILE, JSON.stringify(allProps, null, 2));

    if (updated >= MAX_COUNT) {
      console.log(`\n⏸  Reached --count=${MAX_COUNT} limit. Run again with --start=${i + 1} to continue.`);
      break;
    }
  }

  console.log(`\n✅ Done. Updated ${updated} properties.\n`);
  console.log('NEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log('  git commit -m "Add Drive folders to MYNE properties"');
  console.log('  git push origin main');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
