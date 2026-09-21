/**
 * lib/inventory.js — the one place a page may get a count of homes from.
 *
 * Why: on 21 Sep 2026 the site said 293 homes on the homepage, "24 of 487"
 * on /our-homes, 268 on /how-to-buy, "82 in Spain" (96), and "190 Pacaso
 * homes" (118) — every one of them a number somebody typed into copy on a
 * different day. Counts are now computed here at build time and written into
 * copy through {{tokens}}, so a page can only ever show today's inventory.
 *
 * Definitions (use these words on the site, and no others):
 *   available  = status 'Live'            — for sale today
 *   sold       = status 'sold'            — previously listed, may return
 *   hidden rows never count anywhere.
 *
 * Tokens (case-insensitive keys; countries by name, partners by code):
 *   {{homes}}                 available homes, all countries
 *   {{sold}}                  previously listed homes
 *   {{homes:spain}}           available in a country
 *   {{sold:spain}}
 *   {{from:spain}}            lowest available share price, "€120,000"
 *   {{ops:spain}}             number of operators with an available home, as a word
 *   {{countries}}             number of countries with an available home, as a word
 *   {{homes:partner:pacaso}}  a partner's available homes
 *   {{sold:partner:pacaso}}
 *   {{countries:partner:pacaso}}  as a word
 *   {{covered:spain,france,italy,usa}}  available homes across a list of countries
 *   {{asof}}                  "21 September 2026" (build date)
 *
 * Server-only: import from getStaticProps / getServerSideProps.
 */
import { supabase } from '@/lib/supabase';

let cache = null;
let cacheAt = 0;
const TTL_MS = 5 * 60 * 1000; // within one build, one query

const WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
  es: ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'],
  de: ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'],
};
export const word = (n, locale = 'en') => { const w = WORDS[locale] || WORDS.en; return n >= 0 && n < w.length ? w[n] : String(n); };

const norm = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Countries appear under more than one spelling in `properties.country`.
const COUNTRY_ALIAS = {
  'united-states': 'usa', 'united-states-of-america': 'usa', 'us': 'usa',
  'united-kingdom': 'england', 'uk': 'england', 'great-britain': 'england',
  'espana': 'spain', 'italia': 'italy', 'deutschland': 'germany', 'osterreich': 'austria',
};
const countryKey = (c) => { const k = norm(c); return COUNTRY_ALIAS[k] || k; };

function money(n, currency, locale = 'en') {
  const cur = (currency || 'EUR').toUpperCase();
  const sym = cur === 'USD' ? '$' : cur === 'GBP' ? '£' : '€';
  const v = Math.round(Number(n));
  if (locale === 'en') return `${sym}${v.toLocaleString('en-GB')}`;
  if (locale === 'fr') return `${v.toLocaleString('fr-FR').replace(/[\u202f\u00a0 ]/g, '\u00a0')}\u00a0${sym}`;
  return `${v.toLocaleString('de-DE')}\u00a0${sym}`; // de, es: 120.000 €
}

export async function getInventory() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const { data, error } = await supabase
    .from('properties')
    .select('country, partner, price, currency, status')
    .in('status', ['Live', 'for_sale', 'sold']);
  if (error) throw error;

  const inv = { available: 0, sold: 0, countries: {}, partners: {}, asOf: new Date() };
  for (const row of data || []) {
    const live = String(row.status).toLowerCase() !== 'sold';
    const c = countryKey(row.country);
    const p = norm(row.partner);
    const ce = inv.countries[c] ||= { available: 0, sold: 0, ops: new Set(), min: null, minCurrency: null };
    const pe = inv.partners[p] ||= { available: 0, sold: 0, countries: new Set() };
    if (live) {
      inv.available += 1; ce.available += 1; pe.available += 1;
      if (p) ce.ops.add(p);
      if (c) pe.countries.add(c);
      const price = Number(row.price);
      if (price > 0 && (ce.min === null || price < ce.min)) { ce.min = price; ce.minCurrency = row.currency; }
    } else {
      inv.sold += 1; ce.sold += 1; pe.sold += 1;
    }
  }
  for (const ce of Object.values(inv.countries)) ce.ops = ce.ops.size;
  for (const pe of Object.values(inv.partners)) pe.countries = pe.countries.size;
  inv.countryCount = Object.values(inv.countries).filter(c => c.available > 0).length;
  cache = inv; cacheAt = Date.now();
  return inv;
}

/** Replace every {{token}} in a string. Unknown tokens are left as-is so they
 *  show up in review rather than vanish. */
export function fillInventoryTokens(text, inv, { locale = 'en' } = {}) {
  if (!text || typeof text !== 'string' || !text.includes('{{')) return text;
  const asOf = inv.asOf instanceof Date ? inv.asOf : new Date(inv.asOf);
  const dateStr = asOf.toLocaleDateString(locale === 'en' ? 'en-GB' : locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return text.replace(/\{\{\s*([a-z]+)(?::([a-z0-9,-]+))?(?::([a-z0-9,-]+))?\s*\}\}/gi, (m, kind, a, b) => {
    kind = kind.toLowerCase(); a = a ? a.toLowerCase() : ''; b = b ? b.toLowerCase() : '';
    const country = (k) => inv.countries[countryKey(k)] || { available: 0, sold: 0, ops: 0, min: null };
    const partner = (k) => inv.partners[norm(k)] || { available: 0, sold: 0, countries: 0 };
    switch (kind) {
      case 'asof': return dateStr;
      case 'homes':
        if (!a) return String(inv.available);
        if (a === 'partner') return String(partner(b).available);
        return String(country(a).available);
      case 'sold':
        if (!a) return String(inv.sold);
        if (a === 'partner') return String(partner(b).sold);
        return String(country(a).sold);
      case 'from': { const c = country(a); return c.min ? money(c.min, c.minCurrency, locale) : m; }
      case 'ops': return word(country(a).ops, locale);
      case 'countries':
        if (!a) return word(inv.countryCount, locale);
        if (a === 'partner') return word(partner(b).countries, locale);
        return m;
      case 'covered': return String(a.split(',').reduce((n, k) => n + country(k).available, 0));
      default: return m;
    }
  });
}

/** Walk an object/array and fill tokens in every string. */
export function fillInventoryDeep(value, inv, opts) {
  if (typeof value === 'string') return fillInventoryTokens(value, inv, opts);
  if (Array.isArray(value)) return value.map(v => fillInventoryDeep(v, inv, opts));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillInventoryDeep(v, inv, opts);
    return out;
  }
  return value;
}

/** A serialisable summary for a page that wants to show a live strip. */
export function inventorySummary(inv, { country, partner, locale = 'en' } = {}) {
  const out = { available: inv.available, sold: inv.sold, countries: inv.countryCount, asOf: inv.asOf.toISOString() };
  if (country) { const c = inv.countries[countryKey(country)]; if (c) out.country = { available: c.available, sold: c.sold, ops: c.ops, from: c.min ? money(c.min, c.minCurrency, locale) : null }; }
  if (partner) { const p = inv.partners[norm(partner)]; if (p) out.partner = { available: p.available, sold: p.sold, countries: p.countries }; }
  return out;
}
