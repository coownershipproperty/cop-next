import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import s from '@/styles/about-us.module.css';

const DAVID = '/wp-content/uploads/2025/11/unnamed-4-1.jpg';
const DYLAN = '/wp-content/uploads/2025/12/1761762811297.jpg';
const BASE = 'https://co-ownership-property.com';
const QUOTE = "The clients I had worked with for years still wanted to buy — they just couldn't afford to anymore. They were simply priced out.";
const STEPS = [
  ['Tell us what you have in mind.', 'A destination you love, the time you want to spend there, your budget. You do not need to have everything worked out.'],
  ['Speak to a person. See the figures.', 'We reply within one working day with real availability and the figures for the homes that fit. If a home does not suit your plans, we say so.'],
  ['Meet the team behind the home.', 'We introduce you to the people who manage the property, so you can ask about the home, the ownership and how your stays will work.'],
  ['We stay in the loop.', 'From the first conversation through to your purchase, we stay involved and help you get the answers you need.'],
];
// Only add genuine buyer quotes with permission to publish their name and words.
// An empty list deliberately renders no section or placeholder space.
const BUYER_QUOTES = [];
const schema = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'AboutPage', '@id': `${BASE}/about-us/#webpage`, url: `${BASE}/about-us/`, name: 'About Us | Co-Ownership Property', about: { '@id': `${BASE}/#organization` }, mainEntity: [{ '@id': `${BASE}/about-us/#david-olsson` }, { '@id': `${BASE}/about-us/#dylan-olsson` }] },
    { '@type': 'Person', '@id': `${BASE}/about-us/#david-olsson`, name: 'David Olsson', jobTitle: 'Founder', image: BASE + DAVID, worksFor: { '@id': `${BASE}/#organization` } },
    { '@type': 'Person', '@id': `${BASE}/about-us/#dylan-olsson`, name: 'Dylan Olsson', jobTitle: 'Co-founder & Head of Sales', image: BASE + DYLAN, worksFor: { '@id': `${BASE}/#organization` } },
    { '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'Co-Ownership Property', alternateName: 'COP', legalName: 'PREMPROPERTY SL', taxID: 'B93358489', vatID: 'ESB93358489', foundingDate: '2022', url: BASE, founder: [{ '@id': `${BASE}/about-us/#david-olsson` }, { '@id': `${BASE}/about-us/#dylan-olsson` }], description: 'Founded by David Olsson and his son, Dylan, in 2022, Co-Ownership Property helps buyers find and understand their second-home co-ownership options.', contactPoint: { '@type': 'ContactPoint', email: 'info@co-ownership-property.com', contactType: 'customer service' }, sameAs: ['https://www.linkedin.com/company/co-ownership-property'] },
    { '@type': 'WebSite', '@id': `${BASE}/#website`, url: BASE, name: 'Co-Ownership Property', publisher: { '@id': `${BASE}/#organization` } },
    { '@type': 'Quotation', '@id': `${BASE}/about-us/#david-quote-priced-out`, text: QUOTE, creator: { '@id': `${BASE}/about-us/#david-olsson` } },
  ],
};

