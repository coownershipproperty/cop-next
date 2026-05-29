/**
 * components/PartnerPageRenderer.js
 *
 * Shared renderer for /partners/{slug}/ across all locales (en/es/fr/de).
 *
 * Emits Schema.org @graph: WebPage + AboutPage + Article + Organization
 * (the partner) + FAQPage + BreadcrumbList. The partner Organization node
 * uses a canonical @id so AI engines reconcile the entity across pages.
 */

import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';

const SITE_URL = 'https://co-ownership-property.com';

export default function PartnerPageRenderer({ locale, slug, entry, body, faqs, wordCount }) {
  const ui = UI_STRINGS[locale];
  const sectionPath = URL_PATHS[locale].partners;
  const canonicalUrl = `${SITE_URL}${sectionPath}/${slug}/`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  const partnerOrgId = `${SITE_URL}/partners/${slug}/#partner-organization`;

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl + "#webpage",
      "url": canonicalUrl,
      "name": fullTitle,
      "description": entry.metaDescription,
      "inLanguage": locale,
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": partnerOrgId },
      "mainEntity": { "@id": canonicalUrl + "#article" },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": canonicalUrl + "#breadcrumb" },
    },
    {
      "@type": "AboutPage",
      "@id": canonicalUrl + "#aboutpage",
      "url": canonicalUrl,
      "name": entry.title,
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "about": { "@id": partnerOrgId },
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
      "about": { "@id": partnerOrgId },
      "mentions": [{ "@id": partnerOrgId }],
    },
    {
      "@type": "Organization",
      "@id": partnerOrgId,
      "name": entry.name,
      "legalName": entry.legalName,
      "url": entry.website,
      "foundingDate": entry.founded,
      ...(entry.headquarters ? { "address": { "@type": "PostalAddress", "addressLocality": entry.headquarters } } : {}),
      "description": entry.subtitle,
      ...(Array.isArray(entry.countriesCoverage) ? {
        "areaServed": entry.countriesCoverage.map(c => ({ "@type": "Country", "name": c })),
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
        { "@type": "ListItem", "position": 2, "name": ui.partnersLabel, "item": SITE_URL + sectionPath + "/" },
        { "@type": "ListItem", "position": 3, "name": entry.name, "item": canonicalUrl },
      ],
    },
  ];

  const hreflangAlts = [
    { hrefLang: 'en', href: `${SITE_URL}/partners/${slug}/` },
    { hrefLang: 'es', href: `${SITE_URL}/es/socios/${slug}/` },
    { hrefLang: 'fr', href: `${SITE_URL}/fr/partenaires/${slug}/` },
    { hrefLang: 'de', href: `${SITE_URL}/de/partner/${slug}/` },
    { hrefLang: 'x-default', href: `${SITE_URL}/partners/${slug}/` },
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
        <meta property="og:locale" content={locale === 'en' ? 'en_GB' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : 'de_DE'} />
        <meta property="og:image" content={entry.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }) }} />
      </Head>

      <Header />

      <article className="compare-page partner-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">{ui.partnerEyebrow}</p>
          <h1 className="compare-h1">{entry.h1.replace(' [2026]', '')}</h1>
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
