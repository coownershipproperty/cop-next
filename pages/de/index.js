import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import { getFeaturedSlugs } from '@/lib/featured-properties';

import { useState, useRef, useEffect } from 'react';
import { localeColumns, localizedField } from '@/lib/i18n';

// German locale homepage. Structure mirrors pages/index.js (English) and
// pages/es/index.js (Spanish) exactly — same sections, same CSS classes,
// same images. Only the visible text and the CTA links are translated.
//
// Strategic notes from the German market research baked in:
//  - Title tag uses `Ferienimmobilie` and `Miteigentum` (highest-volume
//    German search terms).
//  - Body copy uses `Co-Ownership` as a kept English loanword (Germans
//    actually search for it that way) plus `Miteigentum` as the legal
//    German anchor. Sie register throughout.
//  - CTAs route to /de/ slugs where they exist; fall back to English for
//    pages we haven't localised yet (e.g. /our-homes/).

const SYM = { EUR: '€', USD: '$', GBP: '£' };

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const FEATURED_PROPERTY_SLUGS = await getFeaturedSlugs(supabase);

  const { data: rows } = await supabase
    .from('properties')
    .select(`slug, ${localeColumns(['title'], { locales: ['de'] })}, img, region, country, price, currency, beds, size`)
    .in('slug', FEATURED_PROPERTY_SLUGS)
    .in('status', ['Live', 'for_sale']);

  const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
  const featuredProps = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(Boolean)
    .map(p => ({
      slug: p.slug,
      // Use German title where the translation column has been populated;
      // fall back to English so pages render before translations are backfilled.
      title: localizedField(p, 'title', 'de'),
      img: p.img,
      region: p.region || '',
      country: p.country || '',
      price: p.price || null,
      currency: p.currency || 'EUR',
      beds: p.beds || null,
      size: p.size || null,
    }));

  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Live', 'for_sale']);

  const { data: postRows } = await supabase
    .from('posts')
    .select(`slug, ${localeColumns(['slug'], { locales: ['de'], base: false })}, ${localeColumns(['title'], { locales: ['de'] })}, ${localeColumns(['excerpt'], { locales: ['de'] })}, date, hero_image, category, published_de`)
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(3);

  // For latest-posts on /de/ we surface English posts when no German version
  // exists yet. Once published_de=true posts exist they take priority.
  const latestPosts = (postRows || []).map(p => ({
    slug: localizedField(p, 'slug', 'de'),
    title: localizedField(p, 'title', 'de'),
    excerpt: localizedField(p, 'excerpt', 'de') || '',
    dateFormatted: p.date ? new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '',
    heroImage: p.hero_image || '',
    category: p.category || '',
  }));

  return { props: { propertyCount: propertyCount || 0, featuredProps, latestPosts }, revalidate: 3600 };
}

const CARD_GAP = 20;

function getCardW() {
  if (typeof window === 'undefined') return 430;
  const vw = window.innerWidth;
  if (vw <= 480) return Math.min(vw - 40, 340);
  if (vw <= 768) return Math.min(vw - 48, 380);
  return 430;
}

