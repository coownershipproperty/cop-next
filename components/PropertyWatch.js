import { useState } from 'react';

/**
 * PropertyWatch — two micro-commitment captures on property pages.
 *
 *   mode 'watch'    (live homes): quiet "Track this home" row — price &
 *                   availability alerts for exactly this home.
 *   mode 'waitlist' (sold homes): the sold page stops being a dead end —
 *                   "join the waitlist, first look at the next {region} home".
 *
 * Self-contained: own copy map, posts to /api/track-property.
 */
const COPY = {
  en: {
    watch_title: 'Track this home',
    watch_sub: 'Price changes and availability — only for this home, never spam.',
    wait_title: 'This one found its owners.',
    wait_sub: (region) => `Join the waitlist and get first look at the next ${region} home — before the newsletter, before anyone.`,
    placeholder: 'Your email address',
    watch_btn: 'Track',
    wait_btn: 'Join the waitlist',
    done_watch: "You're tracking this home — we'll email you the moment anything changes.",
    done_wait: "You're on the list — you'll see the next one first.",
    error: 'Something went wrong — please try again.',
  },
  es: {
    watch_title: 'Seguir esta propiedad',
    watch_sub: 'Cambios de precio y disponibilidad — solo de esta propiedad.',
    wait_title: 'Esta ya encontró a sus propietarios.',
    wait_sub: (region) => `Únete a la lista de espera y sé el primero en ver la próxima propiedad en ${region}.`,
    placeholder: 'Tu correo electrónico',
    watch_btn: 'Seguir',
    wait_btn: 'Unirme a la lista',
    done_watch: 'Estás siguiendo esta propiedad — te avisaremos en cuanto algo cambie.',
    done_wait: 'Estás en la lista — verás la próxima antes que nadie.',
    error: 'Algo salió mal — inténtalo de nuevo.',
  },
  fr: {
    watch_title: 'Suivre ce bien',
    watch_sub: 'Prix et disponibilité — uniquement pour ce bien, jamais de spam.',
    wait_title: 'Celui-ci a trouvé ses propriétaires.',
    wait_sub: (region) => `Rejoignez la liste d'attente et découvrez le prochain bien en ${region} avant tout le monde.`,
    placeholder: 'Votre adresse e-mail',
    watch_btn: 'Suivre',
    wait_btn: "Rejoindre la liste",
    done_watch: 'Vous suivez ce bien — nous vous écrirons dès que quelque chose change.',
    done_wait: 'Vous êtes sur la liste — vous verrez le prochain en premier.',
    error: 'Une erreur est survenue — veuillez réessayer.',
  },
};

export default function PropertyWatch({ slug, region, locale = 'en', mode = 'watch' }) {
  const t = COPY[locale] || COPY.en;
  const [open, setOpen] = useState(mode === 'waitlist'); // waitlist is always open
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error

  async function submit(e) {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/track-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug, kind: mode, locale }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className={`pw-box${mode === 'waitlist' ? ' pw-waitlist' : ''}`}>
        <p className="pw-done">✓ {mode === 'waitlist' ? t.done_wait : t.done_watch}</p>
      </div>
    );
  }

  return (
    <div className={`pw-box${mode === 'waitlist' ? ' pw-waitlist' : ''}`}>
      {mode === 'waitlist' ? (
        <>
          <p className="pw-title">{t.wait_title}</p>
          <p className="pw-sub">{t.wait_sub(region || 'this region')}</p>
        </>
      ) : !open ? (
        <button className="pw-toggle" onClick={() => setOpen(true)}>
          <BellIcon /> {t.watch_title}
          <span className="pw-toggle-sub">{t.watch_sub}</span>
        </button>
      ) : (
        <>
          <p className="pw-title"><BellIcon /> {t.watch_title}</p>
          <p className="pw-sub">{t.watch_sub}</p>
        </>
      )}
      {(open || mode === 'waitlist') && (
        <form className="pw-form" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
          />
          <button type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? '…' : mode === 'waitlist' ? t.wait_btn : t.watch_btn}
          </button>
        </form>
      )}
      {state === 'error' && <p className="pw-error">{t.error}</p>}
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, verticalAlign: '-2px', marginRight: 6 }}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}
