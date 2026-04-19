import { useState, useEffect } from 'react';
import Image from 'next/image';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';

const BedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20V10a2 2 0 012-2h16a2 2 0 012 2v10M2 14h20M7 10V8a1 1 0 011-1h8a1 1 0 011 1v2"/>
  </svg>
);

const SizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18"/>
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 16, height: 16 }}>
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      fill={filled ? '#C9A84C' : 'none'}
      stroke={filled ? '#C9A84C' : '#2C4A5E'}
    />
  </svg>
);

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

export default function PropertyCard({ property: p }) {
  const href = `/property/${p.slug}`;
  const [fav, setFav] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage on mount
    setFav(isFav(p.slug));
    // Keep in sync if another card or tab changes favourites
    return onFavsChange((slugs) => setFav(slugs.includes(p.slug)));
  }, [p.slug]);

  function handleToggle(e) {
    e.stopPropagation();
    setFav(toggleFav(p.slug));
  }

  const priceFormatted = p.price
    ? `${CURRENCY_SYM[p.currency] || p.currency}${p.price.toLocaleString('en-GB')}`
    : null;

  return (
    <article className="prop-card" onClick={() => window.location.href = href} role="link" aria-label={p.title}>
      <div className="prop-img-wrap">
        <Image
          src={p.img || '/images/placeholder.jpg'}
          alt={p.title}
          fill
          className="prop-img"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
        {p.label && <span className={`prop-badge ${p.status || ''}`}>{p.label}</span>}
        <button
          className={`prop-heart${fav ? ' active' : ''}`}
          onClick={handleToggle}
          aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <HeartIcon filled={fav} />
        </button>
      </div>

      <div className="prop-body">
        <h3 className="prop-title">{p.title}</h3>

        {(p.beds > 0 || p.size > 0) && (
          <div className="prop-stats">
            {p.beds > 0 && (
              <span className="prop-stat"><BedIcon />{p.beds} Bed{p.beds > 1 ? 's' : ''}</span>
            )}
            {p.beds > 0 && p.size > 0 && <span className="prop-stat-sep" />}
            {p.size > 0 && (
              <span className="prop-stat"><SizeIcon />{p.size} m²</span>
            )}
          </div>
        )}

        {priceFormatted && <p className="prop-price">{priceFormatted}</p>}
        <a href={href} className="prop-view-btn" onClick={e => e.stopPropagation()}>View Property →</a>
      </div>
    </article>
  );
}
