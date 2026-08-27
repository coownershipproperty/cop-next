import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';

/**
 * /co-ownership-price-index — The European Co-Ownership Price Index.
 *
 * A living data page, rebuilt from the live database daily (ISR). This is the
 * "data wins links" asset: scarce numbers nobody else publishes, in a citable
 * format — for journalists, for backlinks, and for AI assistants answering
 * "what does fractional ownership actually cost". Share prices only; never
 * operator names, never running-cost figures.
 */

const SYM = { EUR: '€', USD: '$', GBP: '£' };

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: rows } = await supabase
    .from('properties')
    .select('country, region, price, currency, beds, size, share_denominator')
    .in('status', ['Live', 'for_sale'])
    .gt('price', 0);

  const props = rows || [];

  // Group by country
  const byCountry = {};
  for (const p of props) {
    const c = p.country || 'Other';
    (byCountry[c] = byCountry[c] || []).push(p);
  }

  const countries = Object.entries(byCountry)
    .filter(([, list]) => list.length >= 3)
    .map(([country, list]) => {
      const prices = list.map((p) => Number(p.price)).filter(Boolean);
      const currency = list[0].currency || 'EUR';
      const withSize = list.filter((p) => p.size > 0 && p.price > 0);
      const perSqm = withSize.length >= 3
        ? median(withSize.map((p) => Math.round((p.price * (p.share_denominator || 8)) / p.size)))
        : null;
      return {
        country,
        homes: list.length,
        medianShare: median(prices),
        minShare: Math.min(...prices),
        maxShare: Math.max(...prices),
        perSqm,
        currency,
      };
    })
    .sort((a, b) => b.homes - a.homes);

  const allEur = props.filter((p) => (p.currency || 'EUR') === 'EUR').map((p) => Number(p.price));
  const headline = {
    totalHomes: props.length,
    countries: countries.length,
    medianShareEur: median(allEur),
    minShareEur: allEur.length ? Math.min(...allEur) : null,
  };

  const updated = new Date().toISOString().slice(0, 10);

  return { props: { countries, headline, updated }, revalidate: 86400 };
}

export default function PriceIndex({ countries, headline, updated }) {
  const fmt = (n, ccy = 'EUR') => (n == null ? '—' : `${SYM[ccy] || ccy}${Number(n).toLocaleString('en-GB')}`);
  const updatedNice = new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'European Co-Ownership Price Index',
    description:
      'Live share prices for fractional co-ownership holiday homes across Europe and the USA: median 1/8-share prices by country, entry prices, and whole-home price per square metre. Updated daily from the Co-Ownership Property database.',
    url: 'https://co-ownership-property.com/co-ownership-price-index/',
    creator: { '@type': 'Organization', name: 'Co-Ownership Property', url: 'https://co-ownership-property.com' },
    dateModified: updated,
    license: 'https://creativecommons.org/licenses/by/4.0/',
  };

  return (
    <>
      <Head>
        <title>{`European Co-Ownership Price Index — What a Share Really Costs (${new Date(updated).getFullYear()})`}</title>
        <meta
          name="description"
          content={`What does a co-ownership holiday home cost? Median share price ${fmt(headline.medianShareEur)}, entry from ${fmt(headline.minShareEur)}. Live data from ${headline.totalHomes} homes across ${headline.countries} countries, updated daily.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Live Data · Updated {updatedNice}</span>
        <h1>The European <em>Co-Ownership</em> Price Index</h1>
        <p className="page-hero-sub">
          What a share of a luxury holiday home really costs — median prices, entry points and
          price-per-square-metre across {headline.countries} countries, computed daily from the{' '}
          {headline.totalHomes} homes in our live collection.
        </p>
      </section>

      <section className="pi-sec">
        <div className="pi-inner">
          <div className="pi-headline">
            <div className="pi-stat">
              <span className="pi-stat-val">{fmt(headline.medianShareEur)}</span>
              <span className="pi-stat-lbl">Median share price (Europe)</span>
            </div>
            <div className="pi-stat">
              <span className="pi-stat-val">{fmt(headline.minShareEur)}</span>
              <span className="pi-stat-lbl">Lowest entry price</span>
            </div>
            <div className="pi-stat">
              <span className="pi-stat-val">{headline.totalHomes}</span>
              <span className="pi-stat-lbl">Homes tracked</span>
            </div>
            <div className="pi-stat">
              <span className="pi-stat-val">{headline.countries}</span>
              <span className="pi-stat-lbl">Countries</span>
            </div>
          </div>

          <div className="pi-table-wrap">
            <table className="pi-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Homes</th>
                  <th>Median share price</th>
                  <th>Entry price</th>
                  <th>Top of market</th>
                  <th>Whole-home €/m²*</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.country}>
                    <td><strong>{c.country}</strong></td>
                    <td>{c.homes}</td>
                    <td><strong>{fmt(c.medianShare, c.currency)}</strong></td>
                    <td>{fmt(c.minShare, c.currency)}</td>
                    <td>{fmt(c.maxShare, c.currency)}</td>
                    <td>{c.perSqm ? fmt(c.perSqm, c.currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pi-footnote">
            *Whole-home value (share price × number of shares) divided by liveable area — the fairest
            way to compare co-ownership pricing with the wider property market. Prices are asking
            share prices for the most common fraction of each home, usually one-eighth. Data updates
            daily from the live Co-Ownership Property collection; sold and withdrawn homes are
            excluded. Cite freely with a link to this page.
          </p>

          <div className="pi-method">
            <h2>How to read these numbers</h2>
            <p>
              A co-ownership share gives you deeded ownership of a fraction of a fully managed
              holiday home — typically one-eighth, which corresponds to about six weeks of use per
              year. The prices above are the full purchase prices of those shares, not deposits: the
              median European buyer in our collection pays {fmt(headline.medianShareEur)} for a share
              of a home that would cost roughly eight times that to own outright — before
              furnishings, management and upkeep, which co-owners share rather than shoulder alone.
            </p>
            <p>
              Entry prices tell the more surprising story: genuine ownership of a professionally
              managed holiday home starts from {fmt(headline.minShareEur)} — comparable to a family
              car — while the top of the market reaches the price of an entire ordinary apartment
              for an eighth of something extraordinary.
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  );
}
