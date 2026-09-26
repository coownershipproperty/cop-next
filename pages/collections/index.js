// /collections/ — the Collections hub. Third pass, 26 Sep 2026 (David): sell
// each collection as a whole, in the How It Works layout. No "several homes,
// one purchase" line and no grid of places. Every factual line about a
// collection comes from its own description in the collections table.
//
// Copy rules (lib/collections.js): never say how many owners share a
// collection, never name the operator, weeks always "∼N", no monthly costs,
// no readiness badges, resale collections never featured.
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

// The story of each collection, written from its own description.
const STORY = {
  'large-ready-to-go': {
    places: 'Provence, the Costa del Sol, the Swedish coast, Chamonix and Tuscany.',
    line: 'From the hills above Cannes to the Swedish coast.',
    body: [
      'June in Provence, where a villa above Cannes looks out across the olive groves to the sea. The autumn light on the Costa del Sol, a few steps from the beach. A week of snow in an apartment facing Mont Blanc, the harvest among the vineyards of Montalcino, and the long, light evenings of a Swedish summer.',
      'Each home is renovated, furnished and equipped down to the last glass, so you arrive, open the shutters and simply live. At least one ski week a year is guaranteed.',
    ],
    seasons: { 'Chamonix': 'Winter', 'Provence': 'June', 'The Swedish coast': 'Midsummer', 'Tuscany': 'The harvest', 'Costa del Sol': 'Autumn sun' },
  },
  meridian: {
    places: 'Tuscany, Provence, Chamonix, London and the Costa del Sol.',
    line: 'Tuscany for the summer, the Alps for the snow, London in between.',
    body: [
      'A farmhouse in the Tuscan hills for the long summer. A stone villa in Provence with a pool among the olive trees. A mountain apartment in Chamonix for the snow, a London home for the weekends in between, and a house on the southern Spanish coast for the winter sun.',
      'You join this collection at its very beginning. The five homes are being chosen now, then renovated, furnished and equipped before the first stays, expected within 12 to 24 months.',
    ],
    seasons: { 'Costa del Sol': 'Winter sun', 'Chamonix': 'The snow', 'London': 'Long weekends', 'Tuscany': 'Summer', 'Provence': 'Early summer' },
  },
  'three-cities': {
    places: 'Paris, London and Rome.',
    line: 'Three great cities, lived in rather than visited.',
    body: [
      'Wake up in the Marais and walk to breakfast on the Rue des Rosiers. Spend a long weekend in London for the galleries and the theatre, then an autumn week in Rome, where every street ends at a church or a fountain.',
      'The Paris apartment is secured: two bedrooms in a nineteenth-century Marais building, with parquet floors, fireplaces and two west-facing living rooms. London and Rome are being chosen now, with first stays expected within 12 to 24 months.',
    ],
    seasons: { 'Paris': 'Any season', 'London': 'Long weekends', 'Rome': 'Autumn' },
  },
};

