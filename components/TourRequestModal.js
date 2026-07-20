import { useState } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

// "Request 3D Tour" popup — mirrors the floor-plan-request flow (UnlockModal →
// /api/unlock-drive), posting to /api/tour-request instead. The tour itself is
// NEVER embedded or linked on the site: the team delivers it by email after
// registering the lead. No partner names, no tour URLs, anywhere public.
const COPY = {
  en: {
    eyebrow: 'Virtual viewing',
    heading: 'Request a 3D Tour',
    sub: "Leave your details and we'll send a full 3D walkthrough of this home straight to your inbox.",
    name_placeholder: 'Your name',
    email_placeholder: 'Your email address',
    phone_placeholder: 'Your phone number',
    btn_idle: 'Request 3D tour →',
    btn_sending: 'Sending…',
    success_heading: 'Request received!',
    success_msg: "We're preparing your 3D walkthrough and will email it to",
    error: 'Something went wrong. Please try again.',
    error_domain: "That email domain doesn't seem to exist — double-check the spelling?",
  },
  es: {
    eyebrow: 'Visita virtual',
    heading: 'Solicita un tour 3D',
    sub: 'Déjanos tus datos y te enviaremos un recorrido 3D completo de esta casa directamente a tu correo.',
    name_placeholder: 'Tu nombre',
    email_placeholder: 'Tu correo electrónico',
    phone_placeholder: 'Tu teléfono',
    btn_idle: 'Solicitar tour 3D →',
    btn_sending: 'Enviando…',
    success_heading: '¡Solicitud recibida!',
    success_msg: 'Estamos preparando tu recorrido 3D y lo enviaremos a',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    error_domain: 'Ese dominio de correo no parece existir — ¿revisas la ortografía?',
  },
  fr: {
    eyebrow: 'Visite virtuelle',
    heading: 'Demander une visite 3D',
    sub: 'Laissez vos coordonnées et nous vous enverrons une visite 3D complète de cette maison directement par email.',
    name_placeholder: 'Votre nom',
    email_placeholder: 'Votre adresse email',
    phone_placeholder: 'Votre téléphone',
    btn_idle: 'Demander la visite 3D →',
    btn_sending: 'Envoi en cours…',
    success_heading: 'Demande reçue !',
    success_msg: 'Nous préparons votre visite 3D et vous l’enverrons à',
    error: "Une erreur s'est produite. Veuillez réessayer.",
    error_domain: "Ce domaine email ne semble pas exister — vérifiez l'orthographe ?",
  },
  de: {
    eyebrow: 'Virtuelle Besichtigung',
    heading: '3D-Rundgang anfragen',
    sub: 'Hinterlassen Sie Ihre Daten und wir senden Ihnen einen vollständigen 3D-Rundgang durch dieses Zuhause direkt in Ihr Postfach.',
    name_placeholder: 'Ihr Name',
    email_placeholder: 'Ihre E-Mail-Adresse',
    phone_placeholder: 'Ihre Telefonnummer',
    btn_idle: '3D-Rundgang anfragen →',
    btn_sending: 'Wird gesendet…',
    success_heading: 'Anfrage erhalten!',
    success_msg: 'Wir bereiten Ihren 3D-Rundgang vor und senden ihn an',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    error_domain: 'Diese E-Mail-Domain scheint nicht zu existieren — bitte prüfen Sie die Schreibweise.',
  },
};

export default function TourRequestModal({ propertyTitle, propertyUrl, propertySlug, propertyCountry, onClose }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  const saved = getSavedUser();
  const [name, setName]   = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    setStatus('sending'); setErrMsg('');
    try {
      const r = await fetch('/api/tour-request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(name || '').trim(),
          email: String(email || '').trim(),
          phone: String(phone || '').trim(),
          propertyTitle, propertyUrl, propertySlug,
          propertyCountry, locale, [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (r.ok) {
        saveUser({ name: String(name || '').trim(), email: String(email || '').trim() });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'tour_request',
          property_title: propertyTitle,
          locale,
        });
        track('tour_requested', {
          property: propertyTitle,
          country: propertyCountry || 'unspecified',
          locale,
        });
        setStatus('done');
        return;
      }
      let j = null;
      try { j = await r.json(); } catch { /* non-JSON error body */ }
      if (j && j.code === 'bad_domain') {
        setStatus('error');
        setErrMsg(t.error_domain);
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="ul-overlay" onClick={onClose}>
      <div className="ul-modal" onClick={e => e.stopPropagation()}>
        <button className="ul-close" onClick={onClose}>×</button>
        {status === 'done' ? (
          <div className="ul-success">
            <div className="ul-tick">✓</div>
            <h3>{t.success_heading}</h3>
            <p>{t.success_msg} <strong>{email}</strong>.</p>
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
              <input type="tel" placeholder={t.phone_placeholder} value={phone} onChange={e => setPhone(e.target.value)} required />
              <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.btn_sending : t.btn_idle}</button>
              {(status === 'error' || errMsg) && <p className="ul-err">{errMsg || t.error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
