// lib/i18n.js — locale configuration and helpers.
//
// SINGLE SOURCE OF TRUTH FOR LOCALES. Adding a language should be config plus
// content, never code. Everything downstream — route maps, hreflang, the
// language switcher, sitemap generation, Supabase column lists, number and
// currency formatting — is derived from the two tables at the top of this file
// (LOCALE_META and ROUTE_SLUGS). If you find yourself writing `title_es` or
// `'/fr/'` literally anywhere in the codebase, that is a bug: use the helpers.
//
// We use explicit pages/{locale}/* directories rather than Next.js's built-in
// i18n config, because slugs differ per locale (/es/como-funciona/ vs
// /fr/comment-ca-marche/) and each locale needs its own canonical URL.
//
// Terminology per locale is locked in docs/translation-glossary.md. Read it
// before adding a locale — the product word is a false friend across several
// of these languages (Italian `multiproprietà` = timeshare; Brazilian
// `multipropriedade` = our exact product; Norwegian `tidspart` = timeshare).

import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import it from '@/messages/it.json';
import nl from '@/messages/nl.json';
import pt from '@/messages/pt.json';
import sv from '@/messages/sv.json';
import da from '@/messages/da.json';
import no from '@/messages/no.json';

const MESSAGES = { en, es, fr, de, it, nl, pt, sv, da, no };

/**
 * Per-locale configuration.
 *
 *   name          native language name, shown in the switcher
 *   htmlLang      value for <html lang>
 *   ogLocale      value for <meta property="og:locale">
 *   numberLocale  BCP-47 tag for Intl.NumberFormat (prices, areas)
 *   hreflangs     hreflang values emitted for this locale. Usually one, but
 *                 pt emits pt-BR (primary, the market we write for) plus a
 *                 plain pt so Portugal still resolves rather than falling
 *                 through to English.
 *   currencyAfter true when the currency symbol follows the number
 *   launched      false while a locale's page set is still being built. Unlaunched
 *                 locales are excluded from SUPPORTED_LOCALES, so they emit no
 *                 hreflang, no language-switcher entry and no sitemap URLs —
 *                 nothing points at a page that would 404. Flip to true in the
 *                 same commit that lands the locale's pages.
 *   notAvailable  switcher tooltip when a page has no version in this locale
 *   market        the market this locale is written for — documentation only
 */
export const LOCALE_META = {
  en: { launched: true , notAvailable: 'Not yet available in English', name: 'English',    htmlLang: 'en-GB', ogLocale: 'en_GB', numberLocale: 'en-GB', hreflangs: ['en'],           currencyAfter: false, market: 'UK / international' },
  es: { launched: true , notAvailable: 'Aún no disponible en español', name: 'Español',    htmlLang: 'es-ES', ogLocale: 'es_ES', numberLocale: 'es-ES', hreflangs: ['es'],           currencyAfter: false, market: 'Spain' },
  fr: { launched: true , notAvailable: 'Pas encore disponible en français', name: 'Français',   htmlLang: 'fr-FR', ogLocale: 'fr_FR', numberLocale: 'fr-FR', hreflangs: ['fr'],           currencyAfter: true,  market: 'France' },
  de: { launched: true , notAvailable: 'Noch nicht auf Deutsch verfügbar', name: 'Deutsch',    htmlLang: 'de-DE', ogLocale: 'de_DE', numberLocale: 'de-DE', hreflangs: ['de'],           currencyAfter: true,  market: 'Germany / Austria / Switzerland' },
  it: { launched: true , notAvailable: 'Non ancora disponibile in italiano', name: 'Italiano',   htmlLang: 'it-IT', ogLocale: 'it_IT', numberLocale: 'it-IT', hreflangs: ['it'],           currencyAfter: true,  market: 'Italy' },
  nl: { launched: true , notAvailable: 'Nog niet beschikbaar in het Nederlands', name: 'Nederlands', htmlLang: 'nl-NL', ogLocale: 'nl_NL', numberLocale: 'nl-NL', hreflangs: ['nl'],           currencyAfter: false, market: 'Netherlands / Flanders' },
  pt: { launched: true , notAvailable: 'Ainda não disponível em português', name: 'Português',  htmlLang: 'pt-BR', ogLocale: 'pt_BR', numberLocale: 'pt-BR', hreflangs: ['pt-BR', 'pt'],  currencyAfter: false, market: 'Brazil' },
  sv: { launched: true , notAvailable: 'Inte tillgänglig på svenska ännu', name: 'Svenska',    htmlLang: 'sv-SE', ogLocale: 'sv_SE', numberLocale: 'sv-SE', hreflangs: ['sv'],           currencyAfter: true,  market: 'Sweden' },
  da: { launched: true , notAvailable: 'Endnu ikke tilgængelig på dansk', name: 'Dansk',      htmlLang: 'da-DK', ogLocale: 'da_DK', numberLocale: 'da-DK', hreflangs: ['da'],           currencyAfter: true,  market: 'Denmark' },
  no: { launched: true , notAvailable: 'Ikke tilgjengelig på norsk ennå', name: 'Norsk',      htmlLang: 'nb-NO', ogLocale: 'nb_NO', numberLocale: 'nb-NO', hreflangs: ['nb', 'no'],     currencyAfter: true,  market: 'Norway' },
};

