// /collections/ — the Collections hub. Rebuilt 25 Sep 2026 on the same
// layout as /how-it-works/ (hero, chapter nav, numbered details, full-width
// strip, steps, FAQ, newsletter, enquiry form) so it sits with the other big
// pages. Collection-specific blocks (the places and the collections) use
// styles/collections.module.css.
//
// Copy rules (lib/collections.js): never say how many owners share a
// collection, never name the operator, weeks always shown as "∼N", no monthly
// costs, no readiness badges, resale collections never featured.
// Previous version: Claude outputs/cc/collections-index.before-25sep.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import { loadCollections, collectionHref, formatMoney, weeksLabel, COLLECTIONS_PREVIEW } from '@/lib/collections';
import s from '@/styles/how-it-works.module.css';
import c from '@/styles/collections.module.css';

const SITE = 'https://co-ownership-property.com';
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export async function getStaticProps() {
  const all = await loadCollections();
  // New-share collections only; resale collections are never featured.
  const collections = all.filter(x => x.share_type !== 'resale');
  if (!collections.length) return { notFound: true, revalidate: 3600 };
  return { props: { collections }, revalidate: 3600 };
}

// Public photos only: a home that is ready, else a destination view of the place.
const isReady = h => h?.readiness === 'ready' && h.photos?.length > 0;
function placePhoto(col, h) {
  if (isReady(h)) return h.photos[0];
  return (col.destination_photos || []).find(d => d.key === h.key)?.src;
}
function collectionPhoto(col) {
  const hs = col.homes || [];
  const home = hs.find(isReady);
  if (home) return home.photos[0];
  for (const h of hs) { const p = placePhoto(col, h); if (p) return p; }
  return col.hero_image;
}

function FAQS(collections) {
  const five = collections.find(x => (x.homes_count || x.homes?.length) >= 5);
  const small = collections.find(x => (x.homes_count || x.homes?.length) < 5);
  return [
    { q: 'What is a collection?', a: 'Several homes in different places, bought together and owned together. Instead of a share of one home, you own a share of all of them, and move between them through the year.' },
    { q: 'What exactly do I own?', a: 'A share of the company that holds every home in the collection. The homes are bought outright, with no mortgage on them.' },
    { q: 'How much time do I get?', a: `Circa ${Math.round(five?.weeks_per_year || 12)} weeks a year across a five-home collection${small ? `, and circa ${Math.round(small.weeks_per_year || 7)} weeks in the ${small.name.replace(/^The /, '')}` : ''}. A shared calendar spreads the year fairly across the homes, and longer stays are common outside high season.` },
    { q: 'Can family and friends use my weeks?', a: 'Yes. Lend your weeks to the people you love. The homes are kept for owners and their guests, never rented out.' },
    { q: 'Who looks after the homes?', a: 'Every home is renovated, furnished and equipped before the first stays, then cleaned, maintained and insured between them. You arrive and live; there is nothing to organise.' },
    { q: 'Some homes are still being chosen. What does that mean?', a: 'Newer collections are joined at the very start, while the homes are chosen. First stays are expected within 12 to 24 months. Unlock a collection to see homes from earlier collections in the same places, so you know the standard to expect.' },
  ];
}

