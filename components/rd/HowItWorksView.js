// components/rd/HowItWorksView.js
//
// The how-it-works page, in any language. Same split as
// components/rd/HomeView.js: structure here, words in
// content/how/{locale}.json.
//
// Before 22 Sep 2026 the English page was redesigned and the Spanish, French
// and German versions were three hand-written pages on the old design. (The
// other six locales route howItWorks to their pillar page instead — see
// ROUTE_SLUGS in lib/i18n.js — so they are not rendered by this component.)
//
// A note for translators: this page makes claims about ownership, costs and
// usage, and the English is deliberately hedged — "varies by home", "we
// explain before you buy", "where rentals are permitted". That hedging is not
// padding and must survive translation.
import Head from 'next/head';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import s from '@/styles/how-it-works.module.css';
import { routePath, numberLocale, ogLocaleFor } from '@/lib/i18n';

const SITE = 'https://co-ownership-property.com';
const PARIS_INTERIOR = 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/6th-arrondissement-paris-france-2-bed-apartment/gallery-1.jpg';

// Headings that are two or three lines by design; the copy files carry the
// breaks as newlines so a translator never has to type <br />.
function Lines({ text }) {
  const parts = String(text || '').split('\n');
  return parts.map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>);
}

function Emphasis({ text, phrases }) {
  if (!phrases?.length) return text;
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  return String(text).split(pattern).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

function OwnershipComparison({ copy }) {
  const c = copy.comparison;
  return <section className={`${s.section} rd-container ${s.benefits}`} id="comparison" aria-labelledby="compare-title">
    <div className={s.comparisonIntro}>
      <div className={s.comparisonCopy}>
        <p className={s.kicker}>{c.kicker}</p>
        <h2 id="compare-title"><Lines text={`${c.headingTop}\n${c.headingBottom}`} /></h2>
        <div className={s.ownershipClarifier}>
          <h3>{c.clarifierHeading}</h3>
          <p>{c.clarifierBody}</p>
        </div>
        <p className={s.benefitLead}>{c.lead}</p>
      </div>
      <figure className={s.comparisonImage}>
        <Image
          src="https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/cop_blog_images/lifestyle-library/tuscany/Family%20sitting%20at%20a%20table%20in%20Tuscany%20with%20the%20Tuscany%20background.jpg"
          alt={c.imageAlt}
          fill
          sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1500px) 42vw, 600px"
        />
      </figure>
    </div>
    <div className={s.budgetExample}>
      <div>
        <span>{c.budget.wholeLabel}</span><strong>{c.budget.wholePrice}</strong><p>{c.budget.wholeNote}</p>
        <div className={s.ownershipVisual} role="img" aria-label={c.budget.wholeDiagramLabel}>
          <div className={`${s.ownershipPie} ${s.wholePie}`}>
            <Image src={PARIS_INTERIOR} alt="" fill sizes="180px" className={s.pieImage} />
          </div>
          <small>{c.budget.wholeDiagramLabel}</small>
        </div>
      </div>
      <span className={s.budgetArrow} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></span>
      <div>
        <span>{c.budget.shareLabel}</span><strong>{c.budget.sharePrice}</strong><p>{c.budget.shareNote}</p>
        <div className={s.ownershipVisual} role="img" aria-label={c.budget.shareDiagramLabel}>
          <div className={`${s.ownershipPie} ${s.sharePie}`}>
            <Image src={PARIS_INTERIOR} alt="" fill sizes="180px" className={`${s.pieImage} ${s.mutedPieImage}`} />
            <Image src={PARIS_INTERIOR} alt="" fill sizes="180px" className={`${s.pieImage} ${s.shareSliceImage}`} />
          </div>
          <small>{c.budget.shareDiagramLabel}</small>
        </div>
      </div>
    </div>
    <div className={s.flowComparison}>{c.rows.slice(1).map(row => <div className={s.flowRow} key={row.h}>
      <div><span className={s.comparisonLabel}>{c.fullLabel}</span><h3>{row.fullHeading}</h3><p>{row.alone}</p></div>
      <span className={s.flowArrow} aria-hidden="true">→</span>
      <div><span className={s.comparisonLabel}>{c.sharedLabel}</span><h3>{row.h}</h3><p><Emphasis text={row.shared} phrases={c.emphasise} /></p></div>
    </div>)}</div>
    {(c.notes || []).map((note, i) => <p className={s.note} key={i}>{note}</p>)}
  </section>;
}

