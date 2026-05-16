import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { localeFromPath } from '@/lib/i18n';

// ── Locale-specific copy ────────────────────────────────────────────────────
const COPY = {
  en: {
    eyebrow: 'Get in Touch',
    heading_pre: 'Speak to an',
    heading_em: 'expert',
    sub: "Tell us what you're looking for and one of our co-ownership specialists will be in touch within 24 hours.",
    name_label: 'Name',
    name_placeholder: 'Your full name',
    email_label: 'Email',
    email_placeholder: 'your@email.com',
    phone_label: 'Phone',
    phone_placeholder: '+44 or +1…',
    budget_label: 'Approximate Budget',
    budget_select: 'Select range',
    destinations_label: 'Destinations Interested In',
    destinations_placeholder: 'Select destinations…',
    message_label: 'Message',
    message_placeholder: 'Tell us about the destination, property type, or anything else…',
    btn_idle: 'Send Enquiry',
    btn_sending: 'Sending…',
    btn_success: 'Sent!',
    msg_validation: 'Please fill in your name and email.',
    msg_success: "Thank you! We'll be in touch within 24 hours.",
    msg_error: 'Something went wrong. Please try again.',
    msg_network: 'Network error. Please try again.',
    required: '*',
  },
  es: {
    eyebrow: 'Contáctanos',
    heading_pre: 'Habla con un',
    heading_em: 'experto',
    sub: 'Cuéntanos qué buscas y uno de nuestros especialistas en copropiedad se pondrá en contacto contigo en menos de 24 horas.',
    name_label: 'Nombre',
    name_placeholder: 'Tu nombre completo',
    email_label: 'Correo electrónico',
    email_placeholder: 'tu@email.com',
    phone_label: 'Teléfono',
    phone_placeholder: '+34 o +1…',
    budget_label: 'Presupuesto aproximado',
    budget_select: 'Seleccionar rango',
    destinations_label: 'Destinos de interés',
    destinations_placeholder: 'Seleccionar destinos…',
    message_label: 'Mensaje',
    message_placeholder: 'Cuéntanos sobre el destino, tipo de propiedad o cualquier otra cosa…',
    btn_idle: 'Enviar consulta',
    btn_sending: 'Enviando…',
    btn_success: '¡Enviado!',
    msg_validation: 'Por favor, completa tu nombre y correo electrónico.',
    msg_success: '¡Gracias! Nos pondremos en contacto contigo en menos de 24 horas.',
    msg_error: 'Algo salió mal. Inténtalo de nuevo.',
    msg_network: 'Error de red. Inténtalo de nuevo.',
    required: '*',
  },
  fr: {
    eyebrow: 'Nous contacter',
    heading_pre: 'Parlez à un',
    heading_em: 'expert',
    sub: 'Dites-nous ce que vous recherchez et un de nos spécialistes en copropriété vous contactera sous 24 heures.',
    name_label: 'Nom',
    name_placeholder: 'Votre nom complet',
    email_label: 'Email',
    email_placeholder: 'vous@email.com',
    phone_label: 'Téléphone',
    phone_placeholder: '+33 ou +1…',
    budget_label: 'Budget approximatif',
    budget_select: 'Sélectionner une fourchette',
    destinations_label: "Destinations d'intérêt",
    destinations_placeholder: 'Sélectionner des destinations…',
    message_label: 'Message',
    message_placeholder: 'Parlez-nous de votre destination favorite, du type de bien ou de toute autre info…',
    btn_idle: 'Envoyer la demande',
    btn_sending: 'Envoi en cours…',
    btn_success: 'Envoyé !',
    msg_validation: 'Veuillez renseigner votre nom et email.',
    msg_success: 'Merci ! Nous vous contacterons sous 24 heures.',
    msg_error: "Une erreur s'est produite. Veuillez réessayer.",
    msg_network: 'Erreur réseau. Veuillez réessayer.',
    required: '*',
  },
  de: {
    eyebrow: 'Kontakt aufnehmen',
    heading_pre: 'Sprechen Sie mit',
    heading_em: 'einem Experten',
    sub: 'Sagen Sie uns, wonach Sie suchen, und einer unserer Miteigentums-Spezialisten meldet sich innerhalb von 24 Stunden bei Ihnen.',
    name_label: 'Name',
    name_placeholder: 'Ihr vollständiger Name',
    email_label: 'E-Mail',
    email_placeholder: 'ihre@email.com',
    phone_label: 'Telefon',
    phone_placeholder: '+49 oder +1…',
    budget_label: 'Ungefähres Budget',
    budget_select: 'Bereich auswählen',
    destinations_label: 'Interessante Reiseziele',
    destinations_placeholder: 'Reiseziele auswählen…',
    message_label: 'Nachricht',
    message_placeholder: 'Erzählen Sie uns vom Reiseziel, Immobilientyp oder allem, was Ihnen wichtig ist…',
    btn_idle: 'Anfrage senden',
    btn_sending: 'Wird gesendet…',
    btn_success: 'Gesendet!',
    msg_validation: 'Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse ein.',
    msg_success: 'Vielen Dank! Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    msg_error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    msg_network: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    required: '*',
  },
};

