import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getServerSideProps({ params, query }) {
  const raw = params.token; // could be a base64 token OR a pretty slug
  let name = null, email = null, slug = null, title = null;

  // ── Try legacy base64url / base64 token ──────────────────────────────────
  let decoded = null;
  try {
    decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'));
    if (!decoded || !decoded.e || !decoded.s) decoded = null;
  } catch {}
  if (!decoded) {
    try {
      decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      if (!decoded || !decoded.e || !decoded.s) decoded = null;
    } catch {}
  }

  if (decoded) {
    // Legacy format — redirect to pretty URL so the browser shows a clean address
    ({ n: name, e: email, s: slug, t: title } = decoded);
    if (slug && email) {
      const userToken = Buffer.from(JSON.stringify({ n: name || '', e: email })).toString('base64url');
      const destination = `/gallery/${slug}?t=${userToken}`;
      return { redirect: { destination, permanent: false } };
    }
  } else {
    // New pretty-URL format — raw IS the property slug; user info in ?t= param
    slug = raw;
    if (query.t) {
      try {
        const u = JSON.parse(Buffer.from(query.t, 'base64url').toString('utf-8'));
        name  = u.n || null;
        email = u.e || null;
      } catch {}
    }
  }

  if (!slug) return { notFound: true };

  const supabase = getSupabase();
  const { data: prop } = await supabase
    .from('properties')
    .select('slug, title, img, photos, extra_photos, documents, country, city, region, price, currency, beds, size')
    .eq('slug', slug)
    .single();

  if (!prop) return { notFound: true };

  return {
    props: {
      name:     name  || null,
      email:    email || null,
      property: prop,
    },
  };
}

