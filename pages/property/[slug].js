import Head from 'next/head';
import NextImage from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { trackConversion, fbqEvent } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import { useCurrency, convertPrice, CURRENCY_SYMBOLS } from '@/hooks/useCurrency';
import ExpertForm from '@/components/ExpertForm';
import UnlockModal from '@/components/UnlockModal';
import { localeFromPath } from '@/lib/i18n';

// ── Locale-specific UI copy ────────────────────────────────────────────────
const COPY = {
  en: {
    cobadge: '1/8 Co-Ownership',
    bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', total_size: 'Total size', per_year: 'Per year', share_size: 'Share size',
    days_label: '~45 days',
    about_heading: 'About This Property',
    desc_empty: 'Full details coming soon. Use the enquiry form to get in touch.',
    show_less: 'Show less', read_more: 'Read more',
    amenities_heading: 'Features & Amenities',
    all_amenities: (n) => `All ${n} amenities`,
    location_heading: 'Location',
    similar_heading: (country) => `Similar Properties in ${country}`,
    missing_photos: (n) => `You're missing ${n} photos`,
    unlock_sub: 'Unlock the full gallery & floor plans — free',
    unlock_now: 'Unlock Now →',
    form_eye: 'Get in touch',
    form_title: 'Enquire About This Property',
    form_sub: 'Our team typically responds within a few hours. No obligation.',
    eq_name: 'Your name', eq_name_ph: 'Full name',
    eq_email: 'Email', eq_email_ph: 'your@email.com',
    eq_phone: 'Phone', eq_phone_ph: '+1 or +44…',
    eq_msg: 'Message', eq_msg_ph: 'Any questions about this property…',
    eq_send: 'Send Enquiry →', eq_sending: 'Sending…',
    eq_thanks: (n) => `Thanks ${n}! We'll be in touch shortly.`,
    eq_err: 'Something went wrong. Please try again.',
  },
  es: {
    cobadge: '1/8 de copropiedad',
    bedrooms: 'Dormitorios', bathrooms: 'Baños', total_size: 'Superficie total', per_year: 'Al año', share_size: 'Tamaño de fracción',
    days_label: '~45 días',
    about_heading: 'Sobre esta propiedad',
    desc_empty: 'Próximamente más detalles. Usa el formulario de contacto para obtener información.',
    show_less: 'Ver menos', read_more: 'Leer más',
    amenities_heading: 'Características y servicios',
    all_amenities: (n) => `Ver las ${n} características`,
    location_heading: 'Ubicación',
    similar_heading: (country) => `Propiedades similares en ${country}`,
    missing_photos: (n) => `Te faltan ${n} fotos`,
    unlock_sub: 'Desbloquea la galería completa y los planos — gratis',
    unlock_now: 'Desbloquear ahora →',
    form_eye: 'Contáctanos',
    form_title: 'Consulta sobre esta propiedad',
    form_sub: 'Nuestro equipo suele responder en pocas horas. Sin compromiso.',
    eq_name: 'Tu nombre', eq_name_ph: 'Nombre completo',
    eq_email: 'Correo electrónico', eq_email_ph: 'tu@email.com',
    eq_phone: 'Teléfono', eq_phone_ph: '+34 o +1…',
    eq_msg: 'Mensaje', eq_msg_ph: 'Preguntas sobre esta propiedad…',
    eq_send: 'Enviar consulta →', eq_sending: 'Enviando…',
    eq_thanks: (n) => `¡Gracias ${n}! Te contactaremos en breve.`,
    eq_err: 'Algo salió mal. Inténtalo de nuevo.',
  },
  fr: {
    cobadge: '1/8 en copropriété',
    bedrooms: 'Chambres', bathrooms: 'Salles de bain', total_size: 'Surface totale', per_year: 'Par an', share_size: 'Taille de la quote-part',
    days_label: '~45 jours',
    about_heading: 'À propos de cette propriété',
    desc_empty: 'Plus de détails bientôt. Utilisez le formulaire pour nous contacter.',
    show_less: 'Voir moins', read_more: 'Lire la suite',
    amenities_heading: 'Caractéristiques et équipements',
    all_amenities: (n) => `Voir les ${n} équipements`,
    location_heading: 'Localisation',
    similar_heading: (country) => `Propriétés similaires en ${country}`,
    missing_photos: (n) => `Il vous manque ${n} photos`,
    unlock_sub: "Débloquez la galerie complète et les plans — gratuit",
    unlock_now: 'Débloquer maintenant →',
    form_eye: 'Nous contacter',
    form_title: 'Demande pour cette propriété',
    form_sub: 'Notre équipe répond généralement sous quelques heures. Sans engagement.',
    eq_name: 'Votre nom', eq_name_ph: 'Nom complet',
    eq_email: 'Email', eq_email_ph: 'vous@email.com',
    eq_phone: 'Téléphone', eq_phone_ph: '+33 ou +1…',
    eq_msg: 'Message', eq_msg_ph: 'Questions sur cette propriété…',
    eq_send: 'Envoyer la demande →', eq_sending: 'Envoi en cours…',
    eq_thanks: (n) => `Merci ${n} ! Nous vous contacterons sous peu.`,
    eq_err: "Une erreur s'est produite. Veuillez réessayer.",
  },
};

