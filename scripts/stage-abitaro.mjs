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
 * Asking for the key beats templating it into a command line. A placeholder in
 * a copy-paste command is a trap: it runs perfectly happily with the
 * placeholder still in it, the value looks like a key to every layer that
 * handles it, and the first thing that notices is Supabase rejecting a JWS
 * seven photos deep. So the script asks, and checks the answer before it uses
 * it. It also keeps the key out of shell history, which a command line does not.
 */
const KEY_SHAPES = [
  /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/,        // legacy JWT service_role key
  /^sb_secret_[A-Za-z0-9_-]{20,}$/,       // current-format secret key
];
const looksLikeKey = (k) => KEY_SHAPES.some((re) => re.test(k));

function readEnvKey() {
  try {
    const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const m = env.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/m);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

/** Reads a line with the terminal echo off, so the key never hits the screen. */
function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('no terminal to ask on'));
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let buf = '';
    const done = (val) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      resolve(val);
    };
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\n' || c === '\r') return done(buf.trim());
        if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (c === '\u007f') { buf = buf.slice(0, -1); continue; }
        buf += c;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function serviceKey() {
  const fromEnv = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() || readEnvKey();
  if (fromEnv && looksLikeKey(fromEnv)) return { key: fromEnv, asked: false };
  if (fromEnv) {
    console.error(`\nThe key already on this machine is not a real key (it starts "${fromEnv.slice(0, 14)}").`);
    console.error('Ignoring it and asking instead.\n');
  }
  console.log('Copy the service_role key from:');
  console.log('  https://supabase.com/dashboard/project/iotzzoxyckpyatzqcjbo/settings/api-keys\n');
  for (let tries = 0; tries < 3; tries++) {
    /* eslint-disable no-await-in-loop */
    const k = await askHidden('Paste it here (it stays hidden), then press Enter: ');
    /* eslint-enable no-await-in-loop */
    if (looksLikeKey(k)) return { key: k, asked: true };
    console.error(k ? '  That does not look like a Supabase key — it should start eyJ or sb_secret_.'
                    : '  Nothing pasted.');
  }
  console.error('\nGiving up rather than guessing. Nothing was changed.');
  process.exit(1);
}

const KEY = DRY ? '' : (await serviceKey()).key;
const db  = KEY ? createClient(SUPA, KEY, { auth: { persistSession: false } }) : null;

// Prove the key works before downloading a single photo, so a bad key costs one
// request instead of failing partway through the first listing.
if (db) {
  const { error } = await db.from('properties').select('slug').limit(1);
  if (error) { console.error(`\nSupabase rejected that key: ${error.message}\nNothing was changed.`); process.exit(1); }
  const env = new URL('../.env.local', import.meta.url);
  const cur = fs.readFileSync(env, 'utf8');
  if (/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*$/m.test(cur)) {
    fs.writeFileSync(env, cur.replace(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*$/m, `SUPABASE_SERVICE_ROLE_KEY=${KEY}`));
    console.log('Key works. Saved it to .env.local (gitignored) so the other scripts find it too.\n');
  } else {
    console.log('Key works.\n');
  }
}

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

  // A listing carries two photo sets, and filling only one makes it behave
  // like a discreet home. `images` is what a visitor sees before giving an
  // email — normal listings show three; discreet ones show one. `photos` is
  // the gallery behind the unlock. The first run filled photos and left
  // images empty, so the five staged homes showed nothing at all publicly,
  // which is worse than discreet: a card with no picture to click.
  const VISIBLE_BEFORE_UNLOCK = 3;
  const visible = photos.slice(0, VISIBLE_BEFORE_UNLOCK);
  const gallery = photos.slice(VISIBLE_BEFORE_UNLOCK);

  const { error: insErr } = await db.from('properties').insert({
    slug: row.slug, title: row.title, status: 'hidden',
    city: row.city, region: row.region, country: row.country,
    beds: p.bedrooms, baths: p.bathrooms, size: sqftToM2(total),
    price, currency: 'USD', share_denominator: p.number_of_co_owners || 8,
    description: row.description, amenities: row.amenities,
    property_type: row.property_type, property_style: row.property_style,
    img: hero, images: visible, photos: gallery, total_images: photos.length,
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