export default function GalleryPage({ name, email, property }) {
  const photos = Array.isArray(property.photos) && property.photos.length > 0
    ? property.photos
    : property.img ? [property.img] : [];

  const extras    = Array.isArray(property.extra_photos) ? property.extra_photos : [];
  const documents = Array.isArray(property.documents)    ? property.documents    : [];

  // Slides: hero photos → brochure extras → floor plans/docs → enquiry
  // type: 'photo' | 'extra' | 'document'
  const slides = [
    ...photos.map(url    => ({ url, type: 'photo' })),
    ...extras.map(url    => ({ url, type: 'extra' })),
    ...documents.map(url => ({ url, type: 'document' })),
  ];

  const totalSlides = slides.length + 1; // +1 for enquiry
  const enquiryIndex = slides.length;

  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);
  const [formState, setFormState] = useState({ name: name || '', email: email || '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const touchStartX = useRef(null);

  const firstName = name ? name.split(' ')[0] : null;
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ' }[property.currency] || '€';
  const priceStr = property.price ? `${sym}${Number(property.price).toLocaleString('en-GB')}` : null;
  const locationParts = [property.city, property.region, property.country].filter(Boolean);
  const location = [...new Set(locationParts)].join(', ');

  const goTo = useCallback((next, dir) => {
    if (animating || next === index) return;
    setDirection(dir);
    setPrev(index);
    setAnimating(true);
    setIndex(next);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 500);
  }, [animating, index]);

  const goNext = useCallback(() => {
    if (index < totalSlides - 1) goTo(index + 1, 1);
  }, [index, totalSlides, goTo]);

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1, -1);
  }, [index, goTo]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.phone.trim()) { setError('Please enter your phone number.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/gallery-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          message: formState.message,
          propertySlug: property.slug,
          propertyTitle: property.title,
          propertyUrl: `https://co-ownership-property.com/property/${property.slug}/`,
        }),
      });
      if (res.ok) setSubmitted(true);
      else setError('Something went wrong — please try again.');
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEnquiry    = index === enquiryIndex;
  const isPrevEnquiry = prev === enquiryIndex;
  const currentType  = !isEnquiry ? slides[index]?.type : null;
  const isDocument   = currentType === 'document';
  const isExtra      = currentType === 'extra';
  const isNonPhoto   = isEnquiry || isDocument || isExtra; // hide property info overlay

  return (
    <>
      <Head>
        <title>{property.title} — Private Gallery | Co-Ownership Property</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div
        style={s.stage}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ── SLIDES ── */}
        {slides.map((slide, i) => {
          const isCurrent  = index === i;
          const isPrevSlide = prev === i;
          const isDoc   = slide.type === 'document';
          const isExtr  = slide.type === 'extra';
          const isPhoto = slide.type === 'photo';
          return (
            <div
              key={slide.url}
              style={{
                ...s.slide,
                opacity: isCurrent ? 1 : isPrevSlide ? 1 : 0,
                zIndex: isCurrent ? 2 : isPrevSlide ? 1 : 0,
                transition: isCurrent ? 'opacity 0.55s ease' : 'none',
                background: '#0A1520',
                // flex-centre for contained slides so images never upscale
                ...(isDoc || isExtr ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.url}
                alt={`${property.title} — ${isDoc ? 'document' : isExtr ? 'extra' : 'photo'} ${i + 1}`}
                style={isDoc ? s.slideImgDoc : isExtr ? s.slideImgExtra : s.slideImg}
              />
              {/* gradient only on full-bleed photos */}
              {isPhoto && <div style={s.gradient} />}
              {/* extra photos label */}
              {isExtr && (
                <div style={s.extraLabel}>Additional Photos</div>
              )}
              {/* document label */}
              {isDoc && (
                <div style={s.docLabel}>Floor Plan &amp; Documents</div>
              )}
            </div>
          );
        })}

        {/* ── ENQUIRY SLIDE ── */}
        <div style={{
          ...s.slide,
          background: '#0F1D2A',
          opacity: isEnquiry ? 1 : isPrevEnquiry ? 1 : 0,
          zIndex: isEnquiry ? 2 : isPrevEnquiry ? 1 : 0,
          transition: isEnquiry ? 'opacity 0.55s ease' : 'none',
          overflowY: 'auto',
        }}>
          <div style={s.enquiryInner} className="gallery-enquiry-inner">
            {!submitted ? (
              <>
                <p style={s.eEyebrow} className="gallery-e-eyebrow">Private Enquiry</p>
                <h2 style={s.eTitle} className="e-title">
                  <em>I want to find<br />out more</em>
                </h2>
                <p style={s.eProperty} className="gallery-e-property">{property.title}</p>
                <div style={s.eRule} className="gallery-e-rule" />
                <p style={s.eSub} className="gallery-e-sub">
                  Add your number and one of our specialists will be in touch within a few hours.
                </p>

                <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
                  <div className="gallery-form-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.fieldLabel}>Name</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.fieldLabel}>Email</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={e => setFormState(p => ({ ...p, email: e.target.value }))}
                        style={s.input}
                      />
                    </div>
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>
                      Phone number <span style={{ color: '#C9A84C' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={e => setFormState(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+44 7700 900000"
                      style={s.input}
                      required
                    />
                  </div>
                  <div className="gallery-msg-wrap" style={s.fieldWrap}>
                    <label style={s.fieldLabel}>
                      Message <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>(optional)</span>
                    </label>
                    <textarea
                      value={formState.message}
                      onChange={e => setFormState(p => ({ ...p, message: e.target.value }))}
                      placeholder={`I'd love to find out more about ${property.title}…`}
                      style={{ ...s.input, height: 90, resize: 'none' }}
                      rows={3}
                    />
                  </div>
                  {error && <p style={s.errorMsg}>{error}</p>}
                  <button type="submit" style={s.submitBtn} disabled={submitting}>
                    {submitting ? 'Sending…' : "I'm Interested — Get In Touch"}
                  </button>
                  <p style={s.formNote} className="gallery-form-note">No obligation · We respond within a few hours</p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <div style={s.successIcon}>✓</div>
                <h2 style={s.successTitle}>We'll be in touch shortly</h2>
                <p style={s.successSub}>
                  Thank you{firstName ? `, ${firstName}` : ''}. One of our specialists will reach out about{' '}
                  <span style={{ color: '#C9A84C' }}>{property.title}</span> within a few hours.
                </p>
                <a href={`https://co-ownership-property.com/property/${property.slug}/`} style={s.successLink}>
                  View the full listing →
                </a>
              </div>
            )}
          </div>
          {/* subtle gold top line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
        </div>

        {/* ── NAV BAR ── */}
        <nav style={s.nav} className="gallery-nav">
          <a href="https://co-ownership-property.com" style={s.navLogo} className="gallery-nav-logo">
            Co-Ownership Property
          </a>
          <a href={`https://co-ownership-property.com/property/${property.slug}/`} style={s.navLink} className="gallery-nav-link">
            View Listing →
          </a>
        </nav>

        {/* ── PROPERTY INFO (bottom left, photo slides only) ── */}
        <div className="gallery-info" style={{
          ...s.info,
          opacity: isNonPhoto ? 0 : 1,
          transform: isNonPhoto ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          pointerEvents: isNonPhoto ? 'none' : 'auto',
        }}>
          {location && <p style={s.infoLocation} className="gallery-info-location">{location.toUpperCase()}</p>}
          <h1 style={s.infoTitle} className="info-title">{property.title}</h1>
          {priceStr && (
            <p style={s.infoPrice} className="gallery-info-price">
              {priceStr}
              <span style={s.infoPriceSub}> per share</span>
            </p>
          )}
        </div>

        {/* ── COUNTER (bottom right) ── */}
        <div style={s.counter}>
          {isEnquiry
            ? <span style={{ color: '#C9A84C', letterSpacing: '0.2em' }}>ENQUIRY</span>
            : <>{index + 1} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span> {totalSlides}</>
          }
        </div>

        {/* ── CLICK ZONES (left half = prev, right half = next) ── */}
        {!isEnquiry && (
          <>
            {index > 0 && (
              <div
                onClick={goPrev}
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              />
            )}
            {index < totalSlides - 1 && (
              <div
                onClick={goNext}
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              />
            )}
          </>
        )}

        {/* ── I'M INTERESTED BUTTON ── */}
        {!isEnquiry && (
          <div style={s.interestedWrap}>
            <button className="gallery-interested" onClick={() => goTo(enquiryIndex, 1)}>
              I'm Interested
            </button>
          </div>
        )}

        {/* ── DOT INDICATORS ── */}
        <div style={s.dots} className="gallery-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                ...s.dot,
                background: i === index ? '#C9A84C' : 'rgba(255,255,255,0.35)',
                width: i === index ? 24 : 6,
              }}
            />
          ))}
        </div>

        {/* ── PREV ARROW ── */}
        {index > 0 && (
          <button style={{ ...s.arrow, left: 0 }} onClick={goPrev} aria-label="Previous">
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M9 1L1 9L9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ── NEXT ARROW ── */}
        {index < totalSlides - 1 && (
          <button style={{ ...s.arrow, right: 0 }} onClick={goNext} aria-label="Next">
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M1 1L9 9L1 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ── SWIPE HINT (first load) ── */}
        {index === 0 && photos.length > 1 && (
          <div style={s.swipeHint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.15em' }}>SWIPE</span>
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; background: #0F1D2A; }
        input, textarea { -webkit-appearance: none; border-radius: 0 !important; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { outline: none; border-color: rgba(201,168,76,0.6) !important; }
        button:focus { outline: none; }
        .gallery-interested {
          font-family: 'Jost', Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
          background: rgba(15,29,42,0.45);
          border: 1px solid rgba(201,168,76,0.75);
          padding: 13px 36px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.35s ease, border-color 0.35s ease, color 0.35s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .gallery-interested:hover {
          background: #C9A84C;
          border-color: #C9A84C;
          color: #0F1D2A;
        }
        @media (max-width: 640px) {
          /* Nav */
          .gallery-nav { padding: 0 18px !important; height: 52px !important; }
          .gallery-nav-logo { font-size: 10px !important; letter-spacing: 0.16em !important; }
          .gallery-nav-link { font-size: 10px !important; letter-spacing: 0.12em !important; }

          /* Photo info overlay — location only, no title or price */
          .gallery-info { right: 16px !important; padding-left: 20px !important; bottom: 104px !important; }
          .gallery-info-location { font-size: 9px !important; letter-spacing: 0.18em !important; margin-bottom: 0 !important; }
          .info-title { display: none !important; }
          .gallery-info-price { display: none !important; }

          /* Interested button */
          .gallery-interested { font-size: 9px !important; padding: 11px 28px !important; letter-spacing: 0.22em !important; }

          /* Enquiry slide — fields + button only, no surrounding text */
          .gallery-enquiry-inner { padding: 80px 24px 72px !important; justify-content: center !important; }
          .gallery-e-eyebrow { display: none !important; }
          .e-title { display: none !important; }
          .gallery-e-property { display: none !important; }
          .gallery-e-rule { display: none !important; }
          .gallery-e-sub { display: none !important; }
          .gallery-form-note { display: none !important; }

          /* Form: stack name+email vertically, hide message */
          .gallery-form-row { flex-direction: column !important; gap: 0 !important; margin-bottom: 0 !important; }
          .gallery-form-row > div { margin-bottom: 12px !important; }
          .gallery-msg-wrap { display: none !important; }

          /* Dots: tighter on mobile */
          .gallery-dots { gap: 4px !important; bottom: 14px !important; }
        }
      `}</style>
    </>
  );
}

const s = {
  stage: {
    position: 'fixed', inset: 0,
    background: '#0F1D2A',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute', inset: 0,
    willChange: 'opacity',
  },
  slideImg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center',
    display: 'block',
  },
  // Extra (brochure) photos — flex-centered, never upscaled beyond natural size
  slideImgExtra: {
    display: 'block',
    maxWidth: '60%',
    maxHeight: 'calc(100% - 160px)',
    width: 'auto',
    height: 'auto',
  },
  extraLabel: {
    position: 'absolute', top: 80, left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 600, letterSpacing: '0.26em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)',
    zIndex: 10, whiteSpace: 'nowrap',
  },
  // Floor plans / documents — flex-centered, never upscaled beyond natural size
  slideImgDoc: {
    display: 'block',
    maxWidth: '80%',
    maxHeight: 'calc(100% - 160px)',
    width: 'auto',
    height: 'auto',
  },
  docLabel: {
    position: 'absolute', top: 80, left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 600, letterSpacing: '0.26em',
    textTransform: 'uppercase', color: '#C9A84C',
    zIndex: 10, whiteSpace: 'nowrap',
  },
  gradient: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(10,20,32,0.88) 0%, rgba(10,20,32,0.45) 40%, rgba(10,20,32,0.12) 70%, rgba(10,20,32,0.25) 100%)',
  },

  // Nav
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 68,
    background: 'linear-gradient(to bottom, rgba(10,20,32,0.7) 0%, transparent 100%)',
  },
  navLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.8)',
    letterSpacing: '0.28em', textTransform: 'uppercase', textDecoration: 'none',
  },
  navLink: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 500, color: '#C9A84C',
    letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
  },

  // Property info
  info: {
    position: 'absolute', bottom: 76, left: 0, right: '40%',
    padding: '0 0 0 40px', zIndex: 10,
    pointerEvents: 'none',
  },
  infoLocation: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 12, fontWeight: 500, letterSpacing: '0.22em',
    color: '#C9A84C', margin: '0 0 12px',
  },
  infoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36, fontWeight: 300, color: '#fff',
    margin: '0 0 12px', lineHeight: 1.2, maxWidth: 580,
  },
  infoPrice: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  infoPriceSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em',
  },

  // Counter
  counter: {
    position: 'absolute', bottom: 80, right: 36, zIndex: 10,
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 12, fontWeight: 300, letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.55)',
  },

  // Interested button
  interestedWrap: {
    position: 'absolute', bottom: 68, left: '50%',
    transform: 'translateX(-50%)', zIndex: 10,
  },
  interestedBtn: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: '#0F1D2A',
    background: '#C9A84C', border: 'none',
    padding: '10px 28px', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Dot indicators
  dots: {
    position: 'absolute', bottom: 22, left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: 6, alignItems: 'center', zIndex: 10,
  },
  dot: {
    height: 6, borderRadius: 3,
    border: 'none', padding: 0, cursor: 'pointer',
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // Arrows
  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 56, height: 80,
    background: 'none', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10,
    padding: '0 18px',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute', bottom: 80, right: 80, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    opacity: 0,
    animation: 'fadeInOut 3s ease 1.5s forwards',
  },

  // Enquiry slide inner
  enquiryInner: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 10vw 60px',
    overflowY: 'auto',
  },
  eEyebrow: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 500, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: '#C9A84C', margin: '0 0 14px',
  },
  eTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36, fontWeight: 300, color: '#fff',
    margin: '0 0 20px', lineHeight: 1.2,
  },
  eProperty: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 400, letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.4)', margin: '0 0 20px',
    textTransform: 'uppercase',
  },
  eRule: { width: 32, height: 1, background: '#C9A84C', margin: '0 auto 22px' },
  eSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.75, margin: '0 0 28px', maxWidth: 380, textAlign: 'center',
  },

  // Pre-filled identity
  prefilled: {
    display: 'flex', gap: 0, marginBottom: 24,
    borderTop: '1px solid rgba(201,168,76,0.2)',
    borderBottom: '1px solid rgba(201,168,76,0.12)',
    width: '100%', maxWidth: 420,
  },
  prefilledItem: {
    flex: 1, padding: '12px 0 12px',
  },
  prefilledDivider: {
    width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '8px 20px 8px 0',
  },
  prefilledLabel: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: 4,
  },
  prefilledValue: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  // Form
  fieldWrap: { width: '100%', maxWidth: 420, marginBottom: 16, textAlign: 'left' },
  fieldLabel: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 500, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  input: {
    display: 'block', width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '13px 16px',
    fontFamily: "'Jost', Arial, sans-serif", fontSize: 14,
    color: '#fff', transition: 'border-color 0.2s',
  },
  errorMsg: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 12, color: '#ff8080', margin: '0 0 12px',
  },
  submitBtn: {
    display: 'block', width: '100%', maxWidth: 420, margin: '0 auto',
    padding: '15px 24px',
    background: '#C9A84C', border: 'none', cursor: 'pointer',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: '#0F1D2A',
    marginTop: 4,
  },
  formNote: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, color: 'rgba(255,255,255,0.25)',
    margin: '12px 0 0', letterSpacing: '0.08em',
  },

  // Success
  successIcon: {
    width: 56, height: 56, borderRadius: '50%',
    border: '1px solid #C9A84C',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', color: '#C9A84C', fontSize: 22,
  },
  successTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 300, color: '#fff', margin: '0 0 16px',
  },
  successSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7, margin: '0 0 28px',
  },
  successLink: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 500, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none',
  },
};
