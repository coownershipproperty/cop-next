import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import styles from '@/styles/CurrencyExchange.module.css';

const pageUrl = 'https://co-ownership-property.com/currency-exchange-for-co-ownership-property/';
const heroImage = '/wp-content/uploads/2026/04/foreign-buyer-international-property-hero.jpg';
const currencyVisualImage = '/wp-content/uploads/2026/06/cop-currency-villa-notes.jpg';
const exampleSharePrice = 215000;
const defaultRateMove = 2;

const fallbackRates = {
  base: 'USD',
  updated_at: '2026-06-19T00:00:00.000Z',
  rates: {
    USD: 1,
    EUR: 0.8725,
    GBP: 0.7425,
    CHF: 0.806,
    CAD: 1.374,
    AUD: 1.526,
    AED: 3.6725
  },
  source: 'fallback'
};

const currencySymbols = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  CHF: 'CHF ',
  CAD: 'C$',
  AUD: 'A$',
  AED: 'AED '
};

const currencyOptions = [
  { code: 'GBP', label: 'GBP - Pound sterling' },
  { code: 'USD', label: 'USD - US dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'CHF', label: 'CHF - Swiss franc' },
  { code: 'CAD', label: 'CAD - Canadian dollar' },
  { code: 'AUD', label: 'AUD - Australian dollar' },
  { code: 'AED', label: 'AED - UAE dirham' }
];

const assetCurrencyOptions = [
  { code: 'EUR', label: 'EUR - Euro share' },
  { code: 'USD', label: 'USD - US dollar share' }
];

const faqItems = [
  {
    question: 'Why does currency matter when buying a fractional property share?',
    answer:
      'Most co-ownership shares are priced in EUR or USD. If your funds are in GBP, CHF, CAD, AUD or another currency, the exchange rate affects the real cost of the share, the reservation payment and the completion balance.'
  },
  {
    question: 'Is this only relevant for large whole-property purchases?',
    answer:
      'No. A 1/8 share may still be a six-figure purchase. On a EUR 215,000 share, even a 1% all-in difference is EUR 2,150. Currency planning is still worth doing before you transfer.'
  },
  {
    question: 'Can a currency specialist beat a high street bank?',
    answer:
      'Often the difference is in the all-in result: exchange rate, transfer fee, speed, support and payment handling. High street banks can be convenient, but specialist providers may be more competitive and more used to property-related payments.'
  },
  {
    question: 'What about Wise or Revolut?',
    answer:
      'They can work well for straightforward spot transfers and smaller amounts. For larger share purchases, check transfer limits, beneficiary rules, support and payment timing, and note there is usually no forward cover for a later share-completion payment.'
  },
  {
    question: 'Can I lock in a rate before share purchase completion?',
    answer:
      'A forward contract may allow you to secure a rate for a known future payment, often up to 12 months ahead, subject to provider terms and any required deposit. That can be useful when you have reserved a share but completion is still several weeks away.'
  },
  {
    question: 'Is this financial advice?',
    answer:
      'No. This page is general information only. It is not financial, tax or legal advice. A currency provider should explain rates, fees, timing, risk and any forward-contract terms before you commit.'
  }
];

function formatMoney(value, currency) {
  return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(value)));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-GB').format(Math.max(0, Math.round(value)));
}

function formatRate(value) {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(value);
}

function formatCurrencyRate(value, currency) {
  return `${currencySymbols[currency] || `${currency} `}${formatRate(value)}`;
}

function convertAmount(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) return amount;

  const usdValue = amount / fromRate;
  return usdValue * toRate;
}

function useRates() {
  const [rateState, setRateState] = useState(fallbackRates);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const response = await fetch('/api/rates/');
        if (!response.ok) throw new Error('Rate request failed');
        const data = await response.json();
        if (!data?.rates || cancelled) return;
        setRateState({ ...data, source: 'live' });
      } catch {
        if (!cancelled) setRateState(fallbackRates);
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  return rateState;
}

