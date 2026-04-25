/**
 * useCurrency — shared hook for geo-detected currency + live exchange rates.
 *
 * • Module-level singleton: only ONE fetch per page load regardless of how many
 *   PropertyCards are mounted.
 * • Rates cached in localStorage for 1 hour.
 * • Falls back gracefully — returns null while loading or if rates unavailable.
 */
import { useState, useEffect } from 'react';

export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  CAD: 'CA$',
  CHF: 'CHF\u00a0',
  SEK: 'kr\u00a0',
  NOK: 'kr\u00a0',
  DKK: 'kr\u00a0',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  AED: 'AED\u00a0',
};

const CACHE_KEY = 'cop_rates_v1';
const CACHE_TTL = 3600 * 1000; // 1 hour

// Module-level singleton — shared across all hook instances on the page
let _result = null;   // { rates, currency } once resolved
let _promise = null;  // in-flight fetch promise
let _listeners = [];  // components waiting for result

function notify() {
  _listeners.forEach(fn => fn(_result));
  _listeners = [];
}

function readCookieCurrency() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)cop_currency=([^;]+)/);
  return m ? m[1] : null;
}

function ensureLoaded() {
  if (_result) return Promise.resolve(_result);
  if (_promise) return _promise;

  _promise = (async () => {
    const cookieCurrency = readCookieCurrency();

    // Try localStorage cache first
    try {
      const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (stored && Date.now() - stored.ts < CACHE_TTL && stored.rates) {
        // Cookie takes priority; if no cookie, no conversion (null)
        _result = { rates: stored.rates, currency: cookieCurrency || null };
        notify();
        return _result;
      }
    } catch (_) {}

    // Fetch from /api/rates (Vercel CDN-cached, very fast)
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        // If no cookie, currency is null → no conversion, show original price
        _result = { rates: data.rates, currency: cookieCurrency || null };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            rates: data.rates,
            currency: _result.currency,
            ts: Date.now(),
          }));
        } catch (_) {}
        notify();
        return _result;
      }
    } catch (_) {}

    // Rates unavailable — show original currencies
    _result = null;
    _promise = null;
    notify();
    return null;
  })();

  return _promise;
}

export function useCurrency() {
  const [state, setState] = useState(_result); // instant if already loaded

  useEffect(() => {
    if (_result) {
      setState(_result);
      return;
    }
    // Register listener and kick off load
    const listener = (data) => setState(data);
    _listeners.push(listener);
    ensureLoaded();
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  return state; // null while loading; { rates, currency } once ready
}

/**
 * Convert a price from one currency to the user's display currency.
 * Returns null if conversion isn't possible (same currency, missing rates, etc.)
 */
export function convertPrice(price, fromCurrency, cx) {
  if (!cx?.rates || !cx.currency) return null;
  const toCurrency = cx.currency;
  if (toCurrency === fromCurrency) return null;
  const fromRate = cx.rates[fromCurrency];
  const toRate = cx.rates[toCurrency];
  if (!fromRate || !toRate) return null;
  // All rates are relative to USD base
  return Math.round((price / fromRate) * toRate);
}
