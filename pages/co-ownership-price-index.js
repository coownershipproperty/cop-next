import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';

/**
 * /co-ownership-price-index — The European Co-Ownership Price Index.
 *
 * A living market report, rebuilt from the live database daily (ISR):
 * headline medians, country and region tables with 30-day movement (from
 * price_index_snapshots, written daily by the cron), a price-distribution
 * chart, the current entry tier with links, and written findings computed
 * from the data itself. Share prices only; never operator names, never
 * running-cost figures. Built to be cited: Dataset schema, stable anchors,
 * a plain-language methodology.
 */

const SYM = { EUR: '€', USD: '$', GBP: '£' };

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const BANDS = [
  { label: '< €100k', max: 100000 },
  { label: '€100k–150k', max: 150000 },
  { label: '€150k–250k', max: 250000 },
  { label: '€250k–400k', max: 400000 },
  { label: '€400k–700k', max: 700000 },
  { label: '€700k–1.2m', max: 1200000 },
  { label: '> €1.2m', max: Infinity },
];

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: rows } = await supabase
    .from('properties')
    .select('slug, title, country, region, city, price, currency, beds, size, share_denominator, img, date_added')
    .in('status', ['Live', 'for_sale'])
    .gt('price', 0);
  const props = rows || [];

  // ── Country aggregates ──
  const byCountry = {};
  for (const p of props) (byCountry[p.country || 'Other'] = byCountry[p.country || 'Other'] || []).push(p);
  const countries = Object.entries(byCountry)
    .filter(([, list]) => list.length >= 3)
    .map(([country, list]) => {
      const prices = list.map((p) => Number(p.price));
      const withSize = list.filter((p) => p.size > 0);
      return {
        country,
        homes: list.length,
        medianShare: median(prices),
        minShare: Math.min(...prices),
        maxShare: Math.max(...prices),
        perSqm: withSize.length >= 3 ? median(withSize.map((p) => Math.round((p.price * (p.share_denominator || 8)) / p.size))) : null,
        currency: list[0].currency || 'EUR',
      };
    })
    .sort((a, b) => b.homes - a.homes);

  // ── Region aggregates (top regions by inventory) ──
  const byRegion = {};
  for (const p of props) {
    if (!p.region) continue;
    const key = `${p.region}|${p.country}`;
    (byRegion[key] = byRegion[key] || []).push(p);
  }
  const regions = Object.entries(byRegion)
    .filter(([, list]) => list.length >= 4)
    .map(([key, list]) => {
      const [region, country] = key.split('|');
      const prices = list.map((p) => Number(p.price));
      const withSize = list.filter((p) => p.size > 0);
      return {
        region,
        country,
        homes: list.length,
        medianShare: median(prices),
        minShare: Math.min(...prices),
        perSqm: withSize.length >= 3 ? median(withSize.map((p) => Math.round((p.price * (p.share_denominator || 8)) / p.size))) : null,
        currency: list[0].currency || 'EUR',
      };
    })
    .sort((a, b) => b.homes - a.homes)
    .slice(0, 14);

  // ── Distribution (EUR homes) ──
  const eur = props.filter((p) => (p.currency || 'EUR') === 'EUR');
  const eurPrices = eur.map((p) => Number(p.price));
  const dist = BANDS.map((b, i) => {
    const lo = i === 0 ? 0 : BANDS[i - 1].max;
    return { label: b.label, count: eurPrices.filter((v) => v >= lo && v < b.max).length };
  });
  const distMax = Math.max(...dist.map((d) => d.count), 1);

  // ── Entry tier: cheapest live shares right now ──
  const entry = [...props]
    .filter((p) => (p.currency || 'EUR') === 'EUR')
    .sort((a, b) => a.price - b.price)
    .slice(0, 8)
    .map((p) => ({ slug: p.slug, title: p.title, price: p.price, region: p.region || p.country, beds: p.beds || null }));

  // ── Headline ──
  const denomCounts = {};
  for (const p of props) { const d = p.share_denominator || 8; denomCounts[d] = (denomCounts[d] || 0) + 1; }
  const eurWithSize = eur.filter((p) => p.size > 0);
  const headline = {
    totalHomes: props.length,
    countries: countries.length,
    medianShareEur: median(eurPrices),
    minShareEur: eurPrices.length ? Math.min(...eurPrices) : null,
    perSqmEur: eurWithSize.length ? median(eurWithSize.map((p) => Math.round((p.price * (p.share_denominator || 8)) / p.size))) : null,
    eighthPct: Math.round(((denomCounts[8] || 0) / props.length) * 100),
  };

  // ── 30-day movement from snapshots (empty until history accumulates) ──
  let deltas = {};
  try {
    const cutoff = new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10);
    const { data: snaps } = await supabase
      .from('price_index_snapshots')
      .select('snap_date, country, median_share')
      .lte('snap_date', cutoff)
      .order('snap_date', { ascending: false })
      .limit(200);
    const seen = {};
    for (const s of snaps || []) if (!seen[s.country]) seen[s.country] = s.median_share;
    deltas = seen;
  } catch (_) { /* table may be empty; deltas stay {} */ }

  // ── Computed findings (honest, from the data alone) ──
  const cheapest = [...countries].filter((c) => c.currency === 'EUR').sort((a, b) => a.medianShare - b.medianShare)[0];
  const dearest = [...countries].filter((c) => c.currency === 'EUR').sort((a, b) => b.medianShare - a.medianShare)[0];
  const under150 = Math.round((eurPrices.filter((v) => v < 150000).length / eurPrices.length) * 100);
  const regionCheap = [...regions].filter((r) => r.currency === 'EUR' && r.perSqm).sort((a, b) => a.perSqm - b.perSqm)[0];
  const regionDear = [...regions].filter((r) => r.currency === 'EUR' && r.perSqm).sort((a, b) => b.perSqm - a.perSqm)[0];
  const findings = { cheapest, dearest, under150, regionCheap, regionDear };

  const updated = new Date().toISOString().slice(0, 10);
  return { props: { countries, regions, dist, distMax, entry, headline, deltas, findings, updated }, revalidate: 86400 };
}

