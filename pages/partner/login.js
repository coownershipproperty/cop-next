import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/partner-hub/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'The secure code could not be sent.');
      setSent(true);
    } catch (sendError) {
      setError(sendError.message);
    }
    setLoading(false);
  }

  async function verify(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    if (verifyError || !data.session) {
      setError(verifyError?.message || 'That code is invalid or has expired.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/partner-hub/session', {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.access?.role !== 'partner') {
      await supabase.auth.signOut();
      setError('This email does not have active partner access.');
      setLoading(false);
      return;
    }
    router.replace('/partner/');
  }

  return (
    <div className="partner-hub-root login-screen">
      <Head><title>Partner sign in | COP</title><meta name="robots" content="noindex,nofollow,noarchive" /></Head>
      <section className="login-brand-panel">
        <div className="brand"><span className="brand-mark">C</span><span><strong>CO-OWNERSHIP</strong><small>PARTNER HUB</small></span></div>
        <div><p className="mini-label">PRIVATE PARTNER WORKSPACE</p><h1>Move every opportunity forward.</h1><p>View assigned leads, update the sales funnel and share progress with Co-Ownership Property in one secure place.</p></div>
        <small>Each login is permanently scoped to one partner organisation.</small>
      </section>
      <section className="login-form-panel">
        {sent ? <form className="partner-login-card" onSubmit={verify}><p className="mini-label">ONE-TIME ACCESS CODE</p><h2>Check your inbox</h2><p>A six-digit code was sent to <strong>{email}</strong>. It can only open the partner workspace assigned to that account.</p>
          <label>Secure sign-in code<input className="otp-input" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" disabled={loading || code.length !== 6}>{loading ? 'Verifying…' : 'Open partner workspace →'}</button>
          <button type="button" className="login-secondary" onClick={() => { setSent(false); setCode(''); setError(''); }}>Use a different email</button>
        </form> : <form onSubmit={signIn}>
          <p className="mini-label">WELCOME BACK</p><h2>Partner sign in</h2><p>Use the individual email address invited by COP. Shared passwords are not supported.</p>
          <label>Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@partner.com" /></label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" disabled={loading}>{loading ? 'Sending…' : 'Send secure sign-in code →'}</button>
          <small className="demo-note">If your email has not been invited, no workspace access will be created.</small>
        </form>}
      </section>
    </div>
  );
}
