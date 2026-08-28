// components/LocaleHome.js
//
// The real COP homepage — video hero, press marquee, property carousel,
// explainer, destinations, testimonials, latest posts, FAQ — rendered for a
// translated locale. This exists because the six 2026 locales originally
// shipped a text-first landing page that looked nothing like the site
// (Dylan, 28 Aug: the locale homepage must be the normal homepage, translated).
//
// Markup and CSS classes mirror pages/index.js / pages/es/index.js exactly.
// All visible text comes from content/home/{locale}.json (shape documented by
// content/home/en-reference.json); anything structural — image paths, section
// order, destination keys — lives here so the copy files stay text-only.
//
// pages/{locale}/index.js wraps this with:
//   export const getStaticProps = localeHomeStaticProps('it');
//   export default function HomeIT(props){ return <LocaleHome locale="it" {...props} />; }
import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';
import { localeColumns, localizedField, numberLocale, routePath, propertyHref, ogLocaleFor } from '@/lib/i18n';

const SYM = { EUR: '€', USD: '$', GBP: '£' };
const SITE_URL = 'https://co-ownership-property.com';

// Destination panels: fixed structure, per-locale text. Links fall back to the
// English destination pages until per-locale destination pages exist.
const DEST_PANELS = [
  { key: 'spain',    outline: 'spain-line.webp',    img: 'dest-spain.webp' },
  { key: 'france',   outline: 'france-line.webp',   img: 'dest-france.webp' },
  { key: 'italy',    outline: 'italy-line.webp',    img: 'dest-italy-v2.webp' },
  { key: 'portugal', outline: 'portugal-line.webp', img: 'dest-portugal.webp' },
  { key: 'austria',  outline: 'austria-line.webp',  img: 'dest-austria.webp' },
  { key: 'england',  outline: 'england-line.webp',  img: 'dest-england.webp' },
  { key: 'sweden',   outline: 'sweden-line.webp',   img: 'dest-sweden.webp' },
  { key: 'germany',  outline: 'germany-line.webp',  img: 'dest-germany.webp' },
  { key: 'croatia',  outline: 'croatia-line.webp',  img: 'dest-croatia.webp' },
  { key: 'usa',      outline: 'usa-line.webp',      img: 'dest-usa-v2.webp' },
  { key: 'mexico',   outline: 'mexico-line.webp',   img: 'dest-mexico-v2.webp' },
];
const DEST_TAB_ORDER = ['spain','france','usa','italy','portugal','austria','england','sweden','germany','croatia','mexico'];

const TESTIMONIAL_IMAGES = [
  '/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg',
  '/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg',
  '/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg',
  '/wp-content/uploads/2026/02/Family-swimming-in-Mallorca.jpg',
];

const CARD_GAP = 20;

function getCardW() {
  if (typeof window === 'undefined') return 430;
  const vw = window.innerWidth;
  if (vw <= 480) return Math.min(vw - 40, 340);
  if (vw <= 768) return Math.min(vw - 48, 380);
  return 430;
}

