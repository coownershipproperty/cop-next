import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import UnlockModal from '@/components/UnlockModal';
import { useCurrency, convertPrice, CURRENCY_SYMBOLS } from '@/hooks/useCurrency';
import { localeFromPath, propertyHref } from '@/lib/i18n';

// Locale-aware UI strings. Property titles themselves come from translated DB
// columns (title_es / title_fr) — see localizedTitle() helper in the page that
// uses this card. The strings here are just chrome (Bed/Beds counter, "View
// Property" CTA, gallery-lock messaging).
const COPY = {
  en: {
    bed_singular: 'Bed', bed_plural: 'Beds',
    view_property: 'View Property →',
    fav_add: 'Add to favourites', fav_remove: 'Remove from favourites',
    prev_photo: 'Previous photo', next_photo: 'Next photo',
    missing_photos: (n) => `You're missing ${n} photos`,
    unlock_sub: 'Unlock the full gallery & floor plans — free',
    unlock_now: 'Unlock Now →',
  },
  es: {
    bed_singular: 'Dormitorio', bed_plural: 'Dormitorios',
    view_property: 'Ver propiedad →',
    fav_add: 'Añadir a favoritos', fav_remove: 'Quitar de favoritos',
    prev_photo: 'Foto anterior', next_photo: 'Siguiente foto',
    missing_photos: (n) => `Te faltan ${n} fotos`,
    unlock_sub: 'Desbloquea la galería completa y los planos — gratis',
    unlock_now: 'Desbloquear ahora →',
  },
  fr: {
    bed_singular: 'Chambre', bed_plural: 'Chambres',
    view_property: 'Voir la propriété →',
    fav_add: 'Ajouter aux favoris', fav_remove: 'Retirer des favoris',
    prev_photo: 'Photo précédente', next_photo: 'Photo suivante',
    missing_photos: (n) => `Il vous manque ${n} photos`,
    unlock_sub: 'Débloquez la galerie complète et les plans — gratuit',
    unlock_now: 'Débloquer maintenant →',
  },
};

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
  <svg viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      fill={filled ? '#C9A84C' : 'none'} stroke={filled ? '#C9A84C' : '#2C4A5E'} />
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

function formatApprox(amount, fmtLocale = 'en-GB') {
  return (Math.round(amount / 1_000) * 1_000).toLocaleString(fmtLocale);
}

