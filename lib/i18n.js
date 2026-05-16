// lib/i18n.js — locale helpers for /es/ and /fr/ subfolder routing.
//
// We use explicit pages/es/* and pages/fr/* directories rather than Next.js's
// built-in i18n config. Slugs differ per locale (e.g. /es/como-funciona/ vs
// /fr/comment-ca-marche/), so a single shared route tree wouldn't work.

import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';

const MESSAGES = { en, es, fr, de };

export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de'];
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
    de: '/de/',
  },
  '/how-it-works': {
    en: '/how-it-works/',
    es: '/es/como-funciona/',
    fr: '/fr/comment-ca-marche/',
    de: '/de/so-funktionierts/',
  },
  '/about-us': {
    en: '/about-us/',
    es: '/es/quienes-somos/',
    fr: '/fr/a-propos/',
    de: '/de/ueber-uns/',
  },
  '/contact': {
    en: '/contact/',
    es: '/es/contacto/',
    fr: '/fr/contact/',
    de: '/de/kontakt/',
  },
  '/our-homes': {
    en: '/our-homes/',
    es: '/es/propiedades/',
    fr: '/fr/proprietes/',
    de: '/de/immobilien/',
  },
  '/all-our-blog': {
    en: '/all-our-blog/',
    es: '/es/blog/',
    fr: '/fr/blog/',
    de: '/de/blog/',
  },
  // Favourites is noindex (personal-state page) but the locales still need
  // an entry here so the language switcher links between them correctly.
  '/favourites': {
    en: '/favourites/',
    es: '/es/favoritos/',
    fr: '/fr/favoris/',
    de: '/de/favoriten/',
  },
  // Pillar concept pages (locale-only, no English equivalent — they exist
  // because each locale needed a deep keyword-targeted explainer per the
  // research, but the English site already has /how-it-works/ for that role).
  '/es/copropiedad': {
    es: '/es/copropiedad/',
  },
  '/fr/copropriete-residence-secondaire': {
    fr: '/fr/copropriete-residence-secondaire/',
  },
  '/de/miteigentum-ferienimmobilie': {
    de: '/de/miteigentum-ferienimmobilie/',
  },
};

// Per-locale availability for destination pages. Used by the language
// switcher to decide whether to link the target-locale flag (when an HTML
// file exists under content/destinations/{locale}/{slug}.html) or grey it out.
//
// EN has all 48 (the canonical set at content/destinations/{slug}.html).
// DE has all 48 (full mirror, see content/destinations/de/).
// FR currently has the 5 top-tier country pillars only.
// ES has none yet.
//
// When adding a new translated destination, append its slug to the relevant
// locale's Set below — the switcher will pick it up automatically.
export const DESTINATION_AVAILABILITY = {
  en: 'all', // canonical set; any slug renderable at /{slug}/ counts
  de: 'all', // full 48-page mirror
  fr: new Set([
    'spain-fractional-ownership-properties',
    'france-fractional-ownership-properties',
    'italy-fractional-ownership-properties',
    'usa-fractional-ownership-properties',
    'portugal-fractional-ownership-properties',
  ]),
  es: new Set([]),
};

/** Is a destination slug available in the given locale? */
export function destinationAvailableIn(slug, locale) {
  const entry = DESTINATION_AVAILABILITY[locale];
  if (!entry) return false;
  if (entry === 'all') return true;
  return entry.has(slug);
}

// Property detail URL prefix per locale. Used by PropertyCard and the locale
// wrapper routes (/es/propiedades/[slug], /fr/proprietes/[slug]).
export const PROPERTY_URL_PREFIX = {
  en: '/property',
  es: '/es/propiedades',
  fr: '/fr/proprietes',
  de: '/de/immobilien',
};

/** Build a locale-aware property detail URL for a slug. */
export function propertyHref(slug, locale = DEFAULT_LOCALE) {
  const prefix = PROPERTY_URL_PREFIX[locale] || PROPERTY_URL_PREFIX.en;
  return `${prefix}/${slug}/`;
}

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
 * Given any locale-specific path (e.g. `/fr/proprietes/`, `/es/blog/`),
 * find the canonical English ROUTE_MAP key it belongs to. Used by the
 * language switcher so that switching from a French/Spanish page can
 * resolve to the correct other-locale URL via ROUTE_MAP.
 *
 *   canonicalEnglishKey('/fr/proprietes/') → '/our-homes'
 *   canonicalEnglishKey('/es/blog/')       → '/all-our-blog'
 *   canonicalEnglishKey('/our-homes/')     → '/our-homes'
 *   canonicalEnglishKey('/property/xyz/')  → null  (no ROUTE_MAP entry)
 */
export function canonicalEnglishKey(currentPath) {
  const norm = (p) => ((p || '').replace(/\/$/, '') || '/');
  const needle = norm(currentPath);
  for (const [enKey, entry] of Object.entries(ROUTE_MAP)) {
    for (const value of Object.values(entry)) {
      if (norm(value) === needle) return enKey;
    }
  }
  return null;
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
