import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * /list-with-cop — the open front door.
 *
 * Two audiences, one page:
 *   · Private owners who want to sell their co-ownership share (resales —
 *     inventory nobody else aggregates)
 *   · Smaller operators & developers who want their homes in front of COP's
 *     buyers (curated: every application is personally reviewed)
 *
 * Applications POST to /api/list-with-cop → listing_applications → reviewed
 * in /admin/applications. Nothing goes live without approval.
 */
export default function ListWithCop() {
  const [tab, setTab] = useState('resale');
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const [form, setForm] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/list-with-cop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: tab, ...form }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <Head>
        <title>List With COP — Sell a Share or Partner With Us | Co-Ownership Property</title>
        <meta
          name="description"
          content="Sell your co-ownership share to Europe's most engaged fractional-ownership audience, or apply to list your co-ownership homes on COP. Every listing is personally reviewed."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">List With COP</span>
        <h1>Your home, in front of the <em>right buyers</em></h1>
        <p className="page-hero-sub">
          We curate Europe's leading collection of co-ownership homes — and the buyers who come with it.
          Sell your share, or put your homes in front of them.
        </p>
      </section>

      <section className="lw-sec">
        <div className="lw-inner">
          {/* Tab switch */}
          <div className="lw-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'resale'}
              className={tab === 'resale' ? 'active' : ''}
              onClick={() => { setTab('resale'); setState('idle'); }}
            >
              I'm selling my share
            </button>
            <button
              role="tab"
              aria-selected={tab === 'partner'}
              className={tab === 'partner' ? 'active' : ''}
              onClick={() => { setTab('partner'); setState('idle'); }}
            >
              We're an operator or developer
            </button>
          </div>

          {state === 'done' ? (
            <div className="lw-done">
              <div className="lw-done-icon">✓</div>
              <h2>Application received</h2>
              <p>
                We review every application personally — usually within a day or two.
                You'll hear from us either way.
              </p>
            </div>
          ) : (
            <div className="lw-grid">
              <div className="lw-pitch">
                {tab === 'resale' ? (
                  <>
                    <h2>Sell your share to people already looking for one</h2>
                    <p>
                      Selling a co-ownership share privately is hard — the buyer needs to want
                      <em> your</em> home, <em>your</em> fraction, at <em>your</em> price. Our audience
                      is the largest pool of active co-ownership buyers in Europe, and resale shares
                      are what many of them ask us for first.
                    </p>
                    <ul>
                      <li>Your listing sits alongside Europe's finest co-ownership homes</li>
                      <li>We handle enquiries and introduce serious, qualified buyers</li>
                      <li>No fee to list — we only earn if your share sells</li>
                      <li>Discretion on request: we can market without naming the resort or development</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <h2>Put your homes in front of buyers who already understand the model</h2>
                    <p>
                      Our visitors don't need convincing that co-ownership works — they're comparing
                      homes, not concepts. If your homes meet our standard, we'll bring them the
                      buyers.
                    </p>
                    <ul>
                      <li>Listings in four languages, professionally presented</li>
                      <li>Qualified leads with full contact details — you close, we introduce</li>
                      <li>Simple commission on completed sales; no listing fees, no retainers</li>
                      <li>Every application personally reviewed — we curate, we don't aggregate</li>
                    </ul>
                  </>
                )}
              </div>

              <form className="lw-form" onSubmit={submit}>
                <label>
                  <span>Your name</span>
                  <input type="text" required value={form.name || ''} onChange={set('name')} />
                </label>
                {tab === 'partner' && (
                  <>
                    <label>
                      <span>Company</span>
                      <input type="text" required value={form.company || ''} onChange={set('company')} />
                    </label>
                    <label>
                      <span>Website</span>
                      <input type="text" value={form.website || ''} onChange={set('website')} placeholder="https://" />
                    </label>
                    <label>
                      <span>How many co-ownership homes do you offer?</span>
                      <input type="text" value={form.portfolioSize || ''} onChange={set('portfolioSize')} placeholder="e.g. 6" />
                    </label>
                  </>
                )}
                <label>
                  <span>Email</span>
                  <input type="email" required value={form.email || ''} onChange={set('email')} />
                </label>
                <label>
                  <span>Phone (optional)</span>
                  <input type="tel" value={form.phone || ''} onChange={set('phone')} />
                </label>
                {tab === 'resale' ? (
                  <>
                    <label>
                      <span>Where is the home?</span>
                      <input type="text" required value={form.propertyLocation || ''} onChange={set('propertyLocation')} placeholder="e.g. Cala Vadella, Ibiza" />
                    </label>
                    <label>
                      <span>Your share & asking price</span>
                      <div className="lw-row">
                        <input type="text" value={form.shareFraction || ''} onChange={set('shareFraction')} placeholder="e.g. 1/8" />
                        <input type="text" value={form.askingPrice || ''} onChange={set('askingPrice')} placeholder="e.g. €165,000" />
                      </div>
                    </label>
                  </>
                ) : (
                  <label>
                    <span>Where are your homes?</span>
                    <input type="text" value={form.propertyLocation || ''} onChange={set('propertyLocation')} placeholder="e.g. Tuscany & Umbria, Italy" />
                  </label>
                )}
                <label>
                  <span>Tell us more (optional)</span>
                  <textarea rows={4} value={form.message || ''} onChange={set('message')} placeholder={tab === 'resale' ? 'The home, why you’re selling, timing…' : 'Your model, legal structure, what makes your homes special…'} />
                </label>
                <button type="submit" className="lw-submit" disabled={state === 'busy'}>
                  {state === 'busy' ? 'Sending…' : 'Submit application →'}
                </button>
                {state === 'error' && <p className="lw-error">Something went wrong — please try again or email info@co-ownership-property.com.</p>}
                <p className="lw-note">
                  Every application is personally reviewed. Nothing is published without your approval,
                  and discretion is available on request.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
