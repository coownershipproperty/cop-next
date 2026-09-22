import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import { orderForCountry, countryFromCookie } from '@/lib/geoOrder';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/rd/Nav';
import Destinations from '@/components/rd/Destinations';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { saveUser } from '@/lib/savedUser';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import PropertyCard from '@/components/PropertyCard';
import ExpertForm from '@/components/ExpertForm';
import { createClient } from '@supabase/supabase-js';
import { getFeaturedSlugs } from '@/lib/featured-properties';
import { useState, useEffect, useRef } from 'react';

function NewsletterSignup() {
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
        body: JSON.stringify({ email, locale: 'en', [HONEYPOT_FIELD]: event.currentTarget.elements[HONEYPOT_FIELD]?.value || '' }),
      });
      const data = await response.json();
      setStatus(response.ok && data.ok ? 'success' : 'error');
      if (response.ok && data.ok) {
        saveUser({ email });
        trackConversion('sign_up', 'Lead', { method: 'newsletter', locale: 'en' });
        track('newsletter_signup', { locale: 'en' });
      }
    } catch { setStatus('error'); }
  }
  return <div className="rd-hero-signup">
    {status === 'success' ? <div className="rd-hero-signup-success" role="status">You're on the list. Thank you.</div> : <>
      <form className={`rd-hero-signup-field${open ? ' is-open' : ''}`} onSubmit={submit}>
        <HoneypotField />
        <input ref={inputRef} type="email" name="email" autoComplete="email" inputMode="email" aria-label="Email address for newsletter" placeholder="Your email address" required tabIndex={open ? 0 : -1} disabled={status === 'sending'} />
        {open && <button type="submit" aria-label="Subscribe to newsletter" disabled={status === 'sending'}>{status === 'sending' ? '…' : '→'}</button>}
        {!open && <button className="rd-hero-signup-open" type="button" onClick={() => { setOpen(true); inputRef.current.focus(); }}>Sign up to the newsletter</button>}
      </form>
      {status === 'error' && <p role="alert">Couldn't subscribe. Please try again.</p>}
    </>}
  </div>;
}

function NewsletterCopy() {
  return <div className="rd-newsletter-copy">
    <span className="rd-kicker">The Official Co-Ownership Newsletter</span>
    <h2>Be the first to know.</h2>
    <p>New homes, remarkable destinations, and a closer look at co-ownership. In your inbox.</p>
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

    // One 4.8 MB 720p loop for desktop — the same file the previous site used.
    // The 75 MB UHD render was pulled on 22 Sep 2026: bandwidth cost and
    // seconds of poster before playback, for no visible gain in a blurred hero.
    video.src = '/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduced.matches) video.play().catch(() => {});
    const onPreference = () => { if (reduced.matches) video.pause(); };
    reduced.addEventListener('change', onPreference);
    return () => reduced.removeEventListener('change', onPreference);
  }, []);
  return <>
    <video ref={videoRef} muted loop playsInline preload="metadata" poster={poster} aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}>
    </video>
    {!videoOff && <button type="button" aria-label={playing ? 'Pause background video' : 'Play background video'} onClick={() => { const v=videoRef.current; if(v.paused) v.play().catch(() => {}); else v.pause(); }} style={{position:'absolute',right:20,bottom:20,zIndex:5,width:40,height:40,borderRadius:'50%',border:'1px solid #ffffff60',background:'#13121099',color:'#fff',cursor:'pointer'}}>{playing ? 'Ⅱ' : '▶'}</button>}
  </>;
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };

