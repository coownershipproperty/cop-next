/**
 * GET /api/geo-match
 *
 * Detects the visitor's approximate city from Vercel edge geo headers, matches
 * it against COP's destinations, and returns a small payload the client uses
 * to render a contextual nudge in the bottom-right of the page:
 *   "In Mallorca? See homes nearby →"
 *
 * Returns:
 *   { match: false }                                            // no detected location, or city is far from any COP destination
 *   { match: true, label, slug, country, region, count, city }  // matched
 *
 * Notes:
 *   - Vercel auto-populates these headers on requests (free, no API key needed):
 *       x-vercel-ip-country         (e.g. "ES")
 *       x-vercel-ip-city            (e.g. "Palma")
 *       x-vercel-ip-country-region  (e.g. "Balearic Islands")
 *       x-vercel-ip-latitude        (string)
 *       x-vercel-ip-longitude       (string)
 *   - On local dev these are absent — endpoint will return { match: false }
 *     so the nudge stays hidden. To force a match in dev, pass ?cityOverride=palma.
 *   - We count live properties for the matched country+region so the chip can
 *     show e.g. "17 homes nearby" if you ever want to surface the count.
 */
import properties from '@/lib/properties.json';
import { matchCity, normalize } from '@/lib/geo-destinations';

// Country code → name map (extend as needed). Vercel returns ISO-3166-1 alpha-2.
const COUNTRY_CODE_TO_NAME = {
  ES: 'Spain', FR: 'France', IT: 'Italy', PT: 'Portugal', DE: 'Germany',
  AT: 'Austria', CH: 'Switzerland', NL: 'Netherlands', BE: 'Belgium',
  GB: 'England', UK: 'England', IE: 'Ireland',
  US: 'USA', CA: 'Canada', MX: 'Mexico',
  DK: 'Denmark', SE: 'Sweden', NO: 'Norway', FI: 'Finland',
  HR: 'Croatia', GR: 'Greece',
};

export default function handler(req, res) {
  // Allow short-lived caching at the edge — the answer only changes when the
  // visitor moves geographic location, which is rare per-session.
  res.setHeader('Cache-Control', 'private, max-age=300');

  // Dev override: ?cityOverride=palma&countryOverride=ES
  const cityOverride = req.query.cityOverride;
  const countryOverride = req.query.countryOverride;

  const rawCity = cityOverride
    || req.headers['x-vercel-ip-city']
    || '';
  const rawCountry = countryOverride
    || req.headers['x-vercel-ip-country']
    || '';

  if (!rawCity && !rawCountry) {
    return res.status(200).json({ match: false, reason: 'no-geo-headers' });
  }

  // Vercel URL-encodes the city header (e.g. "Palma%20de%20Mallorca"). Decode.
  let city = '';
  try { city = decodeURIComponent(String(rawCity)); } catch { city = String(rawCity); }
  const countryCode = String(rawCountry).toUpperCase();
  const countryName = COUNTRY_CODE_TO_NAME[countryCode] || '';

  const matched = matchCity(city, countryName);
  if (!matched) {
    return res.status(200).json({
      match: false,
      reason: 'no-destination-match',
      detected: { city, countryCode, countryName },
    });
  }

  // Count live properties in this destination — adds credibility to the nudge
  // ("17 homes nearby") if we ever want to show it inline.
  // For urlCountryOnly destinations (e.g. Lisbon → all Portugal), count by
  // country alone since the chip routes the visitor to a country-wide listing
  // page rather than a specific region.
  const count = matched.urlCountryOnly
    ? properties.filter(p => normalize(p.country) === normalize(matched.country)).length
    : properties.filter(p =>
        normalize(p.country) === normalize(matched.country)
        && normalize(p.region) === normalize(matched.region)
      ).length;

  // If we have zero matched properties (shouldn't really happen, but possible
  // for newer destinations) — suppress the nudge rather than showing "0 homes".
  if (count === 0) {
    return res.status(200).json({ match: false, reason: 'no-properties-in-destination' });
  }

  return res.status(200).json({
    match: true,
    label: matched.label,
    slug: matched.slug,
    country: matched.country,
    region: matched.region,
    urlCountryOnly: !!matched.urlCountryOnly,
    count,
    city,
  });
}