/** Every locale in the table above, launched or not. Config and tooling only. */
export const ALL_LOCALES = Object.keys(LOCALE_META);
/**
 * Locales the public site actually routes, links and indexes. An unlaunched
 * locale is invisible: no hreflang, no switcher entry, no sitemap URL, no
 * Supabase columns in select lists. This is what almost all code wants.
 */
export const SUPPORTED_LOCALES = ALL_LOCALES.filter((l) => LOCALE_META[l].launched);
export const DEFAULT_LOCALE = 'en';
/** Launched locales except English — the set with translated DB columns in play. */
export const TRANSLATED_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);

/**
 * Per-locale URL slugs for every page family.
 *
 * Keys are stable internal names; values are the path segment for that locale.
 * `null` means the locale has no such page. English is irregular by history
 * (the listings index is /our-homes/ but detail pages are /property/{slug}/,
 * the blog index is /all-our-blog/ but posts are /blog/{slug}/) — every other
 * locale reuses one prefix for both, which is why index and detail are
 * separate keys here.
 *
 * SLUG RULES:
 *   • Slugs are ASCII-transliterated, matching each language's own web
 *     convention: de ue/oe/ae, da ae/oe/aa, sv a/a/o, no o/a.
 *   • The slug carries the locale's PRIMARY product term from
 *     docs/translation-glossary.md, because these are the URLs we want to
 *     rank. That is why the town-guide prefix differs per locale
 *     (copropiedad / copropriete / miteigentum / comproprieta / mede-eigendom
 *     / multipropriedade / samagande / medejerskab / sameie) rather than
 *     being a single shared word.
 *   • Never put a locale's forbidden term in a slug. `multiproprieta` in
 *     Italian and `tidspart` in Norwegian both mean timeshare.
 */