export default function CollectionsHub({ collections }) {
  const canonical = `${SITE}/collections/`;
  const horizon = collections.find(x => (x.homes || []).some(isReady)) || collections[0];
  const heroSrc = collectionPhoto(horizon);
  const from = Math.min(...collections.map(x => x.price).filter(Boolean));
  const countries = new Set(collections.flatMap(col => (col.homes || []).map(h => h.country))).size;
  const homesTotal = collections.reduce((n, col) => n + (col.homes_count || col.homes?.length || 0), 0);

  // Every place the collections cover, once, with the collections it belongs to.
  const places = [];
  for (const col of collections) {
    for (const h of col.homes || []) {
      const label = h.chapter || h.city;
      let p = places.find(x => x.label === label);
      if (!p) { p = { label, country: h.country, src: null, cols: [] }; places.push(p); }
      if (!p.src || isReady(h)) p.src = placePhoto(col, h) || p.src;
      if (!p.cols.find(x => x.slug === col.slug)) p.cols.push({ slug: col.slug, name: col.name });
    }
  }
  const shown = places.filter(p => p.src);
  const stripHome = (horizon.homes || []).filter(isReady)[1];
  const stripSrc = stripHome?.photos?.[0];
  const faqs = FAQS(collections);
  const ideaPlace = shown.find(p => p.label === 'Chamonix') || shown.find(p => p.src !== stripSrc && p.src !== heroSrc);

  return <>
    <Head>
      <title>Collections: several homes, one purchase | Co-Ownership Property</title>
      <meta name="description" content="Provence in June, the Mediterranean in autumn, the Alps when the snow falls. A collection brings several extraordinary homes together in one purchase, looked after for you." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content="Collections: several homes, one purchase" />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      {COLLECTIONS_PREVIEW && <meta name="robots" content="noindex,nofollow" />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </Head>
    <div className={`rd rd-home-light rd-how ${s.page} ${c.landing} ${c.hub}`}>
      <Nav />
      <main>
        <section className={`${s.hero} rd-container`} aria-labelledby="col-title">
          <div className={s.heroCopy}>
            <p className={s.kicker}>Collections</p>
            <h1 id="col-title">One purchase.<br /><span>Several homes.</span></h1>
            <p className={s.lead}>A villa in Provence for the summer, the Mediterranean for the autumn light, the Alps when the snow falls. A collection brings several extraordinary homes together, so the only question is where you wake up next.</p>
            <div className={s.actions}>
              <a className="rd-btn rd-btn-primary" href="#the-collections">Discover the collections <span aria-hidden="true">↘</span></a>
              <a className={s.textLink} href="#enquire">Ask us about collections <span aria-hidden="true">↗</span></a>
            </div>
            <p className={s.heroFoot}>Renovated, furnished and looked after for you. Bought outright, with no mortgage on the homes.</p>
            <p className={s.inventory}>
              {Number.isFinite(from) && <strong>From {formatMoney(from)}</strong>}
              <span>{collections.length} collections · {homesTotal} homes · {countries} countries</span>
            </p>
          </div>
          <figure className={s.heroImage}>
            {heroSrc && <Image src={heroSrc} alt="A villa and pool in the hills above Cannes" width={1600} height={1100} sizes="(max-width: 760px) calc(100vw - 40px), 52vw" priority quality={88} style={{ backgroundColor: '#eeeee9', objectFit: 'cover' }} />}
          </figure>
        </section>

        <nav className={`${s.chapterNav} rd-container`} aria-label="On this page">
          {[['idea', 'The idea'], ['places', 'The places'], ['the-collections', 'The collections'], ['how', 'How it works'], ['questions', 'Questions']].map(([id, label]) => <a key={id} href={`#${id}`}>{label}<span aria-hidden="true">↘</span></a>)}
        </nav>

        <section className={`${s.section} rd-container ${s.idea}`} id="idea">
          <div data-rv>
            <p className={s.kicker}>The idea</p>
            <h2>A different home<br />for every season.</h2>
            <p className={s.body}>Co-ownership gives you a share of one beautiful home. A collection goes further: several homes in different places, bought together, so your year can move with the seasons. June among the olive groves, October by the sea, a week of snow in February. Every home is furnished and equipped down to the last glass, and cared for between your stays.</p>
          </div>
          {ideaPlace?.src && <div className={s.ownershipPhoto} data-rv>
            <Image src={ideaPlace.src} alt={`${ideaPlace.label}, ${ideaPlace.country}`} width={1600} height={1100} sizes="(max-width: 760px) 100vw, 45vw" quality={85} style={{ objectFit: 'cover' }} />
          </div>}
        </section>
        <section className={`${s.ownershipDetails} ${c.hubDetails} rd-container`} aria-label="A collection in brief">
          {[
            ['Several homes, one purchase', 'One share covers every home in the collection, in some of the most loved places in Europe.'],
            [`${weeksLabel(horizon)} weeks a year`, 'A shared calendar spreads the year fairly across the homes. City collections are smaller, with fewer weeks and a lower price.'],
            ['Nothing to organise', 'Renovated, furnished and equipped for you, then cleaned, maintained and insured between your stays.'],
            ['For family and friends', 'Lend your weeks to the people you love. The homes are kept for owners, never rented out.'],
          ].map(([h, p], i) => <article key={h} data-rv><span className={s.detailNumber}>0{i + 1}</span><h3>{h}</h3><p>{p}</p></article>)}
        </section>

        {shown.length > 0 && <section className={`${s.section} rd-container ${c.hubPlaces}`} id="places">
          <div className={s.sectionHeading} data-rv><div><p className={s.kicker}>The places</p><h2>{WORDS[shown.length] ? WORDS[shown.length][0].toUpperCase() + WORDS[shown.length].slice(1) : shown.length} places,<br />one way of owning them.</h2></div></div>
          <div className={c.hubPlaceGrid}>
            {shown.map(p => (
              <figure key={p.label} className={c.hubPlace} data-rv>
                <Image src={p.src} alt={`${p.label}, ${p.country}`} fill sizes="(max-width: 760px) 50vw, 25vw" quality={80} style={{ objectFit: 'cover' }} />
                <span className={c.lSeasonShade} aria-hidden="true" />
                <figcaption><strong>{p.label}</strong><span>{p.cols.map(x => x.name.replace(/^The /, '').replace(/ Collection$/, '')).join(' · ')}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>}

        {stripSrc && <figure className={s.propertyStrip} data-rv>
          <Image src={stripSrc} alt={`${stripHome.chapter || stripHome.city}, part of ${horizon.name}`} fill sizes="100vw" quality={85} style={{ objectFit: 'cover' }} />
          <figcaption>{stripHome.chapter || stripHome.city} · {horizon.name}</figcaption>
        </figure>}

        <section className={`${s.section} rd-container ${c.hubList}`} id="the-collections">
          <div className={s.sectionHeading} data-rv><div><p className={s.kicker}>The collections</p><h2>Choose where<br />your year takes you.</h2></div></div>
          {collections.map((col, i) => {
            const hs = col.homes || [];
            const n = col.homes_count || hs.length;
            return (
              <article key={col.slug} className={`${c.lItem} ${i % 2 ? c.hubFlip : ''}`} data-rv>
                <Link href={collectionHref(col.slug)} className={c.lItemPhoto} aria-label={col.name}>
                  {collectionPhoto(col) && <Image src={collectionPhoto(col)} alt={col.name} fill sizes="(max-width: 960px) 100vw, 58vw" quality={85} style={{ objectFit: 'cover' }} />}
                  <span className={`${c.tag} ${c.tagOnPhoto}`}><span className={c.tagRule} aria-hidden="true" />A collection of {WORDS[n] || n} homes</span>
                </Link>
                <div>
                  <p className={c.lItemPlaces}>{hs.map(h => h.chapter || h.city).join('  ·  ')}</p>
                  <h3 className={c.lItemTitle}>{col.name}</h3>
                  <p className={c.lItemText}>{col.tagline}</p>
                  <dl className={c.lItemMeta}>
                    <div><dt>All {n} homes</dt><dd>{formatMoney(col.price, col.currency)}</dd></div>
                    <div><dt>Weeks a year</dt><dd>{weeksLabel(col)}</dd></div>
                  </dl>
                  <Link className="rd-btn rd-btn-primary" href={collectionHref(col.slug)}>Discover the collection <span aria-hidden="true">↗</span></Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className={`${s.fit} rd-container`} aria-labelledby="fit-title">
          <div><p className={s.kicker}>One home or several</p><h2 id="fit-title">Which suits<br />the way you live?</h2></div>
          <div>
            <h3>A share of one home</h3>
            <p>Right if you already know your place: the same village, the same view, year after year, and the lowest way in.</p>
            <h3>A collection</h3>
            <p>Right if you love the idea of moving with the seasons: the coast in autumn, the mountains in winter, a city for the weekends, all under one purchase.</p>
          </div>
        </section>

        <section className={`${s.section} ${s.journey} rd-container`} id="how">
          <div className={s.sectionHeading} data-rv><div><p className={s.kicker}>How it works</p><h2>From first look<br />to first stay.</h2></div><a className={s.textLink} href="#enquire">Speak to us ↗</a></div>
          <ol className={s.steps}>
            {[
              ['Choose a collection', 'Browse the places and the homes, and pick the collection that fits the year you want.'],
              ['See everything', 'Unlock the collection for every photograph of the homes and the floor plans where they exist.'],
              ['Speak to us', 'We answer personally, walk you through the calendar and the paperwork, and introduce you to the team that manages the homes.'],
              ['Arrive and live', 'The homes are prepared for you. Book your weeks through the shared calendar and simply arrive.'],
            ].map(([h, p], i) => <li key={h} data-rv><span>0{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}
          </ol>
        </section>

        <section className={`${s.section} rd-container ${s.faqSection}`} id="questions">
          <div><p className={s.kicker}>Questions</p><h2>About collections</h2><p className={s.body}>The short answers. We explain everything in full before you buy.</p><a className={s.textLink} href="#enquire">Ask us anything ↗</a></div>
          <div className={s.faqs}>{faqs.map(f => <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}</div>
        </section>

        <section className="rd-section rd-collection-closing" aria-label="Newsletter"><div className="rd-container"><div className="rd-news" data-rv><div className="rd-news-body"><Newsletter editorial /></div></div></div></section>
        <section className="rd-section rd-collection-closing" id="enquire" aria-label="Enquiry" style={{ scrollMarginTop: 110 }}><div className="rd-container rd-enquiry-editorial" data-rv><ExpertForm /></div></section>
      </main>
      <Footer />
    </div>
  </>;
}
