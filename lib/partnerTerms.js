/**
 * lib/partnerTerms.js
 *
 * One place for the way each partner's usage, booking, running costs and
 * resale are described to a buyer. Every sentence here is either verbatim
 * from the drafting policy David has been enforcing since July, or lifted
 * from a `verified` row in partner_facts / the partner-audit docs. Nothing
 * here is inferred, and nothing here is a guess dressed up as a fact.
 *
 * Why a module: the same words now have to appear in the gallery-nurture
 * emails, on the property page (the monthly-cost / shares / nights block)
 * and in whatever comes next. When a partner changes their terms, this file
 * is the single edit.
 *
 * Three standing rules are encoded rather than left to whoever writes copy:
 *
 *   1. NEVER print a monthly service fee. MYNE's EUR99 and Pacaso's USD99 are
 *      inside `monthly_cost` totals but are never itemised to a buyer.
 *   2. NEVER put a night cap on Pacaso. Their model has no total-nights cap;
 *      "44 nights" is MYNE's number and writing it on a Pacaso home is wrong.
 *   3. MYNE's 44 is a FLOOR, and the word "minimum" stays in. It is MYNE's
 *      own framing and it is the honest one.
 *
 * `nightsLine` is the long sentence for a letter. `nightsShort` is the
 * right-hand value in a hairline fact row — it has to survive being read on
 * its own, so it never says "44" without saying "minimum".
 */

export const PARTNER_TERMS = {
  myne: {
    // Verbatim, per the drafting policy. The floor framing is MYNE's own.
    nightsLine: `At least 44 nights a year — six and a half weeks — with more available whenever the calendar is open.`,
    nightsShort: `44 nights a year, minimum`,
    booking: `Booked in the owners’ app from two days to two years ahead. Christmas, New Year and Easter rotate between the owners, a different owner first each year.`,
    // What the monthly figure is, without naming the service fee inside it.
    costsCovers: `a fixed monthly advance against the home’s own budget — management, insurance, upkeep and the reserve. Electricity, heating, the clean after each stay and laundry are billed by what you actually use, on top.`,
    resale: `After the first twelve months you can sell whenever you like. Your co-owners get the first option at the same price; if they pass, it goes on the open market.`,
    shareIsAllIn: true,
    allIn: `purchase costs, the upgrade and the furnishing are already inside the share price`,
  },
  pacaso: {
    // No night cap, ever. Verbatim from the policy.
    nightsLine: `Booking runs on the app from 8 days up to 24 months ahead, and short-notice stays — anything 2 to 30 days out — sit on top of that, with no set cap on total nights.`,
    nightsShort: `No set cap on total nights`,
    booking: `Advance stays are booked 8 days to 24 months ahead; short-notice stays run 2 to 30 days ahead, and 2 to 60 days for the homes in Europe.`,
    costsCovers: `your eighth of the home’s real annual budget, billed monthly and trued up at the year end — the figures come from the team that runs the house.`,
    resale: `Shares list on the operator’s own resale marketplace. They have averaged 99 days on the market, and 73% of the 400-plus resales so far sold above their original price.`,
    shareIsAllIn: true,
    allIn: `the share price covers the home, the furnishing and the set-up`,
  },
  vivla: {
    nightsLine: `Six weeks a year, every year.`,
    nightsShort: `Six weeks a year, every year`,
    booking: `Bookings open in June of the preceding year and run up to two years ahead; peak dates rotate through the selection rounds.`,
    costsCovers: `your eighth of the home’s real annual budget, billed monthly — the exact breakdown comes from the team that runs the house.`,
    resale: `Resales in 2025 closed in under four weeks on average, at around 11% above the original price.`,
    shareIsAllIn: true,
    allIn: `the share price covers the home, the furnishing and the set-up`,
  },
  andhamlet: {
    // partner_facts, both rows verified: the 45-day floor and the
    // short-notice exception that sits outside it.
    nightsLine: `A guaranteed minimum of 45 days a year — and anything booked between 2 and 30 days ahead doesn’t count against that floor, so owners in practice use more.`,
    nightsShort: `45 days a year, minimum`,
    booking: `Minimum two nights a stay, usually up to two weeks at a time. Cancel 30 days or more before arrival and the days go back to you.`,
    costsCovers: `a fixed monthly contribution against the home’s published budget. The clean after each stay and what you use in electricity and water are billed on top.`,
    resale: `Your co-owners get the first option at the same price; if they pass, it goes on the open market.`,
    shareIsAllIn: true,
    allIn: `the share price covers the home, the furnishing and the set-up`,
  },
  abitaro: {
    nightsLine: `Three fixed fifteen-night seasonal blocks a year — around 45 nights — and co-owners can exchange days between themselves.`,
    nightsShort: `~45 nights a year`,
    booking: `Three seasonal blocks per share, exchangeable between co-owners.`,
    costsCovers: `your share of the home’s annual budget — the exact breakdown comes from the team that runs the house.`,
    resale: `Your co-owners get the first option at the same price; if they pass, it goes on the open market.`,
    shareIsAllIn: false,
    allIn: '',
  },
  parispropertygroup: {
    // Paris fractionals are 1/12 and 1/13, never 1/8 — the copy has to be
    // slot-driven. Nights are not on file and are never guessed.
    nightsLine: '',
    nightsShort: '',
    booking: '',
    costsCovers: `your share of the building’s annual budget — the exact breakdown comes from the team that runs the apartment.`,
    resale: `Your co-owners get the first option at the same price; if they pass, it goes on the open market.`,
    shareIsAllIn: false,
    allIn: '',
  },
};

