/**
 * lib/discreetMix.js
 *
 * Keep Discreet Sale homes from monopolising a grid.
 *
 * A discreet card opens the brochure-request popup instead of linking to a
 * listing page — by design, those homes have no page. On 15 Sep 2026 the 25
 * discreet homes were also the 25 newest, so the default "newest" sort filled
 * every slot of /our-homes/ page one with them and the catalogue page went out
 * to Google with zero links to any property. Region pages showed the same
 * effect at 12 cards.
 *
 * capDiscreet keeps the order the visitor asked for but allows at most
 * `maxPerPage` discreet cards per page-sized window, moving the rest down.
 * Nothing is dropped: every home still appears, and a visitor who filters for
 * Discreet Sale only should skip this entirely.
 */
export function capDiscreet(list, pageSize, maxPerPage, isDiscreet = p => !!p.discreet) {
  if (!Array.isArray(list) || list.length === 0) return list || [];
  const out = [];
  const held = [];
  let inPage = 0;
  for (const p of list) {
    if (out.length && out.length % pageSize === 0) inPage = 0;   // a new window opens
    if (isDiscreet(p) && inPage >= maxPerPage) { held.push(p); continue; }
    if (isDiscreet(p)) inPage++;
    out.push(p);
    while (held.length && out.length % pageSize !== 0 && inPage < maxPerPage) {
      const h = held.shift();
      inPage++;
      out.push(h);
    }
  }
  return out.concat(held);
}

export default capDiscreet;
