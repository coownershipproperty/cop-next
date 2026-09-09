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
 * Discreet-sale homes — "unlock the full listing" enquiry popup.
 *
 * A discreet home shows one photo, the title and the headline numbers. This
 * popup (opened from the listing card, or from the locked property page) is
 * an ordinary property enquiry — first/last name, email, phone, no consent
 * tick-box (David, 9 Sep 2026) — sent to /api/enquiry like any other, so the
 * lead lands in the CRM with Dylan's auto-reply, the team notification and
 * the hourly reply drafter. On success the visitor is remembered
 * (saveUser validated) and the full listing opens: from a card we navigate to
 * the property page; on the property page `onUnlocked` swaps in the full
 * content without a reload. Nothing partner-identifying is shown or sent.
 */

export const DISCREET_COPY = {
  en: {
    badge: 'Discreet sale',
    heading: 'Unlock the full listing',
    sub: "This home is marketed discreetly. Send an enquiry and we'll open the full listing for you — every photo, floor plans, amenities and the complete description.",
    first_name: 'First name', last_name: 'Last name', email: 'Email address', phone: 'Phone (optional)',
    btn_idle: 'Unlock the full listing →', btn_sending: 'Unlocking…',
    fine: 'No mailing lists — one personal reply about this home.',
    success_heading: 'Unlocked',
    success_msg: 'Opening the full listing for',
    view_home: 'Open the full listing →',
    error: 'Something went wrong. Please try again.',
    locked_title: 'Discreet sale — the full listing is available on request',
    locked_sub: 'Every photo, floor plans, amenities and the complete description open the moment you enquire.',
  },
  es: {
    badge: 'Venta discreta',
    heading: 'Desbloquea la ficha completa',
    sub: 'Esta vivienda se comercializa de forma discreta. Envíanos tu consulta y te abriremos la ficha completa — todas las fotos, planos, equipamiento y la descripción íntegra.',
    first_name: 'Nombre', last_name: 'Apellidos', email: 'Correo electrónico', phone: 'Teléfono (opcional)',
    btn_idle: 'Desbloquear la ficha completa →', btn_sending: 'Desbloqueando…',
    fine: 'Sin listas de correo — una única respuesta personal sobre esta vivienda.',
    success_heading: 'Desbloqueada',
    success_msg: 'Abriendo la ficha completa de',
    view_home: 'Abrir la ficha completa →',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    locked_title: 'Venta discreta — la ficha completa está disponible bajo petición',
    locked_sub: 'Todas las fotos, los planos, el equipamiento y la descripción íntegra se abren en cuanto nos envías tu consulta.',
  },
  fr: {
    badge: 'Vente discrète',
    heading: "Débloquez l'annonce complète",
    sub: "Ce bien est commercialisé en toute discrétion. Envoyez votre demande et nous vous ouvrirons l'annonce complète — toutes les photos, les plans, les équipements et la description intégrale.",
    first_name: 'Prénom', last_name: 'Nom', email: 'Adresse email', phone: 'Téléphone (facultatif)',
    btn_idle: "Débloquer l'annonce complète →", btn_sending: 'Déblocage…',
    fine: 'Aucune liste de diffusion — une seule réponse personnelle au sujet de ce bien.',
    success_heading: 'Débloquée',
    success_msg: "Ouverture de l'annonce complète de",
    view_home: "Ouvrir l'annonce complète →",
    error: "Une erreur s'est produite. Veuillez réessayer.",
    locked_title: "Vente discrète — l'annonce complète est disponible sur demande",
    locked_sub: "Toutes les photos, les plans, les équipements et la description intégrale s'ouvrent dès votre demande.",
  },
  de: {
    badge: 'Diskreter Verkauf',
    heading: 'Das vollständige Exposé freischalten',
    sub: 'Dieses Objekt wird diskret vermarktet. Senden Sie Ihre Anfrage und wir schalten das vollständige Exposé für Sie frei — alle Fotos, Grundrisse, Ausstattung und die komplette Beschreibung.',
    first_name: 'Vorname', last_name: 'Nachname', email: 'E-Mail-Adresse', phone: 'Telefon (optional)',
    btn_idle: 'Vollständiges Exposé freischalten →', btn_sending: 'Wird freigeschaltet…',
    fine: 'Keine Mailinglisten — eine persönliche Antwort zu diesem Objekt.',
    success_heading: 'Freigeschaltet',
    success_msg: 'Das vollständige Exposé wird geöffnet für',
    view_home: 'Vollständiges Exposé öffnen →',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    locked_title: 'Diskreter Verkauf — das vollständige Exposé auf Anfrage',
    locked_sub: 'Alle Fotos, Grundrisse, Ausstattung und die komplette Beschreibung werden mit Ihrer Anfrage freigeschaltet.',
  },
  it: {
    badge: 'Vendita discreta',
    heading: 'Sblocca la scheda completa',
    sub: 'Questa casa è commercializzata con discrezione. Invia la tua richiesta e ti apriremo la scheda completa — tutte le foto, le planimetrie, i servizi e la descrizione integrale.',
    first_name: 'Nome', last_name: 'Cognome', email: 'Indirizzo email', phone: 'Telefono (facoltativo)',
    btn_idle: 'Sblocca la scheda completa →', btn_sending: 'Sblocco in corso…',
    fine: 'Nessuna mailing list — una sola risposta personale su questa casa.',
    success_heading: 'Sbloccata',
    success_msg: 'Apertura della scheda completa di',
    view_home: 'Apri la scheda completa →',
    error: 'Qualcosa è andato storto. Riprova.',
    locked_title: 'Vendita discreta — la scheda completa è disponibile su richiesta',
    locked_sub: 'Tutte le foto, le planimetrie, i servizi e la descrizione integrale si aprono appena invii la richiesta.',
  },
  nl: {
    badge: 'Discrete verkoop',
    heading: 'Ontgrendel de volledige woningpagina',
    sub: "Deze woning wordt discreet aangeboden. Stuur uw aanvraag en wij openen de volledige pagina voor u — alle foto's, plattegronden, voorzieningen en de complete beschrijving.",
    first_name: 'Voornaam', last_name: 'Achternaam', email: 'E-mailadres', phone: 'Telefoon (optioneel)',
    btn_idle: 'Volledige pagina ontgrendelen →', btn_sending: 'Ontgrendelen…',
    fine: 'Geen mailinglijsten — één persoonlijk antwoord over deze woning.',
    success_heading: 'Ontgrendeld',
    success_msg: 'De volledige pagina wordt geopend voor',
    view_home: 'Volledige pagina openen →',
    error: 'Er is iets misgegaan. Probeer het opnieuw.',
    locked_title: 'Discrete verkoop — de volledige pagina is op aanvraag beschikbaar',
    locked_sub: "Alle foto's, plattegronden, voorzieningen en de complete beschrijving openen zodra u een aanvraag stuurt.",
  },
  pt: {
    badge: 'Venda discreta',
    heading: 'Desbloqueie a ficha completa',
    sub: 'Esta casa é comercializada de forma discreta. Envie o seu pedido e abrimos-lhe a ficha completa — todas as fotos, plantas, comodidades e a descrição integral.',
    first_name: 'Nome', last_name: 'Apelido', email: 'Endereço de email', phone: 'Telefone (opcional)',
    btn_idle: 'Desbloquear a ficha completa →', btn_sending: 'A desbloquear…',
    fine: 'Sem listas de email — uma única resposta pessoal sobre esta casa.',
    success_heading: 'Desbloqueada',
    success_msg: 'A abrir a ficha completa de',
    view_home: 'Abrir a ficha completa →',
    error: 'Algo correu mal. Tente novamente.',
    locked_title: 'Venda discreta — a ficha completa está disponível a pedido',
    locked_sub: 'Todas as fotos, plantas, comodidades e a descrição integral abrem assim que enviar o seu pedido.',
  },
  sv: {
    badge: 'Diskret försäljning',
    heading: 'Lås upp hela objektsbeskrivningen',
    sub: 'Det här hemmet marknadsförs diskret. Skicka din förfrågan så öppnar vi hela beskrivningen för dig — alla foton, planritningar, bekvämligheter och den fullständiga texten.',
    first_name: 'Förnamn', last_name: 'Efternamn', email: 'E-postadress', phone: 'Telefon (valfritt)',
    btn_idle: 'Lås upp hela beskrivningen →', btn_sending: 'Låser upp…',
    fine: 'Inga utskickslistor — ett personligt svar om det här hemmet.',
    success_heading: 'Upplåst',
    success_msg: 'Öppnar hela beskrivningen för',
    view_home: 'Öppna hela beskrivningen →',
    error: 'Något gick fel. Försök igen.',
    locked_title: 'Diskret försäljning — hela beskrivningen finns på begäran',
    locked_sub: 'Alla foton, planritningar, bekvämligheter och den fullständiga texten öppnas så snart du skickar en förfrågan.',
  },
  da: {
    badge: 'Diskret salg',
    heading: 'Lås op for den fulde boligpræsentation',
    sub: 'Denne bolig markedsføres diskret. Send din forespørgsel, så åbner vi den fulde præsentation for dig — alle fotos, plantegninger, faciliteter og den komplette beskrivelse.',
    first_name: 'Fornavn', last_name: 'Efternavn', email: 'E-mailadresse', phone: 'Telefon (valgfrit)',
    btn_idle: 'Lås op for den fulde præsentation →', btn_sending: 'Låser op…',
    fine: 'Ingen mailinglister — ét personligt svar om denne bolig.',
    success_heading: 'Låst op',
    success_msg: 'Åbner den fulde præsentation for',
    view_home: 'Åbn den fulde præsentation →',
    error: 'Noget gik galt. Prøv igen.',
    locked_title: 'Diskret salg — den fulde præsentation fås på forespørgsel',
    locked_sub: 'Alle fotos, plantegninger, faciliteter og den komplette beskrivelse åbnes, så snart du sender en forespørgsel.',
  },
  no: {
    badge: 'Diskret salg',
    heading: 'Lås opp hele boligpresentasjonen',
    sub: 'Denne boligen markedsføres diskret. Send forespørselen din, så åpner vi hele presentasjonen for deg — alle bilder, plantegninger, fasiliteter og den komplette beskrivelsen.',
    first_name: 'Fornavn', last_name: 'Etternavn', email: 'E-postadresse', phone: 'Telefon (valgfritt)',
    btn_idle: 'Lås opp hele presentasjonen →', btn_sending: 'Låser opp…',
    fine: 'Ingen e-postlister — ett personlig svar om denne boligen.',
    success_heading: 'Låst opp',
    success_msg: 'Åpner hele presentasjonen for',
    view_home: 'Åpne hele presentasjonen →',
    error: 'Noe gikk galt. Prøv igjen.',
    locked_title: 'Diskret salg — hele presentasjonen er tilgjengelig på forespørsel',
    locked_sub: 'Alle bilder, plantegninger, fasiliteter og den komplette beskrivelsen åpnes så snart du sender en forespørsel.',
  },
};

