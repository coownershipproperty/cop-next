/**
 * components/GlossaryPageRenderer.js
 *
 * Shared renderer for the glossary page across all locales (en/es/fr/de).
 * Each locale-specific page file calls this with locale-specific data.
 *
 * Emits Schema.org @graph: WebPage + DefinedTermSet + 49 DefinedTerm + BreadcrumbList.
 */

import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';
import { ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

export default function GlossaryPageRenderer({ locale, data }) {
  const ui = UI_STRINGS[locale];
  const sectionPath = URL_PATHS[locale].glossary;
  const PAGE_URL = `${SITE_URL}${sectionPath}/`;
  const GLOSSARY_ID = `${PAGE_URL}#glossary-termset`;
  const { intro, categories, terms } = data;

  // Locale-specific title/description
  const titlesByLocale = {
    en: 'Glossary of Co-Ownership Terms | Co-Ownership Property',
    es: 'Glosario de Copropiedad | Co-Ownership Property',
    fr: 'Glossaire de la Copropriété | Co-Ownership Property',
    de: 'Miteigentums-Glossar | Co-Ownership Property',
  };
  const metaDescByLocale = {
    en: 'Working glossary of fractional co-ownership terms across legal structures, tax, operational mechanics, residency rules, and property terminology. 49 defined terms covering LLC, SCI, SL, GmbH & Co. KG, IFI, Patrimonio, IBI, supported resale, ROFR, NIE, Schengen 90/180, and more.',
    es: 'Glosario operativo de términos de copropiedad fraccional: estructuras legales, fiscalidad, mecánica operativa, normas de residencia y terminología inmobiliaria. 49 términos definidos incluyendo LLC, SCI, SL, GmbH & Co. KG, IFI, Patrimonio, IBI, reventa asistida, derecho de tanteo, NIE, Schengen 90/180.',
    fr: "Glossaire opérationnel des termes de la copropriété fractionnée : structures juridiques, fiscalité, mécanique opérationnelle, règles de résidence et terminologie immobilière. 49 termes définis dont LLC, SCI, SL, GmbH & Co. KG, IFI, Patrimonio, IBI, revente accompagnée, droit de préemption, NIE, Schengen 90/180.",
    de: 'Operatives Glossar zu Begriffen des fraktionalen Miteigentums: Rechtsstrukturen, Steuern, operative Mechanik, Aufenthaltsregeln und Immobilienterminologie. 49 definierte Begriffe, darunter LLC, SCI, SL, GmbH & Co. KG, IFI, Patrimonio, IBI, begleiteter Weiterverkauf, Vorkaufsrecht, NIE, Schengen 90/180.',
  };
  const h1ByLocale = {
    en: 'Co-Ownership Glossary',
    es: 'Glosario de Copropiedad',
    fr: 'Glossaire de la Copropriété',
    de: 'Miteigentums-Glossar',
  };

  // Sort terms alphabetically within each category
  const termsByCategory = {};
  categories.forEach(c => { termsByCategory[c.id] = []; });
  [...terms].sort((a, b) => a.term.localeCompare(b.term)).forEach(t => {
    if (termsByCategory[t.category]) termsByCategory[t.category].push(t);
  });

  const graph = [
    {
      "@type": "WebPage",
      "@id": PAGE_URL + "#webpage",
      "url": PAGE_URL,
      "name": titlesByLocale[locale],
      "description": metaDescByLocale[locale],
      "inLanguage": locale,
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": SITE_URL + "/#organization" },
      "mainEntity": { "@id": GLOSSARY_ID },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": PAGE_URL + "#breadcrumb" },
    },
    {
      "@type": "DefinedTermSet",
      "@id": GLOSSARY_ID,
      "name": h1ByLocale[locale],
      "description": intro,
      "url": PAGE_URL,
      "inLanguage": locale,
      "publisher": { "@id": SITE_URL + "/#organization" },
      "hasDefinedTerm": terms.map(t => ({ "@id": PAGE_URL + "#" + t.slug })),
    },
    ...terms.map(t => ({
      "@type": "DefinedTerm",
      "@id": PAGE_URL + "#" + t.slug,
      "name": t.term,
      "description": t.definition,
      "inDefinedTermSet": { "@id": GLOSSARY_ID },
      "url": PAGE_URL + "#" + t.slug,
      "inLanguage": locale,
      ...(t.sameAs ? { "sameAs": t.sameAs } : {}),
    })),
    {
      "@type": "BreadcrumbList",
      "@id": PAGE_URL + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": ui.homeLabel, "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": ui.glossaryLabel, "item": PAGE_URL },
      ],
    },
  ];

  const hreflangAlts = [
    { hrefLang: 'en', href: `${SITE_URL}/glossary/` },
    { hrefLang: 'es', href: `${SITE_URL}/es/glosario/` },
    { hrefLang: 'fr', href: `${SITE_URL}/fr/glossaire/` },
    { hrefLang: 'de', href: `${SITE_URL}/de/glossar/` },
    { hrefLang: 'x-default', href: `${SITE_URL}/glossary/` },
  ];

  return (
    <>
      <Head>
        <title>{titlesByLocale[locale]}</title>
        <meta name="description" content={metaDescByLocale[locale]} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={PAGE_URL} />
        {hreflangAlts.map(a => (
          <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
        ))}
        <meta property="og:title" content={h1ByLocale[locale]} />
        <meta property="og:description" content={metaDescByLocale[locale]} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }) }} />
      </Head>

      <Header />

      <article className="compare-page glossary-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">{ui.glossaryEyebrow}</p>
          <h1 className="compare-h1">{h1ByLocale[locale]}</h1>
          <p className="compare-subtitle">{intro}</p>
          <p className="compare-meta">
            <span className="compare-wc-inline">{terms.length} {ui.termsLabel} · {categories.length} {ui.categoriesLabel}</span>
          </p>
        </section>

        <section className="glossary-body">
          <div className="glossary-inner">
            <nav className="glossary-nav" aria-label={ui.glossaryLabel}>
              {categories.map(cat => (
                <a key={cat.id} href={`#${cat.id}`} className="glossary-nav-pill">{cat.name}</a>
              ))}
            </nav>

            {categories.map(cat => (
              <section key={cat.id} id={cat.id} className="glossary-category">
                <h2 className="glossary-category-heading">{cat.name}</h2>
                <div className="glossary-terms">
                  {termsByCategory[cat.id].map(t => (
                    <article key={t.slug} id={t.slug} className="glossary-term" itemScope itemType="https://schema.org/DefinedTerm">
                      <h3 className="glossary-term-name" itemProp="name">
                        <a href={`#${t.slug}`} className="glossary-anchor" aria-label={`Link to ${t.term}`}>#</a>
                        {t.term}
                      </h3>
                      <p className="glossary-term-definition" itemProp="description">{t.definition}</p>
                      <p className="glossary-term-explanation">{t.explanation}</p>
                      {t.sameAs && (
                        <p className="glossary-term-source">
                          <a href={t.sameAs} rel="noopener" target="_blank">{t.sameAs.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="compare-cta">
          <h3>{ui.browseAllProperties}</h3>
          <div className="compare-cta-buttons">
            <a href={ui.homeUrl} className="primary">{ui.browseAllProperties}</a>
            <a href={ui.howItWorksUrl} className="ghost">{ui.howItWorks}</a>
          </div>
        </section>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
