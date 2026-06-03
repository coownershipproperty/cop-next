/**
 * lib/locale-ui-strings.js
 *
 * UI label translations for /compare/, /partners/, /glossary/ pages
 * across en / es / fr / de. Keeps locale-specific page files thin.
 */

export const UI_STRINGS = {
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
    aboutUrl: '/about-us/',
    homeUrl: '/our-homes/',
    howItWorksUrl: '/how-it-works/',
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
    aboutUrl: '/es/quienes-somos/',
    homeUrl: '/es/propiedades/',
    howItWorksUrl: '/es/como-funciona/',
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
    aboutUrl: '/fr/a-propos/',
    homeUrl: '/fr/proprietes/',
    howItWorksUrl: '/fr/comment-ca-marche/',
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
    aboutUrl: '/de/uber-uns/',
    homeUrl: '/de/immobilien/',
    howItWorksUrl: '/de/so-funktionierts/',
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

export const LOCALES = ['en', 'es', 'fr', 'de'];
