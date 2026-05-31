import { useState, useEffect } from 'react';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

/**
 * ViewingRequestForm
 * Slim form for /viewings/ — posts to /api/enquiry with viewing details
 * stuffed into the existing property/url/message fields so all CRM wiring
 * (Resend auto-reply, team notification, contact + lead + activity log)
 * is reused as-is.
 *
 * Props:
 *   viewings — the same list rendered by the page (id, displayName, dateLabel, city, propertySlug)
 *   selectedId (optional) — preselect a viewing (e.g. when the user clicks a card's "Request" CTA)
 */
export default function ViewingRequestForm({ viewings = [], selectedId = '' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [viewingId, setViewingId] = useState(selectedId);
  const [mode, setMode] = useState('on-site'); // on-site | video
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedId) setViewingId(selectedId);
  }, [selectedId]);

  // Allow other components (the cards) to preselect a viewing
  useEffect(() => {
    function handle(e) {
      if (e.detail?.viewingId) {
        setViewingId(e.detail.viewingId);
        // Scroll the form into view
        const el = document.getElementById('viewing-request-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.addEventListener('cop:request-viewing', handle);
    return () => window.removeEventListener('cop:request-viewing', handle);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    const form = e.currentTarget;
    const honeypot = form.elements[HONEYPOT_FIELD]?.value || '';

    if (!name.trim() || !email.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your name and email.');
      return;
    }
    if (!viewingId) {
      setStatus('error');
      setErrorMsg('Please choose a viewing.');
      return;
    }

    const v = viewings.find(x => x.id === viewingId);
    if (!v) {
      setStatus('error');
      setErrorMsg('Selected viewing not found. Please refresh.');
      return;
    }

    setStatus('sending');

    const propertyTitle = `${v.displayName} — ${v.city}, ${v.country} (viewing ${v.dateLabel})`;
    const url = `https://co-ownership-property.com/property/${v.propertySlug}/`;
    const modeLabel = mode === 'video' ? 'Live video call' : 'On-site viewing';
    const fullMessage = [
      `VIEWING REQUEST`,
      `Property: ${v.displayName} (${v.city}, ${v.country})`,
      `Date: ${v.dateLabel}`,
      `Format: ${modeLabel}`,
      phone ? `Phone: ${phone}` : null,
      '',
      message.trim() || '(no additional message)',
    ].filter(Boolean).join('\n');

    try {
      const payload = {
        name,
        email,
        phone: phone || '',
        property: propertyTitle,
        url,
        message: fullMessage,
        source: 'viewings-page',
        destination: `${v.region}; ${v.country}`,
        locale: 'en',
        [HONEYPOT_FIELD]: honeypot,
      };

      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  return (
    <section id="viewing-request-form" className="viewing-form-sec">
      <div className="viewing-form-inner">
        <p className="eyebrow" style={{ textAlign: 'center' }}>Book Your Viewing</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', marginBottom: '0.6rem' }}>
          Request a <em>viewing</em>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', maxWidth: 540, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Choose a date, pick on-site or live video, and we&apos;ll confirm within a few hours.
        </p>

        <form className="expert-form" onSubmit={handleSubmit} noValidate>
          <HoneypotField />

          <div className="expert-form-grid">
            <div className="expert-form-field">
              <label htmlFor="vr-name">Name <span>*</span></label>
              <input
                id="vr-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="expert-form-field">
              <label htmlFor="vr-email">Email <span>*</span></label>
              <input
                id="vr-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="expert-form-field">
              <label htmlFor="vr-phone">Phone</label>
              <input
                id="vr-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+44 or +1…"
              />
            </div>

            <div className="expert-form-field">
              <label htmlFor="vr-mode">Format <span>*</span></label>
              <select
                id="vr-mode"
                value={mode}
                onChange={e => setMode(e.target.value)}
              >
                <option value="on-site">On-site viewing</option>
                <option value="video">Live video call</option>
              </select>
            </div>

            <div className="expert-form-field full">
              <label htmlFor="vr-viewing">Which viewing? <span>*</span></label>
              <select
                id="vr-viewing"
                value={viewingId}
                onChange={e => setViewingId(e.target.value)}
                required
              >
                <option value="">Select a viewing…</option>
                {viewings.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.displayName} · {v.city}, {v.country} — {v.dateLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="expert-form-field full">
              <label htmlFor="vr-message">Message</label>
              <textarea
                id="vr-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Anything you'd like us to know (number of attendees, travel dates, questions about the property)…"
                rows={4}
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.6rem' }}>
            <button
              type="submit"
              className="btn-cta"
              disabled={status === 'sending' || status === 'success'}
              style={{
                background: 'var(--warm-gold)',
                color: 'var(--blue)',
                border: 'none',
                padding: '14px 48px',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: status === 'sending' ? 'wait' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
              }}
            >
              {status === 'sending' ? 'Sending…' : status === 'success' ? 'Sent!' : 'Request Viewing'}
            </button>
          </div>

          {status === 'success' && (
            <p className="expert-form-msg success" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              Thank you — we&apos;ll be in touch shortly to confirm your viewing.
            </p>
          )}
          {status === 'error' && errorMsg && (
            <p className="expert-form-msg error" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
              {errorMsg}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
