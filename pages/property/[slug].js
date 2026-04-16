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

  // Similar properties: same country, different slug, max 3
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

const PARTNER_LABEL = {
  pacaso: 'Pacaso',
  andhamlet: '&Hamlet',
  vivla: 'Vivla',
  myne: 'Myne',
};

// ── Unlock modal ──────────────────────────────────────────────────────────────

function UnlockModal({ propertyTitle, driveUrl, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

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
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="unlock-overlay" onClick={onClose}>
      <div className="unlock-modal" onClick={e => e.stopPropagation()}>
        <button className="unlock-close" onClick={onClose} aria-label="Close">×</button>
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
            <p>Enter your details and we&apos;ll send the full photo gallery and floor plans straight to your inbox.</p>
            <form onSubmit={handleSubmit} className="unlock-form">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
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

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({ images, title }) {
  const [active, setActive] = useState(null);
  const main = images[0] || '/images/placeholder.jpg';
  const thumbs = images.slice(1, 4); // up to 3 thumbnails

  return (
    <>
      <div className="pgal-grid">
        <div className="pgal-main" onClick={() => setActive(0)}>
          <img src={main} alt={title} loading="eager" />
        </div>
        <div className="pgal-thumbs">
          {thumbs.map((img, i) => (
            <div key={i} className="pgal-thumb" onClick={() => setActive(i + 1)}>
              <img src={img} alt={`${title} ${i + 2}`} loading="lazy" />
            </div>
          ))}
          {thumbs.length === 0 && <div className="pgal-thumb pgal-thumb--empty" />}
        </div>
      </div>

      {active !== null && (
        <div className="pgal-lightbox" onClick={() => setActive(null)}>
          <button className="pgal-lb-close" onClick={() => setActive(null)}>×</button>
          <button
            className="pgal-lb-prev"
            onClick={e => { e.stopPropagation(); setActive((active - 1 + images.length) % images.length); }}
          >‹</button>
          <img src={images[active]} alt={title} onClick={e => e.stopPropagation()} />
          <button
            className="pgal-lb-next"
            onClick={e => { e.stopPropagation(); setActive((active + 1) % images.length); }}
          >›</button>
          <span className="pgal-lb-count">{active + 1} / {images.length}</span>
        </div>
      )}
    </>
  );
}

// ── Similar property card ─────────────────────────────────────────────────────

function SimilarCard({ p }) {
  return (
    <a href={`/property/${p.slug}`} className="similar-card">
      <div className="similar-card-img">
        <img src={p.img || '/images/placeholder.jpg'} alt={p.title} loading="lazy" />
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

  const location = [p.city, p.region, p.country].filter(Boolean).join(', ');
  const partnerLabel = PARTNER_LABEL[p.partner] || p.partner;

  return (
    <>
      <Head>
        <title>{p.title} | Co-Ownership Property</title>
        <meta name="description" content={p.description ? p.description.slice(0, 155) : `${p.title} — available for co-ownership from ${fmt(p.price, p.currency)}.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content={p.title} />
        <meta property="og:image" content={p.img} />
        <meta property="og:type" content="website" />
      </Head>

      <Header />

      <div className="ppage">

        {/* ── Gallery ── */}
        <section className="pgal-section">
          <Gallery images={p.images} title={p.title} />
        </section>

        {/* ── Main content ── */}
        <div className="ppage-inner">

          {/* Breadcrumb */}
          <nav className="prop-breadcrumb">
            <a href="/our-homes">All Properties</a>
            {' › '}
            <a href={`/our-homes?country=${encodeURIComponent(p.country)}`}>{p.country}</a>
            {p.region && <>{' › '}{p.region}</>}
          </nav>

          {/* Tags */}
          <div className="prop-tags">
            {partnerLabel && <span className="prop-tag">{partnerLabel}</span>}
            {p.rental && <span className="prop-tag">Rental Income</span>}
            {p.country && <span className="prop-tag">{p.country}</span>}
          </div>

          {/* Title */}
          <h1 className="prop-title">{p.title}</h1>

          {/* Location */}
          {location && <p className="prop-location">📍 {location}</p>}

          {/* Stats bar */}
          <div className="prop-stats ppage-stats">
            <div className="prop-stat">
              <span className="prop-stat-val">{fmt(p.price, p.currency)}</span>
              <span className="prop-stat-lbl">Price per share</span>
            </div>
            {p.beds > 0 && (
              <div className="prop-stat">
                <span className="prop-stat-val">{p.beds}</span>
                <span className="prop-stat-lbl">Bedroom{p.beds !== 1 ? 's' : ''}</span>
              </div>
            )}
            {p.baths > 0 && (
              <div className="prop-stat">
                <span className="prop-stat-val">{p.baths}</span>
                <span className="prop-stat-lbl">Bathroom{p.baths !== 1 ? 's' : ''}</span>
              </div>
            )}
            {p.size > 0 && (
              <div className="prop-stat">
                <span className="prop-stat-val">{p.size} m²</span>
                <span className="prop-stat-lbl">Property size</span>
              </div>
            )}
          </div>

          {/* Two-column body */}
          <div className="ppage-body">

            {/* Left: description + amenities */}
            <div className="ppage-left">
              {p.description && (
                <div className="prop-desc">
                  <h2 className="prop-section-heading">About this property</h2>
                  {p.description.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              {!p.description && (
                <div className="prop-desc prop-desc--placeholder">
                  <h2 className="prop-section-heading">About this property</h2>
                  <p>Full details for this property are coming soon. In the meantime, use the enquiry form to get in touch and we&apos;ll send you everything you need.</p>
                </div>
              )}

              {p.amenities.length > 0 && (
                <div className="prop-amenities-section">
                  <h2 className="prop-section-heading">Amenities</h2>
                  <ul className="prop-amenities-list">
                    {p.amenities.map((a, i) => (
                      <li key={i} className="prop-amenity">{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unlock CTA */}
              {p.driveUrl && (
                <div className="prop-unlock-cta">
                  <div className="prop-unlock-cta-text">
                    <h3>Floor Plans &amp; More Photos</h3>
                    <p>Get the full photo gallery and floor plans sent straight to your inbox — free and instant.</p>
                  </div>
                  <button className="prop-unlock-btn" onClick={() => setShowUnlock(true)}>
                    Unlock Photos &amp; Floor Plans →
                  </button>
                </div>
              )}
            </div>

            {/* Right: enquiry form */}
            <div className="ppage-right">
              <div className="prop-enquiry-card">
                <span className="prop-enquiry-eyebrow">Get in touch</span>
                <h3>Interested in this property?</h3>
                <p>Send us a message and we&apos;ll get back to you within a few hours.</p>
                <EnquiryForm propertyTitle={p.title} />
              </div>
            </div>
          </div>

          {/* Similar properties */}
          {similar.length > 0 && (
            <div className="prop-similar">
              <h2 className="prop-section-heading">Similar properties in {p.country}</h2>
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

// ── Inline enquiry form ───────────────────────────────────────────────────────

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
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="enquiry-success">
        <div className="enquiry-success-icon">✓</div>
        <p>Thanks {form.name}! We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="enquiry-form">
      <div className="enquiry-field">
        <label>Full name *</label>
        <input type="text" value={form.name} onChange={set('name')} required placeholder="Jane Smith" />
      </div>
      <div className="enquiry-field">
        <label>Email address *</label>
        <input type="email" value={form.email} onChange={set('email')} required placeholder="jane@example.com" />
      </div>
      <div className="enquiry-field">
        <label>Phone number</label>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 7700 000000" />
      </div>
      <div className="enquiry-field">
        <label>Message</label>
        <textarea value={form.message} onChange={set('message')} rows={4} placeholder="I'd like to find out more about this property…" />
      </div>
      <button type="submit" className="enquiry-submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry →'}
      </button>
      {status === 'error' && <p className="enquiry-error">Something went wrong. Please try again.</p>}
    </form>
  );
}
