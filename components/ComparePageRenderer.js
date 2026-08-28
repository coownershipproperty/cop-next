/**
 * components/ComparePageRenderer.js
 *
 * Shared renderer for /compare/{slug}/ across all locales (en/es/fr/de).
 * Each locale-specific page file at pages/compare/[slug].js or
 * pages/{locale}/{section}/[slug].js calls this with locale-specific props.
 *
 * Emits Schema.org @graph: WebPage + Article + FAQPage + BreadcrumbList,
 * with the Article author linked by @id to the canonical David Person on
 * /about-us/ for cross-page entity reconciliation.
 */

import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';
import { ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

export default function ComparePageRenderer({ locale, slug, entry, body, faqs, wordCount }) {
  const ui = UI_STRINGS[locale];
  const sectionPath = URL_PATHS[locale].compare;
  const canonicalUrl = `${SITE_URL}${sectionPath}/${slug}/`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl + "#webpage",
      "url": canonicalUrl,
      "name": fullTitle,
      "description": entry.metaDescription,
      "inLanguage": locale,
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": SITE_URL + "/#organization" },
      "mainEntity": { "@id": canonicalUrl + "#article" },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": canonicalUrl + "#breadcrumb" },
    },
    {
      "@type": "Article",
      "@id": canonicalUrl + "#article",
      "headline": entry.h1,
      "description": entry.metaDescription,
      "url": canonicalUrl,
      "image": entry.ogImage,
      "datePublished": entry.datePublished,
      "dateModified": entry.dateModified,
      "wordCount": wordCount,
      "inLanguage": locale,
      "author": {
        "@type": "Person",
        "@id": SITE_URL + "/about-us/#david-olsson",
        "name": "David Olsson",
        "url": SITE_URL + "/about-us/",
      },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "mainEntityOfPage": { "@id": canonicalUrl + "#webpage" },
      ...(Array.isArray(entry.mentionsBrands) && entry.mentionsBrands.length > 0 ? {
        "mentions": entry.mentionsBrands.map(b => ({
          "@type": "Organization",
          "name": b.name,
          "url": b.url,
        })),
      } : {}),
    },
    ...(faqs.length > 0 ? [{
      "@type": "FAQPage",
      "@id": canonicalUrl + "#faq",
      "inLanguage": locale,
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer },
      })),
    }] : []),
    {
      "@type": "BreadcrumbList",
      "@id": canonicalUrl + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": ui.homeLabel, "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": ui.compareLabel, "item": SITE_URL + sectionPath + "/" },
        { "@type": "ListItem", "position": 3, "name": entry.h1, "item": canonicalUrl },
      ],
    },
  ];

  // hreflang alternates — emit links to other locales' versions of this slug
  // (always EN; ES/FR/DE only if the slug exists in those locales, but we
  // pass all of them since slugs are stable across locales)
  const hreflangAlts = [
    { hrefLang: 'en', href: `${SITE_URL}/compare/${slug}/` },
    { hrefLang: 'es', href: `${SITE_URL}/es/comparativa/${slug}/` },
    { hrefLang: 'fr', href: `${SITE_URL}/fr/comparaison/${slug}/` },
    { hrefLang: 'de', href: `${SITE_URL}/de/vergleich/${slug}/` },
    { hrefLang: 'x-default', href: `${SITE_URL}/compare/${slug}/` },
  ];

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={entry.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangAlts.map(a => (
          <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
        ))}
        <meta property="og:title" content={entry.title} />
        <meta property="og:description" content={entry.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta property="og:image" content={entry.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }) }} />
      </Head>

      <Header />

      <article className="compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">{ui.compareEyebrow}</p>
          <h1 className="compare-h1">{entry.h1}</h1>
          {entry.subtitle && <p className="compare-subtitle">{entry.subtitle}</p>}
          <p className="compare-meta">
            <span className="compare-byline">
              {ui.bylinePrefix} <a href={SITE_URL + ui.aboutUrl} rel="author">David Olsson</a>
            </span>
            <span className="compare-date-inline">{ui.updatedPrefix} {new Date(entry.dateModified).toLocaleDateString(ui.dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="compare-wc-inline">{Math.round(wordCount / 100) * 100} {ui.wordsLabel} · {Math.ceil(wordCount / 230)} {ui.minReadLabel}</span>
          </p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner" dangerouslySetInnerHTML={{ __html: body }} />
        </section>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