function CurrencyPlanner() {
  const rateState = useRates();
  const [shareCurrency, setShareCurrency] = useState('EUR');
  const [fundCurrency, setFundCurrency] = useState('GBP');
  const [shareAmount, setShareAmount] = useState(exampleSharePrice);
  const [rateMove, setRateMove] = useState(defaultRateMove);

  const values = useMemo(() => {
    const reservation = shareAmount * 0.1;
    const completion = shareAmount * 0.9;
    const todayCost = convertAmount(shareAmount, shareCurrency, fundCurrency, rateState.rates);
    const depositCost = convertAmount(reservation, shareCurrency, fundCurrency, rateState.rates);
    const completionCost = convertAmount(completion, shareCurrency, fundCurrency, rateState.rates);
    const adverseExtra = completionCost * (rateMove / Math.max(1, 100 - rateMove));
    const sourcePerAsset =
      convertAmount(1, shareCurrency, fundCurrency, rateState.rates) || 1;

    return {
      reservation,
      completion,
      todayCost,
      depositCost,
      completionCost,
      adverseExtra,
      sourcePerAsset
    };
  }, [fundCurrency, rateMove, rateState.rates, shareAmount, shareCurrency]);

  return (
    <section className={styles.planner} id="currency-planner">
      <div className={styles.plannerIntro}>
        <p className={styles.eyebrow}>Currency Planner</p>
        <h2>Price the share, then price the money.</h2>
        <p>
          A fractional share can make capital work harder by avoiding the cost of owning a
          whole holiday home you only use part of the year. The currency transfer deserves
          the same discipline: small margins matter when the share price is six figures.
        </p>
        <div className={styles.editorNote}>
          <span>Example</span>
          <strong>Example 1/8th Share: EUR 215,000.</strong>
          <p>
            A 1% all-in exchange difference on that share is EUR 2,150. On several shares,
            or a higher-value US dollar property, it becomes a real line item.
          </p>
        </div>
      </div>

      <div className={styles.calcCard} aria-label="Currency calculator">
        <div className={styles.calcHeader}>
          <span>{rateState.source === 'live' ? 'Live reference' : 'Example fallback'}</span>
          <strong>
            1 {shareCurrency} = {formatCurrencyRate(values.sourcePerAsset, fundCurrency)}
          </strong>
        </div>

        <div className={styles.fieldGrid}>
          <label>
            Share priced in
            <select value={shareCurrency} onChange={(event) => setShareCurrency(event.target.value)}>
              {assetCurrencyOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Your funds are in
            <select value={fundCurrency} onChange={(event) => setFundCurrency(event.target.value)}>
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Share amount
            <input
              type="number"
              min="25000"
              step="5000"
              value={shareAmount}
              onChange={(event) => setShareAmount(Number(event.target.value) || exampleSharePrice)}
            />
          </label>
          <label>
            Test a % rate move
            <span className={styles.fieldHint}>
              Typical rate move compared to high street banks: 1-2%
            </span>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={rateMove}
              onChange={(event) => setRateMove(Number(event.target.value) || defaultRateMove)}
            />
          </label>
        </div>

        <div className={styles.resultGrid}>
          <div>
            <span>Estimated funding needed</span>
            <strong>{formatMoney(values.todayCost, fundCurrency)}</strong>
            <p>
              To buy a {formatMoney(shareAmount, shareCurrency)} share at the current
              reference rate.
            </p>
          </div>
          <div>
            <span>10% reservation</span>
            <strong>{formatMoney(values.depositCost, fundCurrency)}</strong>
            <p>{formatMoney(values.reservation, shareCurrency)} paid to reserve the share.</p>
          </div>
          <div>
            <span>{rateMove}% weaker before completion</span>
            <strong>+{formatMoney(values.adverseExtra, fundCurrency)}</strong>
            <p>Extra currency needed on the 90% completion balance.</p>
          </div>
        </div>

        <p className={styles.rateSmall}>
          Rates are planning references only. Final tradable rates depend on amount,
          provider margin, timing and payment method. Last rate refresh:{' '}
          {rateState.updated_at ? new Date(rateState.updated_at).toLocaleDateString('en-GB') : 'latest available'}.
        </p>
      </div>
    </section>
  );
}

function CurrencyEnquiryForm() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get('first_name') || '').trim();
    const surname = String(formData.get('surname') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const shareCurrency = String(formData.get('share_currency') || '').trim();
    const fundCurrency = String(formData.get('fund_currency') || '').trim();
    const amount = String(formData.get('amount') || '').trim();
    const extra = String(formData.get('extra') || '').trim();
    const name = `${firstName} ${surname}`.trim();

    if (!firstName || !surname || !email) {
      setStatus('error');
      setMessage('Please add your first name, surname and email.');
      return;
    }

    setStatus('sending');
    setMessage('');

    const enquiryMessage = [
      'Currency exchange enquiry for co-ownership share purchase.',
      `Share currency: ${shareCurrency || 'Not provided'}`,
      `Funding currency: ${fundCurrency || 'Not provided'}`,
      `Approximate amount: ${amount || 'Not provided'}`,
      extra ? `Extra context: ${extra}` : ''
    ].filter(Boolean).join('\n');

    try {
      const response = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          budget: amount,
          destination: 'Currency exchange',
          property: 'Currency exchange for co-ownership property',
          url: pageUrl,
          message: enquiryMessage
        })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) throw new Error('Enquiry failed');

      setStatus('success');
      setMessage('Thanks. We received your currency quote request and will come back to you shortly.');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please email info@co-ownership-property.com.');
    }
  }

  return (
    <section className={styles.enquiry} id="currency-enquiry">
      <div className={styles.enquiryCopy}>
        <p className={styles.eyebrow}>Currency Introduction</p>
        <h2>Get a currency plan before you reserve the share.</h2>
        <div className={styles.disclaimer}>
          This page is general information only and is not financial, tax or legal advice.
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.twoCols}>
          <label>
            First name
            <input name="first_name" type="text" required placeholder="First name" />
          </label>
          <label>
            Surname
            <input name="surname" type="text" required placeholder="Surname" />
          </label>
        </div>
        <div className={styles.twoCols}>
          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" placeholder="+44 or +1..." />
          </label>
        </div>
        <div className={styles.threeCols}>
          <label>
            Share currency
            <select name="share_currency" defaultValue="EUR">
              <option>EUR</option>
              <option>USD</option>
            </select>
          </label>
          <label>
            Your currency
            <select name="fund_currency" defaultValue="GBP">
              <option>GBP</option>
              <option>USD</option>
              <option>EUR</option>
              <option>CHF</option>
              <option>CAD</option>
              <option>AUD</option>
              <option>AED</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Approx. amount
            <select name="amount" defaultValue="200,000-250,000">
              <option>Under 100,000</option>
              <option>100,000-150,000</option>
              <option>150,000-200,000</option>
              <option>200,000-250,000</option>
              <option>250,000-350,000</option>
              <option>350,000-500,000</option>
              <option>500,000+</option>
              <option>Other / not sure</option>
            </select>
          </label>
        </div>
        <label>
          Anything useful to know?
          <textarea
            name="extra"
            rows={4}
            placeholder="Target rate, deadline, property currency, country, or whether you want to discuss fixing a rate..."
          />
        </label>
        <label className={styles.consent}>
          <input type="checkbox" required />
          <span>I agree to be contacted about currency exchange.</span>
        </label>
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Get a quote'}
        </button>
        {message && <p className={status === 'success' ? styles.success : styles.error}>{message}</p>}
      </form>
    </section>
  );
}