// Detect locale from cookie (set by middleware) on mount. The page is statically
// pre-rendered in English; the locale-aware text swap happens after hydration
// to keep static caching intact for SEO crawlers.
function useLocaleFromCookie(initialFromRouter) {
  const [locale, setLocale] = useState(initialFromRouter);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const m = document.cookie.match(/(?:^|; )cop_locale=(en|es|fr)/);
    if (m && m[1] !== locale) setLocale(m[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return locale;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getStaticPaths() {
  const supabase = getSupabase();
  const { data } = await supabase.from('properties').select('slug');
  return {
    paths: (data || []).map(p => ({ params: { slug: p.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const supabase = getSupabase();
  // Selects '*' to include the new title_es/title_fr/description_es/description_fr/
  // amenities_es/amenities_fr columns alongside the English originals. Falls back
  // gracefully when a row hasn't been translated yet.
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!property) return { notFound: true };

  const prop = {
    ...property,
    driveUrl: property.drive_url,
    dateAdded: property.date_added,
  };

  const { data: similarRaw } = await supabase
    .from('properties')
    .select('slug, title, title_es, title_fr, img, price, currency, country, region, city, beds, size, status')
    .eq('country', property.country)
    .neq('slug', property.slug)
    .limit(3);

  const similar = (similarRaw || []).map(p => ({ ...p, driveUrl: null }));

  return { props: { property: prop, similar }, revalidate: 3600 };
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency, locale = 'en-GB') { return `${SYM[currency] || currency}${price.toLocaleString(locale)}`; }
function fmtApprox(amount, locale = 'en-GB') {
  return (Math.round(amount / 1_000) * 1_000).toLocaleString(locale);
}
const PARTNER_LABEL = { pacaso: 'Pacaso', andhamlet: '&Hamlet', vivla: 'Vivla', myne: 'Myne' };

// Given a property record and a target locale, return the best title /
// description / amenities — translated where available, English fallback.
function localizedFields(p, locale) {
  return {
    title:       p[`title_${locale}`]       || p.title       || '',
    description: p[`description_${locale}`] || p.description || '',
    amenities:   (Array.isArray(p[`amenities_${locale}`]) && p[`amenities_${locale}`].length)
                   ? p[`amenities_${locale}`]
                   : (p.amenities || []),
  };
}

function Img({ src, alt, loading = 'lazy', priority = false, sizes = '100vw' }) {
  return (
    <NextImage
      src={src || '/images/placeholder.jpg'}
      alt={alt || ''}
      fill
      quality={90}
      loading={priority ? 'eager' : loading}
      priority={priority}
      sizes={sizes}
      style={{ objectFit: 'cover' }}
    />
  );
}

/* ── Enquiry form (locale-aware) ── */
function EnquiryForm({ propertyTitle, propertyUrl, locale }) {
  const t = COPY[locale] || COPY.en;
  const saved = getSavedUser();
  const [f, setF] = useState({ name: saved.name, email: saved.email, phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/enquiry/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, property: propertyTitle, url: propertyUrl, locale }) });
      if (r.ok) {
        saveUser({ name: f.name, email: f.email });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'property_enquiry',
          property_title: propertyTitle,
          locale,
        });
        track('enquiry_submitted', {
          source: 'property_page',
          property: propertyTitle,
          url: propertyUrl,
          locale,
        });
      }
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  if (status === 'done') return (
    <div className="eq-done"><span className="eq-tick">✓</span><p>{t.eq_thanks(f.name)}</p></div>
  );

  const fields = [
    ['name',  t.eq_name,  'text',  t.eq_name_ph,  true],
    ['email', t.eq_email, 'email', t.eq_email_ph, true],
    ['phone', t.eq_phone, 'tel',   t.eq_phone_ph, true],
  ];

  return (
    <form onSubmit={submit} className="eq-form">
      {fields.map(([k, label, type, ph, req]) => (
        <div key={k} className="eq-field">
          <label>{label}{req ? ' *' : ''}</label>
          <input type={type} placeholder={ph} value={f[k]} onChange={set(k)} required={req} />
        </div>
      ))}
      <div className="eq-field">
        <label>{t.eq_msg}</label>
        <textarea rows={4} placeholder={t.eq_msg_ph} value={f.message} onChange={set('message')} />
      </div>
      <button type="submit" className="eq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? t.eq_sending : t.eq_send}
      </button>
      {status === 'error' && <p className="eq-err">{t.eq_err}</p>}
    </form>
  );
}

/* ── Main page ── */
export default function PropertyPage({ property: p, similar }) {
  const router = useRouter();
  // Initial guess: locale from URL path (handles direct /es/property/ landings
  // for future routing). Cookie hook below overrides for the common case
  // where visitor arrived from /es/ or /fr/ to /property/[slug].
  const locale = useLocaleFromCookie(localeFromPath(router.asPath || router.pathname));
  const t = COPY[locale] || COPY.en;
  const localeNumberFmt = locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-GB';

  const local = localizedFields(p, locale);

  const [showUnlock, setShowUnlock] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const cx = useCurrency();
  const [amenExpanded, setAmenExpanded] = useState(false);
  const heroImg = p.img || p.images?.[0] || '/images/placeholder.jpg';
  const galleryTotal = Array.isArray(p.photos) && p.photos.length > 0
    ? p.photos.length + (Array.isArray(p.extra_photos) ? p.extra_photos.length : 0)
    : (p.total_images || p.images.length);
  const missingCount = galleryTotal;
  const descParas = local.description ? local.description.split('\n').filter(Boolean) : [];
  const descVisible = descExpanded ? descParas : descParas.slice(0, 2);
  const descHasMore = descParas.length > 2;
  const partnerLabel = PARTNER_LABEL[p.partner] || p.partner;
  const touchStartX = useRef(null);

  useEffect(() => {
    setSaved(isFav(p.slug));
    return onFavsChange((slugs) => setSaved(slugs.includes(p.slug)));
  }, [p.slug]);

  useEffect(() => {
    fbqEvent('ViewContent', {
      content_ids:  [p.slug],
      content_type: 'product',
      content_name: local.title,
      ...(p.price    && { value: p.price }),
      ...(p.currency && { currency: p.currency }),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.slug]);

  function toggleSave() {
    const nowSaved = toggleFav(p.slug);
    setSaved(nowSaved);
    track(nowSaved ? 'favourite_added' : 'favourite_removed', {
      property: local.title,
      slug: p.slug,
    });
  }

  const mobileSlides = [
    ...(p.images.slice(0, 3).map((img, i) => ({ type: 'img', src: img, idx: i }))),
    { type: 'lock' },
  ];

  // ── SEO meta (always English on initial render — see useLocaleFromCookie note) ──
  const propStyle   = (p.property_style || p.property_type || 'property').toLowerCase();
  const propLocation = [p.city || p.region, p.country].filter(Boolean).join(', ');
  const metaDesc = p.price
    ? `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership at ${fmt(p.price, p.currency)}. Real deeded ownership, own only what you use.`
    : `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership. Real deeded ownership, own only what you use.`;
  const canonicalUrl = `https://co-ownership-property.com/property/${p.slug}/`;
  const ogImage = p.img && p.img.startsWith('http') ? p.img : `https://co-ownership-property.com${p.img}`;

  return (
    <>
      <Head>
        <title>{local.title} | Co-Ownership Property</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${local.title} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${local.title} | Co-Ownership Property`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          "name": p.title,
          "description": metaDesc,
          "url": canonicalUrl,
          "image": (p.images && p.images.length > 0) ? p.images : [ogImage],
          "numberOfRooms": p.beds || undefined,
          "floorSize": p.size > 0 ? { "@type": "QuantitativeValue", "value": p.size, "unitCode": "MTK" } : undefined,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": p.city || p.region || undefined,
            "addressRegion": p.region || undefined,
            "addressCountry": p.country || undefined,
          },
          "offers": p.price ? {
            "@type": "Offer",
            "price": p.price,
            "priceCurrency": p.currency || "EUR",
          } : undefined,
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://co-ownership-property.com/" },
            { "@type": "ListItem", "position": 2, "name": "Our Homes", "item": "https://co-ownership-property.com/our-homes/" },
            { "@type": "ListItem", "position": 3, "name": p.title, "item": canonicalUrl },
          ]
        }) }} />
      </Head>

      <Header />

      {/* ── Mobile carousel ── */}
      <div
        className="pp-mob-carousel"
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 40) setMobileSlide(s => Math.min(s + 1, mobileSlides.length - 1));
          else if (diff < -40) setMobileSlide(s => Math.max(s - 1, 0));
          touchStartX.current = null;
        }}
      >
        <button className={`pp-heart-btn${saved ? ' saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from favourites' : 'Save property'}>
          {saved
            ? <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          }
        </button>
        <div className="pp-mob-track" style={{ transform: `translateX(${-mobileSlide * 100}%)` }}>
          {mobileSlides.map((slide, i) =>
            slide.type === 'img' ? (
              <div key={i} className="pp-mob-slide" onClick={() => setLightbox(slide.idx)}>
                <Img src={slide.src} alt={`${local.title} ${i + 1}`} priority={i === 0} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ) : (
              <div key={i} className="pp-mob-slide pp-mob-lock" onClick={() => p.driveUrl && setShowUnlock(true)}>
                <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span className="pp-mob-lock-title">{t.missing_photos(missingCount)}</span>
                <span className="pp-mob-lock-sub">{t.unlock_sub}</span>
                <span className="pp-mob-lock-btn">{t.unlock_now}</span>
              </div>
            )
          )}
        </div>
        {mobileSlide > 0 && (
          <button className="pp-mob-arrow pp-mob-prev" onClick={() => setMobileSlide(s => s - 1)}>&#8249;</button>
        )}
        {mobileSlide < mobileSlides.length - 1 && (
          <button className="pp-mob-arrow pp-mob-next" onClick={() => setMobileSlide(s => s + 1)}>&#8250;</button>
        )}
        <div className="pp-mob-dots">
          {mobileSlides.map((_, i) => (
            <button key={i} className={`pp-mob-dot${i === mobileSlide ? ' active' : ''}`} onClick={() => setMobileSlide(i)} />
          ))}
        </div>
      </div>

      {/* ── Desktop gallery ── */}
      <div className="pp-gallery">
        <button className={`pp-heart-btn${saved ? ' saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from favourites' : 'Save property'}>
          {saved
            ? <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          }
        </button>
        <div className="pp-gallery-hero" onClick={() => setLightbox(0)}>
          <Img src={heroImg} alt={local.title} priority sizes="(max-width: 960px) 67vw, 75vw" />
        </div>
        <div className="pp-gallery-thumb" onClick={() => p.images[1] && setLightbox(1)}>
          {p.images[1] ? <Img src={p.images[1]} alt={`${local.title} 2`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        <div className="pp-gallery-thumb" onClick={() => p.images[2] && setLightbox(2)}>
          {p.images[2] ? <Img src={p.images[2]} alt={`${local.title} 3`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        <div className="pp-gallery-lock" onClick={() => p.driveUrl && setShowUnlock(true)}>
          <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
          <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="pp-lock-title">{t.missing_photos(missingCount)}</span>
          <span className="pp-lock-sub">{t.unlock_sub}</span>
          <span className="pp-lock-cta-btn">{t.unlock_now}</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pp-content">
        <div className="pp-left">

          <div className="pp-price-row">
            <span className="pp-price" title={p.price && cx && convertPrice(p.price, p.currency || 'EUR', cx) != null ? `Listed at ${fmt(p.price, p.currency)}` : undefined}>
              {(() => {
                const fromCcy = p.currency || 'EUR';
                const converted = p.price ? convertPrice(p.price, fromCcy, cx) : null;
                if (converted != null) {
                  const sym = CURRENCY_SYMBOLS[cx.currency] || cx.currency;
                  return `~${sym}${fmtApprox(converted, localeNumberFmt)}`;
                }
                return p.price ? fmt(p.price, fromCcy, localeNumberFmt) : null;
              })()}
            </span>
            <span className="pp-badge">{t.cobadge}</span>
          </div>

          <nav className="pp-crumb">
            {[p.city, p.region, p.country].filter(Boolean).map((c, i, arr) => (
              <span key={i}>{c}{i < arr.length - 1 && <span className="pp-crumb-sep"> · </span>}</span>
            ))}
          </nav>

          <h1 className="pp-title">{local.title}</h1>

          <div className="pp-stats">
            {p.beds > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.beds}</span><span className="pp-stat-lbl">{t.bedrooms}</span></div>}
            {p.baths > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.baths}</span><span className="pp-stat-lbl">{t.bathrooms}</span></div>}
            {p.size > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.size} m²</span><span className="pp-stat-lbl">{t.total_size}</span></div>}
            <div className="pp-stat"><span className="pp-stat-val">{t.days_label}</span><span className="pp-stat-lbl">{t.per_year}</span></div>
            <div className="pp-stat"><span className="pp-stat-val">1/8</span><span className="pp-stat-lbl">{t.share_size}</span></div>
          </div>

          <div className="pp-desc">
            <h2 className="pp-heading">{t.about_heading}</h2>
            {local.description ? (
              <>
                {descVisible.map((para, i) => {
                  const parts = para.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  );
                })}
                {descHasMore && (
                  <button className="pp-seemore" onClick={() => setDescExpanded(v => !v)}>
                    {descExpanded ? t.show_less : t.read_more}
                  </button>
                )}
              </>
            ) : <p className="pp-desc-empty">{t.desc_empty}</p>}
          </div>

          {local.amenities.length > 0 && (
            <div className={`pp-amenities${amenExpanded ? ' expanded' : ''}`}>
              <h2 className="pp-heading">{t.amenities_heading}</h2>
              <ul className="pp-amenity-list">
                {local.amenities.map((a, i) => (
                  <li key={i} className={`pp-amenity-item${i >= 6 ? ' pp-amenity-extra' : ''}`}>
                    <span className="pp-amenity-dot"></span>{a}
                  </li>
                ))}
              </ul>
              {local.amenities.length > 6 && (
                <button className="pp-seemore" onClick={() => setAmenExpanded(v => !v)}>
                  {amenExpanded ? t.show_less : t.all_amenities(local.amenities.length)}
                </button>
              )}
            </div>
          )}

          {(p.lat || p.city) && (
            <div className="pp-location-section">
              <h2 className="pp-heading">{t.location_heading}</h2>
              <p className="pp-location-text">{[p.city, p.region, p.country].filter(Boolean).join(', ')}</p>
              {p.lat && p.lng && (
                <div className="pp-map-wrap">
                  <iframe
                    title="Property location"
                    src={`https://maps.google.com/maps?q=${p.lat},${p.lng}&z=13&output=embed`}
                    width="100%" height="280" style={{border:0}} loading="lazy" allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {similar.length > 0 && (
            <div className="pp-similar">
              <h2 className="pp-heading">{t.similar_heading(p.country)}</h2>
              <div className="pp-similar-grid">
                {similar.map(s => {
                  const sTitle = s[`title_${locale}`] || s.title;
                  return (
                    <a key={s.slug} href={`/property/${s.slug}`} className="pp-sim-card">
                      <div className="pp-sim-img"><Img src={s.img} alt={sTitle} sizes="(max-width: 768px) 100vw, 33vw" /></div>
                      <div className="pp-sim-body">
                        <h4>{sTitle}</h4>
                        <p>{fmt(s.price, s.currency, localeNumberFmt)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>{/* /pp-left */}

        <div className="pp-right">
          <div className="pp-form-card">
            <p className="pp-form-eye">{t.form_eye}</p>
            <h3 className="pp-form-title">{t.form_title}</h3>
            <p className="pp-form-sub">{t.form_sub}</p>
            <EnquiryForm propertyTitle={local.title} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} locale={locale} />
          </div>
        </div>

      </div>{/* /pp-content */}

      {lightbox !== null && (() => {
        const lbImages = p.images.slice(0, 3);
        const total = lbImages.length + 1;
        const isLockSlide = lightbox >= lbImages.length;
        return (
          <div className="pp-lb" onClick={() => setLightbox(null)}>
            <button className="pp-lb-close" onClick={() => setLightbox(null)}>×</button>
            <button className="pp-lb-prev" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + total) % total); }}>‹</button>
            {isLockSlide ? (
              <div className="pp-lb-lock" onClick={e => { e.stopPropagation(); setLightbox(null); setShowUnlock(true); }}>
                <div className="pp-lb-lock-blur" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,marginBottom:12,color:'#fff'}}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span className="pp-lb-lock-title">{t.missing_photos(missingCount)}</span>
                <span className="pp-lb-lock-sub">{t.unlock_sub}</span>
                <span className="pp-lb-lock-btn">{t.unlock_now}</span>
              </div>
            ) : (
              <img src={lbImages[lightbox]} alt={local.title} onClick={e => e.stopPropagation()} />
            )}
            <button className="pp-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % total); }}>›</button>
            <span className="pp-lb-count">{lightbox + 1} / {total}</span>
          </div>
        );
      })()}

      {showUnlock && <UnlockModal propertyTitle={local.title} driveUrl={p.driveUrl} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} onClose={() => setShowUnlock(false)} />}

      <Newsletter />
      <Footer />
    </>
  );
}
