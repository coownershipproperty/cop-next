import Head from 'next/head';
import { useState } from 'react';
import path from 'path';
import fs from 'fs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

// ── Static generation ─────────────────────────────────────────────────────────

export async function getStaticPaths() {
  const data = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8')
  );
  return {
    paths: data.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const data = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8')
  );
  const property = data.find(p => p.slug === params.slug);
  if (!property) return { notFound: true };

  const similar = data
    .filter(p => p.country === property.country && p.slug !== property.slug)
    .slice(0, 3);

  return { props: { property, similar } };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOL = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency) {
  const sym = CURRENCY_SYMBOL[currency] || currency;
  return `${sym}${price.toLocaleString('en-GB')}`;
}

const PARTNER_LABEL = { pacaso: 'Pacaso', andhamlet: '&Hamlet', vivla: 'Vivla', myne: 'Myne' };

function ImgWithFallback({ src, alt, className, loading = 'lazy' }) {
  return (
    <img
      src={src || '/images/placeholder.jpg'}
      alt={alt}
      className={className}
      loading={loading}
      onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
    />
  );
}

// ── Unlock modal ──────────────────────────────────────────────────────────────

function UnlockModal({ propertyTitle, driveUrl, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch('/api/unlock-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, propertyTitle, driveUrl }),
      });
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  return (
    <div className="unlock-overlay" onClick={onClose}>
      <div className="unlock-modal" onClick={e => e.stopPropagation()}>
        <button className="unlock-close" onClick={onClose}>×</button>
        {status === 'done' ? (
          <div className="unlock-success">
            <div className="unlock-success-icon">✓</div>
            <h3>Check your inbox!</h3>
            <p>We&apos;ve sent the floor plans and additional photos to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <>
            <span className="unlock-eyebrow">Exclusive access</span>
            <h3>Floor Plans &amp; More Photos</h3>
            <p>Enter your details and we&apos;ll send the full gallery and floor plans straight to your inbox.</p>
            <form onSubmit={handleSubmit} className="unlock-form">
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" className="unlock-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send me the photos →'}
              </button>
              {status === 'error' && <p className="unlock-error">Something went wrong. Please try again.</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Enquiry form ──────────────────────────────────────────────────────────────

function EnquiryForm({ propertyTitle }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const r = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, property: propertyTitle }),
      });
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  if (status === 'done') return (
    <div className="enquiry-success">
      <div className="enquiry-success-icon">✓</div>
      <p>Thanks {form.name}! We&apos;ll be in touch shortly.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="enquiry-form">
      <div className="enquiry-field">
        <label>Your name *</label>
        <input type="text" value={form.name} onChange={set('name')} required placeholder="Full name" />
      </div>
      <div className="enquiry-field">
        <label>Email *</label>
        <input type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" />
      </div>
      <div className="enquiry-field">
        <label>Phone</label>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 or +44…" />
      </div>
      <div className="enquiry-field">
        <label>Message</label>
        <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Any questions about this property…" />
      </div>
      <button type="submit" className="enquiry-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry →'}
      </button>
      {status === 'error' && <p className="enquiry-error">Something went wrong. Please try again.</p>}
    </form>
  );
}

// ── Similar property card ─────────────────────────────────────────────────────

function SimilarCard({ p }) {
  return (
    <a href={`/property/${p.slug}`} className="similar-card">
      <div className="similar-card-img">
        <ImgWithFallback src={p.img} alt={p.title} />
      </div>
      <div className="similar-card-body">
        <h4>{p.title}</h4>
        <p className="similar-card-price">{fmt(p.price, p.currency)}</p>
      </div>
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PropertyPage({ property: p, similar }) {
  const [showUnlock, setShowUnlock] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

  const partnerLabel = PARTNER_LABEL[p.partner] || p.partner;
  const heroImg = p.images[0] || '/images/placeholder.jpg';

  return (
    <>
      <Head>
        <title>{p.title} | Co-Ownership Property</title>
        <meta name="description" content={p.description ? p.description.slice(0, 155) : `${p.title} — co-ownership from ${fmt(p.price, p.currency)}.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={p.title} />
        <meta property="og:image" content={p.img} />
      </Head>

      <Header />

      <div className="ppage">

        {/* ── Hero gallery ── */}
        <div className="pgal-hero">
          <div className="pgal-hero-main" onClick={() => setActiveImg(0)}>
            <ImgWithFallback src={heroImg} alt={p.title} loading="eager" />
          </div>
          <div className="pgal-hero-right">
            {/* Thumbnails */}
            {p.images.slice(1, 3).map((img, i) => (
              <div key={i} className="pgal-hero-thumb" onClick={() => setActiveImg(i + 1)}>
                <ImgWithFallback src={img} alt={`${p.title} ${i + 2}`} />
              </div>
            ))}
            {/* Lock panel */}
            {p.driveUrl && (
              <div className="pgal-lock-panel" onClick={() => setShowUnlock(true)}>
                <div className="pgal-lock-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <span className="pgal-lock-label">Exclusive Photos &amp; Floor Plans</span>
                <span className="pgal-lock-sub">Enter email to unlock</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Lightbox ── */}
        {activeImg !== null && (
          <div className="pgal-lightbox" onClick={() => setActiveImg(null)}>
            <button className="pgal-lb-close" onClick={() => setActiveImg(null)}>×</button>
            <button className="pgal-lb-prev" onClick={e => { e.stopPropagation(); setActiveImg((activeImg - 1 + p.images.length) % p.images.length); }}>‹</button>
            <img src={p.images[activeImg]} alt={p.title} onClick={e => e.stopPropagation()} />
            <button className="pgal-lb-next" onClick={e => { e.stopPropagation(); setActiveImg((activeImg + 1) % p.images.length); }}>›</button>
            <span className="pgal-lb-count">{activeImg + 1} / {p.images.length}</span>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="ppage-inner">
          <div className="ppage-cols">

            {/* LEFT column */}
            <div className="ppage-left">

              {/* Price + badge */}
              <div className="prop-price-row">
                <span className="prop-price-big">{fmt(p.price, p.currency)}</span>
                <span className="prop-share-badge">1/8 Co-Ownership</span>
              </div>

              {/* Breadcrumb */}
              <nav className="prop-breadcrumb">
                {[p.city, p.region, p.country].filter(Boolean).map((crumb, i, arr) => (
                  <span key={i}>
                    {i > 0 && <span className="prop-breadcrumb-sep"> › </span>}
                    <span className="prop-breadcrumb-item">{crumb}</span>
                  </span>
                ))}
              </nav>

              {/* Title */}
              <h1 className="prop-title">{p.title}</h1>

              {/* Partner tag */}
              {partnerLabel && (
                <div className="prop-tags">
                  <span className="prop-tag">{partnerLabel}</span>
                  {p.rental && <span className="prop-tag">Rental Income</span>}
                </div>
              )}

              {/* Stats */}
              <div className="ppage-stats">
                {p.beds > 0 && (
                  <div className="ppage-stat">
                    <span className="ppage-stat-val">{p.beds}</span>
                    <span className="ppage-stat-lbl">Bedroom{p.beds !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {p.baths > 0 && (
                  <div className="ppage-stat">
                    <span className="ppage-stat-val">{p.baths}</span>
                    <span className="ppage-stat-lbl">Bathroom{p.baths !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {p.size > 0 && (
                  <div className="ppage-stat">
                    <span className="ppage-stat-val">{p.size} m²</span>
                    <span className="ppage-stat-lbl">Total size</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prop-desc">
                <h2 className="prop-section-heading">About This Property</h2>
                {p.description
                  ? p.description.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)
                  : <p className="prop-desc-placeholder">Full details coming soon. Use the enquiry form to get in touch.</p>
                }
              </div>

              {/* Amenities */}
              {p.amenities.length > 0 && (
                <div className="prop-amenities-section">
                  <h2 className="prop-section-heading">Amenities</h2>
                  <ul className="prop-amenities-list">
                    {p.amenities.map((a, i) => <li key={i} className="prop-amenity">{a}</li>)}
                  </ul>
                </div>
              )}

              {/* Photo gallery thumbnails (remaining images) */}
              {p.images.length > 3 && (
                <div className="prop-more-photos">
                  <h2 className="prop-section-heading">Photos</h2>
                  <div className="prop-photo-grid">
                    {p.images.slice(3).map((img, i) => (
                      <div key={i} className="prop-photo-thumb" onClick={() => setActiveImg(i + 3)}>
                        <ImgWithFallback src={img} alt={`${p.title} photo ${i + 4}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>{/* /ppage-left */}

            {/* RIGHT column — enquiry form */}
            <div className="ppage-right">
              <div className="prop-enquiry-card">
                <span className="prop-enquiry-eyebrow">Get in touch</span>
                <h3>Enquire About This Property</h3>
                <p>Our team typically responds within a few hours. No obligation.</p>
                <EnquiryForm propertyTitle={p.title} />
              </div>
            </div>

          </div>{/* /ppage-cols */}

          {/* Similar properties */}
          {similar.length > 0 && (
            <div className="prop-similar">
              <h2 className="prop-section-heading">Similar Properties in {p.country}</h2>
              <div className="similar-grid">
                {similar.map(s => <SimilarCard key={s.slug} p={s} />)}
              </div>
            </div>
          )}

        </div>{/* /ppage-inner */}
      </div>{/* /ppage */}

      {showUnlock && (
        <UnlockModal
          propertyTitle={p.title}
          driveUrl={p.driveUrl}
          onClose={() => setShowUnlock(false)}
        />
      )}

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
