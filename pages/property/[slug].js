import Head from 'next/head';
import NextImage from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { trackConversion } from '@/lib/gtag';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import UnlockModal from '@/components/UnlockModal';

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
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!property) return { notFound: true };

  // Map DB column names back to what the page template expects
  const prop = {
    ...property,
    driveUrl: property.drive_url,
    dateAdded: property.date_added,
  };

  const { data: similarRaw } = await supabase
    .from('properties')
    .select('slug, title, img, price, currency, country, region, city, beds, size, status')
    .eq('country', property.country)
    .neq('slug', property.slug)
    .limit(3);

  const similar = (similarRaw || []).map(p => ({ ...p, driveUrl: null }));

  return { props: { property: prop, similar }, revalidate: 3600 };
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency) { return `${SYM[currency] || currency}${price.toLocaleString('en-GB')}`; }
const PARTNER_LABEL = { pacaso: 'Pacaso', andhamlet: '&Hamlet', vivla: 'Vivla', myne: 'Myne' };

function Img({ src, alt, loading = 'lazy', priority = false, sizes = '100vw' }) {
  return (
    <NextImage
      src={src || '/images/placeholder.jpg'}
      alt={alt || ''}
      fill
      loading={priority ? 'eager' : loading}
      priority={priority}
      sizes={sizes}
      style={{ objectFit: 'cover' }}
    />
  );
}

/* UnlockModal is now in components/UnlockModal.js */

/* ── Enquiry form ── */
function EnquiryForm({ propertyTitle, propertyUrl }) {
  const saved = getSavedUser();
  const [f, setF] = useState({ name: saved.name, email: saved.email, phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/enquiry/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, property: propertyTitle, url: propertyUrl }) });
      if (r.ok) {
        saveUser({ name: f.name, email: f.email });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'property_enquiry',
          property_title: propertyTitle,
        });
      }
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  if (status === 'done') return (
    <div className="eq-done"><span className="eq-tick">✓</span><p>Thanks {f.name}! We&apos;ll be in touch shortly.</p></div>
  );

  return (
    <form onSubmit={submit} className="eq-form">
      {[['name','Your name','text','Full name',true],['email','Email','email','your@email.com',true],
        ['phone','Phone','tel','+1 or +44…',false]].map(([k,label,type,ph,req]) => (
        <div key={k} className="eq-field">
          <label>{label}{req ? ' *' : ''}</label>
          <input type={type} placeholder={ph} value={f[k]} onChange={set(k)} required={req} />
        </div>
      ))}
      <div className="eq-field">
        <label>Message</label>
        <textarea rows={4} placeholder="Any questions about this property…" value={f.message} onChange={set('message')} />
      </div>
      <button type="submit" className="eq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry →'}
      </button>
      {status === 'error' && <p className="eq-err">Something went wrong. Please try again.</p>}
    </form>
  );
}

