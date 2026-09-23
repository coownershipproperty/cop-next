// components/CollectionCard.js
//
// A collection in a grid of single homes. It has to read as a different
// product at a glance: several homes, one price, no share fraction. The
// photo mosaic (the searched home large, two others beside it) and the
// "Collection · N homes" badge do that; the rest mirrors PropertyCard so the
// grid stays one family. See lib/collections.js for the copy rules.
import Link from 'next/link';
import Image from 'next/image';
import { collectionHref, formatMoney } from '@/lib/collections';
import c from '@/styles/collections.module.css';

export default function CollectionCard({ card, leadKey = null, priority = false }) {
  if (!card?.homes?.length) return null;
  const lead = card.homes.find(h => h.key === leadKey) || card.homes[0];
  const others = card.homes.filter(h => h.key !== lead.key);
  const side = others.filter(h => h.photo).slice(0, 2);
  const places = [lead, ...others].map(h => h.city).filter(Boolean);
  const href = collectionHref(card.slug, leadKey ? lead.key : null);
  const n = card.homes_count || card.homes.length;
  return (
    <article className={`prop-card ${c.card}`}>
      <Link href={href} className="prop-card-link" aria-label={`${card.name}, ${n} homes`} />
      <div className={c.mosaic}>
        <div className={c.mosaicMain}>
          {lead.photo && <Image src={lead.photo} alt={`${card.name}: ${lead.city}`} fill sizes="(max-width: 768px) 70vw, 24vw" quality={85} priority={priority} className={c.img} />}
        </div>
        <div className={c.mosaicSide}>
          {side.map(h => (
            <div key={h.key} className={c.mosaicCell}>
              <Image src={h.photo} alt={`${card.name}: ${h.city}`} fill sizes="(max-width: 768px) 30vw, 10vw" quality={75} className={c.img} />
            </div>
          ))}
        </div>
        <span className={c.badge}>Collection · {n} homes</span>
      </div>
      <div className="prop-body">
        <p className={c.places}>{places.join(' · ')}</p>
        <h3 className="prop-title">{card.name}</h3>
        <div className="prop-stats">
          <span className="prop-stat">{n} homes, one purchase</span>
          <span className="prop-stat-sep" />
          <span className="prop-stat">~{Math.round(card.weeks_per_year || 12)} weeks a year</span>
        </div>
        <div className="prop-price-row">
          <p className="prop-price">{formatMoney(card.price, card.currency)}</p>
          <span className="prop-share-size">for all {n} homes</span>
        </div>
        <Link href={href} className="prop-view-btn">View the collection</Link>
      </div>
    </article>
  );
}