export default function HowItWorksView({ locale = 'en', copy, inventory = null }) {
  const canonical = `${SITE}${routePath(locale, 'howItWorks') || '/how-it-works/'}`;
  const homesHref = routePath(locale, 'homes') || '/our-homes/';
  const scrollCleanup = useRef(null);
  useEffect(() => () => scrollCleanup.current?.(), []);
  function scrollToSection(event) {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, '', anchor.hash);
    const heading = target.querySelector(`.${s.kicker}`) || target;
    // Layout offsets ignore entrance-animation transforms and section padding.
    let top = 0;
    for (let element = heading; element; element = element.offsetParent) top += element.offsetTop;
    const navigation = document.querySelector('.rd-nav');
    const navigationWrap = document.querySelector('.rd-nav-wrap');
    const inset = parseFloat(navigationWrap ? getComputedStyle(navigationWrap).top : '0') || 0;
    const clearance = (navigation?.offsetHeight || 64) + inset + 24;
    scrollCleanup.current?.();
    const start = window.scrollY;
    const destination = Math.max(0, Math.min(top - clearance, document.documentElement.scrollHeight - window.innerHeight));
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
  // Live counts come from getStaticProps (lib/inventory.js, same source as
  // every other page) instead of a client-side fetch of the whole feed.
  const description = 'Understand luxury co-ownership: what you own, how stays are booked, shared running costs, resale and the steps to a fully managed second home.';
  return <>
    <Head>
      <title>{copy.meta.title}</title>
      {hreflangLinks({ englishPath: '/how-it-works' })}
      <meta name="description" content={copy.meta.description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={copy.meta.ogTitle || copy.meta.title} />
      <meta property="og:description" content={copy.meta.ogDescription || copy.meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocaleFor(locale)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: locale,
        mainEntity: copy.faq.items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </Head>
    <div className={`rd rd-home-light rd-how ${s.page}`} onClick={scrollToSection}>
      <Nav />
      <main>
        <section className={`${s.hero} rd-container`} aria-labelledby="how-title">
          <div className={s.heroCopy}>
            <p className={s.kicker}>{copy.hero.kicker}</p>
            <h1 id="how-title">{copy.hero.headingTop}<br /><span>{copy.hero.headingAccent}</span></h1>
            <p className={s.lead}>{copy.hero.lead}</p>
            <div className={s.actions}>
              <Link className="rd-btn rd-btn-primary" href={homesHref}>{copy.hero.ctaBrowse} <span aria-hidden="true">↗</span></Link>
              <a className={s.textLink} href="#enquire">{copy.hero.ctaAsk} <span aria-hidden="true">↗</span></a>
            </div>
            <p className={s.heroFoot}>{copy.hero.foot}</p>
            {inventory && <p className={s.inventory}>
              {inventory.from && <strong>{copy.hero.sharesFrom} {new Intl.NumberFormat(numberLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(inventory.from)}</strong>}
              <span>{inventory.homes} {copy.hero.homesForSale} · {inventory.countries} {copy.hero.countries}</span>
            </p>}
          </div>
          <figure className={s.heroImage}>
            <Image src="/redesign/mouans-sartoux-original-5k.jpg" alt={copy.hero.imageAlt} width={5184} height={3457} sizes="(max-width: 760px) calc(100vw - 40px), 52vw" priority style={{ backgroundColor: '#eeeee9' }} />
          </figure>
        </section>

        <nav className={`${s.chapterNav} rd-container`} aria-label={copy.chapterNav.label}>
          {copy.chapterNav.items.map(({ id, label }) => <a key={id} href={`#${id}`}>{label}<span aria-hidden="true">↘</span></a>)}
        </nav>

        <OwnershipComparison copy={copy} />

        <figure className={s.propertyStrip} data-rv>
          <Image src="/redesign/santa-barbara-sunset.jpg" alt={copy.strip.imageAlt} fill sizes="100vw" />
          <figcaption>{copy.strip.caption}</figcaption>
        </figure>

        <section className={`${s.fit} rd-container`} aria-labelledby="fit-title">
          <div><p className={s.kicker}>{copy.fit.kicker}</p><h2 id="fit-title"><Lines text={`${copy.fit.headingTop}\n${copy.fit.headingBottom}`} /></h2></div>
          <div><h3>{copy.fit.forHeading}</h3><p>{copy.fit.forBody}</p><h3>{copy.fit.notForHeading}</h3><p>{copy.fit.notForBody}</p></div>
        </section>

        <section className={`${s.section} rd-container ${s.idea}`} id="ownership">
          <div data-rv><p className={s.kicker}>{copy.ownership.kicker}</p><h2><Lines text={copy.ownership.heading} /></h2><p className={s.body}>{copy.ownership.body}</p></div>
          <div className={s.ownershipPhoto} data-rv>
            <Image src="/redesign/cala-codolar-ibiza.jpg" alt={copy.ownership.imageAlt} width={1838} height={1225} sizes="(max-width: 760px) 100vw, 45vw" />
          </div>
        </section>
        <section className={`${s.ownershipDetails} rd-container`} aria-label={copy.ownership.detailsLabel}>
          {copy.ownership.details.map((d, i) => <article key={d.h} data-rv><span className={s.detailNumber}>0{i + 1}</span><h3>{d.h}</h3><p>{d.p}</p></article>)}
        </section>

        <section className={`${s.section} rd-container ${s.stays}`} id="stays">
          <div className={s.stayImage} data-rv><Image src="/redesign/spain-sunny-v1.png" alt={copy.stays.imageAlt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 45vw" unoptimized /></div>
          <div data-rv><p className={s.kicker}>{copy.stays.kicker}</p><h2><Lines text={copy.stays.heading} /></h2><p className={s.body}>{copy.stays.body}</p></div>
          <div className={`${s.lines} ${s.stayDetails}`} data-rv>{copy.stays.details.map(d => <article key={d.h}><h3>{d.h}</h3><p>{d.p}</p></article>)}</div>
        </section>

        <section className={`${s.section} ${s.journey} rd-container`} id="buying">
          <div className={s.sectionHeading} data-rv><div><p className={s.kicker}>{copy.journey.kicker}</p><h2><Lines text={copy.journey.heading} /></h2></div><a className={s.textLink} href="#enquire">{copy.journey.link} ↗</a></div>
          <ol className={s.steps}>{copy.journey.steps.map((step, i) => <li key={step.h} data-rv><span>0{i + 1}</span><h3>{step.h}</h3><p>{step.p}</p></li>)}</ol>
        </section>

        <section className={`${s.section} rd-container ${s.faqSection}`} id="questions">
          <div><p className={s.kicker}>{copy.faq.kicker}</p><h2>{copy.faq.heading}</h2><p className={s.body}>{copy.faq.body}</p><a className={s.textLink} href="#enquire">{copy.faq.link} ↗</a></div>
          <div className={s.faqs}>{copy.faq.items.map(f => <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}</div>
        </section>

        <section className="rd-section rd-collection-closing" aria-label="Newsletter"><div className="rd-container"><div className="rd-news" data-rv><div className="rd-news-body"><Newsletter editorial /></div></div></div></section>
        <section className="rd-section rd-collection-closing" id="enquire" aria-label="Enquiry" style={{ scrollMarginTop: 110 }}><div className="rd-container rd-enquiry-editorial" data-rv><ExpertForm /></div></section>
      </main>
      <Footer />
    </div>
  </>;
}