export default function PriceIndex({ countries, regions, dist, distMax, entry, headline, deltas, findings, updated }) {
  const fmt = (n, ccy = 'EUR') => (n == null ? '—' : `${SYM[ccy] || ccy}${Number(n).toLocaleString('en-GB')}`);
  const fmtK = (n, ccy = 'EUR') => (n == null ? '—' : `${SYM[ccy] || ccy}${Math.round(n / 1000)}k`);
  const updatedNice = new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const delta = (c) => {
    const prev = deltas[c.country];
    if (!prev || !c.medianShare) return null;
    const pct = ((c.medianShare - prev) / prev) * 100;
    if (Math.abs(pct) < 0.05) return { txt: '±0.0%', dir: 0 };
    return { txt: `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`, dir: pct > 0 ? 1 : -1 };
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'European Co-Ownership Price Index',
    description: `Live share prices for fractional co-ownership holiday homes: median 1/8-share prices by country and region, price distribution, entry prices and whole-home €/m². Computed daily from ${headline.totalHomes} live listings. Updated ${updated}.`,
    url: 'https://co-ownership-property.com/co-ownership-price-index/',
    creator: { '@type': 'Organization', name: 'Co-Ownership Property', url: 'https://co-ownership-property.com' },
    dateModified: updated,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    keywords: ['fractional ownership prices', 'co-ownership property prices', 'holiday home share price', '1/8 share cost'],
  };

  return (
    <>
      <Head>
        <title>{`Co-Ownership Price Index — What a 1/8 Share Really Costs (${new Date(updated).getFullYear()})`}</title>
        <meta name="description" content={`Median 1/8 share: ${fmt(headline.medianShareEur)}. Entry from ${fmt(headline.minShareEur)}. Live prices by country and region from ${headline.totalHomes} co-ownership homes, updated daily.`} />
        <meta property="og:title" content={`The Co-Ownership Price Index — median share ${fmt(headline.medianShareEur)}, entry from ${fmt(headline.minShareEur)}`} />
        <meta property="og:description" content={`Live fractional-ownership prices across ${headline.countries} countries, updated daily from ${headline.totalHomes} homes.`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/co-ownership-price-index/" />
        <link rel="icon" href="/favicon.ico" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Live Market Data · Updated {updatedNice}</span>
        <h1>The <em>Co-Ownership</em> Price Index</h1>
        <p className="page-hero-sub">
          The only live price benchmark for fractional holiday-home ownership in Europe — medians,
          entry prices, €/m² and distribution across {headline.countries} countries, recomputed every
          day from the {headline.totalHomes} homes in our collection.
        </p>
      </section>

      <section className="pi-sec">
        <div className="pi-inner">

          <div className="pi-headline">
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.medianShareEur)}</span><span className="pi-stat-lbl">Median 1/8 share (Europe)</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.minShareEur)}</span><span className="pi-stat-lbl">Lowest entry today</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.perSqmEur)}</span><span className="pi-stat-lbl">Median whole-home €/m²</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{headline.eighthPct}%</span><span className="pi-stat-lbl">Homes sold in eighths</span></div>
          </div>

          {/* Findings — written analysis, computed from live data */}
          <div className="pi-findings">
            <h2>What the data says today</h2>
            <ul>
              {findings.cheapest && findings.dearest && (
                <li><strong>{findings.dearest.country}</strong> is Europe's dearest co-ownership market at a median {fmt(findings.dearest.medianShare)} per share; <strong>{findings.cheapest.country}</strong> is the value entry at {fmt(findings.cheapest.medianShare)} — a gap of {Math.round(((findings.dearest.medianShare - findings.cheapest.medianShare) / findings.cheapest.medianShare) * 100)}%.</li>
              )}
              <li><strong>{findings.under150}% of European shares</strong> in the collection are priced under €150,000 — genuine deeded ownership of a managed holiday home at the price bracket of a mid-range car or a kitchen renovation.</li>
              {findings.regionDear && findings.regionCheap && (
                <li>On whole-home value, <strong>{findings.regionDear.region}</strong> is the priciest tracked region at ~{fmt(findings.regionDear.perSqm)}/m², while <strong>{findings.regionCheap.region}</strong> offers the same ownership model at ~{fmt(findings.regionCheap.perSqm)}/m² — the spread buyers arbitrage when they choose region before country.</li>
              )}
              <li>{headline.eighthPct}% of homes divide into <strong>eight shares</strong> (roughly 45 days of use each) — the de-facto standard of European co-ownership; the remainder use quarters or sixths for larger allocations.</li>
            </ul>
          </div>

          {/* Country table with 30-day movement */}
          <h2 className="pi-h2">By country</h2>
          <div className="pi-table-wrap">
            <table className="pi-table">
              <thead><tr><th>Country</th><th>Homes</th><th>Median share</th><th>30-day</th><th>Entry</th><th>Top of market</th><th>Whole-home /m²*</th></tr></thead>
              <tbody>
                {countries.map((c) => {
                  const d = delta(c);
                  return (
                    <tr key={c.country}>
                      <td><strong>{c.country}</strong></td>
                      <td>{c.homes}</td>
                      <td><strong>{fmt(c.medianShare, c.currency)}</strong></td>
                      <td style={{ color: d ? (d.dir > 0 ? '#16775d' : d.dir < 0 ? '#986813' : '#8a9aaa') : '#c3bcae' }}>{d ? d.txt : 'tracking…'}</td>
                      <td>{fmt(c.minShare, c.currency)}</td>
                      <td>{fmt(c.maxShare, c.currency)}</td>
                      <td>{c.perSqm ? fmt(c.perSqm, c.currency) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Region table */}
          <h2 className="pi-h2">By region — where the market actually trades</h2>
          <div className="pi-table-wrap">
            <table className="pi-table">
              <thead><tr><th>Region</th><th>Country</th><th>Homes</th><th>Median share</th><th>Entry</th><th>Whole-home /m²*</th></tr></thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={`${r.region}-${r.country}`}>
                    <td><strong>{r.region}</strong></td>
                    <td>{r.country}</td>
                    <td>{r.homes}</td>
                    <td><strong>{fmt(r.medianShare, r.currency)}</strong></td>
                    <td>{fmt(r.minShare, r.currency)}</td>
                    <td>{r.perSqm ? fmt(r.perSqm, r.currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Distribution */}
          <h2 className="pi-h2">Where share prices cluster (European homes)</h2>
          <div className="pi-chart" role="img" aria-label={`Distribution of European share prices across ${dist.reduce((s, d) => s + d.count, 0)} homes`}>
            {dist.map((d) => (
              <div className="pi-bar-row" key={d.label}>
                <span className="pi-bar-label">{d.label}</span>
                <span className="pi-bar-track"><span className="pi-bar-fill" style={{ width: `${Math.max((d.count / distMax) * 100, 2)}%` }} /></span>
                <span className="pi-bar-val">{d.count}</span>
              </div>
            ))}
          </div>

          {/* Entry tier */}
          <h2 className="pi-h2">The entry tier — ownership from {fmt(headline.minShareEur)} today</h2>
          <div className="pi-entry">
            {entry.map((e) => (
              <a key={e.slug} href={`/property/${e.slug}/`} className="pi-entry-row">
                <span className="pi-entry-title">{e.title}</span>
                <span className="pi-entry-meta">{e.region}{e.beds ? ` · ${e.beds} beds` : ''}</span>
                <span className="pi-entry-price">{fmtK(e.price)}</span>
              </a>
            ))}
          </div>

          <p className="pi-footnote">
            *Whole-home value (share price × number of shares) divided by liveable area — the fairest
            way to compare co-ownership pricing with the wider property market. All figures are asking
            share prices for the most common fraction of each home, usually one-eighth; sold and
            withdrawn homes are excluded. The index recomputes daily from the live Co-Ownership
            Property collection and snapshots history for the 30-day movement column. Cite freely with
            a link to this page.
          </p>

          <div className="pi-method">
            <h2>How to read these numbers</h2>
            <p>
              A co-ownership share gives you deeded ownership of a fraction of a fully managed holiday
              home — typically one-eighth, corresponding to roughly 45 days of use per year through a
              fair-rotation calendar. The prices above are full purchase prices of those shares, not
              deposits: the median European buyer here pays {fmt(headline.medianShareEur)} for a share
              of a home that would cost roughly eight times that to own outright, before furnishing and
              upkeep — which co-owners share rather than shoulder alone.
            </p>
            <p>
              The €/m² column is the index's quiet workhorse: multiply a share by its denominator and
              divide by floor area, and co-ownership becomes directly comparable with whole-market
              pricing in the same postcode — the honest way to judge whether a share is well priced.
              Entry prices tell the more surprising story: managed holiday-home ownership currently
              starts at {fmt(headline.minShareEur)}, and {findings.under150}% of European shares sit
              under €150,000.
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  );
}
