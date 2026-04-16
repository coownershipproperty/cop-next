import Head from 'next/head';
import { useState } from 'react';
import path from 'path';
import fs from 'fs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

export async function getStaticPaths() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8'));
  return { paths: data.map(p => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8'));
  const property = data.find(p => p.slug === params.slug);
  if (!property) return { notFound: true };
  const similar = data.filter(p => p.country === property.country && p.slug !== property.slug).slice(0, 3);
  return { props: { property, similar } };
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency) { return `${SYM[currency] || currency}${price.toLocaleString('en-GB')}`; }
const PARTNER_LABEL = { pacaso: 'Pacaso', andhamlet: '&Hamlet', vivla: 'Vivla', myne: 'Myne' };

function Img({ src, alt, className, loading = 'lazy' }) {
  return (
    <img src={src || '/images/placeholder.jpg'} alt={alt} className={className} loading={loading}
      onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }} />
  );
}

/* ── Unlock modal ── */
function UnlockModal({ propertyTitle, driveUrl, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/unlock-drive', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, propertyTitle, driveUrl }) });
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  return (
    <div className="ul-overlay" onClick={onClose}>
      <div className="ul-modal" onClick={e => e.stopPropagation()}>
        <button className="ul-close" onClick={onClose}>×</button>
        {status === 'done' ? (
          <div className="ul-success">
            <div className="ul-tick">✓</div>
            <h3>Check your inbox!</h3>
            <p>We&apos;ve sent the photos &amp; floor plans to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <>
            <p className="ul-eye">Exclusive access</p>
            <h3>Floor Plans &amp; More Photos</h3>
            <p className="ul-sub">Enter your details and we&apos;ll send the full gallery and floor plans straight to your inbox.</p>
            <form onSubmit={submit} className="ul-form">
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send me the photos →'}</button>
              {status === 'error' && <p className="ul-err">Something went wrong. Please try again.</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Enquiry form ── */
function EnquiryForm({ propertyTitle }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, property: propertyTitle }) });
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
  const heroImg = p.images[0] || '/images/placeholder.jpg';
  const partnerLabel = PARTNER_LABEL[p.partner] || p.partner;

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

      {/* ── Full-width gallery: hero (left, full height) + 2 thumbs (top-right) + lock panel (bottom-right) ── */}
      <div className="pp-gallery">
        {/* Hero — spans both rows */}
        <div className="pp-gallery-hero" onClick={() => setLightbox(0)}>
          <Img src={heroImg} alt={p.title} loading="eager" />
        </div>
        {/* Top-right: thumb 1 */}
        <div className="pp-gallery-thumb" onClick={() => p.images[1] && setLightbox(1)}>
          {p.images[1] ? <Img src={p.images[1]} alt={`${p.title} 2`} /> : <div className="pp-gallery-blank" />}
        </div>
        {/* Top-right: thumb 2 */}
        <div className="pp-gallery-thumb" onClick={() => p.images[2] && setLightbox(2)}>
          {p.images[2] ? <Img src={p.images[2]} alt={`${p.title} 3`} /> : <div className="pp-gallery-blank" />}
        </div>
        {/* Bottom-right: lock panel, spans both right columns */}
        <div className="pp-gallery-lock" onClick={() => p.driveUrl && setShowUnlock(true)}>
          <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="pp-lock-title">Exclusive Photos &amp; Floor Plans</span>
          <span className="pp-lock-sub">Enter email to unlock</span>
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

          {/* Save + Partner */}
          <div className="pp-actions">
            <button className="pp-save">♡ Save Property</button>
            {partnerLabel && <span className="pp-partner-tag">{partnerLabel}</span>}
          </div>

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
            {p.description
              ? p.description.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)
              : <p className="pp-desc-empty">Full details coming soon. Use the enquiry form to get in touch.</p>}
          </div>

          {/* Amenities — 2-column bullet list */}
          {p.amenities.length > 0 && (
            <div className="pp-amenities">
              <h2 className="pp-heading">Features &amp; Amenities</h2>
              <ul className="pp-amenity-list">
                {p.amenities.map((a, i) => (
                  <li key={i} className="pp-amenity-item">
                    <span className="pp-amenity-dot">·</span>{a}
                  </li>
                ))}
              </ul>
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

          {/* Extra photos */}
          {p.images.length > 1 && (
            <div className="pp-photos">
              <h2 className="pp-heading">Photos</h2>
              <div className="pp-photo-grid">
                {p.images.slice(1).map((img, i) => (
                  <div key={i} className="pp-photo-thumb" onClick={() => setLightbox(i + 1)}>
                    <Img src={img} alt={`${p.title} ${i + 2}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar */}
          {similar.length > 0 && (
            <div className="pp-similar">
              <h2 className="pp-heading">Similar Properties in {p.country}</h2>
              <div className="pp-similar-grid">
                {similar.map(s => (
                  <a key={s.slug} href={`/property/${s.slug}`} className="pp-sim-card">
                    <div className="pp-sim-img"><Img src={s.img} alt={s.title} /></div>
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
            <EnquiryForm propertyTitle={p.title} />
          </div>
        </div>

      </div>{/* /pp-content */}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="pp-lb" onClick={() => setLightbox(null)}>
          <button className="pp-lb-close" onClick={() => setLightbox(null)}>×</button>
          <button className="pp-lb-prev" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + p.images.length) % p.images.length); }}>‹</button>
          <img src={p.images[lightbox]} alt={p.title} onClick={e => e.stopPropagation()} />
          <button className="pp-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % p.images.length); }}>›</button>
          <span className="pp-lb-count">{lightbox + 1} / {p.images.length}</span>
        </div>
      )}

      {showUnlock && <UnlockModal propertyTitle={p.title} driveUrl={p.driveUrl} onClose={() => setShowUnlock(false)} />}

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