// URL-safe base64 visitor token — same shape the gallery links use ({n, e}).
export function visitorToken(name, email) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify({ n: name || '', e: email }));
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

function splitSavedName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

export default function DiscreetUnlockModal({ property: p, title, onClose, onUnlocked = null }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = DISCREET_COPY[locale] || DISCREET_COPY.en;

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
    const sendEmail = email.trim();
    setStatus('sending');
    try {
      const r = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: sendEmail,
          phone: phone.trim(),
          property: p.title || title,
          propertySlug: p.slug,
          url: propertyUrl,
          message: 'Unlocked the full listing — discreet sale',
          enquiryType: 'discreet',
          attribution: getFirstTouch(),
          locale,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (!r.ok) { setStatus('error'); return; }
      // validated: this address is now known to the CRM → discreet pages open
      // for it on every visit, and the gallery unlock is one-click too.
      saveUser({ name, email: sendEmail, phone: phone.trim(), validated: true });
      trackConversion('generate_lead', 'Lead', { event_category: 'discreet_unlock', property_title: p.title || title, locale });
      track('discreet_unlocked', { property: p.title || title, country: p.country || 'unspecified', locale });
      setStatus('done');
      if (onUnlocked) {
        setTimeout(() => onUnlocked({ name, email: sendEmail }), 900);
      } else {
        const tok = visitorToken(name, sendEmail);
        setTimeout(() => window.location.assign(`${href}${href.includes('?') ? '&' : '?'}t=${tok}`), 900);
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="ul-overlay dr-overlay" onClick={onClose}>
      <div className="dr-modal" role="dialog" aria-modal="true" aria-label={t.heading} onClick={e => e.stopPropagation()}>
        <button className="ul-close dr-close" onClick={onClose} aria-label="Close">×</button>

        <div className="dr-photo" style={heroImg ? { backgroundImage: `url("${heroImg.replaceAll('"', '%22')}")` } : undefined}>
          <span className="dr-photo-badge">{t.badge}</span>
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
              {!onUnlocked && <a href={`${href}?t=${visitorToken(`${first} ${last}`.trim(), email.trim())}`} className="dr-view-link">{t.view_home}</a>}
            </div>
          ) : (
            <>
              <p className="ul-eye">{t.badge}</p>
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
