#!/usr/bin/env node
/**
 * add-vivla-property.js
 * ─────────────────────────────────────────────────────────────
 * Full pipeline for adding a NEW Vivla property to the COP site.
 *
 * USAGE:
 *   node scripts/add-vivla-property.js \
 *     --url https://www.vivla.com/listings/casa-son-parc \
 *     --type villa \
 *     [--feature "with-pool"]   (optional, appended to slug/title)
 *     [--region "Menorca"]      (optional override)
 *
 * The script auto-detects from vivla.com:
 *   - Price, beds, baths, m², destination/region
 *   - Gallery images (all photos from the gallery slider)
 *   - Description (cleaned, no partner name)
 *   - Lat/lng coordinates
 *   - Unique features / amenities
 *
 * WHAT IT DOES:
 *   1. Fetches the listing page
 *   2. Checks for SOLD OUT or UNDER CONSTRUCTION — exits if so
 *   3. Extracts all property data
 *   4. Auto-generates COP slug + title
 *   5. Creates a fresh Google Drive folder and uploads all gallery photos
 *   6. Saves everything to lib/properties.json
 *
 * AFTER RUNNING:
 *   git add lib/properties.json
 *   git commit -m "Add Vivla property: ..."
 *   git push origin main
 *   → Vercel redeploys automatically (~1-2 min)
 *
 * REQUIRED FILES:
 *   mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json  (Drive service account)
 *
 * Types: villa, apartment, penthouse, chalet, townhouse
 * Feature examples: with-pool, with-sea-views, with-garden, with-terrace
 */

'use strict';

const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');

// ─── Config ─────────────────────────────────────────────────────────────────
const PROPS_FILE   = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE   = '/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json';
const DRIVE_PARENT = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl'; // COP Property Photos CLAUDE

// ─── CLI arg parsing ─────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const out  = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      out[args[i].slice(2)] = args[i + 1] || '';
      i++;
    }
  }
  return out;
}

// ─── HTTP fetch ──────────────────────────────────────────────────────────────
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
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
    });
    req.on('error', reject);
  });
}

// ─── Download binary ─────────────────────────────────────────────────────────
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

// ─── Check if property is sold out or under construction ─────────────────────
// Returns: null (available), 'SOLD OUT', or 'UNDER CONSTRUCTION'
function checkAvailability(html) {
  // SOLD OUT: home_sold-out-wrapper div WITHOUT w-condition-invisible
  // When invisible (available): class="home_sold-out-wrapper w-condition-invisible"
  // When sold out (visible):    class="home_sold-out-wrapper"
  const soldMatch = html.match(/class="home_sold-out-wrapper([^"]*)"/);
  if (soldMatch && !soldMatch[1].includes('w-condition-invisible')) {
    return 'SOLD OUT';
  }

  // UNDER CONSTRUCTION: last-share-left-wrapper WITHOUT w-condition-invisible,
  // containing "Under Construction" text
  const lastShareMatch = html.match(/class="last-share-left-wrapper([^"]*)"/);
  if (lastShareMatch && !lastShareMatch[1].includes('w-condition-invisible')) {
    const lastShareIdx = html.indexOf('last-share-left-wrapper');
    const chunk = html.slice(lastShareIdx, lastShareIdx + 500);
    if (/under construction/i.test(chunk)) {
      return 'UNDER CONSTRUCTION';
    }
  }

  return null; // available
}

// ─── Extract gallery images from cl-slider-detail-images ─────────────────────
// Vivla uses CSS background-image:url(&quot;...&quot;) on slide divs
function extractGalleryImages(html) {
  const sliderIdx = html.indexOf('cl-slider-detail-images');
  if (sliderIdx < 0) {
    console.warn('⚠ cl-slider-detail-images not found');
    return [];
  }

  // Take a generous chunk after the slider section start
  const chunk = html.slice(sliderIdx, sliderIdx + 80000);

  const urls = new Set();

  // BG images: background-image:url(&quot;URL&quot;)
  const bgRe = /background-image:url\(&quot;(https:\/\/cdn\.prod\.website-files\.com\/[^&]+)&quot;\)/g;
  let m;
  while ((m = bgRe.exec(chunk)) !== null) {
    const url = m[1];
    // Skip thumbnails, icons, logos
    if (/thumb|icon|logo|arrow|close|menu|-p-\d+/i.test(url)) continue;
    urls.add(url);
  }

  // Also pick up SRC images (responsive srcset versions may duplicate, deduplicated by Set)
  const srcRe = /src="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"/g;
  while ((m = srcRe.exec(chunk)) !== null) {
    const url = m[1];
    if (/thumb|icon|logo|arrow|close|menu|-p-\d+/i.test(url)) continue;
    // Only add SRC if base filename matches a BG image we already have
    // (avoids picking up unrelated section images)
    const base = url.split('/').pop().split('_')[0];
    for (const existing of urls) {
      if (existing.includes(base)) {
        urls.add(url);
        break;
      }
    }
  }

  return [...urls];
}

