import { useState, useMemo } from 'react';
import { numberLocale } from '@/lib/i18n';

// Locale-specific copy. Inline rather than messages/*.json because the strings are
// tightly coupled to this component's UX (calculator labels, share size dropdown options).
const COPY = {
  en: {
    eyebrow: 'Financing',
    h1_a: 'Your way into',
    h1_b: 'ownership',
    sub: 'Estimate a purchase from 30% down',
    body: 'Many co-ownership buyers finance part of their share. The calculator below gives an illustrative idea of what a financed purchase could look like — adjust the ownership share, down payment and interest rate to match your situation.',
    calc_heading: 'Estimate your monthly financing',
    label_share: 'Ownership',
    label_down: 'Down Payment',
    label_rate: 'Interest Rate',
    helper_share: 'Share price',
    helper_down: 'Your down payment',
    share_one_eighth: '1/8 share',
    share_one_fourth: '1/4 share',
    share_one_half: '1/2 share',
    financed_label: 'Financed amount',
    monthly_label: (share) => `${share} ownership financing`,
    per_month: '/month',
    note: 'Illustrative only — financing subject to individual approval.',
  },
  es: {
    eyebrow: 'Financiación',
    h1_a: 'Tu camino hacia',
    h1_b: 'la propiedad',
    sub: 'Calcula una compra desde el 30% de entrada',
    body: 'Muchos compradores en copropiedad financian parte de su participación. La calculadora te ofrece una idea orientativa de cómo podría ser una compra financiada — ajusta la participación, la entrada y el tipo de interés a tu situación.',
    calc_heading: 'Calcula tu cuota mensual',
    label_share: 'Propiedad',
    label_down: 'Entrada',
    label_rate: 'Tipo de interés',
    helper_share: 'Precio por participación',
    helper_down: 'Tu entrada',
    share_one_eighth: '1/8 de propiedad',
    share_one_fourth: '1/4 de propiedad',
    share_one_half: '1/2 propiedad',
    financed_label: 'Importe financiado',
    monthly_label: (share) => `Financiación de ${share}`,
    per_month: '/mes',
    note: 'Solo a título ilustrativo — la financiación está sujeta a aprobación individual.',
  },
  fr: {
    eyebrow: 'Financement',
    h1_a: 'Votre accès à',
    h1_b: 'la propriété',
    sub: 'Estimez un achat à partir de 30 % d\'apport',
    body: 'De nombreux acheteurs en copropriété financent une partie de leur part. Le calculateur ci-dessous vous donne une idée indicative de ce que pourrait représenter un achat financé — ajustez la part, l\'apport et le taux d\'intérêt selon votre situation.',
    calc_heading: 'Estimez votre mensualité',
    label_share: 'Propriété',
    label_down: 'Apport',
    label_rate: 'Taux d\'intérêt',
    helper_share: 'Prix par part',
    helper_down: 'Votre apport',
    share_one_eighth: '1/8 de la propriété',
    share_one_fourth: '1/4 de la propriété',
    share_one_half: '1/2 propriété',
    financed_label: 'Montant financé',
    monthly_label: (share) => `Financement de ${share}`,
    per_month: '/mois',
    note: 'À titre indicatif uniquement — le financement est soumis à une approbation individuelle.',
  },
  de: {
    eyebrow: 'Finanzierung',
    h1_a: 'Ihr Weg zur',
    h1_b: 'Eigentümerschaft',
    sub: 'Kalkulieren Sie einen Kauf ab 30 % Eigenkapital',
    body: 'Viele Miteigentums-Käufer finanzieren einen Teil ihres Anteils. Der Rechner unten gibt Ihnen eine unverbindliche Vorstellung davon, wie ein finanzierter Kauf aussehen könnte — passen Sie Anteil, Anzahlung und Zinssatz an Ihre Situation an.',
    calc_heading: 'Monatliche Finanzierung berechnen',
    label_share: 'Eigentum',
    label_down: 'Eigenkapital',
    label_rate: 'Zinssatz',
    helper_share: 'Anteilspreis',
    helper_down: 'Ihre Anzahlung',
    share_one_eighth: '1/8-Anteil',
    share_one_fourth: '1/4-Anteil',
    share_one_half: '1/2-Anteil',
    financed_label: 'Finanzierungsbetrag',
    monthly_label: (share) => `${share}-Finanzierung`,
    per_month: '/Monat',
    note: 'Nur zur Veranschaulichung — die Finanzierung unterliegt einer individuellen Genehmigung.',
  },
  it: {
    eyebrow: 'Finanziamento',
    h1_a: 'La tua strada verso la',
    h1_b: 'proprietà',
    sub: 'Stima un acquisto con un anticipo dal 30%',
    body: 'Molti acquirenti in comproprietà finanziano una parte della propria quota. Il calcolatore qui sotto dà un\'idea indicativa di come potrebbe essere un acquisto finanziato — regola la quota, l\'anticipo e il tasso di interesse in base alla tua situazione.',
    calc_heading: 'Calcola la rata mensile',
    label_share: 'Quota',
    label_down: 'Anticipo',
    label_rate: 'Tasso di interesse',
    helper_share: 'Prezzo della quota',
    helper_down: 'Il tuo anticipo',
    share_one_eighth: 'Quota 1/8',
    share_one_fourth: 'Quota 1/4',
    share_one_half: 'Quota 1/2',
    financed_label: 'Importo finanziato',
    monthly_label: (share) => `Finanziamento ${share}`,
    per_month: '/mese',
    note: 'Solo a titolo indicativo — il finanziamento è soggetto ad approvazione individuale.',
  },
  nl: {
    eyebrow: 'Financiering',
    h1_a: 'Uw weg naar',
    h1_b: 'eigendom',
    sub: 'Bereken een aankoop vanaf 30% eigen inbreng',
    body: 'Veel kopers in mede-eigendom financieren een deel van hun aandeel. De rekenmodule hieronder geeft een vrijblijvende indruk van hoe een gefinancierde aankoop eruit kan zien — pas het aandeel, de eigen inbreng en de rente aan uw situatie aan.',
    calc_heading: 'Bereken uw maandelijkse financiering',
    label_share: 'Eigendom',
    label_down: 'Eigen inbreng',
    label_rate: 'Rente',
    helper_share: 'Prijs van het aandeel',
    helper_down: 'Uw eigen inbreng',
    share_one_eighth: '1/8-aandeel',
    share_one_fourth: '1/4-aandeel',
    share_one_half: '1/2-aandeel',
    financed_label: 'Financieringsbedrag',
    monthly_label: (share) => `Financiering ${share}`,
    per_month: '/maand',
    note: 'Alleen ter illustratie — financiering onder voorbehoud van individuele goedkeuring.',
  },
  pt: {
    eyebrow: 'Financiamento',
    h1_a: 'Seu caminho até a',
    h1_b: 'propriedade',
    sub: 'Simule uma compra a partir de 30% de entrada',
    body: 'Muitos compradores em multipropriedade financiam parte da sua cota. A calculadora abaixo dá uma ideia ilustrativa de como seria uma compra financiada — ajuste a cota, a entrada e a taxa de juros à sua situação.',
    calc_heading: 'Calcule seu financiamento mensal',
    label_share: 'Cota',
    label_down: 'Entrada',
    label_rate: 'Taxa de juros',
    helper_share: 'Preço da cota',
    helper_down: 'Sua entrada',
    share_one_eighth: 'Cota de 1/8',
    share_one_fourth: 'Cota de 1/4',
    share_one_half: 'Cota de 1/2',
    financed_label: 'Valor financiado',
    monthly_label: (share) => `Financiamento — ${share}`,
    per_month: '/mês',
    note: 'Apenas ilustrativo — o financiamento está sujeito a aprovação individual.',
  },
  sv: {
    eyebrow: 'Finansiering',
    h1_a: 'Din väg till',
    h1_b: 'ägande',
    sub: 'Räkna på ett köp från 30 % kontantinsats',
    body: 'Många som köper in sig i ett samägande finansierar en del av sin andel. Kalkylatorn nedan ger en illustrativ bild av hur ett finansierat köp kan se ut — justera andel, kontantinsats och ränta efter din situation.',
    calc_heading: 'Beräkna din månatliga finansiering',
    label_share: 'Ägande',
    label_down: 'Kontantinsats',
    label_rate: 'Ränta',
    helper_share: 'Andelspris',
    helper_down: 'Din kontantinsats',
    share_one_eighth: '1/8 andel',
    share_one_fourth: '1/4 andel',
    share_one_half: '1/2 andel',
    financed_label: 'Finansierat belopp',
    monthly_label: (share) => `Finansiering av ${share}`,
    per_month: '/månad',
    note: 'Endast illustrativt — finansiering förutsätter individuell kreditprövning.',
  },
  da: {
    eyebrow: 'Finansiering',
    h1_a: 'Din vej til',
    h1_b: 'ejerskab',
    sub: 'Beregn et køb fra 30 % udbetaling',
    body: 'Mange købere af medejerskab finansierer en del af deres andel. Beregneren nedenfor giver et vejledende billede af, hvordan et finansieret køb kunne se ud — juster ejerandel, udbetaling og rente, så det passer til din situation.',
    calc_heading: 'Beregn din månedlige finansiering',
    label_share: 'Ejerandel',
    label_down: 'Udbetaling',
    label_rate: 'Rente',
    helper_share: 'Andelens pris',
    helper_down: 'Din udbetaling',
    share_one_eighth: '1/8-andel',
    share_one_fourth: '1/4-andel',
    share_one_half: '1/2-andel',
    financed_label: 'Finansieret beløb',
    monthly_label: (share) => `Finansiering af ${share}`,
    per_month: '/måned',
    note: 'Kun vejledende — finansiering forudsætter individuel godkendelse.',
  },
  no: {
    eyebrow: 'Finansiering',
    h1_a: 'Din vei til',
    h1_b: 'eierskap',
    sub: 'Beregn et kjøp fra 30 % egenkapital',
    body: 'Mange som kjøper i sameie finansierer deler av andelen sin. Kalkulatoren nedenfor gir et uforpliktende bilde av hvordan et finansiert kjøp kan se ut — juster eierandel, egenkapital og rente etter din situasjon.',
    calc_heading: 'Beregn din månedlige finansiering',
    label_share: 'Eierandel',
    label_down: 'Egenkapital',
    label_rate: 'Rente',
    helper_share: 'Andelspris',
    helper_down: 'Din egenkapital',
    share_one_eighth: '1/8-andel',
    share_one_fourth: '1/4-andel',
    share_one_half: '1/2-andel',
    financed_label: 'Finansiert beløp',
    monthly_label: (share) => `Finansiering av ${share}`,
    per_month: '/måned',
    note: 'Kun til illustrasjon — finansiering forutsetter individuell godkjenning.',
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
  const localeFmt = numberLocale(locale);
  return `${sym}${Math.round(amount).toLocaleString(localeFmt)}`;
}

// Ownership options (1/8 – 1/2) → fraction denominator.
const SHARE_DENOMS = { one_eighth: 8, one_fourth: 4, one_half: 2 };

// 25-year amortisation — generic mortgage math, no partner claims.
const AMORT_MONTHS = 25 * 12;

/**
 * Financing calculator for property detail pages. COP's own widget —
 * generic maths only, no lender or partner claims.
 *
 * @param {object} props
 * @param {number}  props.sharePrice       — the listed price per share, as a number
 * @param {string}  props.currency         — 'USD' | 'EUR' | 'GBP'
 * @param {number}  [props.shareDenominator] — denominator of the LISTED share
 *                                             (price is for a 1/n share; default 8)
 * @param {string}  [props.locale]         — 'en' | 'es' | 'fr' | 'de'
 */
export default function FinancingCalculator({ sharePrice, currency = 'USD', shareDenominator = 8, locale = 'en' }) {
  const t = COPY[locale] || COPY.en;

  const [shareKey, setShareKey] = useState('one_eighth');  // one_eighth | one_fourth | one_half
  const [downPct, setDownPct]   = useState(30);            // 30 | 40 | 50 | 60 | 70
  const [ratePct, setRatePct]   = useState(6.5);           // 0.0–10.0

  // Display-share label
  const shareLabel = t[`share_${shareKey}`];

  // Price of the selected ownership share. The listed price buys 1/n of the
  // home (n = shareDenominator, usually 8), so whole-home ≈ price × n and a
  // 1/f share ≈ price × n / f.
  const listedDenom = Number(shareDenominator) > 0 ? Number(shareDenominator) : 8;
  const selectedDenom = SHARE_DENOMS[shareKey] || 8;
  const selectedPrice = sharePrice * (listedDenom / selectedDenom);

  // Loan math — financed amount + estimated monthly payment over a 25-year
  // amortisation (rate 0% → straight-line principal repayment).
  const downAmount = selectedPrice * (downPct / 100);
  const loanAmount = selectedPrice - downAmount;
  const monthlyRate = (ratePct / 100) / 12;
  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    if (monthlyRate <= 0) return loanAmount / AMORT_MONTHS;
    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -AMORT_MONTHS));
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
                </select>
                <p className="cop-fin-helper">
                  <span className="cop-fin-helper-label">{t.helper_share}</span>
                  <span className="cop-fin-helper-val">{formatMoney(selectedPrice, currency, locale)}</span>
                </p>
              </div>

              <div className="cop-fin-field">
                <label className="cop-fin-label">{t.label_down}</label>
                <select
                  className="cop-fin-input"
                  value={downPct}
                  onChange={e => setDownPct(Number(e.target.value))}
                >
                  {[30, 40, 50, 60, 70].map(v => (
                    <option key={v} value={v}>{v}%</option>
                  ))}
                </select>
                <p className="cop-fin-helper">
                  <span className="cop-fin-helper-label">{t.helper_down}</span>
                  <span className="cop-fin-helper-val">{formatMoney(downAmount, currency, locale)}</span>
                </p>
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

            {/* Financed amount + monthly result */}
            <div className="cop-fin-result">
              <p className="cop-fin-result-label">{t.financed_label}</p>
              <p className="cop-fin-result-financed">{formatMoney(loanAmount, currency, locale)}</p>
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
          font-size: 42px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.005em;
          margin: 0 0 14px;
          color: ${C.white};
        }
        @media (max-width: 560px) { .cop-fin-h1 { font-size: 34px; } }
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
          margin: 0 0 16px;
        }
        .cop-fin-body {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 16.5px;
          line-height: 1.72;
          color: rgba(255,255,255,0.88);
          margin: 0 0 24px;
        }
        @media (max-width: 560px) { .cop-fin-body { font-size: 15.5px; } }
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
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          font-family: 'Nunito Sans', Arial, sans-serif;
          margin: 8px 0 0;
          padding: 6px 0 0;
        }
        .cop-fin-helper-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${C.muted};
        }
        .cop-fin-helper-val {
          font-size: 14px;
          font-weight: 700;
          color: ${C.navy};
          letter-spacing: 0;
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

        /* Result band — stacked feature panel for clean alignment */
        .cop-fin-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          padding: 22px 22px 24px;
          background: ${C.navy};
          color: ${C.white};
          margin-top: 22px;
        }
        .cop-fin-result-label {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.gold};
          margin: 0;
        }
        .cop-fin-result-financed {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          color: rgba(255,255,255,0.92);
          margin: 0 0 10px;
        }
        .cop-fin-result-amount {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 38px;
          font-weight: 400;
          line-height: 1;
          color: ${C.white};
          margin: 0;
        }
        .cop-fin-result-per {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          font-family: 'Nunito Sans', Arial, sans-serif;
          margin-left: 6px;
          letter-spacing: 0;
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