function PropCarousel({ items, propertyCount }) {
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

  return (
    <div className="pc-wrap">
      <div
        className="pc-outer"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
                      <span className="pc-viewall-label">Immobilien</span>
                      <a href="/de/immobilien/" className="pc-viewall-btn" onClick={e => e.stopPropagation()}>Alle ansehen →</a>
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

            return (
              <div
                key={`${p.slug}-${copyNum}`}
                className={`pc-card${isActive ? ' pc-active' : ''}`}
                onClick={() => {
                  if (isActive) {
                    window.location.href = `/de/immobilien/${p.slug}`;
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
                      {p.size && <span>{p.size.toLocaleString('de-DE')} m²</span>}
                    </div>
                    {p.price && (
                      <span className="pc-panel-price">
                        {sym}{p.price.toLocaleString('de-DE')}
                      </span>
                    )}
                    <a href={`/de/immobilien/${p.slug}`} className="pc-panel-btn" onClick={e => e.stopPropagation()}>Immobilie ansehen →</a>
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
        <button className="pc-btn" onClick={() => move(-1)} aria-label="Zurück">&#8592;</button>
        <span className="pc-counter">{displayNum} / {propertyCount}</span>
        <button className="pc-btn" onClick={() => move(1)} aria-label="Weiter">&#8594;</button>
      </div>
    </div>
  );
}

export default function HomeDE({ propertyCount, featuredProps, latestPosts }) {
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

  return (
    <>
      <Head>
        <title>Luxus-Co-Ownership in Europa | Ferienimmobilie im Miteigentum — COP</title>
        <meta name="description" content="Entdecken Sie Co-Ownership- und Miteigentum-Ferienimmobilien auf Mallorca, Ibiza, an der Costa del Sol und in weiteren europäischen Destinationen. Echtes Eigentum mit notarieller Eintragung." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/" />
        {hreflangLinks({ englishPath: '/' })}
        <meta property="og:title" content="Luxus-Co-Ownership in Europa | Ferienimmobilie im Miteigentum — COP" />
        <meta property="og:description" content="Entdecken Sie Co-Ownership- und Miteigentum-Ferienimmobilien in ganz Europa. Echtes Eigentum, kein Timesharing." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/de/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
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
            <span className="hero-pre">Ihr Tor zu den</span>
            <em>besten Ferienimmobilien</em>
            <span className="hero-rule"></span>
            <span className="hero-post">im Miteigentum</span>
          </h1>
        </div>

        <div className="hero-bottom">
          <div className="hero-ctas">
            <a href="/de/immobilien/" className="hero-cta-primary">Immobilien ansehen &rarr;</a>
            <a href="/de/so-funktionierts/" className="hero-cta-secondary">So funktioniert's</a>
          </div>
        </div>
      </section>

      {/* ===== PRESS MARQUEE ===== */}
      <div className="press-bar" role="region" aria-label="Bekannt aus">
        <div className="press-bar-header">
          <span className="press-bar-label">Bekannt aus</span>
        </div>
        <div className="press-marquee-wrap">
          <div className="press-track-outer">
            <div className="press-track">
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width={200} height={50} loading="eager" /></div>
            </div>
            <div className="press-track" aria-hidden="true">
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width={200} height={50} loading="eager" /></div>
              <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width={200} height={50} loading="eager" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROPERTIES CAROUSEL (placed immediately after hero so
           visitors see inventory first — biggest bounce-rate lever) ===== */}
      <section className="properties-section" id="properties">
        <h2 className="section-heading">Ferienimmobilien im Miteigentum kaufen</h2>
        <p className="section-subtitle">Villen, Apartments und Ferienhäuser im Anteilskauf auf Mallorca, Ibiza, an der Costa del Sol, am Gardasee, in der Toskana, in Tirol und mehr — mit Preisen ab einem Bruchteil des Vollkaufpreises.</p>

        <PropCarousel items={featuredProps} propertyCount={propertyCount} />

        <div className="pc-browse-all">
          <a href="/de/immobilien/" className="pc-browse-btn">Alle {propertyCount} Immobilien ansehen &rarr;</a>
        </div>
      </section>

      {/* ===== INTRODUCTION SECTION ===== */}
      <section className="intro-section">
        <p className="intro-text">
          Entdecken Sie die Welt des luxuriösen Miteigentums. Von sonnenverwöhnten Mediterran-Villen über charmante Stadtwohnungen bis zu Weingütern und alpinen Refugien — jede Immobilie fühlt sich mühelos wie Ihre eigene an.
        </p>
        <p className="intro-subtext">
          Jede Immobilie ist sorgfältig ausgewählt, geschmackvoll gestaltet und professionell verwaltet. Mehr als nur eine Immobilie — sie ist Ihr Tor zu einzigartigen Landschaften, kulturellen Schätzen und unvergesslichen Familienmomenten.
        </p>
      </section>

      {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
      <section className="explainer-section">
        <div className="explainer-intro">
          <h2>Was ist Miteigentum an einer Ferienimmobilie?</h2>
          <p><strong>Miteigentum</strong> — auch als <strong>Co-Ownership</strong> oder <strong>Anteilskauf</strong> bekannt — ermöglicht es Ihnen, einen rechtlich verbrieften Anteil an einer hochwertigen Ferienimmobilie zu erwerben und diese vollumfänglich zu nutzen, als wäre sie ganz Ihre. Sie haben den Lebensstil und die Immobilieninvestition, teilen sich aber Kosten und laufende Ausgaben mit anderen Miteigentümern.</p>
        </div>
        <div className="explainer-grid">
          <div className="explainer-item">
            <div className="explainer-num">01</div>
            <div className="explainer-divider"></div>
            <h3>Sie erwerben einen rechtlich verbrieften Anteil</h3>
            <p>Sie kaufen <strong>1/8 der Immobilie</strong>. Es handelt sich um <strong>echtes Eigentum, im Grundbuch auf Ihren Namen eingetragen</strong>, mit vollem rechtlichem Schutz. Unsere Immobilien sind so konzipiert, dass sie <strong>im Wert steigen</strong> — Sie profitieren von einer echten Immobilieninvestition. Sie haben volle Flexibilität, <strong>Ihren Anteil jederzeit zu verkaufen</strong> — Sie bestimmen den Preis, wir helfen beim Käufer-Matching.</p>
            <p className="explainer-stat">Anteile werden im Schnitt in unter einem Monat verkauft.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">02</div>
            <div className="explainer-divider"></div>
            <h3>Garantierte Nutzungszeit</h3>
            <p><strong>Ihre Wochen gehören Ihnen.</strong> Ein faires, strukturiertes Buchungssystem stellt sicher, dass jeder Miteigentümer seine Wunschtermine ohne Konkurrenz nutzen kann — <strong>auch in der Hochsaison.</strong> Kein Timesharing, keine Punkte, keine Bindungen. Sie kommen an und <strong>Ihre Sachen sind da, alles ist vorbereitet, die Immobilie vollständig verwaltet</strong> — Sie müssen nur noch genießen.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">03</div>
            <div className="explainer-divider"></div>
            <h3>Geteilte Betriebskosten</h3>
            <p>Wartung, Verwaltungsgebühren und laufende Kosten werden <strong>fair zwischen allen Miteigentümern aufgeteilt.</strong> Bei vielen Immobilien können Sie ungenutzte Wochen <strong>vermieten — und so Einnahmen erzielen</strong>, die Ihre Kosten weiter ausgleichen. <strong>Wir kümmern uns um alles.</strong></p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">04</div>
            <div className="explainer-divider"></div>
            <h3>Zusätzliche Vorteile</h3>
            <p>Co-Ownership bietet weitere Vorteile — von <strong>steuerlich günstigen Strukturen</strong> über <strong>vereinfachte Nachfolgeplanung</strong> bis zur Flexibilität, <strong>Wochen mit anderen Miteigentümern</strong> aus unserem internationalen Portfolio zu tauschen.</p>
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta-band">
        <p className="cta-band-eyebrow">Co-Ownership Property</p>
        <h2 className="cta-band-heading">Erwerben Sie einen Anteil an etwas <em>Außergewöhnlichem</em></h2>
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">Von einer Villa an der Côte d'Azur bis zu einem Chalet in Aspen — Co-Ownership gibt Ihnen einen echten Anteil an den exklusivsten Ferienimmobilien der Welt, zu einem Bruchteil des Preises.</p>
        <div className="cta-band-buttons">
          <a href="#speak-to-expert" className="cta-band-primary">Mit einem Experten sprechen</a>
          <a href="#newsletter" className="cta-band-secondary">Newsletter abonnieren</a>
        </div>
      </section>

      {/* ===== DESTINATIONS SECTION ===== */}
      <section className="destinations-section" id="destinations">
        <h2 className="section-heading">Unsere Destinationen</h2>

        <div className="dest-tabs" ref={destTabsRef}>
          {[["spain","Spanien"],["france","Frankreich"],["usa","USA"],["italy","Italien"],["portugal","Portugal"],["austria","Österreich"],["england","England"],["sweden","Schweden"],["germany","Deutschland"],["croatia","Kroatien"],["mexico","Mexiko"]].map(([key, label]) => (
            <button
              key={key}
              className={`dest-tab-btn${activeDest === key ? " active" : ""}`}
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
            >{label}</button>
          ))}
        </div>

        <div className="dest-panels">

          <div className={`dest-panel${activeDest === "spain" ? " active" : ""}`} id="dest-spain">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/spain-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-spain.webp" alt="Spanien" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Spanien</div>
              <p className="dest-info-desc">Spanien verbindet Weltklasse-Strände, lebendige Kultur und Sonne das ganze Jahr über auf Mallorca, Ibiza, an der Costa del Sol und vielem mehr — alles zu einem außergewöhnlichen Wert für anspruchsvolle Miteigentümer.</p>
              <a href="/de/destinationen/spain-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "france" ? " active" : ""}`} id="dest-france">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/france-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-france.webp" alt="Frankreich" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Frankreich</div>
              <p className="dest-info-desc">Von den sonnigen Küsten der Côte d'Azur über die Pisten der französischen Alpen bis zur zeitlosen Eleganz von Paris — Frankreich ist Europas begehrteste Adresse für Co-Ownership.</p>
              <a href="/de/destinationen/france-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "italy" ? " active" : ""}`} id="dest-italy">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/italy-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-italy-v2.webp" alt="Italien" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Italien</div>
              <p className="dest-info-desc">Italiens außergewöhnliche Landschaften — vom kristallklaren Wasser des Comer Sees über die alten Dörfer Liguriens bis zu den toskanischen Hügeln — machen es zum ewigen Favoriten für anspruchsvolle Miteigentümer.</p>
              <a href="/de/destinationen/italy-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "portugal" ? " active" : ""}`} id="dest-portugal">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/portugal-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-portugal.webp" alt="Portugal" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Portugal</div>
              <p className="dest-info-desc">Von der goldenen Küste der Algarve über die eleganten Boulevards von Lissabon bis zur unberührten Schönheit der Silberküste — Portugal ist eine der spannendsten Destinationen Europas für luxuriöses Co-Ownership.</p>
              <a href="/de/destinationen/portugal-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "austria" ? " active" : ""}`} id="dest-austria">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/austria-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-austria.webp" alt="Österreich" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Österreich</div>
              <p className="dest-info-desc">Österreichs alpiner Glanz — von den Weltklasse-Skiresorts in Tirol bis zum imperialen Charme Wiens — macht es zu einer der lohnendsten Destinationen Europas für luxuriöses Co-Ownership.</p>
              <a href="/de/destinationen/austria-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "england" ? " active" : ""}`} id="dest-england">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/england-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-england.webp" alt="England" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">England</div>
              <p className="dest-info-desc">London bleibt eine der großen Weltstädte für Luxusimmobilien — von den Stadthäusern in Mayfair bis zu den Apartments am Themseufer — während die englische Landschaft idyllische Refugien für anspruchsvolle Miteigentümer bietet.</p>
              <a href="/de/destinationen/england-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "sweden" ? " active" : ""}`} id="dest-sweden">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/sweden-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-sweden.webp" alt="Schweden" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Schweden</div>
              <p className="dest-info-desc">Schwedens spektakuläre Landschaften — vom Stockholmer Schärengarten bis zu den Seenregionen im Norden — bieten ein außergewöhnlich ruhiges Umfeld für luxuriöses Co-Ownership, fernab der Massen.</p>
              <a href="/de/destinationen/sweden-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "germany" ? " active" : ""}`} id="dest-germany">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/germany-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-germany.webp" alt="Deutschland" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Deutschland</div>
              <p className="dest-info-desc">Von den bayerischen Alpen und den Ufern des Bodensees über Sylt und die Ostsee bis zu den Kulturhauptstädten Berlin und München — Deutschland bietet eine attraktive Vielfalt an Luxus-Immobilien für Miteigentümer.</p>
              <a href="/de/destinationen/germany-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "croatia" ? " active" : ""}`} id="dest-croatia">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/croatia-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-croatia.webp" alt="Kroatien" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Kroatien</div>
              <p className="dest-info-desc">Die beeindruckende Adriaküste Kroatiens, das kristallklare Wasser und historische Festungsstädte wie Dubrovnik machen es zu einer der begehrtesten Mittelmeer-Destinationen für luxuriöses Co-Ownership.</p>
              <a href="/de/destinationen/croatia-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "usa" ? " active" : ""}`} id="dest-usa">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/usa-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-usa-v2.webp" alt="USA" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">USA</div>
              <p className="dest-info-desc">Von der kalifornischen Surfkultur über die Skipisten Colorados bis zum Glamour der Küste Floridas — der US-Luxusimmobilienmarkt bietet außergewöhnliche Möglichkeiten für internationale Miteigentümer.</p>
              <a href="/de/destinationen/usa-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "mexico" ? " active" : ""}`} id="dest-mexico">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/mexico-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-mexico-v2.webp" alt="Mexiko" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Mexiko</div>
              <p className="dest-info-desc">Von den türkisfarbenen Küsten der Riviera Maya bis zum Pazifik-Glamour von Los Cabos — Mexiko bietet außergewöhnlichen Luxus zu außergewöhnlichem Wert und entwickelt sich zu einem der spannendsten Co-Ownership-Märkte der Welt.</p>
              <a href="/de/destinationen/mexico-fractional-ownership-properties/" className="dest-explore-btn">Immobilien ansehen</a>
            </div>
          </div>

        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="testimonials-section" id="testimonials">
        <h2 className="section-heading">Eigentümer-Geschichten</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">„Vom ersten Aufenthalt an war alles ganz einfach — als käme man im eigenen Zuhause an, mit dem Komfort eines Hotels. Die Provence ist Teil unseres Rhythmus geworden. Ich muss mir um nichts Sorgen machen."</p>
            <div className="testimonial-author">Astrid</div>
            <div className="testimonial-location">Mougins, Südfrankreich</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry und Nicole" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">„Co-Ownership hat uns den Alpen-Traum erfüllt, von dem wir dachten, er sei unerreichbar. Der Prozess war makellos, und unser Sohn bringt jetzt seine Schulfreunde zum Skifahren mit. Es ist zu einem echten Familienzuhause geworden."</p>
            <div className="testimonial-author">Harry und Nicole</div>
            <div className="testimonial-location">La Plagne, Französische Alpen</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo und Anne" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">„Endlich besitzen wir einen Anteil an einer Immobilie, ohne das schlechte Gewissen einer untergenutzten Hypothek. Vom ersten Tag an transparent — wir könnten nicht glücklicher sein. Wir planen schon unseren nächsten Anteil in Europa."</p>
            <div className="testimonial-author">Mateo und Anne</div>
            <div className="testimonial-location">Los Angeles, Kalifornien</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca.jpg" alt="Jan und Familie" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">„Ich habe meine Ferienimmobilie in Frankreich verkauft und für ein Viertel des Preises eine viel schönere Villa auf Mallorca gekauft. Das Team hat alles perfekt organisiert — sie fühlt sich von dem Moment an unsere an, in dem wir die Tür öffnen."</p>
            <div className="testimonial-author">Jan und Familie</div>
            <div className="testimonial-location">Mallorca, Spanien</div>
          </div>
        </div>
      </section>

      {/* ===== LATEST POSTS SECTION ===== */}
      <section className="latest-posts-section">
        <span className="lp-eyebrow">Aus dem Blog</span>
        <h2 className="section-heading">Neueste Beiträge</h2>
        <p className="lp-subtitle">Destinationsführer, Marktanalysen und Eigentümer-Geschichten — regelmäßig veröffentlicht für den anspruchsvollen Käufer.</p>

        <div className="latest-posts-grid">
          {latestPosts.map(post => (
            <article key={post.slug} className="lp-card" onClick={() => { window.location=`/de/blog/${post.slug}/`; }}>
              <div className="lp-image-wrap">
                {post.heroImage && (
                  <Image src={post.heroImage} alt={post.title} fill className="lp-image" style={{objectFit:'cover'}} loading="lazy" sizes="(max-width: 768px) 100vw, 400px" />
                )}
              </div>
              <div className="lp-content">
                <span className="lp-date">{post.dateFormatted}</span>
                <h3 className="lp-title">{post.title}</h3>
                <a href={`/de/blog/${post.slug}/`} className="lp-read-more" onClick={e => e.stopPropagation()}>Artikel lesen →</a>
              </div>
            </article>
          ))}
        </div>

        <div className="lp-footer">
          <a href="/de/blog/" className="lp-all-btn">Alle Artikel ansehen</a>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section" id="faq">
        <p className="faq-eyebrow">Häufige Fragen</p>
        <h2 className="faq-heading">Häufig gestellte <em>Fragen</em></h2>
        <p className="faq-subheading">Alles, was Sie über luxuriöses Co-Ownership wissen müssen — und warum es die intelligenteste Art ist, eine Ferienimmobilie zu besitzen.</p>
        <div className="faq-list">

          <details className="faq-item">
            <summary className="faq-q"><span>Was ist Co-Ownership oder Miteigentum an einer Ferienimmobilie?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Beim Co-Ownership erwerben Sie zusammen mit einer kleinen Anzahl weiterer Miteigentümer einen im Grundbuch eingetragenen Anteil an einer professionell verwalteten Luxus-Ferienimmobilie. Sie besitzen einen echten Bruchteil der Immobilie — typischerweise 1/8 — und im Gegensatz zum Timesharing haben Sie ein rechtlich verbrieftes Eigentum an der Immobilie. Es kombiniert den Stolz und die finanziellen Vorteile echten Immobilieneigentums mit dem Komfort eines Fünf-Sterne-Hotels — zu einem Bruchteil des Vollkaufpreises.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie unterscheidet sich Co-Ownership von Timesharing?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Im Gegensatz zum Timesharing erhalten Sie beim Co-Ownership einen echten, im Grundbuch eingetragenen Anteil an der Immobilie. Das bedeutet, Sie profitieren von jeglicher Wertsteigerung und können Ihren Anteil jederzeit auf dem freien Markt verkaufen. Da es sich um Luxusimmobilien in stark nachgefragten Lagen handelt, steigen die Preise typischerweise mit der Zeit. Es gibt kein Mitgliedschaftsmodell, kein Punktesystem und keine langfristige vertragliche Bindung. Sie sind ein echter Immobilieneigentümer mit allen rechtlichen Befugnissen über Ihren Anteil.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Was ist im Kaufpreis enthalten?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Ihr Kaufpreis umfasst Ihren im Grundbuch eingetragenen Anteil an der Immobilie sowie das gesamte Mobiliar, die Innenausstattung und die Geräte. Viele unserer Immobilien sind professionell eingerichtet — vom ersten Tag an bezugsfertig. Die laufenden Kosten — Wartung, Versicherungen, Verwaltung und kommunale Steuern — werden anteilig auf alle Miteigentümer verteilt, sodass Ihre individuellen Ausgaben sehr gering bleiben.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie wird die Nutzungszeit zwischen den Miteigentümern aufgeteilt?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Jeder 1/8-Anteil gibt Ihnen 45 Tage — etwa sechs Wochen — pro Jahr, also genau 1/8 des Kalenders. Jede Immobilie hat einen klaren Nutzungskalender, der fair rotiert, sodass alle Miteigentümer im Zeitverlauf Zugang zur Hochsaison erhalten. Die meisten Anbieter stellen zudem eine digitale Buchungsplattform zur Verfügung, mit der Sie Wochen flexibel tauschen, erweitern oder mit anderen Miteigentümern abstimmen können.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Kann ich meine Wochen vermieten, wenn ich sie nicht selbst nutze?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>In vielen Fällen ja. Viele unserer Immobilien erlauben es Eigentümern, ungenutzte Wochen in ein verwaltetes Vermietungsprogramm einzubringen. Die Verwaltung kümmert sich um Gästescreening, Anreise, Reinigung und Wartung — die Mieteinnahmen fließen anteilig an Sie zurück. Das kann Ihre jährlichen Betriebskosten deutlich reduzieren und in beliebten Destinationen sogar einen Nettoertrag erzeugen. Hinweis: Ab 20. Mai 2026 gilt das deutsche Kurzzeitvermietungs-Daten-Gesetz (KVDG), das eine Registrierungsnummer für Plattform-Buchungen verlangt — wir unterstützen Sie dabei.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wer übernimmt die laufende Verwaltung der Immobilie?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Jede Immobilie auf unserer Plattform wird von einer professionellen Hausverwaltung betreut. Sie kümmert sich um alles: von routinemäßiger Wartung und Reinigung bis hin zu Gartenpflege, Poolservice und dringenden Reparaturen. Bei jeder Anreise erwartet Sie ein makelloses Zuhause auf Hotelniveau — ohne dass Sie einen Finger rühren müssen.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Kann ich meinen Anteil später verkaufen?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Selbstverständlich. Da Sie einen im Grundbuch eingetragenen Anteil halten, können Sie diesen jederzeit auf dem freien Markt verkaufen — wie jede andere Immobilie auch. Ist die Immobilie im Wert gestiegen, profitieren Sie anteilig von der Wertsteigerung. Unser Team unterstützt Sie auch beim Wiederverkauf über unser Netzwerk qualifizierter Käufer.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Welche Destinationen und Immobilientypen bieten Sie an?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Wir kuratieren Co-Ownership-Ferienimmobilien in ganz Europa und den USA — darunter Spanien, Frankreich, Italien, Portugal, Österreich, England und mehrere US-Destinationen. Die Immobilien reichen von Küstenvillen und Pariser Apartments bis zu alpinen Chalets und toskanischen Landhäusern. Jede Immobilie wird sorgfältig nach Lage, Bauqualität und Lebensstil-Attraktivität ausgewählt.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Ist Co-Ownership eine gute Investition?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Co-Ownership ermöglicht Ihnen den Zugang zu hochwertigen Immobilien zu einem Bruchteil der Vollkaufkosten und setzt Kapital für andere Investments frei. Sie profitieren von potenzieller Wertsteigerung, möglichen Mieteinnahmen und dem persönlichen Wert einer Luxus-Ferienimmobilie — und teilen gleichzeitig die Kosten mit anderen Miteigentümern. Es wird zunehmend als eine der finanziell sinnvollsten Wege anerkannt, eine Ferienimmobilie zu besitzen.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie fange ich an?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Stöbern Sie einfach in unserer Auswahl oder sprechen Sie mit einem unserer Spezialisten über das Kontaktformular. Wir zeigen Ihnen die verfügbaren Immobilien, beantworten Ihre Fragen und begleiten Sie durch den gesamten Kaufprozess — mit voller rechtlicher und finanzieller Transparenz in jedem Schritt.</p></div>
          </details>

        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/index.js" strategy="afterInteractive" />
    </>
  );
}
