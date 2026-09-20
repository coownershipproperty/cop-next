import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import { orderForCountry, countryFromCookie } from '@/lib/geoOrder';
import Image from 'next/image';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import PropertyCard from '@/components/PropertyCard';
import ExpertForm from '@/components/ExpertForm';
import { createClient } from '@supabase/supabase-js';
import { getFeaturedSlugs } from '@/lib/featured-properties';
import { useState, useEffect } from 'react';

const SYM = { EUR: '€', USD: '$', GBP: '£' };

// Single source of truth for the homepage FAQ — drives the FAQPage JSON-LD
// below and the visible accordion. Nights: 42–45 depending on the home, so
// the copy says "around six weeks" and sends the exact figure to the enquiry.
const HOMEPAGE_FAQS = [
  { q: "What is co-ownership of a holiday home?", a: "You and a small number of other owners each buy a deeded share of a fully managed home — typically one eighth. It is real property ownership, registered in your name, not a timeshare or a membership. You get the home, the furnishings and the management, at a fraction of the cost of buying it alone." },
  { q: "How is it different from a timeshare?", a: "A timeshare sells you time; co-ownership sells you the property. Your share is a legal interest in the home itself, so you benefit if it rises in value and you can sell it on the open market when you choose. There is no points system and no lock-in." },
  { q: "What does the price include?", a: "Your share of the home, fully furnished and equipped to a turnkey standard. What sits on top varies by country — purchase taxes and notary fees in Spain, for example — and we tell you exactly what applies to any home you ask about, before you commit." },
  { q: "How much time do I get?", a: "A one-eighth share gives you around six weeks a year, scheduled so every owner gets peak dates over time. Each home has a booking app where you reserve stays months ahead and pick up unused weeks at short notice. The exact number of nights and the booking rules differ by home, and we set them out for you." },
  { q: "Can I rent out my weeks?", a: "It depends on the home. Some homes hold a tourist licence and run a managed rental programme; others are for owners and their guests only. We check the policy for every home before we tell you it can be let." },
  { q: "Who looks after the property?", a: "A professional management team handles maintenance, housekeeping, insurance and repairs, funded by the owners' shared running costs. You arrive to a ready home and leave the rest to them." },
  { q: "Can I sell my share later?", a: "Yes. After an initial holding period — usually twelve months — you can sell at a price you set. Your co-owners typically get first refusal, then it goes to the open market. We can help you find a buyer." },
  { q: "Where are the homes?", a: "Across Europe and the United States: the Alps, the Balearics and the Costa del Sol, Tuscany and the Italian lakes, Paris, London, Portugal, Austria, Germany, and the American West and Florida. New homes are added every week." },
  { q: "How do I get started?", a: "Browse the homes, or tell us where and when you would like to be there. A person replies — usually within a few hours — with real availability, real figures and the questions worth asking." },
];

// Destination tiles: order, pillar-page href and label. The dark-graded tile
// images come from David's 20 Sep set (public/redesign/); countries without
// one fall back to the top-priced live listing's photo.
const DESTINATION_ORDER = [
  { key: 'usa',      country: 'USA',      label: 'United States', href: '/usa-fractional-ownership-properties/' },
  { key: 'spain',    country: 'Spain',    label: 'Spain',         href: '/spain-fractional-ownership-properties/' },
  { key: 'italy',    country: 'Italy',    label: 'Italy',         href: '/italy-fractional-ownership-properties/' },
  { key: 'france',   country: 'France',   label: 'France',        href: '/france-fractional-ownership-properties/' },
  { key: 'austria',  country: 'Austria',  label: 'Austria',       href: '/austria-fractional-ownership-properties/' },
  { key: 'germany',  country: 'Germany',  label: 'Germany',       href: '/germany-fractional-ownership-properties/' },
  { key: 'mexico',   country: 'Mexico',   label: 'Mexico',        href: '/mexico-fractional-ownership-properties/' },
  { key: 'portugal', country: 'Portugal', label: 'Portugal',      href: '/portugal-fractional-ownership-properties/' },
  { key: 'england',  country: 'England',  label: 'England',       href: '/england-fractional-ownership-properties/' },
  { key: 'sweden',   country: 'Sweden',   label: 'Sweden',        href: '/sweden-fractional-ownership-properties/' },
  { key: 'croatia',  country: 'Croatia',  label: 'Croatia',       href: '/croatia-fractional-ownership-properties/' },
];
// Tile photo per country: a real, bright listing photo (David, 20 Sep — the
// dark-graded set is for the hero only). Chosen by slug; if that home is no
// longer live the tile falls back to the top-priced live listing's photo.
const DEST_PICK = {
  usa: 'vail-colorado-4-bed-house-with-hot-tub-2',
  spain: 'nova-santa-ponsa-spain-4-bed-villa-with-infinity-pool',
  italy: 'castiglioncello-del-trinoro-si-italy-4-bed-house',
  france: '7th-arrondissement-paris-france-2-bed-apartment',
  austria: 'stuben-vorarlberg-austria-2-bed-penthouse-with-mountain-views-sauna',
  germany: 'tegernsee-bavaria-germany-3-bed-penthouse-maisonette-with-lake-views',
  mexico: 'cabo-san-lucas-mexico-3-bed-villa-with-infinity-pool',
  portugal: 'lagos-algarve-portugal-2-bed-terrace-apartment-with-sea-views',
  england: 'london-england-3-bed-house-2',
  sweden: 'norrnas-sweden-5-bed-villa-with-terrace',
  croatia: 'kukci-croatia-3-bed-villa-with-sea-views',
};

