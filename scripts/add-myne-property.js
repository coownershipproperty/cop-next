#!/usr/bin/env node
/**
 * add-myne-property.js
 * ─────────────────────────────────────────────────────────────
 * Full pipeline for adding a NEW MYNE property to the COP site.
 *
 * USAGE:
 *   node scripts/add-myne-property.js \
 *     --url https://www.myne-homes.com/listings/SLUG
 *
 * The script auto-detects everything from the MYNE page:
 *   - City, region, country, price, beds, baths (no size — MYNE doesn't show it)
 *   - Gallery images (all photos from the Next.js image slider)
 *   - Description (cleaned, no partner name)
 *   - Lat/lng coordinates
 *   - Property type (villa/apartment/townhouse/finca/chalet/penthouse)
 *   - Best feature (pool > sea-views > lake-views > mountain-views > garden > terrace)
 *
 * WHAT IT DOES:
 *   1. Fetches the listing page
 *   2. Checks for SOLD OUT status — exits if so
 *   3. Extracts all property data
 *   4. Auto-generates COP slug + title
 *   5. Creates a fresh Google Drive folder and uploads all gallery photos
 *   6. Saves everything to lib/properties.json
 *
 * AFTER RUNNING:
 *   git add lib/properties.json
 *   git commit -m "Add MYNE property: ..."
 *   git push origin main
 *   → Vercel redeploys automatically (~1-2 min)
 *
 * REQUIRED FILES:
 *   mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json  (Drive service account)
 *
 * Status handling:
 *   - SOLD OUT (propertyStatus: 'sold-out' / 'sold') → rejected
 *   - UNDER CONSTRUCTION (propertyStatus: 'in-development') → included normally
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
const DRIVE_PARENT = '1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl';

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

// ─── Extract JSON data from MYNE's Next.js App Router page ───────────────────
// Returns the unescaped chunk string that contains all property fields
function extractDataChunk(html) {
  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    chunks.push(m[1]);
  }
  // The property data chunk contains bedroomsCount
  return chunks.find(c => c.includes('bedroomsCount')) || '';
}

// ─── Extract a string field from the escaped JSON chunk ──────────────────────
function extractField(chunk, field) {
  const re = new RegExp(`\\\\\\"${field}\\\\\\":\\\\\\"([^\\\\\\"]*)\\\\\\"`, 'i');
  const m  = chunk.match(re);
  return m ? m[1] : '';
}

// ─── Check availability ───────────────────────────────────────────────────────
// Returns: null (ok to add), or a reason string (skip)
function checkAvailability(chunk) {
  // Discreet marketing properties are not publicly listed
  const isDiscreet = extractField(chunk, 'isDiscreet');
  if (isDiscreet === 'true') return 'DISCREET MARKETING (not publicly listed)';

  // Sold-out properties should not be added
  const status = extractField(chunk, 'propertyStatus');
  if (status && status.toLowerCase().includes('sold')) return 'SOLD OUT';

  return null;
}

// ─── Extract gallery images ───────────────────────────────────────────────────
// MYNE renders gallery via /_next/image?url=ENCODED_STORYBLOK_URL
// The gallery images appear in the HTML before the fa-bed-front icon
function extractGalleryImages(html) {
  const bedIdx = html.indexOf('fa-bed-front');
  if (bedIdx < 0) {
    console.warn('⚠ fa-bed-front marker not found — scanning full page');
  }
  const chunk = bedIdx > 0 ? html.slice(Math.max(0, bedIdx - 12000), bedIdx) : html;

  const seen = new Set();
  const imgs = [];

  // /_next/image?url=https%3A%2F%2Fa.storyblok.com%2F...&w=...&q=...
  const re = /\/_next\/image\?url=(https%3A%2F%2Fa\.storyblok\.com%2Ff%2F148662%2F[^&"]+)(?:&|")/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const decoded = decodeURIComponent(m[1]);
    if (!seen.has(decoded)) {
      seen.add(decoded);
      imgs.push(decoded);
    }
  }

  return imgs;
}

// ─── Extract description ─────────────────────────────────────────────────────
// Finds the full multi-paragraph description that belongs to THIS property.
// Strategy: locate `bedroomsCount` (marks current property block), then walk
// backwards to find the nearest description field before it.
function extractDescription(chunk) {
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');

  // Find all description field positions
  const descRe = /\\"description\\":\\"/g;
  let m;
  let lastDescIdx = -1;
  while ((m = descRe.exec(chunk)) !== null) {
    if (m.index < bcIdx) lastDescIdx = m.index + m[0].length;
  }

  if (lastDescIdx < 0) return '';

  // Extract value — stop at first unescaped closing quote
  const raw = chunk.slice(lastDescIdx, lastDescIdx + 5000);
  // Find end: first \" that is NOT preceded by \\
  const endMatch = raw.match(/(?<!\\)\\"/);
  const value = endMatch ? raw.slice(0, endMatch.index) : raw.slice(0, 3000);

  let text = value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\u[\da-f]{4}/gi, c => String.fromCharCode(parseInt(c.slice(2), 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();

  // Strip MYNE brand references
  text = text
    .replace(/\bMYNE\b/g, '')
    .replace(/\bmyne-homes\.com\b/gi, '')
    .replace(/,?\s+with MYNE[^.]*\./gi, '.')
    .replace(/\bThrough MYNE[^.]*\./gi, '')
    .replace(/MYNE\s+takes\s+care[^.]*\./gi, '')
    .replace(/  +/g, ' ')
    .trim();

  return text;
}

// ─── Extract highlights (shown as "Highlights" section on MYNE pages) ─────────
// These become the property's amenities list
function extractHighlights(chunk) {
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');
  const block = chunk.slice(0, bcIdx + 200);

  // Find the highlights array nearest to bedroomsCount
  const hiRe = /\\"highlights\\":/g;
  let m, lastHiIdx = -1;
  while ((m = hiRe.exec(block)) !== null) lastHiIdx = m.index + m[0].length;
  if (lastHiIdx < 0) return [];

  const hiChunk = block.slice(lastHiIdx, lastHiIdx + 3000);
  const titles  = [...hiChunk.matchAll(/\\"title\\":\\"([^"\\]{3,150})\\"/g)].map(m => m[1]);
  return [...new Set(titles)]; // dedupe
}

// ─── Extract amenities ────────────────────────────────────────────────────────
function extractAmenities(html, chunk) {
  // Beds: fa-bed-front icon followed immediately by the count
  const bedM = html.match(/fa-bed-front[^<]*<\/i>(\d+)/);
  // Baths: fa-bath icon followed by count (may be decimal like 2.5)
  const bathM = html.match(/fa-bath[^<]*<\/i>([\d.]+)/);

  const beds  = bedM  ? parseInt(bedM[1], 10)        : parseInt(extractField(chunk, 'bedroomsCount'), 10) || null;
  const baths = bathM ? parseFloat(bathM[1])          : parseFloat(extractField(chunk, 'bathroomsCount')) || null;

  return { beds, baths };
}

// ─── Extract price ────────────────────────────────────────────────────────────
function extractPrice(html) {
  const m = html.match(/data-ontrack-id="property-price-value">(€[\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/[€,]/g, ''), 10) || null;
}

// ─── Decode HTML entities ─────────────────────────────────────────────────────
function decodeEntities(str) {
  return str
    .replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

// ─── Extract location ─────────────────────────────────────────────────────────
// Location breadcrumb: "City | Region | Country" in a text-ocean div
function extractLocation(html, chunk) {
  const breadM = html.match(/class="text-ocean">([^|<]+)\s*\|\s*([^|<]+)\s*\|\s*([^<]+)<\/div>/);
  if (breadM) {
    return {
      city:    decodeEntities(breadM[1].trim()),
      region:  decodeEntities(breadM[2].trim()),
      country: decodeEntities(breadM[3].trim()),
    };
  }
  return {
    city:    decodeEntities(extractField(chunk, 'locationTitle')),
    region:  decodeEntities(extractField(chunk, 'regionLabel')),
    country: decodeEntities(extractField(chunk, 'countryLabel')),
  };
}

// ─── Extract coordinates ─────────────────────────────────────────────────────
function extractCoords(chunk) {
  const latStr = extractField(chunk, 'locationLat');
  let   lngStr = extractField(chunk, 'locationLong');
  // Storyblok sometimes appends ",NNNN" (internal ID) — strip it
  lngStr = lngStr.split(',')[0];
  const lat = parseFloat(latStr) || null;
  const lng = parseFloat(lngStr) || null;
  return { lat, lng };
}

// ─── Extract H1 title (MYNE internal property name) ──────────────────────────
function extractH1Title(html) {
  const m = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

// ─── Auto-detect property type from URL slug ─────────────────────────────────
function detectType(slug) {
  const s = slug.toLowerCase();
  if (s.includes('chalet'))     return 'chalet';
  if (s.includes('penthouse'))  return 'penthouse';
  if (s.includes('finca'))      return 'finca';
  if (s.includes('townhouse'))  return 'townhouse';
  if (s.includes('semi-detached')) return 'villa';
  if (s.includes('villa'))      return 'villa';
  if (s.includes('apartment'))  return 'apartment';
  if (s.includes('house') || s.includes('home')) return 'villa';
  return 'villa'; // default
}

// ─── Extract subtitle (the one-liner under the H1) ────────────────────────────
function extractSubtitle(chunk) {
  // subtitle field lives in the same property block
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');
  const block  = chunk.slice(0, bcIdx + 200);
  const re     = /\\"subtitle\\":\\"([^"\\]{5,300})\\"/g;
  let m, last  = '';
  while ((m = re.exec(block)) !== null) last = m[1];
  return last;
}

// ─── Auto-detect best feature from slug + description ────────────────────────
function detectFeature(slug, description, subtitle, highlights) {
  const text = (slug + ' ' + description + ' ' + subtitle + ' ' + highlights.join(' ')).toLowerCase();
  if (text.includes('pool'))                          return 'with-pool';
  if (text.includes('sea-view') || text.includes('sea view') || text.includes('sea views') || text.includes('ocean view')) return 'with-sea-views';
  if (text.includes('lake-view') || text.includes('lake view') || text.includes('lake views') || text.includes('waterfront')) return 'with-lake-views';
  if (text.includes('mountain-view') || text.includes('mountain view') || text.includes('mountain views') || text.includes('mountains') || text.includes('panoramic')) return 'with-mountain-views';
  if (text.includes('garden'))                        return 'with-garden';
  if (text.includes('terrace'))                       return 'with-terrace';
  if (text.includes('fireplace'))                     return 'with-fireplace';
  return '';
}

// ─── Slug / title generators ─────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateSlug(city, country, beds, type, feature) {
  const parts = [city, country, beds ? `${beds}-bed` : null, type].filter(Boolean);
  if (feature) parts.push(feature);
  return parts.map(toSlug).join('-');
}

function makeUniqueSlug(base, properties) {
  if (!properties.find(p => p.slug === base)) return base;
  let i = 2;
  while (properties.find(p => p.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// e.g. "Ses Salines, Spain — 3-Bed Townhouse With Pool"
function generateCopTitle(city, country, beds, type, feature) {
  const typeLabel    = type.charAt(0).toUpperCase() + type.slice(1);
  const bedsLabel    = beds ? `${beds}-Bed ` : '';
  const featureLabel = feature
    ? ' ' + feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  return `${city}, ${country} — ${bedsLabel}${typeLabel}${featureLabel}`;
}

// ─── Drive: create folder ─────────────────────────────────────────────────────
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

// ─── Drive: upload images ─────────────────────────────────────────────────────
async function uploadImagesToDrive(drive, folderId, imageUrls) {
  const { Readable } = require('stream');
  console.log(`  📤 Uploading ${imageUrls.length} photos...`);
  for (let i = 0; i < imageUrls.length; i++) {
    const url      = imageUrls[i];
    const num      = String(i + 1).padStart(2, '0');
    const ext      = url.split('.').pop().split('?')[0].toLowerCase();
    const safeExt  = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
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
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  if (!args.url) {
    console.error('❌ Missing --url argument.\n');
    console.error('Usage:');
    console.error('  node scripts/add-myne-property.js \\');
    console.error('    --url https://www.myne-homes.com/listings/SLUG\n');
    process.exit(1);
  }

  if (!args.url.includes('myne-homes.com/listings/')) {
    console.error('❌ URL must be a myne-homes.com/listings/ page');
    process.exit(1);
  }

  const myneSlug = args.url.split('/listings/').pop().replace(/\/$/, '');

  // ── Step 1: Fetch listing page ─────────────────────────────────────────────
  console.log(`\n🔍 Fetching: ${args.url}`);
  const html  = await fetchHtml(args.url);
  const chunk = extractDataChunk(html);

  if (!chunk) {
    console.error('❌ Could not extract property data from page. Is the URL correct?');
    process.exit(1);
  }

  // ── Step 2: Availability check ────────────────────────────────────────────
  const status = checkAvailability(chunk);
  if (status) {
    console.error(`\n❌ Property is ${status} — not adding to site.`);
    process.exit(1);
  }

  const propertyStatus = extractField(chunk, 'propertyStatus');
  console.log(`  ✅ Status: ${propertyStatus || 'available'}`);

  // ── Step 3: Extract data ───────────────────────────────────────────────────
  console.log('\n📋 Extracting property data...');

  const h1Title             = extractH1Title(html);
  const { city, region, country } = extractLocation(html, chunk);
  const { beds, baths }     = extractAmenities(html, chunk);
  const price               = extractPrice(html);
  const { lat, lng }        = extractCoords(chunk);
  const description         = extractDescription(chunk);
  const highlights          = extractHighlights(chunk);
  const subtitle            = extractSubtitle(chunk);
  const images              = extractGalleryImages(html);
  const type                = detectType(myneSlug);
  const feature             = detectFeature(myneSlug, description, subtitle, highlights);

  console.log(`  ✅ MYNE title    : ${h1Title}`);
  console.log(`  ✅ Location      : ${city}, ${region}, ${country}`);
  console.log(`  ✅ Beds / Baths  : ${beds} / ${baths}`);
  console.log(`  ✅ Price         : €${price ? price.toLocaleString() : '?'}`);
  console.log(`  ✅ Coordinates   : ${lat}, ${lng}`);
  console.log(`  ✅ Type          : ${type}`);
  console.log(`  ✅ Feature       : ${feature || '(none)'}`);
  console.log(`  ✅ Gallery       : ${images.length} photos`);
  console.log(`  ✅ Highlights    : ${highlights.length} — ${highlights.slice(0, 3).join(', ')}...`);
  console.log(`  ✅ Description   : ${description.slice(0, 80)}...`);

  if (images.length === 0) {
    console.error('❌ No gallery images found — check the URL is correct.');
    process.exit(1);
  }
  if (!city || !country) {
    console.error('❌ Could not detect location. Check the page is a valid MYNE listing.');
    process.exit(1);
  }

  // ── Step 4: Generate slug + title ─────────────────────────────────────────
  const properties = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const baseSlug   = generateSlug(city, country, beds, type, feature);
  const slug       = makeUniqueSlug(baseSlug, properties);
  const title      = generateCopTitle(city, country, beds, type, feature);

  console.log(`\n🏷  Slug  : ${slug}`);
  console.log(`   Title : ${title}`);

  const existing = properties.find(p => p.slug === slug);
  if (existing) {
    console.warn(`\n⚠ Slug "${slug}" already exists — will UPDATE it.`);
    console.warn('  Press Ctrl+C within 3 seconds to cancel...');
    await new Promise(r => setTimeout(r, 3000));
  }

  // ── Step 5: Drive upload ───────────────────────────────────────────────────
  let driveUrl = null;
  if (!fs.existsSync(CREDS_FILE)) {
    console.warn('\n⚠ Drive credentials not found — skipping Drive upload.');
  } else {
    console.log('\n☁️  Setting up Google Drive...');
    const creds      = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
    const auth       = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
    const drive      = google.drive({ version: 'v3', auth });
    const folderName = `${h1Title} - Myne`;
    const folderId   = await createDriveFolder(drive, folderName);
    await uploadImagesToDrive(drive, folderId, images);
    driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log(`  ✅ Drive folder: ${driveUrl}`);
  }

  // ── Step 6: Build and save property ───────────────────────────────────────
  const hero     = images.slice(0, 3);
  const property = {
    slug,
    partner:     'myne',
    title,
    country,
    region,
    currency:    'EUR',
    price:       price  || null,
    beds:        beds   || null,
    baths:       baths  || null,
    img:         hero[0] || null,
    images:      hero,
    allImages:   images,
    description,
    amenities:   highlights,
    lat:         lat  || null,
    lng:         lng  || null,
    size:        null,     // MYNE does not show property size
    driveUrl:    driveUrl || null,
    notes:       args.url, // stores source MYNE URL
  };

  if (existing) {
    const idx = properties.findIndex(p => p.slug === slug);
    properties[idx] = { ...properties[idx], ...property };
    console.log(`\n✏️  Updated: ${slug}`);
  } else {
    properties.push(property);
    console.log(`\n➕ Added: ${slug}`);
  }

  fs.writeFileSync(PROPS_FILE, JSON.stringify(properties, null, 2));
  console.log('✅ Saved to lib/properties.json');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('📋 SUMMARY');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  MYNE property : ${h1Title}`);
  console.log(`  COP title     : ${title}`);
  console.log(`  Slug          : ${slug}`);
  console.log(`  Location      : ${city}, ${region}, ${country}`);
  console.log(`  Price         : €${(price || 0).toLocaleString()}`);
  console.log(`  Beds / Baths  : ${beds} / ${baths}`);
  console.log(`  Coordinates   : ${lat}, ${lng}`);
  console.log(`  Images        : ${images.length} total`);
  console.log(`  Drive         : ${driveUrl || '— (skipped)'}`);
  console.log(`  Source URL    : ${args.url}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\nNEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log(`  git commit -m "Add MYNE property: ${title}"`);
  console.log('  git push origin main\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