// Keep the answer text unchanged for structured data; emphasis is presentational.
function FaqAnswer({ text }) {
  const emphasis = /(deeded share|not a timeshare or a membership|legal interest in the home itself|fully furnished and equipped|before you commit|around six weeks a year|booking rules differ by home|It depends on the home\.|managed rental programme|owners and their guests only|professional management team|owners' shared running costs|initial holding period|first refusal|Europe and the United States|New homes are added every week\.|A person replies|real availability, real figures)/g;
  return text.split(emphasis).map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part);
}

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
  { key: 'england',  country: 'England',  label: 'United Kingdom', href: '/england-fractional-ownership-properties/' },
  { key: 'sweden',   country: 'Sweden',   label: 'Sweden',        href: '/sweden-fractional-ownership-properties/' },
  { key: 'croatia',  country: 'Croatia',  label: 'Croatia',       href: '/croatia-fractional-ownership-properties/' },
];
// Tile photo per country: a real, bright listing photo (David, 20 Sep — the
// dark-graded set is for the hero only). Chosen by slug; if that home is no
// longer live the tile falls back to the top-priced live listing's photo.
const DEST_PICK = {
  usa: 'palm-desert-california-4-bed-house-with-pool',
  spain: 'peguera-mallorca-spain-4-bed-villa-with-sea-views-infinity-pool',
  italy: 'castiglioncello-del-trinoro-si-italy-4-bed-house',
  france: '7th-arrondissement-paris-france-2-bed-apartment',
  austria: 'burserberg-austria-3-bed-penthouse-with-mountain-views',
  germany: 'tegernsee-bavaria-germany-3-bed-penthouse-maisonette-with-lake-views',
  mexico: 'cabo-san-lucas-mexico-3-bed-villa-with-infinity-pool',
  portugal: 'albufeira-algarve-portugal-4-bed-villa-with-sea-view-roof-terrace',
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
    .select('slug, country, img, price, currency, partner, is_discreet')
    .in('status', ['Live', 'for_sale']);
  const byCountry = {};
  const imgBySlug = {};
  let minEur = null;
  const partners = new Set();
  for (const r of liveRows || []) {
    const c = r.country || '';
    // Discreet homes count towards each country (they are for sale, the
    // homepage total already includes them) but never lend their photo.
    const showable = !r.is_discreet;
    if (showable && r.slug && r.img) imgBySlug[r.slug] = r.img;
    if (!byCountry[c]) byCountry[c] = { count: 0, img: showable ? (r.img || '') : '', top: -1 };
    byCountry[c].count += 1;
    const pr = Number(r.price) || 0;
    if (showable && pr > byCountry[c].top && r.img) { byCountry[c].top = pr; byCountry[c].img = r.img; }
    if (r.currency === 'EUR' && pr > 0 && (minEur === null || pr < minEur)) minEur = pr;
    if (r.partner) partners.add(r.partner);
  }
  const destinations = DESTINATION_ORDER
    .map(({ key, country, label, href }) => ({
      key, label, href,
      count: byCountry[country]?.count || 0,
      img: ({ usa: '/redesign/usa-palm-desert.jpg', spain: '/redesign/spain-sunny-v1.png', portugal: '/redesign/portugal-tidy-v1.png' })[key] || imgBySlug[DEST_PICK[key]] || byCountry[country]?.img || '',
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

  const homes = featured.slice(0, 6);
  // Fixed editorial hero, independent of the rotating featured-home cards.
  const heroHome = {
    slug: 'breckenridge-colorado-4-bed-house-with-mountain-views',
    title: 'Breckenridge, Colorado, USA',
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/breckenridge-colorado-4-bed-house-with-mountain-views/hero.jpg',
  };

  return (
    <>
      <Head>
        <title>Co-Ownership Property | Luxury Fractional Ownership</title>
        {hreflangLinks({ englishPath: '/' })}
        <meta name="description" content={`Browse ${propertyCount}+ luxury co-ownership homes across Europe and the USA. Real, deeded ownership of a managed second home — for a fraction of the price of buying alone.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/" />
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

      <div className="rd rd-home rd-home-light">
        <Nav />

        {/* ── Hero ── */}
        <section className="rd-hero" aria-label="Introduction">
          <div className="rd-hero-media">
            <HeroVideo poster="/redesign/cop-home-first-frame.jpg" />
          </div>
          <div className="rd-hero-shade" />
          <div className="rd-hero-inner">
            <div className="rd-hero-copy">
              <h1 className="rd-h1">Your window to the world’s finest <span className="hero-ownership-accent">co-ownership.</span></h1>
              <p className="rd-lead">Real, deeded ownership of a fully managed second home — for a fraction of the price of buying it alone.</p>
              <div className="rd-btn-row">
                <Link href="/our-homes/" className="rd-btn">Browse properties →</Link>
                <Link href="/how-it-works/" className="rd-btn rd-btn-ghost">How it works</Link>
              </div>
            </div>
            <aside className="rd-hero-proof rd-hero-newsletter" aria-label="Newsletter">
              <NewsletterCopy />
              <NewsletterSignup />
            </aside>
          </div>
        </section>

        {/* ── Featured homes ── */}
        <section className="rd-section" id="properties" aria-labelledby="h-homes">
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">Featured homes</span>
                <h2 className="rd-h2" id="h-homes">Homes worth owning a piece of.</h2>
                <p className="rd-lead">A rotating selection from {propertyCount} co-ownership homes. Prices are for a single share, fully furnished.</p>
              </div>
              <Link href="/our-homes/" className="rd-btn-link">All {propertyCount} homes →</Link>
            </div>
            <div className="rd-grid-3 rd-cards rd-editorial-cards">
              {homes.map((p, i) => (
                <div key={p.slug} data-rv={String(i % 3 + 1)}><PropertyCard property={p} editorial /></div>
              ))}
            </div>
            <Link href="/our-homes/" className="rd-featured-see-all">See all properties <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        {/* ── Destinations ── */}
        <section className="rd-section" id="destinations" aria-labelledby="h-dest" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-head-row" data-rv>
              <div>
                <span className="rd-kicker">Where</span>
                <h2 className="rd-h2" id="h-dest">Our destinations.</h2>
                <p className="rd-lead">Every home we have in each country, on one page.</p>
              </div>
              <Link href="/our-homes/" className="rd-btn-link">All destinations →</Link>
            </div>
            <Destinations destinations={destinations} />
          </div>
        </section>

        {/* ── Values ── */}
        <section className="rd-section rd-values-chapter" aria-labelledby="h-values" style={{ paddingTop: 0 }}>
          <div className="rd-container">
            <div className="rd-values" data-rv>
              <div className="rd-values-media"><Image src="/redesign/usa-palm-desert.jpg" alt="" fill sizes="100vw" loading="lazy" /></div>
              <div className="rd-values-inner">
                <div className="rd-values-head">
                  <span className="rd-kicker">How it works</span>
                  <h2 className="rd-h2" id="h-values"><span className="values-title-desktop">The difference is in the details.</span><span className="values-title-mobile">HOW IT WORKS</span></h2>
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
                <div className="rd-btn-row">
                  <Link href="/how-it-works/" className="rd-btn rd-btn-ghost">How co-ownership works</Link>
                  <a href="#speak-to-expert" className="rd-btn rd-btn-ghost" onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    const section = document.getElementById('speak-to-expert');
                    if (!section) return;
                    event.preventDefault();
                    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                    window.history.replaceState(window.history.state, '', '#speak-to-expert');
                  }}>Speak to an expert</a>
                </div>
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
                  <h2 className="rd-h2" id="h-posts">Our blog.</h2>
                </div>
                <Link href="/all-our-blog/" className="rd-btn-link">All articles →</Link>
              </div>
              <div className="rd-grid-3">
                {latestPosts.map((post, i) => (
                  <Link key={post.slug} href={`/blog/${post.slug}/`} className="rd-card rd-post" data-rv={String(i + 1)}>
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
                <span className="rd-kicker">Questions</span>
                <h2 className="rd-h2" id="h-faq">Frequently asked questions.</h2>
              </div>
            </div>
            <div className="rd-faq" data-rv>
              {HOMEPAGE_FAQS.map((f, i) => (
                <details key={i}>
                  <summary>{f.q}</summary>
                  <p><FaqAnswer text={f.a} /></p>
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
