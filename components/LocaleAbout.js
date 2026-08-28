// components/LocaleAbout.js — the real /about-us page for translated locales.
// Markup mirrors pages/es/quienes-somos.js; text comes from
// content/about/{locale}.json (shape: content/about/en-reference.json).
import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';
import { routePath, ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';
const PRESS = ['press-times.png','press-ft.png','press-dailymail.png','press-forbes.png','press-express.png','press-businessinsider.png','press-luxtravel.png','press-rollingstone.png'];
const PRESS_ALT = ['The Times','Financial Times','Daily Mail','Forbes','Express','Business Insider','Luxury Travel Magazine','Rolling Stone'];

export default function LocaleAbout({ locale, copy }) {
  const canonical = `${SITE_URL}${routePath(locale, 'aboutUs')}`;
  return (
    <>
      <Head>
        <title>{copy.meta.title}</title>
        <meta name="description" content={copy.meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        {hreflangLinks({ englishPath: '/about-us' })}
        <meta property="og:title" content={copy.meta.ogTitle} />
        <meta property="og:description" content={copy.meta.ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">{copy.hero.eyebrow}</p>
        <h1 dangerouslySetInnerHTML={{ __html: copy.hero.headingHtml }} />
        <p className="subtitle">{copy.hero.subtitle}</p>
      </section>

      <div className="press-bar" role="region" aria-label={copy.pressLabel}>
        <div className="press-bar-header"><span className="press-bar-label">{copy.pressLabel}</span></div>
        <div className="press-marquee-wrap"><div className="press-track-outer">
          {[false, true].map(hidden => (
            <div className="press-track" key={hidden ? 'b' : 'a'} aria-hidden={hidden || undefined}>
              {PRESS.map((file, i) => (
                <div className="press-logo-item" key={file}><Image src={`/wp-content/uploads/2025/11/${file}`} alt={hidden ? '' : PRESS_ALT[i]} width={200} height={50} /></div>
              ))}
            </div>
          ))}
        </div></div>
      </div>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">{copy.intro.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.intro.headingHtml }} />
          <p>{copy.intro.p1}</p>
          <p>{copy.intro.p2}</p>
        </div>
      </section>

      <section className="sec team-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">{copy.team.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.team.headingHtml }} />

          <div className="team-grid">
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>David Olsson</h3>
              <span className="team-role">{copy.team.david.role}</span>
              <p className="team-bio">{copy.team.david.bio}</p>
            </div>
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>Dylan Olsson</h3>
              <span className="team-role">{copy.team.dylan.role}</span>
              <p className="team-bio">{copy.team.dylan.bio}</p>
            </div>
            <div className="poppy-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <div>
                <h3 style={{color: '#fff'}}>Poppy</h3>
                <span className="team-role">{copy.team.poppy.role}</span>
                <p className="team-bio">{copy.team.poppy.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec story-sec">
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-img">
              <Image src="/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" alt="" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="story-text">
              <p className="eyebrow">{copy.story1.eyebrow}</p>
              <h2 dangerouslySetInnerHTML={{ __html: copy.story1.headingHtml }} />
              <p>{copy.story1.p1}</p>
              <p>{copy.story1.p2}</p>
              <blockquote>{copy.story1.quote}
                <span className="quote-attr">{copy.story1.quoteAttr}</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-text">
              <p className="eyebrow">{copy.story2.eyebrow}</p>
              <h2 dangerouslySetInnerHTML={{ __html: copy.story2.headingHtml }} />
              <p>{copy.story2.p1}</p>
              <p>{copy.story2.p2}</p>
              <p>{copy.story2.p3}</p>
              <blockquote>{copy.story2.quote}</blockquote>
            </div>
            <div className="story-img">
              <Image src="/wp-content/uploads/2025/11/ibiza-villa.jpg" alt="" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section style={{background: 'var(--blue)', padding: '60px 3rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>{copy.cta.line}</p>
        <div style={{display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <a href="#speak-to-expert" style={{display: 'inline-block', padding: '14px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'var(--warm-gold)', color: '#fff', textDecoration: 'none'}}>{copy.cta.primary}</a>
          <a href="#newsletter" style={{display: 'inline-block', padding: '13px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none'}}>{copy.cta.secondary}</a>
        </div>
      </section>

      <section className="sec testi-sec" style={{background: 'var(--cream-bg)'}}>
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">{copy.testi.eyebrow}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.testi.headingHtml }} />

          <div className="testi-grid">
            {copy.testi.cards.map((card, i) => (
              <div className="testi-card" key={i}>
                <div className="testi-photo"><Image src={['/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg','/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg','/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg','/wp-content/uploads/2026/02/Family-swimming-in-Mallorca-300x300.jpg'][i]} alt={card.name} fill style={{objectFit:"cover"}} sizes="90px" /></div>
                <div className="testi-name">{card.name}</div>
                <span className="testi-loc">{card.loc}</span>
                <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="testi-quote">{card.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/about-us.js" strategy="afterInteractive" />
    </>
  );
}
