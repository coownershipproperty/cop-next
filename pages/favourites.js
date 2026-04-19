import Head from 'next/head';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { FAV_KEY, FAV_EVENT, getFavSlugs, toggleFav, onFavsChange } from '@/lib/favs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

const BedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <path d="M2 20V10a2 2 0 012-2h16a2 2 0 012 2v10M2 14h20M7 10V8a1 1 0 011-1h8a1 1 0 011 1v2"/>
  </svg>
);
const SizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18"/>
  </svg>
);
const HeartFilledIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="#C9A84C" stroke="#C9A84C"/>
  </svg>
);

export default function Favourites() {
  // null = not yet hydrated; [] = hydrated but empty; [...] = has slugs
  const [slugs, setSlugs]       = useState(null);
  const [props, setProps]       = useState([]);
  const [loading, setLoading]   = useState(false);

  // On mount: read localStorage and subscribe to changes
  useEffect(() => {
    const initial = getFavSlugs();
    setSlugs(initial);
    return onFavsChange((updated) => setSlugs([...updated]));
  }, []);

  // Whenever the slug list changes, fetch fresh property data from Supabase
  useEffect(() => {
    if (!slugs || slugs.length === 0) {
      setProps([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSupabase()
      .from('properties')
      .select('slug, title, img, images, price, currency, country, region, city, beds, size, status')
      .in('slug', slugs)
      .then(({ data }) => {
        if (cancelled) return;
        // Preserve the order the user saved them (most recent last → show most recent first)
        const bySlug = Object.fromEntries((data || []).map(p => [p.slug, p]));
        const ordered = slugs.map(s => bySlug[s]).filter(Boolean).reverse();
        setProps(ordered);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slugs]);

  function remove(slug) {
    toggleFav(slug); // also broadcasts the cop:favs event → setSlugs fires above
  }

  function clearAll() {
    if (!confirm('Remove all saved properties?')) return;
    localStorage.removeItem(FAV_KEY);
    window.dispatchEvent(new CustomEvent(FAV_EVENT, { detail: [] }));
  }

  const hydrated = slugs !== null;
  const isEmpty  = hydrated && slugs.length === 0;

  return (
    <>
      <Head>
        <title>My Favourites | Co-Ownership Property</title>
        <meta name="description" content="Your saved co-ownership properties on Co-Ownership Property." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Saved Properties</span>
        <h1>My <em>Favourites</em></h1>
        <p className="page-hero-sub">Properties you&apos;ve saved for later. Click a card to view details or speak to an expert about any home.</p>
      </section>

      <section className="fav-sec">
        <div className="fav-inner">

          {/* Not hydrated yet — show nothing to avoid flash */}
          {!hydrated && <div style={{ minHeight: 200 }} />}

          {/* Empty state */}
          {isEmpty && (
            <div className="fav-empty">
              <div className="fav-empty-icon">&#9825;</div>
              <h2>No Saved Properties Yet</h2>
              <p>Browse our collection and tap the heart icon on any property to save it here.</p>
              <a href="/our-homes/" className="btn-gold">Browse Properties</a>
            </div>
          )}

          {/* Loading spinner while fetching */}
          {hydrated && !isEmpty && loading && props.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading your saved properties…
            </div>
          )}

          {/* Saved grid */}
          {props.length > 0 && (
            <>
              <div className="fav-header">
                <p className="fav-count">
                  <strong>{slugs.length}</strong> saved propert{slugs.length === 1 ? 'y' : 'ies'}
                </p>
                <button className="clear-favs-btn" onClick={clearAll}>Clear all</button>
              </div>
              <div className="fav-grid">
                {props.map((p) => {
                  const propUrl  = `/property/${p.slug}`;
                  const imgSrc   = p.img || (p.images && p.images[0]) || '/images/placeholder.jpg';
                  const price    = p.price
                    ? `${CURRENCY_SYM[p.currency] || p.currency}${p.price.toLocaleString('en-GB')}`
                    : null;
                  const location = [p.city, p.region, p.country].filter(Boolean).join(', ');

                  return (
                    <article
                      key={p.slug}
                      className="prop-card"
                      onClick={() => window.location.href = propUrl}
                      role="link"
                      aria-label={p.title}
                    >
                      <div className="prop-img-wrap">
                        <img src={imgSrc} alt={p.title} className="prop-img" loading="lazy" />
                        {p.status === 'sold' && <span className="prop-badge sold">Sold</span>}
                        <button
                          className="prop-heart active"
                          onClick={e => { e.stopPropagation(); remove(p.slug); }}
                          aria-label="Remove from favourites"
                        >
                          <HeartFilledIcon />
                        </button>
                      </div>
                      <div className="prop-body">
                        {location && <p className="prop-location">{location}</p>}
                        <h3 className="prop-title">{p.title}</h3>
                        {(p.beds > 0 || p.size > 0) && (
                          <div className="prop-stats">
                            {p.beds > 0 && <span className="prop-stat"><BedIcon />{p.beds} Bed{p.beds > 1 ? 's' : ''}</span>}
                            {p.beds > 0 && p.size > 0 && <span className="prop-stat-sep" />}
                            {p.size > 0 && <span className="prop-stat"><SizeIcon />{p.size} m²</span>}
                          </div>
                        )}
                        {price && <p className="prop-price">{price}</p>}
                        <a href={propUrl} className="prop-view-btn" onClick={e => e.stopPropagation()}>View Property →</a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
