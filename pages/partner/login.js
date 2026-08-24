import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.session) {
      setError('Email or password not recognised.');
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
        <form className="partner-login-card" onSubmit={signIn}>
          <p className="mini-label">WELCOME BACK</p><h2>Partner sign in</h2><p>Use the individual email address invited by COP. Shared passwords are not supported.</p>
          <label>Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@partner.com" /></label>
          <label>Password<span className="password-field"><input required minLength={10} autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" disabled={loading}>{loading ? 'Signing in…' : 'Open partner workspace →'}</button>
          <small className="login-note">Access is restricted to the partner organisation assigned to this account.</small>
        </form>
      </section>
    </div>
  );
}
