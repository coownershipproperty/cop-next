// Tiny blurred previews of the photos behind the gallery gate.
//
// The gated photos never reach __NEXT_DATA__ (see the property page's
// getStaticProps). What the lock box shows instead is a 2×2 strip of
// 28-pixel, blurred, base64 JPEGs — ~700 bytes each, useless as photos,
// enough to suggest "there is more".
//
// They are precomputed into data/locked-previews.json by
// scripts/build-locked-previews.py (Python + Pillow; run after a listing
// sync that adds homes). Doing it here with sharp at build time pushed the
// page function past Vercel's 250 MB limit on 22 Sep 2026 — sharp's
// platform binaries get traced into every page that imports it.
import previews from '@/data/locked-previews.json';

export function lockedPreviewsFor(slug) {
  const arr = previews[slug];
  return Array.isArray(arr) && arr.length >= 3 ? arr.slice(0, 4) : [];
}
