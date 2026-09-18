/**
 * Stage 5 Abitaro residences as hidden rows for David's review.
 *
 * Structure (beds, baths, size, address, HOA, tax, images) comes from Abitaro's
 * own catalogue API so nothing is transcribed by hand. Human copy comes from
 * listings.json. Photos are re-hosted in COP's Storage exactly like every other
 * listing — same bucket, same optimise pass, same path shape — rather than
 * hotlinked to the partner, so the gallery cannot break when they reorganise.
 */
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';

const API  = 'https://phplaravel-1627241-6429789.cloudwaysapps.com/api/public/properties';
const HOST = 'https://phplaravel-1627241-6429789.cloudwaysapps.com';
const SUPA = 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const DRY = process.argv.includes('--dry');

/**
 * The key comes from the environment first so it never has to be written to a
 * file. .env.local is only a fallback, and it is blank on this machine:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/stage-abitaro.mjs
 *
 * Get it from supabase.com/dashboard/project/iotzzoxyckpyatzqcjbo/settings/api-keys
 * -> service_role. --dry needs no key and touches nothing.
 */
function serviceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  try {
    const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const m = env.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/m);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

const KEY = DRY ? '' : serviceKey();

/**
 * --save-key writes the key into .env.local, which is gitignored and already
 * has the blank line waiting for it. Opt-in, never automatic: persisting a
 * credential is the owner's call, not the script's. Worth doing once, because
 * every other script here (translate-content, translate-titles-bulk, ...) wants
 * the same key and will then find it without being handed it again.
 */
if (KEY && process.argv.includes('--save-key')) {
  const f = new URL('../.env.local', import.meta.url);
  const env = fs.readFileSync(f, 'utf8');
  if (/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*$/m.test(env)) {
    fs.writeFileSync(f, env.replace(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*$/m, `SUPABASE_SERVICE_ROLE_KEY=${KEY}`));
    console.log('Saved the key to .env.local (gitignored) - other scripts will find it now.');
  } else {
    console.log('.env.local already has a key; left it alone.');
  }
}
if (!DRY && !KEY) {
  console.error('No service-role key. Run:\n  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/stage-abitaro.mjs');
  process.exit(1);
}
const db = KEY ? createClient(SUPA, KEY, { auth: { persistSession: false } }) : null;
const rows = JSON.parse(fs.readFileSync(new URL('./abitaro-listings.json', import.meta.url),'utf8'));

// Same rules as lib/optimise-photo.js: <500KB, max 2000px, webp fallback.
async function optimise(input) {
  const m = await sharp(input, { limitInputPixels: 100000000 }).metadata();
  if (!m.width || !m.height) throw new Error('bad image');
  if (input.length < 500000 && Math.max(m.width, m.height) <= 2000 &&
      ['jpeg','png','webp'].includes(m.format) && (!m.orientation || m.orientation === 1) &&
      (!m.pages || m.pages === 1)) {
    return { buffer: input, ext: m.format === 'jpeg' ? 'jpg' : m.format, contentType: `image/${m.format}` };
  }
  for (let edge = 2000; edge >= 400; edge = Math.floor(edge * 0.8)) {
    for (const q of [88,78,68,58]) {
      const { data } = await sharp(input, { limitInputPixels: 100000000 }).rotate()
        .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: q }).toBuffer({ resolveWithObject: true });
      if (data.length < 500000) return { buffer: data, ext: 'webp', contentType: 'image/webp' };
    }
  }
  throw new Error('could not compress under 500KB');
}

const sqftToM2 = (sqft) => Math.round(Number(sqft || 0) * 0.09290304);

for (const row of rows) {
  const res = await fetch(`${API}/${row.abitaro_slug}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) { console.error(`${row.abitaro_slug}: API ${res.status}`); continue; }
  const p = (await res.json()).data;

  if (db) {
    const { data: clash } = await db.from('properties').select('slug').eq('slug', row.slug).maybeSingle();
    if (clash) { console.error(`SKIP ${row.slug}: slug already exists`); continue; }
  }

  const priced = (p.shares || []).filter(s => s.status === 'available' && s.share_price_usd);
  // Round UP to the dollar. Abitaro prices some shares to the cent and a
  // rounded-down figure would quote a buyer less than the share actually costs.
  const price  = Math.ceil(Math.min(...priced.map(s => Number(s.share_price_usd))));
  const total  = Number(p.total_area || p.interior_area || 0);

  const imgs = (p.gallery_images || []).slice().sort((a,b) => (a.order||0)-(b.order||0));
  console.log(`\n${row.slug}\n  from $${price.toLocaleString()} · ${priced.length}/8 shares · ${imgs.length} photos · ${sqftToM2(total)} m²`);
  if (DRY) continue;

  const photos = [];
  let hero = null;
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i].file_url.startsWith('http') ? imgs[i].file_url : HOST + imgs[i].file_url;
    const r = await fetch(src);
    if (!r.ok) { console.error(`  photo ${i} ${r.status}`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    let opt; try { opt = await optimise(buf); } catch (e) { console.error(`  photo ${i}: ${e.message}`); continue; }
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${opt.ext}`;
    const path = `${row.slug}/${name}`;
    const { error } = await db.storage.from('property-photos')
      .upload(path, opt.buffer, { contentType: opt.contentType, cacheControl: '31536000', upsert: false });
    if (error) { console.error(`  photo ${i}: ${error.message}`); continue; }
    photos.push(db.storage.from('property-photos').getPublicUrl(path).data.publicUrl);
    if (i === 0) {
      const hp = `${row.slug}/hero.${opt.ext}`;
      await db.storage.from('property-images')
        .upload(hp, opt.buffer, { contentType: opt.contentType, cacheControl: '31536000', upsert: true });
      hero = db.storage.from('property-images').getPublicUrl(hp).data.publicUrl;
    }
  }
  console.log(`  uploaded ${photos.length} photos`);

  const { error: insErr } = await db.from('properties').insert({
    slug: row.slug, title: row.title, status: 'hidden',
    city: row.city, region: row.region, country: row.country,
    beds: p.bedrooms, baths: p.bathrooms, size: sqftToM2(total),
    price, currency: 'USD', share_denominator: p.number_of_co_owners || 8,
    description: row.description, amenities: row.amenities,
    property_type: row.property_type, property_style: row.property_style,
    img: hero, photos, total_images: photos.length,
    lat: row.lat, lng: row.lng,
    rental: p.rental_permitted === true, is_discreet: false,
    partner: 'abitaro', partner_ref: `abitaro:${row.abitaro_slug}`,
    partner_url: 'https://ownabitaro.com',
    date_added: new Date().toISOString().slice(0,10),
    last_verified_at: new Date().toISOString(), verify_state: 'ok',
    verify_note: `staged from Abitaro catalogue; HOA $${p.hoa_usd_monthly}/mo, tax $${p.annual_property_tax_usd}/yr whole-home; ADR $${p.adr_usd} at ${p.occupancy_rate_pct}%`,
  });
  console.log(insErr ? `  INSERT FAILED: ${insErr.message}` : `  inserted as hidden`);
}