// Press coverage of the operators whose homes we list — labelled as theirs,
// not ours (David, 17 Sep).
const PRESS = [
  { src: '/wp-content/uploads/2025/11/press-times.png', alt: 'The Times' },
  { src: '/wp-content/uploads/2025/11/press-ft.png', alt: 'Financial Times' },
  { src: '/wp-content/uploads/2025/11/press-forbes.png', alt: 'Forbes' },
  { src: '/wp-content/uploads/2025/11/press-businessinsider.png', alt: 'Business Insider' },
  { src: '/wp-content/uploads/2025/11/press-dailymail.png', alt: 'Daily Mail' },
  { src: '/wp-content/uploads/2025/11/press-luxtravel.png', alt: 'Luxury Travel Magazine' },
];

const VALUES = [
  { n: '01', h: 'Real ownership', p: 'A deeded share of the home itself, registered in your name. Not a timeshare, not a membership — you can sell it, pass it on, and gain if it rises in value.' },
  { n: '02', h: 'Your weeks, every year', p: 'Around six weeks a year with a one-eighth share, scheduled so everyone gets the peak dates over time. Book ahead in the owners\u2019 app; stay longer when weeks go unused.' },
  { n: '03', h: 'Looked after', p: 'Professionally managed and maintained, with the running costs shared. You arrive to a ready home and leave the rest to the team.' },
  { n: '04', h: 'Straight answers', p: 'Before you commit, you get the facts for the home you are looking at — the weeks, the running costs, how resale works — in plain language, from a person.' },
];

