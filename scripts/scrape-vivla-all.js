#!/usr/bin/env node
/**
 * scrape-vivla-all.js
 * ─────────────────────────────────────────────────────────────
 * Bulk-scrapes ALL available Vivla properties from vivla.com/listings,
 * replacing the existing vivla entries in lib/properties.json.
 *
 * USAGE:
 *   node scripts/scrape-vivla-all.js
 *   node scripts/scrape-vivla-all.js --dry-run    (no Drive upload, no JSON write)
 *   node scripts/scrape-vivla-all.js --no-drive   (skip Drive upload, update JSON)
 *
 * WHAT IT DOES:
 *   1. Scrapes vivla.com/listings for all property slugs
 *   2. For each listing:
 *      a. Checks if SOLD OUT or UNDER CONSTRUCTION → skips
 *      b. Extracts title, destination, beds, baths, m², price, description,
 *         gallery images, coordinates, unique features
 *      c. Auto-detects type (villa / chalet) and feature (with-pool, etc.)
 *      d. Creates Drive folder + uploads all photos
 *   3. Removes all existing vivla entries from lib/properties.json
 *   4. Saves all freshly scraped properties
 *
 * REQUIRED FILES:
 *   mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json
 */

'use strict';

const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');

const PROPS_FILE   = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE   = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const DRIVE_PARENT = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl';

const DELAY_MS = 1500; // polite delay between requests

// ─── CLI flags ────────────────────────────────────────────────────────────────
const DRY_RUN   = process.argv.includes('--dry-run');
const NO_DRIVE  = process.argv.includes('--no-drive') || DRY_RUN;
// --start N: skip first N slugs (for resuming after timeout)
const startArg  = process.argv.find(a => a.startsWith('--start='));
const START_IDX = startArg ? parseInt(startArg.split('=')[1], 10) : 0;

// ─── HTTP fetch ──────────────────────────────────────────────────────────────
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Download binary ─────────────────────────────────────────────────────────
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

// ─── Availability check ──────────────────────────────────────────────────────
function checkAvailability(html) {
  const soldMatch = html.match(/class="home_sold-out-wrapper([^"]*)"/);
  if (soldMatch && !soldMatch[1].includes('w-condition-invisible')) return 'SOLD OUT';

  const lastShareMatch = html.match(/class="last-share-left-wrapper([^"]*)"/);
  if (lastShareMatch && !lastShareMatch[1].includes('w-condition-invisible')) {
    const idx = html.indexOf('last-share-left-wrapper');
    if (/under construction/i.test(html.slice(idx, idx + 500))) return 'UNDER CONSTRUCTION';
  }
  return null;
}

// ─── Gallery images ───────────────────────────────────────────────────────────
function extractGalleryImages(html) {
  const sliderIdx = html.indexOf('cl-slider-detail-images');
  if (sliderIdx < 0) return [];
  const chunk = html.slice(sliderIdx, sliderIdx + 80000);
  const urls  = new Set();
  const bgRe  = /background-image:url\(&quot;(https:\/\/cdn\.prod\.website-files\.com\/[^&]+)&quot;\)/g;
  let m;
  while ((m = bgRe.exec(chunk)) !== null) {
    if (!/thumb|icon|logo|arrow|close|menu|-p-\d+/i.test(m[1])) urls.add(m[1]);
  }
  return [...urls];
}

