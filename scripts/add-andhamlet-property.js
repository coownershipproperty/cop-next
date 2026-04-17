#!/usr/bin/env node
/**
 * add-andhamlet-property.js
 * ─────────────────────────────────────────────────────────────
 * Full pipeline for adding a new &Hamlet property to the COP site.
 *
 * USAGE:
 *   node scripts/add-andhamlet-property.js \
 *     --url https://www.andhamlet.com/listings/SLUG \
 *     --type villa \
 *     [--feature "with-pool"]   (optional, appended to slug/title)
 *
 * The script auto-detects from andhamlet.com:
 *   - Price, beds, baths, m², city, country, region
 *   - Gallery images (all photos from the property gallery)
 *   - Description (cleaned, no partner name)
 *   - Lat/lng coordinates
 *
 * WHAT IT DOES:
 *   1. Checks andhamlet.com/homes — skips if property is sold out
 *   2. Fetches the listing page for images, description, coordinates
 *   3. Auto-generates COP slug + title
 *   4. Creates a fresh Google Drive folder and uploads all gallery photos
 *   5. Saves everything to lib/properties.json
 *
 * AFTER RUNNING:
 *   git add lib/properties.json
 *   git commit -m "Add And Hamlet property: ..."
 *   git push origin main
 *   → Vercel redeploys automatically (~1-2 min)
 *
 * REQUIRED FILES:
 *   mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json  (Drive service account)
 */

'use strict';

const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const { google } = require('googleapis');

// ─── Config ─────────────────────────────────────────────────────────────────
const PROPS_FILE   = path.join(__dirname, '../lib/properties.json');
const CREDS_FILE   = path.join(__dirname, '../mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json');
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

