import { useState } from 'react';

export default function Newsletter() {
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [msg, setMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        setMsg('Thank you for subscribing!');
        e.target.reset();
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
        <input type="email" name="email" placeholder="Enter your email address" required />
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
