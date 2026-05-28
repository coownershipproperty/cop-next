/**
 * pages/glossary.js
 *
 * Single-page glossary of fractional co-ownership terms — legal structures,
 * tax terms, operational mechanics, residency rules, property terminology.
 *
 * Architecture: lib/glossary-terms.json holds the term data (slug, term,
 * category, definition, explanation, optional sameAs). The page renders
 * an alphabetical-by-category layout with anchor IDs for deep-linking
 * (#llc, #sci, #ifi, etc.).
 *
 * Schema: WebPage + DefinedTermSet (containing all 50 DefinedTerm entries
 * with @id cross-references for entity reconciliation) + BreadcrumbList.
 * Each DefinedTerm has name + description + inDefinedTermSet pointing back
 * at the canonical glossary @id, plus optional sameAs to Wikipedia where
 * the term has a clear Wikipedia entry.
 *
 * AI engines (Perplexity especially) lift DefinedTerm entries verbatim
 * for definitional queries. Each entry is sized as a self-contained
 * passage to maximise extraction.
 */

import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const SITE_URL = 'https://co-ownership-property.com';
const PAGE_URL = `${SITE_URL}/glossary/`;
const GLOSSARY_ID = `${PAGE_URL}#glossary-termset`;

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'glossary-terms.json'), 'utf-8'));
  return { props: { data }, revalidate: 3600 };
}

export default function Glossary({ data }) {
  const { intro, categories, terms } = data;

  // Sort terms alphabetically within each category for stable rendering
  const termsByCategory = {};
  categories.forEach(c => { termsByCategory[c.id] = []; });
  [...terms].sort((a, b) => a.term.localeCompare(b.term)).forEach(t => {
    if (termsByCategory[t.category]) termsByCategory[t.category].push(t);
  });

  // ── Schema.org @graph ────────────────────────────────────────────────────
  const graph = [
    {
      "@type": "WebPage",
      "@id": PAGE_URL + "#webpage",
      "url": PAGE_URL,
      "name": "Glossary of Co-Ownership Terms | Co-Ownership Property",
      "description": "A working glossary of the legal, tax, operational, and structural terms that come up when buying a fractional co-ownership share — particularly across European jurisdictions.",
      "inLanguage": "en",
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": SITE_URL + "/#organization" },
      "mainEntity": { "@id": GLOSSARY_ID },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": PAGE_URL + "#breadcrumb" },
    },
    {
      "@type": "DefinedTermSet",
      "@id": GLOSSARY_ID,
      "name": "Fractional Co-Ownership Glossary",
      "description": intro,
      "url": PAGE_URL,
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
      ...(t.sameAs ? { "sameAs": t.sameAs } : {}),
    })),
    {
      "@type": "BreadcrumbList",
      "@id": PAGE_URL + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": "Glossary", "item": PAGE_URL },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Glossary of Co-Ownership Terms | Co-Ownership Property</title>
        <meta name="description" content="Working glossary of fractional co-ownership terms across legal structures, tax, operational mechanics, residency rules, and property terminology. 50 defined terms covering LLC, SCI, SL, GmbH & Co. KG, IFI, Patrimonio, IBI, supported resale, ROFR, NIE, Schengen 90/180, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Glossary of Co-Ownership Terms" />
        <meta property="og:description" content="Working glossary of fractional co-ownership terms across legal structures, tax, operational mechanics, residency rules, and property terminology." />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:type" content="article" />
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
          <p className="compare-eyebrow">Reference Guide</p>
          <h1 className="compare-h1">Co-Ownership Glossary</h1>
          <p className="compare-subtitle">{intro}</p>
          <p className="compare-meta">
            <span className="compare-wc-inline">{terms.length} defined terms · {categories.length} categories</span>
          </p>
        </section>

        <section className="glossary-body">
          <div className="glossary-inner">
            {/* Category navigation */}
            <nav className="glossary-nav" aria-label="Glossary categories">
              {categories.map(cat => (
                <a key={cat.id} href={`#${cat.id}`} className="glossary-nav-pill">{cat.name}</a>
              ))}
            </nav>

            {/* Term list by category */}
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
                          See also: <a href={t.sameAs} rel="noopener" target="_blank">{t.sameAs.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
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
          <h3>Browse properties</h3>
          <p>Co-Ownership Property lists fractional shares across Europe, the USA, and Mexico. Browse inventory across partner operators in a single marketplace.</p>
          <div className="compare-cta-buttons">
            <a href="/our-homes/" className="primary">Browse all properties</a>
            <a href="/how-it-works/" className="ghost">How it works</a>
          </div>
        </section>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
