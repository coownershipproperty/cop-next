import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser, clearSavedUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

const COPY = {
  en: {
    eyebrow: 'Exclusive access',
    heading: 'Your Photo Gallery',
    sub: "Enter your details and we'll send the full photo gallery straight to your inbox.",
    name_placeholder: 'Your name',
    email_placeholder: 'Your email address',
    phone_placeholder: 'Phone number (optional)',
    btn_idle: 'Send me the photos →',
    btn_sending: 'Sending…',
    success_heading: 'Check your inbox!',
    success_msg: "We've sent the photos to",
    success_redirect: "Opening your gallery… We've also emailed you a permanent link.",
    error: 'Something went wrong. Please try again.',
    error_domain: "That email domain doesn't seem to exist — double-check the spelling?",
    error_bounced: "Emails to your saved address kept bouncing — please double-check it or use a different one.",
    did_you_mean: 'Did you mean {s}?',
    oneclick_continue: 'Continue as',
    oneclick_btn: 'View gallery →',
    oneclick_notyou: 'Not you?',
    all_galleries: 'One unlock opens every property gallery on the site.',
  },
  es: {
    eyebrow: 'Acceso exclusivo',
    heading: 'Tu galería de fotos',
    sub: 'Introduce tus datos y te enviaremos la galería de fotos completa directamente a tu correo electrónico.',
    name_placeholder: 'Tu nombre',
    email_placeholder: 'Tu correo electrónico',
    phone_placeholder: 'Teléfono (opcional)',
    btn_idle: 'Enviar las fotos →',
    btn_sending: 'Enviando…',
    success_heading: '¡Revisa tu bandeja de entrada!',
    success_msg: 'Hemos enviado las fotos a',
    success_redirect: 'Abriendo tu galería… También te hemos enviado un enlace permanente por correo.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    error_domain: 'Ese dominio de correo no parece existir — ¿revisas la ortografía?',
    error_bounced: 'Los correos a tu dirección guardada rebotaban — revísala o usa otra dirección.',
    did_you_mean: '¿Quisiste decir {s}?',
    oneclick_continue: 'Continuar como',
    oneclick_btn: 'Ver galería →',
    oneclick_notyou: '¿No eres tú?',
    all_galleries: 'Un solo desbloqueo abre todas las galerías del sitio.',
  },
  fr: {
    eyebrow: 'Accès exclusif',
    heading: 'Votre galerie de photos',
    sub: 'Renseignez vos coordonnées et nous vous enverrons la galerie de photos complète directement par email.',
    name_placeholder: 'Votre nom',
    email_placeholder: 'Votre adresse email',
    phone_placeholder: 'Téléphone (facultatif)',
    btn_idle: 'Envoyez-moi les photos →',
    btn_sending: 'Envoi en cours…',
    success_heading: 'Consultez votre boîte mail !',
    success_msg: 'Nous avons envoyé les photos à',
    success_redirect: 'Ouverture de votre galerie… Nous vous avons également envoyé un lien permanent par email.',
    error: "Une erreur s'est produite. Veuillez réessayer.",
    error_domain: "Ce domaine email ne semble pas exister — vérifiez l'orthographe ?",
    error_bounced: 'Les emails vers votre adresse enregistrée revenaient en erreur — vérifiez-la ou utilisez-en une autre.',
    did_you_mean: 'Vouliez-vous dire {s} ?',
    oneclick_continue: 'Continuer en tant que',
    oneclick_btn: 'Voir la galerie →',
    oneclick_notyou: "Ce n'est pas vous ?",
    all_galleries: 'Un seul déblocage ouvre toutes les galeries du site.',
  },
  de: {
    eyebrow: 'Exklusiver Zugang',
    heading: 'Ihre Fotogalerie',
    sub: 'Geben Sie Ihre Daten ein und wir senden Ihnen die vollständige Fotogalerie direkt in Ihr Postfach.',
    name_placeholder: 'Ihr Name',
    email_placeholder: 'Ihre E-Mail-Adresse',
    phone_placeholder: 'Telefonnummer (optional)',
    btn_idle: 'Fotos zusenden →',
    btn_sending: 'Wird gesendet…',
    success_heading: 'Prüfen Sie Ihr Postfach!',
    success_msg: 'Wir haben die Fotos gesendet an',
    success_redirect: 'Ihre Galerie wird geöffnet… Wir haben Ihnen außerdem einen dauerhaften Link per E-Mail geschickt.',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    error_domain: 'Diese E-Mail-Domain scheint nicht zu existieren — bitte prüfen Sie die Schreibweise.',
    error_bounced: 'E-Mails an Ihre gespeicherte Adresse kamen zurück — bitte prüfen Sie sie oder verwenden Sie eine andere.',
    did_you_mean: 'Meinten Sie {s}?',
    oneclick_continue: 'Weiter als',
    oneclick_btn: 'Galerie ansehen →',
    oneclick_notyou: 'Nicht Sie?',
    all_galleries: 'Einmal freischalten und alle Galerien der Website öffnen sich.',
  },
  it: {
    eyebrow: 'Accesso esclusivo',
    heading: 'La tua galleria fotografica',
    sub: 'Inserisci i tuoi dati e ti inviamo la galleria fotografica completa direttamente nella tua casella di posta.',
    name_placeholder: 'Il tuo nome',
    email_placeholder: 'Il tuo indirizzo email',
    phone_placeholder: 'Numero di telefono (facoltativo)',
    btn_idle: 'Inviami le foto →',
    btn_sending: 'Invio in corso…',
    success_heading: 'Controlla la tua casella di posta!',
    success_msg: 'Abbiamo inviato le foto a',
    success_redirect: 'Stiamo aprendo la tua galleria… Ti abbiamo anche inviato un link permanente via email.',
    error: 'Qualcosa è andato storto. Riprova.',
    error_domain: 'Questo dominio email non sembra esistere — controlla di averlo scritto correttamente.',
    error_bounced: 'Le email al tuo indirizzo salvato continuano a tornare indietro — controllalo o usane un altro.',
    did_you_mean: 'Intendevi {s}?',
    oneclick_continue: 'Continua come',
    oneclick_btn: 'Vedi la galleria →',
    oneclick_notyou: 'Non sei tu?',
    all_galleries: 'Sblocchi una volta e apri tutte le gallerie del sito.',
  },
  nl: {
    eyebrow: 'Exclusieve toegang',
    heading: 'Uw fotogalerij',
    sub: 'Vul uw gegevens in en wij sturen u de volledige fotogalerij rechtstreeks in uw inbox.',
    name_placeholder: 'Uw naam',
    email_placeholder: 'Uw e-mailadres',
    phone_placeholder: 'Telefoonnummer (optioneel)',
    btn_idle: 'Stuur mij de foto\'s →',
    btn_sending: 'Verzenden…',
    success_heading: 'Kijk in uw inbox!',
    success_msg: 'Wij hebben de foto\'s gestuurd naar',
    success_redirect: 'Uw galerij wordt geopend… We hebben u ook een permanente link gemaild.',
    error: 'Er is iets misgegaan. Probeer het opnieuw.',
    error_domain: 'Dit e-maildomein lijkt niet te bestaan — controleert u de schrijfwijze?',
    error_bounced: 'E-mails naar uw opgeslagen adres kwamen steeds terug — controleer het of gebruik een ander adres.',
    did_you_mean: 'Bedoelde u {s}?',
    oneclick_continue: 'Doorgaan als',
    oneclick_btn: 'Galerij bekijken →',
    oneclick_notyou: 'Bent u dit niet?',
    all_galleries: 'Eén keer ontgrendelen opent alle fotogalerijen op de site.',
  },
  pt: {
    eyebrow: 'Acesso exclusivo',
    heading: 'Sua galeria de fotos',
    sub: 'Informe seus dados e enviamos a galeria de fotos completa direto para o seu e-mail.',
    name_placeholder: 'Seu nome',
    email_placeholder: 'Seu e-mail',
    phone_placeholder: 'Telefone (opcional)',
    btn_idle: 'Quero receber as fotos →',
    btn_sending: 'Enviando…',
    success_heading: 'Confira seu e-mail!',
    success_msg: 'Enviamos as fotos para',
    success_redirect: 'Abrindo sua galeria… Também enviamos um link permanente por e-mail.',
    error: 'Algo deu errado. Tente novamente.',
    error_domain: 'Esse domínio de e-mail parece não existir — confira a grafia.',
    error_bounced: 'Os e-mails enviados ao endereço salvo continuaram voltando — confira o endereço ou use outro.',
    did_you_mean: 'Você quis dizer {s}?',
    oneclick_continue: 'Continuar como',
    oneclick_btn: 'Ver galeria →',
    oneclick_notyou: 'Não é você?',
    all_galleries: 'Um único desbloqueio abre todas as galerias do site.',
  },
  sv: {
    eyebrow: 'Exklusiv åtkomst',
    heading: 'Ditt bildgalleri',
    sub: 'Fyll i dina uppgifter så skickar vi hela bildgalleriet direkt till din inkorg.',
    name_placeholder: 'Ditt namn',
    email_placeholder: 'Din e-postadress',
    phone_placeholder: 'Telefonnummer (valfritt)',
    btn_idle: 'Skicka bilderna →',
    btn_sending: 'Skickar…',
    success_heading: 'Kolla din inkorg!',
    success_msg: 'Vi har skickat bilderna till',
    success_redirect: 'Ditt galleri öppnas… Vi har även mejlat dig en permanent länk.',
    error: 'Något gick fel. Försök igen.',
    error_domain: 'Den e-postdomänen verkar inte finnas — kontrollera stavningen.',
    error_bounced: 'Mejl till din sparade adress studsade tillbaka — kontrollera den eller använd en annan.',
    did_you_mean: 'Menade du {s}?',
    oneclick_continue: 'Fortsätt som',
    oneclick_btn: 'Visa galleri →',
    oneclick_notyou: 'Inte du?',
    all_galleries: 'En upplåsning öppnar alla bostadsgallerier på webbplatsen.',
  },
  da: {
    eyebrow: 'Eksklusiv adgang',
    heading: 'Dit fotogalleri',
    sub: 'Indtast dine oplysninger, så sender vi hele fotogalleriet direkte til din indbakke.',
    name_placeholder: 'Dit navn',
    email_placeholder: 'Din e-mailadresse',
    phone_placeholder: 'Telefonnummer (valgfrit)',
    btn_idle: 'Send mig billederne →',
    btn_sending: 'Sender…',
    success_heading: 'Tjek din indbakke!',
    success_msg: 'Vi har sendt billederne til',
    success_redirect: 'Dit galleri åbnes… Vi har også sendt dig et permanent link på e-mail.',
    error: 'Noget gik galt. Prøv venligst igen.',
    error_domain: 'Dette e-maildomæne ser ikke ud til at findes — tjek venligst stavemåden.',
    error_bounced: 'E-mails til din gemte adresse kom retur — tjek den venligst, eller brug en anden.',
    did_you_mean: 'Mente du {s}?',
    oneclick_continue: 'Fortsæt som',
    oneclick_btn: 'Se galleri →',
    oneclick_notyou: 'Ikke dig?',
    all_galleries: 'Lås op én gang, og alle sitets boliggallerier åbner sig.',
  },
  no: {
    eyebrow: 'Eksklusiv tilgang',
    heading: 'Ditt bildegalleri',
    sub: 'Legg inn kontaktinformasjonen din, så sender vi hele bildegalleriet rett i innboksen din.',
    name_placeholder: 'Ditt navn',
    email_placeholder: 'Din e-postadresse',
    phone_placeholder: 'Telefonnummer (valgfritt)',
    btn_idle: 'Send meg bildene →',
    btn_sending: 'Sender…',
    success_heading: 'Sjekk innboksen din!',
    success_msg: 'Vi har sendt bildene til',
    success_redirect: 'Galleriet ditt åpnes… Vi har også sendt deg en permanent lenke på e-post.',
    error: 'Noe gikk galt. Prøv igjen.',
    error_domain: 'Dette e-postdomenet ser ikke ut til å finnes — sjekk gjerne stavemåten.',
    error_bounced: 'E-poster til den lagrede adressen din kom i retur — sjekk den, eller bruk en annen.',
    did_you_mean: 'Mente du {s}?',
    oneclick_continue: 'Fortsett som',
    oneclick_btn: 'Se galleriet →',
    oneclick_notyou: 'Ikke deg?',
    all_galleries: 'Én opplåsing åpner alle boliggalleriene på nettstedet.',
  },
};

