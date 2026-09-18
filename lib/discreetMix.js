/**
 * lib/discreetMix.js
 *
 * Keep Discreet Sale homes from monopolising a grid.
 *
 * A discreet card opens the brochure-request popup instead of linking to a
 * listing page — by design, those homes have no page. On 15 Sep 2026 the 25
 * discreet homes were also the 25 newest, so the default "newest" sort filled
 * every slot of /our-homes/ page one with them and the catalogue page went out
 * to Google with zero links to any property. Region pages did the same at 12.
 *
 * Two modes, because the right answer depends on how the inventory arrived:
 *
 *   'mix'  — the original fix. At most `maxPerPage` discreet per window, in
 *            whatever order the visitor's sort produced. Correct when discreet
 *            homes trickle in: a genuinely new one is genuinely newest and
 *            belongs near the top.
 *
 *   'tail' — each window leads with linkable homes and the discreet fill the
 *            tail. Correct after a bulk release: all 25 of these share
 *            date_added = 2026-09-14, so under 'mix' they still took the first
 *            six slots and the catalogue's top row was three discreet cards
 *            (David, 17 Sep 2026). They are still on page one, which matters
 *            because the unlock block is COP's best single source of leads.
 *
 * Mode is a setting, not a rule baked into the code, because David was explicit
 * that demoting discreet is an exception for this batch rather than how the
 * grid should always behave. See crm_settings key `discreet_grid`.
 *
 * Neither mode drops a home or reorders within either group — the visitor's
 * chosen sort is nested inside each. A visitor who filtered for Discreet Sale
 * only should skip this entirely.
 */

/** The grid's window size and default cap, shared with the admin preview. */
export const GRID_PAGE_SIZE = 24;
export const MAX_DISCREET_PER_PAGE = 6;
export const DEFAULT_DISCREET_MODE = 'mix';

export function capDiscreet(list, pageSize, maxPerPage, opts = {}) {
  const isDiscreet = opts.isDiscreet || ((p) => !!p.discreet);
  const mode = ['tail', 'lead'].includes(opts.mode) ? opts.mode : 'mix';

  if (!Array.isArray(list) || list.length === 0) return list || [];
  if (!pageSize || pageSize < 1) return list;

  // Guard degenerate settings rather than emitting a broken grid: a cap at or
  // above the window size means "no cap", and zero would strand every discreet
  // home at the very bottom of 491 results.
  const cap = Math.max(0, Math.min(maxPerPage, pageSize));
  if (cap >= pageSize || cap <= 0) return list;

  // 'lead': the first `n` cards are the newest non-discreet homes, then the
  // natural newest-first order resumes, discreet included. The lightest of the
  // three: it fixes the top of the page without demoting discreet stock down
  // the catalogue. 'tail' reserves 18 of every 24 slots for linkable homes,
  // which at three cards across reads as six ROWS of them — far more demotion
  // than "the top six shouldn't all be discreet" asks for.
  if (mode === 'lead') {
    const leadOut = [];
    const rest = [];
    for (const p of list) {
      if (leadOut.length < cap && !isDiscreet(p)) leadOut.push(p);
      else rest.push(p);
    }
    // Nothing to lead with: leave the order untouched rather than half-apply it.
    if (leadOut.length === 0) return list;
    return [...leadOut, ...rest];
  }

  if (mode === 'tail') {
    const real = [];
    const discreet = [];
    for (const p of list) (isDiscreet(p) ? discreet : real).push(p);
    if (!discreet.length || !real.length) return list;

    const realPerWindow = pageSize - cap;
    const out = [];
    let ri = 0;
    let di = 0;
    while (ri < real.length || di < discreet.length) {
      const before = out.length;
      while (ri < real.length && out.length - before < realPerWindow) out.push(real[ri++]);
      // A window short on real homes (the tail of the catalogue) hands its
      // leftover slots to the discreet queue rather than leaving a ragged grid.
      const slots = cap + Math.max(0, realPerWindow - (out.length - before));
      let placed = 0;
      while (di < discreet.length && placed < slots) { out.push(discreet[di++]); placed++; }
    }
    return out;
  }

  // 'mix': keep the requested order, hold back only the overflow.
  const out = [];
  const held = [];
  let inPage = 0;
  for (const p of list) {
    if (out.length && out.length % pageSize === 0) inPage = 0;   // a new window opens
    if (isDiscreet(p) && inPage >= cap) { held.push(p); continue; }
    if (isDiscreet(p)) inPage++;
    out.push(p);
    while (held.length && out.length % pageSize !== 0 && inPage < cap) {
      out.push(held.shift());
      inPage++;
    }
  }
  return out.concat(held);
}

export default capDiscreet;