/* ── Main page ── */
export default function PropertyPage({ property: p, similar }) {
  const [showUnlock, setShowUnlock] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [amenExpanded, setAmenExpanded] = useState(false);
  const heroImg = p.images[0] || '/images/placeholder.jpg';
  const totalImgs = p.total_images || p.images.length;
  const missingCount = totalImgs > 3 ? totalImgs - 3 : '';
  const descParas = p.description ? p.description.split('\n').filter(Boolean) : [];
  const descVisible = descExpanded ? descParas : descParas.slice(0, 2);
  const descHasMore = descParas.length > 2;
  const partnerLabel = PARTNER_LABEL[p.partner] || p.partner;
  const touchStartX = useRef(null);

  // Hydrate saved state and keep it in sync with any other component
  useEffect(() => {
    setSaved(isFav(p.slug));
    return onFavsChange((slugs) => setSaved(slugs.includes(p.slug)));
  }, [p.slug]);

  function toggleSave() {
    setSaved(toggleFav(p.slug));
  }
  // Mobile carousel: up to 3 photos + lock panel as last slide
  const mobileSlides = [
    ...(p.images.slice(0, 3).map((img, i) => ({ type: 'img', src: img, idx: i }))),
    { type: 'lock' },
  ];

  // ── SEO helpers ──────────────────────────────────────────────────────────────
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
        <title>{p.title} | Co-Ownership Property</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${p.title} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${p.title} | Co-Ownership Property`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        {/* RealEstateListing schema */}
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
        {/* BreadcrumbList schema */}
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

      {/* ── Mobile carousel (hidden on desktop) ── */}
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
                <Img src={slide.src} alt={`${p.title} ${i + 1}`} priority={i === 0} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ) : (
              <div key={i} className="pp-mob-slide pp-mob-lock" onClick={() => p.driveUrl && setShowUnlock(true)}>
                <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span className="pp-mob-lock-title">You&apos;re missing {missingCount} photos</span>
                <span className="pp-mob-lock-sub">Unlock the full gallery &amp; floor plans — free</span>
                <span className="pp-mob-lock-btn">Unlock Now →</span>
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

      {/* ── Full-width gallery: hero (left, full height) + 2 thumbs (top-right) + lock panel (bottom-right) ── */}
      <div className="pp-gallery">
        <button className={`pp-heart-btn${saved ? ' saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from favourites' : 'Save property'}>
          {saved
            ? <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          }
        </button>
        {/* Hero — spans both rows */}
        <div className="pp-gallery-hero" onClick={() => setLightbox(0)}>
          <Img src={heroImg} alt={p.title} priority sizes="(max-width: 960px) 67vw, 75vw" />
        </div>
        {/* Top-right: thumb 1 */}
        <div className="pp-gallery-thumb" onClick={() => p.images[1] && setLightbox(1)}>
          {p.images[1] ? <Img src={p.images[1]} alt={`${p.title} 2`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        {/* Top-right: thumb 2 */}
        <div className="pp-gallery-thumb" onClick={() => p.images[2] && setLightbox(2)}>
          {p.images[2] ? <Img src={p.images[2]} alt={`${p.title} 3`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        {/* Bottom-right: lock panel, spans both right columns */}
        <div className="pp-gallery-lock" onClick={() => p.driveUrl && setShowUnlock(true)}>
          <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
          <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="pp-lock-title">You&apos;re missing {missingCount} photos</span>
          <span className="pp-lock-sub">Unlock the full gallery &amp; floor plans — free</span>
          <span className="pp-lock-cta-btn">Unlock Now →</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pp-content">
        <div className="pp-left">

          {/* Price */}
          <div className="pp-price-row">
            <span className="pp-price">{fmt(p.price, p.currency)}</span>
            <span className="pp-badge">1/8 Co-Ownership</span>
          </div>

          {/* Breadcrumb */}
          <nav className="pp-crumb">
            {[p.city, p.region, p.country].filter(Boolean).map((c, i, arr) => (
              <span key={i}>{c}{i < arr.length - 1 && <span className="pp-crumb-sep"> · </span>}</span>
            ))}
          </nav>

          {/* Title */}
          <h1 className="pp-title">{p.title}</h1>

          {/* Stats */}
          <div className="pp-stats">
            {p.beds > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.beds}</span><span className="pp-stat-lbl">Bedrooms</span></div>}
            {p.baths > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.baths}</span><span className="pp-stat-lbl">Bathrooms</span></div>}
            {p.size > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.size} m²</span><span className="pp-stat-lbl">Total size</span></div>}
            <div className="pp-stat"><span className="pp-stat-val">~45 days</span><span className="pp-stat-lbl">Per year</span></div>
            <div className="pp-stat"><span className="pp-stat-val">1/8</span><span className="pp-stat-lbl">Share size</span></div>
          </div>

          {/* Description */}
          <div className="pp-desc">
            <h2 className="pp-heading">About This Property</h2>
            {p.description ? (
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
                    {descExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </>
            ) : <p className="pp-desc-empty">Full details coming soon. Use the enquiry form to get in touch.</p>}
          </div>

          {/* Amenities — 2-column bullet list */}
          {p.amenities.length > 0 && (
            <div className={`pp-amenities${amenExpanded ? ' expanded' : ''}`}>
              <h2 className="pp-heading">Features &amp; Amenities</h2>
              <ul className="pp-amenity-list">
                {p.amenities.map((a, i) => (
                  <li key={i} className={`pp-amenity-item${i >= 6 ? ' pp-amenity-extra' : ''}`}>
                    <span className="pp-amenity-dot"></span>{a}
                  </li>
                ))}
              </ul>
              {p.amenities.length > 6 && (
                <button className="pp-seemore" onClick={() => setAmenExpanded(v => !v)}>
                  {amenExpanded ? 'Show less' : `All ${p.amenities.length} amenities`}
                </button>
              )}
            </div>
          )}

          {/* Location */}
          {(p.lat || p.city) && (
            <div className="pp-location-section">
              <h2 className="pp-heading">Location</h2>
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


          {/* Similar */}
          {similar.length > 0 && (
            <div className="pp-similar">
              <h2 className="pp-heading">Similar Properties in {p.country}</h2>
              <div className="pp-similar-grid">
                {similar.map(s => (
                  <a key={s.slug} href={`/property/${s.slug}`} className="pp-sim-card">
                    <div className="pp-sim-img"><Img src={s.img} alt={s.title} sizes="(max-width: 768px) 100vw, 33vw" /></div>
                    <div className="pp-sim-body">
                      <h4>{s.title}</h4>
                      <p>{fmt(s.price, s.currency)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>{/* /pp-left */}

        {/* Right: enquiry form */}
        <div className="pp-right">
          <div className="pp-form-card">
            <p className="pp-form-eye">Get in touch</p>
            <h3 className="pp-form-title">Enquire About This Property</h3>
            <p className="pp-form-sub">Our team typically responds within a few hours. No obligation.</p>
            <EnquiryForm propertyTitle={p.title} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} />
          </div>
        </div>

      </div>{/* /pp-content */}

      {/* Lightbox — 3 photos + lock slide as 4th */}
      {lightbox !== null && (() => {
        const lbImages = p.images.slice(0, 3);
        const total = lbImages.length + 1; // +1 for lock slide
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
                <span className="pp-lb-lock-title">You&apos;re missing {missingCount} photos</span>
                <span className="pp-lb-lock-sub">Unlock the full gallery &amp; floor plans — free</span>
                <span className="pp-lb-lock-btn">Unlock Now →</span>
              </div>
            ) : (
              <img src={lbImages[lightbox]} alt={p.title} onClick={e => e.stopPropagation()} />
            )}
            <button className="pp-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % total); }}>›</button>
            <span className="pp-lb-count">{lightbox + 1} / {total}</span>
          </div>
        );
      })()}

      {showUnlock && <UnlockModal propertyTitle={p.title} driveUrl={p.driveUrl} onClose={() => setShowUnlock(false)} />}

      <Newsletter />
      <Footer />
    </>
  );
}
