import { useState } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

// Locale-specific copy. Kept inline rather than in messages/*.json because the
// strings here are tightly coupled to this single component's UX states
// (idle / sending / success / error) — easier to keep them collocated.
const COPY = {
  en: {
    heading: 'Be The First To Know',
    subtitle: 'Join our community for exclusive listings and destination insights delivered straight to your inbox.',
    placeholder: 'Enter your email address',
    phone_placeholder: 'Phone number (optional)',
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
    phone_placeholder: 'Teléfono (opcional)',
    button_idle: 'Suscribirme',
    button_sending: 'Enviando…',
    button_success: '¡Suscrito!',
    msg_success: '¡Gracias por suscribirte!',
    msg_error: 'Algo salió mal. Inténtalo de nuevo.',
    msg_network: 'Error de red. Inténtalo de nuevo.',
  },
  fr: {
    heading: 'Soyez les premiers informés',
    subtitle: 'Rejoignez notre communauté pour recevoir notre offre exclusive et nos analyses de destinations directement dans votre boîte mail.',
    placeholder: 'Votre adresse email',
    phone_placeholder: 'Téléphone (facultatif)',
    button_idle: "M'inscrire",
    button_sending: 'Envoi en cours…',
    button_success: 'Inscrit !',
    msg_success: 'Merci pour votre inscription !',
    msg_error: "Une erreur s'est produite. Veuillez réessayer.",
    msg_network: 'Erreur réseau. Veuillez réessayer.',
  },
  de: {
    heading: 'Erfahren Sie es als Erste(r)',
    subtitle: 'Werden Sie Teil unserer Community und erhalten Sie exklusive Immobilien sowie Reiseziel-Analysen direkt in Ihr Postfach.',
    placeholder: 'Ihre E-Mail-Adresse',
    phone_placeholder: 'Telefonnummer (optional)',
    button_idle: 'Newsletter abonnieren',
    button_sending: 'Wird gesendet…',
    button_success: 'Abonniert!',
    msg_success: 'Vielen Dank für Ihr Abonnement!',
    msg_error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    msg_network: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
  },
  it: {
    heading: 'Scoprilo prima degli altri',
    subtitle: 'Entra nella nostra community e ricevi immobili esclusivi e analisi sulle destinazioni direttamente nella tua casella di posta.',
    placeholder: 'Il tuo indirizzo email',
    phone_placeholder: 'Numero di telefono (facoltativo)',
    button_idle: 'Iscriviti alla newsletter',
    button_sending: 'Iscrizione in corso…',
    button_success: 'Iscrizione completata!',
    msg_success: 'Grazie per l\'iscrizione!',
    msg_error: 'Si è verificato un errore. Riprova.',
    msg_network: 'Errore di rete. Riprova.',
  },
  nl: {
    heading: 'Weet het als eerste',
    subtitle: 'Word deel van onze community en ontvang exclusieve woningen en bestemmingsanalyses rechtstreeks in uw inbox.',
    placeholder: 'Uw e-mailadres',
    phone_placeholder: 'Telefoonnummer (optioneel)',
    button_idle: 'Nieuwsbrief ontvangen',
    button_sending: 'Verzenden…',
    button_success: 'Aangemeld!',
    msg_success: 'Bedankt voor uw aanmelding!',
    msg_error: 'Er is iets misgegaan. Probeer het opnieuw.',
    msg_network: 'Netwerkfout. Probeer het opnieuw.',
  },
  pt: {
    heading: 'Seja o primeiro a saber',
    subtitle: 'Faça parte da nossa comunidade e receba imóveis exclusivos e análises de destinos direto no seu e-mail.',
    placeholder: 'Seu e-mail',
    phone_placeholder: 'Telefone (opcional)',
    button_idle: 'Assinar newsletter',
    button_sending: 'Enviando…',
    button_success: 'Inscrito!',
    msg_success: 'Obrigado por se inscrever!',
    msg_error: 'Algo deu errado. Tente novamente.',
    msg_network: 'Erro de conexão. Tente novamente.',
  },
  sv: {
    heading: 'Var först med att veta',
    subtitle: 'Gå med i vår community och få exklusiva objekt och destinationsanalyser direkt i din inkorg.',
    placeholder: 'Din e-postadress',
    phone_placeholder: 'Telefonnummer (valfritt)',
    button_idle: 'Prenumerera',
    button_sending: 'Skickar…',
    button_success: 'Prenumeration klar!',
    msg_success: 'Tack för din prenumeration!',
    msg_error: 'Något gick fel. Försök igen.',
    msg_network: 'Nätverksfel. Försök igen.',
  },
  da: {
    heading: 'Vær den første, der ved det',
    subtitle: 'Bliv en del af vores fællesskab, og få eksklusive boliger og indsigt om destinationerne direkte i din indbakke.',
    placeholder: 'Din e-mailadresse',
    phone_placeholder: 'Telefonnummer (valgfrit)',
    button_idle: 'Tilmeld nyhedsbrev',
    button_sending: 'Sender…',
    button_success: 'Tilmeldt!',
    msg_success: 'Tak for din tilmelding!',
    msg_error: 'Der opstod en fejl. Prøv venligst igen.',
    msg_network: 'Netværksfejl. Prøv venligst igen.',
  },
  no: {
    heading: 'Vær først ute',
    subtitle: 'Bli med i fellesskapet vårt og få eksklusive boliger og destinasjonsanalyser rett i innboksen.',
    placeholder: 'Din e-postadresse',
    phone_placeholder: 'Telefonnummer (valgfritt)',
    button_idle: 'Abonner på nyhetsbrevet',
    button_sending: 'Sender…',
    button_success: 'Abonnert!',
    msg_success: 'Takk for at du abonnerer!',
    msg_error: 'Noe gikk galt. Prøv igjen.',
    msg_network: 'Nettverksfeil. Prøv igjen.',
  },
};

export default function Newsletter() {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  const savedUser = getSavedUser();
  const [email, setEmail] = useState(savedUser.email);
  // Optional, never required — the same field, copy and behaviour as the
  // gallery unlock. A newsletter subscriber with a number is a lead a partner
  // will accept; one without is a name on a list.
  const [phone, setPhone] = useState(savedUser.phone || '');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [msg, setMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    if (!email) return;
    const sendPhone = String(phone || '').trim();

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: sendPhone, locale, [HONEYPOT_FIELD]: honeypot }),
      });
      const data = await res.json();
      if (data.ok) {
        saveUser({ email, phone: sendPhone });
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
        <HoneypotField />
        <input type="email" name="email" placeholder={t.placeholder} required value={email} onChange={e => setEmail(e.target.value)} />
        <input type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder={t.phone_placeholder} value={phone} onChange={e => setPhone(e.target.value)} />
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
