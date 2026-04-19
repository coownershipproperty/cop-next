import { useState, useEffect } from 'react';
import Image from 'next/image';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import UnlockModal from '@/components/UnlockModal';

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

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const CURRENCY_SYM = { EUR: '€', USD: '$', GBP: '£' };

export default function PropertyCard({ property: p }) {
  const href = `/property/${p.slug}`;
  const [fav, setFav] = useState(false);
  const [slide, setSlide] = useState(0);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    setFav(isFav(p.slug));
    return onFavsChange((slugs) => setFav(slugs.includes(p.slug)));
  }, [p.slug]);

  // Reset carousel when property changes
  useEffect(() => { setSlide(0); }, [p.slug]);

  // Slide 1 = p.img (hero — always reliable, confirmed migrated).
  // images[0] (gallery-0) is always a visual duplicate of hero.jpg — skip it.
  // Slides 2-3 = images[1] and images[2] (genuine different Supabase Storage photos).
  // lh3.googleusercontent.com URLs are private Drive links — exclude from carousel.
  const heroImg = p.img || null;
  const supabaseExtras = (p.images || [])
    .slice(1)
    .filter(url => url && !url.includes('lh3.googleusercontent.com'))
    .slice(0, 2);
  const imgSlides = [heroImg, ...supabaseExtras].filter(Boolean);
  const hasLock = !!p.driveUrl;
  const totalSlides = imgSlides.length + (hasLock ? 1 : 0);
  const isLockSlide = hasLock && slide >= imgSlides.length;

  // How many photos the user can't see (same calc as property detail page)
  const totalImgs = p.totalImages || imgSlides.length;
  const missingCount = totalImgs > imgSlides.length ? totalImgs - imgSlides.length : null;

  function goTo(idx, e) {
    if (e) e.stopPropagation();
    setSlide(idx);
  }

  function prev(e) {
    e.stopPropagation();
    setSlide(i => Math.max(0, i - 1));
  }

  function next(e) {
    e.stopPropagation();
    setSlide(i => Math.min(totalSlides - 1, i + 1));
  }

  function handleToggleFav(e) {
    e.stopPropagation();
    setFav(toggleFav(p.slug));
  }

  function handleLockClick(e) {
    e.stopPropagation();
    setUnlockOpen(true);
  }

  function handleCardClick() {
    if (!isLockSlide) window.location.href = href;
  }

  const priceFormatted = p.price
    ? `${CURRENCY_SYM[p.currency] || p.currency}${p.price.toLocaleString('en-GB')}`
    : null;

  return (
    <>
      <article
        className="prop-card"
        onClick={handleCardClick}
        role="link"
        aria-label={p.title}
        style={isLockSlide ? { cursor: 'default' } : {}}
      >
        <div className="prop-img-wrap">

          {/* ── Photo slides ── */}
          {imgSlides.map((src, i) => (
            <div
              key={i}
              className="prop-carousel-slide"
              style={{
                opacity: slide === i && !isLockSlide ? 1 : 0,
                pointerEvents: slide === i && !isLockSlide ? 'auto' : 'none',
              }}
            >
              <Image
                src={src}
                alt={`${p.title} — photo ${i + 1}`}
                fill
                className="prop-img"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}

          {/* ── Lock slide (4th position) — same wording as listing page ── */}
          {hasLock && (
            <div
              className="prop-carousel-slide prop-carousel-lock"
              style={{ opacity: isLockSlide ? 1 : 0, pointerEvents: isLockSlide ? 'auto' : 'none' }}
              onClick={handleLockClick}
            >
              <div className="prop-card-lock-blur" style={{ backgroundImage: `url('${heroImg || ''}')` }} />
              <div className="prop-card-lock-inner">
                <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {missingCount && (
                  <span className="pp-lock-title">You&apos;re missing {missingCount} photos</span>
                )}
                <span className="pp-lock-sub">Unlock the full gallery &amp; floor plans — free</span>
                <span className="pp-lock-cta-btn">Unlock Now →</span>
              </div>
            </div>
          )}

          {/* ── Badge ── */}
          {p.label && <span className={`prop-badge ${p.status || ''}`}>{p.label}</span>}

          {/* ── Heart ── */}
          <button
            className={`prop-heart${fav ? ' active' : ''}`}
            onClick={handleToggleFav}
            aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
          >
            <HeartIcon filled={fav} />
          </button>

          {/* ── Arrows ── */}
          {totalSlides > 1 && slide > 0 && (
            <button className="prop-carousel-arrow prop-carousel-arrow-l" onClick={prev} aria-label="Previous photo">
              <ChevronLeft />
            </button>
          )}
          {totalSlides > 1 && slide < totalSlides - 1 && (
            <button className="prop-carousel-arrow prop-carousel-arrow-r" onClick={next} aria-label="Next photo">
              <ChevronRight />
            </button>
          )}

          {/* ── Dots ── */}
          {totalSlides > 1 && (
            <div className="prop-carousel-dots">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <span
                  key={i}
                  className={`prop-carousel-dot${i === slide ? ' active' : ''}${hasLock && i === totalSlides - 1 ? ' lock-dot' : ''}`}
                  onClick={e => goTo(i, e)}
                />
              ))}
            </div>
          )}

        </div>{/* end prop-img-wrap */}

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

      {unlockOpen && (
        <UnlockModal
          propertyTitle={p.title}
          driveUrl={p.driveUrl}
          onClose={() => setUnlockOpen(false)}
        />
      )}
    </>
  );
}
