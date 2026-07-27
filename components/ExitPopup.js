import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

// ── Exit-intent / scroll-depth capture popup ─────────────────────────────────
// This replaces the capture surface that used to write `source: 'popup_cop'`.
// That surface produced 181 contacts at 28.7% phone capture and 15.5% partner
// handover — the second-best source COP has ever had — and stopped producing
// anything on 17 April 2026. It exists nowhere in this codebase, so this is a
// rebuild rather than a restoration, but it posts the SAME source value so the
// historical series continues rather than starting over.
//
// Where it runs: destination hubs and blog articles only (see the allowlist in
// pages/_app.js). Deliberately NOT on property pages — the gallery-unlock CTA
// already fires there and two overlays competing for the same click would cost
// more than the popup wins.
//
// The form is email-required + phone-optional, using verbatim the copy and
// behaviour shipped on the gallery unlock on 20 July 2026 (components/
// UnlockModal.js). That is the only capture surface with a measured conversion
// rate attached to it: phone capture went 8.4% → 39.1% in six days without
// costing conversions, because the field asks and never demands.

const COPY = {
  en: {
    eyebrow: 'Before you go',
    heading: 'See new homes first',
    sub: 'New co-ownership homes are listed most weeks and the best shares go quickly. Leave your details and we will email you when something new comes up.',
    email_placeholder: 'Your email address',
    phone_placeholder: 'Phone number (optional)',
    btn_idle: 'Keep me posted →',
    btn_sending: 'Sending…',
    success_heading: "You're on the list",
    success_msg: 'We will be in touch as soon as something new is listed.',
    error: 'Something went wrong. Please try again.',
    close: 'Close',
    no_spam: 'No spam. Unsubscribe in one click, any time.',
  },
  es: {
    eyebrow: 'Antes de irte',
    heading: 'Descubre las novedades primero',
    sub: 'Publicamos nuevas propiedades en copropiedad casi cada semana y las mejores participaciones vuelan. Déjanos tus datos y te avisamos en cuanto haya algo nuevo.',
    email_placeholder: 'Tu correo electrónico',
    phone_placeholder: 'Teléfono (opcional)',
    btn_idle: 'Mantenme informado →',
    btn_sending: 'Enviando…',
    success_heading: 'Ya estás en la lista',
    success_msg: 'Te escribiremos en cuanto publiquemos algo nuevo.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    close: 'Cerrar',
    no_spam: 'Sin spam. Puedes darte de baja con un clic cuando quieras.',
  },
  fr: {
    eyebrow: 'Avant de partir',
    heading: 'Découvrez les nouveautés en avant-première',
    sub: 'De nouvelles propriétés en copropriété sont publiées presque chaque semaine et les meilleures parts partent vite. Laissez-nous vos coordonnées et nous vous préviendrons.',
    email_placeholder: 'Votre adresse email',
    phone_placeholder: 'Téléphone (facultatif)',
    btn_idle: 'Tenez-moi informé →',
    btn_sending: 'Envoi en cours…',
    success_heading: 'Vous êtes inscrit',
    success_msg: 'Nous vous écrirons dès qu’une nouveauté sera publiée.',
    error: "Une erreur s'est produite. Veuillez réessayer.",
    close: 'Fermer',
    no_spam: 'Pas de spam. Désinscription en un clic, à tout moment.',
  },
  de: {
    eyebrow: 'Bevor Sie gehen',
    heading: 'Neue Immobilien zuerst sehen',
    sub: 'Fast jede Woche kommen neue Miteigentums-Immobilien dazu, und die besten Anteile sind schnell vergeben. Hinterlassen Sie Ihre Daten und wir melden uns, sobald es etwas Neues gibt.',
    email_placeholder: 'Ihre E-Mail-Adresse',
    phone_placeholder: 'Telefonnummer (optional)',
    btn_idle: 'Halten Sie mich auf dem Laufenden →',
    btn_sending: 'Wird gesendet…',
    success_heading: 'Sie stehen auf der Liste',
    success_msg: 'Wir melden uns, sobald etwas Neues eingestellt wird.',
    error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    close: 'Schließen',
    no_spam: 'Kein Spam. Abmeldung jederzeit mit einem Klick.',
  },
};

const STORE_KEY = 'cop_popup';

// How long a visitor is left alone after being shown the popup once. The stamp
// is written when it APPEARS, not when it is closed — someone who saw it and
// navigated away without answering has answered. Anything shorter turns a
// browsing session across three destination pages into three interruptions.
const QUIET_DAYS = 30;

// Minimum time on the page before either trigger is allowed to fire. Long
// enough that the popup never ambushes someone who has just arrived and has
// not yet seen anything worth subscribing for.
const MIN_DWELL_MS = 8000;

