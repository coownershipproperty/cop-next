import Image from 'next/image';

export default function PropertyCard({ property: p, priority = false }) {
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

  const meta = [
    p.beds > 0 ? `${p.beds} Beds` : null,
    p.size > 0 ? `${p.size} m²`   : null,
  ].filter(Boolean).join('  ·  ');

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
            loading={priority ? 'eager' : 'lazy'}
            quality={82}
          />
        </div>

        <div className="prop-card-body">
          <h3 className="prop-card-title">{p.title}</h3>
          {meta && <p className="prop-card-meta">{meta}</p>}
          {priceFormatted && (
            <p className="prop-card-price">{priceFormatted}</p>
          )}
          <span className="prop-card-cta">View Property →</span>
        </div>
      </a>
    </div>
  );
}