function PropCarousel({ items, propertyCount, locale, copy }) {
  const allItems = [...items, { slug: '__viewall', isViewAll: true }];
  const N = allItems.length;
  const extended = [...allItems, ...allItems, ...allItems];
  const START = N;

  const [pos, setPos] = useState(START);
  const [cardW, setCardW] = useState(430);
  const trackRef = useRef(null);
  const snapping = useRef(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    setCardW(getCardW());
    const onResize = () => setCardW(getCardW());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const realIdx = ((pos % N) + N) % N;
  const displayNum = realIdx < items.length ? realIdx + 1 : items.length;

  const move = (dir) => {
    if (snapping.current) return;
    setPos(p => p + dir);
  };

  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t) { touchStartX.current = null; return; }
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) move(1); else move(-1);
  };

  const onTransitionEnd = () => {
    const current = pos;
    let newPos = null;
    if (current < N) newPos = current + N;
    else if (current >= 2 * N) newPos = current - N;

    if (newPos !== null) {
      snapping.current = true;
      const track = trackRef.current;
      if (track) {
        track.style.transition = 'none';
        void track.getBoundingClientRect();
        setPos(newPos);
        requestAnimationFrame(() => {
          if (track) track.style.transition = '';
          snapping.current = false;
        });
      }
    }
  };

  const cardStep = cardW + CARD_GAP;
  const offset = pos * cardStep;
  const nf = numberLocale(locale);
  const homesPath = routePath(locale, 'homes');

  return (
    <div className="pc-wrap">
      <div className="pc-outer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          ref={trackRef}
          className="pc-track"
          style={{ transform: `translateX(calc(-${offset}px + 50vw - ${cardW / 2}px))` }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((p, i) => {
            const isActive = i === pos;
            const copyNum = Math.floor(i / N);

            if (p.isViewAll) {
              return (
                <div
                  key={`viewall-${copyNum}`}
                  className={`pc-card pc-card-viewall${isActive ? ' pc-active' : ''}`}
                  onClick={() => { snapping.current = false; setPos(i); }}
                >
                  <div className="pc-img-wrap pc-viewall-img">
                    <div className="pc-viewall-inner">
                      <span className="pc-viewall-count">{propertyCount}</span>
                      <span className="pc-viewall-label">{copy.properties.counterLabel}</span>
                      <a href={homesPath} className="pc-viewall-btn" onClick={e => e.stopPropagation()}>{copy.properties.viewAllShort}</a>
                    </div>
                  </div>
                </div>
              );
            }

            const titleParts = p.title.includes('—') ? p.title.split('—') : null;
            const loc   = titleParts ? titleParts[0].trim() : `${p.region}${p.region && p.country ? ', ' : ''}${p.country}`;
            const label = titleParts ? titleParts.slice(1).join('—').trim() : p.title;
            const sym = SYM[p.currency] || p.currency;
            const eager = copyNum === 1 && (i - N) < 4;
            const href = propertyHref(p.slug, locale);

            return (
              <div
                key={`${p.slug}-${copyNum}`}
                className={`pc-card${isActive ? ' pc-active' : ''}`}
                onClick={() => {
                  if (isActive) {
                    window.location.href = href;
                  } else {
                    snapping.current = false;
                    setPos(i);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="pc-img-wrap">
                  <img
                    src={p.img || '/images/placeholder.jpg'}
                    alt={p.title}
                    className="pc-img"
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
                {isActive ? (
                  <div className="pc-panel">
                    <span className="pc-panel-loc">{loc}</span>
                    <span className="pc-panel-title">{label}</span>
                    <div className="pc-panel-stats">
                      {p.size && <span>{p.size.toLocaleString(nf)} m²</span>}
                    </div>
                    {p.price && (
                      <span className="pc-panel-price">{sym}{p.price.toLocaleString(nf)}</span>
                    )}
                    <a href={href} className="pc-panel-btn" onClick={e => e.stopPropagation()}>{copy.properties.viewProperty}</a>
                  </div>
                ) : (
                  <div className="pc-caption">
                    <span className="pc-caption-loc">{loc}</span>
                    <span className="pc-caption-title">{label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pc-nav">
        <button className="pc-btn" onClick={() => move(-1)} aria-label={copy.properties.prev}>&#8592;</button>
        <span className="pc-counter">{displayNum} / {propertyCount}</span>
        <button className="pc-btn" onClick={() => move(1)} aria-label={copy.properties.next}>&#8594;</button>
      </div>
    </div>
  );
}

export default function LocaleHome({ locale, copy, propertyCount, featuredProps, latestPosts }) {
  const [activeDest, setActiveDest] = useState('spain');
  const videoRef = useRef(null);
  const destTabsRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
    const retry = () => { if (!document.hidden) v.play().catch(() => {}); };
    document.addEventListener('visibilitychange', retry);
    return () => document.removeEventListener('visibilitychange', retry);
  }, []);

  const homesPath = routePath(locale, 'homes');
  const howPath = routePath(locale, 'howItWorks');
  const canonical = `${SITE_URL}/${locale}/`;

  return (
    <>
      <Head>
        <title>{copy.meta.title}</title>
        <meta name="description" content={copy.meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonical} />
        {hreflangLinks({ englishPath: '/' })}
        <meta property="og:title" content={copy.meta.ogTitle} />
        <meta property="og:description" content={copy.meta.ogDescription} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <video ref={videoRef} className="hero-video" autoPlay muted loop playsInline preload="auto" fetchPriority="high">
          <source src="/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-heading">
            <span className="hero-pre">{copy.hero.pre}</span>
            <em>{copy.hero.em}</em>
            <span className="hero-rule"></span>
            <span className="hero-post">{copy.hero.post}</span>
          </h1>
        </div>

        <div className="hero-bottom">
          <div className="hero-ctas">
            <a href={homesPath} className="hero-cta-primary">{copy.hero.ctaPrimary}</a>
            <a href={howPath} className="hero-cta-secondary">{copy.hero.ctaSecondary}</a>
          </div>
        </div>
      </section>

      {/* ===== PRESS MARQUEE ===== */}
      <div className="press-bar" role="region" aria-label={copy.pressLabel}>
        <div className="press-bar-header">
          <span className="press-bar-label">{copy.pressLabel}</span>
        </div>
        <div className="press-marquee-wrap">
          <div className="press-track-outer">
            {[false, true].map((hidden) => (
              <div className="press-track" key={hidden ? 'b' : 'a'} aria-hidden={hidden || undefined}>
                {[['press-times.png','The Times'],['press-ft.png','Financial Times'],['press-dailymail.png','Daily Mail'],['press-forbes.png','Forbes'],['press-express.png','Express'],['press-businessinsider.png','Business Insider'],['press-luxtravel.png','Luxury Travel Magazine'],['press-rollingstone.png','Rolling Stone']].map(([file, alt]) => (
                  <div className="press-logo-item" key={file}>
                    <Image src={`/wp-content/uploads/2025/11/${file}`} alt={hidden ? '' : alt} width={200} height={50} loading="eager" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PROPERTIES CAROUSEL ===== */}
      <section className="properties-section" id="properties">
        <h2 className="section-heading">{copy.properties.heading}</h2>
        <p className="section-subtitle">{copy.properties.subtitle}</p>

        <PropCarousel items={featuredProps} propertyCount={propertyCount} locale={locale} copy={copy} />

        <div className="pc-browse-all">
          <a href={homesPath} className="pc-browse-btn">{copy.properties.browseAll.replace('{n}', String(propertyCount))}</a>
        </div>
      </section>

      {/* ===== INTRODUCTION SECTION ===== */}
      {copy.intro && (
        <section className="intro-section">
          <p className="intro-text">{copy.intro.text}</p>
          <p className="intro-subtext">{copy.intro.subtext}</p>
        </section>
      )}

      {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
      <section className="explainer-section">
        <div className="explainer-intro">
          <h2>{copy.explainer.heading}</h2>
          <p>{copy.explainer.intro}</p>
        </div>
        <div className="explainer-grid">
          {copy.explainer.items.map((item, i) => (
            <div className="explainer-item" key={i}>
              <div className="explainer-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="explainer-divider"></div>
              <h3>{item.heading}</h3>
              <p dangerouslySetInnerHTML={{ __html: item.body }} />
              {item.stat && <p className="explainer-stat">{item.stat}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta-band">
        <p className="cta-band-eyebrow">{copy.ctaBand.eyebrow}</p>
        <h2 className="cta-band-heading" dangerouslySetInnerHTML={{ __html: copy.ctaBand.headingHtml }} />
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">{copy.ctaBand.sub}</p>
        <div className="cta-band-buttons">
          <a href="#speak-to-expert" className="cta-band-primary">{copy.ctaBand.primary}</a>
          <a href="#newsletter" className="cta-band-secondary">{copy.ctaBand.secondary}</a>
        </div>
      </section>

      {/* ===== DESTINATIONS SECTION ===== */}
      <section className="destinations-section" id="destinations">
        <h2 className="section-heading">{copy.destinations.heading}</h2>

        <div className="dest-tabs" ref={destTabsRef}>
          {DEST_TAB_ORDER.map((key) => (
            <button
              key={key}
              className={`dest-tab-btn${activeDest === key ? ' active' : ''}`}
              onClick={e => {
                setActiveDest(key);
                const strip = destTabsRef.current;
                const btn = e.currentTarget;
                if (strip) {
                  const stripCenter = strip.offsetWidth / 2;
                  const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
                  strip.scrollTo({ left: btnCenter - stripCenter, behavior: 'smooth' });
                }
              }}
            >{copy.destinations.tabs[key].label}</button>
          ))}
        </div>

        <div className="dest-panels">
          {DEST_PANELS.map(({ key, outline, img }) => (
            <div className={`dest-panel${activeDest === key ? ' active' : ''}`} id={`dest-${key}`} key={key}>
              <div className="dest-country-outline" style={{ backgroundImage: `url('/wp-content/uploads/${outline}')` }}></div>
              <div className="dest-img-wrap">
                <Image src={`/wp-content/uploads/${img}`} alt={copy.destinations.tabs[key].label} fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{ objectFit: 'cover', objectPosition: 'center 65%' }} />
              </div>
              <div className="dest-info">
                <div className="dest-info-name">{copy.destinations.tabs[key].label}</div>
                <p className="dest-info-desc">{copy.destinations.tabs[key].desc}</p>
                <a href={`/${key}-fractional-ownership-properties/`} className="dest-explore-btn">{copy.destinations.explore}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="testimonials-section" id="testimonials">
        <h2 className="section-heading">{copy.testimonials.heading}</h2>
        <div className="testimonials-grid">
          {copy.testimonials.cards.map((card, i) => (
            <div className="testimonial-card" key={i}>
              <Image src={TESTIMONIAL_IMAGES[i]} alt={card.author} width={120} height={120} className="testimonial-image" loading="lazy" />
              <p className="testimonial-quote">{card.quote}</p>
              <div className="testimonial-author">{card.author}</div>
              <div className="testimonial-location">{card.location}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== LATEST POSTS SECTION ===== */}
      <section className="latest-posts-section">
        <span className="lp-eyebrow">{copy.blog.eyebrow}</span>
        <h2 className="section-heading">{copy.blog.heading}</h2>
        <p className="lp-subtitle">{copy.blog.subtitle}</p>

        <div className="latest-posts-grid">
          {latestPosts.map(post => (
            <article key={post.slug} className="lp-card" onClick={() => { window.location = `/blog/${post.slug}/`; }}>
              <div className="lp-image-wrap">
                {post.heroImage && (
                  <Image src={post.heroImage} alt={post.title} fill className="lp-image" style={{ objectFit: 'cover' }} loading="lazy" sizes="(max-width: 768px) 100vw, 400px" />
                )}
              </div>
              <div className="lp-content">
                <span className="lp-date">{post.dateFormatted}</span>
                <h3 className="lp-title">{post.title}</h3>
                <a href={`/blog/${post.slug}/`} className="lp-read-more" onClick={e => e.stopPropagation()}>{copy.blog.readMore}</a>
              </div>
            </article>
          ))}
        </div>

        <div className="lp-footer">
          <a href="/all-our-blog/" className="lp-all-btn">{copy.blog.viewAll}</a>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section" id="faq">
        <p className="faq-eyebrow">{copy.faq.eyebrow}</p>
        <h2 className="faq-heading" dangerouslySetInnerHTML={{ __html: copy.faq.headingHtml }} />
        <p className="faq-subheading">{copy.faq.sub}</p>
        <div className="faq-list">
          {copy.faq.items.map((item, i) => (
            <details className="faq-item" key={i}>
              <summary className="faq-q"><span>{item.q}</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
              <div className="faq-a"><p>{item.a}</p></div>
            </details>
          ))}
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/index.js" strategy="afterInteractive" />
    </>
  );
}
