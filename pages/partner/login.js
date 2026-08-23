import Head from 'next/head';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/partner/`,
      },
    });
    if (signInError) setError(signInError.message);
    else setSent(true);
    setLoading(false);
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
        {sent ? <div className="partner-login-card"><p className="mini-label">SECURE MAGIC LINK</p><h2>Check your inbox</h2><p>A private sign-in link was sent to <strong>{email}</strong>. It can only open the partner workspace assigned to that account.</p><button type="button" className="login-button" onClick={() => setSent(false)}>Use a different email</button></div> : <form onSubmit={signIn}>
          <p className="mini-label">WELCOME BACK</p><h2>Partner sign in</h2><p>Use the individual email address invited by COP. Shared passwords are not supported.</p>
          <label>Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@partner.com" /></label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" disabled={loading}>{loading ? 'Sending…' : 'Send secure sign-in link →'}</button>
          <small className="demo-note">If your email has not been invited, no workspace access will be created.</small>
        </form>}
      </section>
    </div>
  );
}