// LAUNCH SCOPE FOR THE 2026 LANGUAGES (it, nl, pt, sv, da, no)
// -----------------------------------------------------------
// These six locales launch with a focused page set rather than a full mirror,
// because a URL that serves English prose under a Norwegian path is worse than
// no URL at all — thin, and read as a doorway page.
//
// `howItWorks` carries the pillar slug: for these locales the pillar page IS
// the how-it-works page, and pairing it into the /how-it-works/ hreflang
// cluster lets it inherit that established cluster's authority rather than
// starting cold. `pillar` is therefore null — it would be the same URL twice.
//
// Everything set to null here is content-gated, not code-gated. Fill in the
// slug the same day the content lands:
//   towns       — needs content/towns/{slug}.json translated for the locale
//   blog        — needs published_{loc} posts in Supabase
//   destinations— needs content/destinations/{loc}/*.html
//   buyingFaqs / stayingFaqs / glossary / compare / partners — need their corpora
const ROUTE_SLUGS = {
  en: { home: '', howItWorks: 'how-it-works',      aboutUs: 'about-us',    contact: 'contact', homes: 'our-homes',   property: 'property',      blog: 'all-our-blog', blogPost: 'blog',  favourites: 'favourites', glossary: 'glossary',    destinations: '',              towns: 'co-ownership',    compare: 'compare',       partners: 'partners',  buyingFaqs: 'buying-a-co-ownership-property-faqs',        stayingFaqs: 'staying-in-my-co-ownership-property-faqs',        pillar: null },
  es: { home: '', howItWorks: 'como-funciona',     aboutUs: 'quienes-somos', contact: 'contacto', homes: 'propiedades', property: 'propiedades', blog: 'blog',         blogPost: 'blog',  favourites: 'favoritos',  glossary: 'glosario',    destinations: 'destinos',      towns: 'copropiedad',     compare: 'comparativa',   partners: 'socios',    buyingFaqs: 'comprar-copropiedad-preguntas-frecuentes',   stayingFaqs: 'disfrutar-copropiedad-preguntas-frecuentes',      pillar: 'copropiedad' },
  fr: { home: '', howItWorks: 'comment-ca-marche', aboutUs: 'a-propos',    contact: 'contact', homes: 'proprietes',  property: 'proprietes',    blog: 'blog',         blogPost: 'blog',  favourites: 'favoris',    glossary: 'glossaire',   destinations: 'destinations',  towns: 'copropriete',     compare: 'comparaison',   partners: 'partenaires', buyingFaqs: 'acheter-copropriete-questions-frequentes', stayingFaqs: 'profiter-copropriete-questions-frequentes',       pillar: 'copropriete-residence-secondaire' },
  de: { home: '', howItWorks: 'so-funktionierts',  aboutUs: 'ueber-uns',   contact: 'kontakt', homes: 'immobilien',  property: 'immobilien',    blog: 'blog',         blogPost: 'blog',  favourites: 'favoriten',  glossary: 'glossar',     destinations: 'destinationen', towns: 'miteigentum',     compare: 'vergleich',     partners: 'partner',   buyingFaqs: 'ferienimmobilie-kaufen-haeufige-fragen',     stayingFaqs: 'aufenthalt-ferienimmobilie-haeufige-fragen',      pillar: 'miteigentum-ferienimmobilie' },
  it: { home: '', howItWorks: 'comproprieta-casa-vacanze', aboutUs: 'chi-siamo', contact: 'contatti', homes: 'immobili', property: 'immobili', favourites: 'preferiti', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'comproprieta', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
  nl: { home: '', howItWorks: 'mede-eigendom-vakantiewoning', aboutUs: 'over-ons', contact: 'contact', homes: 'woningen', property: 'woningen', favourites: 'favorieten', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'mede-eigendom', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
  pt: { home: '', howItWorks: 'multipropriedade-casa-de-ferias', aboutUs: 'sobre-nos', contact: 'contato', homes: 'imoveis', property: 'imoveis', favourites: 'favoritos', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'multipropriedade', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
  sv: { home: '', howItWorks: 'samagande-fritidshus', aboutUs: 'om-oss', contact: 'kontakt', homes: 'bostader', property: 'bostader', favourites: 'favoriter', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'samagande', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
  da: { home: '', howItWorks: 'medejerskab-feriebolig', aboutUs: 'om-os', contact: 'kontakt', homes: 'boliger', property: 'boliger', favourites: 'favoritter', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'medejerskab', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
  no: { home: '', howItWorks: 'sameie-fritidsbolig', aboutUs: 'om-oss', contact: 'kontakt', homes: 'boliger', property: 'boliger', favourites: 'favoritter', blog: null, blogPost: null, glossary: null, destinations: null, towns: 'sameie', compare: null, partners: null, buyingFaqs: null, stayingFaqs: null, pillar: null },
};

/** URL prefix for a locale: '' for English, '/es' for Spanish, etc. */
export function localePrefix(locale) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

/**
 * Build the path for a page family in a locale, or null when that locale has
 * no such page. Always returns a trailing slash (the site's canonical form).
 *
 *   routePath('es', 'howItWorks') → '/es/como-funciona/'
 *   routePath('en', 'howItWorks') → '/how-it-works/'
 *   routePath('sv', 'home')       → '/sv/'
 *   routePath('en', 'pillar')     → null
 */
export function routePath(locale, key) {
  const slugs = ROUTE_SLUGS[locale];
  if (!slugs) return null;
  const slug = slugs[key];
  if (slug == null) return null;
  const prefix = localePrefix(locale);
  if (slug === '') return `${prefix}/`;
  return `${prefix}/${slug}/`;
}

/**
 * Prefix for a dynamic family (property/{slug}, blog/{slug}, towns/{slug}).
 * Returns a path ending in '/' that a slug can be appended to, or null.
 *
 *   familyPrefix('de', 'property') → '/de/immobilien/'
 *   familyPrefix('en', 'towns')    → '/co-ownership/'
 *   familyPrefix('en', 'destinations') → '/'   (English destinations are root-level)
 */
export function familyPrefix(locale, key) {
  return routePath(locale, key);
}

/**
 * Extract locale from a Next.js router pathname.
 * `/es/como-funciona/` → `es` · `/no/boliger/` → `no` · `/our-homes/` → `en`
 */
export function localeFromPath(path) {
  if (!path) return DEFAULT_LOCALE;
  const seg = path.split('/').filter(Boolean)[0];
  if (SUPPORTED_LOCALES.includes(seg) && seg !== DEFAULT_LOCALE) return seg;
  return DEFAULT_LOCALE;
}

/**
 * Translation lookup. Falls back to English if a key is missing in the
 * requested locale, then to the key itself if even English is missing
 * (so missing translations are visible in dev rather than rendering blank).
 *
 *   t('nav.our_homes', 'es') → 'Propiedades'
 *   t('nav.our_homes', 'no') → 'Boliger'
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
 * Switcher tooltip shown when the current page has no equivalent in a locale.
 * Written in the target language, because it is the speaker of that language
 * who needs to read it.
 */
export const NOT_AVAILABLE_LABEL = Object.fromEntries(
  ALL_LOCALES.map((l) => [l, LOCALE_META[l].notAvailable])
);

/** Native language names, keyed by locale. Derived from LOCALE_META. */
export const LOCALE_NAMES = Object.fromEntries(
  SUPPORTED_LOCALES.map((l) => [l, LOCALE_META[l].name])
);

/** Open Graph locale tag (en_GB, pt_BR, nb_NO …) for a locale. */
export function ogLocaleFor(locale) {
  return (LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE]).ogLocale;
}

/** BCP-47 tag for Intl formatting in a locale. */
export function numberLocale(locale) {
  return (LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE]).numberLocale;
}

/**
 * Format a price for a locale, honouring that locale's separator convention
 * and whether the currency symbol leads or trails. See the table in
 * docs/translation-glossary.md — this function is the code that implements it.
 */
export function formatPrice(amount, currency = 'EUR', locale = DEFAULT_LOCALE) {
  if (amount == null || Number.isNaN(Number(amount))) return '';
  try {
    return new Intl.NumberFormat(numberLocale(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Math.round(Number(amount)).toLocaleString('en-GB')}`;
  }
}

// ── Localised Supabase columns ─────────────────────────────────────────────
//
// The properties and blog tables carry one column per translated locale for
// each localisable field: title_es, title_fr, …, title_no. Rather than listing
// them by hand in every select() — which is what made adding a locale a
// fifteen-file change — generate them.

/** Localisable fields on the `properties` table. */
export const PROPERTY_LOCALIZED_FIELDS = ['title', 'description', 'description_ai', 'amenities', 'slug'];
/** Localisable fields on the blog table. */
export const BLOG_LOCALIZED_FIELDS = ['title', 'excerpt', 'subtitle', 'slug'];

/**
 * Expand base field names into an English + per-locale column list for a
 * Supabase select().
 *
 *   localeColumns(['title'])                  → 'title, title_es, title_fr, …, title_no'
 *   localeColumns(['title'], { locales: ['de'] }) → 'title, title_de'
 *   localeColumns(['title'], { base: false })     → 'title_es, title_fr, …'
 */
export function localeColumns(fields, { locales = TRANSLATED_LOCALES, base = true } = {}) {
  const out = [];
  for (const f of fields) {
    if (base) out.push(f);
    for (const loc of locales) out.push(`${f}_${loc}`);
  }
  return out.join(', ');
}

/**
 * Read a localised field off a row, falling back to the English column.
 *
 *   localizedField(property, 'title', 'sv') → property.title_sv || property.title
 */
export function localizedField(row, field, locale = DEFAULT_LOCALE) {
  if (!row) return undefined;
  if (locale === DEFAULT_LOCALE) return row[field];
  const v = row[`${field}_${locale}`];
  return v == null || v === '' ? row[field] : v;
}

/**
 * Pick the localised columns off a Supabase row into a plain serialisable
 * object, normalising `undefined` to `null` (Next.js cannot serialise
 * `undefined` in getStaticProps). Use this in the row-mapping step of
 * getStaticProps so the client component can call localizedField() later.
 *
 *   ...pickLocalized(p, PROPERTY_LOCALIZED_FIELDS)
 */
export function pickLocalized(row, fields, { locales = TRANSLATED_LOCALES } = {}) {
  const out = {};
  for (const f of fields) {
    for (const loc of locales) {
      const k = `${f}_${loc}`;
      out[k] = row?.[k] ?? null;
    }
  }
  return out;
}

/**
 * Which locales actually have a usable translation of a row, so we only ask
 * Google to index pages that are genuinely in that language.
 *
 * English always counts. A translated locale counts only when every field in
 * `fields` is populated for it — a page with an Italian nav and an English
 * body is thin content, and 350 properties times six languages of it is thin
 * content at a scale that hurts the whole domain.
 *
 * Used for the hreflang set and the sitemap on property pages, and as the
 * signal for noindex on the untranslated ones. As translations are backfilled
 * the pages become indexable on the next build, with no code change.
 *
 *   translatedLocales(property, ['title', 'description'])
 *   → ['en', 'es', 'fr', 'de']   (before the 2026 languages are backfilled)
 */
export function translatedLocales(row, fields = ['title', 'description']) {
  if (!row) return [DEFAULT_LOCALE];
  return SUPPORTED_LOCALES.filter((locale) => {
    if (locale === DEFAULT_LOCALE) return true;
    return fields.every((f) => {
      const v = row[`${f}_${locale}`];
      return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : v != null;
    });
  });
}

// ── Route map ──────────────────────────────────────────────────────────────
//
// English path → { locale: path }. Generated from ROUTE_SLUGS so that adding a
// locale to the table above automatically extends every hreflang set and the
// language switcher. Keys are the canonical English paths without a trailing
// slash ('/' for the homepage), which is the form callers pass to
// <HreflangLinks englishPath="…" />.

/** Page families that exist in English and are mirrored per locale. */
const SHARED_ROUTE_KEYS = [
  'home', 'howItWorks', 'aboutUs', 'contact', 'homes',
  'buyingFaqs', 'stayingFaqs', 'blog', 'favourites', 'glossary',
];

function stripSlash(p) {
  return (p || '').replace(/\/$/, '') || '/';
}

function buildRouteMap() {
  const map = {};
  for (const key of SHARED_ROUTE_KEYS) {
    const enPath = routePath(DEFAULT_LOCALE, key);
    if (!enPath) continue;
    const entry = {};
    for (const loc of SUPPORTED_LOCALES) {
      const p = routePath(loc, key);
      if (p) entry[loc] = p;
    }
    map[stripSlash(enPath)] = entry;
  }
  // Pillar concept pages are locale-only: each locale needed a deep,
  // keyword-targeted explainer built around its own primary term, and the
  // English site already has /how-it-works/ in that role. They are keyed by
  // their own path so canonicalEnglishKey() and the switcher can find them,
  // but they intentionally have no cross-locale siblings — a Norwegian
  // "sameie i fritidsbolig" page is not a translation of an Italian
  // "comproprietà" page, it is a different argument for a different market.
  for (const loc of SUPPORTED_LOCALES) {
    const p = routePath(loc, 'pillar');
    if (p) map[stripSlash(p)] = { [loc]: p };
  }
  return map;
}

export const ROUTE_MAP = buildRouteMap();

/** Locale homepages — used to stop them being read as dynamic-route slugs. */
export const LOCALE_ROOT_PATHS = new Set(
  SUPPORTED_LOCALES.map((l) => routePath(l, 'home'))
);

// ── Dynamic page families ──────────────────────────────────────────────────
//
// Page families whose URLs end in a slug, so they can never live in ROUTE_MAP.
// The language switcher translates the current URL by swapping the prefix.
// `destinations` MUST stay last: its English prefix is '/' and would otherwise
// swallow every root-level path (it is additionally guarded by
// DESTINATION_SLUG_RE and the enFamily branch in components/Header.js).
export const DYNAMIC_URL_FAMILIES = ['property', 'blogPost', 'towns', 'destinations'].map((family) => ({
  family: family === 'blogPost' ? 'blog' : family,
  prefixes: Object.fromEntries(
    SUPPORTED_LOCALES.map((l) => [l, familyPrefix(l, family)]).filter(([, p]) => p)
  ),
  ...(family === 'destinations' ? { enFamily: 'root' } : {}),
}));

// Property detail URL prefix per locale. Kept as a named export because
// PropertyCard and the locale wrapper routes read it directly.
export const PROPERTY_URL_PREFIX = Object.fromEntries(
  SUPPORTED_LOCALES.map((l) => [l, stripSlash(routePath(l, 'property'))])
);

/** Build a locale-aware property detail URL for a slug. */
export function propertyHref(slug, locale = DEFAULT_LOCALE) {
  const prefix = PROPERTY_URL_PREFIX[locale] || PROPERTY_URL_PREFIX[DEFAULT_LOCALE];
  return `${prefix}/${slug}/`;
}

// ── Destination availability ───────────────────────────────────────────────
//
// Destination pages are long-form HTML in content/destinations/{locale}/. The
// switcher greys out a locale's flag when the file does not exist, so we track
// what has actually been translated. EN and DE have the full 48-page set.
//
// When adding a translated destination, append its slug to the relevant
// locale's Set — the switcher picks it up automatically.
const ROMANCE_DESTINATION_SET = new Set([
  'spain-fractional-ownership-properties',
  'france-fractional-ownership-properties',
  'italy-fractional-ownership-properties',
  'usa-fractional-ownership-properties',
  'portugal-fractional-ownership-properties',
  'mallorca-fractional-ownership-properties',
  'french-alps-fractional-ownership-properties',
  'italian-lakes-fractional-ownership-properties',
  'costa-del-sol-fractional-ownership-properties',
  'sardinia-fractional-ownership-properties',
  'marbella-fractional-ownership-properties',
  'lake-como-fractional-ownership-properties',
  // second wave — country pillars
  'austria-fractional-ownership-properties',
  'england-fractional-ownership-properties',
  'sweden-fractional-ownership-properties',
  'germany-fractional-ownership-properties',
  'croatia-fractional-ownership-properties',
  'mexico-fractional-ownership-properties',
  // regional pillars
  'south-of-france-fractional-ownership-properties',
  'paris-fractional-ownership-properties',
  'ibiza-fractional-ownership-properties',
]);

export const DESTINATION_AVAILABILITY = {
  en: 'all', // canonical set; any slug renderable at /{slug}/ counts
  de: 'all', // full 48-page mirror
  fr: ROMANCE_DESTINATION_SET,
  es: ROMANCE_DESTINATION_SET,
  // Locales added in the 2026 language expansion. Their destination corpora
  // are built after the core pages ship; until a slug is listed here the
  // switcher greys the flag out rather than linking a 404.
  it: new Set(),
  nl: new Set(),
  pt: new Set(),
  sv: new Set(),
  da: new Set(),
  no: new Set(),
};

/** Is a destination slug available in the given locale? */
export function destinationAvailableIn(slug, locale) {
  const entry = DESTINATION_AVAILABILITY[locale];
  if (!entry) return false;
  if (entry === 'all') return true;
  return entry.has(slug);
}

// ── Path resolution ────────────────────────────────────────────────────────

/**
 * For a given English path, return the equivalent path in `targetLocale`,
 * or null if no mapping exists. Used by the language switcher.
 */
export function localizedPath(englishPath, targetLocale) {
  const entry = ROUTE_MAP[stripSlash(englishPath)] || ROUTE_MAP[englishPath];
  if (!entry) return null;
  return entry[targetLocale] || null;
}

/**
 * Given any locale-specific path (e.g. `/no/boliger/`, `/es/blog/`), find the
 * canonical English ROUTE_MAP key it belongs to, so the switcher can resolve
 * the equivalent URL in any other locale.
 *
 *   canonicalEnglishKey('/fr/proprietes/') → '/our-homes'
 *   canonicalEnglishKey('/sv/blogg/')      → '/all-our-blog'
 *   canonicalEnglishKey('/property/xyz/')  → null  (dynamic, not in ROUTE_MAP)
 */
export function canonicalEnglishKey(currentPath) {
  const needle = stripSlash(currentPath);
  for (const [enKey, entry] of Object.entries(ROUTE_MAP)) {
    for (const value of Object.values(entry)) {
      if (stripSlash(value) === needle) return enKey;
    }
  }
  return null;
}

/**
 * Build the alternate-locale set for a page, for hreflang tags.
 * Each entry carries the hreflang values that locale should emit — usually
 * one, but `pt` emits both `pt-BR` and `pt`, and `no` emits `nb` and `no`.
 *
 *   alternateLocales('/how-it-works')
 *   → [{ locale: 'en', path: '/how-it-works/', hreflangs: ['en'] }, …]
 */
export function alternateLocales(englishPath) {
  const entry = ROUTE_MAP[stripSlash(englishPath)] || ROUTE_MAP[englishPath] || {};
  return Object.entries(entry).map(([locale, path]) => ({
    locale,
    path,
    hreflangs: (LOCALE_META[locale] || {}).hreflangs || [locale],
  }));
}

/**
 * Alternates for a dynamic-route page (property, blog post, town guide) where
 * the slug is shared across locales and there is no ROUTE_MAP entry.
 *
 *   dynamicAlternates('towns', 'morzine')
 *   → [{ locale:'en', path:'/co-ownership/morzine/', hreflangs:['en'] }, …]
 *
 * Pass `locales` to restrict the set to those that actually have content —
 * emitting hreflang for a page that 404s is worse than emitting nothing.
 */
export function dynamicAlternates(family, slug, { locales = SUPPORTED_LOCALES } = {}) {
  const out = [];
  for (const loc of locales) {
    const prefix = familyPrefix(loc, family);
    if (!prefix) continue;
    out.push({
      locale: loc,
      path: `${prefix}${slug}/`,
      hreflangs: (LOCALE_META[loc] || {}).hreflangs || [loc],
    });
  }
  return out;
}

/**
 * PROPERTY_META — the pieces used to compose a localized meta description for a
 * property page. Property titles are already composed per locale (see
 * scripts/translate-property-titles.mjs), so the description is built from the
 * localized title rather than from an English template, which is how the page
 * used to do it: every /it/, /nl/, /pt/, /sv/, /da/, /no/, /es/, /fr/ and /de/
 * property URL was shipping an English <meta name="description">, which is both
 * a ranking loss and a snippet the searcher cannot read.
 *
 * Terminology is the locked primary product term and trust anchor from
 * docs/translation-glossary.md. Do not substitute synonyms here — this string
 * is on 350+ pages per locale and is the single most repeated sentence on the
 * site in that language.
 */
export const PROPERTY_META = {
  en: { prep: 'in', product: 'fractional co-ownership', from: 'at',
        trust: 'Real deeded ownership, own only what you use.' },
  es: { prep: 'en', product: 'copropiedad', from: 'desde',
        trust: 'Propiedad real con escritura ante notario e inscripción en el Registro de la Propiedad.' },
  fr: { prep: 'à', product: 'copropriété de résidence secondaire', from: 'à partir de',
        trust: 'Propriété réelle, acte authentique chez le notaire.' },
  de: { prep: 'in', product: 'Miteigentum an einer Ferienimmobilie', from: 'ab',
        trust: 'Echtes Eigentum, im Grundbuch eingetragen.' },
  it: { prep: 'a', product: 'comproprietà di una casa vacanze', from: 'da',
        trust: 'Proprietà reale con atto notarile, iscritta al Catasto.' },
  nl: { prep: 'in', product: 'mede-eigendom van een vakantiewoning', from: 'vanaf',
        trust: 'Echt eigendom, notarieel vastgelegd en op uw naam ingeschreven.' },
  pt: { prep: 'em', product: 'multipropriedade', from: 'a partir de',
        trust: 'Propriedade real registrada na matrícula do imóvel.' },
  sv: { prep: 'i', product: 'samägande av fritidshus', from: 'från',
        trust: 'Riktigt ägande, inskrivet i fastighetsregistret.' },
  da: { prep: 'i', product: 'medejerskab af feriebolig', from: 'fra',
        trust: 'Rigtigt ejerskab, tinglyst og registreret i dit navn.' },
  no: { prep: 'i', product: 'sameie i fritidsbolig', from: 'fra',
        trust: 'Reelt eierskap, tinglyst i Grunnboken.' },
};

/**
 * Compose the meta description for a property page in `locale`.
 *
 * COP titles are `{Place} — {Type clause}` in every language, so the two halves
 * can be recombined into a sentence that reads naturally in each. If the title
 * is missing its em-dash (a hand-written title, or a locale that has not been
 * composed yet) the whole title is used as the clause and the place is dropped
 * rather than guessed at.
 *
 *   propertyMetaDescription('it', {
 *     title: 'Kukci, Istria, Croazia — Villa con 3 camere e piscina a sfioro',
 *     price: '€219.000',
 *   })
 *   → 'Villa con 3 camere e piscina a sfioro a Kukci, Istria, Croazia —
 *      comproprietà di una casa vacanze da €219.000. Proprietà reale con atto
 *      notarile, iscritta al Catasto.'
 */
export function propertyMetaDescription(locale, { title, price } = {}) {
  const m = PROPERTY_META[locale] || PROPERTY_META[DEFAULT_LOCALE];
  const clean = String(title || '').trim();
  if (!clean) return m.trust;
  const parts = clean.split(' — ');
  const head = parts.length > 1
    ? `${parts.slice(1).join(' — ')} ${m.prep} ${parts[0]}`
    : clean;
  const priceClause = price ? ` ${m.from} ${price}` : '';
  return `${head} — ${m.product}${priceClause}. ${m.trust}`;
}
