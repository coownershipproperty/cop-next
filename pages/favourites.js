import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const COP_FAV_KEY = 'cop_favourites';

function getFavs() {
  try { return JSON.parse(localStorage.getItem(COP_FAV_KEY) || '{}'); } catch { return {}; }
}

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

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

export default function Favourites() {
  const [favs, setFavs] = useState(null); // null = not hydrated yet

  useEffect(() => {
    setFavs(getFavs());
    const sync = (e) => { if (e.key === COP_FAV_KEY) setFavs(getFavs()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function remove(slug) {
    const updated = getFavs();
    delete updated[slug];
    localStorage.setItem(COP_FAV_KEY, JSON.stringify(updated));
    setFavs({ ...updated });
    const n = Object.keys(updated).length;
    document.querySelectorAll('.cop-fav-count').forEach(el => {
      el.textContent = n > 0 ? n : '';
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }

  function clearAll() {
    if (!confirm('Remove all saved properties?')) return;
    localStorage.removeItem(COP_FAV_KEY);
    setFavs({});
    document.querySelectorAll('.cop-fav-count').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  const entries = favs ? Object.values(favs) : [];

  return (
    <>
      <Head>
        <title>My Favourites | Co-Ownership Property</title>
        <meta name="description" content="Your saved co-ownership properties on Co-Ownership Property." />
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

          {/* Not yet hydrated */}
          {favs === null && <div style={{minHeight: 200}} />}

          {/* Empty state */}
          {favs !== null && entries.length === 0 && (
            <div className="fav-empty">
              <div className="fav-empty-icon">&#9825;</div>
              <h2>No Saved Properties Yet</h2>
              <p>Browse our collection and tap the heart icon on any property to save it here.</p>
              <a href="/our-homes/" className="btn-gold">Browse Properties</a>
            </div>
          )}

          {/* Saved grid */}
          {entries.length > 0 && (
            <>
              <div className="fav-header">
                <p className="fav-count"><strong>{entries.length}</strong> saved propert{entries.length === 1 ? 'y' : 'ies'}</p>
                <button className="clear-favs-btn" onClick={clearAll}>Clear all</button>
              </div>
              <div className="fav-grid">
                {entries.map(p => {
                  const price = p.price ? `${CURRENCY_SYM[p.currency] || p.currency}${p.price.toLocaleString('en-GB')}` : null;
                  const location = [p.city, p.region, p.country].filter(Boolean).join(', ');
                  return (
                    <article key={p.id} className="prop-card" onClick={() => window.location.href = p.url} role="link" aria-label={p.title}>
                      <div className="prop-img-wrap">
                        {p.img
                          ? <img src={p.img} alt={p.title} className="prop-img" loading="lazy" />
                          : <div className="prop-img" style={{background:'var(--blue-20)'}} />
                        }
                        {p.label && <span className={`prop-badge ${p.status || ''}`}>{p.label}</span>}
                        <button className="prop-heart active" onClick={e => { e.stopPropagation(); remove(p.id); }} aria-label="Remove from favourites">
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
                        <a href={p.url} className="prop-view-btn" onClick={e => e.stopPropagation()}>View Property →</a>
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
