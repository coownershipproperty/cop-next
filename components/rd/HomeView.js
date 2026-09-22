// components/rd/HomeView.js
//
// The homepage. One component, ten languages.
//
// Until 22 Sep 2026 there were three homepages: pages/index.js (English, and
// the only one that got the redesign), components/LocaleHome.js (it/nl/pt/sv/
// da/no, mirroring the PREVIOUS English design), and three hand-written
// ~710-line pages for es/fr/de. So the redesign shipped to 20% of the site:
// 3,118 of 3,965 indexed URLs still served the old dark gold design, and a
// Spanish or German visitor saw a different company from an English one.
//
// Everything visible here comes from content/home/{locale}.json. Anything
// structural — section order, image paths, destination keys — lives in this
// file, so the copy files stay text-only and a translator never sees JSX.
//
// Nav, Footer, Newsletter, ExpertForm and PropertyCard all read the locale
// from the URL themselves, so they need nothing passed to them. The pieces
// that do need it take `locale` explicitly: the newsletter signup posts it
// with the address, and every internal link is built with routePath().
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Nav from '@/components/rd/Nav';
import Destinations from '@/components/rd/Destinations';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import PropertyCard from '@/components/PropertyCard';
import ExpertForm from '@/components/ExpertForm';
import HoneypotField from '@/components/HoneypotField';
import hreflangLinks from '@/components/HreflangLinks';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { saveUser } from '@/lib/savedUser';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { orderForCountry, countryFromCookie } from '@/lib/geoOrder';
import { routePath, localePrefix, ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

function NewsletterSignup({ locale, copy }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const inputRef = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (status === 'sending') return;
    const email = inputRef.current.value.trim();
    setStatus('sending');
    try {
      const response = await fetch('/api/newsletter/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, [HONEYPOT_FIELD]: event.currentTarget.elements[HONEYPOT_FIELD]?.value || '' }),
      });
      const data = await response.json();
      setStatus(response.ok && data.ok ? 'success' : 'error');
      if (response.ok && data.ok) {
        saveUser({ email });
        trackConversion('sign_up', 'Lead', { method: 'newsletter', locale });
        track('newsletter_signup', { locale });
      }
    } catch { setStatus('error'); }
  }
  return <div className="rd-hero-signup">
    {status === 'success' ? <div className="rd-hero-signup-success" role="status">{copy.success}</div> : <>
      <form className={`rd-hero-signup-field${open ? ' is-open' : ''}`} onSubmit={submit}>
        <HoneypotField />
        <input ref={inputRef} type="email" name="email" autoComplete="email" inputMode="email" aria-label={copy.emailAria} placeholder={copy.placeholder} required tabIndex={open ? 0 : -1} disabled={status === 'sending'} />
        {open && <button type="submit" aria-label={copy.subscribeAria} disabled={status === 'sending'}>{status === 'sending' ? '…' : '→'}</button>}
        {!open && <button className="rd-hero-signup-open" type="button" onClick={() => { setOpen(true); inputRef.current.focus(); }}>{copy.open}</button>}
      </form>
      {status === 'error' && <p role="alert">{copy.error}</p>}
    </>}
  </div>;
}

function HeroVideo({ poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    const small = window.matchMedia('(max-width: 760px)').matches;
    video.poster = small ? '/redesign/cop-home-mobile-first-frame.jpg' : poster;

    // Phones get the poster frame and nothing else. The loop is 4.8 MB — on a
    // phone that was the whole page weight (5.0 MB of 5.05 MB, measured
    // 22 Sep 2026) for a background that is blurred behind the headline anyway.
    // Data Saver and metered connections are treated the same way on any screen.
    const conn = navigator.connection || {};
    const thrifty = conn.saveData === true || /^(slow-)?2g$/.test(conn.effectiveType || '');
    if (small || thrifty) { setVideoOff(true); return; }

    video.src = '/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduced.matches) video.play().catch(() => {});
    const onPreference = () => { if (reduced.matches) video.pause(); };
    reduced.addEventListener('change', onPreference);
    return () => reduced.removeEventListener('change', onPreference);
  }, [poster]);
  return <>
    <video ref={videoRef} muted loop playsInline preload="metadata" poster={poster} aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}>
    </video>
    {!videoOff && <button type="button" aria-label={playing ? 'Pause background video' : 'Play background video'} onClick={() => { const v=videoRef.current; if(v.paused) v.play().catch(() => {}); else v.pause(); }} style={{position:'absolute',right:20,bottom:20,zIndex:5,width:40,height:40,borderRadius:'50%',border:'1px solid #ffffff60',background:'#13121099',color:'#fff',cursor:'pointer'}}>{playing ? 'Ⅱ' : '▶'}</button>}
  </>;
}

// The FAQ answers are also the FAQPage structured data, so the emphasis is
// applied to the rendered text only and never to the JSON-LD. Each locale
// lists the phrases worth bolding in its own copy file; a locale that lists
// none simply gets unemphasised answers.
function FaqAnswer({ text, emphasise }) {
  if (!emphasise?.length) return text;
  const escaped = emphasise.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  return text.split(pattern).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

function interpolate(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (values[key] ?? `{${key}}`));
}

