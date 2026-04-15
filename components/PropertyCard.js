import { useState } from 'react';

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
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      fill={filled ? '#C9A84C' : 'none'}
      stroke={filled ? '#C9A84C' : '#2C4A5E'}
    />
  </svg>
);

export default function PropertyCard({ property: p }) {
  const [fav, setFav] = useState(false);

  const slug = p.url
    .replace(/^https?:\/\/[^/]+\/property\//, '')
    .replace(/\/$/, '');
  const href = `/property/${slug}/`;

  const location = [p.region, p.country].filter(Boolean).join(', ');

  const priceFormatted = p.price
    ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: p.currency || 'EUR',
        maximumFractionDigits: 0,
      }).format(p.price)
    : null;

  return (
    <article className="prop-card" onClick={() => window.location.href = href} role="link" aria-label={p.title}>
      <div className="prop-img-wrap">
        <img
          src={p.img}
          alt={p.title}
          className="prop-img"
          loading="lazy"
          decoding="async"
        />
        {p.label && <span className={`prop-badge ${p.status || ''}`}>{p.label}</span>}
        <button
          className={`prop-heart${fav ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setFav(!fav); }}
          aria-label="Add to favourites"
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
