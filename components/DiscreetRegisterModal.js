import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { getFirstTouch } from '@/lib/attribution';
import { localeFromPath, propertyHref } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

/**
 * Discreet ("Private Sale") homes — register-to-receive-details popup.
 *
 * Opens when a discreet listing card is clicked (instead of navigating to the
 * property page). Photo on the left, short form on the right, no consent
 * tick-box (David, 9 Sep 2026). Submits to the normal /api/enquiry endpoint so
 * the lead lands in the CRM exactly like any other property enquiry: contact +
 * lead + Dylan's auto-reply + team notification + the hourly reply drafter.
 * Nothing partner-identifying is ever shown or sent from here.
 */

const COPY = {
  en: {
    eyebrow: 'Private sale',
    heading: 'Register to receive details',
    sub: 'This home is offered discreetly. Leave your details and Dylan will send you the full presentation, pricing and availability personally.',
    first_name: 'First name', last_name: 'Last name', email: 'Email address', phone: 'Phone (optional)',
    btn_idle: 'Register →', btn_sending: 'Sending…',
    fine: 'No mailing lists — one personal reply about this home.',
    success_heading: 'Thank you — you\'re registered',
    success_msg: 'Dylan will be in touch shortly with the full details for',
    view_home: 'View the home →',
    error: 'Something went wrong. Please try again.',
  },
  es: {
    eyebrow: 'Venta privada',
    heading: 'Regístrate para recibir los detalles',
    sub: 'Esta vivienda se ofrece de forma discreta. Déjanos tus datos y Dylan te enviará personalmente la presentación completa, precios y disponibilidad.',
    first_name: 'Nombre', last_name: 'Apellidos', email: 'Correo electrónico', phone: 'Teléfono (opcional)',
    btn_idle: 'Registrarme →', btn_sending: 'Enviando…',
    fine: 'Sin listas de correo — una única respuesta personal sobre esta vivienda.',
    success_heading: 'Gracias — ya estás registrado',
    success_msg: 'Dylan se pondrá en contacto contigo en breve con todos los detalles de',
    view_home: 'Ver la vivienda →',
    error: 'Algo salió mal. Inténtalo de nuevo.',
  },
  fr: {
    eyebrow: 'Vente privée',
    heading: 'Inscrivez-vous pour recevoir les détails',
    sub: 'Ce bien est proposé en toute discrétion. Laissez vos coordonnées et Dylan vous enverra personnellement la présentation complète, les prix et les disponibilités.',
    first_name: 'Prénom', last_name: 'Nom', email: 'Adresse email', phone: 'Téléphone (facultatif)',
    btn_idle: 'M\'inscrire →', btn_sending: 'Envoi en cours…',
    fine: 'Aucune liste de diffusion — une seule réponse personnelle au sujet de ce bien.',
    success_heading: 'Merci — vous êtes inscrit',
    success_msg: 'Dylan vous contactera très prochainement avec tous les détails de',
    view_home: 'Voir le bien →',
    error: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
  de: {
    eyebrow: 'Privatverkauf',
    heading: 'Registrieren Sie sich für alle Details',
    sub: 'Dieses Objekt wird diskret angeboten. Hinterlassen Sie Ihre Daten und Dylan sendet Ihnen persönlich die vollständige Präsentation, Preise und Verfügbarkeit.',
    first_name: 'Vorname', last_name: 'Nachname', email: 'E-Mail-Adresse', phone: 'Telefon (optional)',
    btn_idle: 'Registrieren →', btn_sending: 'Wird gesendet…',
    fine: 'Keine Mailinglisten — eine persönliche Antwort zu diesem Objekt.',
    success_heading: 'Vielen Dank — Sie sind registriert',
    success_msg: 'Dylan meldet sich in Kürze mit allen Details zu',
    view_home: 'Objekt ansehen →',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  },
  it: {
    eyebrow: 'Vendita privata',
    heading: 'Registrati per ricevere i dettagli',
    sub: 'Questa casa è proposta con discrezione. Lascia i tuoi dati e Dylan ti invierà personalmente la presentazione completa, i prezzi e la disponibilità.',
    first_name: 'Nome', last_name: 'Cognome', email: 'Indirizzo email', phone: 'Telefono (facoltativo)',
    btn_idle: 'Registrati →', btn_sending: 'Invio in corso…',
    fine: 'Nessuna mailing list — una sola risposta personale su questa casa.',
    success_heading: 'Grazie — sei registrato',
    success_msg: 'Dylan ti contatterà a breve con tutti i dettagli di',
    view_home: 'Vedi la casa →',
    error: 'Qualcosa è andato storto. Riprova.',
  },
  nl: {
    eyebrow: 'Privéverkoop',
    heading: 'Registreer om de details te ontvangen',
    sub: 'Deze woning wordt discreet aangeboden. Laat uw gegevens achter en Dylan stuurt u persoonlijk de volledige presentatie, prijzen en beschikbaarheid.',
    first_name: 'Voornaam', last_name: 'Achternaam', email: 'E-mailadres', phone: 'Telefoon (optioneel)',
    btn_idle: 'Registreren →', btn_sending: 'Versturen…',
    fine: 'Geen mailinglijsten — één persoonlijk antwoord over deze woning.',
    success_heading: 'Bedankt — u bent geregistreerd',
    success_msg: 'Dylan neemt binnenkort contact met u op met alle details van',
    view_home: 'Bekijk de woning →',
    error: 'Er is iets misgegaan. Probeer het opnieuw.',
  },
  pt: {
    eyebrow: 'Venda privada',
    heading: 'Registe-se para receber os detalhes',
    sub: 'Esta casa é apresentada de forma discreta. Deixe os seus dados e o Dylan enviar-lhe-á pessoalmente a apresentação completa, preços e disponibilidade.',
    first_name: 'Nome', last_name: 'Apelido', email: 'Endereço de email', phone: 'Telefone (opcional)',
    btn_idle: 'Registar →', btn_sending: 'A enviar…',
    fine: 'Sem listas de email — uma única resposta pessoal sobre esta casa.',
    success_heading: 'Obrigado — está registado',
    success_msg: 'O Dylan entrará em contacto em breve com todos os detalhes de',
    view_home: 'Ver a casa →',
    error: 'Algo correu mal. Tente novamente.',
  },
  sv: {
    eyebrow: 'Privat försäljning',
    heading: 'Registrera dig för att få detaljerna',
    sub: 'Det här hemmet erbjuds diskret. Lämna dina uppgifter så skickar Dylan personligen den fullständiga presentationen, priser och tillgänglighet.',
    first_name: 'Förnamn', last_name: 'Efternamn', email: 'E-postadress', phone: 'Telefon (valfritt)',
    btn_idle: 'Registrera →', btn_sending: 'Skickar…',
    fine: 'Inga utskickslistor — ett personligt svar om det här hemmet.',
    success_heading: 'Tack — du är registrerad',
    success_msg: 'Dylan hör av sig inom kort med alla detaljer om',
    view_home: 'Se hemmet →',
    error: 'Något gick fel. Försök igen.',
  },
  da: {
    eyebrow: 'Privat salg',
    heading: 'Registrer dig for at modtage detaljerne',
    sub: 'Denne bolig tilbydes diskret. Efterlad dine oplysninger, så sender Dylan dig personligt den fulde præsentation, priser og tilgængelighed.',
    first_name: 'Fornavn', last_name: 'Efternavn', email: 'E-mailadresse', phone: 'Telefon (valgfrit)',
    btn_idle: 'Registrer →', btn_sending: 'Sender…',
    fine: 'Ingen mailinglister — ét personligt svar om denne bolig.',
    success_heading: 'Tak — du er registreret',
    success_msg: 'Dylan kontakter dig snarest med alle detaljer om',
    view_home: 'Se boligen →',
    error: 'Noget gik galt. Prøv igen.',
  },
  no: {
    eyebrow: 'Privat salg',
    heading: 'Registrer deg for å motta detaljene',
    sub: 'Denne boligen tilbys diskret. Legg igjen kontaktinformasjonen din, så sender Dylan deg personlig hele presentasjonen, priser og tilgjengelighet.',
    first_name: 'Fornavn', last_name: 'Etternavn', email: 'E-postadresse', phone: 'Telefon (valgfritt)',
    btn_idle: 'Registrer →', btn_sending: 'Sender…',
    fine: 'Ingen e-postlister — ett personlig svar om denne boligen.',
    success_heading: 'Takk — du er registrert',
    success_msg: 'Dylan tar kontakt snart med alle detaljer om',
    view_home: 'Se boligen →',
    error: 'Noe gikk galt. Prøv igjen.',
  },
};

function splitSavedName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

export default function DiscreetRegisterModal({ property: p, title, onClose }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  const saved = getSavedUser();
  const savedName = splitSavedName(saved.name);
  const [first, setFirst] = useState(savedName.first);
  const [last, setLast]   = useState(savedName.last);
  const [email, setEmail] = useState(saved.email || '');
  const [phone, setPhone] = useState(saved.phone || '');
  const [status, setStatus] = useState('idle');

  const href = propertyHref(p.slug, locale);
  const propertyUrl = `https://co-ownership-property.com/property/${p.slug}/`;
  const heroImg = p.img || null;

  // Esc closes; lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    const name = `${first.trim()} ${last.trim()}`.trim();
    setStatus('sending');
    try {
      const r = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim(),
          phone: phone.trim(),
          property: p.title || title,
          propertySlug: p.slug,
          url: propertyUrl,
          message: 'Registered to receive details — private sale listing',
          enquiryType: 'discreet',
          attribution: getFirstTouch(),
          locale,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!r.ok) { setStatus('error'); return; }
      saveUser({ name, email: email.trim(), phone: phone.trim() });
      trackConversion('generate_lead', 'Lead', { event_category: 'discreet_register', property_title: p.title || title, locale });
      track('discreet_registered', { property: p.title || title, country: p.country || 'unspecified', locale });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="ul-overlay dr-overlay" onClick={onClose}>
      <div className="dr-modal" role="dialog" aria-modal="true" aria-label={t.heading} onClick={e => e.stopPropagation()}>
        <button className="ul-close dr-close" onClick={onClose} aria-label="Close">×</button>

        <div className="dr-photo" style={heroImg ? { backgroundImage: `url("${heroImg.replaceAll('"', '%22')}")` } : undefined}>
          <span className="dr-photo-badge">{t.eyebrow}</span>
          <div className="dr-photo-caption">
            <span>{title}</span>
          </div>
        </div>

        <div className="dr-body">
          {status === 'done' ? (
            <div className="ul-success dr-success">
              <div className="ul-tick">✓</div>
              <h3>{t.success_heading}</h3>
              <p>{t.success_msg} <strong>{title}</strong>.</p>
              <a href={href} className="dr-view-link">{t.view_home}</a>
            </div>
          ) : (
            <>
              <p className="ul-eye">{t.eyebrow}</p>
              <h3>{t.heading}</h3>
              <p className="ul-sub">{t.sub}</p>
              <form onSubmit={submit} className="ul-form dr-form">
                <HoneypotField />
                <div className="dr-row">
                  <input type="text" placeholder={t.first_name} value={first} onChange={e => setFirst(e.target.value)} autoComplete="given-name" required />
                  <input type="text" placeholder={t.last_name} value={last} onChange={e => setLast(e.target.value)} autoComplete="family-name" />
                </div>
                <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                <input type="tel" inputMode="tel" placeholder={t.phone} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.btn_sending : t.btn_idle}</button>
                {status === 'error' && <p className="ul-err">{t.error}</p>}
                <p className="dr-fine">{t.fine}</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
