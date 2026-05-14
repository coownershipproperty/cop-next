import { useState, useMemo } from 'react';

// Locale-specific copy. Inline rather than messages/*.json because the strings are
// tightly coupled to this component's UX (calculator labels, share size dropdown options).
const COPY = {
  en: {
    eyebrow: 'Financing',
    h1_a: 'Your way into',
    h1_b: 'ownership',
    sub: 'Own starting at 30% down',
    body: 'As a co-ownership buyer, you can qualify for financing — an option typically unheard of for second-home purchases. We work with partner financial institutions to offer competitive rates to qualifying buyers. With as little as 30% down on an interest-only loan, you can own at a lower upfront cost.',
    cta: 'Get Pre-Approved →',
    calc_heading: 'Estimate your monthly financing',
    label_share: 'Ownership',
    label_down: 'Down Payment',
    label_rate: 'Interest Rate',
    label_term: 'Loan Type',
    share_one_eighth: '1/8 share',
    share_one_fourth: '1/4 share',
    share_one_half: '1/2 share',
    share_full: 'Full ownership',
    term_io: 'Interest-only (10 yr)',
    term_amort: '30-year amortising',
    monthly_label: (share) => `${share} ownership financing`,
    per_month: '/month',
    note: 'Estimates only — final terms depend on the lender and your credit profile.',
  },
  es: {
    eyebrow: 'Financiación',
    h1_a: 'Tu camino hacia',
    h1_b: 'la propiedad',
    sub: 'Adquirir desde el 30% de entrada',
    body: 'Como comprador en copropiedad, puedes optar a financiación — una opción poco habitual en la compra de segundas residencias. Trabajamos con entidades financieras asociadas para ofrecer tipos competitivos a los compradores cualificados. Desde solo un 30% de entrada con un préstamo de solo intereses, puedes comprar con menor desembolso inicial.',
    cta: 'Solicitar pre-aprobación →',
    calc_heading: 'Calcula tu cuota mensual',
    label_share: 'Propiedad',
    label_down: 'Entrada',
    label_rate: 'Tipo de interés',
    label_term: 'Tipo de préstamo',
    share_one_eighth: '1/8 de propiedad',
    share_one_fourth: '1/4 de propiedad',
    share_one_half: '1/2 propiedad',
    share_full: 'Propiedad completa',
    term_io: 'Solo intereses (10 años)',
    term_amort: 'Amortizado 30 años',
    monthly_label: (share) => `Financiación de ${share}`,
    per_month: '/mes',
    note: 'Solo estimación — las condiciones finales dependen del prestamista y de tu perfil crediticio.',
  },
  fr: {
    eyebrow: 'Financement',
    h1_a: 'Votre accès à',
    h1_b: 'la propriété',
    sub: 'Acquérir avec 30 % d\'apport',
    body: 'En tant qu\'acheteur en copropriété, vous pouvez prétendre à un financement — une option rarement disponible pour une résidence secondaire. Nous collaborons avec des établissements financiers partenaires pour proposer des taux compétitifs aux acheteurs éligibles. Avec seulement 30 % d\'apport et un prêt in fine, vous accédez à la propriété à moindre coût initial.',
    cta: 'Obtenir un pré-accord →',
    calc_heading: 'Estimez votre mensualité',
    label_share: 'Propriété',
    label_down: 'Apport',
    label_rate: 'Taux d\'intérêt',
    label_term: 'Type de prêt',
    share_one_eighth: '1/8 de la propriété',
    share_one_fourth: '1/4 de la propriété',
    share_one_half: '1/2 propriété',
    share_full: 'Propriété complète',
    term_io: 'In fine (10 ans)',
    term_amort: 'Amortissable 30 ans',
    monthly_label: (share) => `Financement de ${share}`,
    per_month: '/mois',
    note: 'Estimation indicative — les conditions définitives dépendent du prêteur et de votre profil.',
  },
  de: {
    eyebrow: 'Finanzierung',
    h1_a: 'Ihr Weg zur',
    h1_b: 'Eigentümerschaft',
    sub: 'Erwerb ab 30 % Eigenkapital',
    body: 'Als Miteigentums-Käufer können Sie eine Finanzierung erhalten — eine Option, die bei Zweitimmobilien sonst kaum verfügbar ist. Wir arbeiten mit Partner-Finanzinstituten zusammen, um qualifizierten Käufern wettbewerbsfähige Konditionen anzubieten. Mit nur 30 % Eigenkapital bei einem endfälligen Darlehen erwerben Sie zu deutlich geringeren Anfangskosten.',
    cta: 'Vorab-Genehmigung anfragen →',
    calc_heading: 'Monatliche Finanzierung berechnen',
    label_share: 'Eigentum',
    label_down: 'Eigenkapital',
    label_rate: 'Zinssatz',
    label_term: 'Kreditart',
    share_one_eighth: '1/8-Anteil',
    share_one_fourth: '1/4-Anteil',
    share_one_half: '1/2-Anteil',
    share_full: 'Volles Eigentum',
    term_io: 'Endfällig (10 Jahre)',
    term_amort: '30 Jahre annuitätisch',
    monthly_label: (share) => `${share}-Finanzierung`,
    per_month: '/Monat',
    note: 'Nur Schätzung — die endgültigen Konditionen hängen vom Kreditgeber und Ihrer Bonität ab.',
  },
};

