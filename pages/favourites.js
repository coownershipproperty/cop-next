import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { FAV_KEY, FAV_EVENT, getFavSlugs, toggleFav, onFavsChange } from '@/lib/favs';
import { t, propertyHref, DEFAULT_LOCALE } from '@/lib/i18n';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

// Locale → BCP-47 tag for Number.toLocaleString price formatting (Spanish
// uses dots as thousand separators, French uses thin spaces, English commas).
const LOCALE_TAG = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };

// Locale → href for the "Browse Properties" empty-state CTA. Each locale's
// own properties index keeps the visitor in their language stream.
const BROWSE_HREF = { en: '/our-homes/', es: '/es/propiedades/', fr: '/fr/proprietes/' };

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

/**
 * Favourites page renderer.
 *
 * Accepts a `locale` prop so the same component powers /favourites,
 * /es/favoritos and /fr/favoris. The favourites themselves live in
 * localStorage under a single key and are shared across locales — saving
 * a property on the English site shows up in the Spanish favourites and
 * vice versa, which matches user expectation.
 */
export default function Favourites({ locale = DEFAULT_LOCALE }) {
  // null = not yet hydrated; [] = hydrated but empty; [...] = has slugs
  const [slugs, setSlugs]       = useState(null);
  const [props, setProps]       = useState([]);
  const [loading, setLoading]   = useState(false);

  const tr = (key, vars) => {
    let s = t(`favourites.${key}`, locale);
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  };

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
    if (!confirm(tr('clear_confirm'))) return;
    localStorage.removeItem(FAV_KEY);
    window.dispatchEvent(new CustomEvent(FAV_EVENT, { detail: [] }));
  }

  const hydrated = slugs !== null;
  const isEmpty  = hydrated && slugs.length === 0;
  const numberLocale = LOCALE_TAG[locale] || LOCALE_TAG.en;

  return (
    <>
      <Head>
        <title>{tr('meta_title')}</title>
        <meta name="description" content={tr('meta_description')} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">{tr('eyebrow')}</span>
        <h1>{tr('heading_prefix')} <em>{tr('heading_em')}</em></h1>
        <p className="page-hero-sub">{tr('subheading')}</p>
      </section>

      <section className="fav-sec">
        <div className="fav-inner">

          {/* Not hydrated yet — show nothing to avoid flash */}
          {!hydrated && <div style={{ minHeight: 200 }} />}

          {/* Empty state */}
          {isEmpty && (
            <div className="fav-empty">
              <div className="fav-empty-icon">&#9825;</div>
              <h2>{tr('empty_heading')}</h2>
              <p>{tr('empty_subtext')}</p>
              <a href={BROWSE_HREF[locale] || BROWSE_HREF.en} className="btn-gold">{tr('browse_button')}</a>
            </div>
          )}

          {/* Loading spinner while fetching */}
          {hydrated && !isEmpty && loading && props.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              {tr('loading')}
            </div>
          )}

          {/* Saved grid */}
          {props.length > 0 && (
            <>
              <div className="fav-header">
                <p className="fav-count">
                  {tr(slugs.length === 1 ? 'count_one' : 'count_other', { count: `<strong>${slugs.length}</strong>` })
                    .split(/(<strong>\d+<\/strong>)/)
                    .map((part, i) => part.startsWith('<strong>')
                      ? <strong key={i}>{part.replace(/<\/?strong>/g, '')}</strong>
                      : <span key={i}>{part}</span>)}
                </p>
                <button className="clear-favs-btn" onClick={clearAll}>{tr('clear_button')}</button>
              </div>
              <div className="fav-grid">
                {props.map((p) => {
                  const propUrl  = propertyHref(p.slug, locale);
                  const imgSrc   = p.img || (p.images && p.images[0]) || '/images/placeholder.jpg';
                  const price    = p.price
                    ? `${CURRENCY_SYM[p.currency] || p.currency}${p.price.toLocaleString(numberLocale)}`
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
                        <Image src={imgSrc} alt={p.title} fill quality={90} className="prop-img" loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        {p.status === 'sold' && <span className="prop-badge sold">{tr('sold_badge')}</span>}
                        <button
                          className="prop-heart active"
                          onClick={e => { e.stopPropagation(); remove(p.slug); }}
                          aria-label={tr('remove_aria')}
                        >
                          <HeartFilledIcon />
                        </button>
                      </div>
                      <div className="prop-body">
                        {location && <p className="prop-location">{location}</p>}
                        <h3 className="prop-title">{p.title}</h3>
                        {(p.beds > 0 || p.size > 0) && (
                          <div className="prop-stats">
                            {p.beds > 0 && (
                              <span className="prop-stat">
                                <BedIcon />{tr(p.beds === 1 ? 'bed_one' : 'bed_other', { count: p.beds })}
                              </span>
                            )}
                            {p.beds > 0 && p.size > 0 && <span className="prop-stat-sep" />}
                            {p.size > 0 && <span className="prop-stat"><SizeIcon />{p.size} m²</span>}
                          </div>
                        )}
                        {price && <p className="prop-price">{price}</p>}
                        <a href={propUrl} className="prop-view-btn" onClick={e => e.stopPropagation()}>{tr('view_button')}</a>
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
