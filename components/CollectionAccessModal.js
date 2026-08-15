import { useEffect, useState } from 'react';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { getSavedUser, saveUser } from '@/lib/savedUser';

export default function CollectionAccessModal({ onClose }) {
  const saved = getSavedUser();
  const [name, setName] = useState(saved.name || '');
  const [email, setEmail] = useState(saved.email || '');
  const [phone, setPhone] = useState(saved.phone || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    const honeypot = event.currentTarget.elements[HONEYPOT_FIELD]?.value || '';

    try {
      const response = await fetch('/api/unlock-collection/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          collectionTitle: 'The Mosaic Collection',
          collectionSlug: 'mosaic-collection',
          pageUrl: 'https://co-ownership-property.com/collections/mosaic-collection/',
          [HONEYPOT_FIELD]: honeypot,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to send your access link.');

      saveUser({ name: name.trim(), email: email.trim(), phone: phone.trim(), validated: true });
      setStatus('done');
      window.setTimeout(() => {
        if (payload.accessUrl) window.location.assign(payload.accessUrl);
      }, 1100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="collection-access-overlay" onMouseDown={onClose}>
      <div
        className="collection-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-access-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="collection-access-close" onClick={onClose} aria-label="Close">×</button>
        {status === 'done' ? (
          <div className="collection-access-success">
            <span aria-hidden="true">✓</span>
            <h2 id="collection-access-title">Check your inbox</h2>
            <p>Your personal Mosaic Collection link is on its way to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <>
            <p className="collection-access-eyebrow">Private collection access</p>
            <h2 id="collection-access-title">Receive your personal link</h2>
            <p className="collection-access-intro">We’ll email you the complete collection guide, detailed home information and a permanent access link.</p>
            <form onSubmit={submit}>
              <HoneypotField />
              <label>
                Your name
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
              </label>
              <label>
                Phone <span>(optional)</span>
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
              </label>
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send my access link →'}
              </button>
              {error && <p className="collection-access-error" role="alert">{error}</p>}
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .collection-access-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 22px;
          background: rgba(12, 34, 52, 0.72);
          backdrop-filter: blur(7px);
        }
        .collection-access-modal {
          position: relative;
          width: min(100%, 510px);
          padding: 48px;
          background: #fbf8f2;
          color: #18364f;
          box-shadow: 0 28px 90px rgba(10, 30, 45, 0.35);
        }
        .collection-access-close {
          position: absolute;
          top: 12px;
          right: 16px;
          border: 0;
          background: transparent;
          color: #18364f;
          font-size: 32px;
          line-height: 1;
          cursor: pointer;
        }
        .collection-access-eyebrow {
          margin: 0 0 12px;
          color: #c99a37;
          font-family: var(--font-nunito), sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        h2 {
          margin: 0 0 14px;
          font-family: var(--font-playfair), serif;
          font-size: clamp(30px, 5vw, 42px);
          font-weight: 400;
          line-height: 1.12;
        }
        .collection-access-intro,
        .collection-access-success p {
          margin: 0 0 26px;
          color: #607184;
          font-family: var(--font-nunito), sans-serif;
          font-size: 15px;
          line-height: 1.65;
        }
        form { display: grid; gap: 18px; }
        label {
          display: grid;
          gap: 7px;
          font-family: var(--font-nunito), sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        label span { color: #8794a0; font-weight: 600; }
        input {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #cad0d3;
          border-radius: 0;
          padding: 10px 2px 11px;
          background: transparent;
          color: #18364f;
          font: 16px var(--font-nunito), sans-serif;
          outline: none;
        }
        input:focus { border-bottom-color: #c99a37; }
        form button {
          margin-top: 8px;
          border: 0;
          padding: 16px 20px;
          background: #c99a37;
          color: white;
          font-family: var(--font-nunito), sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }
        form button:disabled { opacity: 0.65; cursor: wait; }
        .collection-access-error {
          margin: 0;
          color: #a23b32;
          font: 14px/1.5 var(--font-nunito), sans-serif;
        }
        .collection-access-success { text-align: center; }
        .collection-access-success > span {
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          margin: 0 auto 22px;
          border: 1px solid #c99a37;
          border-radius: 50%;
          color: #c99a37;
          font-size: 30px;
        }
        @media (max-width: 560px) {
          .collection-access-overlay { padding: 12px; }
          .collection-access-modal { padding: 40px 24px 28px; }
        }
      `}</style>
    </div>
  );
}