function fmtPrice(price, currency) {
  if (!price) return null;
  const sym = SYM[currency] || '';
  return sym + Number(price).toLocaleString('en-GB');
}
function fmtK(n) {
  if (!n) return null;
  return n >= 1000 ? '\u20ac' + Math.round(n / 1000) + 'k' : '\u20ac' + n;
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let FEATURED_PROPERTY_SLUGS = await getFeaturedSlugs(supabase);

  // Self-healing daily rotation: if the featured table hasn't been rewritten
  // today (cron missed, scheduler hiccup), rotate it right here during the
  // ISR rebuild. computeFeaturedLineup is deterministic per date, so a later
  // cron run writing the same day's lineup is a harmless no-op.
  try {
    const { data: freshness } = await supabase
      .from('featured_properties')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    const lastWrite = freshness?.[0]?.updated_at ? freshness[0].updated_at.slice(0, 10) : null;
    const today = new Date().toISOString().slice(0, 10);
    if (lastWrite && lastWrite < today && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { computeFeaturedLineup } = await import('@/lib/featured-rotation');
      const { createSupabaseAdminClient } = await import('@/lib/supabaseAdmin');
      const db = createSupabaseAdminClient();
      const lineup = await computeFeaturedLineup(db, today);
      if (lineup && lineup.length > 0) {
        const now = new Date().toISOString();
        await db.from('featured_properties').delete().neq('slug', '');
        await db.from('featured_properties').insert(
          lineup.map((item, i) => ({ slug: item.slug, position: i, reason: item.reason, updated_at: now }))
        );
        FEATURED_PROPERTY_SLUGS = lineup.map((l) => l.slug);
        console.log(`[index] self-healed featured rotation for ${today} (${lineup.length} slots)`);
      }
    }
  } catch (e) {
    console.error('[index] self-heal rotation skipped:', e.message);
  }

  // Featured properties from Supabase
  const { data: rows, error: featuredError } = await supabase
    .from('properties')
    .select('slug, title, img, images, total_images, drive_url, region, country, price, currency, share_denominator, beds, size, date_added, is_discreet')
    .in('slug', FEATURED_PROPERTY_SLUGS)
    .in('status', ['Live', 'for_sale'])
    .eq('is_discreet', false);

  const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
  const featuredProps = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(Boolean)
    .map(p => ({
      slug: p.slug,
      title: p.title,
      img: p.img,
      images: (p.images || []).slice(0, 3),
      totalImages: p.is_discreet ? 1 : (p.total_images || 0),
      hasGallery: !p.is_discreet && !!p.drive_url,
      discreet: !!p.is_discreet,
      share_denominator: p.share_denominator || null,
      dateAdded: p.date_added || null,
      region: p.region || '',
      country: p.country || '',
      price: p.price || null,
      currency: p.currency || 'EUR',
      beds: p.beds || null,
      size: p.size || null,
      // "New" tag — listed in the last 7 days. Computed at build; the page
      // revalidates hourly so it stays fresh enough.
      isNew: !!(p.date_added && (Date.now() - Date.parse(p.date_added)) < 7 * 864e5),
    }));

  // Live property count from Supabase
  const { count: propertyCount, error: countError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Live', 'for_sale']);

  // Latest 3 blog posts from Supabase
  const { data: postRows, error: postsError } = await supabase
    .from('posts')
    .select('slug, title, excerpt, date, hero_image, category')
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(3);

  if (featuredError || countError || postsError) {
    console.error('Supabase error (homepage):', {
      featured: featuredError,
      count: countError,
      posts: postsError,
    });
    // A failed ISR refresh must leave the last known-good homepage intact.
    throw new Error('Unable to refresh homepage data from Supabase');
  }
  const latestPosts = (postRows || []).map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || '',
    dateFormatted: p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '',
    heroImage: p.hero_image || '',
    category: p.category || '',
  }));

  // Destinations + headline numbers, from the same live inventory. One query,
  // ~300 rows at build time; nothing here is typed in by hand.
  const { data: liveRows } = await supabase
    .from('properties')
    .select('slug, country, img, price, currency, partner')
    .in('status', ['Live', 'for_sale'])
    .eq('is_discreet', false);
  const byCountry = {};
  const bySlug = {};
  let minEur = null;
  const partners = new Set();
  for (const r of liveRows || []) {
    const c = r.country || '';
    if (r.slug && r.img) bySlug[r.slug] = r.img;
    if (!byCountry[c]) byCountry[c] = { count: 0, img: r.img || '', top: -1 };
    byCountry[c].count += 1;
    const pr = Number(r.price) || 0;
    if (pr > byCountry[c].top && r.img) { byCountry[c].top = pr; byCountry[c].img = r.img; }
    if (r.currency === 'EUR' && pr > 0 && (minEur === null || pr < minEur)) minEur = pr;
    if (r.partner) partners.add(r.partner);
  }
  const destinations = DESTINATION_ORDER
    .map(({ key, country, label, href }) => ({
      key, label, href,
      count: byCountry[country]?.count || 0,
      img: bySlug[DEST_PICK[key]] || byCountry[country]?.img || '',
    }))
    .filter(d => d.count > 0);
  const stats = {
    homes: propertyCount || 0,
    countries: Object.keys(byCountry).filter(Boolean).length,
    operators: partners.size,
    fromEur: minEur,
  };

  return { props: { propertyCount: propertyCount || 0, featuredProps, latestPosts, destinations, stats }, revalidate: 3600 };
}

