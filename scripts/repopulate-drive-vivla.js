#!/usr/bin/env node
/**
 * repopulate-drive-vivla.js
 * ─────────────────────────────────────────────────────────────
 * Creates Drive folders and uploads all photos for Vivla properties
 * that have allImages but no driveUrl (or --force to redo all).
 *
 * USAGE:
 *   node scripts/repopulate-drive-vivla.js
 *   node scripts/repopulate-drive-vivla.js --force   (re-upload even if driveUrl exists)
 *   node scripts/repopulate-drive-vivla.js --start=5 (skip first 5 vivla properties)
 */

'use strict';

const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');

const PROPS_FILE   = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE   = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const DRIVE_PARENT = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl';

const FORCE     = process.argv.includes('--force');
const startArg  = process.argv.find(a => a.startsWith('--start='));
const countArg  = process.argv.find(a => a.startsWith('--count='));
const START_IDX = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
const MAX_COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : Infinity;

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    }).on('error', reject).setTimeout(30000, function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function createDriveFolder(drive, name) {
  const existing = await drive.files.list({
    q: `name='${name}' and '${DRIVE_PARENT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  for (const f of (existing.data.files || [])) {
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

async function main() {
  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
  const drive = google.drive({ version: 'v3', auth });
  console.log('☁️  Google Drive connected\n');

  const allProps  = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const vivla     = allProps.filter(p => p.partner === 'vivla');

  console.log(`Found ${vivla.length} Vivla properties\n`);

  let updated = 0;

  for (let i = 0; i < vivla.length; i++) {
    if (i < START_IDX) continue;

    const p = vivla[i];
    if (p.driveUrl && !FORCE) {
      console.log(`[${i+1}/${vivla.length}] ${p.title} — already has Drive folder, skipping`);
      continue;
    }

    const images = p.allImages || p.images || [];
    if (images.length === 0) {
      console.log(`[${i+1}/${vivla.length}] ${p.title} — no images, skipping`);
      continue;
    }

    // Folder name: use the Vivla slug from notes URL, or fall back to title
    // e.g. notes = "https://www.vivla.com/listings/casa-son-parc" → "Casa Son Parc"
    let vivlaName = p.title; // fallback
    if (p.notes && p.notes.includes('/listings/')) {
      vivlaName = p.notes.split('/listings/').pop()
        .replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    const folderName = `${vivlaName} - Vivla`;

    console.log(`[${i+1}/${vivla.length}] ${p.title} — ${images.length} photos`);
    console.log(`   Creating folder: "${folderName}"`);

    const folderId = await createDriveFolder(drive, folderName);

    for (let j = 0; j < images.length; j++) {
      const url     = images[j];
      const num     = String(j + 1).padStart(2, '0');
      const ext     = url.split('.').pop().split('?')[0].toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext) ? ext : 'jpg';
      try {
        const { buffer, contentType } = await downloadBuffer(url);
        await drive.files.create({
          requestBody: { name: `photo-${num}.${safeExt}`, parents: [folderId] },
          media: { mimeType: contentType, body: Readable.from(buffer) },
          fields: 'id', supportsAllDrives: true,
        });
        process.stdout.write(`   📤 ${j+1}/${images.length}\r`);
      } catch (e) {
        console.warn(`\n   ⚠ photo-${num} failed: ${e.message}`);
      }
    }
    process.stdout.write('\n');

    const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log(`   ✅ ${driveUrl}\n`);

    // Update the property in place
    const idx = allProps.findIndex(prop => prop.slug === p.slug);
    if (idx >= 0) {
      allProps[idx].driveUrl = driveUrl;
      // Also update images/img to use allImages URLs
      allProps[idx].images = images.slice(0, 3);
      allProps[idx].img    = images[0];
    }
    vivla[i].driveUrl = driveUrl;
    updated++;

    // Save after each property (so we don't lose progress if killed)
    fs.writeFileSync(PROPS_FILE, JSON.stringify(allProps, null, 2));

    if (updated >= MAX_COUNT) {
      console.log(`\n⏸  Reached --count=${MAX_COUNT} limit. Run again with --start=${i + 1} to continue.`);
      break;
    }
  }

  console.log(`\n✅ Done. Updated ${updated} properties.`);
  console.log('\nNEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log('  git commit -m "Add Drive folders to Vivla properties"');
  console.log('  git push origin main\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