// Scroll-depth trigger. This is the only trigger that fires on touch devices —
// there is no exit intent without a mouse pointer.
const SCROLL_TRIGGER = 0.55;

/** { shownAt?: number, done?: true } — never throws, on any browser. */
function readState() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeState(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...readState(), ...next }));
  } catch {
    /* private browsing / storage disabled — the popup simply reappears */
  }
}

export default function ExitPopup() {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  // Fires once per mount: stops the two triggers racing each other, and stops
  // the popup re-opening on a later scroll after the visitor has closed it.
  const spent = useRef(false);
  const emailRef = useRef(null);

  const show = useCallback(() => {
    if (spent.current) return;
    spent.current = true;
    // Stamped the moment it appears, so the quiet period starts whether or not
    // the visitor engages — including if they navigate away with it still open.
    writeState({ shownAt: Date.now() });
    setOpen(true);
    // Recorded so the popup's conversion rate is measurable rather than
    // inferred. Signups without impressions is how the old popup came to be
    // judged on gut feel.
    track('popup_shown', { locale });
  }, [locale]);

  // ── Trigger wiring ─────────────────────────────────────────────────────────
  useEffect(() => {
    const state = readState();
    if (state.done) return;                       // already subscribed here
    if (state.shownAt && Date.now() - state.shownAt < QUIET_DAYS * 864e5) return;

    // A visitor whose address we already hold is not an anonymous visitor. Ask
    // them for an email they have already given and the popup reads as broken;
    // their missing phone number is the recapture campaign's job, not this
    // component's.
    if (getSavedUser().email) return;

    let armed = false;
    const arm = setTimeout(() => { armed = true; }, MIN_DWELL_MS);

    function onMouseOut(e) {
      // Pointer left through the top of the viewport and not into an iframe or
      // a child element — the classic "heading for the address bar" signal.
      if (!armed || e.relatedTarget || e.clientY > 0) return;
      show();
    }

    function onScroll() {
      if (!armed) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= SCROLL_TRIGGER) show();
    }

    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(arm);
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', onScroll);
    };
    // Route changes remount this component via the key in _app.js, so the
    // triggers re-arm per page rather than persisting stale listeners.
  }, [show]);

  // The quiet period is already stamped by show(), so closing just closes.
  const dismiss = useCallback(() => setOpen(false), []);

  // Escape closes, and the email field takes focus when the popup appears so a
  // keyboard user can type straight away.
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') dismiss(); }
    document.addEventListener('keydown', onKey);
    emailRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  async function handleSubmit(e) {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    const sendEmail = String(email || '').trim();
    if (!sendEmail) return;
    const sendPhone = String(phone || '').trim();

    setStatus('sending');
    try {
      const r = await fetch('/api/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sendEmail,
          phone: sendPhone,
          locale,
          // Continues the historical popup_cop series rather than starting a
          // new one. /api/newsletter validates this against an allowlist.
          source: 'popup_cop',
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!data.ok) { setStatus('error'); return; }

      saveUser({ email: sendEmail, phone: sendPhone });
      writeState({ done: true });
      setStatus('done');
      trackConversion('sign_up', 'Lead', { method: 'popup', locale });
      track('popup_signup', { locale });
    } catch {
      setStatus('error');
    }
  }

  if (!open) return null;

  return (
    <div className="cp-overlay" onClick={dismiss}>
      <div
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.heading}
        onClick={e => e.stopPropagation()}
      >
        <button className="cp-close" onClick={dismiss} aria-label={t.close}>×</button>

        {status === 'done' ? (
          <div className="cp-success">
            <div className="cp-tick">✓</div>
            <h3>{t.success_heading}</h3>
            <p>{t.success_msg}</p>
          </div>
        ) : (
          <>
            <p className="cp-eye">{t.eyebrow}</p>
            <h3>{t.heading}</h3>
            <p className="cp-sub">{t.sub}</p>
            {/* No noValidate — the browser's own required/email-format check is
                free typo protection on a form we only get one shot at, and it
                is how the gallery unlock works too. */}
            <form className="cp-form" onSubmit={handleSubmit}>
              <HoneypotField />
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder={t.email_placeholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {/* Optional and it means it — no `required`, and the placeholder
                  says so in every locale. This is the field that turns a
                  subscriber into a lead a partner will accept. */}
              <input
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t.phone_placeholder}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? t.btn_sending : t.btn_idle}
              </button>
              {status === 'error' && <p className="cp-err">{t.error}</p>}
            </form>
            <p className="cp-fine">{t.no_spam}</p>
          </>
        )}
      </div>
    </div>
  );
}
