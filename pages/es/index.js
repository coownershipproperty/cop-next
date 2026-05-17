import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import { FEATURED_PROPERTY_SLUGS } from '@/lib/featured-properties';

import { useState, useRef, useEffect } from 'react';

// Spanish locale homepage. Structure mirrors pages/index.js (English) exactly
// — same sections, same CSS classes, same images. Only the visible text and
// the CTA links are translated. PropCarousel is inlined here rather than
// imported so this page is self-contained while we validate the locale launch.
//
// Strategic notes from the keyword research baked in:
//  - Title tag uses `propiedad fraccionada` (highest-volume search term).
//  - Body copy uses `copropiedad` as the primary product term (Vivla benchmark).
//  - CTAs route to /es/ slugs where they exist; fall back to English for pages
//    we haven't localised yet (e.g. /our-homes/).

const SYM = { EUR: '€', USD: '$', GBP: '£' };

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: rows } = await supabase
    .from('properties')
    .select('slug, title, title_es, img, region, country, price, currency, beds, size')
    .in('slug', FEATURED_PROPERTY_SLUGS);

  const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
  const featuredProps = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(Boolean)
    .map(p => ({
      slug: p.slug,
      // Use Spanish title where the translation column has been populated;
      // fall back to English so pages render before translations are backfilled.
      title: p.title_es || p.title,
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
    .select('*', { count: 'exact', head: true });

  const { data: postRows } = await supabase
    .from('posts')
    .select('slug, slug_es, title, title_es, excerpt, excerpt_es, date, hero_image, category, published_es')
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(3);

  // For latest-posts on /es/ we surface English posts when no Spanish version
  // exists yet. Once published_es=true posts exist they take priority.
  const latestPosts = (postRows || []).map(p => ({
    slug: p.slug_es || p.slug,
    title: p.title_es || p.title,
    excerpt: p.excerpt_es || p.excerpt || '',
    dateFormatted: p.date ? new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '',
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
                      <span className="pc-viewall-label">Propiedades</span>
                      <a href="/our-homes/" className="pc-viewall-btn" onClick={e => e.stopPropagation()}>Ver todas →</a>
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
                    window.location.href = `/property/${p.slug}`;
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
                      {p.size && <span>{p.size.toLocaleString('es-ES')} m²</span>}
                    </div>
                    {p.price && (
                      <span className="pc-panel-price">
                        {sym}{p.price.toLocaleString('es-ES')}
                      </span>
                    )}
                    <a href={`/property/${p.slug}`} className="pc-panel-btn" onClick={e => e.stopPropagation()}>Ver propiedad →</a>
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
        <button className="pc-btn" onClick={() => move(-1)} aria-label="Anterior">&#8592;</button>
        <span className="pc-counter">{displayNum} / {propertyCount}</span>
        <button className="pc-btn" onClick={() => move(1)} aria-label="Siguiente">&#8594;</button>
      </div>
    </div>
  );
}

export default function HomeES({ propertyCount, featuredProps, latestPosts }) {
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
        <title>Copropiedad de lujo en España | Propiedad fraccionada — COP</title>
        <meta name="description" content="Descubre propiedades en copropiedad y propiedad fraccionada en Mallorca, Ibiza, Costa del Sol y otros destinos europeos. Propiedad real con escritura ante notario." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/es/" />
        <HreflangLinks englishPath="/" />
        <meta property="og:title" content="Copropiedad de lujo en España | Propiedad fraccionada — COP" />
        <meta property="og:description" content="Descubre propiedades en copropiedad y propiedad fraccionada por toda Europa. Propiedad real, no multipropiedad." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/es/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
{/* cache-bust: lang-switcher flags v2 — 2026-05-15 */}
      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <video ref={videoRef} className="hero-video" autoPlay muted loop playsInline preload="auto" fetchPriority="high">
          <source src="/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-heading">
            <span className="hero-pre">Tu ventana a las</span>
            <em>mejores segundas residencias</em>
            <span className="hero-rule"></span>
            <span className="hero-post">en copropiedad</span>
          </h1>
        </div>

        <div className="hero-bottom">
          <div className="hero-ctas">
            <a href="/our-homes" className="hero-cta-primary">Ver propiedades &rarr;</a>
            <a href="/es/copropiedad/" className="hero-cta-secondary">Cómo funciona</a>
          </div>
        </div>
      </section>

      {/* ===== PRESS MARQUEE ===== */}
      <div className="press-bar" role="region" aria-label="Aparecemos en">
        <div className="press-bar-header">
          <span className="press-bar-label">Aparecemos en</span>
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
        <h2 className="section-heading">Comprar una segunda residencia en copropiedad</h2>
        <p className="section-subtitle">Villas, apartamentos y casas de vacaciones en propiedad fraccionada por Mallorca, Ibiza, Costa del Sol y otros destinos europeos — con precios desde una fracción de la compra íntegra.</p>

        <PropCarousel items={featuredProps} propertyCount={propertyCount} />

        <div className="pc-browse-all">
          <a href="/our-homes/" className="pc-browse-btn">Ver las {propertyCount} propiedades &rarr;</a>
        </div>
      </section>

      {/* ===== INTRODUCTION SECTION ===== */}
      <section className="intro-section">
        <p className="intro-text">
          Descubre el mundo de la copropiedad de lujo. Desde villas mediterráneas bañadas por el sol hasta apartamentos urbanos con encanto, pasando por fincas vinícolas y refugios alpinos: cada propiedad se siente sin esfuerzo como tuya.
        </p>
        <p className="intro-subtext">
          Cada propiedad está cuidadosamente seleccionada, bellamente diseñada y profesionalmente gestionada. Más que una propiedad, es la puerta a paisajes únicos, tesoros culturales e inolvidables momentos en familia.
        </p>
      </section>

      {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
      <section className="explainer-section">
        <div className="explainer-intro">
          <h2>¿Qué es la copropiedad de una segunda residencia?</h2>
          <p>La <strong>copropiedad</strong> —también conocida como <strong>propiedad fraccionada</strong>— te permite comprar una participación legal de una vivienda vacacional de gama alta y disfrutarla plenamente, igual que si fuera totalmente tuya. Tienes el estilo de vida y la inversión inmobiliaria, pero compartes el coste y los gastos con otros copropietarios.</p>
        </div>
        <div className="explainer-grid">
          <div className="explainer-item">
            <div className="explainer-num">01</div>
            <div className="explainer-divider"></div>
            <h3>Eres dueño de una participación legal</h3>
            <p>Compras <strong>1/8 de la propiedad</strong>. Es <strong>propiedad real, registrada a tu nombre</strong>, con plenas garantías legales. Nuestras propiedades están diseñadas para <strong>revalorizarse</strong>, dándote los beneficios de la inversión inmobiliaria. Tienes total flexibilidad para <strong>vender tu fracción cuando quieras</strong> — tú pones el precio y nosotros te ayudamos a encontrar comprador.</p>
            <p className="explainer-stat">Las fracciones se venden en menos de un mes de media.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">02</div>
            <div className="explainer-divider"></div>
            <h3>Uso garantizado</h3>
            <p><strong>Tus semanas son tuyas.</strong> Un calendario justo y estructurado garantiza que cada copropietario disfrute de sus fechas sin competir — <strong>incluida la temporada alta.</strong> Sin multipropiedad, sin puntos, sin compromisos. Te sentirás como en casa: llegas y <strong>tus cosas están allí, todo está preparado y la propiedad totalmente gestionada</strong> para que solo tengas que disfrutar.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">03</div>
            <div className="explainer-divider"></div>
            <h3>Gastos compartidos</h3>
            <p>El mantenimiento, las cuotas de gestión y los gastos corrientes se <strong>reparten equitativamente entre los copropietarios.</strong> En muchas propiedades, cuando no la usas, se puede <strong>alquilar — generando ingresos</strong> que compensan aún más tus costes. <strong>Nosotros nos encargamos de todo.</strong></p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">04</div>
            <div className="explainer-divider"></div>
            <h3>Beneficios añadidos</h3>
            <p>La copropiedad ofrece ventajas adicionales — desde un <strong>tratamiento fiscal favorable</strong> y una <strong>planificación sucesoria simplificada</strong>, hasta la flexibilidad de <strong>intercambios</strong> con otros copropietarios de nuestro porfolio internacional.</p>
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta-band">
        <p className="cta-band-eyebrow">Co-Ownership Property</p>
        <h2 className="cta-band-heading">Posee una fracción de algo <em>extraordinario</em></h2>
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">Desde una villa en la Costa Azul hasta un chalet en Aspen — la copropiedad te da una participación real en las viviendas más exclusivas del mundo, por una fracción del precio.</p>
        <div className="cta-band-buttons">
          <a href="#speak-to-expert" className="cta-band-primary">Habla con un experto</a>
          <a href="#newsletter" className="cta-band-secondary">Suscribirme a la newsletter</a>
        </div>
      </section>

      {/* ===== DESTINATIONS SECTION ===== */}
      <section className="destinations-section" id="destinations">
        <h2 className="section-heading">Nuestros destinos</h2>

        <div className="dest-tabs" ref={destTabsRef}>
          {[["spain","España"],["france","Francia"],["usa","EE. UU."],["italy","Italia"],["portugal","Portugal"],["austria","Austria"],["england","Inglaterra"],["sweden","Suecia"],["germany","Alemania"],["croatia","Croacia"],["mexico","México"]].map(([key, label]) => (
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
              <Image src="/wp-content/uploads/dest-spain.webp" alt="España" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">España</div>
              <p className="dest-info-desc">España combina playas de primer nivel mundial, cultura vibrante y sol durante todo el año en Mallorca, Ibiza, la Costa del Sol y mucho más — todo a un valor extraordinario para los copropietarios más exigentes.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "france" ? " active" : ""}`} id="dest-france">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/france-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-france.webp" alt="Francia" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Francia</div>
              <p className="dest-info-desc">Desde las soleadas costas de la Costa Azul hasta las pistas de los Alpes franceses y la elegancia atemporal de París, Francia es la dirección más codiciada de Europa para la copropiedad.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "italy" ? " active" : ""}`} id="dest-italy">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/italy-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-italy-v2.webp" alt="Italia" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Italia</div>
              <p className="dest-info-desc">Los paisajes excepcionales de Italia — desde las aguas cristalinas del Lago de Como hasta los pueblos antiguos de Liguria y las colinas toscanas — la convierten en una favorita perenne para los copropietarios más exigentes.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "portugal" ? " active" : ""}`} id="dest-portugal">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/portugal-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-portugal.webp" alt="Portugal" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Portugal</div>
              <p className="dest-info-desc">Desde la dorada costa del Algarve hasta los elegantes bulevares de Lisboa y la belleza virgen de la Costa de Plata, Portugal es uno de los destinos más emocionantes de Europa para la copropiedad de lujo.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "austria" ? " active" : ""}`} id="dest-austria">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/austria-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-austria.webp" alt="Austria" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Austria</div>
              <p className="dest-info-desc">El esplendor alpino de Austria — desde las estaciones de esquí de primer nivel del Tirol hasta el encanto imperial de Viena — la convierte en uno de los destinos más gratificantes de Europa para la copropiedad de lujo.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "england" ? " active" : ""}`} id="dest-england">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/england-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-england.webp" alt="Inglaterra" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Inglaterra</div>
              <p className="dest-info-desc">Londres sigue siendo una de las grandes ciudades del mundo para la propiedad de lujo — desde las casas adosadas de Mayfair hasta los apartamentos junto al río — mientras que el campo inglés ofrece refugios idílicos para los copropietarios más exigentes.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "sweden" ? " active" : ""}`} id="dest-sweden">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/sweden-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-sweden.webp" alt="Suecia" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Suecia</div>
              <p className="dest-info-desc">Los paisajes espectaculares de Suecia — desde el archipiélago de Estocolmo hasta las regiones lacustres del norte — ofrecen un entorno extraordinariamente tranquilo para la copropiedad de lujo, lejos de las multitudes.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "germany" ? " active" : ""}`} id="dest-germany">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/germany-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-germany.webp" alt="Alemania" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Alemania</div>
              <p className="dest-info-desc">Desde los Alpes bávaros y las orillas del Lago Constanza hasta las capitales culturales de Berlín y Múnich, Alemania ofrece una variedad atractiva de oportunidades de propiedad de lujo para los copropietarios.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "croatia" ? " active" : ""}`} id="dest-croatia">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/croatia-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-croatia.webp" alt="Croacia" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Croacia</div>
              <p className="dest-info-desc">La impresionante costa adriática de Croacia, las aguas cristalinas y las históricas ciudades amuralladas como Dubrovnik la convierten en uno de los destinos mediterráneos más codiciados para la copropiedad de lujo.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "usa" ? " active" : ""}`} id="dest-usa">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/usa-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-usa-v2.webp" alt="EE. UU." fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">EE. UU.</div>
              <p className="dest-info-desc">Desde la cultura del surf de California hasta las pistas de esquí de Colorado y el glamour de la costa de Florida, el mercado inmobiliario de lujo de Estados Unidos ofrece oportunidades extraordinarias para copropietarios internacionales.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "mexico" ? " active" : ""}`} id="dest-mexico">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/mexico-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-mexico-v2.webp" alt="México" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">México</div>
              <p className="dest-info-desc">Desde las costas turquesas de la Riviera Maya hasta el glamour del Pacífico de Los Cabos, México ofrece un lujo extraordinario a un valor excepcional — convirtiéndose en uno de los mercados de copropiedad más emocionantes del mundo.</p>
              <a href="/our-homes/" className="dest-explore-btn">Ver propiedades</a>
            </div>
          </div>

        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="testimonials-section" id="testimonials">
        <h2 className="section-heading">Historias de propietarios</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">"Desde la primera estancia, todo fue muy sencillo — como llegar a tu propia casa con la comodidad de un hotel. La Provenza ya forma parte de nuestro ritmo. No tengo que preocuparme por nada."</p>
            <div className="testimonial-author">Astrid</div>
            <div className="testimonial-location">Mougins, sur de Francia</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry y Nicole" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">"La copropiedad nos dio el sueño alpino que pensábamos fuera de nuestro alcance. El proceso fue impecable, y nuestro hijo ahora trae a sus amigos del colegio a esquiar. Se ha convertido en una verdadera casa familiar."</p>
            <div className="testimonial-author">Harry y Nicole</div>
            <div className="testimonial-location">La Plagne, Alpes franceses</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo y Anne" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">"Por fin tenemos una participación de la propiedad sin la culpa de una hipoteca infrautilizada. Todo transparente desde el primer día — no podríamos estar más contentos. Ya estamos planeando nuestra próxima fracción en Europa."</p>
            <div className="testimonial-author">Mateo y Anne</div>
            <div className="testimonial-location">Los Ángeles, California</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca.jpg" alt="Jan y la familia" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">"Vendí mi casa de vacaciones en Francia y compré una villa mucho mejor en Mallorca por una cuarta parte del precio. El equipo se encargó de todo a la perfección — se siente nuestra desde el momento en que cruzamos la puerta."</p>
            <div className="testimonial-author">Jan y la familia</div>
            <div className="testimonial-location">Mallorca, España</div>
          </div>
        </div>
      </section>

      {/* ===== LATEST POSTS SECTION ===== */}
      <section className="latest-posts-section">
        <span className="lp-eyebrow">Del blog</span>
        <h2 className="section-heading">Últimas publicaciones</h2>
        <p className="lp-subtitle">Guías de destino, análisis de mercado e historias de propietarios — publicado regularmente para el comprador exigente.</p>

        <div className="latest-posts-grid">
          {latestPosts.map(post => (
            <article key={post.slug} className="lp-card" onClick={() => { window.location=`/blog/${post.slug}/`; }}>
              <div className="lp-image-wrap">
                {post.heroImage && (
                  <Image src={post.heroImage} alt={post.title} fill className="lp-image" style={{objectFit:'cover'}} loading="lazy" sizes="(max-width: 768px) 100vw, 400px" />
                )}
              </div>
              <div className="lp-content">
                <span className="lp-date">{post.dateFormatted}</span>
                <h3 className="lp-title">{post.title}</h3>
                <a href={`/blog/${post.slug}/`} className="lp-read-more" onClick={e => e.stopPropagation()}>Leer artículo →</a>
              </div>
            </article>
          ))}
        </div>

        <div className="lp-footer">
          <a href="/all-our-blog/" className="lp-all-btn">Ver todos los artículos</a>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section" id="faq">
        <p className="faq-eyebrow">Preguntas habituales</p>
        <h2 className="faq-heading">Preguntas <em>frecuentes</em></h2>
        <p className="faq-subheading">Todo lo que necesitas saber sobre la copropiedad de lujo — y por qué es la forma más inteligente de tener una casa de vacaciones.</p>
        <div className="faq-list">

          <details className="faq-item">
            <summary className="faq-q"><span>¿Qué es la copropiedad o propiedad fraccionada de una vivienda vacacional?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>La copropiedad significa que tú y un pequeño número de otros propietarios compráis una participación registrada de una propiedad de lujo totalmente gestionada. Posees una fracción real de la vivienda — típicamente 1/8 — y, a diferencia de la multipropiedad, tienes una titularidad legal genuina de la propiedad. Combina el orgullo y los beneficios financieros de la propiedad inmobiliaria real con la comodidad de un hotel de cinco estrellas, por una fracción del precio de la compra íntegra.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿En qué se diferencia la copropiedad de la multipropiedad?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>A diferencia de la multipropiedad, la copropiedad te da una participación real de la escritura de la propiedad, lo que significa que te beneficias de cualquier revalorización y puedes vender tu fracción en el mercado libre cuando quieras. Como son propiedades de lujo en ubicaciones muy demandadas, los precios típicamente suben con el tiempo. No hay club de membresía, no hay sistema de puntos, ni vinculación contractual a largo plazo. Eres un propietario inmobiliario auténtico con plenos derechos legales sobre tu fracción.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Qué incluye el precio de compra?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Tu precio de compra cubre tu fracción registrada de la propiedad junto con todo el mobiliario, el diseño de interiores y el equipamiento. Muchas de nuestras propiedades están profesionalmente decoradas con un estándar listo para entrar a vivir desde el primer día. Los costes recurrentes — mantenimiento, seguros, gestión y impuestos locales — se reparten proporcionalmente entre todos los copropietarios, manteniendo los gastos individuales muy bajos.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Cómo se reparte el tiempo de uso entre propietarios?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Cada fracción de 1/8 te da 45 días — aproximadamente seis semanas — que es 1/8 del año. Cada propiedad tiene un calendario de uso claro que rota equitativamente para que todos los copropietarios disfruten del acceso a la temporada alta a lo largo del tiempo. Muchos operadores ofrecen también una plataforma de reservas digital para intercambiar, ampliar o canjear semanas con otros copropietarios con flexibilidad.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Puedo alquilar mis semanas cuando no las uso?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>En muchos casos, sí. Muchas de nuestras propiedades permiten que los propietarios cedan sus semanas no utilizadas a un programa de alquiler gestionado. La gestora se encarga del filtrado de huéspedes, la entrada, la limpieza y el mantenimiento, mientras los ingresos del alquiler se devuelven al propietario. Esto puede compensar significativamente tus gastos anuales y, en destinos populares, incluso generar un retorno neto.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Quién gestiona la propiedad en el día a día?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Cada vivienda en nuestra plataforma está cuidada por una gestora profesional. Se encargan de todo: desde el mantenimiento rutinario y la limpieza hasta la jardinería, el cuidado de la piscina y las reparaciones urgentes. Llegas a una casa impecable, con calidad de hotel, en cada visita — sin levantar un dedo.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Puedo vender mi fracción más adelante?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Por supuesto. Como tienes una participación registrada, puedes venderla cuando quieras en el mercado libre — igual que cualquier otra propiedad. Si la vivienda se ha revalorizado, te beneficias de ese crecimiento en proporción a tu participación. Nuestro equipo también puede ayudarte con las reventas a través de nuestra red de compradores cualificados.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Qué destinos y tipos de propiedad ofrecéis?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Curamos propiedades en copropiedad de lujo por toda Europa y EE. UU., incluyendo España, Francia, Italia, Portugal, Austria, Inglaterra y varios destinos estadounidenses. Las propiedades van desde villas costeras y apartamentos parisinos hasta chalets alpinos y casas de campo toscanas. Cada vivienda está seleccionada a mano por su ubicación, calidad de construcción y atractivo de estilo de vida.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Es la copropiedad una buena inversión?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>La copropiedad te permite acceder a una propiedad de alto valor por una fracción del coste de la compra íntegra, liberando capital para otras inversiones. Disfrutas de la potencial revalorización, posibles ingresos por alquiler y el valor personal de una segunda residencia de lujo — todo mientras compartes los gastos con otros copropietarios. Cada vez se reconoce más como una de las formas financieramente más sensatas de tener una segunda vivienda.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>¿Cómo empiezo?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Simplemente explora nuestra colección o habla con uno de nuestros asesores especializados a través del formulario de contacto. Te guiaremos por las propiedades disponibles, responderemos a tus preguntas y te acompañaremos en el proceso de compra de principio a fin — con total transparencia legal y financiera en cada paso.</p></div>
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
