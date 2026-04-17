#!/usr/bin/env node
/**
 * scrape-myne-all.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Bulk pipeline: scrape ALL public MYNE listings and rebuild the myne entries
 * in lib/properties.json.
 *
 * USAGE:
 *   node scripts/scrape-myne-all.js                  # full run
 *   node scripts/scrape-myne-all.js --dry-run        # preview only, no writes
 *   node scripts/scrape-myne-all.js --no-drive       # skip Drive uploads
 *   node scripts/scrape-myne-all.js --start=N        # resume from property N (0-indexed)
 *
 * WHAT IT DOES:
 *   1. Fetches myne-homes.com/listings to get all public property slugs
 *      (discreet-marketing properties have empty slugs and are auto-excluded)
 *   2. For each slug, fetches the property page and:
 *      - Skips SOLD OUT (propertyStatus contains 'sold')
 *      - Skips DISCREET MARKETING (isDiscreet: true)
 *      - Extracts all data, auto-detects type + feature
 *      - Uploads to a fresh Google Drive folder
 *   3. Replaces ALL myne entries in lib/properties.json
 *   4. Commits a summary
 *
 * AFTER RUNNING:
 *   git add lib/properties.json
 *   git commit -m "Refresh all MYNE properties"
 *   git push origin main
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
const LISTINGS_URL = 'https://www.myne-homes.com/listings';
const BASE_URL     = 'https://www.myne-homes.com/listings/';
const DELAY_MS     = 1500; // polite delay between requests

// ─── CLI flags ────────────────────────────────────────────────────────────────
const DRY_RUN  = process.argv.includes('--dry-run');
const NO_DRIVE = process.argv.includes('--no-drive');
const startArg = process.argv.find(a => a.startsWith('--start='));
const START_IDX = startArg ? parseInt(startArg.split('=')[1], 10) : 0;

// ─── HTTP fetch ───────────────────────────────────────────────────────────────
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout: ' + url)); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Download binary ──────────────────────────────────────────────────────────
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

// ─── Get all public listing slugs from the listings page ─────────────────────
async function getAllSlugs() {
  console.log(`\n📋 Fetching listings page: ${LISTINGS_URL}`);
  const html   = await fetchHtml(LISTINGS_URL);
  const chunks = [];
  const re     = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) chunks.push(m[1]);

  // Find the chunk with listing data
  const dataChunk = chunks.find(c => c.includes('full_slug') && c.includes('listings/'));
  if (!dataChunk) {
    throw new Error('Could not find listing slugs in page HTML');
  }

  // Extract slugs from non-empty full_slug values
  // Discreet properties have full_slug: "" — auto-excluded
  const slugs  = [];
  const seen   = new Set();
  const slugRe = /full_slug\\+":\\+"listings\/([a-z0-9][a-z0-9-]{5,})/g;
  while ((m = slugRe.exec(dataChunk)) !== null) {
    const slug = m[1];
    if (!seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }

  console.log(`  Found ${slugs.length} public listings (discreet/private auto-excluded)`);
  return slugs;
}

// ─── Extract data chunk from property page ───────────────────────────────────
function extractDataChunk(html) {
  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) chunks.push(m[1]);
  return chunks.find(c => c.includes('bedroomsCount')) || '';
}

function extractField(chunk, field) {
  const re = new RegExp(`\\\\\\"${field}\\\\\\":\\\\\\"([^\\\\\\"]*)\\\\\\"`, 'i');
  const m  = chunk.match(re);
  return m ? m[1] : '';
}

// ─── Availability check ───────────────────────────────────────────────────────
function checkAvailability(chunk) {
  const isDiscreet = extractField(chunk, 'isDiscreet');
  if (isDiscreet === 'true') return 'DISCREET MARKETING';

  const status = extractField(chunk, 'propertyStatus');
  if (status && status.toLowerCase().includes('sold')) return 'SOLD OUT';

  return null;
}

// ─── Gallery images ───────────────────────────────────────────────────────────
function extractGalleryImages(html) {
  const bedIdx = html.indexOf('fa-bed-front');
  const chunk  = bedIdx > 0 ? html.slice(Math.max(0, bedIdx - 12000), bedIdx) : html;

  const seen = new Set();
  const imgs = [];
  const re   = /\/_next\/image\?url=(https%3A%2F%2Fa\.storyblok\.com%2Ff%2F148662%2F[^&"]+)(?:&|")/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const decoded = decodeURIComponent(m[1]);
    if (!seen.has(decoded)) { seen.add(decoded); imgs.push(decoded); }
  }
  return imgs;
}

// ─── Description (full multi-paragraph version) ───────────────────────────────
function extractDescription(chunk) {
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');
  const descRe = /\\"description\\":\\"/g;
  let m, lastDescIdx = -1;
  while ((m = descRe.exec(chunk)) !== null) {
    if (m.index < bcIdx) lastDescIdx = m.index + m[0].length;
  }
  if (lastDescIdx < 0) return '';

  const raw       = chunk.slice(lastDescIdx, lastDescIdx + 5000);
  const endMatch  = raw.match(/(?<!\\)\\"/);
  const value     = endMatch ? raw.slice(0, endMatch.index) : raw.slice(0, 3000);

  let text = value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\u[\da-f]{4}/gi, c => String.fromCharCode(parseInt(c.slice(2), 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();

  return text
    .replace(/\bMYNE\b/g, '')
    .replace(/\bmyne-homes\.com\b/gi, '')
    .replace(/,?\s+with MYNE[^.]*\./gi, '.')
    .replace(/  +/g, ' ')
    .trim();
}

// ─── Highlights ───────────────────────────────────────────────────────────────
function extractHighlights(chunk) {
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');
  const block = chunk.slice(0, bcIdx + 200);
  const hiRe  = /\\"highlights\\":/g;
  let m, lastHiIdx = -1;
  while ((m = hiRe.exec(block)) !== null) lastHiIdx = m.index + m[0].length;
  if (lastHiIdx < 0) return [];
  const hiChunk = block.slice(lastHiIdx, lastHiIdx + 3000);
  const titles  = [...hiChunk.matchAll(/\\"title\\":\\"([^"\\]{3,150})\\"/g)].map(m => m[1]);
  return [...new Set(titles)];
}

// ─── Subtitle ─────────────────────────────────────────────────────────────────
function extractSubtitle(chunk) {
  const bcIdx = chunk.indexOf('\\"bedroomsCount\\"');
  const block = chunk.slice(0, bcIdx + 200);
  const re    = /\\"subtitle\\":\\"([^"\\]{5,300})\\"/g;
  let m, last = '';
  while ((m = re.exec(block)) !== null) last = m[1];
  return last;
}

// ─── Amenities ────────────────────────────────────────────────────────────────
function extractAmenities(html, chunk) {
  const bedM  = html.match(/fa-bed-front[^<]*<\/i>(\d+)/);
  const bathM = html.match(/fa-bath[^<]*<\/i>([\d.]+)/);
  const beds  = bedM  ? parseInt(bedM[1], 10)   : parseInt(extractField(chunk, 'bedroomsCount'), 10) || null;
  const baths = bathM ? parseFloat(bathM[1])     : parseFloat(extractField(chunk, 'bathroomsCount')) || null;
  return { beds, baths };
}

// ─── Price ────────────────────────────────────────────────────────────────────
function extractPrice(html) {
  const m = html.match(/data-ontrack-id="property-price-value">(€[\d,]+)/);
  return m ? parseInt(m[1].replace(/[€,]/g, ''), 10) || null : null;
}

// ─── Decode HTML entities ─────────────────────────────────────────────────────
function decodeEntities(str) {
  return str
    .replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// ─── Location ─────────────────────────────────────────────────────────────────
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

// ─── Coordinates ──────────────────────────────────────────────────────────────
function extractCoords(chunk) {
  const latStr = extractField(chunk, 'locationLat');
  let   lngStr = extractField(chunk, 'locationLong');
  lngStr = lngStr.split(',')[0]; // strip storyblok internal ID suffix
  return { lat: parseFloat(latStr) || null, lng: parseFloat(lngStr) || null };
}

// ─── H1 title ─────────────────────────────────────────────────────────────────
function extractH1Title(html) {
  const m = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

// ─── Type detection ───────────────────────────────────────────────────────────
function detectType(slug) {
  const s = slug.toLowerCase();
  if (s.includes('chalet'))        return 'chalet';
  if (s.includes('penthouse'))     return 'penthouse';
  if (s.includes('finca'))         return 'finca';
  if (s.includes('townhouse'))     return 'townhouse';
  if (s.includes('semi-detached')) return 'villa';
  if (s.includes('villa'))         return 'villa';
  if (s.includes('apartment'))     return 'apartment';
  if (s.includes('house') || s.includes('home')) return 'villa';
  return 'villa';
}

// ─── Feature detection ────────────────────────────────────────────────────────
function detectFeature(slug, description, subtitle, highlights) {
  const text = (slug + ' ' + description + ' ' + subtitle + ' ' + highlights.join(' ')).toLowerCase();
  if (text.includes('pool'))                                                                          return 'with-pool';
  if (text.includes('sea-view') || text.includes('sea view') || text.includes('ocean view'))         return 'with-sea-views';
  if (text.includes('waterfront') || text.includes('lake-view') || text.includes('lake view'))       return 'with-lake-views';
  if (text.includes('mountain-view') || text.includes('mountain view') || text.includes('mountain views') || text.includes('mountains') || text.includes('panoramic')) return 'with-mountain-views';
  if (text.includes('garden'))                                                                        return 'with-garden';
  if (text.includes('terrace'))                                                                       return 'with-terrace';
  if (text.includes('fireplace'))                                                                     return 'with-fireplace';
  return '';
}

// ─── Slug / title generators ──────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildSlug(city, country, beds, type, feature, takenSlugs) {
  const parts = [city, country, beds ? `${beds}-bed` : null, type].filter(Boolean);
  if (feature) parts.push(feature);
  let base = parts.map(toSlug).join('-');
  if (!takenSlugs.has(base)) { takenSlugs.add(base); return base; }
  let i = 2;
  while (takenSlugs.has(`${base}-${i}`)) i++;
  takenSlugs.add(`${base}-${i}`);
  return `${base}-${i}`;
}

function buildTitle(city, country, beds, type, feature) {
  const typeLabel    = type.charAt(0).toUpperCase() + type.slice(1);
  const bedsLabel    = beds ? `${beds}-Bed ` : '';
  const featureLabel = feature
    ? ' ' + feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  return `${city}, ${country} — ${bedsLabel}${typeLabel}${featureLabel}`;
}

// ─── Drive ────────────────────────────────────────────────────────────────────
async function createDriveFolder(drive, name) {
  const existing = await drive.files.list({
    q: `name='${name}' and '${DRIVE_PARENT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  for (const f of existing.data.files || []) {
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
    const url      = imageUrls[i];
    const num      = String(i + 1).padStart(2, '0');
    const ext      = url.split('.').pop().split('?')[0].toLowerCase();
    const safeExt  = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    try {
      const { buffer, contentType } = await downloadBuffer(url);
      await drive.files.create({
        requestBody: { name: `photo-${num}.${safeExt}`, parents: [folderId] },
        media: { mimeType: contentType, body: Readable.from(buffer) },
        fields: 'id', supportsAllDrives: true,
      });
      process.stdout.write(`   📤 ${i + 1}/${imageUrls.length}   `);
    } catch (e) {
      console.warn(`\n    ⚠ Failed photo ${num}: ${e.message}`);
    }
  }
  process.stdout.write('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏠 MYNE — Bulk property scraper');
  if (DRY_RUN)  console.log('   MODE: DRY RUN (no writes)');
  if (NO_DRIVE) console.log('   MODE: NO DRIVE uploads');
  if (START_IDX > 0) console.log(`   Resuming from index ${START_IDX}`);

  // ── Step 1: Get all slugs ──────────────────────────────────────────────────
  const allSlugs = await getAllSlugs();

  // ── Step 2: Set up Drive (if needed) ──────────────────────────────────────
  let drive = null;
  if (!NO_DRIVE && !DRY_RUN) {
    if (!fs.existsSync(CREDS_FILE)) {
      console.warn('\n⚠ Drive credentials not found — running with --no-drive');
    } else {
      const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
      const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
      drive       = google.drive({ version: 'v3', auth });
      console.log('☁️  Google Drive connected');
    }
  }

  // ── Step 3: Load current properties, collect taken slugs ──────────────────
  const allProps   = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const nonMyne    = allProps.filter(p => p.partner !== 'myne');
  const takenSlugs = new Set(nonMyne.map(p => p.slug));

  // If resuming, pre-load already-scraped myne entries to preserve their slugs
  const newMyne = [];
  if (START_IDX > 0) {
    const existingMyne = allProps.filter(p => p.partner === 'myne');
    for (const p of existingMyne) {
      newMyne.push(p);
      takenSlugs.add(p.slug);
    }
    console.log(`  Loaded ${existingMyne.length} existing MYNE entries (resume mode)`);
  }

  // ── Step 4: Scrape each property ───────────────────────────────────────────
  let scraped = 0, skipped = 0, errors = 0;

  for (let i = START_IDX; i < allSlugs.length; i++) {
    const myneSlug = allSlugs[i];
    const url      = BASE_URL + myneSlug;
    process.stdout.write(`\n[${i + 1}/${allSlugs.length}] ${myneSlug.slice(0, 60)}\n`);

    try {
      await sleep(DELAY_MS);
      const html  = await fetchHtml(url);
      const chunk = extractDataChunk(html);

      if (!chunk) {
        console.log('  ⚠ Could not extract data chunk — skipping');
        skipped++;
        continue;
      }

      // Availability
      const unavailable = checkAvailability(chunk);
      if (unavailable) {
        console.log(`  ⏭  ${unavailable} — skipping`);
        skipped++;
        continue;
      }

      // Extract
      const h1Title          = extractH1Title(html);
      const { city, region, country } = extractLocation(html, chunk);
      const { beds, baths }  = extractAmenities(html, chunk);
      const price            = extractPrice(html);
      const { lat, lng }     = extractCoords(chunk);
      const description      = extractDescription(chunk);
      const highlights       = extractHighlights(chunk);
      const subtitle         = extractSubtitle(chunk);
      const images           = extractGalleryImages(html);
      const type             = detectType(myneSlug);
      const feature          = detectFeature(myneSlug, description, subtitle, highlights);

      if (images.length === 0) {
        console.log('  ⚠ No gallery images found — skipping');
        skipped++;
        continue;
      }

      const slug  = buildSlug(city, country, beds, type, feature, takenSlugs);
      const title = buildTitle(city, country, beds, type, feature);
      const status = extractField(chunk, 'propertyStatus');

      console.log(`  ✅ ${title} — ${images.length} photos (${status})`);

      // Drive upload
      let driveUrl = null;
      if (drive && !DRY_RUN) {
        const folderName = `${h1Title} - Myne`;
        const folderId   = await createDriveFolder(drive, folderName);
        await uploadImages(drive, folderId, images);
        driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
      }

      const hero = images.slice(0, 3);
      newMyne.push({
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
        lat:         lat || null,
        lng:         lng || null,
        size:        null,
        driveUrl:    driveUrl || null,
        notes:       url,
      });

      scraped++;

      // Save after each property (resumable)
      if (!DRY_RUN) {
        fs.writeFileSync(PROPS_FILE, JSON.stringify([...nonMyne, ...newMyne], null, 2));
      }

    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      errors++;
    }
  }

  // ── Step 5: Final save ─────────────────────────────────────────────────────
  if (!DRY_RUN) {
    fs.writeFileSync(PROPS_FILE, JSON.stringify([...nonMyne, ...newMyne], null, 2));
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('📊 RESULTS');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Total slugs found : ${allSlugs.length}`);
  console.log(`  Scraped           : ${scraped}`);
  console.log(`  Skipped           : ${skipped} (sold out / discreet / no images)`);
  console.log(`  Errors            : ${errors}`);
  console.log(`  MYNE entries now  : ${newMyne.length}`);
  if (!DRY_RUN) {
    console.log('\nNEXT STEPS:');
    console.log('  git add lib/properties.json');
    console.log('  git commit -m "Refresh all MYNE properties"');
    console.log('  git push origin main\n');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
