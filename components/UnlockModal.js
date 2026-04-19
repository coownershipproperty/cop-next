import { useState } from 'react';
import { trackConversion } from '@/lib/gtag';
import { getSavedUser, saveUser } from '@/lib/savedUser';

export default function UnlockModal({ propertyTitle, driveUrl, onClose }) {
  const saved = getSavedUser();
  const [name, setName] = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [status, setStatus] = useState('idle');

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    try {
      const r = await fetch('/api/unlock-drive/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, propertyTitle, driveUrl }),
      });
      if (r.ok) {
        saveUser({ name, email });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'floor_plan_unlock',
          property_title: propertyTitle,
        });
      }
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
