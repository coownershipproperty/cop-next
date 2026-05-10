// lib/i18n.js — locale helpers for /es/ and /fr/ subfolder routing.
//
// We use explicit pages/es/* and pages/fr/* directories rather than Next.js's
// built-in i18n config. Slugs differ per locale (e.g. /es/como-funciona/ vs
// /fr/comment-ca-marche/), so a single shared route tree wouldn't work.

import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';

const MESSAGES = { en, es, fr };

export const SUPPORTED_LOCALES = ['en', 'es', 'fr'];
export const DEFAULT_LOCALE = 'en';

/**
 * Extract locale from a Next.js router pathname.
 * `/es/como-funciona/` → `es`
 * `/fr/blog/foo/`      → `fr`
 * `/our-homes/`        → `en`  (default)
 */
export function localeFromPath(path) {
  if (!path) return DEFAULT_LOCALE;
  const seg = path.split('/').filter(Boolean)[0];
  if (SUPPORTED_LOCALES.includes(seg) && seg !== 'en') return seg;
  return DEFAULT_LOCALE;
}

/**
 * Translation lookup. Falls back to English if a key is missing in the
 * requested locale, then to the key itself if even English is missing
 * (so missing translations are visible in dev rather than rendering blank).
 *
 *   t('nav.our_homes', 'es') → 'Propiedades'
 *   t('nav.our_homes', 'fr') → 'Propriétés'
 *   t('nav.our_homes', 'en') → 'Our Homes'
 *
 * Supports dot-notation nested keys: t('footer.cols.discover.heading', 'es')
 */
export function t(key, locale = DEFAULT_LOCALE) {
  const lookup = (dict, k) => k.split('.').reduce((o, p) => (o && o[p] != null ? o[p] : undefined), dict);
  const fromLocale = lookup(MESSAGES[locale] || {}, key);
  if (fromLocale != null) return fromLocale;
  const fromEn = lookup(MESSAGES.en, key);
  if (fromEn != null) return fromEn;
  return key;
}

/**
 * Map English page paths to their locale equivalents (for hreflang and language
 * switcher). Keys are English paths. Values are objects keyed by locale.
 *
 * Pages not listed here have no locale equivalent yet (e.g. an English-only
 * blog post). The hreflang component handles this gracefully — it only emits
 * <link> tags for locales that have an entry.
 */
export const ROUTE_MAP = {
  '/': {
    en: '/',
    es: '/es/',
    fr: '/fr/',
  },
  '/how-it-works': {
    en: '/how-it-works/',
    es: '/es/como-funciona/',
    fr: '/fr/comment-ca-marche/',
  },
  '/our-homes': {
    en: '/our-homes/',
    // No locale equivalents yet — listings index is English-only in V1.
  },
  '/about-us': {
    en: '/about-us/',
  },
  // Pillar concept pages (locale-only, no English equivalent yet)
  '/es/copropiedad': {
    es: '/es/copropiedad/',
  },
  '/fr/copropriete-residence-secondaire': {
    fr: '/fr/copropriete-residence-secondaire/',
  },
};

/**
 * For a given English path, return the equivalent path in `targetLocale`,
 * or null if no mapping exists. Used by the language switcher.
 */
export function localizedPath(englishPath, targetLocale) {
  const stripped = englishPath.replace(/\/$/, '') || '/';
  const entry = ROUTE_MAP[stripped] || ROUTE_MAP[englishPath];
  if (!entry) return null;
  return entry[targetLocale] || null;
}

/**
 * Build the canonical alternate-locale set for a page, used in hreflang tags.
 * Returns an array of { locale, path } objects ready for <link rel="alternate">.
 *
 *   alternateLocales('/how-it-works')
 *   → [
 *       { locale: 'en', path: '/how-it-works/' },
 *       { locale: 'es', path: '/es/como-funciona/' },
 *       { locale: 'fr', path: '/fr/comment-ca-marche/' },
 *     ]
 */
export function alternateLocales(englishPath) {
  const stripped = englishPath.replace(/\/$/, '') || '/';
  const entry = ROUTE_MAP[stripped] || ROUTE_MAP[englishPath] || {};
  return Object.entries(entry).map(([locale, path]) => ({ locale, path }));
}