// ── Common consumer-domain typos → correction ───────────────────────────────
// FULL-domain match only (the whole part after the @), so legitimate domains
// like hotmail.co.uk, yahoo.co.jp or gmail.com.br are never touched. Small,
// hand-picked map — no dependency, no fuzzy matching false-positives.
const DOMAIN_FIXES = {
  // gmail.com
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmil.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmails.com': 'gmail.com', 'gemail.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.comm': 'gmail.com', 'gmail.co.m': 'gmail.com',
  // hotmail.com
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotamil.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com', 'hormail.com': 'hotmail.com', 'hotmil.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com', 'hotmail.comm': 'hotmail.com',
  // outlook.com
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'oulook.com': 'outlook.com',
  'outlool.com': 'outlook.com', 'outllok.com': 'outlook.com', 'outllook.com': 'outlook.com',
  'outlook.co': 'outlook.com', 'outlook.cm': 'outlook.com', 'outlook.con': 'outlook.com',
  // yahoo.com
  'yaho.com': 'yahoo.com', 'yahho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com', 'yahoo.cm': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'yahool.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
  // icloud.com
  'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com', 'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com', 'icloud.con': 'icloud.com', 'iclould.com': 'icloud.com',
  'icluod.com': 'icloud.com', 'iclaud.com': 'icloud.com',
};