export default function AboutUs() {
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
      <title>About Us | Co-Ownership Property</title>
      {hreflangLinks({ englishPath: '/about-us' })}
      <meta name="description" content="Meet David and Dylan Olsson. Founded by father and son in 2022, COP grew from twenty years helping buyers find a place in the French Alps." />
      <link rel="canonical" href={`${BASE}/about-us/`} />
      <meta property="og:title" content="Our story | Co-Ownership Property" />
      <meta property="og:description" content="It started with a familiar conversation in the Alps. Meet the people behind COP." />
      <meta property="og:url" content={`${BASE}/about-us/`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={BASE + DAVID} />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </Head>
    <Nav ctaHref="#enquire" />
    <main className={s.main}>
      <section className={`${s.hero} rd-container`} aria-label="Meet the founders">
        <div className={s.heroCopy} data-rv>
          <p className={s.kicker}>Our story · Since 2022</p>
          <h1>A different way to own.<br /><span>A very personal reason.</span></h1>
          <p className={s.lead}>Founded in 2022 by David Olsson and his son, Dylan, COP brings a personal approach to finding and owning your second home.</p>
        </div>
        <div className={s.founders} data-rv="2">
          <figure><Image src={DAVID} alt="David Olsson" width={1024} height={1024} priority sizes="(max-width: 760px) 44vw, 24vw" /><figcaption><strong>David Olsson</strong><span>Founder</span></figcaption></figure>
          <figure><Image src={DYLAN} alt="Dylan Olsson" width={800} height={800} priority sizes="(max-width: 760px) 44vw, 24vw" /><figcaption><strong>Dylan Olsson</strong><span>Co-founder &amp; Head of Sales</span></figcaption></figure>
          <a className={`rd-btn ${s.teamLink}`} href="#team">More about the team <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className={s.storyBand} id="our-story" aria-labelledby="story-title">
        <div className={`rd-container ${s.storyLayout}`}>
          <div className={s.storyHeading} data-rv><p className={s.kicker}>From the Alps to a new idea</p><h2 id="story-title">A new way to own.<br />The same desire for home.</h2><blockquote>“{QUOTE}”<cite>David Olsson · Founder</cite></blockquote></div>
          <div className={s.storyBody}>
            <div data-rv>
              <p>After <strong>more than twenty years helping buyers find homes in the French Alps</strong>, David kept hearing the same story. Clients who had spent years returning to the mountains still wanted a place of their own, but rising prices had put buying outright beyond their reach. Their connection to those places had not changed; what they could afford had. Co-ownership offered a way to <strong>own a share of a home they loved</strong>, with the costs shared and a professional team looking after it.</p>
              <p>In 2022, <strong>David founded COP with his son, Dylan</strong>, to help buyers explore that possibility. COP’s approach starts with understanding where people want to be, how they want to spend their time and what works for their budget. The aim is to help people find <strong>a second home that fits the life they actually live</strong>, with clear information and someone to talk to along the way.</p>
              <a className={s.textLink} href="/how-it-works/">How co-ownership works <span aria-hidden="true">↗</span></a>
            </div>
          </div>

        </div>
      </section>

      <section className={`${s.team} rd-container`} id="team" aria-labelledby="team-title">
        <div className={s.sectionHead} data-rv><p className={s.kicker}>The people behind COP</p><h2 id="team-title">Meet the team.</h2></div>
        <div className={s.people}>
          <article data-rv="1"><div className={s.portrait}><Image src={DAVID} alt="David Olsson" width={1024} height={1024} sizes="(max-width: 760px) 90vw, 30vw" /></div><div className={s.personTitle}><h3>David Olsson</h3><span>Founder</span></div><p>David still works in French Alps real estate, with over twenty years spent selling ski properties across more than forty resorts.</p><p>He founded COP with his son, Dylan, in 2022 because he believes exceptional homes should be owned by people who love them—not only those who can afford to buy them outright.</p></article>
          <article data-rv="2"><div className={s.portrait}><Image src={DYLAN} alt="Dylan Olsson" width={800} height={800} sizes="(max-width: 760px) 90vw, 30vw" /></div><div className={s.personTitle}><h3>Dylan Olsson</h3><span>Co-founder &amp; Head of Sales</span></div><p>Raised between London and Marbella, with roots across four countries, Dylan grew up between languages and cultures. That international background shapes how he works with people looking for a home abroad.</p><p>A business graduate from the University of Manchester, he co-founded COP and leads sales, working closely with buyers to find the right home.</p></article>
          <article data-rv="3"><div className={s.portrait}><Image src="/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy, the team's dog" width={775} height={1024} sizes="(max-width: 760px) 90vw, 30vw" /></div><div className={s.personTitle}><h3>Poppy</h3><span>Head of security</span></div><p>Takes a zero-tolerance approach to squirrels, postmen and unauthorised cats.</p><p>Has been known to accept bribes in the form of cheddar cheese or belly rubs.</p></article>
        </div>
      </section>

      <section className={`${s.process} rd-container`} aria-labelledby="process-title">
        <div className={s.sectionHead} data-rv><p className={s.kicker}>How we work with you</p><h2 id="process-title">A conversation.<br />Not a sales conveyor belt.</h2></div>
        <ol className={s.steps}>{STEPS.map(([title, text], i) => <li key={title} data-rv={String((i % 2) + 1)}><span className={s.stepNumber}>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
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
