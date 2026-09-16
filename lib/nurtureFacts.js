/**
 * lib/nurtureFacts.js
 *
 * Turns a slug into the handful of numbers a buyer actually wants, drawn
 * only from `properties` and `property_facts`. Nothing is estimated here —
 * if a figure is not in the fact table at `verified` confidence, the field
 * comes back empty and the email simply doesn't show that row. That is the
 * whole point: COP's advantage over going direct is that we will tell you
 * the running cost, so the one thing we cannot afford is a running cost we
 * made up.
 *
 * Coverage as at 16 Sep 2026: monthly_cost is verified on all 124 live MYNE
 * homes and all 9 &Hamlet homes; Pacaso, Vivla, Abitaro and Paris have none,
 * and their emails say so in words instead of showing a number.
 */
import {
  denominatorOf, shareLabel, nightsShort, nightsLine, bookingLine,
  costsCoversLine, resaleLine, money, panelShape, resaleStat,
} from '@/lib/partnerTerms';
import { settingOf, settingPhrase, placePhrase } from '@/lib/placeSetting';

const BASE = 'https://co-ownership-property.com';

/** Live-and-sellable: hidden and sold rows never enter an email. */
export const SELLABLE = ['Live', 'for_sale'];

const PROP_COLS = 'slug, title, city, region, country, price, currency, beds, baths, size, partner, share_denominator, img, email_img, is_discreet, status, date_added';
const FACT_COLS = 'slug, share_price, currency, monthly_cost, annual_cost, usage_nights, usage_model, shares_remaining, availability_checked_at, partner_availability, rental_allowed, confidence, last_verified_at';

/** "Morzine, Portes du Soleil, France — 2-Bed Apartment…" → the two halves. */
function splitTitle(title, city, region) {
  const i = String(title || '').indexOf(' — ');
  const place = i > 0 ? title.slice(0, i) : [city, region].filter(Boolean).join(', ');
  const name  = i > 0 ? title.slice(i + 3) : (title || '');
  return { place, name };
}

/** Shares left is only worth printing when it is recent, real and scarce. */
function sharesLeftLabel(f, denom) {
  const n = f && f.shares_remaining;
  if (n == null || !Number.isFinite(Number(n))) return '';
  const left = Number(n);
  if (left <= 0) return '';                 // sold out — the row shouldn't be in the email at all
  if (left >= denom) return '';             // nothing has sold yet; "8 of 8 left" sells nothing
  const checked = f.availability_checked_at ? new Date(f.availability_checked_at) : null;
  if (!checked || Date.now() - checked.getTime() > 45 * 86400000) return '';  // stale
  return left === 1 ? 'One share left' : `${left} of ${denom} shares left`;
}

/**
 * The view model every nurture email and (later) the property page reads.
 * Everything is a finished string — no formatting decisions left to a
 * template.
 */
