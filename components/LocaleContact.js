// components/LocaleContact.js — the real contact page for translated locales.
// Markup mirrors pages/es/contacto.js; text comes from
// content/contact/{locale}.json (shape: content/contact/en-reference.json).
import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';
import { routePath, ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

export default function LocaleContact({ locale, copy }) {
  const canonical = `${SITE_URL}${routePath(locale, 'contact')}`;
  return (
    <>
      <Head>
        <title>{copy.meta.title}</title>
        <meta name="description" content={copy.meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        {hreflangLinks({ englishPath: '/contact' })}
        <meta property="og:title" content={copy.meta.ogTitle} />
        <meta property="og:description" content={copy.meta.ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">{copy.hero.eyebrow}</p>
        <h1 dangerouslySetInnerHTML={{ __html: copy.hero.headingHtml }} />
        <p className="subtitle">{copy.hero.subtitle}</p>
      </section>

      <section className="trust-sec">
        <div className="trust-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>{copy.trust.eyebrow}</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: '0'}}>{copy.trust.heading}</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">&#x2709;</div>
              <h3>{copy.trust.card1.h}</h3>
              <p>{copy.trust.card1.pTop}<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />{copy.trust.card1.pBottom}</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x23F0;</div>
              <h3>{copy.trust.card2.h}</h3>
              <p>{copy.trust.card2.p}</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x2713;</div>
              <h3>{copy.trust.card3.h}</h3>
              <p>{copy.trust.card3.p}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="links-sec">
        <div className="links-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>{copy.links.eyebrow}</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '0'}}>{copy.links.heading}</h2>
          <div className="links-grid">
            {[
              { card: copy.links.card1, href: routePath(locale, 'howItWorks') },
              { card: copy.links.card2, href: routePath(locale, 'homes') },
              { card: copy.links.card3, href: '/all-our-blog/' },
            ].map(({ card, href }, i) => (
              <a href={href} className="link-card" key={i}>
                <span className="link-cat">{card.cat}</span>
                <span className="link-title">{card.title}</span>
                <span className="link-desc">{card.desc}</span>
                <span className="link-arrow">{card.arrow}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}
