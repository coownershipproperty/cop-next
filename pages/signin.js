import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { saveUser } from '@/lib/savedUser';

/**
 * /signin — email only, no password, no phone.
 *
 * Two states in one page. Arrive with no query and you get a field: give us
 * the address, we send a link. Arrive with ?k= and the page spends the token,
 * sets the visitor cookie, writes the same localStorage identity the unlock
 * form has always written, and sends you on.
 *
 * The point is not accounts. It is that somebody who unlocked a gallery on
 * their laptop should not have to do it again on their phone.
 */
export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');   // idle | sending | sent | verifying | error
  const [error, setError] = useState('');

  // ?k= — spend the token, then leave.
  useEffect(() => {
    if (!router.isReady) return;
    const k = router.query.k;
    if (!k) return;
    setState('verifying');
    fetch('/api/signin/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ k }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) throw new Error(data.error || 'That link did not work.');
        // The unlock flow reads this, and has since long before sign-in
        // existed. Verified by a link we signed, so it may confer `validated`
        // — which the forgeable ?t= token never may.
        saveUser({ email: data.email, name: data.name, validated: true });
        const next = typeof router.query.next === 'string' && router.query.next.startsWith('/')
          ? router.query.next
          : '/our-homes/';
        router.replace(next);
      })
      .catch((e) => { setError(e.message); setState('error'); });
  }, [router.isReady, router.query.k]);   // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending'); setError('');
    try {
      const r = await fetch('/api/signin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          next: typeof router.query.next === 'string' ? router.query.next : undefined,
          website: e.target.website ? e.target.website.value : '',
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'That did not work.');
      setState('sent');
    } catch (err) {
      setError(err.message); setState('error');
    }
  }

  const verifying = state === 'verifying';

  return (
    <>
      <Head>
        <title>Sign in | Co-Ownership Property</title>
        {/* Nothing here belongs in an index: it is a form and a token. */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="signin-wrap">
        <div className="signin-card">
          {verifying ? (
            <>
              <h1>Signing you in&hellip;</h1>
              <p className="signin-sub">One moment.</p>
            </>
          ) : state === 'sent' ? (
            <>
              <h1>Check your email</h1>
              <p className="signin-sub">
                We have sent a link to <strong>{email.trim()}</strong>. It works for the next
                thirty minutes. If it does not arrive, look in your spam folder &mdash; and if it
                is not there either, reply to any email from us and a person will sort it out.
              </p>
            </>
          ) : (
            <>
              <h1>Sign in</h1>
              <p className="signin-sub">
                Your email address, and nothing else. We send you a link; opening it keeps the
                galleries you have already unlocked open, and carries your saved homes between
                your phone and your laptop. No password to invent or forget.
              </p>
              <form onSubmit={submit} className="signin-form">
                <label htmlFor="signin-email">Email address</label>
                <input
                  id="signin-email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
                <button type="submit" disabled={state === 'sending'}>
                  {state === 'sending' ? 'Sending&hellip;' : 'Email me a link'}
                </button>
              </form>
              <p className="signin-fine">
                We will not send you anything else because you signed in, and there is no password
                to lose. If you would rather not, everything on the site works without this.
              </p>
            </>
          )}

          {error && <p className="signin-error" role="alert">{error}</p>}
        </div>
      </section>

      <Footer />
    </>
  );
}