export default function Home({ propertyCount, featuredProps, latestPosts, destinations = [], stats = {} }) {
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

  const homes = featured.slice(0, 8);
  const tiles = destinations.slice(0, 8);

  return (
    <>
      <Head>
        <title>Co-Ownership Property | Luxury Fractional Ownership</title>
        {hreflangLinks({ englishPath: '/' })}
        <meta name="description" content={`Browse ${propertyCount}+ luxury co-ownership homes across Europe and the USA. Real, deeded ownership of a managed second home — for a fraction of the price of buying alone.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/" />
        <link rel="preload" as="image" href="/redesign/hero-lounge.webp" media="(min-width: 861px)" />
        <link rel="preload" as="image" href="/redesign/hero-lounge-m.webp" media="(max-width: 860px)" />
        <meta property="og:title" content="Co-Ownership Property | Luxury Fractional Ownership" />
        <meta property="og:description" content="Browse 300+ luxury fractional ownership homes across Europe and the USA. Real ownership from a fraction of the cost." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://co-ownership-property.com/#organization",
              "name": "Co-Ownership Property",
              "legalName": "PREMPROPERTY SL",
              "taxID": "B93358489",
              "url": "https://co-ownership-property.com",
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
              "@id": "https://co-ownership-property.com/#website",
              "name": "Co-Ownership Property",
              "url": "https://co-ownership-property.com",
              "publisher": { "@id": "https://co-ownership-property.com/#organization" },
              "inLanguage": "en"
            },
            {
              "@type": "FAQPage",
              "mainEntity": HOMEPAGE_FAQS.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
            }
          ]
        }) }} />
      </Head>

      <div className="rd rd-home">
        <Nav />

        {/* ── Hero ── */}
        <section className="rd-hero" aria-label="Introduction">
          <div className="rd-hero-media">
            <picture>
              <source media="(max-width: 860px)" srcSet="/redesign/hero-lounge-m.webp" />
              <img src="/redesign/hero-lounge.webp" alt="A dark-wood living room with a fire lit, looking out onto autumn trees" fetchPriority="high" decoding="async" />
            </picture>
          </div>
          <div className="rd-hero-shade" />
          <div className="rd-hero-inner">
            <div className="rd-hero-copy">
              <span className="rd-kicker" style={{ color: 'rgba(243,242,238,0.7)' }}>Luxury co-ownership · Europe &amp; the USA</span>
              <h1 className="rd-h1">Own a share of somewhere extraordinary.</h1>
              <p className="rd-lead">Real, deeded ownership of a fully managed second home — for a fraction of the price of buying it alone.</p>
              <div className="rd-btn-row">
                <a href="/our-homes/" className="rd-btn">Explore the homes</a>
                <a href="#speak-to-expert" className="rd-btn rd-btn-ghost">Speak to us</a>
              </div>
            </div>
            <aside className="rd-hero-proof" aria-label="At a glance">
              <dl>
                <div><dt>{stats.homes || propertyCount}</dt><dd>homes for sale</dd></div>
                <div><dt>{stats.countries || 11}</dt><dd>countries</dd></div>
                {stats.fromEur && <div><dt>from {fmtK(stats.fromEur)}</dt><dd>for a share</dd></div>}
                <div><dt>1/8</dt><dd>typical share</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        {/* ── Press (the operators' coverage, labelled as theirs) ── */}
        <section className="rd-section-tight" aria-label="Press">
          <div className="rd-container">
            <div className="rd-press" data-rv>
              <span className="rd-press-label">The homes we list have been covered in</span>
              <div className="rd-press-track" aria-hidden="false">
                {[0, 1].map(pass => (
                  <div className="rd-press-logos" key={pass} aria-hidden={pass === 1 ? 'true' : undefined}>
                    {PRESS.map(p => <img key={p.alt} src={p.src} alt={pass === 0 ? p.alt : ''} loading="lazy" />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured homes ── */}
        <section className="rd-section" id="properties" aria-labelledby="h-homes">
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">This week</span>
                <h2 className="rd-h2" id="h-homes">Homes worth owning a piece of.</h2>
                <p className="rd-lead">A rotating selection from {propertyCount} co-ownership homes. Prices are for a single share, fully furnished.</p>
              </div>
              <a href="/our-homes/" className="rd-btn rd-btn-ghost">All {propertyCount} homes</a>
            </div>
            <div className="rd-grid-4 rd-cards">
              {homes.map((p, i) => (
                <div key={p.slug} data-rv={String(Math.min(i % 4 + 1, 4))}><PropertyCard property={p} priority={i < 4} /></div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Destinations ── */}
        <section className="rd-section" id="destinations" aria-labelledby="h-dest" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">Where</span>
                <h2 className="rd-h2" id="h-dest">Eleven countries. One way to own.</h2>
                <p className="rd-lead">Every home we have in each country, on one page.</p>
              </div>
              <a href="/our-homes/" className="rd-btn-link">All destinations →</a>
            </div>
            <div className="rd-dest-grid">
              {tiles.map((d, i) => (
                <a key={d.key} href={d.href} className={`rd-dest${i < 2 ? ' is-wide' : ''}`} data-rv={String(Math.min(i % 3 + 1, 3))}>
                  {d.img && (d.img.startsWith('/')
                    ? <img src={d.img} alt="" loading="lazy" />
                    : <Image src={d.img} alt="" fill sizes="(max-width: 1000px) 50vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />)}
                  <div className="rd-dest-label"><b>{d.label}</b><span>{d.count} {d.count === 1 ? 'home' : 'homes'}</span></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="rd-section" aria-labelledby="h-values" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-values" data-rv>
              <div className="rd-values-media"><img src="/redesign/values-casa-bianca.webp" alt="" loading="lazy" /></div>
              <div className="rd-values-inner">
                <div className="rd-values-head">
                  <span className="rd-kicker">How it works</span>
                  <h2 className="rd-h2" id="h-values">The difference is in the details.</h2>
                  <p className="rd-lead">What co-ownership actually gives you.</p>
                </div>
                <div className="rd-values-grid">
                  {VALUES.map((v, i) => (
                    <div className="rd-value" key={v.n} data-rv={String(i + 1)}>
                      <b>{v.n}</b>
                      <h3>{v.h}</h3>
                      <p>{v.p}</p>
                    </div>
                  ))}
                </div>
                <div className="rd-btn-row"><a href="/how-it-works/" className="rd-btn rd-btn-ghost">How co-ownership works</a></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Latest insights ── */}
        {latestPosts?.length > 0 && (
          <section className="rd-section" aria-labelledby="h-posts" style={{ paddingTop: 0 }}>
            <div className="rd-container">
              <div className="rd-head-row" data-rv>
                <div>
                  <span className="rd-kicker">Reading</span>
                  <h2 className="rd-h2" id="h-posts">Before you buy.</h2>
                </div>
                <a href="/all-our-blog/" className="rd-btn-link">All articles →</a>
              </div>
              <div className="rd-grid-3">
                {latestPosts.map((post, i) => (
                  <a key={post.slug} href={`/blog/${post.slug}/`} className="rd-card rd-post" data-rv={String(i + 1)}>
                    <div className="rd-media">
                      {post.heroImage && <Image src={post.heroImage} alt={post.title} fill sizes="(max-width: 900px) 50vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />}
                    </div>
                    <div className="rd-post-body">
                      <div className="rd-post-date">{post.category ? `${post.category} · ` : ''}{post.dateFormatted}</div>
                      <div className="rd-post-title">{post.title}</div>
                    </div>
                  </a>
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
                <span className="rd-kicker">Questions</span>
                <h2 className="rd-h2" id="h-faq">Straight answers.</h2>
              </div>
            </div>
            <div className="rd-faq" data-rv>
              {HOMEPAGE_FAQS.map((f, i) => (
                <details key={i}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="rd-section" aria-label="Newsletter" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-news" data-rv>
              <div className="rd-news-media"><img src="/redesign/newsletter-kings-yard.webp" alt="" loading="lazy" /></div>
              <div className="rd-news-body"><Newsletter /></div>
            </div>
          </div>
        </section>

        {/* ── Enquiry ── */}
        <section className="rd-section" aria-label="Enquiry" style={{ paddingTop: 0 }}>
          <div className="rd-container" data-rv>
            <ExpertForm />
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="rd-section" aria-label="Get started" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-cta" data-rv>
              <img src="/redesign/cta-juliet.webp" alt="" loading="lazy" />
              <div>
                <h2 className="rd-h2">Ready to find your share?</h2>
                <p className="rd-lead" style={{ margin: '1rem auto 0' }}>Tell us where you would like to be and when. A person replies with real availability and real figures.</p>
                <div className="rd-btn-row">
                  <a href="/our-homes/" className="rd-btn">Browse the homes</a>
                  <a href="#speak-to-expert" className="rd-btn rd-btn-ghost">Speak to us</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