/** "name@gmial.com" → "name@gmail.com", or null if nothing to suggest. */
function suggestEmailFix(value) {
  const m = String(value || '').trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const fixed = DOMAIN_FIXES[m[2]];
  return fixed && fixed !== m[2] ? `${m[1]}@${fixed}` : null;
}

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
  const [name, setName]   = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [phone, setPhone] = useState(saved.phone || '');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  // One-click "Continue as {email}" — only for a saved user whose address has
  // already unlocked successfully (validated flag). Saved users WITHOUT the
  // flag get the prefilled form once; the flag is set on that submit.
  const [oneClick, setOneClick] = useState(!!(saved.validated && saved.email));
  const [suggestion, setSuggestion] = useState(null);
  const suggestedFor  = useRef(null); // email value a suggestion was already shown for
  const redirectTimer = useRef(null);

  // The public gallery page lives at /gallery/{slug} (see pages/gallery/[token].js —
  // the ?t= visitor token is optional; the page renders from the slug alone).
  const gallerySlug = propertySlug || slugFromPropertyUrl(propertyUrl);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  async function doSubmit({ overrideEmail, honeypot = '' } = {}) {
    const sendEmail = String(overrideEmail !== undefined ? overrideEmail : email).trim();
    const sendName  = String(name || '').trim();
    const sendPhone = String(phone || '').trim();
    setStatus('sending'); setErrMsg('');
    const _tok = toBase64Url(JSON.stringify({ n: sendName || '', e: sendEmail }));
    const _qs = [ _tok ? ('t=' + _tok) : '', locale !== 'en' ? ('lang=' + locale) : '' ].filter(Boolean).join('&');
    const galleryWin = gallerySlug ? window.open('/gallery/' + gallerySlug + (_qs ? ('?' + _qs) : ''), '_blank') : null;
    try {
      const r = await fetch('/api/unlock-drive/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sendName, email: sendEmail, phone: sendPhone, propertyTitle, driveUrl, propertyUrl,
          propertyCountry, locale, [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (r.ok) {
        // validated: this address demonstrably works → next time is one-click.
        saveUser({ name: sendName, email: sendEmail, phone: sendPhone, validated: true });
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
          const tok = toBase64Url(JSON.stringify({ n: sendName || '', e: sendEmail }));
          const params = [];
          if (tok) params.push(`t=${tok}`);
          if (locale !== 'en') params.push(`lang=${locale}`);
          const qs = params.length ? `?${params.join('&')}` : '';
          redirectTimer.current = setTimeout(() => {
            const galleryHref = `/gallery/${gallerySlug}${qs}`;
      if (!galleryWin) window.location.assign(galleryHref);
          }, 1500);
        }
        setStatus('done');
        return;
      }

      if (galleryWin && !galleryWin.closed) galleryWin.close();
      // Structured server rejections.
      let j = null;
      try { j = await r.json(); } catch { /* non-JSON error body */ }

      if (j && j.invalidated) {
        // Emails to this address hard-bounced (Resend webhook wrote the
        // suppression). Forget the saved user and re-ask for the address.
        clearSavedUser();
        setOneClick(false);
        setEmail('');
        setStatus('idle');
        setErrMsg(t.error_bounced);
        return;
      }
      if (j && j.code === 'bad_domain') {
        setOneClick(false);
        setStatus('error');
        setErrMsg(t.error_domain);
        return;
      }
      setStatus('error');
    } catch {
      if (galleryWin && !galleryWin.closed) galleryWin.close();
      setStatus('error');
    }
  }

  function submitForm(e) {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    // Typo check — offered once per address; submitting the same address again
    // proceeds unchanged (maybe the unusual domain is intentional).
    const fix = suggestEmailFix(email);
    if (fix && suggestedFor.current !== email) {
      suggestedFor.current = email;
      setSuggestion(fix);
      return;
    }
    setSuggestion(null);
    doSubmit({ honeypot });
  }

  function acceptSuggestion() {
    const fixed = suggestion;
    setSuggestion(null);
    setEmail(fixed);
    doSubmit({ overrideEmail: fixed }); // one tap: correct AND submit
  }

  function submitOneClick(e) {
    e.preventDefault();
    doSubmit({});
  }

  function notYou() {
    clearSavedUser();
    setOneClick(false);
    setName('');
    setEmail('');
    setErrMsg('');
    setStatus('idle');
  }

  const [dymBefore, dymAfter] = t.did_you_mean.split('{s}');

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
        ) : oneClick ? (
          <>
            <p className="ul-eye">{t.eyebrow}</p>
            <h3>{t.heading}</h3>
            <p className="ul-sub">{t.oneclick_continue} <strong style={{ color: '#143047' }}>{email}</strong></p>
            <p style={{ margin: '-4px 0 14px', fontSize: '.82rem', color: '#C9A84C', fontWeight: 700, fontFamily: "'Nunito Sans',sans-serif" }}>✓ {t.all_galleries}</p>
            <form onSubmit={submitOneClick} className="ul-form">
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? t.btn_sending : t.oneclick_btn}
              </button>
              {(status === 'error' || errMsg) && <p className="ul-err">{errMsg || t.error}</p>}
            </form>
            <button
              type="button"
              onClick={notYou}
              style={{
                background: 'none', border: 'none', padding: 0, marginTop: 16,
                fontFamily: "'Nunito Sans',sans-serif", fontSize: '.8rem',
                color: '#6b8a9e', textDecoration: 'underline', cursor: 'pointer',
              }}
            >
              {t.oneclick_notyou}
            </button>
          </>
        ) : (
          <>
            <p className="ul-eye">{t.eyebrow}</p>
            <h3>{t.heading}</h3>
            <p className="ul-sub">{t.sub}</p>
            <p style={{ margin: '-4px 0 14px', fontSize: '.82rem', color: '#C9A84C', fontWeight: 700, fontFamily: "'Nunito Sans',sans-serif" }}>✓ {t.all_galleries}</p>
            <form onSubmit={submitForm} className="ul-form">
              <HoneypotField />
              <input type="text" placeholder={t.name_placeholder} value={name} onChange={e => setName(e.target.value)} required />
              <input
                type="email"
                placeholder={t.email_placeholder}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setSuggestion(null);
                  if (suggestedFor.current !== e.target.value) suggestedFor.current = null;
                }}
                required
              />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t.phone_placeholder}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              {suggestion && (
                <button
                  type="button"
                  onClick={acceptSuggestion}
                  style={{
                    fontFamily: "'Nunito Sans',sans-serif", fontSize: '.85rem',
                    color: '#143047', background: '#FAF6EC', border: '1px solid #C9A84C',
                    borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
                    textAlign: 'left', alignSelf: 'flex-start',
                  }}
                >
                  {dymBefore}<strong>{suggestion}</strong>{dymAfter}
                </button>
              )}
              <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.btn_sending : t.btn_idle}</button>
              {(status === 'error' || errMsg) && <p className="ul-err">{errMsg || t.error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