export async function getStaticProps() {
  const all = await loadCollections();
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
function photosOf(col) {
  const hs = col.homes || [];
  const list = [];
  for (const h of [...hs.filter(isReady), ...hs.filter(x => !isReady(x))]) {
    const p = placePhoto(col, h);
    if (p && !list.find(x => x.src === p)) list.push({ src: p, label: h.chapter || h.city });
  }
  if (!list.length && col.hero_image) list.push({ src: col.hero_image, label: col.name });
  return list;
}

const FAQS = (collections) => {
  const five = collections.find(x => (x.homes_count || x.homes?.length) >= 5);
  const small = collections.find(x => (x.homes_count || x.homes?.length) < 5);
  return [
    { q: 'What is a collection?', a: 'A set of homes in different places across Europe, owned together. Instead of a share of one home, you own a share of the whole collection and move between its homes through the year.' },
    { q: 'What exactly do I own?', a: 'A share of the company that holds every home in the collection. The homes are bought outright, with no mortgage on them.' },
    { q: 'How much time do I get?', a: `Circa ${Math.round(five?.weeks_per_year || 12)} weeks a year in a five-home collection${small ? `, and circa ${Math.round(small.weeks_per_year || 7)} weeks in the ${small.name.replace(/^The /, '')}` : ''}. A shared calendar spreads the year fairly across the homes.` },
    { q: 'Can family and friends come?', a: 'Yes. Bring them with you, or lend them your weeks. The homes are kept for owners and their guests.' },
    { q: 'Who looks after the homes?', a: 'Every home is renovated, furnished and equipped before the first stays. Between your stays, the cleaning, maintenance, bills and repairs are taken care of.' },
    { q: 'Some homes are still being chosen. What does that mean?', a: 'In a new collection you join at the very start, while the homes are chosen. First stays are expected within 12 to 24 months, and you can see homes from earlier collections in the same places, so you know the standard to expect.' },
  ];
};

export default function CollectionsHub({ collections }) {
  const canonical = `${SITE}/collections/`;
  const horizon = collections.find(x => (x.homes || []).some(isReady)) || collections[0];
  const heroSrc = photosOf(horizon)[0]?.src;
  const from = Math.min(...collections.map(x => x.price).filter(Boolean));
  const faqs = FAQS(collections);
  const small = collections.find(x => (x.homes_count || x.homes?.length) < 5);
  const idea = (horizon.homes || []).find(h => h.key === 'les-praz');
  const ideaSrc = (idea && placePhoto(horizon, idea)) || photosOf(horizon)[1]?.src;

  return <>
    <Head>
      <title>Collections: a home for every season | Co-Ownership Property</title>
      <meta name="description" content="Provence in June, the Alps in winter, the Mediterranean in autumn, Paris, London and Rome whenever you like. Our collections bring Europe's most loved places together, looked after for you." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={canonical} />
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
            <h1 id="col-title">A home for<br /><span>every season.</span></h1>
            <p className={s.lead}>Provence in June, the Alps when the snow falls, the Mediterranean in autumn, and Paris, London or Rome whenever the mood takes you. Our collections bring Europe&rsquo;s most loved places together, and look after every home for you.</p>
            <div className={s.actions}>
              <a className="rd-btn rd-btn-primary" href="#the-collections">Explore the collections <span aria-hidden="true">↘</span></a>
              <a className={s.textLink} href="#enquire">Speak to us <span aria-hidden="true">↗</span></a>
            </div>
            <p className={s.inventory}>
              {Number.isFinite(from) && <strong>From {formatMoney(from)}</strong>}
              <span>{collections.length} collections · {weeksLabel(small || horizon)} to {weeksLabel(horizon)} weeks a year</span>
            </p>
          </div>
          <figure className={s.heroImage}>
            {heroSrc && <Image src={heroSrc} alt="A villa and pool in the hills above Cannes" width={1600} height={1100} sizes="(max-width: 760px) calc(100vw - 40px), 52vw" priority quality={88} style={{ backgroundColor: '#eeeee9', objectFit: 'cover' }} />}
          </figure>
        </section>

        <nav className={`${s.chapterNav} rd-container`} aria-label="On this page">
          {collections.map(col => <a key={col.slug} href={`#c-${col.slug}`}>{col.name.replace(/^The /, '').replace(/ Collection$/, '')}<span aria-hidden="true">↘</span></a>)}
          <a href="#how">How it works<span aria-hidden="true">↘</span></a>
          <a href="#questions">Questions<span aria-hidden="true">↘</span></a>
        </nav>

        <section className={`${s.section} rd-container ${s.idea}`} id="idea">
          <div data-rv>
            <p className={s.kicker}>The idea</p>
            <h2>Every season,<br />in its best place.</h2>
            <p className={s.body}>Most holiday homes end up being every holiday in the same place. A collection works the other way round: a set of homes across Europe, each chosen for the time of year when its place is at its best, and you own a share of all of them.</p>
            <p className={s.body}>Depending on the collection, February can be the snow in Chamonix, June the hills above Cannes, the autumn a terrace on the Costa del Sol, and the long weekends in between London, Paris or Rome. Everything is booked on one shared calendar, and every home is furnished and looked after between stays, so you arrive and simply live.</p>
          </div>
          {ideaSrc && <div className={s.ownershipPhoto} data-rv>
            <Image src={ideaSrc} alt="The mountains above Chamonix in winter" width={1600} height={1100} sizes="(max-width: 760px) 100vw, 45vw" quality={85} style={{ objectFit: 'cover' }} />
          </div>}
        </section>
        <section className={`${s.ownershipDetails} ${c.hubDetails} rd-container`} aria-label="A collection in brief">
          {[
            ['A place for every season', 'Mountains in winter, the Mediterranean in summer, the great cities whenever you like.'],
            [`${weeksLabel(horizon)} weeks a year`, `A shared calendar spreads the year fairly across the homes.${small ? ` The ${small.name.replace(/^The /, '')} is smaller: ${weeksLabel(small)} weeks, at a lower price.` : ''}`],
            ['Nothing to organise', 'Furnished and equipped down to the last glass. Cleaning, maintenance, bills and repairs are taken care of between your stays.'],
            ['Yours to share', 'Bring family and friends, or lend them your weeks. The homes are kept for owners and their guests.'],
          ].map(([h, p], i) => <article key={h} data-rv><span className={s.detailNumber}>0{i + 1}</span><h3>{h}</h3><p>{p}</p></article>)}
        </section>

        <div id="the-collections" className={c.hubCols}>
          {collections.map((col, i) => {
            const hs = col.homes || [];
            const n = col.homes_count || hs.length;
            const story = STORY[col.slug] || { places: hs.map(h => h.chapter || h.city).join(', '), line: col.tagline, body: [col.tagline].filter(Boolean), seasons: {} };
            const pics = photosOf(col).slice(0, 5);
            return (
              <section key={col.slug} id={`c-${col.slug}`} className={`${c.hubCol} ${i % 2 ? c.hubColAlt : ''}`} aria-labelledby={`h-${col.slug}`}>
                <div className={`${c.hubColInner} rd-container`}>
                  <div className={c.hubColPics} data-rv>
                    {pics[0] && <Link href={collectionHref(col.slug)} className={c.hubColMain} aria-label={col.name}>
                      <Image src={pics[0].src} alt={`${pics[0].label}, ${col.name}`} fill sizes="(max-width: 960px) 100vw, 55vw" quality={85} style={{ objectFit: 'cover' }} />
                      <span className={c.hubPicLabel}>{pics[0].label}</span>
                    </Link>}
                    <div className={c.hubColSmall}>
                      {pics.slice(1).map(p => <div key={p.src} className={c.hubColThumb}>
                        <Image src={p.src} alt={`${p.label}, ${col.name}`} fill sizes="(max-width: 960px) 50vw, 27vw" quality={80} style={{ objectFit: 'cover' }} />
                        <span className={c.hubPicLabel}>{p.label}</span>
                      </div>)}
                    </div>
                  </div>
                  <div className={c.hubColText} data-rv>
                    <p className={s.kicker}>{col.name} · {WORDS[n] || n} homes</p>
                    <h2 id={`h-${col.slug}`}>{story.places}</h2>
                    {story.line && <p className={c.hubLine}>{story.line}</p>}
                    {story.body.map((para, k) => <p key={k} className={s.body}>{para}</p>)}
                    <ul className={c.hubHomes}>
                      {hs.map((h, k) => <li key={h.key}><em>0{k + 1}</em><strong>{h.chapter || h.city}</strong><span>{h.name}</span>{story.seasons?.[h.chapter || h.city] && <i>{story.seasons[h.chapter || h.city]}</i>}</li>)}
                    </ul>
                    <dl className={c.lItemMeta}>
                      <div><dt>All {n} homes</dt><dd>{formatMoney(col.price, col.currency)}</dd></div>
                      <div><dt>Weeks a year</dt><dd>{weeksLabel(col)}</dd></div>
                    </dl>
                    <Link className="rd-btn rd-btn-primary" href={collectionHref(col.slug)}>Discover the {col.name.replace(/^The /, '')} <span aria-hidden="true">↗</span></Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className={`${s.fit} rd-container`} aria-labelledby="fit-title">
          <div><p className={s.kicker}>One home or a collection</p><h2 id="fit-title">Which suits<br />the way you live?</h2></div>
          <div>
            <h3>A share of one home</h3>
            <p>Right if you already know your place: the same village, the same view, year after year, and the lowest way in.</p>
            <h3>A collection</h3>
            <p>Right if your year has more than one season in it: the mountains in winter, the sea in summer, a city for the long weekends, every home ready when you are.</p>
          </div>
        </section>

        <section className={`${s.section} ${s.journey} rd-container`} id="how">
          <div className={s.sectionHeading} data-rv><div><p className={s.kicker}>How it works</p><h2>From first look<br />to first stay.</h2></div><a className={s.textLink} href="#enquire">Speak to us ↗</a></div>
          <ol className={s.steps}>
            {[
              ['Find your collection', 'Read about the places and the homes, and choose the collection that fits the year you picture.'],
              ['See every home', 'Unlock the collection for every photograph and, where they exist, the floor plans.'],
              ['Talk it through', 'We answer personally, walk you through the calendar, the costs and the paperwork, and introduce you to the team that manages the homes.'],
              ['Arrive', 'Book your weeks through the shared calendar. The home is prepared; you open the door.'],
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
