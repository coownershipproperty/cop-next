// components/CollectionCard.js
//
// A collection home in the Our Homes grid. One card per place (David, 25 Sep
// 2026): a Rome search shows a Rome card that says it is part of the Three
// Cities Collection and names the other places.
//
// Built on the same skeleton as PropertyCard (photo on top, white body, title,
// stats, price row, "view" link) so it sits naturally in the grid. What marks
// it as a collection is small and consistent: a "Collection" badge where the
// 1/8 cards have "New this week", a "Part of …" line with the places, "all N
// homes" where the 1/8 cards say "1/8 share", and a thin gold rule on top.
// No monthly costs; weeks always carry the circa wave (∼12 / ∼7).
import Link from 'next/link';
import Image from 'next/image';
import { collectionHref, formatMoney, weeksLabel } from '@/lib/collections';
import c from '@/styles/collections.module.css';

const STATUS = { soon: 'Ready soon', in_preparation: 'Being prepared', searching: 'Home being chosen', example: 'Home being chosen' };

// Gilded-frame variants under trial (David, 25 Sep 2026: "the thing paintings
// have around them in gold … almost Versailles"). Chosen by ?cv= on the
// preview build only; the default stays the plain card until one is picked.
//   gilt       — a moulded gold frame round the whole card
//   painting   — the photo framed like a painting, with a cream mat
//   baroque    — the painting frame plus carved scroll corners and a cartouche
//   versailles — the whole card in a beaded Louis XIV frame with rosettes
const CORNER = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs><linearGradient id="cc-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2b8"/><stop offset=".35" stopColor="#d6ad55"/><stop offset=".7" stopColor="#8d6824"/><stop offset="1" stopColor="#e9c96f"/></linearGradient></defs>
    <path d="M4 44V20C4 10 10 4 20 4h24" fill="none" stroke="url(#cc-g)" strokeWidth="3"/>
    <path d="M10 44V22c0-7 5-12 12-12h22" fill="none" stroke="url(#cc-g)" strokeWidth="1.5"/>
    <path d="M4 20c6 0 10 4 9 9-1 4-6 5-8 2-2-2 0-5 2-4" fill="none" stroke="url(#cc-g)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 4c0 6 4 10 9 9 4-1 5-6 2-8-2-2-5 0-4 2" fill="none" stroke="url(#cc-g)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M13 13c4-2 9 0 10 4-4 1-8-1-10-4zM13 13c-2 4 0 9 4 10 1-4-1-8-4-10z" fill="url(#cc-g)"/>
    <circle cx="13" cy="13" r="2.6" fill="url(#cc-g)" stroke="#6f5118" strokeWidth=".6"/>
  </svg>
);
const ROSETTE = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <g fill="url(#cc-g2)" stroke="#6f5118" strokeWidth=".5">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <ellipse key={a} cx="12" cy="5.2" rx="2.4" ry="4.4" transform={`rotate(${a} 12 12)`} />)}
      <circle cx="12" cy="12" r="3.4" />
    </g>
    <defs><radialGradient id="cc-g2"><stop offset="0" stopColor="#fff4c4"/><stop offset=".6" stopColor="#d2a74c"/><stop offset="1" stopColor="#8a6423"/></radialGradient></defs>
  </svg>
);

// Carved rococo frame (public-domain photo of an 18th-century gilt frame,
// cut and re-laid for a landscape photo: public/img/frames/rococo-frame.webp).
// Border widths in px: top (crest), sides, bottom; photo inset under it.
const ROCOCO = {
  fine:    { bt: 26, bs: 22, bb: 22, pi: 15 },
  classic: { bt: 38, bs: 32, bb: 32, pi: 23 },
  grand:   { bt: 54, bs: 46, bb: 46, pi: 33 },
  mat:     { bt: 38, bs: 32, bb: 32, pi: 30, mat: true },
};

