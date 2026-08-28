import { routePath } from '@/lib/i18n';

/**
 * lib/locale-ui-strings.js
 *
 * UI label translations for /compare/, /partners/, /glossary/ pages
 * across en / es / fr / de. Keeps locale-specific page files thin.
 */

const UI_STRINGS_BASE = {
  en: {
    compareEyebrow: 'Comparison Guide',
    partnerEyebrow: 'Partner Profile',
    glossaryEyebrow: 'Reference Guide',
    faqEyebrow: 'Buyer’s Q&A',
    bylinePrefix: 'By',
    updatedPrefix: 'Updated',
    wordsLabel: 'words',
    minReadLabel: 'min read',
    termsLabel: 'defined terms',
    categoriesLabel: 'categories',
    homeLabel: 'Home',
    compareLabel: 'Compare',
    partnersLabel: 'Partners',
    glossaryLabel: 'Glossary',
    faqLabel: 'Q&A',
    browseAllProperties: 'Browse all properties',
    howItWorks: 'How it works',
    relatedQuestionsLabel: 'Related questions',
    dateLocale: 'en-GB',
  },
  es: {
    compareEyebrow: 'Guía Comparativa',
    partnerEyebrow: 'Perfil del Operador',
    glossaryEyebrow: 'Guía de Referencia',
    bylinePrefix: 'Por',
    updatedPrefix: 'Actualizado',
    wordsLabel: 'palabras',
    minReadLabel: 'min de lectura',
    termsLabel: 'términos definidos',
    categoriesLabel: 'categorías',
    homeLabel: 'Inicio',
    compareLabel: 'Comparativa',
    partnersLabel: 'Socios',
    glossaryLabel: 'Glosario',
    faqEyebrow: 'Preguntas del comprador',
    faqLabel: 'Preguntas',
    browseAllProperties: 'Ver todas las propiedades',
    howItWorks: 'Cómo funciona',
    relatedQuestionsLabel: 'Preguntas relacionadas',
    dateLocale: 'es-ES',
  },
  fr: {
    compareEyebrow: 'Guide Comparatif',
    partnerEyebrow: "Profil de l'Opérateur",
    glossaryEyebrow: 'Guide de Référence',
    bylinePrefix: 'Par',
    updatedPrefix: 'Mis à jour',
    wordsLabel: 'mots',
    minReadLabel: 'min de lecture',
    termsLabel: 'termes définis',
    categoriesLabel: 'catégories',
    homeLabel: 'Accueil',
    compareLabel: 'Comparaison',
    partnersLabel: 'Partenaires',
    glossaryLabel: 'Glossaire',
    faqEyebrow: "Questions de l'acheteur",
    faqLabel: 'Questions',
    browseAllProperties: 'Voir toutes les propriétés',
    howItWorks: 'Comment ça marche',
    relatedQuestionsLabel: 'Questions liées',
    dateLocale: 'fr-FR',
  },
  de: {
    compareEyebrow: 'Vergleichsleitfaden',
    partnerEyebrow: 'Anbieterprofil',
    glossaryEyebrow: 'Nachschlagewerk',
    bylinePrefix: 'Von',
    updatedPrefix: 'Aktualisiert',
    wordsLabel: 'Wörter',
    minReadLabel: 'Min. Lesezeit',
    termsLabel: 'definierte Begriffe',
    categoriesLabel: 'Kategorien',
    homeLabel: 'Startseite',
    compareLabel: 'Vergleich',
    partnersLabel: 'Partner',
    glossaryLabel: 'Glossar',
    faqEyebrow: 'Käufer-Q&A',
    faqLabel: 'Fragen',
    browseAllProperties: 'Alle Immobilien ansehen',
    howItWorks: 'So funktioniert es',
    relatedQuestionsLabel: 'Verwandte Fragen',
    dateLocale: 'de-DE',
  },
};

// The three nav URLs used by these renderers are derived from ROUTE_SLUGS
// rather than written out per locale. They used to be literals here, which is
// how `/de/uber-uns/` ended up in the German strings — the real page has always
// been `/de/ueber-uns/`, so that link 404'd.
export const UI_STRINGS = Object.fromEntries(
  Object.entries(UI_STRINGS_BASE).map(([locale, strings]) => [
    locale,
    {
      ...strings,
      aboutUrl: routePath(locale, 'aboutUs'),
      homeUrl: routePath(locale, 'homes'),
      howItWorksUrl: routePath(locale, 'howItWorks'),
    },
  ])
);

/**
 * URL section paths per locale.
 * EN uses /compare/, /partners/, /glossary/ at root.
 * Other locales use prefixed paths like /es/comparativa/, /fr/comparaison/, /de/vergleich/
 */
export const URL_PATHS = {
  en: { compare: '/compare', partners: '/partners', glossary: '/glossary', faq: '/faq' },
  es: { compare: '/es/comparativa', partners: '/es/socios', glossary: '/es/glosario', faq: '/es/preguntas' },
  fr: { compare: '/fr/comparaison', partners: '/fr/partenaires', glossary: '/fr/glossaire', faq: '/fr/questions' },
  de: { compare: '/de/vergleich', partners: '/de/partner', glossary: '/de/glossar', faq: '/de/fragen' },
};

/**
 * Content directory suffix per locale.
 * EN reads from content/compare/ (no subdirectory).
 * Other locales read from content/compare/{locale}/.
 */
export function contentDir(baseDir, locale) {
  return locale === 'en' ? baseDir : baseDir + '/' + locale;
}

/**
 * Meta file path per locale.
 * EN reads lib/compare-meta.json.
 * Other locales read lib/compare-meta-{locale}.json.
 */
export function metaFileName(base, locale) {
  return locale === 'en' ? base + '.json' : base + '-' + locale + '.json';
}

// Locales this module has UI strings for. Compare / partner / glossary pages
// only exist for these; the 2026 languages get them when their corpora land.
export const LOCALES = ['en', 'es', 'fr', 'de'];