export default function CoOwnershipCurrencyExchange() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: 'Currency Exchange for Co-Ownership Property',
        description:
          'Currency planning for fractional and co-ownership property buyers purchasing shares in EUR or USD.'
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <Head>
        <title>Currency Exchange for Co-Ownership Property | COP</title>
        <meta
          name="description"
          content="Plan EUR and USD currency transfers for a fractional or co-ownership property share. See the impact of exchange-rate moves and request a specialist currency introduction."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Currency Exchange for Co-Ownership Property | COP" />
        <meta
          property="og:description"
          content="Buying a fractional property share in EUR or USD? Plan the transfer before reservation and completion."
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`https://co-ownership-property.com${heroImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
      </Head>

      <Header />

      <section className={styles.hero}>
        <Image
          src={heroImage}
          alt="International property buyer planning a co-ownership share purchase"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Co-Ownership Currency Exchange</p>
            <h1>Your share is priced in euros or dollars. Your budget may not be.</h1>
            <p>
              Fractional ownership is about using capital intelligently. The currency
              transfer should be handled with the same care as the property selection.
            </p>
            <div className={styles.heroActions}>
              <a href="#currency-enquiry" className={styles.primaryCta}>
                Plan my currency transfer
              </a>
              <a href="#currency-planner" className={styles.secondaryCta}>
                Run the share calculator
              </a>
            </div>
          </div>
          <aside className={styles.heroPanel}>
            <span>Typical share example</span>
            <strong>1/8 share at EUR 215,000</strong>
            <p>
              10% to reserve, then 90% at share purchase completion. If your money is in
              another currency, that waiting period can change the real cost.
            </p>
          </aside>
        </div>
      </section>

      <section className={styles.editorialIntro}>
        <div>
          <p className={styles.eyebrow}>Capital Efficiency</p>
          <h2>Co-ownership helps you avoid overbuying. Currency planning helps you avoid overpaying.</h2>
        </div>
        <div>
          <p>
            Buyers come to COP because they want access to better homes, better locations
            and better use of capital. Instead of tying up the full price of a second home,
            a 1/8 share can deliver meaningful usage with a far smaller commitment.
          </p>
          <p>
            The same mindset applies to currency. If the share is listed in euros or US
            dollars, the exchange route, margin and timing can quietly alter what the
            purchase really costs in pounds, Swiss francs, Canadian dollars or your home
            currency.
          </p>
        </div>
      </section>

      <section className={styles.compare}>
        <div className={styles.compareHeader}>
          <p className={styles.eyebrow}>Compare the all-in result</p>
          <h2>On a EUR 215,000 share, 1% is EUR 2,150.</h2>
          <p>
            That can be the difference between accepting a default bank rate and planning
            the transfer properly.
          </p>
        </div>
        <div className={styles.compareGrid}>
          <article>
            <span>01</span>
            <h3>High street bank</h3>
            <p>Convenient, but the rate margin can be costly when the payment is a property share rather than a holiday spend.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Wise or Revolut</h3>
            <p>
              Often strong for spot transfers. Check limits, beneficiary rules, support
              and no forward cover for a later completion payment.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Currency specialist</h3>
            <p>Useful for larger property payments, named support, target rates and forward contracts up to 12 months ahead.</p>
          </article>
        </div>
      </section>

      <CurrencyPlanner />

      <section className={styles.timeline}>
        <div className={styles.timelineCopy}>
          <p className={styles.eyebrow}>Share Purchase Timeline</p>
          <h2>One simple payment schedule. Two currency decisions.</h2>
          <p>
            Co-ownership share purchases are often quicker than whole-property purchases,
            but the currency exposure is still real. The reservation payment may be due
            quickly. The larger completion balance may follow several weeks later.
            Forward cover gives you the time between paying the deposit and paying at
            share purchase completion.
          </p>
          <a href="#currency-enquiry" className={styles.textCta}>Get a currency quote</a>
        </div>
        <div className={styles.timelineCards}>
          <article>
            <span>Reservation</span>
            <h3>10% to reserve</h3>
            <strong>EUR 21,500</strong>
            <p>
              Often handled as a spot transfer because the reservation window can be short.
              Get beneficiary details and transfer references right before sending.
            </p>
          </article>
          <article>
            <span>Share purchase completion</span>
            <h3>90% balance</h3>
            <strong>EUR 193,500</strong>
            <p>
              The bigger currency exposure. If completion is weeks away, ask whether a
              target rate or forward contract could make the final budget more predictable.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.deepDive}>
        <div className={styles.deepDiveLead}>
          <p className={styles.eyebrow}>Spot, target or forward?</p>
          <h2>Pick the tool that matches the share purchase.</h2>
          <div className={styles.currencyImage}>
            <Image
              src={currencyVisualImage}
              alt="Villa background with stylized euro, dollar and pound note stacks"
              width={1280}
              height={720}
              sizes="(max-width: 1080px) 100vw, 38vw"
            />
          </div>
        </div>
        <div className={styles.deepDiveGrid}>
          <article>
            <h3>Spot transfer</h3>
            <p>Exchange when the money is ready and the payment is due now.</p>
          </article>
          <article>
            <h3>Target rate</h3>
            <p>Ask to be alerted if your preferred rate becomes available before you need to send funds.</p>
          </article>
          <article>
            <h3>Forward contract</h3>
            <p>
              Secure a rate for a known future payment, often up to 12 months ahead,
              subject to provider terms. Ideal when you need to send the remaining 90%
              to complete the share purchase, typically 1-4 months on average.
            </p>
          </article>
        </div>
      </section>

      <CurrencyEnquiryForm />

      <section className={styles.faq} id="faq">
        <div className={styles.faqHeader}>
          <p className={styles.eyebrow}>FAQs</p>
          <h2>Currency exchange for fractional ownership buyers</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  );
}
