import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

const COPY = {
  en: {
    eyebrow: 'Exclusive access',
    heading: 'Floor Plans & More Photos',
    sub: "Enter your details and we'll send the full gallery and floor plans straight to your inbox.",
    name_placeholder: 'Your name',
    email_placeholder: 'Your email address',
    btn_idle: 'Send me the photos →',
    btn_sending: 'Sending…',
    success_heading: 'Check your inbox!',
    success_msg: "We've sent the photos & floor plans to",
    success_redirect: "Opening your gallery… We've also emailed you a permanent link.",
    error: 'Something went wrong. Please try again.',
  },
  es: {
    eyebrow: 'Acceso exclusivo',
    heading: 'Planos y más fotos',
    sub: 'Introduce tus datos y te enviaremos la galería completa y los planos directamente a tu correo electrónico.',
    name_placeholder: 'Tu nombre',
    email_placeholder: 'Tu correo electrónico',
    btn_idle: 'Enviar las fotos →',
    btn_sending: 'Enviando…',
    success_heading: '¡Revisa tu bandeja de entrada!',
    success_msg: 'Hemos enviado las fotos y los planos a',
    success_redirect: 'Abriendo tu galería… También te hemos enviado un enlace permanente por correo.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
  },
  fr: {
    eyebrow: 'Accès exclusif',
    heading: 'Plans et photos supplémentaires',
    sub: 'Renseignez vos coordonnées et nous vous enverrons la galerie complète et les plans directement par email.',
    name_placeholder: 'Votre nom',
    email_placeholder: 'Votre adresse email',
    btn_idle: 'Envoyez-moi les photos →',
    btn_sending: 'Envoi en cours…',
    success_heading: 'Consultez votre boîte mail !',
    success_msg: 'Nous avons envoyé les photos et plans à',
    success_redirect: 'Ouverture de votre galerie… Nous vous avons également envoyé un lien permanent par email.',
    error: "Une erreur s'est produite. Veuillez réessayer.",
  },
  de: {
    eyebrow: 'Exklusiver Zugang',
    heading: 'Grundrisse & weitere Fotos',
    sub: 'Geben Sie Ihre Daten ein und wir senden Ihnen die vollständige Galerie und die Grundrisse direkt in Ihr Postfach.',
    name_placeholder: 'Ihr Name',
    email_placeholder: 'Ihre E-Mail-Adresse',
    btn_idle: 'Fotos zusenden →',
    btn_sending: 'Wird gesendet…',
    success_heading: 'Prüfen Sie Ihr Postfach!',
    success_msg: 'Wir haben die Fotos & Grundrisse gesendet an',
    success_redirect: 'Ihre Galerie wird geöffnet… Wir haben Ihnen außerdem einen dauerhaften Link per E-Mail geschickt.',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  },
};

// URL-safe base64 (matches the ?t= visitor token the gallery emails use).
function toBase64Url(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

function slugFromPropertyUrl(url) {
  if (!url) return '';
  const clean = url.split('?')[0].split('#')[0];
  const m = clean.match(/\/property\/([^/]+)\/?$/);
  return m ? m[1] : '';
}

export default function UnlockModal({ propertyTitle, driveUrl, propertyUrl, propertySlug, propertyCountry, onClose }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  const saved = getSavedUser();
  const [name, setName] = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [status, setStatus] = useState('idle');
  const redirectTimer = useRef(null);

  // The public gallery page lives at /gallery/{slug} (see pages/gallery/[token].js —
  // the ?t= visitor token is optional; the page renders from the slug alone).
  const gallerySlug = propertySlug || slugFromPropertyUrl(propertyUrl);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    try {
      const r = await fetch('/api/unlock-drive/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, propertyTitle, driveUrl, propertyUrl, propertyCountry, locale, [HONEYPOT_FIELD]: honeypot }),
      });
      if (r.ok) {
        saveUser({ name, email });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'floor_plan_unlock',
          property_title: propertyTitle,
          locale,
        });
        track('photos_unlocked', {
          property: propertyTitle,
          country: propertyCountry || 'unspecified',
          locale,
        });
        // Open the gallery right here on the site — the email is the permanent link.
        if (gallerySlug) {
          const tok = toBase64Url(JSON.stringify({ n: name || '', e: email }));
          const params = [];
          if (tok) params.push(`t=${tok}`);
          if (locale !== 'en') params.push(`lang=${locale}`);
          const qs = params.length ? `?${params.join('&')}` : '';
          redirectTimer.current = setTimeout(() => {
            window.location.assign(`/gallery/${gallerySlug}${qs}`);
          }, 1500);
        }
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
            <h3>{t.success_heading}</h3>
            {gallerySlug
              ? <p>{t.success_redirect}</p>
              : <p>{t.success_msg} <strong>{email}</strong>.</p>}
          </div>
        ) : (
          <>
            <p className="ul-eye">{t.eyebrow}</p>
            <h3>{t.heading}</h3>
            <p className="ul-sub">{t.sub}</p>
            <form onSubmit={submit} className="ul-form">
              <HoneypotField />
              <input type="text" placeholder={t.name_placeholder} value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" placeholder={t.email_placeholder} value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.btn_sending : t.btn_idle}</button>
              {status === 'error' && <p className="ul-err">{t.error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