// priority: true for the first 3 cards on a destination page — disables lazy loading
// so Google's LCP score sees real content immediately.
export default function PropertyCard({ property: p, priority = false }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;
  const localeNumberFmt = locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-GB';
  const title = p[`title_${locale}`] || p.title;

  // Locale-aware URL so click-through from /es/propiedades/ lands on
  // /es/propiedades/{slug}/ rather than the English /property/{slug}/.
  // Critical for SEO: Google needs distinct URLs per language.
  const href = propertyHref(p.slug, locale);
  const [fav, setFav] = useState(false);
  const [slide, setSlide] = useState(0);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const cx = useCurrency();

  useEffect(() => {
    setFav(isFav(p.slug));
    return onFavsChange((slugs) => setFav(slugs.includes(p.slug)));
  }, [p.slug]);

  useEffect(() => { setSlide(0); }, [p.slug]);

  const heroImg = p.img || null;
  const supabaseExtras = (p.images || [])
    .slice(1)
    .filter(url => url && !url.includes('lh3.googleusercontent.com'))
    .slice(0, 2);
  const imgSlides = [heroImg, ...supabaseExtras].filter(Boolean);

  const hasLock = !!p.driveUrl;
  const totalSlides = imgSlides.length + (hasLock ? 1 : 0);
  const isLockSlide = hasLock && slide >= imgSlides.length;

  const totalImgs = p.totalImages || imgSlides.length;
  const missingCount = totalImgs > imgSlides.length ? totalImgs - imgSlides.length : null;

  function goTo(idx, e) { if (e) e.stopPropagation(); setSlide(idx); }
  function prev(e) { e.stopPropagation(); setSlide(i => Math.max(0, i - 1)); }
  function next(e) { e.stopPropagation(); setSlide(i => Math.min(totalSlides - 1, i + 1)); }
  function handleToggleFav(e) { e.stopPropagation(); setFav(toggleFav(p.slug)); }
  function handleLockClick(e) { e.stopPropagation(); setUnlockOpen(true); }
  function handleCardClick() { if (!isLockSlide) window.location.href = href; }

  const fromCurrency = p.currency || 'EUR';
  const priceFormatted = p.price
    ? `${CURRENCY_SYM[fromCurrency] || fromCurrency}${p.price.toLocaleString(localeNumberFmt)}`
    : null;
  const convertedAmount = p.price ? convertPrice(p.price, fromCurrency, cx) : null;
  const convertedSym = cx ? (CURRENCY_SYMBOLS[cx.currency] || cx.currency) : null;
  const priceDisplay = convertedAmount != null
    ? `~${convertedSym}${formatApprox(convertedAmount, localeNumberFmt)}`
    : priceFormatted;

  return (
    <>
      <article
        className="prop-card"
        onClick={handleCardClick}
        role="link"
        aria-label={title}
        style={isLockSlide ? { cursor: 'default' } : {}}
      >
        <div className="prop-img-wrap">
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
                alt={`${title} — photo ${i + 1}`}
                fill
                quality={90}
                className="prop-img"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                // priority=true on slide 0 of the first 3 cards disables lazy loading,
                // which improves Largest Contentful Paint (Core Web Vitals).
                priority={priority && i === 0}
              />
            </div>
          ))}

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
                {missingCount && <span className="pp-lock-title">{t.missing_photos(missingCount)}</span>}
                <span className="pp-lock-sub">{t.unlock_sub}</span>
                <span className="pp-lock-cta-btn">{t.unlock_now}</span>
              </div>
            </div>
          )}

          {p.label && <span className={`prop-badge ${p.status || ''}`}>{p.label}</span>}

          <button
            className={`prop-heart${fav ? ' active' : ''}`}
            onClick={handleToggleFav}
            aria-label={fav ? t.fav_remove : t.fav_add}
          >
            <HeartIcon filled={fav} />
          </button>

          {totalSlides > 1 && slide > 0 && (
            <button className="prop-carousel-arrow prop-carousel-arrow-l" onClick={prev} aria-label={t.prev_photo}>
              <ChevronLeft />
            </button>
          )}
          {totalSlides > 1 && slide < totalSlides - 1 && (
            <button className="prop-carousel-arrow prop-carousel-arrow-r" onClick={next} aria-label={t.next_photo}>
              <ChevronRight />
            </button>
          )}
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
        </div>

        <div className="prop-body">
          <h3 className="prop-title">{title}</h3>
          {(p.beds > 0 || p.size > 0) && (
            <div className="prop-stats">
              {p.beds > 0 && <span className="prop-stat"><BedIcon />{p.beds} {p.beds > 1 ? t.bed_plural : t.bed_singular}</span>}
              {p.beds > 0 && p.size > 0 && <span className="prop-stat-sep" />}
              {p.size > 0 && <span className="prop-stat"><SizeIcon />{p.size} m²</span>}
            </div>
          )}
          {priceDisplay && (
            <p className="prop-price" title={convertedAmount != null ? `Listed at ${priceFormatted}` : undefined}>
              {priceDisplay}
            </p>
          )}
          <a href={href} className="prop-view-btn" onClick={e => e.stopPropagation()}>{t.view_property}</a>
        </div>
      </article>

      {unlockOpen && (
        <UnlockModal
          propertyTitle={title}
          driveUrl={p.driveUrl}
          propertyCountry={p.country || null}
          onClose={() => setUnlockOpen(false)}
        />
      )}
    </>
  );
}
