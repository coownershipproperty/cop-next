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
    share_one_eighth: '1/8 share',
    share_one_fourth: '1/4 share',
    share_one_half: '1/2 share',
    share_full: 'Full ownership',
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
    share_one_eighth: '1/8 de propiedad',
    share_one_fourth: '1/4 de propiedad',
    share_one_half: '1/2 propiedad',
    share_full: 'Propiedad completa',
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
    share_one_eighth: '1/8 de la propriété',
    share_one_fourth: '1/4 de la propriété',
    share_one_half: '1/2 propriété',
    share_full: 'Propriété complète',
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
    share_one_eighth: '1/8-Anteil',
    share_one_fourth: '1/4-Anteil',
    share_one_half: '1/2-Anteil',
    share_full: 'Volles Eigentum',
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
  const [downPct, setDownPct]   = useState(30);            // 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
  const [ratePct, setRatePct]   = useState(6.5);           // 0.0–10.0

  // Display-share label
  const shareLabel = t[`share_${shareKey}`];

  // Loan math — interest-only (matches Pacaso's behaviour)
  const downAmount = sharePrice * (downPct / 100);
  const loanAmount = sharePrice - downAmount;
  const monthlyRate = (ratePct / 100) / 12;
  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0 || monthlyRate <= 0) return 0;
    return loanAmount * monthlyRate;
  }, [loanAmount, monthlyRate]);

  function bumpRate(delta) {
    setRatePct(prev => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0, Math.min(10, next));
    });
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
        </div>

        {/* Right — calculator card (white) */}
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
                  {[30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                    <option key={v} value={v}>{v}%</option>
                  ))}
                </select>
                <p className="cop-fin-helper">{formatMoney(downAmount, currency, locale)}</p>
              </div>
            </div>

            {/* Rate slider with -/+ */}
            <div className="cop-fin-rate-block">
              <label className="cop-fin-label">
                {t.label_rate}: <span className="cop-fin-rate-val">{ratePct.toFixed(2)}%</span>
              </label>
              <div className="cop-fin-rate-controls">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ratePct}
                  onChange={e => setRatePct(Number(e.target.value))}
                  className="cop-fin-range"
                  aria-label={t.label_rate}
                  style={{
                    background: `linear-gradient(to right, ${C.gold} 0%, ${C.gold} ${ratePct * 10}%, #e8e0d4 ${ratePct * 10}%, #e8e0d4 100%)`,
                  }}
                />
                <button type="button" className="cop-fin-btn" onClick={() => bumpRate(-0.1)} aria-label="Decrease rate">−</button>
                <button type="button" className="cop-fin-btn" onClick={() => bumpRate(+0.1)} aria-label="Increase rate">+</button>
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
        /* Sits inline inside the property page's left column.
           Stacks pitch above the white calculator card. */
        .cop-fin {
          background: ${C.navy};
          padding: 40px 32px;
          color: ${C.white};
          margin: 32px 0;
        }
        .cop-fin-inner {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Pitch block */
        .cop-fin-eyebrow {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${C.gold};
          margin: 0 0 14px;
        }
        .cop-fin-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 30px;
          font-weight: 400;
          line-height: 1.2;
          margin: 0 0 12px;
          color: ${C.white};
        }
        .cop-fin-h1 em {
          font-style: italic;
          color: ${C.gold};
          font-weight: 400;
        }
        .cop-fin-sub {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: ${C.gold};
          margin: 0 0 14px;
        }
        .cop-fin-body {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.85);
          margin: 0 0 22px;
        }
        .cop-fin-cta {
          display: inline-block;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.navy};
          background: ${C.gold};
          border: none;
          padding: 14px 28px;
          cursor: pointer;
          transition: opacity 180ms ease, transform 180ms ease;
        }
        .cop-fin-cta:hover { opacity: 0.92; transform: translateY(-1px); }

        /* Right column — calculator card (WHITE) */
        .cop-fin-card {
          background: ${C.white};
          padding: 36px 32px;
          color: ${C.navy};
        }
        .cop-fin-card-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: ${C.navy};
          margin: 0 0 24px;
        }
        .cop-fin-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        @media (max-width: 480px) {
          .cop-fin-row { grid-template-columns: 1fr; }
        }
        .cop-fin-label {
          display: block;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${C.muted};
          margin-bottom: 8px;
        }
        .cop-fin-rate-val {
          color: ${C.gold};
          font-weight: 700;
          letter-spacing: 0;
        }
        .cop-fin-input {
          width: 100%;
          background: ${C.cream};
          color: ${C.navy};
          border: 1px solid #e8e0d4;
          border-radius: 0;
          padding: 10px 12px;
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 14px;
          font-weight: 600;
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
          color: ${C.muted};
          margin: 6px 0 0;
        }

        /* Rate block: full-width slider + adjacent buttons */
        .cop-fin-rate-block {
          margin-bottom: 22px;
        }
        .cop-fin-rate-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .cop-fin-range {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: #e8e0d4;
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
          border: 2px solid ${C.white};
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .cop-fin-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: ${C.gold};
          border-radius: 50%;
          border: 2px solid ${C.white};
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .cop-fin-btn {
          width: 32px;
          height: 32px;
          background: ${C.cream};
          color: ${C.navy};
          border: 1px solid #e8e0d4;
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .cop-fin-btn:hover { background: ${C.gold}; color: ${C.white}; border-color: ${C.gold}; }
        .cop-fin-btn:active { transform: translateY(1px); }

        /* Result band */
        .cop-fin-result {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 22px 0 18px;
          border-top: 1px solid #e8e0d4;
          margin-top: 8px;
        }
        .cop-fin-result-label {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 13px;
          color: ${C.muted};
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
          color: ${C.muted};
          font-family: 'Nunito Sans', Arial, sans-serif;
          margin-left: 4px;
        }
        .cop-fin-note {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          color: ${C.muted};
          margin: 4px 0 0;
          line-height: 1.55;
          font-style: italic;
        }
      `}</style>
    </section>
  );
}
