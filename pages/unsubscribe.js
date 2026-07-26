/**
 * /unsubscribe — public one-click unsubscribe page.
 *
 * Every email footer links here as /unsubscribe/?e={email}&t={token}
 * (see lib/unsub.js). On load the page POSTs the pair to /api/unsubscribe,
 * which verifies the HMAC token, writes the `suppressions` row and cancels
 * anything still pending in email_queue.
 *
 * Older, already-sent emails link here with ?email= and no token — those
 * can't be verified, so they get a polite mailto fallback instead of a 404
 * (which is what this page replaced).
 *
 * NOTE (26 Jul 2026): that fallback was doing far more work than intended.
 * Five live senders — including lib/newsletter/render.js, which built the
 * footer for every newsletter — were still emitting the tokenless form, so
 * 2,671 marketing emails to 742 people carried a link that landed on the
 * 'legacy' message and unsubscribed nobody: 2,241 newsletters (four campaigns,
 * 20 May – 7 Jul), 372 new-listings digests (27 Apr) and 58 welcome emails
 * (26 Apr – 22 Jul, i.e. still going out four days before this was found).
 * The suppressions table confirms it — every row in it was written by hand;
 * not one came from this page. All five senders now use unsubUrl(). If you
 * see the 'legacy' state in the wild from here on it really is an old email —
 * grep for `/unsubscribe/?email=` before assuming so.
 *
 * Standalone and minimal on purpose (like /gallery): no header, no footer,
 * no newsletter form — nobody arriving here wants another signup box.
 */
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const CONTACT = 'info@co-ownership-property.com';

const s = {
  page: {
    minHeight: '100vh',
    background: '#F5F2EC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: 'var(--font-nunito), "Nunito Sans", system-ui, sans-serif',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #e8e0d4',
    borderTop: '2px solid #C9A84C',
    maxWidth: 520,
    width: '100%',
    padding: '52px 40px 46px',
    textAlign: 'center',
  },
  eyebrow: {
    margin: '0 0 14px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#C9A84C',
  },
  title: {
    margin: '0 0 16px',
    fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
    fontWeight: 400,
    fontSize: 30,
    lineHeight: 1.25,
    color: '#1a2533',
  },
  body: {
    margin: '0 auto',
    maxWidth: 400,
    fontSize: 15,
    lineHeight: 1.7,
    color: '#5a6a7a',
  },
  quiet: {
    margin: '26px auto 0',
    maxWidth: 400,
    fontSize: 13,
    lineHeight: 1.6,
    color: '#8a94a0',
  },
  link: { color: '#C9A84C', textDecoration: 'underline' },
  home: {
    display: 'inline-block',
    marginTop: 30,
    fontSize: 13,
    letterSpacing: '0.04em',
    color: '#2C4A5E',
    textDecoration: 'none',
    borderBottom: '1px solid #e8e0d4',
    paddingBottom: 2,
  },
};

export default function Unsubscribe() {
  const router = useRouter();
  const fired = useRef(false);
  // 'working' | 'done' | 'legacy' | 'invalid' | 'error'
  const [state, setState] = useState('working');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!router.isReady || fired.current) return;
    fired.current = true;

    const e = typeof router.query.e === 'string' ? router.query.e.trim()
      : typeof router.query.email === 'string' ? router.query.email.trim() // legacy links
      : '';
    const t = typeof router.query.t === 'string' ? router.query.t.trim() : '';
    setEmail(e);

    if (!e) { setState('invalid'); return; }
    if (!t) { setState('legacy'); return; }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, token: t }),
    })
      .then((r) => {
        if (r.ok) setState('done');
        else if (r.status === 400) setState('invalid');
        else setState('error');
      })
      .catch(() => setState('error'));
  }, [router.isReady, router.query]);

  const who = email || 'my email address';
  const removeMailto = `mailto:${CONTACT}?subject=${encodeURIComponent('Unsubscribe')}&body=${encodeURIComponent(`Please unsubscribe ${who} from all emails.`)}`;
  const resubMailto = `mailto:${CONTACT}?subject=${encodeURIComponent('Please re-subscribe me')}&body=${encodeURIComponent(`Please add ${who} back to your emails.`)}`;

  return (
    <>
      <Head>
        <title>Unsubscribe | Co-Ownership Property</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.eyebrow}>Email preferences</p>

          {state === 'working' && (
            <>
              <h1 style={s.title}>One moment&hellip;</h1>
              <p style={s.body}>Updating your email preferences.</p>
            </>
          )}

          {state === 'done' && (
            <>
              <h1 style={s.title}>You&rsquo;re unsubscribed</h1>
              <p style={s.body}>
                You won&rsquo;t hear from us again
                {email ? <> — <strong style={{ color: '#1a2533', fontWeight: 600 }}>{email}</strong> has been removed from all our emails.</> : '.'}
              </p>
              <p style={s.quiet}>
                Unsubscribed by mistake?{' '}
                <a href={resubMailto} style={s.link}>Let us know</a>
                {' '}and we&rsquo;ll add you back.
              </p>
            </>
          )}

          {state === 'legacy' && (
            <>
              <h1 style={s.title}>Nearly there</h1>
              <p style={s.body}>
                This link came from an older email, so we can&rsquo;t unsubscribe you
                automatically. Send us a quick note and we&rsquo;ll remove
                {email ? <> <strong style={{ color: '#1a2533', fontWeight: 600 }}>{email}</strong></> : ' you'} straight away.
              </p>
              <p style={s.quiet}>
                <a href={removeMailto} style={s.link}>Email us to unsubscribe</a>
              </p>
            </>
          )}

          {state === 'invalid' && (
            <>
              <h1 style={s.title}>This link isn&rsquo;t quite right</h1>
              <p style={s.body}>
                The unsubscribe link looks incomplete. Send us a quick note instead
                and we&rsquo;ll take you off the list straight away.
              </p>
              <p style={s.quiet}>
                <a href={removeMailto} style={s.link}>Email us to unsubscribe</a>
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <h1 style={s.title}>Something went wrong</h1>
              <p style={s.body}>
                We couldn&rsquo;t update your preferences just now. Please{' '}
                <a href="" onClick={(ev) => { ev.preventDefault(); window.location.reload(); }} style={s.link}>try again</a>
                {' '}in a moment, or{' '}
                <a href={removeMailto} style={s.link}>email us</a>
                {' '}and we&rsquo;ll take care of it.
              </p>
            </>
          )}

          <a href="https://co-ownership-property.com" style={s.home}>co-ownership-property.com</a>
        </div>
      </div>
    </>
  );
}