export function toFactView(p, f) {
  const denom  = denominatorOf(p);
  const { place, name } = splitTitle(p.title, p.city, p.region);
  const price  = p.price ? Number(p.price) : null;
  const cur    = p.currency || (f && f.currency) || 'EUR';
  const verified = f && f.confidence === 'verified';

  return {
    slug:      p.slug,
    url:       `${BASE}/property/${p.slug}/`,
    title:     p.title || p.slug,
    place,
    name,
    city:      p.city || '',
    region:    p.region || '',
    country:   p.country || '',
    setting:   settingOf(p),
    partner:   p.partner || '',
    beds:      p.beds || 0,
    size:      p.size ? `${p.size} m²` : '',
    imageUrl:  p.email_img || p.img || '',
    denom,
    shareLabel: shareLabel(p),
    price,
    priceLabel: money(price, cur),
    currency:  cur,

    // Running costs — verified rows only, and never itemised (the monthly
    // service fee lives inside this total and is never shown separately).
    monthlyCost:      verified && f.monthly_cost ? Number(f.monthly_cost) : null,
    monthlyCostLabel: verified && f.monthly_cost ? `${money(f.monthly_cost, cur)} a month` : '',
    annualCostLabel:  verified && f.annual_cost ? `${money(f.annual_cost, cur)} a year` : '',
    costsCovers:      costsCoversLine(p),

    nightsShort: nightsShort(p, f && f.usage_nights),
    nightsLine:  nightsLine(p),
    booking:     bookingLine(p),
    resale:      resaleLine(p),

    sharesLeft:  sharesLeftLabel(f, denom),

    // Which panel this home's email gets, and the figures that panel needs.
    // A home with no verified cost is not a thinner version of a MYNE home —
    // it is a different email, leading on what its operator is best at.
    panelShape:  verified && f.monthly_cost ? panelShape(p) : (panelShape(p) === 'costs' ? 'entry' : panelShape(p)),
    resaleStat:  resaleStat(p),
    // True where we have no verified running cost: the panel says so and
    // offers to fetch it, which is the thing that earns a reply.
    costsOnAsk:  !(verified && f.monthly_cost),

    verifiedOn:  verified && f.last_verified_at
      ? new Date(f.last_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '',
  };
}

/** One round trip for the properties, one for the facts. */
export async function factViewsForSlugs(db, slugs) {
  const wanted = [...new Set((slugs || []).filter(Boolean))];
  if (!wanted.length) return [];
  const { data: props } = await db.from('properties')
    .select(PROP_COLS).in('slug', wanted).in('status', SELLABLE);
  if (!props || !props.length) return [];
  const { data: facts } = await db.from('property_facts').select(FACT_COLS).in('slug', props.map(p => p.slug));
  const bySlug = new Map((facts || []).map(f => [f.slug, f]));
  // Sold-out per the partner's own portal read — never put one in an email.
  return props
    .filter(p => (bySlug.get(p.slug) || {}).partner_availability !== 'sold_out')
    .map(p => toFactView(p, bySlug.get(p.slug)))
    // keep the caller's order
    .sort((a, b) => wanted.indexOf(a.slug) - wanted.indexOf(b.slug));
}

/**
 * Two homes that genuinely resemble what they unlocked.
 *
 * "Similar" used to mean same country and a close price, which is how a man
 * who asked to see a ski apartment in Morzine was offered a beach flat in
 * Antibes: same country, same money, nothing else in common. So the match
 * now runs in tiers, and the email says out loud which tier it found —
 * there is no point pretending a home three countries away is "just like"
 * the one they looked at.
 *
 *   region   same region            "two more in the Portes du Soleil"
 *   setting  same kind of place     "two more in the mountains, in France"
 *   country  same country only      "two more in France"
 *
 * Homes across the Atlantic are never offered to each other: a European
 * looking at Lake Garda is not a candidate for Los Cabos, and the reverse
 * is even more true.
 */
const AMERICAS = new Set(['USA', 'Mexico', 'Canada']);
const sphereOf = (country) => (AMERICAS.has(country) ? 'americas' : 'europe');

export async function similarFactViews(db, seed, { limit = 2, exclude = [] } = {}) {
  if (!seed || !seed.country) return { homes: [], tier: null, tierLabel: '', similarPrice: false };
  const skip = new Set([seed.slug, ...exclude]);
  const sphere = sphereOf(seed.country);

  const { data: props } = await db.from('properties')
    .select(PROP_COLS)
    .in('status', SELLABLE)
    .neq('is_discreet', true)
    .limit(600);
  if (!props || !props.length) return { homes: [], tier: null, tierLabel: '', similarPrice: false };

  const target = seed.price || null;
  const pool = props.filter(p =>
    !skip.has(p.slug) && p.price && sphereOf(p.country) === sphere);

  const gapOf = (p) => (target ? Math.abs(Number(p.price) - target) / target : 0);

  // The price band widens as the geography narrows. People fall for a place
  // before they fall for a number, so a home in the same valley earns more
  // rope than one three countries away; but nothing ever gets to be twice
  // the money and still call itself similar.
  const tiers = [
    { key: 'region',  band: 0.85, test: p => seed.region && p.region === seed.region && p.country === seed.country },
    { key: 'setting', band: 0.60, test: p => seed.setting && settingOf(p) === seed.setting },
    { key: 'country', band: 0.45, test: p => p.country === seed.country },
  ];

  const picked = [];
  let tier = null;
  for (const t of tiers) {
    if (picked.length >= limit) break;
    const taken = new Set(picked.map(p => p.slug));
    const candidates = pool
      .filter(p => !taken.has(p.slug) && (!target || gapOf(p) <= t.band) && t.test(p))
      .sort((a, b) => gapOf(a) - gapOf(b));
    for (const c of candidates) {
      if (picked.length >= limit) break;
      picked.push(c);
      if (!tier) tier = t.key;
    }
  }
  if (!picked.length) return { homes: [], tier: null, tierLabel: '', similarPrice: false };

  const { data: facts } = await db.from('property_facts').select(FACT_COLS).in('slug', picked.map(p => p.slug));
  const bySlug = new Map((facts || []).map(f => [f.slug, f]));
  const homes = picked
    .filter(p => (bySlug.get(p.slug) || {}).partner_availability !== 'sold_out')
    .map(p => toFactView(p, bySlug.get(p.slug)));
  if (!homes.length) return { homes: [], tier: null, tierLabel: '', similarPrice: false };

  // How the email may describe the shortlist — worked out from the homes
  // that actually came back, not from the tier that happened to fire first.
  // A mixed shortlist gets the truthful weaker claim rather than the
  // flattering false one: two homes are only "in the Portes du Soleil" if
  // both of them are.
  const countryWord = (c) => (c === 'USA' ? 'the USA' : c);
  const allRegion  = seed.region && homes.every(h => h.region === seed.region && h.country === seed.country);
  const allSetting = seed.setting && homes.every(h => h.setting === seed.setting);
  const allCountry = homes.every(h => h.country === seed.country);
  const tierLabel =
    allRegion  ? placePhrase(seed.region)
  : allSetting ? (allCountry
      ? `${settingPhrase(seed.setting)}, in ${countryWord(seed.country)}`
      : settingPhrase(seed.setting))
  : allCountry ? placePhrase(countryWord(seed.country))
  : '';

  // "at much the same money" has to be true to be worth writing. A home 70%
  // dearer than the one they looked at is a fine suggestion and a bad claim.
  const similarPrice = !!target && homes.every(h => h.price && Math.abs(h.price - target) / target <= 0.3);

  return { homes, tier, tierLabel, similarPrice };
}
