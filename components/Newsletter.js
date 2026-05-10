import { useState } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';

// Locale-specific copy. Kept inline rather than in messages/*.json because the
// strings here are tightly coupled to this single component's UX states
// (idle / sending / success / error) — easier to keep them collocated.
const COPY = {
  en: {
    heading: 'Be The First To Know',
    subtitle: 'Join our community for exclusive listings and destination insights delivered straight to your inbox.',
    placeholder: 'Enter your email address',
    button_idle: 'Join Newsletter',
    button_sending: 'Subscribing…',
    button_success: 'Subscribed!',
    msg_success: 'Thank you for subscribing!',
    msg_error: 'Something went wrong. Please try again.',
    msg_network: 'Network error. Please try again.',
  },
  es: {
    heading: 'Sé el primero en enterarte',
    subtitle: 'Únete a nuestra comunidad para recibir propiedades exclusivas y análisis de destinos directamente en tu bandeja de entrada.',
    placeholder: 'Tu correo electrónico',
    button_idle: 'Suscribirme',
    button_sending: 'Enviando…',
    button_success: '¡Suscrito!',
    msg_success: '¡Gracias por suscribirte!',
    msg_error: 'Algo salió mal. Inténtalo de nuevo.',
    msg_network: 'Error de red. Inténtalo de nuevo.',
  },
  fr: {
    heading: 'Soyez les premiers informés',
    subtitle: 'Rejoignez notre communauté pour recevoir nos propriétés exclusives et analyses de destinations directement dans votre boîte mail.',
    placeholder: 'Votre adresse email',
    button_idle: "M'inscrire",
    button_sending: 'Envoi en cours…',
    button_success: 'Inscrit !',
    msg_success: 'Merci pour votre inscription !',
    msg_error: "Une erreur s'est produite. Veuillez réessayer.",
    msg_network: 'Erreur réseau. Veuillez réessayer.',
  },
};

export default function Newsletter() {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

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
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json();
      if (data.ok) {
        saveUser({ email });
        setStatus('success');
        setMsg(t.msg_success);
        trackConversion('sign_up', 'Lead', { method: 'newsletter', locale });
        track('newsletter_signup', { locale });
      } else {
        setStatus('error');
        setMsg(t.msg_error);
      }
    } catch {
      setStatus('error');
      setMsg(t.msg_network);
    }
  }

  return (
    <section className="newsletter-section" id="newsletter">
      <h2 className="newsletter-heading">{t.heading}</h2>
      <p className="newsletter-subtitle">{t.subtitle}</p>
      <form className="newsletter-form" id="cop-newsletter-form" onSubmit={handleSubmit} noValidate>
        <input type="email" name="email" placeholder={t.placeholder} required value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="newsletter-btn" disabled={status === 'sending'}>
          {status === 'sending' ? t.button_sending : status === 'success' ? t.button_success : t.button_idle}
        </button>
      </form>
      {msg && (
        <p className={`newsletter-form-msg${status === 'success' ? ' success' : ' error'}`}>{msg}</p>
      )}
    </section>
  );
}
