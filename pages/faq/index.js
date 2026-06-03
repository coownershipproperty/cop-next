/**
 * pages/faq/index.js — FAQ / Q&A hub page (EN)
 *
 * Lists every published /faq/{slug}/ page, grouped by category.
 * Reads lib/faq-meta.json at build time.
 */

import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';

const SITE_URL = 'https://co-ownership-property.com';

const CATEGORY_LABELS = {
  foundational: 'The basics',
  pricing: 'Pricing and cost',
  comparison: 'Comparisons and decisions',
  'tax-legal': 'Tax and legal',
  resale: 'Resale, exit and the secondary market',
  operational: 'Owner experience and operations',
  destination: 'By destination',
  investment: 'Investment and financial',
  'long-tail': 'Common buyer worries',
  brand: 'About Co-Ownership Property',
};

const CATEGORY_ORDER = [
  'foundational',
  'pricing',
  'comparison',
  'tax-legal',
  'resale',
  'operational',
  'destination',
  'investment',
  'long-tail',
  'brand',
];

export async function getStaticProps() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'faq-meta.json'), 'utf-8'));
  const entries = Object.values(meta);

  const grouped = {};
  for (const entry of entries) {
    const cat = entry.category || 'foundational';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ slug: entry.slug, h1: entry.h1, subtitle: entry.subtitle });
  }

  // Sort within each category by h1 alphabetical
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.h1.localeCompare(b.h1));
  }

  return { props: { grouped, total: entries.length }, revalidate: 3600 };
}

export default function FaqIndexPage({ grouped, total }) {
  const canonicalUrl = `${SITE_URL}/faq/`;
  const title = `Co-Ownership Buyer's Q&A | Co-Ownership Property`;
  const description = `Independent answers to the most-asked questions about fractional and co-ownership of luxury second homes. ${total} questions covered, updated regularly.`;

  const orderedCategories = CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length > 0);

  const collectionGraph = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonicalUrl + "#collection",
    "url": canonicalUrl,
    "name": title,
    "description": description,
    "inLanguage": "en",
    "isPartOf": { "@id": SITE_URL + "/#website" },
    "publisher": { "@id": SITE_URL + "/#organization" },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": total,
      "itemListElement": orderedCategories.flatMap((cat, ci) =>
        grouped[cat].map((item, ii) => ({
          "@type": "ListItem",
          "position": ci * 100 + ii + 1,
          "url": `${SITE_URL}/faq/${item.slug}/`,
          "name": item.h1,
        }))
      ),
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/faq/`} />
        <link rel="alternate" hrefLang="es" href={`${SITE_URL}/es/preguntas/`} />
        <link rel="alternate" hrefLang="fr" href={`${SITE_URL}/fr/questions/`} />
        <link rel="alternate" hrefLang="de" href={`${SITE_URL}/de/fragen/`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/faq/`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionGraph) }} />
      </Head>

      <Header />

      <article className="faq-page compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">Buyer’s Q&A</p>
          <h1 className="compare-h1">Co-ownership buyer’s Q&amp;A</h1>
          <p className="compare-subtitle">Independent answers to the most-asked questions about fractional and co-ownership of luxury second homes. Updated regularly.</p>
          <p className="compare-meta">
            <span className="compare-byline">By <a href="/about-us/" rel="author">David Olsson</a></span>
            <span className="compare-wc-inline">{total} questions covered</span>
          </p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner">
            {orderedCategories.map(cat => (
              <div key={cat} className="faq-category-block">
                <h2 id={cat}>{CATEGORY_LABELS[cat] || cat}</h2>
                <ul>
                  {grouped[cat].map(item => (
                    <li key={item.slug}>
                      <a href={`/faq/${item.slug}/`}>{item.h1}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Newsletter />
      <Footer />
    </>
  );
}
