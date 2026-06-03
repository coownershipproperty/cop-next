/**
 * components/FaqPageRenderer.js
 *
 * Shared renderer for /faq/{slug}/ across all locales (en/es/fr/de).
 * Mirrors the structure of ComparePageRenderer.
 *
 * Each page emits Schema.org @graph: WebPage + Article + FAQPage +
 * BreadcrumbList + SpeakableSpecification. When entry.howToSteps is
 * present, also emits HowTo. When entry.aboutEntities is present, each
 * is added to Article.about as a structured entity reference (with
 * Wikidata sameAs URI for AI-engine entity resolution).
 *
 * The Article author is linked by @id to the canonical David Person on
 * /about-us/ for cross-page entity reconciliation.
 */

/**
 * Canonical Wikidata Q-IDs for the entities we mention most often.
 * Used by aboutEntities[] in faq-meta.json to wire entity sameAs links
 * into Article.about — improves AI-engine entity resolution markedly.
 */
const WIKIDATA_ENTITIES = {
  'fractional-ownership': { name: 'Fractional ownership', wikidata: 'https://www.wikidata.org/wiki/Q5475747' },
  'timeshare': { name: 'Timeshare', wikidata: 'https://www.wikidata.org/wiki/Q1370773' },
  'llc': { name: 'Limited liability company', wikidata: 'https://www.wikidata.org/wiki/Q213600' },
  'real-estate': { name: 'Real estate', wikidata: 'https://www.wikidata.org/wiki/Q43229' },
  'mallorca': { name: 'Mallorca', wikidata: 'https://www.wikidata.org/wiki/Q5765' },
  'ibiza': { name: 'Ibiza', wikidata: 'https://www.wikidata.org/wiki/Q47554' },
  'cote-dazur': { name: "Côte d'Azur", wikidata: 'https://www.wikidata.org/wiki/Q170499' },
  'costa-del-sol': { name: 'Costa del Sol', wikidata: 'https://www.wikidata.org/wiki/Q176760' },
  'aspen': { name: 'Aspen, Colorado', wikidata: 'https://www.wikidata.org/wiki/Q484672' },
  'lake-tahoe': { name: 'Lake Tahoe', wikidata: 'https://www.wikidata.org/wiki/Q41183' },
  'park-city': { name: 'Park City, Utah', wikidata: 'https://www.wikidata.org/wiki/Q500461' },
  'french-alps': { name: 'French Alps', wikidata: 'https://www.wikidata.org/wiki/Q1372112' },
  'lake-como': { name: 'Lake Como', wikidata: 'https://www.wikidata.org/wiki/Q14367' },
  'algarve': { name: 'Algarve', wikidata: 'https://www.wikidata.org/wiki/Q12431' },
  'tuscany': { name: 'Tuscany', wikidata: 'https://www.wikidata.org/wiki/Q1273' },
  'cotswolds': { name: 'Cotswolds', wikidata: 'https://www.wikidata.org/wiki/Q1136094' },
  'sci': { name: 'Société civile immobilière', wikidata: 'https://www.wikidata.org/wiki/Q3488404' },
  'second-home': { name: 'Second home', wikidata: 'https://www.wikidata.org/wiki/Q2627754' },
  'ifi': { name: 'French wealth tax (IFI)', wikidata: 'https://www.wikidata.org/wiki/Q3091812' },
  'stamp-duty': { name: 'Stamp duty', wikidata: 'https://www.wikidata.org/wiki/Q2624037' },
};

import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';

const SITE_URL = 'https://co-ownership-property.com';

export default function FaqPageRenderer({ locale, slug, entry, body, faqs, wordCount, related }) {
  const ui = UI_STRINGS[locale];
  const sectionPath = URL_PATHS[locale].faq;
  const canonicalUrl = `${SITE_URL}${sectionPath}/${slug}/`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  // The primary Q&A from the entry itself is always the first FAQ.
  // Additional in-body FAQs are appended by the page route via extractFaqsFromHtml.
  const allFaqs = [
    { question: entry.h1, answer: entry.shortAnswer },
    ...(Array.isArray(faqs) ? faqs : []),
  ];

  // Resolve aboutEntities[] strings -> structured entity references with
  // Wikidata sameAs links. Unknown keys are silently dropped.
  const aboutEntities = (Array.isArray(entry.aboutEntities) ? entry.aboutEntities : [])
    .map(k => WIKIDATA_ENTITIES[k])
    .filter(Boolean)
    .map(e => ({
      "@type": "Thing",
      "name": e.name,
      "sameAs": e.wikidata,
    }));

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
      // SpeakableSpecification — marks the TLDR + H1 as the speakable answer
      // for voice assistants (Alexa, Google Assistant, Siri).
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".faq-tldr", ".compare-h1"],
      },
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
      ...(aboutEntities.length > 0 ? { "about": aboutEntities } : {}),
    },
    {
      "@type": "FAQPage",
      "@id": canonicalUrl + "#faq",
      "inLanguage": locale,
      "mainEntity": allFaqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer },
      })),
    },
    // HowTo schema — only emitted when entry.howToSteps is present
    // (typically on "how does X work" pages). Cleaner AEO signal than
    // FAQPage alone for procedural answers.
    ...(Array.isArray(entry.howToSteps) && entry.howToSteps.length > 0 ? [{
      "@type": "HowTo",
      "@id": canonicalUrl + "#howto",
      "name": entry.h1,
      "description": entry.shortAnswer,
      "inLanguage": locale,
      "step": entry.howToSteps.map((s, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": s.name,
        "text": s.text,
      })),
    }] : []),
    {
      "@type": "BreadcrumbList",
      "@id": canonicalUrl + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": ui.homeLabel, "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": ui.faqLabel, "item": SITE_URL + sectionPath + "/" },
        { "@type": "ListItem", "position": 3, "name": entry.h1, "item": canonicalUrl },
      ],
    },
  ];

  // hreflang alternates — emit links to other locales' versions of this slug.
  // Slugs are stable across locales, so we emit all four regardless of whether
  // the locale file currently exists (the sitemap is authoritative for which
  // locales are actually live).
  const hreflangAlts = [
    { hrefLang: 'en', href: `${SITE_URL}/faq/${slug}/` },
    { hrefLang: 'es', href: `${SITE_URL}/es/preguntas/${slug}/` },
    { hrefLang: 'fr', href: `${SITE_URL}/fr/questions/${slug}/` },
    { hrefLang: 'de', href: `${SITE_URL}/de/fragen/${slug}/` },
    { hrefLang: 'x-default', href: `${SITE_URL}/faq/${slug}/` },
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

      <article className="faq-page compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">{ui.faqEyebrow}</p>
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

        {Array.isArray(related) && related.length > 0 && (
          <section className="compare-body" aria-label={ui.relatedQuestionsLabel}>
            <div className="compare-body-inner">
              <h2 id="related-questions">{ui.relatedQuestionsLabel}</h2>
              <ul>
                {related.map(r => (
                  <li key={r.slug}>
                    <a href={`${sectionPath}/${r.slug}/`}>{r.h1}</a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
