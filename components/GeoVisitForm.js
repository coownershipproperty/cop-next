/**
 * components/GeoVisitForm.js
 *
 * Compact form shown at the top of /our-homes/?country=...&region=...&fromGeo=1
 * after a visitor clicks the bottom-right "{Destination} live viewing" chip.
 *
 * Reads:
 *   "I'm in Mallorca and I'd like to organise a viewing"
 *   [name]  [email]  [phone]                     [Request a viewing →]
 *
 * Posts to /api/enquiry (the existing CRM pipeline — handles contact upsert,
 * lead create, team notification + Resend auto-reply) with destination
 * pre-baked into property/message fields so the team knows it's a geo-visit
 * request, not a generic enquiry.
 *
 * Success state: "We'll get in touch soon to organise the viewing!"
 */
import { useState } from 'react';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

export default function GeoVisitForm({ destination }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(''); // optional — visitor can leave it blank
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

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
    if (!phone.trim()) {
      setStatus('error');
      setErrorMsg('Please add a phone number so we can organise the viewing quickly.');
      return;
    }

    setStatus('sending');

    const propertyTitle = `Live visit request — ${destination}`;
    const url = `https://co-ownership-property.com/our-homes/?country=&region=${encodeURIComponent(destination)}&fromGeo=1`;
    const userNote = message.trim();
    const fullMessage = [
      `LIVE GEO-VISIT REQUEST`,
      `Detected destination: ${destination}`,
      `Phone: ${phone}`,
      '',
      `Visitor is currently in or near ${destination} and wants to organise a viewing while in town.`,
      userNote ? '' : null,
      userNote ? `Their note:` : null,
      userNote ? userNote : null,
    ].filter(line => line !== null).join('\n');

    try {
      const payload = {
        name,
        email,
        phone,
        property: propertyTitle,
        url,
        message: fullMessage,
        source: 'geo-visit',
        destination,
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
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <section className="geo-visit-form geo-visit-form--success">
        <div className="geo-visit-form-inner">
          <div className="geo-visit-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="geo-visit-success-title">We&apos;ll get in touch soon to organise the viewing!</h2>
            <p className="geo-visit-success-sub">In the meantime, browse the homes nearby below — let us know which one catches your eye and we&apos;ll prioritise it for your viewing.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="geo-visit-form">
      <div className="geo-visit-form-inner">
        <div className="geo-visit-form-header">
          <span className="geo-visit-form-pulse" aria-hidden="true">
            <span className="geo-visit-form-pulse-ring" />
            <span className="geo-visit-form-pulse-core" />
          </span>
          <div>
            <p className="geo-visit-form-eyebrow">Live viewing</p>
            <h2 className="geo-visit-form-title">
              I&apos;m in <em>{destination}</em> — organise a viewing
            </h2>
          </div>
        </div>

        <form className="geo-visit-form-fields" onSubmit={handleSubmit} noValidate>
          <HoneypotField />
          <div className="geo-visit-field">
            <label htmlFor="gvf-name">Name</label>
            <input
              id="gvf-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>
          <div className="geo-visit-field">
            <label htmlFor="gvf-email">Email</label>
            <input
              id="gvf-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="geo-visit-field">
            <label htmlFor="gvf-phone">Phone</label>
            <input
              id="gvf-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+34, +44, +33…"
              autoComplete="tel"
              required
            />
          </div>
          {/* Optional message — full-width row below the three required fields,
              shares the row with the submit button on desktop, stacks above
              the button on mobile. */}
          <div className="geo-visit-field geo-visit-field--message">
            <label htmlFor="gvf-message">
              Message <span className="geo-visit-optional">(optional)</span>
            </label>
            <textarea
              id="gvf-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Anything we should know — date range, properties you're curious about, group size…"
              rows={3}
            />
          </div>
          <div className="geo-visit-submit-wrap">
            <button
              type="submit"
              className="geo-visit-submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : 'Request viewing →'}
            </button>
          </div>
        </form>

        {status === 'error' && errorMsg && (
          <p className="geo-visit-error">{errorMsg}</p>
        )}
        <p className="geo-visit-footnote">We&apos;ll call or email within a few hours — usually faster.</p>
      </div>
    </section>
  );
}
