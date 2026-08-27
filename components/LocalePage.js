// components/LocalePage.js
//
// Data-driven renderer for a locale's standard pages — homepage, about,
// contact. Content lives in content/pages/{locale}/{page}.json; the markup and
// the CSS class names live here, once.
//
// This replaces the pattern where every locale's contact page was its own
// 90-line component with the same three sections and different prose. It uses
// the existing globals.css classes (page-hero, sec, trust-*, links-*,
// benefits-*, model-*, mid-cta) so a new locale looks identical to the mature
// ones without a line of new CSS.
//
// Content shape:
//   {
//     meta: { title, description, canonical, ogTitle?, ogDescription?,
//             ogImage?, hreflangKey?, noindex? },
//     hero: { eyebrow?, h1, h1em?, sub? },
//     sections: [ … see Section() below … ],
//     scripts: [ '/js/contact.js' ]          optional afterInteractive scripts
//   }
//
// Section types:
//   { type: 'trust',    eyebrow?, h2?, cards: [{ icon, h3, body: ['html'] }] }
//   { type: 'links',    eyebrow?, h2?, cards: [{ href, cat, title, desc, arrow }] }
//   { type: 'benefits', eyebrow?, h2?, cards: [{ icon, h3, body }] }
//   { type: 'steps',    eyebrow?, h2?, steps: [{ n, h3, body }] }
//   { type: 'prose',    eyebrow?, h2?, paras: ['html'] }
//   { type: 'properties', eyebrow?, h2?, sub?, ctaLabel?, ctaHref? }
//   { type: 'cta',      h2, sub?, buttons: [{ label, href, style }] }
import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';
import PropertyCard from '@/components/PropertyCard';
import { LOCALE_META, DEFAULT_LOCALE } from '@/lib/i18n';

const SITE = 'https://co-ownership-property.com';
const html = (s) => ({ __html: s });

function SectionHead({ eyebrow, h2, sub }) {
  return (
    <>
      {eyebrow && <p className="eyebrow" style={{ textAlign: 'center' }}>{eyebrow}</p>}
      {h2 && (
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: sub ? '0.6rem' : '0' }}>
          {h2}
        </h2>
      )}
      {sub && <p className="subtitle" style={{ textAlign: 'center' }} dangerouslySetInnerHTML={html(sub)} />}
    </>
  );
}

function Section({ section, properties }) {
  const s = section;
  switch (s.type) {
    case 'trust':
      return (
        <section className="trust-sec">
          <div className="trust-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} sub={s.sub} />
            <div className="trust-grid">
              {s.cards.map((c, i) => (
                <div className="trust-card" key={i}>
                  {c.icon && <div className="trust-icon" dangerouslySetInnerHTML={html(c.icon)} />}
                  <h3>{c.h3}</h3>
                  {(c.body || []).map((b, j) => <p key={j} dangerouslySetInnerHTML={html(b)} />)}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'benefits':
      return (
        <section className="sec benefits-sec">
          <div className="sec-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} sub={s.sub} />
            <div className="benefits-grid">
              {s.cards.map((c, i) => (
                <div className="benefit-card" key={i}>
                  {c.icon && <div className="benefit-icon" dangerouslySetInnerHTML={html(c.icon)} />}
                  <h3>{c.h3}</h3>
                  <p dangerouslySetInnerHTML={html(c.body)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'steps':
      return (
        <section className="sec model-sec">
          <div className="sec-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} sub={s.sub} />
            <div className="model-flow">
              {s.steps.map((st, i) => (
                <div className="model-step" key={i}>
                  <span className="model-num">{st.n}</span>
                  <h3>{st.h3}</h3>
                  <p dangerouslySetInnerHTML={html(st.body)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'links':
      return (
        <section className="links-sec">
          <div className="links-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} sub={s.sub} />
            <div className="links-grid">
              {s.cards.map((c, i) => (
                <a href={c.href} className="link-card" key={i}>
                  <span className="link-cat">{c.cat}</span>
                  <span className="link-title">{c.title}</span>
                  <span className="link-desc">{c.desc}</span>
                  <span className="link-arrow">{c.arrow} &rarr;</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case 'prose':
      return (
        <section className="sec intro-sec">
          <div className="sec-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} />
            <div className="intro-center">
              {(s.paras || []).map((p, i) => (
                <p key={i} className={i === 0 ? 'lead' : undefined} dangerouslySetInnerHTML={html(p)} />
              ))}
            </div>
          </div>
        </section>
      );

    case 'properties':
      if (!properties || properties.length === 0) return null;
      return (
        <section className="sec">
          <div className="sec-inner">
            <SectionHead eyebrow={s.eyebrow} h2={s.h2} sub={s.sub} />
            <div className="homes-grid">
              {properties.map((p, i) => <PropertyCard key={p.slug} property={p} priority={i < 3} />)}
            </div>
            {s.ctaHref && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <a href={s.ctaHref} className="btn btn-blue">{s.ctaLabel}</a>
              </p>
            )}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="mid-cta">
          <SectionHead h2={s.h2} sub={s.sub} />
          <div className="mid-cta-buttons">
            {(s.buttons || []).map((b, i) => (
              <a key={i} href={b.href} className={`btn ${b.style === 'gold' ? 'btn-gold' : 'btn-blue'}`}>{b.label}</a>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
}

export default function LocalePage({ locale = DEFAULT_LOCALE, doc, properties = [] }) {
  if (!doc) return null;
  const meta = doc.meta || {};
  const ogLocale = (LOCALE_META[locale] || {}).ogLocale || 'en_GB';
  const canonical = `${SITE}${meta.canonical}`;

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonical} />
        {meta.noindex && <meta name="robots" content="noindex,follow" />}
        {meta.hreflangKey ? hreflangLinks({ englishPath: meta.hreflangKey }) : null}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={meta.ogTitle || meta.title} />
        <meta property="og:description" content={meta.ogDescription || meta.description} />
        {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Header />

      {doc.hero && (
        <section className="page-hero">
          {doc.hero.eyebrow && <p className="eyebrow">{doc.hero.eyebrow}</p>}
          <h1>
            {doc.hero.h1}
            {doc.hero.h1em && <> <em>{doc.hero.h1em}</em></>}
          </h1>
          {doc.hero.sub && <p className="subtitle" dangerouslySetInnerHTML={html(doc.hero.sub)} />}
        </section>
      )}

      {(doc.sections || []).map((s, i) => (
        <Section key={i} section={s} properties={properties} />
      ))}

      <Newsletter />
      <ExpertForm />
      <Footer />
      {(doc.scripts || []).map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}

// The getStaticProps factories for these pages live in
// lib/locale-page-data.js — they need `fs`, which cannot be resolved from a
// component module because component modules are part of the client bundle.
