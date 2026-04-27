import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getServerSideProps({ params }) {
  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(params.token, 'base64url').toString('utf-8'));
  } catch {
    try {
      decoded = JSON.parse(Buffer.from(params.token, 'base64').toString('utf-8'));
    } catch {
      return { notFound: true };
    }
  }

  const { n: name, e: email, s: slug, t: title } = decoded || {};
  if (!email || !slug) return { notFound: true };

  const supabase = getSupabase();
  const { data: prop } = await supabase
    .from('properties')
    .select('slug, title, img, photos, country, city, region, price, currency, beds, size')
    .eq('slug', slug)
    .single();

  return {
    props: {
      name: name || null,
      email,
      property: prop || { slug, title: title || '', img: null, photos: [] },
    },
  };
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div style={lb.overlay} onClick={onClose}>
      <button style={lb.close} onClick={onClose} aria-label="Close">✕</button>
      <button style={{ ...lb.nav, left: 20 }} onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">‹</button>
      <div style={lb.imgWrap} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[index]} alt={`Photo ${index + 1}`} style={lb.img} />
        <p style={lb.counter}>{index + 1} / {photos.length}</p>
      </div>
      <button style={{ ...lb.nav, right: 20 }} onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next">›</button>
    </div>
  );
}

const lb = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10,20,30,0.96)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  close: {
    position: 'absolute', top: 24, right: 28, background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.7)', fontSize: 28, cursor: 'pointer', lineHeight: 1, zIndex: 1,
  },
  nav: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#fff', fontSize: 56,
    cursor: 'pointer', lineHeight: 1, padding: '0 8px', opacity: 0.7,
  },
  imgWrap: {
    maxWidth: '90vw', maxHeight: '88vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  img: {
    maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', display: 'block',
  },
  counter: {
    color: 'rgba(255,255,255,0.4)', fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, letterSpacing: 2, margin: 0,
  },
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GalleryPage({ name, email, property }) {
  const [lbIndex, setLbIndex] = useState(null);
  const [formState, setFormState] = useState({ phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const photos = Array.isArray(property.photos) && property.photos.length > 0
    ? property.photos
    : property.img ? [property.img] : [];

  const firstName = name ? name.split(' ')[0] : null;
  const sym = { EUR: '€', USD: '$', GBP: '£' }[property.currency] || '€';
  const priceStr = property.price ? `${sym}${Number(property.price).toLocaleString('en-GB')}` : null;
  const location = [property.city, property.country].filter(Boolean).join(', ');

  const openLb = (i) => { setLbIndex(i); document.body.style.overflow = 'hidden'; };
  const closeLb = useCallback(() => { setLbIndex(null); document.body.style.overflow = ''; }, []);
  const prevLb = useCallback(() => setLbIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const nextLb = useCallback(() => setLbIndex(i => (i + 1) % photos.length), [photos.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.phone.trim()) { setError('Please enter your phone number.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/gallery-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email,
          phone: formState.phone,
          message: formState.message,
          propertySlug: property.slug,
          propertyTitle: property.title,
          propertyUrl: `https://co-ownership-property.com/property/${property.slug}/`,
        }),
      });
      if (res.ok) { setSubmitted(true); }
      else { setError('Something went wrong — please try again.'); }
    } catch {
      setError('Something went wrong — please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <Head>
        <title>{property.title} — Your Private Gallery | Co-Ownership Property</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <a href="https://co-ownership-property.com" style={s.navLogo}>
          Co-Ownership Property
        </a>
        <a href={`https://co-ownership-property.com/property/${property.slug}/`} style={s.navLink}>
          View Listing →
        </a>
      </nav>

      {/* ── HERO ── */}
      <div style={s.hero}>
        {property.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.img} alt={property.title} style={s.heroImg} />
        )}
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          {location && <p style={s.heroEyebrow}>{location.toUpperCase()}</p>}
          <h1 style={s.heroTitle}>{property.title}</h1>
          {priceStr && (
            <p style={s.heroPrice}>
              From {priceStr}
              <span style={s.heroPriceSub}> per share</span>
            </p>
          )}
        </div>
      </div>

      {/* ── PERSONAL GREETING ── */}
      <div style={s.greetWrap}>
        <div style={s.greetInner}>
          <p style={s.greetEyebrow}>Your Private Gallery</p>
          <h2 style={s.greetTitle}>
            {firstName ? `${firstName}, here's your full photo pack` : 'Your full photo pack'}
          </h2>
          <p style={s.greetSub}>
            We've put together every photo, floor plan, and detail for{' '}
            <strong>{property.title}</strong>. Browse at your own pace — and when you're ready, let us know below.
          </p>
          <div style={s.goldRule} />
        </div>
      </div>

      {/* ── PHOTO GRID ── */}
      {photos.length > 0 && (
        <div style={s.gridWrap}>
          <div style={s.grid}>
            {photos.map((url, i) => (
              <button
                key={i}
                style={s.gridItem}
                onClick={() => openLb(i)}
                aria-label={`View photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${property.title} — photo ${i + 1}`} style={s.gridImg} loading="lazy" />
                <div style={s.gridOverlay}>
                  <span style={s.gridZoom}>⊕</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ENQUIRY FORM ── */}
      <div style={s.formSection}>
        <div style={s.formCard}>
          {!submitted ? (
            <>
              <p style={s.formEyebrow}>Ready to Take the Next Step?</p>
              <h2 style={s.formTitle}>
                {firstName ? `${firstName}, speak to` : 'Speak to'} an{' '}
                <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>expert</em>
              </h2>
              <p style={s.formSub}>
                Leave your number and we'll be in touch within a few hours — no pressure, just a conversation.
              </p>

              {/* Pre-filled identity */}
              <div style={s.identityRow}>
                <div style={s.identityChip}>
                  <span style={s.identityLabel}>Name</span>
                  <span style={s.identityValue}>{name || '—'}</span>
                </div>
                <div style={s.identityChip}>
                  <span style={s.identityLabel}>Email</span>
                  <span style={s.identityValue}>{email}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.fieldWrap}>
                  <label style={s.label}>Phone number <span style={{ color: '#C9A84C' }}>*</span></label>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => setFormState(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+44 7700 900000"
                    style={s.input}
                    required
                  />
                </div>
                <div style={s.fieldWrap}>
                  <label style={s.label}>Message <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>(optional)</span></label>
                  <textarea
                    value={formState.message}
                    onChange={(e) => setFormState(p => ({ ...p, message: e.target.value }))}
                    placeholder={`I'd love to find out more about ${property.title}…`}
                    style={{ ...s.input, height: 100, resize: 'vertical' }}
                    rows={4}
                  />
                </div>
                {error && <p style={s.errorMsg}>{error}</p>}
                <button type="submit" style={s.submitBtn} disabled={submitting}>
                  {submitting ? 'Sending…' : "I'm Interested — Get in Touch"}
                </button>
                <p style={s.formNote}>No obligation · We respond within a few hours</p>
              </form>
            </>
          ) : (
            <div style={s.successWrap}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>We'll be in touch shortly</h2>
              <p style={s.successSub}>
                Thank you{firstName ? `, ${firstName}` : ''}. One of our co-ownership specialists will reach out to you about{' '}
                <strong style={{ color: '#C9A84C' }}>{property.title}</strong> within a few hours.
              </p>
              <a href={`https://co-ownership-property.com/property/${property.slug}/`} style={s.successLink}>
                View the listing →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <p style={s.footerLogo}>Co-Ownership Property</p>
        <div style={s.footerRule} />
        <p style={s.footerText}>
          <a href="https://co-ownership-property.com/our-homes/" style={s.footerLink}>Browse Properties</a>
          {'  ·  '}
          <a href="https://co-ownership-property.com/how-it-works/" style={s.footerLink}>How It Works</a>
          {'  ·  '}
          <a href="https://co-ownership-property.com/about-us/" style={s.footerLink}>About Us</a>
        </p>
        <p style={s.footerFine}>
          This page was created personally for {name || email} and is not indexed publicly.
        </p>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lbIndex !== null && (
        <Lightbox photos={photos} index={lbIndex} onClose={closeLb} onPrev={prevLb} onNext={nextLb} />
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #F5F2EC; }
        @media (max-width: 700px) {
          .gal-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-title { font-size: 28px !important; }
          .form-card { padding: 40px 24px !important; }
          .identity-row { flex-direction: column !important; }
        }
      `}</style>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  navy:   '#1E3448',
  gold:   '#C9A84C',
  cream:  '#F5F2EC',
  creamL: '#FAF8F5',
  white:  '#FFFFFF',
  text:   '#4A6070',
};

const s = {
  // Nav
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 72,
    background: 'rgba(30,52,72,0.96)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(201,168,76,0.2)',
  },
  navLogo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 15, fontWeight: 400, color: '#fff',
    letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none',
  },
  navLink: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 700, color: C.gold,
    letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none',
  },

  // Hero
  hero: {
    position: 'relative', height: '75vh', minHeight: 480,
    overflow: 'hidden', background: C.navy,
  },
  heroImg: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(0deg, rgba(20,40,60,0.90) 0%, rgba(20,40,60,0.35) 55%, rgba(20,40,60,0.1) 100%)',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '0 48px 52px',
  },
  heroEyebrow: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 10, fontWeight: 800, letterSpacing: '3px',
    color: C.gold, margin: '0 0 14px',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 42, fontWeight: 400, color: '#fff',
    margin: '0 0 16px', lineHeight: 1.2, maxWidth: 720,
  },
  heroPrice: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  heroPriceSub: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em',
  },

  // Greeting
  greetWrap: { background: C.creamL, padding: '72px 32px 56px' },
  greetInner: { maxWidth: 680, margin: '0 auto', textAlign: 'center' },
  greetEyebrow: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 10, fontWeight: 800, letterSpacing: '3px',
    textTransform: 'uppercase', color: C.gold, margin: '0 0 16px',
  },
  greetTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 34, fontWeight: 400, color: C.navy,
    margin: '0 0 18px', lineHeight: 1.25,
  },
  greetSub: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 16, color: C.text, lineHeight: 1.8, margin: '0 0 36px',
  },
  goldRule: {
    width: 48, height: 1, background: C.gold, margin: '0 auto',
  },

  // Photo grid
  gridWrap: { background: C.cream, padding: '56px 32px 72px' },
  grid: {
    maxWidth: 1200, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  gridItem: {
    position: 'relative', border: 'none', padding: 0, cursor: 'pointer',
    background: 'none', overflow: 'hidden', aspectRatio: '4/3',
    display: 'block',
  },
  gridImg: {
    width: '100%', height: '100%', objectFit: 'cover',
    display: 'block', transition: 'transform 0.4s ease',
  },
  gridOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(20,40,60,0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.3s',
  },
  gridZoom: {
    color: '#fff', fontSize: 32, opacity: 0,
    transition: 'opacity 0.3s', userSelect: 'none',
  },

  // Enquiry form
  formSection: {
    background: C.navy, padding: '80px 32px',
    borderTop: `2px solid ${C.gold}`,
  },
  formCard: {
    maxWidth: 580, margin: '0 auto', textAlign: 'center',
  },
  formEyebrow: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 10, fontWeight: 800, letterSpacing: '3px',
    textTransform: 'uppercase', color: C.gold, margin: '0 0 14px',
  },
  formTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 36, fontWeight: 400, color: '#fff',
    margin: '0 0 14px', lineHeight: 1.25,
  },
  formSub: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 15, color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7, margin: '0 0 32px',
  },
  identityRow: {
    display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center',
  },
  identityChip: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.25)',
    padding: '10px 18px', flex: 1, textAlign: 'left', maxWidth: 240,
  },
  identityLabel: {
    display: 'block', fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 9, fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase', color: C.gold, marginBottom: 4,
  },
  identityValue: {
    display: 'block', fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, color: 'rgba(255,255,255,0.85)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  form: { textAlign: 'left' },
  fieldWrap: { marginBottom: 20 },
  label: {
    display: 'block', fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 0, padding: '14px 16px',
    fontFamily: "'Nunito Sans', sans-serif", fontSize: 15,
    color: '#fff', outline: 'none',
    transition: 'border-color 0.2s',
  },
  errorMsg: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 13, color: '#ff8080', margin: '0 0 16px',
  },
  submitBtn: {
    width: '100%', padding: '18px 32px',
    background: C.gold, border: 'none', cursor: 'pointer',
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 12, fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase', color: C.navy,
    marginTop: 8, transition: 'background 0.2s',
  },
  formNote: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', margin: '14px 0 0', letterSpacing: '0.5px',
  },

  // Success
  successWrap: { textAlign: 'center', padding: '20px 0' },
  successIcon: {
    width: 64, height: 64, borderRadius: '50%',
    border: `2px solid ${C.gold}`, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', color: C.gold, fontSize: 28,
  },
  successTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 32, fontWeight: 400, color: '#fff', margin: '0 0 16px',
  },
  successSub: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.7, margin: '0 0 28px',
  },
  successLink: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase', color: C.gold, textDecoration: 'none',
  },

  // Footer
  footer: {
    background: '#141E28', padding: '52px 32px 40px', textAlign: 'center',
  },
  footerLogo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 16px',
  },
  footerRule: {
    width: 40, height: 1, background: 'rgba(201,168,76,0.3)',
    margin: '0 auto 16px',
  },
  footerText: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.5px', margin: '0 0 12px',
  },
  footerLink: { color: 'rgba(255,255,255,0.35)', textDecoration: 'none' },
  footerFine: {
    fontFamily: "'Nunito Sans', sans-serif",
    fontSize: 10, color: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.3px', margin: 0,
  },
};