const C = {
  navy:  '#143047',
  gold:  '#C9A84C',
  cream: '#F5F2EC',
  muted: '#6B8A9E',
  white: '#FFFFFF',
  border: 'rgba(255,255,255,0.12)',
};

const SYM = { USD: '$', EUR: '€', GBP: '£' };

function formatMoney(amount, currency, locale) {
  const sym = SYM[currency] || currency;
  const localeFmt = locale === 'de' ? 'de-DE'
                  : locale === 'fr' ? 'fr-FR'
                  : locale === 'es' ? 'es-ES'
                  : 'en-US';
  return `${sym}${Math.round(amount).toLocaleString(localeFmt)}`;
}

/**
 * Financing calculator for property detail pages.
 *
 * @param {object} props
 * @param {number}    props.sharePrice  — the price per share, as a number
 * @param {string}    props.currency    — 'USD' | 'EUR' | 'GBP'
 * @param {string}    [props.locale]    — 'en' | 'es' | 'fr' | 'de'
 * @param {function}  [props.onCtaClick] — invoked when "Get Pre-Approved" is clicked
 *                                         (default: scrolls to the on-page enquiry form)
 */
export default function FinancingCalculator({ sharePrice, currency = 'USD', locale = 'en', onCtaClick }) {
  const t = COPY[locale] || COPY.en;

  const [shareKey, setShareKey] = useState('one_eighth');  // one_eighth | one_fourth | one_half | full
  const [downPct, setDownPct]   = useState(30);            // 10 | 20 | 30 | 40 | 50
  const [ratePct, setRatePct]   = useState(6.5);           // 3.0–9.0
  const [term, setTerm]         = useState('io');          // 'io' (interest-only 10y) | 'amort' (30y amortising)

  // Display-share label
  const shareLabel = t[`share_${shareKey}`];

  // Loan math
  const downAmount = sharePrice * (downPct / 100);
  const loanAmount = sharePrice - downAmount;
  const monthlyRate = (ratePct / 100) / 12;
  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    if (monthlyRate <= 0) {
      // 0% edge case
      return term === 'amort' ? loanAmount / (30 * 12) : 0;
    }
    if (term === 'amort') {
      const n = 30 * 12;
      return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
    }
    // interest-only
    return loanAmount * monthlyRate;
  }, [loanAmount, monthlyRate, term]);

  function handleCtaClick(e) {
    e.preventDefault();
    if (typeof onCtaClick === 'function') return onCtaClick();
    // Default: scroll to the on-page enquiry form (the right-column form on /property/[slug]/)
    const el = document.querySelector('input[name="email"], #enquiry-form, [data-enquiry-form]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.tagName === 'INPUT') el.focus();
    }
  }

  return (
    <section className="cop-fin">
      <div className="cop-fin-inner">
        {/* Left — pitch + CTA */}
        <div className="cop-fin-left">
          <p className="cop-fin-eyebrow">{t.eyebrow}</p>
          <h2 className="cop-fin-h1">
            {t.h1_a} <em>{t.h1_b}</em>
          </h2>
          <p className="cop-fin-sub">{t.sub}</p>
          <p className="cop-fin-body">{t.body}</p>
          <button type="button" className="cop-fin-cta" onClick={handleCtaClick}>
            {t.cta}
          </button>
        </div>

        {/* Right — calculator card */}
        <div className="cop-fin-right">
          <div className="cop-fin-card">
            <h3 className="cop-fin-card-h">{t.calc_heading}</h3>

            <div className="cop-fin-row">
              <div className="cop-fin-field">
                <label className="cop-fin-label">{t.label_share}</label>
                <select
                  className="cop-fin-input"
                  value={shareKey}
                  onChange={e => setShareKey(e.target.value)}
                >
                  <option value="one_eighth">{t.share_one_eighth}</option>
                  <option value="one_fourth">{t.share_one_fourth}</option>
                  <option value="one_half">{t.share_one_half}</option>
                  <option value="full">{t.share_full}</option>
                </select>
                <p className="cop-fin-helper">{formatMoney(sharePrice, currency, locale)}</p>
              </div>

              <div className="cop-fin-field">
                <label className="cop-fin-label">{t.label_down}</label>
                <select
                  className="cop-fin-input"
                  value={downPct}
                  onChange={e => setDownPct(Number(e.target.value))}
                >
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                  <option value={30}>30%</option>
                  <option value={40}>40%</option>
                  <option value={50}>50%</option>
                </select>
                <p className="cop-fin-helper">{formatMoney(downAmount, currency, locale)}</p>
              </div>
            </div>

            <div className="cop-fin-row cop-fin-row-rate">
              <div className="cop-fin-field cop-fin-field-rate">
                <label className="cop-fin-label">
                  {t.label_rate}: <span className="cop-fin-rate-val">{ratePct.toFixed(2)}%</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="9"
                  step="0.1"
                  value={ratePct}
                  onChange={e => setRatePct(Number(e.target.value))}
                  className="cop-fin-range"
                  aria-label={t.label_rate}
                />
              </div>

              <div className="cop-fin-field cop-fin-field-term">
                <label className="cop-fin-label">{t.label_term}</label>
                <select
                  className="cop-fin-input"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                >
                  <option value="io">{t.term_io}</option>
                  <option value="amort">{t.term_amort}</option>
                </select>
              </div>
            </div>

            {/* Monthly result */}
            <div className="cop-fin-result">
              <p className="cop-fin-result-label">{t.monthly_label(shareLabel)}</p>
              <p className="cop-fin-result-amount">
                {formatMoney(monthlyPayment, currency, locale)}
                <span className="cop-fin-result-per">{t.per_month}</span>
              </p>
            </div>

            <p className="cop-fin-note">{t.note}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cop-fin {
          background: ${C.navy};
          padding: 80px 24px;
          color: ${C.white};
        }
        .cop-fin-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 80px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .cop-fin { padding: 56px 20px; }
          .cop-fin-inner { grid-template-columns: 1fr; gap: 40px; }
        }

        /* Left column */
        .cop-fin-eyebrow {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${C.gold};
          margin: 0 0 18px;
        }
        .cop-fin-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 44px;
          font-weight: 400;
          line-height: 1.15;
          margin: 0 0 18px;
          color: ${C.white};
        }
        .cop-fin-h1 em {
          font-style: italic;
          color: ${C.gold};
          font-weight: 400;
        }
        .cop-fin-sub {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: ${C.gold};
          margin: 0 0 18px;
        }
        .cop-fin-body {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 15px;
          line-height: 1.75;
          color: rgba(255,255,255,0.85);
          margin: 0 0 28px;
          max-width: 520px;
        }
        .cop-fin-cta {
          display: inline-block;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.navy};
          background: ${C.gold};
          border: none;
          padding: 16px 32px;
          cursor: pointer;
          transition: opacity 180ms ease, transform 180ms ease;
        }
        .cop-fin-cta:hover { opacity: 0.92; transform: translateY(-1px); }

        /* Right column — calculator card */
        .cop-fin-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid ${C.border};
          padding: 36px 32px;
        }
        .cop-fin-card-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: ${C.white};
          margin: 0 0 24px;
        }
        .cop-fin-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }
        @media (max-width: 480px) {
          .cop-fin-row { grid-template-columns: 1fr; }
        }
        .cop-fin-row-rate { align-items: end; }
        .cop-fin-label {
          display: block;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: 8px;
        }
        .cop-fin-rate-val {
          color: ${C.gold};
          font-weight: 700;
        }
        .cop-fin-input {
          width: 100%;
          background: rgba(255,255,255,0.08);
          color: ${C.white};
          border: 1px solid ${C.border};
          border-radius: 0;
          padding: 10px 12px;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 14px;
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23C9A84C' d='M6 8L0 0h12z'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .cop-fin-input:focus { outline: 1px solid ${C.gold}; }
        .cop-fin-helper {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin: 6px 0 0;
        }
        .cop-fin-range {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 0;
          outline: none;
          cursor: pointer;
        }
        .cop-fin-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: ${C.gold};
          border-radius: 50%;
          cursor: pointer;
        }
        .cop-fin-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: ${C.gold};
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
        .cop-fin-result {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 22px 0 18px;
          border-top: 1px solid ${C.border};
          margin-top: 16px;
        }
        .cop-fin-result-label {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }
        .cop-fin-result-amount {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 30px;
          font-weight: 400;
          color: ${C.gold};
          margin: 0;
        }
        .cop-fin-result-per {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          font-family: 'Nunito Sans', Arial, sans-serif;
          margin-left: 4px;
        }
        .cop-fin-note {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin: 12px 0 0;
          line-height: 1.55;
        }
      `}</style>
    </section>
  );
}