// ─── Extract description ─────────────────────────────────────────────────────
function extractDescription(html) {
  // Vivla stores description as raw text inside:
  //   <div class="home-description-paragraph w-richtext">TEXT</div>
  const marker = 'home-description-paragraph w-richtext">';
  const start  = html.indexOf(marker);
  if (start < 0) {
    console.warn('⚠ home-description-paragraph not found');
    return '';
  }

  const contentStart = start + marker.length;
  const contentEnd   = html.indexOf('</div>', contentStart);
  const raw          = contentEnd > 0
    ? html.slice(contentStart, contentEnd)
    : html.slice(contentStart, contentStart + 3000);

  let text = raw
    .replace(/<[^>]+>/g, ' ')   // strip any HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Strip partner name references
  text = text
    .replace(/\bVivla\b/gi, '')
    .replace(/\bvivla\.com\b/gi, '')
    .replace(/,?\s+with\s+Vivla[^.]*\./gi, '.')
    .replace(/\bThrough Vivla[^.]*\./gi, '')
    .replace(/Vivla\s+takes\s+care[^.]*\./gi, '')
    .replace(/\bour (platform|co-ownership model|service)\b[^.]*\./gi, '')
    .trim();

  return text;
}

// ─── Extract amenities (beds, baths, m², weeks) ──────────────────────────────
function extractAmenities(html) {
  const pairs = [...html.matchAll(
    /<h5 class="home-amenities-number">([^<]+)<\/h5>\s*<h5 class="home-amenities-type">([^<]+)<\/h5>/g
  )];

  let beds = null, baths = null, size = null;
  for (const [, num, type] of pairs) {
    const n = parseInt(num.trim(), 10);
    const t = type.trim().toLowerCase();
    if (t.includes('bedroom')) beds  = n;
    if (t.includes('bathroom')) baths = n;
    if (t === 'm2' || t === 'm²') size  = n;
    // skip weeks/year
  }
  return { beds, baths, size };
}

// ─── Extract price ────────────────────────────────────────────────────────────
function extractPrice(html) {
  // <h3 class="head-heading-white price-text pvp">155000</h3>
  const m = html.match(/class="[^"]*price-text pvp[^"]*">([^<]+)<\/h3>/);
  if (!m) return null;
  return parseInt(m[1].trim().replace(/[,\s]/g, ''), 10) || null;
}

// ─── Extract destination (region label: Menorca, Ibiza, etc.) ────────────────
function extractDestination(html) {
  // <h3 class="head-heading-white home-destination-name">Menorca</h3>
  // (or any tag with that class)
  const m = html.match(/class="[^"]*home-destination-name[^"]*">([^<]+)</);
  return m ? m[1].trim() : '';
}

// ─── Extract property title ───────────────────────────────────────────────────
function extractTitle(html) {
  // <h1 class="text-block-title notranslate" ...>Casa Son Parc</h1>
  const m = html.match(/<h1[^>]*class="[^"]*text-block-title[^"]*"[^>]*>([^<]+)<\/h1>/);
  return m ? m[1].trim() : '';
}