export default function HomeView({
  locale = 'en',
  copy,
  propertyCount = 0,
  featuredProps = [],
  latestPosts = [],
  destinations = [],
}) {
  // Server-rendered order is the editorial one; reorder after mount from the
  // cop_country cookie so crawlers see the canonical page. See lib/geoOrder.js.
  const [featured, setFeatured] = useState(featuredProps);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const country = countryFromCookie(document.cookie);
    if (!country) return;
    const ordered = orderForCountry(featuredProps, country);
    if (ordered.length && ordered.some((p, i) => p.slug !== featuredProps[i]?.slug)) setFeatured(ordered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredProps]);

  const homes = featured.slice(0, 6);
  const prefix = localePrefix(locale);
  const canonical = `${SITE_URL}${prefix}/`;
  const homesHref = routePath(locale, 'homes') || '/our-homes/';
  const howHref = routePath(locale, 'howItWorks') || '/how-it-works/';
  const blogHref = routePath(locale, 'blog');
  const counts = { count: propertyCount };

  return (
    <>
      <Head>
        <title>{copy.meta.title}</title>
        {hreflangLinks({ englishPath: '/' })}
        <meta name="description" content={interpolate(copy.meta.description, counts)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.meta.ogTitle || copy.meta.title} />
        <meta property="og:description" content={interpolate(copy.meta.ogDescription || copy.meta.description, counts)} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              "name": "Co-Ownership Property",
              "legalName": "PREMPROPERTY SL",
              "taxID": "B93358489",
              "url": SITE_URL,
              "logo": "https://co-ownership-property.com/wp-content/uploads/2025/10/COP-Logo-Large.png",
              "description": "The independent guide to luxury fractional ownership across Europe & the USA.",
              "contactPoint": { "@type": "ContactPoint", "email": "info@co-ownership-property.com", "contactType": "customer service" },
              "sameAs": [
                "https://www.linkedin.com/company/co-ownership-properties/",
                "https://www.facebook.com/profile.php?id=61582108534258",
                "https://x.com/fractional_guru"
              ]
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              "name": "Co-Ownership Property",
              "url": SITE_URL,
              "publisher": { "@id": `${SITE_URL}/#organization` },
              "inLanguage": locale
            },
            {
              "@type": "FAQPage",
              "mainEntity": (copy.faq.items || []).map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
            }
          ]
        }) }} />
      </Head>

      <div className="rd rd-home rd-home-light">
        <Nav />

        {/* ── Hero ── */}
        <section className="rd-hero" aria-label={copy.hero.regionLabel || 'Introduction'}>
          <div className="rd-hero-media">
            <HeroVideo poster="/redesign/cop-home-first-frame.jpg" />
          </div>
          <div className="rd-hero-shade" />
          <div className="rd-hero-inner">
            <div className="rd-hero-copy">
              <h1 className="rd-h1">
                {copy.hero.pre}{copy.hero.pre ? ' ' : ''}
                <span className="hero-ownership-accent">{copy.hero.em}</span>
                {copy.hero.post ? ` ${copy.hero.post}` : ''}
              </h1>
              <p className="rd-lead">{copy.hero.lead}</p>
              <div className="rd-btn-row">
                <Link href={homesHref} className="rd-btn">{copy.hero.ctaPrimary}</Link>
                <Link href={howHref} className="rd-btn rd-btn-ghost">{copy.hero.ctaSecondary}</Link>
              </div>
            </div>
            <aside className="rd-hero-proof rd-hero-newsletter" aria-label={copy.heroNewsletter.regionLabel || 'Newsletter'}>
              <div className="rd-newsletter-copy">
                <span className="rd-kicker">{copy.heroNewsletter.kicker}</span>
                <h2>{copy.heroNewsletter.heading}</h2>
                <p>{copy.heroNewsletter.sub}</p>
              </div>
              <NewsletterSignup locale={locale} copy={copy.heroNewsletter} />
            </aside>
          </div>
        </section>

        {/* ── Featured homes ── */}
        <section className="rd-section" id="properties" aria-labelledby="h-homes">
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">{copy.featured.kicker}</span>
                <h2 className="rd-h2" id="h-homes">{copy.featured.heading}</h2>
                <p className="rd-lead">{interpolate(copy.featured.lead, counts)}</p>
              </div>
              <Link href={homesHref} className="rd-btn-link">{interpolate(copy.featured.allLink, counts)}</Link>
            </div>
            <div className="rd-grid-3 rd-cards rd-editorial-cards">
              {homes.map((p, i) => (
                <div key={p.slug} data-rv={String(i % 3 + 1)}><PropertyCard property={p} editorial /></div>
              ))}
            </div>
            <Link href={homesHref} className="rd-featured-see-all">{copy.featured.seeAll} <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        {/* ── Destinations ── */}
        {destinations.length > 0 && (
          <section className="rd-section" id="destinations" aria-labelledby="h-dest" style={{ paddingTop: 0 }}>
            <div className="rd-container">
              <div className="rd-head-row" data-rv>
                <div>
                  <span className="rd-kicker">{copy.destinations.kicker}</span>
                  <h2 className="rd-h2" id="h-dest">{copy.destinations.heading}</h2>
                  <p className="rd-lead">{copy.destinations.lead}</p>
                </div>
                <Link href={homesHref} className="rd-btn-link">{copy.destinations.allLink}</Link>
              </div>
              <Destinations destinations={destinations} tabs={copy.destinations.tabs} exploreLabel={copy.destinations.exploreAria || 'Explore homes in'} copy={copy.destinations} />
            </div>
          </section>
        )}

        {/* ── Values ── */}
        <section className="rd-section rd-values-chapter" aria-labelledby="h-values" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-values" data-rv>
              <div className="rd-values-media"><Image src="/redesign/usa-palm-desert.jpg" alt="" fill sizes="100vw" loading="lazy" /></div>
              <div className="rd-values-inner">
                <div className="rd-values-head">
                  <span className="rd-kicker">{copy.values.kicker}</span>
                  <h2 className="rd-h2" id="h-values">
                    <span className="values-title-desktop">{copy.values.heading}</span>
                    <span className="values-title-mobile">{copy.values.headingMobile || copy.values.kicker}</span>
                  </h2>
                  <p className="rd-lead">{copy.values.lead}</p>
                </div>
                <div className="rd-values-grid">
                  {(copy.values.items || []).map((v, i) => (
                    <div className="rd-value" key={v.n || i} data-rv={String(i + 1)}>
                      <b>{v.n || String(i + 1).padStart(2, '0')}</b>
                      <h3>{v.h}</h3>
                      <p>{v.p}</p>
                    </div>
                  ))}
                </div>
                <div className="rd-btn-row">
                  <Link href={howHref} className="rd-btn rd-btn-ghost">{copy.values.ctaHowItWorks}</Link>
                  <a href="#speak-to-expert" className="rd-btn rd-btn-ghost" onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    const section = document.getElementById('speak-to-expert');
                    if (!section) return;
                    event.preventDefault();
                    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                    window.history.replaceState(window.history.state, '', '#speak-to-expert');
                  }}>{copy.values.ctaExpert}</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Latest insights ──
            Only where the locale has its own blog route. it/nl/pt/sv/da/no do
            not: linking them to /blog/ was three English headlines that drop
            the reader out of their language with no way back but the back
            button. An absent section beats an exit. (16 Sep 2026) */}
        {blogHref && latestPosts?.length > 0 && (
          <section className="rd-section" aria-labelledby="h-posts" style={{ paddingTop: 0 }}>
            <div className="rd-container">
              <div className="rd-head-row" data-rv>
                <div>
                  <span className="rd-kicker">{copy.blog.kicker}</span>
                  <h2 className="rd-h2" id="h-posts">{copy.blog.heading}</h2>
                </div>
                <Link href={blogHref} className="rd-btn-link">{copy.blog.allLink}</Link>
              </div>
              <div className="rd-grid-3">
                {latestPosts.map((post, i) => (
                  <Link key={post.slug} href={`${prefix}/${routeSegment(locale)}/${post.slug}/`} className="rd-card rd-post" data-rv={String(i + 1)}>
                    <div className="rd-media">
                      {post.heroImage && <Image src={post.heroImage} alt={post.title} fill sizes="(max-width: 900px) 50vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />}
                    </div>
                    <div className="rd-post-body">
                      <div className="rd-post-date">{post.category ? `${post.category} · ` : ''}{post.dateFormatted}</div>
                      <div className="rd-post-title">{post.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section className="rd-section" id="faq" aria-labelledby="h-faq" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">{copy.faq.kicker}</span>
                <h2 className="rd-h2" id="h-faq">{copy.faq.heading}</h2>
              </div>
            </div>
            <div className="rd-faq" data-rv>
              {(copy.faq.items || []).map((f, i) => (
                <details key={i}>
                  <summary>{f.q}</summary>
                  <p><FaqAnswer text={f.a} emphasise={copy.faq.emphasise} /></p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section id="newsletter" className="rd-section" aria-label="Newsletter" style={{ paddingTop: 0, scrollMarginTop: 110 }}>
          <div className="rd-container">
            <div className="rd-news" data-rv>
              <div className="rd-news-media"><img src="/redesign/hero-costa-azul.webp" alt="" loading="lazy" /></div>
              <div className="rd-news-body"><Newsletter editorial /></div>
            </div>
          </div>
        </section>

        {/* ── Enquiry ── */}
        <section className="rd-section" aria-label="Enquiry" style={{ paddingTop: 0 }}>
          <div className="rd-container rd-enquiry-editorial" data-rv>
            <ExpertForm />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

// Blog post URLs use the blogPost slug, which differs from the blog index
// slug in English ('blog' vs 'all-our-blog').
function routeSegment(locale) {
  const path = routePath(locale, 'blogPost');
  if (!path) return 'blog';
  return path.replace(/^\/|\/$/g, '').split('/').pop();
}
