import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import { getFeaturedSlugs } from '@/lib/featured-properties';

import { useState, useRef, useEffect } from 'react';

// French locale homepage. Mirrors pages/index.js (English) section-by-section
// with French translations. Strategic notes baked in from the keyword research:
//  - Title tag uses `copropriété résidence secondaire` (the compound that
//    disambiguates from apartment-building copropriété, our primary FR term).
//  - Body copy uses both `copropriété` and `co-ownership` (English term used
//    in French press) — French buyers search for both.
//  - Post-Prello reassurance is built into the explainer section.

const SYM = { EUR: '€', USD: '$', GBP: '£' };

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const FEATURED_PROPERTY_SLUGS = await getFeaturedSlugs(supabase);

  const { data: rows } = await supabase
    .from('properties')
    .select('slug, title, title_fr, img, region, country, price, currency, beds, size')
    .in('slug', FEATURED_PROPERTY_SLUGS);

  const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
  const featuredProps = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(Boolean)
    .map(p => ({
      slug: p.slug,
      title: p.title_fr || p.title,
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
    .select('slug, slug_fr, title, title_fr, excerpt, excerpt_fr, date, hero_image, category, published_fr')
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(3);

  const latestPosts = (postRows || []).map(p => ({
    slug: p.slug_fr || p.slug,
    title: p.title_fr || p.title,
    excerpt: p.excerpt_fr || p.excerpt || '',
    dateFormatted: p.date ? new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '',
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
                      <span className="pc-viewall-label">Biens</span>
                      <a href="/our-homes/" className="pc-viewall-btn" onClick={e => e.stopPropagation()}>Tout voir →</a>
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
                      {p.size && <span>{p.size.toLocaleString('fr-FR')} m²</span>}
                    </div>
                    {p.price && (
                      <span className="pc-panel-price">
                        {sym}{p.price.toLocaleString('fr-FR')}
                      </span>
                    )}
                    <a href={`/property/${p.slug}`} className="pc-panel-btn" onClick={e => e.stopPropagation()}>Voir le bien →</a>
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
        <button className="pc-btn" onClick={() => move(-1)} aria-label="Précédent">&#8592;</button>
        <span className="pc-counter">{displayNum} / {propertyCount}</span>
        <button className="pc-btn" onClick={() => move(1)} aria-label="Suivant">&#8594;</button>
      </div>
    </div>
  );
}

export default function HomeFR({ propertyCount, featuredProps, latestPosts }) {
  const [activeDest, setActiveDest] = useState('france');
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
        <title>Copropriété résidence secondaire | Maison de vacances en co-ownership — COP</title>
        <meta name="description" content="Devenez copropriétaire d'une résidence secondaire de luxe en Espagne, France ou Italie. Plateforme indépendante regroupant les principaux opérateurs européens." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/fr/" />
        <HreflangLinks englishPath="/" />
        <meta property="og:title" content="Copropriété résidence secondaire | Maison de vacances en co-ownership — COP" />
        <meta property="og:description" content="Devenez copropriétaire d'une résidence secondaire de luxe en Espagne, France ou Italie. Plateforme indépendante." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/fr/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
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
            <span className="hero-pre">Votre fenêtre sur</span>
            <em>les plus belles résidences</em>
            <span className="hero-rule"></span>
            <span className="hero-post">secondaires en copropriété</span>
          </h1>
        </div>

        <div className="hero-bottom">
          <div className="hero-ctas">
            <a href="/our-homes" className="hero-cta-primary">Voir les biens &rarr;</a>
            <a href="/fr/copropriete-residence-secondaire/" className="hero-cta-secondary">Comment ça marche</a>
          </div>
        </div>
      </section>

      {/* ===== PRESS MARQUEE ===== */}
      <div className="press-bar" role="region" aria-label="Vu dans">
        <div className="press-bar-header">
          <span className="press-bar-label">Vu dans</span>
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
        <h2 className="section-heading">Découvrez nos biens de prestige</h2>
        <p className="section-subtitle">Parcourez notre sélection de biens en copropriété dans les destinations les plus recherchées au monde.</p>

        <PropCarousel items={featuredProps} propertyCount={propertyCount} />

        <div className="pc-browse-all">
          <a href="/our-homes/" className="pc-browse-btn">Voir les {propertyCount} biens &rarr;</a>
        </div>
      </section>

      {/* ===== INTRODUCTION SECTION ===== */}
      <section className="intro-section">
        <p className="intro-text">
          Découvrez l'univers des biens de prestige en vente fractionnée. Des villas baignées de soleil en Méditerranée aux appartements urbains élégants, des domaines viticoles aux chalets alpins, vous êtes chez vous.
        </p>
        <p className="intro-subtext">
          Chaque bien est soigneusement sélectionné, impeccablement aménagé et géré par des professionnels. Plus qu'une façon d'être propriétaire, c'est un accès privilégié à des paysages intemporels, à des trésors culturels et à des moments inoubliables en famille.
        </p>
      </section>

      {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
      <section className="explainer-section">
        <div className="explainer-intro">
          <h2>Qu'est-ce que la copropriété ou la vente fractionnée ?</h2>
          <p>La copropriété vous permet d'acheter une part d'une résidence secondaire haut de gamme et d'en profiter pleinement, comme vous le feriez avec une résidence qui vous appartient entièrement. Vous accédez au style de vie sans supporter seul le prix d'achat, et ensuite vous partagez les frais avec les autres copropriétaires. Attention : ce n'est pas du « temps partagé ou timeshare » ; votre nom est sur l'acte notarial comme dans une SCI.</p>
        </div>
        <div className="explainer-grid">
          <div className="explainer-item">
            <div className="explainer-num">01</div>
            <div className="explainer-divider"></div>
            <h3>Vous détenez une part réelle</h3>
            <p>Vous achetez une part de <strong>1/8 dans un bien de prestige</strong> (maximum 4 parts, puisqu'il y a 8 parts au total et au minimum deux copropriétaires). Il s'agit d'un <strong>bien réel, enregistré</strong> au nom d'une société type SCI ou votre nom figure pour 1/8 ou plus, avec toutes les protections juridiques associées. Nos biens sont sélectionnés pour leur potentiel de valorisation, afin de vous offrir les avantages patrimoniaux de l'immobilier. Vous pouvez <strong>revendre votre part à tout moment</strong> : vous fixez le prix, et vendez sur le marché.</p>
            <p className="explainer-stat">En moyenne, les parts se revendent en moins d'un mois.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">02</div>
            <div className="explainer-divider"></div>
            <h3>Un temps d'usage garanti</h3>
            <p><strong>Vos semaines vous appartiennent.</strong> Un calendrier clair et équitable garantit à chaque copropriétaire son temps d'usage, sans concurrence pour les dates, y compris en haute saison. Vous êtes le seul à utiliser le bien lorsque vous y séjournez. Vous arrivez chez vous : <strong>vos affaires sont là, tout est prêt, et le bien est entièrement géré</strong> pour que vous puissiez simplement en profiter.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">03</div>
            <div className="explainer-divider"></div>
            <h3>Des frais partagés</h3>
            <p>L'entretien, les frais de gestion et les coûts courants sont <strong>répartis équitablement entre les copropriétaires</strong> (8 parts). Sur de nombreux biens, les périodes que vous n'utilisez pas peuvent être mises en location, <strong>générant des revenus qui contribuent à compenser vos frais.</strong></p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">04</div>
            <div className="explainer-divider"></div>
            <h3>Des avantages complémentaires</h3>
            <p>La copropriété offre aussi des avantages plus larges : <strong>traitement fiscal potentiellement favorable</strong>, <strong>transmission simplifiée</strong>, et possibilité d'<strong>échanger des séjours</strong> avec d'autres copropriétaires au sein d'un portefeuille international.</p>
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta-band">
        <p className="cta-band-eyebrow">Co-Ownership Property</p>
        <h2 className="cta-band-heading">Devenez propriétaire d'une part dans un lieu <em>d'exception</em></h2>
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">D'une villa sur la Côte d'Azur à un chalet à Aspen, la copropriété vous donne une véritable part dans les plus belles résidences du monde, pour une fraction du coût.</p>
        <div className="cta-band-buttons">
          <a href="#speak-to-expert" className="cta-band-primary">Parler à un expert</a>
          <a href="#newsletter" className="cta-band-secondary">S'abonner à la newsletter</a>
        </div>
      </section>

      {/* ===== DESTINATIONS SECTION ===== */}
      <section className="destinations-section" id="destinations">
        <h2 className="section-heading">Nos destinations</h2>

        <div className="dest-tabs" ref={destTabsRef}>
          {[["france","France"],["spain","Espagne"],["italy","Italie"],["usa","États-Unis"],["portugal","Portugal"],["austria","Autriche"],["england","Angleterre"],["sweden","Suède"],["germany","Allemagne"],["croatia","Croatie"],["mexico","Mexique"]].map(([key, label]) => (
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

          <div className={`dest-panel${activeDest === "france" ? " active" : ""}`} id="dest-france">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/france-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-france.webp" alt="France" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">France</div>
              <p className="dest-info-desc">Des rivages ensoleillés de la Côte d'Azur aux pistes de ski des Alpes françaises et à l'élégance intemporelle de Paris, la France est l'adresse la plus convoitée d'Europe pour la copropriété.</p>
              <a href="/fr/destinations/france-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "spain" ? " active" : ""}`} id="dest-spain">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/spain-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-spain.webp" alt="Espagne" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Espagne</div>
              <p className="dest-info-desc">L'Espagne combine plages de classe mondiale, culture vibrante et soleil toute l'année à Majorque, Ibiza, sur la Costa del Sol et au-delà — le tout à un rapport qualité-prix remarquable pour les copropriétaires exigeants.</p>
              <a href="/fr/destinations/spain-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "italy" ? " active" : ""}`} id="dest-italy">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/italy-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-italy-v2.webp" alt="Italie" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Italie</div>
              <p className="dest-info-desc">Les paysages extraordinaires de l'Italie — des eaux limpides du lac de Côme aux villages anciens de Ligurie et aux collines toscanes — en font une favorite éternelle des copropriétaires exigeants.</p>
              <a href="/fr/destinations/italy-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "portugal" ? " active" : ""}`} id="dest-portugal">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/portugal-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-portugal.webp" alt="Portugal" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Portugal</div>
              <p className="dest-info-desc">De la côte dorée de l'Algarve aux élégants boulevards de Lisbonne et à la beauté préservée de la Côte d'Argent, le Portugal est l'une des destinations les plus excitantes d'Europe pour la copropriété de luxe.</p>
              <a href="/fr/destinations/portugal-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "austria" ? " active" : ""}`} id="dest-austria">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/austria-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-austria.webp" alt="Autriche" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Autriche</div>
              <p className="dest-info-desc">La splendeur alpine de l'Autriche — des stations de ski de classe mondiale du Tyrol au charme impérial de Vienne — en fait l'une des destinations européennes les plus gratifiantes pour la copropriété de luxe.</p>
              <a href="/austria-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "england" ? " active" : ""}`} id="dest-england">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/england-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-england.webp" alt="Angleterre" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Angleterre</div>
              <p className="dest-info-desc">Londres reste l'une des grandes villes du monde pour l'immobilier de luxe — des hôtels particuliers de Mayfair aux appartements en bord de Tamise — tandis que la campagne anglaise offre des refuges idylliques pour les copropriétaires exigeants.</p>
              <a href="/england-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "sweden" ? " active" : ""}`} id="dest-sweden">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/sweden-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-sweden.webp" alt="Suède" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Suède</div>
              <p className="dest-info-desc">Les paysages spectaculaires de la Suède — de l'archipel de Stockholm aux régions des lacs forestiers du nord — offrent un cadre uniquement paisible pour la copropriété de luxe, loin des foules.</p>
              <a href="/sweden-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "germany" ? " active" : ""}`} id="dest-germany">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/germany-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-germany.webp" alt="Allemagne" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Allemagne</div>
              <p className="dest-info-desc">Des Alpes bavaroises et des rives du lac de Constance aux capitales culturelles de Berlin et Munich, l'Allemagne offre un éventail attractif d'opportunités immobilières de luxe pour les copropriétaires.</p>
              <a href="/germany-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "croatia" ? " active" : ""}`} id="dest-croatia">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/croatia-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-croatia.webp" alt="Croatie" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Croatie</div>
              <p className="dest-info-desc">La côte adriatique à couper le souffle de la Croatie, ses eaux cristallines et ses villes fortifiées historiques comme Dubrovnik en font l'une des destinations méditerranéennes les plus convoitées pour la copropriété de luxe.</p>
              <a href="/croatia-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "usa" ? " active" : ""}`} id="dest-usa">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/usa-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-usa-v2.webp" alt="États-Unis" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">États-Unis</div>
              <p className="dest-info-desc">De la culture du surf en Californie aux pistes de ski du Colorado et au glamour côtier de la Floride, le marché immobilier de luxe américain offre des opportunités extraordinaires pour les copropriétaires internationaux.</p>
              <a href="/fr/destinations/usa-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

          <div className={`dest-panel${activeDest === "mexico" ? " active" : ""}`} id="dest-mexico">
            <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/mexico-line.webp')"}}></div>
            <div className="dest-img-wrap">
              <Image src="/wp-content/uploads/dest-mexico-v2.webp" alt="Mexique" fill quality={90} loading="lazy" sizes="(max-width: 768px) 100vw, 49vw" style={{objectFit:'cover', objectPosition:'center 65%'}} />
            </div>
            <div className="dest-info">
              <div className="dest-info-name">Mexique</div>
              <p className="dest-info-desc">Des rivages turquoise de la Riviera Maya au glamour pacifique de Los Cabos, le Mexique offre un luxe extraordinaire à une valeur exceptionnelle — ce qui en fait l'un des marchés de copropriété les plus excitants du monde.</p>
              <a href="/mexico-fractional-ownership-properties/" className="dest-explore-btn">Voir les biens</a>
            </div>
          </div>

        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="testimonials-section" id="testimonials">
        <h2 className="section-heading">Témoignages de copropriétaires</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">«&nbsp;Dès le premier séjour, tout a semblé évident : arriver chez soi, avec le confort d'un hôtel. La Provence fait désormais partie de notre rythme. Je n'ai plus à m'occuper de rien.&nbsp;»</p>
            <div className="testimonial-author">Astrid</div>
            <div className="testimonial-location">Mougins, sud de la France</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry et Nicole" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">«&nbsp;La copropriété nous a permis d'acquérir un bien à la montagne que nous pensions hors de portée. Le processus a été fluide, et notre fils invite maintenant ses amis à venir skier. C'est devenu une vraie maison de famille.&nbsp;»</p>
            <div className="testimonial-author">Harry et Nicole</div>
            <div className="testimonial-location">La Plagne, Alpes françaises</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo et Anne" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">«&nbsp;Nous possédons enfin une part de ce bien, sans le poids d'un emprunt pour une maison que nous n'utilisons que sporadiquement (35 jours en moyenne en Europe pour l'utilisation d'une résidence secondaire). Tout a été facile dès le premier jour. Nous sommes ravis, et nous pensons déjà à notre prochaine part en Europe.&nbsp;»</p>
            <div className="testimonial-author">Mateo et Anne</div>
            <div className="testimonial-location">LA, Californie</div>
          </div>
          <div className="testimonial-card">
            <Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca.jpg" alt="Jan et la famille" width={120} height={120} className="testimonial-image" loading="lazy" />
            <p className="testimonial-quote">«&nbsp;J'ai vendu ma résidence secondaire en France et acheté une villa beaucoup plus belle à Majorque pour un quart du prix. L'équipe a tout géré parfaitement. On se sent chez nous dès que l'on pousse la porte.&nbsp;»</p>
            <div className="testimonial-author">Jan et la famille</div>
            <div className="testimonial-location">Majorque, Espagne</div>
          </div>
        </div>
      </section>

      {/* ===== LATEST POSTS SECTION ===== */}
      <section className="latest-posts-section">
        <span className="lp-eyebrow">Actualités</span>
        <h2 className="section-heading">Dernières analyses</h2>
        <p className="lp-subtitle">Guides de destinations, analyses de marché et témoignages de copropriétaires, pensés pour les acquéreurs exigeants.</p>

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
                <a href={`/blog/${post.slug}/`} className="lp-read-more" onClick={e => e.stopPropagation()}>Lire l'article →</a>
              </div>
            </article>
          ))}
        </div>

        <div className="lp-footer">
          <a href="/all-our-blog/" className="lp-all-btn">Voir tous les articles</a>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="faq-section" id="faq">
        <p className="faq-eyebrow">Questions fréquentes</p>
        <h2 className="faq-heading">Questions <em>fréquentes</em></h2>
        <p className="faq-subheading">Tout ce qu'il faut savoir sur la copropriété de prestige, et pourquoi c'est l'une des façons les plus intelligentes pour acquérir une résidence secondaire.</p>
        <div className="faq-list">

          <details className="faq-item">
            <summary className="faq-q"><span>Qu'est-ce que la copropriété (ou co-ownership) d'une résidence secondaire ?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>La copropriété signifie que vous et un petit nombre d'autres copropriétaires achetez chacun une quote-part enregistrée d'un bien de prestige entièrement géré. Vous possédez une véritable fraction du bien — typiquement 1/8 — et contrairement au timeshare, vous détenez un véritable bien immobilier. Cela combine la fierté et les avantages financiers du bien immobilier réel avec la facilité d'un hôtel cinq étoiles, à une fraction du coût d'achat complet.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>En quoi la copropriété est-elle différente du timeshare&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Contrairement au timeshare, la copropriété vous donne une véritable part de l'acte notarié — vous bénéficiez donc de toute appréciation de valeur et pouvez revendre votre quote-part sur le marché libre quand vous voulez. Comme il s'agit de biens de luxe dans des emplacements très demandés, les prix augmentent typiquement avec le temps. Pas de club d'adhérents, pas de système de points, pas de verrouillage contractuel à long terme. Vous êtes un véritable propriétaire avec tous les droits légaux sur votre fraction.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Que comprend le prix d'achat&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Votre prix d'achat couvre votre quote-part enregistrée de le bien ainsi que tout le mobilier, la décoration intérieure et l'équipement. Beaucoup de nos maisons sont décorées par des professionnels selon un standard clé en main, donc prêtes à habiter dès le premier jour. Les coûts récurrents — entretien, assurance, gestion immobilière, taxes locales — sont partagés proportionnellement entre tous les copropriétaires, maintenant les frais individuels très bas.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Comment le temps d'usage est-il réparti entre les copropriétaires&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Chaque quote-part de 1/8 vous donne 45 jours — environ six semaines — soit 1/8 de l'année. Chaque bien a un calendrier d'usage clair qui tourne équitablement pour que tous les copropriétaires bénéficient d'accès en haute saison au fil du temps. De nombreux opérateurs proposent aussi une plateforme de réservation numérique pour échanger, prolonger ou troquer des semaines avec d'autres copropriétaires en toute flexibilité.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Puis-je louer mes semaines lorsque je ne les utilise pas&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Dans de nombreux cas, oui. Beaucoup de nos biens permettent aux copropriétaires de placer leurs semaines non utilisées dans un programme de location géré. La société de gestion s'occupe de la sélection des locataires, de l'arrivée, du ménage et de l'entretien, tandis que les revenus locatifs vous reviennent. Cela peut compenser significativement vos frais annuels et, dans des destinations populaires, même générer un retour net.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Qui gère le bien au quotidien&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Chaque maison sur notre plateforme est confiée à une société de gestion immobilière professionnelle. Elle s'occupe de tout : entretien régulier, ménage, jardinage, entretien de la piscine, réparations urgentes. Vous arrivez à une maison impeccable de qualité hôtelière à chaque visite — sans lever le petit doigt.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Puis-je revendre ma quote-part plus tard&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Absolument. Comme vous détenez une quote-part enregistrée, vous pouvez la revendre à tout moment sur le marché libre — comme n'importe quelle autre bien. Si la maison s'est valorisée, vous bénéficiez de cette croissance proportionnellement à votre part. Notre équipe peut aussi vous aider à la revente via notre réseau d'acquéreurs qualifiés.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Quelles destinations et types de biens proposez-vous&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Nous sélectionnons des résidences en copropriété de luxe à travers l'Europe et les États-Unis, dont la France, l'Espagne, l'Italie, le Portugal, l'Autriche, l'Angleterre et plusieurs destinations américaines. Les biens vont des villas côtières et appartements parisiens aux chalets alpins et fermes toscanes. Chaque maison est sélectionnée à la main pour son emplacement, sa qualité de construction et son attrait de mode de vie.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>La copropriété est-elle un bon investissement&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>La copropriété vous permet d'accéder à un bien de grande valeur à une fraction du coût d'achat complet, libérant du capital pour d'autres investissements. Vous bénéficiez de l'appréciation potentielle, de revenus locatifs possibles, et de la valeur personnelle d'une résidence secondaire de luxe — tout en partageant les coûts avec d'autres copropriétaires. C'est de plus en plus reconnu comme l'une des façons les plus financièrement sensées de posséder une résidence secondaire.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Comment commencer&nbsp;?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Parcourez simplement notre collection ci-dessus ou parlez à l'un de nos spécialistes via le formulaire de contact. Nous vous accompagnons à travers les maisons disponibles, répondons à vos questions et vous guidons dans le processus d'achat de bout en bout — avec une transparence légale et financière totale à chaque étape.</p></div>
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
