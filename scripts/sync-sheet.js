#!/usr/bin/env node
/**
 * sync-sheet.js
 * Fetches the COP Properties Google Sheet (CSV export) and writes
 * lib/properties.json — the single source of truth for all property pages.
 *
 * Usage:  node scripts/sync-sheet.js
 *
 * The SHEET_URL env var can override the default sheet ID.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1EPOcoylQ11dBqutw0zsyasviSwjs1Fmsg8AhoDuseXw';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const OUT_PATH = path.join(__dirname, '..', 'lib', 'properties.json');

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[—–]/g, '-')          // em/en dash → hyphen
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')   // strip remaining special chars
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCSV(raw) {
  // Properly handle quoted multi-line fields
  const rows = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      if (cur.trim()) rows.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(cur);

  const headers = parseCSVLine(rows[0]);
  return rows.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

function fetchURL(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching sheet…');
  const raw = await fetchURL(SHEET_URL);
  const rows = parseCSV(raw);
  console.log(`Parsed ${rows.length} rows`);

  // Track slugs for uniqueness
  const slugCount = {};

  const properties = rows
    .filter(r => r.Status === 'Live' && r.Title)
    .map(r => {
      // Generate unique slug from title
      let base = slugify(r.Title);
      slugCount[base] = (slugCount[base] || 0) + 1;
      const slug = slugCount[base] > 1 ? `${base}-${slugCount[base]}` : base;

      // Parse comma-separated images, converting Google Drive share URLs
      // to direct thumbnail URLs that work as <img src>
      const images = r.Images
        ? r.Images.split(',').map(s => {
            const url = s.trim();
            // Convert drive.google.com/uc?id=FILE_ID → lh3 thumbnail URL
            const ucMatch = url.match(/drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/);
            if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
            // Convert drive.google.com/file/d/FILE_ID/view → lh3 thumbnail URL
            const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
            return url;
          }).filter(Boolean)
          // Remove known branding/logo images that should never appear in galleries
          .filter(url => !url.endsWith('photo-02.png'))
        : [];

      // Parse comma-separated amenities
      const amenities = r.Amenities
        ? r.Amenities.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      return {
        slug,
        id: r.ID || '',
        title: r.Title,
        status: r.Status,
        country: r.Country,
        region: r.Region,
        city: r.City,
        beds: parseInt(r.Beds) || 0,
        baths: parseFloat(r.Baths) || 0,
        size: parseInt(r.Size_m2) || 0,
        price: parseInt(r.Price_Share) || 0,
        currency: r.Currency || 'EUR',
        description: r.Description || '',
        amenities,
        images,
        img: images[0] || '',       // primary image for cards
        driveUrl: r.Drive_URL || '',
        rental: r.Rental === 'Yes',
        lat: parseFloat(r.Lat) || null,
        lng: parseFloat(r.Lng) || null,
        partner: r.Partner || '',
        dateAdded: r.Date_Added || '',
        notes: r.Notes || '',
      };
    });

  // ── Merge with existing enriched data ────────────────────────────────────────
  // The sheet has truncated descriptions and may lack amenities/notes we've
  // fetched from partner sites. Preserve enriched fields when the sheet has
  // shorter or empty values. Sheet remains authoritative for structural fields
  // (title, price, images, region, partner, etc.).
  let existing = [];
  if (fs.existsSync(OUT_PATH)) {
    try { existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')); } catch (e) { /* ignore */ }
  }
  const existingBySlug = {};
  existing.forEach(p => { existingBySlug[p.slug] = p; });

  properties.forEach(p => {
    const ex = existingBySlug[p.slug];
    if (!ex) return;

    // Keep description if existing is longer (sheet may be truncated)
    if (ex.description && ex.description.length > (p.description || '').length) {
      p.description = ex.description;
    }

    // Keep amenities if sheet has none but we've enriched them before
    if ((!p.amenities || p.amenities.length === 0) && ex.amenities && ex.amenities.length > 0) {
      p.amenities = ex.amenities;
    }

    // Keep notes (partner URL) if sheet is empty but we have a corrected one
    if (!p.notes && ex.notes) {
      p.notes = ex.notes;
    }
  });

  // Stats
  const byPartner = {};
  properties.forEach(p => { byPartner[p.partner] = (byPartner[p.partner] || 0) + 1; });
  console.log('By partner:', byPartner);
  console.log(`Writing ${properties.length} properties to ${OUT_PATH}`);

  fs.writeFileSync(OUT_PATH, JSON.stringify(properties, null, 2));
  console.log('Done ✓');
}

main().catch(err => { console.error(err); process.exit(1); });
