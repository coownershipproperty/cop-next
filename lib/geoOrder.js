/**
 * lib/geoOrder.js
 *
 * Put the homes a visitor might actually buy at the front of the carousel.
 *
 * The inventory is 107 American homes and 161 European ones, and the two
 * audiences barely overlap. An American buyer will look at Paris and London
 * and the south of France; a European will almost never buy in Arizona,
 * though a cheap California share does turn a head. Showing everyone the
 * same editorial order wastes the first three cards on half the audience.
 *
 * Deliberately a pure function of (items, country): it runs on the client
 * after mount, from the cop_country cookie the middleware sets, so the
 * server-rendered HTML keeps one canonical order for crawlers and for
 * anyone whose country we cannot read.
 */

const AMERICAS = new Set(['US', 'CA', 'MX']);

// Countries whose homes an American buyer plausibly wants. France is on the
// list as a whole, not just Paris — it is the one European market Americans
// buy into in numbers.
const AMERICAN_TASTE = new Set(['France', 'England', 'United Kingdom']);

const isAmericanHome = (h) => ['USA', 'Mexico', 'Canada'].includes(h.country);

/**
 * @param items    featuredProps, in their editorial order
 * @param country  ISO-3166-1 alpha-2, or '' when unknown
 * @param opts.maxForeign  how many of the other sphere's homes to keep
 */
export function orderForCountry(items, country, { maxForeign = 3 } = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!country || list.length < 4) return list;

  const stable = (arr) => arr.slice();   // keeps the editorial order within a group

  if (AMERICAS.has(country)) {
    const home     = stable(list.filter(isAmericanHome));
    const adjacent = stable(list.filter(h => !isAmericanHome(h) && AMERICAN_TASTE.has(h.country)));
    const rest     = stable(list.filter(h => !isAmericanHome(h) && !AMERICAN_TASTE.has(h.country)));
    // Europe is not hidden from an American — it is just not the opening act.
    return [...home, ...adjacent, ...rest];
  }

  // Everywhere else reads as European for this purpose.
  const home = stable(list.filter(h => !isAmericanHome(h)));
  // A few American homes stay, cheapest first: a $68k Miami studio is the one
  // that makes a European look twice, not a $1m Aspen chalet.
  const foreign = stable(list.filter(isAmericanHome))
    .sort((a, b) => (a.price || Infinity) - (b.price || Infinity))
    .slice(0, maxForeign);
  return [...home, ...foreign];
}

/** The cop_country cookie the middleware sets. '' when unknown. */
export function countryFromCookie(cookieString) {
  const m = /(?:^|;\s*)cop_country=([A-Za-z]{2})(?:;|$)/.exec(cookieString || '');
  return m ? m[1].toUpperCase() : '';
}