// Same 24px line icons as BedIcon / SizeIcon in PropertyCard.
const HomesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l6-5 6 5v9H3zM13 8.5l4-3.5 4 3.5V20h-6M7 20v-5h4v5" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export default function CollectionCard({ card, leadKey = null, priority = false, variant = null }) {
  const rc = ROCOCO[variant];
  if (!card?.homes?.length) return null;
  const wanted = card.homes.find(h => h.key === leadKey);
  const readyHome = card.homes.find(h => h.photo && !h.photoIsDestination);
  const lead = wanted || readyHome || card.homes.find(h => h.photo) || card.homes[0];
  const n = card.homes_count || card.homes.length;
  const href = collectionHref(card.slug, wanted ? lead.key : null);
  const status = STATUS[lead.readiness];
  const title = `${lead.city}, ${lead.country} — ${lead.name}`;
  const article = (
    <article className={`prop-card ${c.pcard} ${variant ? c['v_' + variant] || '' : ''}`}>
      <Link href={href} className="prop-card-link" aria-label={`${title}. Part of ${card.name}`} />
      <div className={`prop-img-wrap ${variant === 'painting' || variant === 'baroque' ? c.paintWrap : ''} ${rc ? c.rWrap : ''}`}
        style={rc ? { '--bt': `${rc.bt}px`, '--bs': `${rc.bs}px`, '--bb': `${rc.bb}px`, '--pi': `${rc.pi}px` } : undefined}>
        {(variant === 'painting' || variant === 'baroque') && <span className={c.paintFrame} aria-hidden="true" />}
        {variant === 'baroque' && ['tl', 'tr', 'bl', 'br'].map(k => <span key={k} className={`${c.corner} ${c['corner_' + k]}`}>{CORNER}</span>)}
        {variant === 'baroque' && <span className={c.cartouche}>Collection</span>}
        {variant === 'mosaic' && lead.photo && (() => {
          const others = card.homes.filter(h => h.key !== lead.key && h.photo).slice(0, 2);
          return (<>
            <span className={c.mzMain}><Image src={lead.photo} alt={`${lead.city}, ${card.name}`} fill quality={88} className="prop-img" sizes="(max-width: 768px) 70vw, 25vw" priority={priority} /></span>
            <span className={c.mzSide}>{others.map(h => (
              <span key={h.key} className={c.mzTile}><Image src={h.photo} alt={h.city} fill quality={80} className="prop-img" sizes="15vw" /><span className={c.mzLabel}>{h.city}</span></span>
            ))}</span>
          </>);
        })()}
        {variant !== 'mosaic' && lead.photo && (rc
          ? <span className={`${c.rPhoto} ${rc.mat ? c.rMat : ''}`}><Image src={lead.photo} alt={`${lead.city}, ${card.name}`} fill quality={90} className="prop-img" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority} /></span>
          : <Image src={lead.photo} alt={`${lead.city}, ${card.name}`} fill quality={90} className="prop-img" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority} />)}
        {rc && <span className={c.rFrame} aria-hidden="true" />}
        {variant === 'stamps' && (
          <span className={c.stRow}>{card.homes.map(h => <span key={h.key} className={h.key === lead.key ? c.stOn : c.st}>{h.city}</span>)}</span>
        )}
        {variant === 'ribbon' && <span className={c.ribbon}><span>Collection</span></span>}
        {variant ? (
          <span className={`${c.pBadges} ${rc ? c.rBadges : ''}`}>
            <span className={c.pBadge}>Collection · {n} homes</span>
            {status && <span className={c.pStatus}>{status}</span>}
          </span>
        ) : (<>
          {/* Same badge as "New this week" on the ordinary cards. */}
          <span className="prop-badge-shade" aria-hidden="true" />
          <span className="prop-badge new">{card.name.replace(/^The /, '')}</span>
          {/* The other places sit on the photo, so the card body is exactly
              as tall as an ordinary card's (David, 25 Sep 2026). */}
          <span className={c.pOnPhoto} aria-hidden="true">
            {card.homes.map((h, i) => (
              <span key={h.key} className={h.key === lead.key ? c.pOnPhotoOn : undefined}>{i > 0 ? ' · ' : ''}{h.city}</span>
            ))}
          </span>
        </>)}
      </div>
      <div className="prop-body">
        <h3 className="prop-title">{title}</h3>
        {variant && (
          <p className={c.pPart}>
            <span className={c.pPartLabel}>Part of {card.name}</span>
            <span className={c.pPlaces}>
              {card.homes.map((h, i) => (
                <span key={h.key} className={h.key === lead.key ? c.pPlaceOn : undefined}>{i > 0 ? ' · ' : ''}{h.city}</span>
              ))}
            </span>
          </p>
        )}
        <div className="prop-mobile-facts">
          <div><strong>{formatMoney(card.price, card.currency)}</strong><small>All {n} homes</small></div>
          <div><strong>{weeksLabel(card)}</strong><small>Weeks a year</small></div>
        </div>
        <div className="prop-stats">
          <span className="prop-stat"><HomesIcon />{n} homes</span>
          <span className="prop-stat-sep" />
          <span className="prop-stat"><CalendarIcon />{weeksLabel(card)} weeks a year</span>
        </div>
        <div className="prop-price-row">
          <p className="prop-price">{formatMoney(card.price, card.currency)}</p>
          <span className="prop-share-size">All {n} homes</span>
        </div>
        <Link href={href} className="prop-view-btn">Discover the collection →</Link>
      </div>
    </article>
  );
  if (variant === 'stack') {
    return <div className={c.stackWrap}><span className={c.stackBack2} aria-hidden="true" /><span className={c.stackBack1} aria-hidden="true" />{article}</div>;
  }
  if (variant === 'gilt' || variant === 'versailles') {
    return (
      <div className={variant === 'gilt' ? c.giltOuter : c.versOuter}>
        {variant === 'versailles' && ['tl', 'tr', 'bl', 'br'].map(k => <span key={k} className={`${c.rosette} ${c['rosette_' + k]}`}>{ROSETTE}</span>)}
        <div className={variant === 'gilt' ? c.giltInner : c.versInner}>{article}</div>
      </div>
    );
  }
  return article;
}
