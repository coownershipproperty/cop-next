#!/usr/bin/env node
/**
 * repopulate-drive-pacaso.js
 * ──────────────────────────────────────────────────────────────────────────────
 * For each Pacaso property, reads the photos already in its Google Drive folder
 * and updates properties.json images/img fields to use Drive lh3 URLs instead
 * of staging.co-ownership-property.com URLs.
 *
 * USAGE:
 *   node scripts/repopulate-drive-pacaso.js                   # all pacaso props
 *   node scripts/repopulate-drive-pacaso.js --start=N         # resume from index N
 *   node scripts/repopulate-drive-pacaso.js --start=N --count=20  # safe batch
 *   node scripts/repopulate-drive-pacaso.js --dry-run         # print only, no write
 *
 * HOW IT WORKS:
 *   1. Reads the driveUrl for each Pacaso property (folder already exists + has photos)
 *   2. Lists image files in the folder (sorted by name)
 *   3. Converts each file ID → https://lh3.googleusercontent.com/d/FILE_ID
 *   4. Updates p.images and p.img in properties.json
 *   5. Saves after each property so it's resumable
 *
 * REQUIRED FILES:
 *   mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json   (Google service account creds)
 */

'use strict';

const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');

const PROPS_FILE = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';

// ─── CLI flags ────────────────────────────────────────────────────────────────
const DRY_RUN   = process.argv.includes('--dry-run');
const startArg  = process.argv.find(a => a.startsWith('--start='));
const countArg  = process.argv.find(a => a.startsWith('--count='));
const START_IDX = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
const MAX_COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : Infinity;

// ─── Drive helpers ────────────────────────────────────────────────────────────

/** Extract folder ID from a drive.google.com/drive/folders/FOLDER_ID URL */
function folderIdFromUrl(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Convert a Drive file ID to a direct lh3 image URL (same format sync-sheet uses) */
function driveFileToImageUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/** List image files in a Drive folder, sorted by name */
async function listFolderImages(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`,
    fields: 'files(id, name, mimeType)',
    orderBy: 'name',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files || [];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('☁️  Pacaso Drive → lh3 image updater\n');

  if (!fs.existsSync(CREDS_FILE)) {
    console.error('❌ Drive credentials not found at:', CREDS_FILE);
    process.exit(1);
  }

  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  const auth  = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });
  console.log('✅ Google Drive connected\n');

  const allProps = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const pacaso   = allProps.filter(p => p.partner === 'pacaso');
  console.log(`Found ${pacaso.length} Pacaso properties\n`);

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (let i = START_IDX; i < pacaso.length; i++) {
    if (updated >= MAX_COUNT) {
      console.log(`\n⏸  Reached --count=${MAX_COUNT}. Run with --start=${i} to continue.`);
      break;
    }

    const p = pacaso[i];
    process.stdout.write(`[${i + 1}/${pacaso.length}] ${p.title} ... `);

    if (!p.driveUrl) {
      console.log('⚠ no driveUrl, skipping');
      skipped++;
      continue;
    }

    const folderId = folderIdFromUrl(p.driveUrl);
    if (!folderId) {
      console.log('⚠ bad driveUrl format, skipping');
      skipped++;
      continue;
    }

    try {
      const files = await listFolderImages(drive, folderId);

      if (files.length === 0) {
        console.log('⚠ Drive folder has no images — skipping (staging URL kept)');
        skipped++;
        continue;
      }

      const imageUrls = files.map(f => driveFileToImageUrl(f.id));

      if (!DRY_RUN) {
        const globalIdx = allProps.findIndex(x => x.slug === p.slug);
        if (globalIdx >= 0) {
          allProps[globalIdx].images = imageUrls;
          allProps[globalIdx].img    = imageUrls[0];
        }
        // Save after each property so we can resume if killed
        fs.writeFileSync(PROPS_FILE, JSON.stringify(allProps, null, 2));
      }

      console.log(`✅ ${files.length} photos  →  ${imageUrls[0].slice(0, 60)}...`);
      updated++;

    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Updated : ${updated}`);
  console.log(`⚠  Skipped : ${skipped}`);
  console.log(`❌ Errors  : ${errors}`);
  if (DRY_RUN) console.log('\n(dry-run — no file written)');
  else {
    console.log('\nNEXT STEPS:');
    console.log('  git add lib/properties.json');
    console.log('  git commit -m "Pacaso images: staging URLs → Google Drive lh3 URLs"');
    console.log('  git push origin main');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