// ── Locale-specific destination tree ─────────────────────────────────────────
// The country headers and child labels are translated. The values stored when
// the user selects an option remain the same English internal keys so the API
// receives consistent data regardless of the visitor's locale.
const DEST_TREES = {
  en: [
    { country: 'Spain',          children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearic Islands', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanish Costas', 'Barcelona', 'Madrid', 'Canary Islands', 'Pyrenees'] },
    { country: 'France',         children: ['South of France', 'French Alps', 'Paris'] },
    { country: 'Italy',          children: ['Italian Lakes', 'Lake Como', 'Lake Garda', 'Liguria', 'Sardinia'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — California', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'United Kingdom', children: ['London', 'England'] },
    { country: 'Other',          children: ['Austria', 'Croatia', 'Germany', 'Mexico', 'Portugal', 'Sweden'] },
  ],
  es: [
    { country: 'España',         children: ['Mallorca', 'Ibiza', 'Menorca', 'Islas Baleares', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Costas españolas', 'Barcelona', 'Madrid', 'Islas Canarias', 'Pirineos'] },
    { country: 'Francia',        children: ['Sur de Francia', 'Alpes franceses', 'París'] },
    { country: 'Italia',         children: ['Lagos italianos', 'Lago de Como', 'Lago de Garda', 'Liguria', 'Cerdeña'] },
    { country: 'EE. UU. — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'EE. UU. — Florida',  children: ['Miami', 'Brickell', 'Cayos de Florida', '30A Costa Esmeralda'] },
    { country: 'EE. UU. — California', children: ['Malibú y Santa Bárbara', 'Newport Beach', 'Napa y Sonoma', 'Lago Tahoe', 'Palm Springs'] },
    { country: 'EE. UU. — Utah', children: ['Park City'] },
    { country: 'Reino Unido',    children: ['Londres', 'Inglaterra'] },
    { country: 'Otros',          children: ['Austria', 'Croacia', 'Alemania', 'México', 'Portugal', 'Suecia'] },
  ],
  fr: [
    { country: 'Espagne',        children: ['Majorque', 'Ibiza', 'Minorque', 'Îles Baléares', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Côtes espagnoles', 'Barcelone', 'Madrid', 'Îles Canaries', 'Pyrénées'] },
    { country: 'France',         children: ['Sud de la France', 'Alpes françaises', 'Paris'] },
    { country: 'Italie',         children: ['Lacs italiens', 'Lac de Côme', 'Lac de Garde', 'Ligurie', 'Sardaigne'] },
    { country: 'États-Unis — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'États-Unis — Floride',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'États-Unis — Californie', children: ['Malibu et Santa Barbara', 'Newport Beach', 'Napa et Sonoma', 'Lac Tahoe', 'Palm Springs'] },
    { country: 'États-Unis — Utah',  children: ['Park City'] },
    { country: 'Royaume-Uni',    children: ['Londres', 'Angleterre'] },
    { country: 'Autre',          children: ['Autriche', 'Croatie', 'Allemagne', 'Mexique', 'Portugal', 'Suède'] },
  ],
  de: [
    { country: 'Spanien',        children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearen', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanische Costas', 'Barcelona', 'Madrid', 'Kanarische Inseln', 'Pyrenäen'] },
    { country: 'Frankreich',     children: ['Südfrankreich', 'Französische Alpen', 'Paris'] },
    { country: 'Italien',        children: ['Italienische Seen', 'Comer See', 'Gardasee', 'Ligurien', 'Sardinien'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — Kalifornien', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Vereinigtes Königreich', children: ['London', 'England'] },
    { country: 'Sonstige',       children: ['Österreich', 'Kroatien', 'Deutschland', 'Mexiko', 'Portugal', 'Schweden'] },
  ],
};

// ── Locale-specific budget options ───────────────────────────────────────────
// Values remain English keys; only the displayed labels change.
const BUDGET_OPTIONS = {
  en: [
    { value: 'under-100k', label: 'Under €100,000' },
    { value: '100-200k',   label: '€100,000 – €200,000' },
    { value: '200-350k',   label: '€200,000 – €350,000' },
    { value: '350-500k',   label: '€350,000 – €500,000' },
    { value: '500-750k',   label: '€500,000 – €750,000' },
    { value: '750k-1m',    label: '€750,000 – €1,000,000' },
    { value: '1m-plus',    label: '€1,000,000+' },
  ],
  es: [
    { value: 'under-100k', label: 'Menos de €100.000' },
    { value: '100-200k',   label: '€100.000 – €200.000' },
    { value: '200-350k',   label: '€200.000 – €350.000' },
    { value: '350-500k',   label: '€350.000 – €500.000' },
    { value: '500-750k',   label: '€500.000 – €750.000' },
    { value: '750k-1m',    label: '€750.000 – €1.000.000' },
    { value: '1m-plus',    label: '€1.000.000+' },
  ],
  fr: [
    { value: 'under-100k', label: 'Moins de 100 000 €' },
    { value: '100-200k',   label: '100 000 € – 200 000 €' },
    { value: '200-350k',   label: '200 000 € – 350 000 €' },
    { value: '350-500k',   label: '350 000 € – 500 000 €' },
    { value: '500-750k',   label: '500 000 € – 750 000 €' },
    { value: '750k-1m',    label: '750 000 € – 1 000 000 €' },
    { value: '1m-plus',    label: '1 000 000 €+' },
  ],
  de: [
    { value: 'under-100k', label: 'Unter 100.000 €' },
    { value: '100-200k',   label: '100.000 € – 200.000 €' },
    { value: '200-350k',   label: '200.000 € – 350.000 €' },
    { value: '350-500k',   label: '350.000 € – 500.000 €' },
    { value: '500-750k',   label: '500.000 € – 750.000 €' },
    { value: '750k-1m',    label: '750.000 € – 1.000.000 €' },
    { value: '1m-plus',    label: '1.000.000 €+' },
  ],
};

function DestinationPicker({ selected, onChange, locale, t }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const wrapRef = useRef(null);

  const tree = DEST_TREES[locale] || DEST_TREES.en;

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function toggleExpand(country) {
    setExpanded(prev => ({ ...prev, [country]: !prev[country] }));
  }

  function toggleOption(val) {
    onChange(
      selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val]
    );
  }

  function removeTag(val, e) {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  }

  return (
    <div className={`dest-multiselect${open ? ' open' : ''}`} ref={wrapRef}>
      <div
        className="dest-trigger"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
      >
        {selected.length === 0 && (
          <span className="dest-placeholder">{t.destinations_placeholder}</span>
        )}
        {selected.map(val => (
          <span key={val} className="dest-tag">
            {val}
            <span className="dest-tag-x" onMouseDown={e => removeTag(val, e)}>×</span>
          </span>
        ))}
      </div>

      <div className="dest-dropdown" role="listbox" aria-multiselectable="true">
        {tree.map(({ country, children }) => (
          <div key={country} className="dest-group">
            <div
              className={`dest-group-header${expanded[country] ? ' expanded' : ''}`}
              onClick={() => toggleExpand(country)}
            >
              <span className="dest-group-arrow">›</span>
              {country}
            </div>

            {expanded[country] && (
              <div className="dest-group-children">
                {children.map(child => {
                  const isSelected = selected.includes(child);
                  return (
                    <div
                      key={child}
                      className={`dest-option${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleOption(child)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="dest-check" />
                      {child}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpertForm({ property }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;
  const budgetOptions = BUDGET_OPTIONS[locale] || BUDGET_OPTIONS.en;

  const saved = getSavedUser();
  const [name, setName] = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [destinations, setDestinations] = useState([]);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const formRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    const phone    = form.querySelector('[name="phone"]').value.trim();
    const budget   = form.querySelector('[name="budget"]').value;
    const message  = form.querySelector('[name="message"]').value.trim();
    const destStr  = destinations.join('; ');

    if (!name || !email) {
      setMsg(t.msg_validation);
      setStatus('error');
      return;
    }

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, budget, destination: destStr, message, property, locale }),
      });
      const data = await res.json();
      if (data.ok) {
        saveUser({ name, email });
        setStatus('success');
        setMsg(t.msg_success);
        form.reset();
        setDestinations([]);
        trackConversion('generate_lead', 'Lead', {
          event_category: 'enquiry',
          destination: destStr || 'unspecified',
          budget,
          locale,
        });
        track('enquiry_submitted', {
          source: 'expert_form',
          destination: destStr || 'unspecified',
          budget: budget || 'unspecified',
          locale,
        });
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
    <section className="expert-section" id="speak-to-expert">
      <div className="expert-inner">
        <p className="expert-eyebrow">{t.eyebrow}</p>
        <h2 className="expert-heading">{t.heading_pre} <em>{t.heading_em}</em></h2>
        <p className="expert-sub">{t.sub}</p>

        <form className="expert-form" id="expert-enquiry-form" onSubmit={handleSubmit} noValidate ref={formRef}>
          <div className="expert-form-grid">

            <div className="expert-form-field">
              <label htmlFor="ef-name">{t.name_label} <span>{t.required}</span></label>
              <input type="text" id="ef-name" name="name" placeholder={t.name_placeholder} required value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-email">{t.email_label} <span>{t.required}</span></label>
              <input type="email" id="ef-email" name="email" placeholder={t.email_placeholder} required value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-phone">{t.phone_label} {t.required}</label>
              <input type="tel" id="ef-phone" name="phone" placeholder={t.phone_placeholder} required />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-budget">{t.budget_label}</label>
              <select id="ef-budget" name="budget">
                <option value="">{t.budget_select}</option>
                {budgetOptions.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="expert-form-field expert-form-field--wide">
              <label>{t.destinations_label}</label>
              <DestinationPicker selected={destinations} onChange={setDestinations} locale={locale} t={t} />
            </div>

            <div className="expert-form-field expert-form-field--wide">
              <label htmlFor="ef-message">{t.message_label}</label>
              <textarea id="ef-message" name="message" rows={4} placeholder={t.message_placeholder}></textarea>
            </div>

          </div>

          <button
            type="submit"
            className="expert-submit-btn"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? t.btn_sending : status === 'success' ? t.btn_success : t.btn_idle}
          </button>

          {msg && (
            <p className={`expert-form-msg${status === 'success' ? ' success' : ' error'}`}>{msg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
