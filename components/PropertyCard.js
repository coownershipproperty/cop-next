import Image from 'next/image';

export default function PropertyCard({ property: p }) {
  const slug = p.url
    .replace(/^https?:\/\/[^/]+\/property\//, '')
    .replace(/\/$/, '');
  const href = `/property/${slug}/`;

  const priceFormatted = p.price
    ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: p.currency || 'EUR',
        maximumFractionDigits: 0,
      }).format(p.price)
    : null;

  const location = [p.city, p.country].filter(Boolean).join(', ');

  return (
    <div className="prop-card">
      <a href={href} className="prop-card-link">
        {p.label && <span className="prop-card-label">{p.label}</span>}
        <div className="prop-card-img-wrap">
          <Image
            src={p.img}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="prop-card-img"
            loading="lazy"
            quality={80}
          />
        </div>
        <div className="prop-card-body">
          {location && (
            <p className="prop-card-location">{location.toUpperCase()}</p>
          )}
          <h3 className="prop-card-title">{p.title}</h3>
          <div className="prop-card-meta">
            {p.beds > 0 && <span>{p.beds} Beds</span>}
            {p.beds > 0 && p.size > 0 && (
              <span className="prop-card-meta-sep">·</span>
            )}
            {p.size > 0 && <span>{p.size} m²</span>}
          </div>
          {priceFormatted && (
            <p className="prop-card-price">From {priceFormatted}</p>
          )}
        </div>
      </a>
    </div>
  );
}