// ─── Description ─────────────────────────────────────────────────────────────
function extractDescription(html) {
  const marker = 'home-description-paragraph w-richtext">';
  const start  = html.indexOf(marker);
  if (start < 0) return '';
  const contentStart = start + marker.length;
  const contentEnd   = html.indexOf('</div>', contentStart);
  const raw = (contentEnd > 0 ? html.slice(contentStart, contentEnd) : html.slice(contentStart, contentStart + 3000));
  let text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ').trim();
  text = text
    .replace(/\bVivla\b/gi, '').replace(/\bvivla\.com\b/gi, '')
    .replace(/,?\s+with\s+Vivla[^.]*\./gi, '.').replace(/\bThrough Vivla[^.]*\./gi, '')
    .replace(/Vivla\s+takes\s+care[^.]*\./gi, '')
    .replace(/\bour (platform|co-ownership model|service)\b[^.]*\./gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  return text;
}

// ─── Amenities ────────────────────────────────────────────────────────────────
function extractAmenities(html) {
  let beds = null, baths = null, size = null;
  const pairs = [...html.matchAll(
    /<h5 class="home-amenities-number">([^<]+)<\/h5>\s*<h5 class="home-amenities-type">([^<]+)<\/h5>/g
  )];
  for (const [, num, type] of pairs) {
    const n = parseInt(num.trim(), 10);
    const t = type.trim().toLowerCase();
    if (t.includes('bedroom'))  beds  = n;
    if (t.includes('bathroom')) baths = n;
    if (t === 'm2' || t === 'm²') size = n;
  }
  return { beds, baths, size };
}

// ─── Price ────────────────────────────────────────────────────────────────────
function extractPrice(html) {
  const m = html.match(/class="[^"]*price-text pvp[^"]*">([^<]+)<\/h3>/);
  return m ? parseInt(m[1].trim().replace(/[,\s]/g, ''), 10) || null : null;
}

// ─── Destination ─────────────────────────────────────────────────────────────
function extractDestination(html) {
  const m = html.match(/class="[^"]*home-destination-name[^"]*">([^<]+)</);
  return m ? m[1].trim() : '';
}

// ─── Title ───────────────────────────────────────────────────────────────────
function extractTitle(html) {
  const m = html.match(/<h1[^>]*class="[^"]*text-block-title[^"]*"[^>]*>([^<]+)<\/h1>/);
  return m ? m[1].trim() : '';
}

// ─── Coordinates ─────────────────────────────────────────────────────────────
function extractCoords(html) {
  const m = html.match(/coordinates\s*=\s*"([-\d.]+),\s*([-\d.]+)"/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  const mapMatch = html.match(/maps\/embed\?pb=([^"]+)"/);
  if (mapMatch) {
    const pb = decodeURIComponent(mapMatch[1]);
    const latM = pb.match(/!3d(-?\d+\.\d+)/), lngM = pb.match(/!2d(-?\d+\.\d+)/);
    if (latM && lngM) return { lat: parseFloat(latM[1]), lng: parseFloat(lngM[1]) };
  }
  return { lat: null, lng: null };
}

// ─── Unique features ─────────────────────────────────────────────────────────
// Only extract from the CMS (w-dyn-list) section, not the static template section
function extractUniqueFeatures(html) {
  const wmIdx = html.toLowerCase().indexOf('what makes it unique');
  if (wmIdx < 0) return [];
  const chunk = html.slice(wmIdx, wmIdx + 5000);
  // Stop before the static "others-amenities-container" section (generic per-property icons)
  const staticBoundary = chunk.indexOf('others-amenities-container');
  const cmsChunk = staticBoundary > 0 ? chunk.slice(0, staticBoundary) : chunk.slice(0, 3000);
  const seen = new Set();
  return [...cmsChunk.matchAll(/<h5 class="other-amenities-text">([^<]+)<\/h5>/g)]
    .map(m => m[1].trim()).filter(f => {
      const key = f.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
}

// ─── Auto-detect property type ───────────────────────────────────────────────
// Baqueira/ski destinations = chalet; cities (Madrid, Barcelona) = apartment; else = villa
function detectType(destination, description) {
  const ski  = /baqueira|beret|sierra nevada|formigal|grandvalira|ordino/i;
  const city = /^(madrid|barcelona|seville|valencia|bilbao)$/i;
  if (ski.test(destination))               return 'chalet';
  if (city.test(destination.trim()))       return 'apartment';
  if (/penthouse/i.test(description || '')) return 'penthouse';
  return 'villa';
}

// ─── Auto-detect feature from unique features list ────────────────────────────
function detectFeature(uniqueFeatures) {
  const all = uniqueFeatures.join(' ').toLowerCase();
  if (/\bpool\b/.test(all))                       return 'with-pool';
  if (/sea.?view|ocean.?view|view.*sea/i.test(all)) return 'with-sea-views';
  if (/\bgarden\b/.test(all))                      return 'with-garden';
  if (/\bterrace\b/.test(all))                     return 'with-terrace';
  if (/\bfireplace\b/.test(all))                   return 'with-fireplace';
  return '';
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────
function toSlug(str) {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateBaseSlug(destination, beds, type, feature) {
  const parts = [destination, 'spain', beds ? `${beds}-bed` : null, type].filter(Boolean);
  if (feature) parts.push(feature);
  return parts.map(toSlug).join('-');
}

function makeUniqueSlug(base, taken) {
  if (!taken.has(base)) { taken.add(base); return base; }
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  const slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

// ─── Drive helpers ────────────────────────────────────────────────────────────
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

async function uploadImagesToDrive(drive, folderId, imageUrls, label) {
  const { Readable } = require('stream');
  for (let i = 0; i < imageUrls.length; i++) {
    const url      = imageUrls[i];
    const num      = String(i + 1).padStart(2, '0');
    const ext      = url.split('.').pop().split('?')[0].toLowerCase();
    const safeExt  = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext) ? ext : 'jpg';
    try {
      const { buffer, contentType } = await downloadBuffer(url);
      await drive.files.create({
        requestBody: { name: `photo-${num}.${safeExt}`, parents: [folderId] },
        media: { mimeType: contentType, body: Readable.from(buffer) },
        fields: 'id', supportsAllDrives: true,
      });
      process.stdout.write(`    ${label} ${i + 1}/${imageUrls.length}\r`);
    } catch (e) {
      console.warn(`\n    ⚠ photo-${num} failed: ${e.message}`);
    }
  }
  process.stdout.write('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏡 Vivla bulk scraper${DRY_RUN ? ' [DRY RUN]' : ''}${NO_DRIVE && !DRY_RUN ? ' [NO DRIVE]' : ''}\n`);

  // ── Step 1: Get all listing slugs ────────────────────────────────────────
  console.log('📋 Fetching vivla.com/listings...');
  const listingsHtml = await fetchHtml('https://www.vivla.com/listings');
  const slugs = [...new Set(
    [...listingsHtml.matchAll(/href="\/listings\/([a-z0-9-]+)"/g)]
      .map(m => m[1])
      .filter(s => s && !s.includes('#'))
  )];
  console.log(`   Found ${slugs.length} listings\n`);

  // ── Step 2: Set up Drive (if needed) ─────────────────────────────────────
  let drive = null;
  if (!NO_DRIVE) {
    if (!fs.existsSync(CREDS_FILE)) {
      console.warn('⚠ Drive credentials not found — running without Drive upload.\n');
    } else {
      const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
      const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
      drive = google.drive({ version: 'v3', auth });
      console.log('☁️  Google Drive connected\n');
    }
  }

  // ── Step 3: Scrape each property ─────────────────────────────────────────
  const freshProperties = [];
  const takenSlugs      = new Set();
  const skipped         = [];
  const errors          = [];

  // When resuming (--start=N), load already-scraped vivla properties from JSON
  if (START_IDX > 0) {
    const currentProps = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
    const existingVivla = currentProps.filter(p => p.partner === 'vivla');
    freshProperties.push(...existingVivla);
    existingVivla.forEach(p => takenSlugs.add(p.slug));
    console.log(`▶ Resuming from slug index ${START_IDX} (${existingVivla.length} already saved)\n`);
  }

  for (let i = 0; i < slugs.length; i++) {
    if (i < START_IDX) continue; // skip already-done

    const vivlaSlug = slugs[i];
    const url       = `https://www.vivla.com/listings/${vivlaSlug}`;
    console.log(`[${String(i + 1).padStart(2)}/${slugs.length}] ${vivlaSlug}`);

    try {
      await sleep(DELAY_MS);
      const html = await fetchHtml(url);

      // Availability
      const unavailStatus = checkAvailability(html);
      if (unavailStatus) {
        console.log(`   ⛔ ${unavailStatus} — skipping`);
        skipped.push({ vivlaSlug, reason: unavailStatus });
        continue;
      }

      // Extract data
      const vivlaTitle     = extractTitle(html);
      const destination    = extractDestination(html);
      const { beds, baths, size } = extractAmenities(html);
      const price          = extractPrice(html);
      const { lat, lng }   = extractCoords(html);
      const description    = extractDescription(html);
      const images         = extractGalleryImages(html);
      const uniqueFeatures = extractUniqueFeatures(html);

      if (images.length === 0) {
        console.warn(`   ⚠ No gallery images found — skipping`);
        skipped.push({ vivlaSlug, reason: 'no images' });
        continue;
      }
      if (!destination) {
        console.warn(`   ⚠ No destination found — skipping`);
        skipped.push({ vivlaSlug, reason: 'no destination' });
        continue;
      }

      const type    = detectType(destination, description);
      const feature = detectFeature(uniqueFeatures);
      const base    = generateBaseSlug(destination, beds, type, feature);
      const slug    = makeUniqueSlug(base, takenSlugs);
      const title   = `${vivlaTitle}, ${destination}`;

      console.log(`   ✅ ${title} | ${beds}bd/${baths}ba | ${size}m² | €${(price||0).toLocaleString()} | ${images.length} imgs | ${slug}`);

      // Drive upload
      let driveUrl = null;
      if (drive) {
        const folderName = `${vivlaTitle}, ${destination} - Vivla`;
        const folderId   = await createDriveFolder(drive, folderName);
        await uploadImagesToDrive(drive, folderId, images, '📤');
        driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
      }

      freshProperties.push({
        slug,
        partner:     'vivla',
        title,
        region:      destination,
        price:       price  || null,
        beds:        beds   || null,
        baths:       baths  || null,
        img:         images[0],
        images:      images.slice(0, 3),
        allImages:   images,
        description,
        amenities:   uniqueFeatures,
        lat:         lat  || null,
        lng:         lng  || null,
        size:        size || null,
        driveUrl:    driveUrl || null,
        notes:       url,
      });

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      errors.push({ vivlaSlug, error: err.message });
    }
  }

  // ── Step 4: Update properties.json ───────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 Results: ${freshProperties.length} scraped, ${skipped.length} skipped, ${errors.length} errors`);

  if (skipped.length) {
    console.log('\nSkipped:');
    skipped.forEach(s => console.log(`  - ${s.vivlaSlug}: ${s.reason}`));
  }
  if (errors.length) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.vivlaSlug}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] — properties.json NOT updated.');
    return;
  }

  if (freshProperties.length === 0) {
    console.error('\n❌ No properties scraped — aborting.');
    process.exit(1);
  }

  // Replace all vivla entries with freshly scraped data
  const allProps     = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const nonVivla     = allProps.filter(p => p.partner !== 'vivla');
  const combined     = [...nonVivla, ...freshProperties];

  console.log(`\n💾 Replacing ${allProps.length - nonVivla.length} old Vivla entries with ${freshProperties.length} fresh ones`);
  console.log(`   Total properties: ${allProps.length} → ${combined.length}`);

  fs.writeFileSync(PROPS_FILE, JSON.stringify(combined, null, 2));
  console.log('✅ lib/properties.json saved\n');

  console.log('NEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log('  git commit -m "Re-scrape all Vivla properties (fresh data, Drive folders)"');
  console.log('  git push origin main');
  console.log('  → Vercel redeploys in ~1-2 min\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
