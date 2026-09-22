// components/rd/AboutView.js
//
// The about page, in any language. Same split as components/rd/HomeView.js:
// structure here, words in content/about/{locale}.json.
//
// Before 22 Sep 2026 the English page was redesigned and the nine locale about
// pages were not — six went through components/LocaleAbout.js on the old
// design and es/fr/de had hand-written pages.
//
// The three portraits, the founding year and the structured data are the same
// in every language and live here; everything a reader sees in words comes
// from the copy file.
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import { routePath, ogLocaleFor } from '@/lib/i18n';
import s from '@/styles/about-us.module.css';

const DAVID = '/wp-content/uploads/2025/11/unnamed-4-1.jpg';
const DYLAN = '/wp-content/uploads/2025/12/1761762811297.jpg';
const POPPY = '/wp-content/uploads/2025/11/unnamed-8.jpg';
const PORTRAITS = { david: DAVID, dylan: DYLAN, poppy: POPPY };
const PORTRAIT_SIZE = { david: [1024, 1024], dylan: [800, 800], poppy: [775, 1024] };
const BASE = 'https://co-ownership-property.com';

// Only add genuine buyer quotes with permission to publish their name and
// words. An empty list deliberately renders no section or placeholder space.
const BUYER_QUOTES = [];

function schemaFor(locale, copy, canonical) {
  return {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'AboutPage', '@id': `${canonical}#webpage`, url: canonical, name: copy.meta.title, inLanguage: locale, about: { '@id': `${BASE}/#organization` }, mainEntity: [{ '@id': `${BASE}/about-us/#david-olsson` }, { '@id': `${BASE}/about-us/#dylan-olsson` }] },
      { '@type': 'Person', '@id': `${BASE}/about-us/#david-olsson`, name: 'David Olsson', jobTitle: 'Founder', image: BASE + DAVID, worksFor: { '@id': `${BASE}/#organization` } },
      { '@type': 'Person', '@id': `${BASE}/about-us/#dylan-olsson`, name: 'Dylan Olsson', jobTitle: 'Co-founder & Head of Sales', image: BASE + DYLAN, worksFor: { '@id': `${BASE}/#organization` } },
      { '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'Co-Ownership Property', alternateName: 'COP', legalName: 'PREMPROPERTY SL', taxID: 'B93358489', vatID: 'ESB93358489', foundingDate: '2022', url: BASE, founder: [{ '@id': `${BASE}/about-us/#david-olsson` }, { '@id': `${BASE}/about-us/#dylan-olsson` }], description: 'Founded by David Olsson and his son, Dylan, in 2022, Co-Ownership Property helps buyers find and understand their second-home co-ownership options.', contactPoint: { '@type': 'ContactPoint', email: 'info@co-ownership-property.com', contactType: 'customer service' }, sameAs: ['https://www.linkedin.com/company/co-ownership-property'] },
      { '@type': 'WebSite', '@id': `${BASE}/#website`, url: BASE, name: 'Co-Ownership Property', publisher: { '@id': `${BASE}/#organization` } },
      { '@type': 'Quotation', '@id': `${BASE}/about-us/#david-quote-priced-out`, text: copy.story.quote, creator: { '@id': `${BASE}/about-us/#david-olsson` } },
    ],
  };
}

