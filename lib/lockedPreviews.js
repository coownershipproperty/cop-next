// Tiny blurred previews of the photos behind the gallery gate.
//
// The gated photos themselves never reach __NEXT_DATA__ (see the property
// page's getStaticProps). What the lock box shows instead is a 2×2 strip of
// 24-pixel-wide, blurred, base64 JPEGs — a few hundred bytes each, useless as
// photos, enough to suggest "there is more". Floor plans, site plans and maps
// are skipped on filename; if fewer than three real photos remain the caller
// falls back to the blurred hero it already has.
import sharp from 'sharp';

const SKIP = /plan|floor|grundriss|plano|planta|layout|sketch|\bmap\b|site-?plan|brochure|_p-\d+/i;
const MAX = 4;

async function tiny(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const out = await sharp(buf).rotate().resize(28, 20, { fit: 'cover' }).blur(1.2).jpeg({ quality: 40 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildLockedPreviews(photos) {
  const urls = (Array.isArray(photos) ? photos : [])
    .map((p) => (typeof p === 'string' ? p : p?.url || p?.src || null))
    .filter((u) => u && /^https?:/i.test(u) && !SKIP.test(u))
    .slice(0, MAX + 2);
  const results = await Promise.all(urls.map(tiny));
  const ok = results.filter(Boolean).slice(0, MAX);
  return ok.length >= 3 ? ok : [];
}