// ─── Extract all structured data from the listing page's w--current card ─────
// The w--current card in "More Homes" contains location, price, beds, baths, m²
function extractCurrentCardData(html) {
  const cardIdx = html.indexOf('home-selected_item-link w-inline-block w--current');
  if (cardIdx < 0) return null;

  const chunk = html.slice(cardIdx, cardIdx + 6000); // 6000 needed — beds/baths are ~4500 chars in

  // Location: "Palma, Mallorca, Spain"
  const locM = chunk.match(/tagline is-green is-tiny"[^>]*>([^<]+)</);
  let city = '', region = '', country = '';
  if (locM) {
    const parts = locM[1].trim().split(',').map(s => s.trim());
    city    = parts[0]                   || '';
    region  = parts[1]                   || '';
    country = parts[parts.length - 1]    || '';
  }

  // Price
  const priceM = chunk.match(/class="home-selected_text"[^>]*>(\d[\d,]*)</);
  const price  = priceM ? parseInt(priceM[1].replace(/,/g, ''), 10) : null;

  // Beds / Baths
  const bedsM  = chunk.match(/<div>(\d+)<\/div>\s*<div>BEDrooms<\/div>/);
  const bathsM = chunk.match(/<div>(\d+)<\/div>\s*<div>BATH<\/div>/);
  const beds   = bedsM  ? parseInt(bedsM[1], 10)  : null;
  const baths  = bathsM ? parseInt(bathsM[1], 10) : null;

  // m²
  const metersM = chunk.match(/<div>(\d+)<\/div>\s*<div>m²<\/div>/);
  const size    = metersM ? parseInt(metersM[1], 10) : null;

  return { city, region, country, price, beds, baths, size };
}

// ─── Scrape /homes page for extra data if card not found on listing page ──────
async function scrapeHomesPage() {
  const html = await fetchHtml('https://www.andhamlet.com/homes');
  const map  = {};
  const cardRe = /href="\/listings\/([a-z0-9-]+)"\s+class="home-selected_item-link/g;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const slug  = m[1];
    const chunk = html.slice(m.index, m.index + 3000);

    const locM = chunk.match(/tagline is-green is-tiny"[^>]*>([^<]+)</);
    let city = '', region = '', country = '';
    if (locM) {
      const parts = locM[1].trim().split(',').map(s => s.trim());
      city    = parts[0]                || '';
      region  = parts[1]                || '';
      country = parts[parts.length - 1] || '';
    }
    const priceM  = chunk.match(/class="home-selected_text"[^>]*>(\d[\d,]*)</);
    const bedsM   = chunk.match(/<div>(\d+)<\/div>\s*<div>BEDrooms<\/div>/);
    const bathsM  = chunk.match(/<div>(\d+)<\/div>\s*<div>BATH<\/div>/);
    const metersM = chunk.match(/<div>(\d+)<\/div>\s*<div>m²<\/div>/);

    map[slug] = {
      city, region, country,
      price: priceM  ? parseInt(priceM[1].replace(/,/g,''), 10) : null,
      beds:  bedsM   ? parseInt(bedsM[1], 10)   : null,
      baths: bathsM  ? parseInt(bathsM[1], 10)  : null,
      size:  metersM ? parseInt(metersM[1], 10) : null,
    };
  }
  return map;
}

function toTitleCase(str) {
  // "COSTA DEL SOL" → "Costa del Sol", "FRANCE" → "France"
  const lowers = ['del', 'de', 'la', 'd', 'du', 'des', 'les', 'le', 'and', 'of', 'the'];
  return str.toLowerCase().split(' ').map((w, i) =>
    (i === 0 || !lowers.includes(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ');
}

// ─── Extract gallery images from section_gallery8 ────────────────────────────
function extractGalleryImages(html) {
  const startIdx = html.indexOf('section_gallery8');
  if (startIdx < 0) { console.warn('⚠ section_gallery8 not found'); return []; }

  const sectionStart = html.lastIndexOf('<section', startIdx);

  // Walk forward to matching </section>
  let depth = 0, pos = sectionStart, sectionEnd = -1;
  while (pos < html.length) {
    const nextOpen  = html.indexOf('<section', pos + 1);
    const nextClose = html.indexOf('</section', pos + 1);
    if (nextClose < 0) break;
    if (nextOpen > 0 && nextOpen < nextClose) { depth++; pos = nextOpen; }
    else {
      if (depth === 0) { sectionEnd = nextClose; break; }
      depth--; pos = nextClose;
    }
  }

  const galleryHtml = sectionEnd > 0
    ? html.slice(sectionStart, sectionEnd)
    : html.slice(sectionStart, sectionStart + 150000);

  const urls  = new Set();
  const imgRe = /<img[^>]+src="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"[^>]*>/g;
  let m;
  while ((m = imgRe.exec(galleryHtml)) !== null) {
    const src = m[1];
    if (src.includes('-p-500') || src.includes('-p-800') || src.includes('thumb')) continue;
    if (/hamle|arrow|icon|logo|close|menu/i.test(src)) continue;
    urls.add(src);
  }
  return [...urls];
}

// ─── Extract description ─────────────────────────────────────────────────────
function extractDescription(html) {
  const marker = 'class="w-richtext"';
  const start  = html.indexOf(marker);
  if (start < 0) return '';

  const divStart = html.lastIndexOf('<div', start);
  let depth = 0, pos = divStart, divEnd = -1;
  while (pos < html.length) {
    const nextOpen  = html.indexOf('<div', pos + 1);
    const nextClose = html.indexOf('</div', pos + 1);
    if (nextClose < 0) break;
    if (nextOpen > 0 && nextOpen < nextClose) { depth++; pos = nextOpen; }
    else {
      if (depth === 0) { divEnd = nextClose; break; }
      depth--; pos = nextClose;
    }
  }

  const chunk = divEnd > 0 ? html.slice(divStart, divEnd + 6) : html.slice(divStart, divStart + 8000);

  const paras = [];
  const pRe   = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let pm;
  while ((pm = pRe.exec(chunk)) !== null) {
    const text = pm[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x200D;/g, '')
      .replace(/\u200d/g, '')
      .trim();
    if (text.length > 20) paras.push(text);
  }

  let text = paras.join(' ').replace(/\s{2,}/g, ' ').trim();

  // Strip partner name references
  text = text
    .replace(/&Hamlet/gi, '')
    .replace(/\bAndHamlet\b/gi, '')
    .replace(/\bAnd Hamlet\b/gi, '')
    .replace(/\bWith\s*,/gi, 'With')
    .replace(/\bThrough\s*,/gi, '')
    .replace(/through\s*[.,!]/gi, '')
    .replace(/\s+as\s+takes\s+\w+/gi, '')
    .replace(/,?\s+but\s+you\s+can\s+just\s+relax\s+as\s+takes\s+care\s+of\s+the\s+property/gi, '')
    .replace(/\bis\s+happy\s+to\b[^.]*\./gi, '')
    .replace(/\s*Partner\s*:\s*[^\n.]*/gi, '')
    .replace(/[^.]*your family has everything set for unforgettable experiences[^.]*/gi, '')
    .replace(/everything is in place\.\s*/gi, '')
    .replace(/All you need to do is arrive[^.]*/gi, '')
    .replace(/\bevery\s+(?:single\s+)?detail\s+is\s+taken\s+care\s+of\b[^.]*/gi, '')
    .replace(/Please\s+note\s*:\s*Illustrations[^.]*/gi, '')
    .replace(/We curate every detail[^.]*/gi, '');

  // Strip boilerplate sales sentences
  text = text
    .replace(/[^.]*\benough buyers\b[^.]*/gi, '')
    .replace(/[^.]*\bpurchased in its entirety\b[^.]*/gi, '')
    .replace(/[^.]*\bco-owning this\b[^.]*/gi, '')
    .replace(/[^.]*\bwe will ensure it becomes\b[^.]*/gi, '')
    .replace(/[^.]*\bbecomes a\s+\w*\s*property\b[^.]*/gi, '')
    .replace(/[^.]*\bRefer to the floor plan\b[^.]*/gi, '');

  // Strip NB / disclaimer at start
  text = text.replace(/^\s*NB\s*:[^.]*\.\s*/i, '');

  // Clean up orphan punctuation
  text = text
    .replace(/\u00a0/g, ' ')
    .replace(/^[,\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*$/, '')
    .replace(/\.\s+[a-z][^.]*$/, '.');

  return text.trim();
}

// ─── Extract lat/lng from embedded Google Map ────────────────────────────────
function extractLatLng(html) {
  const mapMatch = html.match(/maps\/embed\?pb=([^"]+)"/);
  if (!mapMatch) return { lat: null, lng: null };
  const pb   = decodeURIComponent(mapMatch[1]);
  const latM = pb.match(/!3d(-?\d+\.\d+)/);
  const lngM = pb.match(/!2d(-?\d+\.\d+)/);
  return {
    lat: latM ? parseFloat(latM[1]) : null,
    lng: lngM ? parseFloat(lngM[1]) : null,
  };
}

// ─── Slug / title generators ─────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateSlug(city, country, beds, type, feature) {
  const bedsPart = beds ? `${beds}-bed` : null;
  const parts    = [city, country, bedsPart, type].filter(Boolean);
  if (feature) parts.push(feature);
  return parts.map(toSlug).join('-');
}

function generateTitle(city, country, beds, type, feature) {
  const typeFormatted    = type.charAt(0).toUpperCase() + type.slice(1);
  const featureFormatted = feature
    ? ' ' + feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  const bedsLabel = beds ? `${beds}-Bed ` : '';
  return `${city}, ${country} — ${bedsLabel}${typeFormatted}${featureFormatted}`;
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
    const fileName = `photo-${num}.${ext || 'jpg'}`;
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
    console.error('  node scripts/add-andhamlet-property.js \\');
    console.error('    --url https://www.andhamlet.com/listings/SLUG \\');
    console.error('    --type villa \\');
    console.error('    --feature "with-pool"   (optional)');
    console.error('');
    console.error('Types: villa, apartment, penthouse, chalet, townhouse');
    console.error('Feature examples: with-pool, with-sea-views, with-garden, with-fireplace');
    process.exit(1);
  }

  const ahSlug  = args.url.split('/listings/').pop().replace(/\/$/, '');
  const type    = args.type;
  const feature = args.feature || '';

  // ── Step 1: Fetch listing page ──────────────────────────────────────────
  console.log(`\n🔍 Fetching listing page: ${args.url}`);
  const html = await fetchHtml(args.url);

  // ── Step 2: Sold-out check (from page title) ─────────────────────────────
  const rawTitle = html.match(/<title>([^<]+)<\/title>/);
  if (rawTitle && /all shares?\s+sold|shares?\s+sold|sold out/i.test(rawTitle[1])) {
    console.error(`\n❌ PROPERTY IS SOLD OUT`);
    console.error(`   Title: "${rawTitle[1].trim()}"`);
    console.error('   Sold-out properties should not be added to the COP website.');
    process.exit(1);
  }
  console.log('  ✅ Property is not sold out');

  // ── Step 3: Extract all data ─────────────────────────────────────────────
  console.log('\n📋 Extracting property data...');

  // Primary: w--current card in More Homes (has location, price, beds, baths, m²)
  let propData = extractCurrentCardData(html);

  // Fallback: /homes server-rendered HTML
  if (!propData || !propData.city) {
    console.log('  Checking /homes server HTML...');
    const homesData = await scrapeHomesPage();
    if (homesData[ahSlug] && homesData[ahSlug].city) {
      propData = homesData[ahSlug];
      console.log(`  ✅ Found on /homes page`);
    }
  }

  // Fallback: price from the listing page header (always present)
  const headerPriceM = html.match(/home-selected_item-price-wrapper[\s\S]{0,200}?home-selected_text"[^>]*>(\d[\d,]*)/);
  const headerPrice  = headerPriceM ? parseInt(headerPriceM[1].replace(/,/g,''), 10) : null;

  propData = propData || {};

  const images      = extractGalleryImages(html);
  const description = extractDescription(html);
  const { lat, lng } = extractLatLng(html);

  // City/country: prefer card data, then CLI args
  const city    = propData.city    || args.city    || '';
  const country = propData.country || args.country || '';
  const region  = propData.region  || args.region  || '';
  const beds    = propData.beds    || null;
  const baths   = propData.baths   || null;
  const size    = propData.size    || null;
  const price   = propData.price   || headerPrice  || null;

  if (propData.city) {
    console.log(`  ✅ Location : ${city}, ${region}, ${country}`);
    console.log(`  ✅ Beds/Bath: ${beds} / ${baths}`);
    console.log(`  ✅ m²       : ${size}`);
    console.log(`  ✅ Price    : €${price ? price.toLocaleString() : '?'}`);
  } else if (city) {
    console.log(`  ℹ  Using manual location: ${city}, ${region}, ${country}`);
  }

  console.log(`\n  Gallery images : ${images.length}`);
  console.log(`  Description    : ${description.slice(0, 80)}...`);
  console.log(`  Coordinates    : ${lat}, ${lng}`);

  if (images.length === 0) {
    console.error('❌ No gallery images found — check the URL is correct.');
    process.exit(1);
  }
  if (!city || !country) {
    console.error('❌ Could not determine city/country. Pass --city and --country manually.');
    process.exit(1);
  }

  // ── Step 5: Generate slug + title ────────────────────────────────────────
  const slug  = generateSlug(city, country, beds || '?', type, feature);
  const title = generateTitle(city, country, beds || '?', type, feature);
  console.log(`\n🏷  Slug  : ${slug}`);
  console.log(`   Title : ${title}`);

  // Check for duplicate slug
  const properties = JSON.parse(fs.readFileSync(PROPS_FILE, 'utf8'));
  const existing   = properties.find(p => p.slug === slug);
  if (existing) {
    console.warn(`\n⚠ Slug "${slug}" already exists — will UPDATE existing property.`);
    console.warn('  Press Ctrl+C within 3 seconds to cancel...');
    await new Promise(r => setTimeout(r, 3000));
  }

  // ── Step 6: Drive upload ─────────────────────────────────────────────────
  let driveUrl = null;
  if (!fs.existsSync(CREDS_FILE)) {
    console.warn('\n⚠ Drive credentials not found — skipping Drive upload.');
  } else {
    console.log('\n☁️  Setting up Google Drive...');
    const creds    = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
    const auth     = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
    const drive    = google.drive({ version: 'v3', auth });
    const folderName = `${city}, ${country} - ${beds}-Bed Property Photos`;
    const folderId   = await createDriveFolder(drive, folderName);
    await uploadImagesToDrive(drive, folderId, images);
    driveUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log(`  Drive folder: ${driveUrl}`);
  }

  // ── Step 7: Build and save property ─────────────────────────────────────
  const hero     = images.slice(0, 3);
  const property = {
    slug,
    partner:     'andhamlet',
    title,
    region,
    price:       price   || null,
    beds:        beds    || null,
    baths:       baths   || null,
    img:         hero[0] || null,
    images:      hero,
    allImages:   images,
    description,
    amenities:   [],
    lat:         lat  || null,
    lng:         lng  || null,
    size:        size || null,
    driveUrl:    driveUrl || null,
    notes:       args.url,
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
  console.log(`  Title     : ${title}`);
  console.log(`  Slug      : ${slug}`);
  console.log(`  Price     : €${(price || 0).toLocaleString()}`);
  console.log(`  Beds/Bath : ${beds} bed / ${baths} bath`);
  console.log(`  Size      : ${size ? size + ' m²' : '— (not found)'}`);
  console.log(`  Location  : ${city}, ${region}, ${country}`);
  console.log(`  Coords    : ${lat}, ${lng}`);
  console.log(`  Images    : ${images.length} total (${hero.length} hero)`);
  console.log(`  Drive     : ${driveUrl || '— (skipped)'}`);
  console.log(`  Partner   : ${args.url}`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\nNEXT STEPS:');
  console.log('  git add lib/properties.json');
  console.log(`  git commit -m "Add And Hamlet property: ${title}"`);
  console.log('  git push origin main');
  console.log('  → Vercel redeploys in ~1-2 min\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