// Paragraphs carry <strong> for the phrases worth weighting, so they render
// through dangerouslySetInnerHTML. The copy files are ours, not user input.
function Para({ html }) {
  return <p dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function AboutView({ locale = 'en', copy }) {
  const canonical = `${BASE}${routePath(locale, 'aboutUs') || '/about-us/'}`;
  const howHref = routePath(locale, 'howItWorks') || '/how-it-works/';
  const scrollCleanup = useRef(null);
  useEffect(() => () => scrollCleanup.current?.(), []);
  function scrollToSection(event) {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    const heading = target.querySelector(`.${s.kicker}`) || target;
    const nav = document.querySelector('.rd-nav');
    const wrap = document.querySelector('.rd-nav-wrap');
    const inset = parseFloat(wrap ? getComputedStyle(wrap).top : '0') || 0;
    const clearance = (nav?.offsetHeight || 64) + inset + 24;
    window.history.pushState(null, '', anchor.hash);
    scrollCleanup.current?.();
    const start = window.scrollY;
    const destination = Math.max(0, Math.min(
      heading.getBoundingClientRect().top + start - clearance,
      document.documentElement.scrollHeight - window.innerHeight,
    ));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    const duration = 1100;
    const startedAt = performance.now();
    let frame;
    const stop = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stopOnKey);
      scrollCleanup.current = null;
    };
    const stopOnKey = event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) stop();
    };
    const tick = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({ top: start + (destination - start) * eased, behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stopOnKey);
    scrollCleanup.current = stop;
    frame = requestAnimationFrame(tick);
  }
  return <div className={`rd rd-home-light rd-about ${s.page}`} onClick={scrollToSection}>
    <Head>
      <title>{copy.meta.title}</title>
      {hreflangLinks({ englishPath: '/about-us' })}
      <meta name="description" content={copy.meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={copy.meta.ogTitle || copy.meta.title} />
      <meta property="og:description" content={copy.meta.ogDescription || copy.meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocaleFor(locale)} />
      <meta property="og:image" content={BASE + DAVID} />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFor(locale, copy, canonical)) }} />
    </Head>
    <Nav ctaHref="#enquire" />
    <main className={s.main}>
      <section className={`${s.hero} rd-container`} aria-label={copy.hero.regionLabel || 'Meet the founders'}>
        <div className={s.heroCopy} data-rv>
          <p className={s.kicker}>{copy.hero.kicker}</p>
          <h1>{copy.hero.headingTop}<br /><span>{copy.hero.headingAccent}</span></h1>
          <p className={s.lead}>{copy.hero.lead}</p>
        </div>
        <div className={s.founders} data-rv="2">
          <figure><Image src={DAVID} alt="David Olsson" width={1024} height={1024} priority sizes="(max-width: 760px) 44vw, 24vw" /><figcaption><strong>David Olsson</strong><span>{copy.team.people[0].role}</span></figcaption></figure>
          <figure><Image src={DYLAN} alt="Dylan Olsson" width={800} height={800} priority sizes="(max-width: 760px) 44vw, 24vw" /><figcaption><strong>Dylan Olsson</strong><span>{copy.team.people[1].role}</span></figcaption></figure>
          <a className={`rd-btn ${s.teamLink}`} href="#team">{copy.hero.teamLink} <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className={s.storyBand} id="our-story" aria-labelledby="story-title">
        <div className={`rd-container ${s.storyLayout}`}>
          <div className={s.storyHeading} data-rv>
            <p className={s.kicker}>{copy.story.kicker}</p>
            <h2 id="story-title">{copy.story.headingTop}<br />{copy.story.headingBottom}</h2>
            <blockquote>“{copy.story.quote}”<cite>{copy.story.quoteAttr}</cite></blockquote>
          </div>
          <div className={s.storyBody}>
            <div data-rv>
              {(copy.story.paragraphs || []).map((html, i) => <Para key={i} html={html} />)}
              <a className={s.textLink} href={howHref}>{copy.story.howLink} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.team} rd-container`} id="team" aria-labelledby="team-title">
        <div className={s.sectionHead} data-rv><p className={s.kicker}>{copy.team.kicker}</p><h2 id="team-title">{copy.team.heading}</h2></div>
        <div className={s.people}>
          {copy.team.people.map((person, i) => {
            const [w, h] = PORTRAIT_SIZE[person.key] || [1024, 1024];
            return <article key={person.key} data-rv={String(i + 1)}>
              <div className={s.portrait}><Image src={PORTRAITS[person.key]} alt={person.name} width={w} height={h} sizes="(max-width: 760px) 90vw, 30vw" /></div>
              <div className={s.personTitle}><h3>{person.name}</h3><span>{person.role}</span></div>
              {(person.paragraphs || []).map((text, j) => <p key={j}>{text}</p>)}
            </article>;
          })}
        </div>
      </section>

      <section className={`${s.process} rd-container`} aria-labelledby="process-title">
        <div className={s.sectionHead} data-rv><p className={s.kicker}>{copy.process.kicker}</p><h2 id="process-title">{copy.process.headingTop}<br />{copy.process.headingBottom}</h2></div>
        <ol className={s.steps}>{(copy.process.steps || []).map((step, i) => <li key={i} data-rv={String((i % 2) + 1)}><span className={s.stepNumber}>0{i + 1}</span><div><h3>{step.h}</h3><p>{step.p}</p></div></li>)}</ol>
      </section>

      {BUYER_QUOTES.length > 0 && <section className={`${s.testimonials} rd-container`} aria-label="Our buyers' words">{BUYER_QUOTES.map(({ name, quote }) => <blockquote key={name}>“{quote}”<cite>{name}</cite></blockquote>)}</section>}

      <section className="rd-section rd-collection-closing" aria-label="Newsletter">
        <div className="rd-container"><div className="rd-news" data-rv><div className="rd-news-body"><Newsletter editorial /></div></div></div>
      </section>
      <section className="rd-section rd-collection-closing" id="enquire" aria-label="Enquiry" style={{ scrollMarginTop: 110 }}>
        <div className="rd-container rd-enquiry-editorial" data-rv><ExpertForm /></div>
      </section>
    </main>
    <Footer />
  </div>;
}
