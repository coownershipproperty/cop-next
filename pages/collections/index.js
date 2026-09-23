// /collections/ — every multi-home collection, in the site's black-and-white
// style with plenty of colour photography (David, 23 Sep 2026: "a mix of pics
// thrown into our black/white aesthetic"). Copy rules: lib/collections.js.
// Until a collection is Live this page 404s on the real site; it only exists
// in a local preview build (NEXT_PUBLIC_COLLECTIONS_PREVIEW=1).
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import { loadCollections, collectionHref, formatMoney, COLLECTIONS_PREVIEW } from '@/lib/collections';
import c from '@/styles/collections.module.css';

export async function getStaticProps() {
  const all = await loadCollections();
  // New-share collections first; resale collections are never featured.
  const collections = all.filter(x => x.share_type !== 'resale');
  if (!collections.length) return { notFound: true, revalidate: 3600 };
  return { props: { collections }, revalidate: 3600 };
}

function Pic({ src, alt, sizes, priority = false }) {
  return src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={85} style={{ objectFit: 'cover' }} /> : null;
}

export default function CollectionsIndex({ collections }) {
  const first = collections[0];
  const homes = first.homes || [];
  const pick = key => homes.find(h => h.key === key) || homes[0];
  const heroA = pick('grasse')?.photos?.[0] || first.hero_image;
  const heroB = pick('estepona')?.photos?.[0];
  const heroC = pick('les-praz')?.photos?.[0];
  const strip = pick('estepona')?.photos?.[1] || heroB;
  const minWeeks = Math.round(first.weeks_per_year || 12);
  return (
    <>
      <Head>
        <title>Collections: several homes, one purchase | Co-Ownership Property</title>
        <meta name="description" content="Collections bring several holiday homes together in one purchase: Provence, the Costa del Sol, the Alps and more, around twelve weeks a year, fully managed." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/collections/" />
        {COLLECTIONS_PREVIEW && <meta name="robots" content="noindex,nofollow" />}
      </Head>
      <div className={`rd rd-home-light ${c.landing}`}>
        <Nav />
        <main>
          <section className={`${c.hero} rd-container`}>
            <div>
              <p className={c.heroKicker}>Collections</p>
              <h1 className={c.heroTitle}>Several homes.<br />One purchase.</h1>
              <p className={c.heroLead}>
                A collection is a set of holiday homes bought together. You own a share of all of them and move between them through the year: Provence in June, the sea in autumn, the Alps when the snow comes. Every home is furnished, equipped and looked after for you.
              </p>
              <a className="rd-btn rd-btn-primary" href="#all-collections">See the collections <span aria-hidden="true">↘</span></a>
            </div>
            <div className={c.heroMosaic}>
              <div className={`${c.heroCell} ${c.heroCellTall}`}><Pic src={heroA} alt="Villa with pool above Cannes" sizes="(max-width: 900px) 60vw, 28vw" priority /></div>
              <div className={c.heroCell}><Pic src={heroB} alt="Beachfront terrace on the Costa del Sol" sizes="(max-width: 900px) 40vw, 20vw" /></div>
              <div className={c.heroCell}><Pic src={heroC} alt="Mont Blanc from a Chamonix balcony" sizes="(max-width: 900px) 40vw, 20vw" /></div>
            </div>
          </section>

          <section className="rd-container">
            <div className={c.facts}>
              <div className={c.fact}><strong>{first.homes_count || homes.length}</strong><span>homes in one purchase</span></div>
              <div className={c.fact}><strong>~{minWeeks}</strong><span>weeks a year across the homes</span></div>
              <div className={c.fact}><strong>1</strong><span>monthly cost for every home</span></div>
              <div className={c.fact}><strong>0</strong><span>things for you to organise</span></div>
            </div>
          </section>

          <section className="rd-container" id="all-collections">
            <h2 className={c.sectionTitle}>The collections</h2>
            <div className={c.list}>
              {collections.map(col => {
                const hs = col.homes || [];
                const photos = [hs[0]?.photos?.[0], hs[1]?.photos?.[0], hs[3]?.photos?.[0] || hs[2]?.photos?.[0], hs[4]?.photos?.[0] || hs[2]?.photos?.[1], hs[2]?.photos?.[0]].filter(Boolean);
                const ready = hs.filter(h => h.readiness === 'ready').length;
                return (
                  <article key={col.slug} className={c.item}>
                    <Link href={collectionHref(col.slug)} className={c.itemPhotos} aria-label={col.name}>
                      {photos.slice(0, 5).map((src, i) => (
                        <div key={src} className={`${c.itemPhoto}${i === 0 ? ` ${c.itemPhotoMain}` : ''}`}><Pic src={src} alt={`${col.name} ${i + 1}`} sizes={i === 0 ? '(max-width: 900px) 60vw, 30vw' : '15vw'} /></div>
                      ))}
                    </Link>
                    <div>
                      <p className={c.itemPlaces}>{hs.map(h => h.city).join(' · ')}</p>
                      <h3 className={c.itemTitle}>{col.name}</h3>
                      <p className={c.itemText}>{col.tagline}</p>
                      <div className={c.itemMeta}>
                        <span><strong>{formatMoney(col.price, col.currency)}</strong>for all {col.homes_count || hs.length} homes</span>
                        <span><strong>~{Math.round(col.weeks_per_year || 12)}</strong>weeks a year</span>
                        {col.monthly_cost > 0 && <span><strong>{formatMoney(col.monthly_cost, col.currency)}</strong>a month</span>}
                        <span><strong>{ready}</strong>ready now</span>
                      </div>
                      <Link className="rd-btn rd-btn-primary" href={collectionHref(col.slug)}>View the collection <span aria-hidden="true">↗</span></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {strip && (
            <figure className={c.strip}>
              <Image src={strip} alt="The sea from a terrace on the Costa del Sol" fill sizes="100vw" style={{ objectFit: 'cover' }} />
              <figcaption>One home for the summer, another for the snow, and nothing to manage in between.</figcaption>
            </figure>
          )}

          <section className="rd-container">
            <h2 className={c.sectionTitle}>How a collection works</h2>
            <ol className={c.steps}>
              <li><span>01</span><h3>One purchase</h3><p>You buy a share of the company that owns every home in the collection. The homes are bought outright, with no mortgage on them.</p></li>
              <li><span>02</span><h3>Book across the homes</h3><p>A points calendar spreads the year fairly between owners, around {minWeeks} weeks each, with at least one ski week. Longer stays are common outside high season.</p></li>
              <li><span>03</span><h3>Arrive and live</h3><p>The homes are renovated, furnished and stocked, then cleaned, maintained and insured by the management team. One monthly cost covers them all.</p></li>
            </ol>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
