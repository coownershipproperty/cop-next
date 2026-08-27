// components/PillarPage.js
//
// Renders a locale's pillar page — the long-form, keyword-dense explainer that
// anchors that language's whole cluster — from a JSON document in
// content/pillars/{locale}.json. Markup and schema live here; the argument
// lives in the content file.
//
// This exists because the ES, FR and DE pillars were each hand-written page
// components with the same structure and different prose. Adding six more
// languages that way would have meant six more 500-line files to keep in sync.
//
// The structure is the "definitive guide" shape that ranks for head terms:
// long-form, a table of contents, question-shaped sub-headings, an explicit
// comparison table against that language's timeshare category, and FAQPage
// schema so the questions are eligible for rich results.
//
// Content shape — see content/pillars/es.json for a worked example:
//   {
//     meta:  { title, description, canonical, ogTitle, ogDescription,
//              hreflangKey?, updated? },
//     eyebrow, h1, lead,                       // lead may contain inline HTML
//     tocHeading, sections: [
//       { id, h2, blocks: [
//           { p: 'html' }            paragraph (inline HTML allowed)
//           { h3: 'text' }           sub-heading
//           { ul: ['html', …] }      bullet list
//           { steps: ['html', …] }   numbered process list
//           { table: { head: [...], rows: [[...]] } }
//           { note: 'html' }         highlighted aside
//       ] } ],
//     faq: { heading, id, items: [{ q, a }] },  // a is plain text (goes in schema)
//     cta:  { h2, p, primary: {label, href}, secondary: {label, href} }
//   }
//
// Every string is already in the target language. Nothing here translates.
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import hreflangLinks from '@/components/HreflangLinks';
import { LOCALE_META, DEFAULT_LOCALE } from '@/lib/i18n';

const SITE = 'https://co-ownership-property.com';

function html(s) {
  return { __html: s };
}

function Block({ block }) {
  if (block.p) return <p dangerouslySetInnerHTML={html(block.p)} />;
  if (block.h3) return <h3>{block.h3}</h3>;
  if (block.note) return <p className="cop-pillar-note" dangerouslySetInnerHTML={html(block.note)} />;
  if (block.ul) {
    return (
      <ul>
        {block.ul.map((li, i) => <li key={i} dangerouslySetInnerHTML={html(li)} />)}
      </ul>
    );
  }
  if (block.steps) {
    return (
      <ol className="cop-pillar-steps">
        {block.steps.map((li, i) => <li key={i} dangerouslySetInnerHTML={html(li)} />)}
      </ol>
    );
  }
  if (block.table) {
    return (
      <div className="compare-table-scroll">
        <table className="cop-pillar-table">
          <thead>
            <tr>{block.table.head.map((h, i) => <th key={i} dangerouslySetInnerHTML={html(h)} />)}</tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  j === 0
                    ? <th key={j} scope="row" dangerouslySetInnerHTML={html(cell)} />
                    : <td key={j} dangerouslySetInnerHTML={html(cell)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

export default function PillarPage({ locale = DEFAULT_LOCALE, doc }) {
  if (!doc) return null;
  const meta = doc.meta || {};
  const ogLocale = (LOCALE_META[locale] || {}).ogLocale || 'en_GB';
  const canonical = `${SITE}${meta.canonical}`;

  const faqItems = (doc.faq && doc.faq.items) || [];
  const faqSchema = faqItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  // Article schema: pillar pages are the pages we most want cited by AI search,
  // and an explicit inLanguage + dateModified helps them be read as current.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.h1,
    description: meta.description,
    inLanguage: (LOCALE_META[locale] || {}).htmlLang || locale,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Co-Ownership Property', url: SITE },
    publisher: { '@type': 'Organization', name: 'Co-Ownership Property', url: SITE },
    ...(meta.updated ? { dateModified: meta.updated } : {}),
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonical} />
        {meta.hreflangKey ? hreflangLinks({ englishPath: meta.hreflangKey }) : null}
        <meta property="og:type" content="article" />
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={meta.ogTitle || meta.title} />
        <meta property="og:description" content={meta.ogDescription || meta.description} />
        {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={html(JSON.stringify(articleSchema))} />
        {faqSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={html(JSON.stringify(faqSchema))} />
        )}
      </Head>

      <Header />

      <main className="cop-pillar">
        <article className="cop-pillar-inner">
          <header className="cop-pillar-header">
            {doc.eyebrow && <p className="cop-pillar-eyebrow">{doc.eyebrow}</p>}
            <h1>{doc.h1}</h1>
            {doc.lead && <p className="cop-pillar-lead" dangerouslySetInnerHTML={html(doc.lead)} />}
          </header>

          {doc.sections && doc.sections.length > 0 && (
            <nav className="cop-pillar-toc" aria-label={doc.tocHeading}>
              <h2>{doc.tocHeading}</h2>
              <ol>
                {doc.sections.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`}>{s.tocLabel || s.h2}</a></li>
                ))}
                {faqItems.length > 0 && doc.faq.id && (
                  <li><a href={`#${doc.faq.id}`}>{doc.faq.heading}</a></li>
                )}
              </ol>
            </nav>
          )}

          {(doc.sections || []).map((s) => (
            <section id={s.id} key={s.id}>
              <h2>{s.h2}</h2>
              {(s.blocks || []).map((b, i) => <Block key={i} block={b} />)}
            </section>
          ))}

          {faqItems.length > 0 && (
            <section id={doc.faq.id}>
              <h2>{doc.faq.heading}</h2>
              {faqItems.map((f, i) => (
                <div key={i}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </section>
          )}

          {doc.cta && (
            <section className="cop-pillar-cta">
              <h2>{doc.cta.h2}</h2>
              {doc.cta.p && <p dangerouslySetInnerHTML={html(doc.cta.p)} />}
              <p>
                {doc.cta.primary && (
                  <a href={doc.cta.primary.href} className="cop-cta-primary">{doc.cta.primary.label}</a>
                )}
                {doc.cta.secondary && (
                  <a href={doc.cta.secondary.href} className="cop-cta-secondary">{doc.cta.secondary.label}</a>
                )}
              </p>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}

// The getStaticProps factories for these pages live in
// lib/locale-page-data.js — they need `fs`, which cannot be resolved from a
// component module because component modules are part of the client bundle.
