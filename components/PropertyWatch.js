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
  de: {
    watch_title: "Diese Immobilie im Blick behalten",
    watch_sub: "Preisänderungen und verfügbare Anteile — nur für diese Immobilie, kein Spam.",
    wait_title: "Diese Immobilie hat ihre Eigentümer gefunden.",
    wait_sub: (region) => `Tragen Sie sich in die Warteliste ein und sehen Sie die nächste Immobilie in der Region ${region} zuerst — vor dem Newsletter, vor allen anderen.`,
    placeholder: "Ihre E-Mail-Adresse",
    watch_btn: "Im Blick behalten",
    wait_btn: "Auf die Warteliste",
    done_watch: "Sie behalten diese Immobilie im Blick — wir melden uns per E-Mail, sobald sich etwas ändert.",
    done_wait: "Sie stehen auf der Liste — die nächste Immobilie sehen Sie zuerst.",
    error: "Etwas ist schiefgelaufen — bitte erneut versuchen.",
  },
  it: {
    watch_title: "Segui questa casa",
    watch_sub: "Variazioni di prezzo e disponibilità — solo per questa casa, mai spam.",
    wait_title: "Questa casa ha trovato i suoi comproprietari.",
    wait_sub: (region) => `Si iscriva alla lista d'attesa e vedrà la prossima casa in ${region} in anteprima — prima della newsletter, prima di tutti.`,
    placeholder: "Il suo indirizzo email",
    watch_btn: "Segui",
    wait_btn: "Iscriviti alla lista d'attesa",
    done_watch: "Sta seguendo questa casa — le scriveremo non appena qualcosa cambia.",
    done_wait: "È in lista — vedrà la prossima casa prima di tutti.",
    error: "Qualcosa è andato storto — riprovi, per favore.",
  },
  nl: {
    watch_title: "Volg deze woning",
    watch_sub: "Prijswijzigingen en beschikbaarheid — alleen voor deze woning, nooit spam.",
    wait_title: "Deze woning heeft haar eigenaren gevonden.",
    wait_sub: (region) => `Schrijf u in voor de wachtlijst en u ziet de volgende ${region}-woning als eerste — vóór de nieuwsbrief, vóór iedereen.`,
    placeholder: "Uw e-mailadres",
    watch_btn: "Volgen",
    wait_btn: "Inschrijven voor de wachtlijst",
    done_watch: "U volgt deze woning — we mailen u zodra er iets verandert.",
    done_wait: "U staat op de lijst — u ziet de volgende woning als eerste.",
    error: "Er is iets misgegaan — probeer het opnieuw.",
  },
  pt: {
    watch_title: "Acompanhar esta casa",
    watch_sub: "Alterações de preço e disponibilidade — apenas sobre esta casa, nunca spam.",
    wait_title: "Esta casa já encontrou os seus proprietários.",
    wait_sub: (region) => `Junte-se à lista de espera e seja o primeiro a ver a próxima casa em ${region} — antes da newsletter, antes de todos.`,
    placeholder: "O seu endereço de email",
    watch_btn: "Acompanhar",
    wait_btn: "Entrar na lista de espera",
    done_watch: "Está a acompanhar esta casa — enviamos-lhe um email assim que algo mudar.",
    done_wait: "Está na lista — verá a próxima casa em primeiro lugar.",
    error: "Algo correu mal — por favor, tente novamente.",
  },
  sv: {
    watch_title: 'Bevaka det här huset',
    watch_sub: 'Prisändringar och tillgänglighet — bara för det här huset, aldrig spam.',
    wait_title: 'Det här huset har hittat sina ägare.',
    wait_sub: (region) => `Ställ dig i kön och få se nästa hus i ${region} först — före nyhetsbrevet, före alla andra.`,
    placeholder: 'Din e-postadress',
    watch_btn: 'Bevaka',
    wait_btn: 'Ställ mig i kön',
    done_watch: 'Du bevakar det här huset — vi mejlar dig så fort något ändras.',
    done_wait: 'Du står i kön — du får se nästa hus först.',
    error: 'Något gick fel — försök igen.',
  },
  da: {
    watch_title: 'Følg denne bolig',
    watch_sub: 'Prisændringer og ledighed — kun for denne bolig, aldrig spam.',
    wait_title: 'Denne bolig har fundet sine ejere.',
    wait_sub: (region) => `Kom på ventelisten og få det første kig på den næste bolig i ${region} — før nyhedsbrevet, før alle andre.`,
    placeholder: 'Din e-mailadresse',
    watch_btn: 'Følg',
    wait_btn: 'Kom på ventelisten',
    done_watch: 'Du følger denne bolig — vi skriver, så snart noget ændrer sig.',
    done_wait: 'Du er på listen — du ser den næste først.',
    error: 'Noget gik galt — prøv igen.',
  },
  no: {
    watch_title: 'Følg denne boligen',
    watch_sub: 'Prisendringer og ledighet — kun for denne boligen, aldri spam.',
    wait_title: 'Denne boligen har funnet eierne sine.',
    wait_sub: (region) => `Bli med på ventelisten og få se neste bolig i ${region} først — før nyhetsbrevet, før alle andre.`,
    placeholder: 'Din e-postadresse',
    watch_btn: 'Følg',
    wait_btn: 'Bli med på ventelisten',
    done_watch: 'Du følger denne boligen — vi sender deg en e-post så snart noe endres.',
    done_wait: 'Du står på listen — du ser den neste først.',
    error: 'Noe gikk galt — prøv igjen.',
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
    <div className={`pw-box${mode === 'waitlist' ? ' pw-waitlist' : !open ? ' pw-collapsed' : ''}`}>
      {mode === 'waitlist' ? (
        <>
          <p className="pw-title">{t.wait_title}</p>
          <p className="pw-sub">{t.wait_sub(region || 'this region')}</p>
        </>
      ) : !open ? (
        <button type="button" className="pw-toggle" aria-expanded={false} onClick={() => setOpen(true)}>
          <span className="pw-toggle-icon" aria-hidden="true"><BellIcon /></span>
          <span className="pw-toggle-copy"><span>{t.watch_title}</span>
            <span className="pw-toggle-sub">{t.watch_sub}</span>
          </span>
          <span className="pw-toggle-action" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M14 6l6 6-6 6" /></svg></span>
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
            autoFocus={open && mode !== 'waitlist'}
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
