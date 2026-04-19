import { useState } from 'react';
import { trackConversion } from '@/lib/gtag';
import { getSavedUser, saveUser } from '@/lib/savedUser';

export default function Newsletter() {
  const [email, setEmail] = useState(getSavedUser().email);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [msg, setMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        saveUser({ email });
        setStatus('success');
        setMsg('Thank you for subscribing!');
        trackConversion('sign_up', 'Lead', { method: 'newsletter' });
      } else {
        setStatus('error');
        setMsg('Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  }

  return (
    <section className="newsletter-section" id="newsletter">
      <h2 className="newsletter-heading">Be The First To Know</h2>
      <p className="newsletter-subtitle">Join our community for exclusive listings and destination insights delivered straight to your inbox.</p>
      <form className="newsletter-form" id="cop-newsletter-form" onSubmit={handleSubmit} noValidate>
        <input type="email" name="email" placeholder="Enter your email address" required value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="newsletter-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Subscribing…' : status === 'success' ? 'Subscribed!' : 'Join Newsletter'}
        </button>
      </form>
      {msg && (
        <p className={`newsletter-form-msg${status === 'success' ? ' success' : ' error'}`}>{msg}</p>
      )}
    </section>
  );
}