export function normalizePartner(partner) {
  return String(partner || '').toLowerCase().trim();
}

export function termsFor(partner) {
  return PARTNER_TERMS[normalizePartner(partner)] || null;
}

/** share_denominator, defaulting to 8 — Paris rows are 12 or 13. */
export function denominatorOf(p) {
  const d = Number(p && (p.shareDenominator ?? p.share_denominator));
  return Number.isFinite(d) && d > 1 ? d : 8;
}

export function shareLabel(p) {
  return `1/${denominatorOf(p)}`;
}

/**
 * The long usage sentence for a letter. Falls back to the share's own slice
 * of the year when a partner has no published figure (Paris) — which is a
 * true statement about the share, not an invented night count.
 */
export function nightsLine(p) {
  const t = termsFor(p && p.partner);
  if (t && t.nightsLine && denominatorOf(p) === 8) return t.nightsLine;
  if (t && t.nightsLine && !t.nightsShort) return t.nightsLine;
  const d = denominatorOf(p);
  return `Your 1/${d} share of the year, taken as you like it across the seasons.`;
}

/** The short value for a fact row. Never "44" on its own. */
export function nightsShort(p) {
  const t = termsFor(p && p.partner);
  if (t && t.nightsShort && denominatorOf(p) === 8) return t.nightsShort;
  const d = denominatorOf(p);
  return `Your 1/${d} share of the year`;
}

export function bookingLine(p) {
  const t = termsFor(p && p.partner);
  return (t && t.booking) || '';
}

export function costsCoversLine(p) {
  const t = termsFor(p && p.partner);
  return (t && t.costsCovers) || `your share of the home’s annual budget — the exact breakdown comes from the team that runs the house.`;
}

export function resaleLine(p) {
  const t = termsFor(p && p.partner);
  return (t && t.resale) || `Your co-owners get the first option at the same price; if they pass, it goes on the open market.`;
}

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

export function money(amount, currency) {
  if (amount == null || amount === '') return '';
  const sym = CURRENCY_SYM[currency] || '€';
  return `${sym}${Math.round(Number(amount)).toLocaleString('en-GB')}`;
}