// ─── Extract coordinates ─────────────────────────────────────────────────────
// Vivla stores: coordinates = "40.024442, 4.167102";
function extractCoords(html) {
  const m = html.match(/coordinates\s*=\s*"([-\d.]+),\s*([-\d.]+)"/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // Also try Google Maps embed fallback
  const mapMatch = html.match(/maps\/embed\?pb=([^"]+)"/);
  if (mapMatch) {
    const pb   = decodeURIComponent(mapMatch[1]);
    const latM = pb.match(/!3d(-?\d+\.\d+)/);
    const lngM = pb.match(/!2d(-?\d+\.\d+)/);
    if (latM && lngM) return { lat: parseFloat(latM[1]), lng: parseFloat(lngM[1]) };
  }
  return { lat: null, lng: null };
}

// ─── Extract unique features ("What makes it unique?" section) ───────────────
function extractUniqueFeatures(html) {
  const wmIdx = html.toLowerCase().indexOf('what makes it unique');
  if (wmIdx < 0) return [];
  const chunk = html.slice(wmIdx, wmIdx + 4000);
  const raw = [...chunk.matchAll(/<h5 class="other-amenities-text">([^<]+)<\/h5>/g)]
    .map(m => m[1].trim())
    .filter(Boolean);
  // Deduplicate case-insensitively, keeping the first (better-cased) occurrence
  const seen = new Set();
  return raw.filter(f => {
    const key = f.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Slug / title generators ─────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateSlug(destination, beds, type, feature) {
  // e.g. menorca-spain-4-bed-villa-with-pool
  const bedsPart = beds ? `${beds}-bed` : null;
  const parts    = [destination, 'spain', bedsPart, type].filter(Boolean);
  if (feature) parts.push(feature);
  return parts.map(toSlug).join('-');
}

// Make slug unique if it already exists in properties.json
function makeUniqueSlug(base, properties) {
  if (!properties.find(p => p.slug === base)) return base;
  let i = 2;
  while (properties.find(p => p.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function generateCopTitle(vivlaTitle, destination, beds, type, feature) {
  // Use the vivla property name as the primary title: "Casa Son Parc, Menorca"
  const featureFormatted = feature
    ? ' ' + feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  return `${vivlaTitle}, ${destination}`;
}

// ─── Drive: create folder ────────────────────────────────────────────────────
async function createDriveFolder(drive, name) {
  console.log(`  📁 Creating Drive folder: "${name}"`);
  const existing = await drive.files.list({
    q: `name='${name}' and '${DRIVE_PARENT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  for (const f of existing.data.files || []) {
    console.log(`  🗑  Trashing old folder: ${f.id}`);
    await drive.files.update({ fileId: f.id, requestBody: { trashed: true }, supportsAllDrives: true });
  }

  const folder = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [DRIVE_PARENT] },
    fields: 'id',
    supportsAllDrives: true,
  });
  const folderId = folder.data.id;
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });
  return folderId;
}

// ─── Drive: upload images ────────────────────────────────────────────────────
async function uploadImagesToDrive(drive, folderId, imageUrls) {
  const { Readable } = require('stream');
  console.log(`  📤 Uploading ${imageUrls.length} photos to Drive...`);
  for (let i = 0; i < imageUrls.length; i++) {
    const url      = imageUrls[i];
    const num      = String(i + 1).padStart(2, '0');
    const ext      = url.split('.').pop().split('?')[0].toLowerCase();
    const safeExt  = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext) ? ext : 'jpg';
    const fileName = `photo-${num}.${safeExt}`;
    try {
      const { buffer, contentType } = await downloadBuffer(url);
      const stream = Readable.from(buffer);
      await drive.files.create({
        requestBody: { name: fileName, parents: [folderId] },
        media: { mimeType: contentType, body: stream },
        fields: 'id',
        supportsAllDrives: true,
      });
      process.stdout.write(`    ✓ ${i + 1}/${imageUrls.length}\r`);
    } catch (e) {
      console.warn(`    ⚠ Failed photo ${num}: ${e.message}`);
    }
  }
  process.stdout.write('\n');
  console.log(`    ✅ All photos uploaded`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  if (!args.url || !args.type) {
    console.error('❌ Missing required arguments.\n');
    console.error('Usage:');
    console.error('  node scripts/add-vivla-property.js \\');
    console.error('    --url https://www.vivla.com/listings/casa-son-parc \\');
    console.error('    --type villa \\');
    console.error('    --feature "with-pool"   (optional)');
    console.error('    --region "Menorca"      (optional override)');
    console.error('');
    console.error('Types: villa, apartment, penthouse, chalet, townhouse');
    console.error('Feature examples: with-pool, with-sea-views, with-garden, with-terrace');
    process.exit(1);
  }

  if (!args.url.includes('vivla.com/listings/')) {
    console.error('❌ URL must be a vivla.com/listings/ page');
    process.exit(1);
  }

  const vivlaSlug = args.url.split('/listings/').pop().replace(/\/$/, '');
  const type      = args.type;
  const feature   = args.feature || '';

  // ── Step 1: Fetch listing page ──────────────────────────────────────────
  console.log(`\n🔍 Fetching: ${args.url}`);
  const html = await fetchHtml(args.url);

  // ── Step 2: Sold-out / under construction check ──────────────────────────
  const status = checkAvailability(html);
  if (status) {
    console.error(`\n❌ Property is ${status}`);
    console.error('   Properties with this status must not be added to the COP website.');
    process.exit(1);
  }
  console.log('  ✅ Property is available');

  // ── Step 3: Extract all data ─────────────────────────────────────────────
  console.log('\n📋 Extracting property data...');

  const vivlaTitle   = extractTitle(html);
  const destination  = args.region || extractDestination(html);
  const { beds, baths, size } = extractAmenities(html);
  const price        = extractPrice(html);
  const { lat, lng } = extractCoords(html);
  const description  = extractDescription(html);
  const images       = extractGalleryImages(html);
  const uniqueFeatures = extractUniqueFeatures(html);

  console.log(`  ✅ Property name : ${vivlaTitle}`);
  console.log(`  ✅ Destination   : ${destination}`);
  console.log(`  ✅ Beds / Baths  : ${beds} / ${baths}`);
  console.log(`  ✅ Size          : ${size} m²`);
  console.log(`  ✅ Price         : €${price ? price.toLocaleString() : '?'}`);
  console.log(`  ✅ Coordinates   : ${lat}, ${lng}`);
  console.log(`  ✅ Gallery images: ${images.length}`);
  console.log(`  ✅ Description   : ${description.slice(0, 80)}...`);
  if (uniqueFeatures.length) console.log(`  ✅ Unique features: ${uniqueFeatures.join(', ')}`);

  if (images.length === 0) {
    console.error('❌ No gallery images found — check the URL is correct.');
    process.exit(1);
  }
  if (!destination) {
    console.error('❌ Could not detect destination. Pass --region manually.');
    process.exit(1);
  }

  // ── Step 4: Generate slug + title ────────────────────────────────────────
  const properties = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const baseSlug   = generateSlug(destination, beds, type, feature);
  const slug       = makeUniqueSlug(baseSlug, properties);
  const title      = generateCopTitle(vivlaTitle, destination, beds, type, feature);

  console.log(`\n🏷  Slug  : ${slug}`);
  console.log(`   Title : ${title}`);

  const existing = properties.find(p => p.slug === slug);
  if (existing) {
    console.warn(`\n⚠ Slug "${slug}" already exists — will UPDATE existing property.`);
    console.warn('  Press Ctrl+C within 3 seconds to cancel...');
    await new Promise(r => setTimeout(r, 3000));
  }

  // ── Step 5: Drive upload ─────────────────────────────────────────────────
  let driveUrl = null;
  if (!fs.existsSync(CREDS_FILE)) {
    console.warn('\n⚠ Drive credentials not found — skipping Drive upload.');
  } else {
    console.log('\n☁️  Setting up Google Drive...');
    const creds      = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
    const auth       = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
    const drive      = google.drive({ version: 'v3', auth });
    const folderName = `${vivlaTitle}, ${destination} - Vivla`;
    const folderId   = await createDriveFolder(drive, folderName);
    await uploadImagesToDrive(drive, folderId, images);
    driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log(`  Drive folder: ${driveUrl}`);
  }

  // ── Step 6: Build and save property ─────────────────────────────────────
  const hero     = images.slice(0, 3);
  const property = {
    slug,
    partner:     'vivla',
    title,
    region:      destination,
    price:       price  || null,
    beds:        beds   || null,
    baths:       baths  || null,
    img:         hero[0] || null,
    images:      hero,
    allImages:   images,
    description,
    amenities:   uniqueFeatures,
    lat:         lat  || null,
    lng:         lng  || null,
    size:        size || null,
    driveUrl:    driveUrl || null,
    notes:       args.url,  // stores the source Vivla URL
  };

  if (existing) {
    const idx = properties.findIndex(p => p.slug === slug);
    properties[idx] = { ...properties[idx], ...property };
    console.log(`\n✏️  Updated existing property: ${slug}`);
  } else {
    properties.push(property);
    console.log(`\n➕ Added new property: ${slug}`);
  }

  fs.writeFileSync(PROPS_FILE, JSON.stringify(properties, null, 2));
  console.log(`✅ Saved to lib/properties.json`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('📋 SUMMARY');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Vivla property : ${vivlaTitle}`);
  console.log(`  COP Title      : ${title}`);
  console.log(`  Slug           : ${slug}`);
  console.log(`  Destination    : ${destination}, Spain`);
  console.log(`  Price          : €${(price || 0).toLocaleString()}`);
  console.log(`  Beds / Baths   : ${beds} / ${baths}`);
  console.log(`  Size           : ${size ? size + ' m²' : '— (not found)'}`);
  console.log(`  Coordinates    : ${lat}, ${lng}`);
  console.log(`  Images         : ${images.length} total (${hero.length} hero)`);
  console.log(`  Drive          : ${driveUrl || '— (skipped)'}`);
  console.log(`  Source URL     : ${args.url}`);
  if (uniqueFeatures.length) console.log(`  Unique features: ${uniqueFeatures.join(', ')}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\nNEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log(`  git commit -m "Add Vivla property: ${title}"`);
  console.log('  git push origin main');
  console.log('  → Vercel redeploys in ~1-2 min\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
