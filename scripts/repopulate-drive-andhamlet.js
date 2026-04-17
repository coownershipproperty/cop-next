#!/usr/bin/env node
/**
 * repopulate-drive-andhamlet.js
 *
 * For each And Hamlet property:
 *  1. Looks up the current folder name in Drive
 *  2. Finds ALL duplicate folders with that name in the parent
 *  3. Deletes them all (cleans duplicates + old bad photos)
 *  4. Creates a fresh folder
 *  5. Downloads each image from allImages CDN URLs
 *  6. Uploads to the new folder
 *  7. Updates driveUrl in properties.json
 *
 * Usage: node scripts/repopulate-drive-andhamlet.js [slug]
 *   slug  optional — run for one property only (for testing)
 */

const fs      = require('fs');
const path    = require('path');
const https   = require('https');
const os      = require('os');
const { google } = require('googleapis');

const CREDS_PATH   = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const PROPS_PATH   = path.join(__dirname, '../lib/properties.json');
const PARENT_ID    = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl'; // COP Property Photos CLAUDE
const RATE_DELAY   = 300; // ms between uploads

const creds = require(CREDS_PATH);
const auth  = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function getFolderName(folderId) {
  const r = await drive.files.get({
    fileId: folderId,
    fields: 'name',
    supportsAllDrives: true,
  });
  return r.data.name;
}

async function findAllFoldersByName(name) {
  const escaped = name.replace(/'/g, "\\'");
  const r = await drive.files.list({
    q: `'${PARENT_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${escaped}' and trashed=false`,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 50,
  });
  return r.data.files;
}

async function deleteFolder(folderId) {
  // Move to trash (works with editor access; hard delete requires ownership)
  await drive.files.update({
    fileId: folderId,
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });
}

async function createFolder(name) {
  const r = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PARENT_ID],
    },
    fields: 'id',
    supportsAllDrives: true,
  });
  return r.data.id;
}

async function uploadImage(localPath, filename, folderId) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: fs.createReadStream(localPath) },
    fields: 'id',
    supportsAllDrives: true,
  });
}

async function processProperty(prop) {
  const slug = prop.slug;
  const allImages = prop.allImages || [];
  if (allImages.length === 0) {
    console.log(`[${slug}]  ⚠  no allImages — skipping`);
    return null;
  }

  // 1. Get current folder name
  let folderName;
  try {
    folderName = await getFolderName(prop.driveUrl.split('/').pop());
  } catch (e) {
    console.error(`[${slug}]  ✗ Could not get folder name: ${e.message}`);
    return null;
  }
  console.log(`\n[${slug}]`);
  console.log(`  folder name: "${folderName}"`);

  // 2. Find all duplicate folders with that name
  const dupes = await findAllFoldersByName(folderName);
  console.log(`  found ${dupes.length} existing folder(s) — deleting all`);
  for (const f of dupes) {
    await deleteFolder(f.id);
    console.log(`    deleted: ${f.id}`);
  }

  // 3. Create fresh folder
  const newFolderId = await createFolder(folderName);
  console.log(`  created: ${newFolderId}`);

  // 4. Make folder publicly accessible (anyone with link can view)
  await drive.permissions.create({
    fileId: newFolderId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  // 5. Download + upload each image
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cop-drive-'));
  let uploaded = 0;

  for (let i = 0; i < allImages.length; i++) {
    const url      = allImages[i];
    const rawName  = decodeURIComponent(url.split('/').pop());
    const ext      = /\.(jpe?g|png|webp)$/i.test(rawName) ? '' : '.jpg';
    const filename = `photo-${String(i + 1).padStart(2, '0')}-${rawName}${ext}`;
    const tmpFile  = path.join(tmpDir, `img-${i}`);

    try {
      await downloadFile(url, tmpFile);
      await uploadImage(tmpFile, filename, newFolderId);
      fs.unlinkSync(tmpFile);
      uploaded++;
      process.stdout.write(`\r  uploaded ${uploaded}/${allImages.length}`);
      await sleep(RATE_DELAY);
    } catch (e) {
      console.error(`\n  ✗ ${url.split('/').pop().substring(0,40)}: ${e.message}`);
    }
  }

  fs.rmdirSync(tmpDir, { recursive: true });
  console.log(`\n  ✓ ${uploaded}/${allImages.length} photos uploaded`);

  return {
    slug,
    newDriveUrl: `https://drive.google.com/drive/folders/${newFolderId}`,
  };
}

async function main() {
  const targetSlug = process.argv[2] || null;
  const props      = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));
  const ahProps    = props.filter(p => p.partner === 'andhamlet' && (!targetSlug || p.slug === targetSlug));

  if (ahProps.length === 0) {
    console.error('No matching properties found.');
    process.exit(1);
  }

  console.log(`Processing ${ahProps.length} And Hamlet propert${ahProps.length === 1 ? 'y' : 'ies'}…`);

  let changed = 0;
  for (const prop of ahProps) {
    const result = await processProperty(prop);
    if (result) {
      // Save driveUrl to properties.json immediately after each property
      const p = props.find(x => x.slug === result.slug);
      if (p) {
        p.driveUrl = result.newDriveUrl;
        fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2));
        changed++;
        console.log(`  saved → ${result.newDriveUrl}`);
      }
    }
  }

  console.log(`\n✅ Done — updated driveUrl for ${changed} properties`);
}

main().catch(e => { console.error(e); process.exit(1); });
