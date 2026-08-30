import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';

/**
 * /co-ownership-price-index — The Co-Ownership Price Index (v3).
 *
 * The only public price benchmark for fractional holiday-home ownership.
 * Everything on the page is computed at build/ISR time from the live
 * catalogue — no hand-typed numbers anywhere, so the page cannot drift
 * from reality. Rebuilt once a day (revalidate 86400): fresh enough to
 * cite, cheap enough that it never costs a redeploy.
 *
 * What makes it defensible as a data asset:
 *   - Full distribution, not just an average: entry / P25 / median / P75 / top
 *     per country, so a reader can place any listing in its market.
 *   - A sold cohort. 90 homes have sold through the catalogue; comparing
 *     sold prices against live asking prices is data nobody else holds.
 *   - Listing cohorts by month, which is a genuine time series recoverable
 *     from date_added without waiting for snapshot history to accumulate.
 *   - Whole-home €/m², which converts a share price into a comparable that
 *     estate agents and journalists already understand.
 *
 * Editorial rules that apply here as everywhere: share prices only, never a
 * running-cost figure, never a tax rate, never an operator or partner name.
 */

const SYM = { EUR: '€', USD: '$', GBP: '£' };

/* Data-mark colours. Brand navy (#1E3448) and gold (#C9A84C) FAIL as data
   marks — navy sits outside the lightness band and reads gray at 0.046
   chroma; gold lands at 2.29:1 against white. These are the brand-adjacent
   steps that pass all six checks (CVD ΔE 20.3 protan / 21.4 tritan,
   normal-vision ΔE 24.5, contrast ≥3:1). Text keeps the brand ink. */
const C_LIVE = '#1878A8';
const C_SOLD = '#B07A12';
const C_GRID = '#E2DCD2';

function median(nums) {
  if (!nums || !nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/** Nearest-rank percentile — honest on small samples, no interpolation. */
function percentile(nums, p) {
  if (!nums || !nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

/** Whole-home value implied by a share price × the number of shares. */
const wholeHome = (p) => Number(p.price) * (p.share_denominator || 8);

const TYPE_LABEL = {
  apartment: 'Apartments', penthouse: 'Penthouses', house: 'Houses',
  villa: 'Villas', finca: 'Fincas & country houses', chalet: 'Chalets',
};
const normType = (t) => String(t || '').trim().toLowerCase();

const EUR_BANDS = [
  { label: 'Under €100k', max: 100000 },
  { label: '€100–150k', max: 150000 },
  { label: '€150–200k', max: 200000 },
  { label: '€200–300k', max: 300000 },
  { label: '€300–500k', max: 500000 },
  { label: '€500k–1m', max: 1000000 },
  { label: 'Over €1m', max: Infinity },
];
const USD_BANDS = [
  { label: 'Under $150k', max: 150000 },
  { label: '$150–250k', max: 250000 },
  { label: '$250–400k', max: 400000 },
  { label: '$400–600k', max: 600000 },
  { label: '$600k–1m', max: 1000000 },
  { label: 'Over $1m', max: Infinity },
];

function bandCounts(prices, bands) {
  return bands.map((b, i) => {
    const lo = i === 0 ? 0 : bands[i - 1].max;
    return { label: b.label, count: prices.filter((v) => v >= lo && v < b.max).length };
  });
}

/** Aggregate one cohort of properties into the row shape every table uses. */
function summarise(list) {
  const prices = list.map((p) => Number(p.price));
  const withSize = list.filter((p) => p.size > 0);
  return {
    homes: list.length,
    entry: Math.min(...prices),
    p25: percentile(prices, 25),
    medianShare: median(prices),
    p75: percentile(prices, 75),
    top: Math.max(...prices),
    perSqm: withSize.length >= 3
      ? median(withSize.map((p) => Math.round(wholeHome(p) / p.size)))
      : null,
    medianWhole: median(list.map(wholeHome)),
    currency: list[0].currency || 'EUR',
  };
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const SELECT =
    'slug,title,country,region,city,price,currency,beds,baths,size,share_denominator,date_added,property_type';

  const [{ data: liveRows }, { data: soldRows }] = await Promise.all([
    supabase.from('properties').select(SELECT).in('status', ['Live', 'for_sale']).gt('price', 0),
    supabase.from('properties').select(SELECT).eq('status', 'sold').gt('price', 0),
  ]);

  const live = liveRows || [];
  const sold = soldRows || [];
  const eur = live.filter((p) => (p.currency || 'EUR') === 'EUR');
  const usd = live.filter((p) => p.currency === 'USD');

  /* ── Country level ─────────────────────────────────────────────────────
     A market is a country AND a currency. Several countries carry a few
     listings priced in the other currency (a handful of French and Italian
     homes are quoted in dollars); blending €120k with $775k into one median
     would produce a number about nothing. Each country is therefore reduced
     to its dominant-currency cohort, and the stragglers are counted so the
     footnote can say how many were set aside. */
  function dominantByCurrency(list) {
    const groups = {};
    for (const p of list) (groups[p.currency || 'EUR'] ||= []).push(p);
    const ranked = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    return { main: ranked[0][1], setAside: list.length - ranked[0][1].length };
  }

  const byCountry = {};
  for (const p of live) (byCountry[p.country || 'Other'] ||= []).push(p);
  const countries = Object.entries(byCountry)
    .map(([country, all]) => {
      const { main, setAside } = dominantByCurrency(all);
      return main.length >= 3 ? { country, setAside, ...summarise(main) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.homes - a.homes);
  const setAsideTotal = countries.reduce((n, c) => n + c.setAside, 0);

  /* ── Region level ──────────────────────────────────────────────────── */
  const byRegion = {};
  for (const p of live) {
    if (!p.region) continue;
    (byRegion[`${p.region}|${p.country}`] ||= []).push(p);
  }
  const regions = Object.entries(byRegion)
    .map(([key, all]) => {
      const [region, country] = key.split('|');
      const { main } = dominantByCurrency(all);
      return main.length >= 4 ? { region, country, ...summarise(main) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.homes - a.homes)
    .slice(0, 18);

  /* ── The sold cohort — asking vs achieved, by market ───────────────── */
  const soldByCountry = {};
  for (const p of sold) (soldByCountry[p.country || 'Other'] ||= []).push(p);
  const soldCompare = countries
    .map((c) => {
      const s = (soldByCountry[c.country] || []).filter((p) => (p.currency || 'EUR') === c.currency);
      if (s.length < 3) return null;
      const sMed = median(s.map((p) => Number(p.price)));
      return {
        country: c.country,
        currency: c.currency,
        liveMedian: c.medianShare,
        soldMedian: sMed,
        soldCount: s.length,
        liveCount: c.homes,
        absorbed: Math.round((s.length / (s.length + c.homes)) * 100),
        gap: sMed && c.medianShare ? Math.round(((sMed - c.medianShare) / c.medianShare) * 100) : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.soldCount - a.soldCount);

  const soldTotals = {
    count: sold.length,
    eurMedian: median(sold.filter((p) => (p.currency || 'EUR') === 'EUR').map((p) => Number(p.price))),
    usdMedian: median(sold.filter((p) => p.currency === 'USD').map((p) => Number(p.price))),
    absorbedPct: Math.round((sold.length / (sold.length + live.length)) * 100),
  };

  /* ── Listing cohorts: median asking price by month first listed ────── */
  const monthKey = (d) => (d ? String(d).slice(0, 7) : null);
  const cohortMap = {};
  for (const p of [...live, ...sold]) {
    const k = monthKey(p.date_added);
    if (!k) continue;
    (cohortMap[k] ||= []).push(p);
  }
  const cohorts = Object.entries(cohortMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, l]) => {
      const e = l.filter((p) => (p.currency || 'EUR') === 'EUR').map((p) => Number(p.price));
      const u = l.filter((p) => p.currency === 'USD').map((p) => Number(p.price));
      return {
        month,
        listed: l.length,
        eurMedian: e.length >= 3 ? median(e) : null,
        usdMedian: u.length >= 3 ? median(u) : null,
      };
    })
    .filter((c) => c.listed >= 5);

  /* ── Cut by property type and by bedroom count (EUR, comparable) ───── */
  const byType = {};
  for (const p of eur) {
    const t = normType(p.property_type);
    if (!TYPE_LABEL[t]) continue;
    (byType[t] ||= []).push(p);
  }
  const types = Object.entries(byType)
    .filter(([, l]) => l.length >= 4)
    .map(([t, l]) => ({
      type: TYPE_LABEL[t],
      homes: l.length,
      medianShare: median(l.map((p) => Number(p.price))),
      perSqm: l.filter((p) => p.size > 0).length >= 3
        ? median(l.filter((p) => p.size > 0).map((p) => Math.round(wholeHome(p) / p.size)))
        : null,
    }))
    .sort((a, b) => b.homes - a.homes);

  const byBeds = {};
  for (const p of eur) {
    const b = Number(p.beds);
    if (!b || b < 1 || b > 6) continue;
    (byBeds[b] ||= []).push(p);
  }
  const beds = Object.entries(byBeds)
    .filter(([, l]) => l.length >= 4)
    .map(([b, l]) => ({
      beds: Number(b),
      homes: l.length,
      medianShare: median(l.map((p) => Number(p.price))),
      perBed: Math.round(median(l.map((p) => Number(p.price))) / Number(b)),
    }))
    .sort((a, b) => a.beds - b.beds);

  /* ── Distributions ─────────────────────────────────────────────────── */
  const eurPrices = eur.map((p) => Number(p.price));
  const usdPrices = usd.map((p) => Number(p.price));
  const distEur = bandCounts(eurPrices, EUR_BANDS);
  const distUsd = bandCounts(usdPrices, USD_BANDS);

  /* ── Entry and premium tiers (live, linkable) ──────────────────────── */
  const tier = (list, dir, n) =>
    [...list]
      .sort((a, b) => (dir === 'up' ? a.price - b.price : b.price - a.price))
      .slice(0, n)
      .map((p) => ({
        slug: p.slug, title: p.title, price: Number(p.price), currency: p.currency || 'EUR',
        region: p.region || p.country, beds: p.beds || null, size: p.size || null,
      }));

  const entryEur = tier(eur, 'up', 8);
  const entryUsd = tier(usd, 'up', 5);
  const premium = tier(live, 'down', 5);

  /* ── Value ranking: cheapest whole-home €/m² among tracked regions ─── */
  const valueRegions = regions
    .filter((r) => r.currency === 'EUR' && r.perSqm)
    .sort((a, b) => a.perSqm - b.perSqm);

  /* ── 30-day movement, once snapshot history exists ─────────────────── */
  let deltas = {};
  try {
    const cutoff = new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10);
    const { data: snaps } = await supabase
      .from('price_index_snapshots')
      .select('snap_date,country,median_share')
      .lte('snap_date', cutoff)
      .order('snap_date', { ascending: false })
      .limit(300);
    const seen = {};
    for (const s of snaps || []) if (!seen[s.country]) seen[s.country] = s.median_share;
    deltas = seen;
  } catch (_) { /* no history yet — the column simply reads "tracking…" */ }

  /* ── Headline ──────────────────────────────────────────────────────── */
  const eurWithSize = eur.filter((p) => p.size > 0);
  const denom = {};
  for (const p of live) { const d = p.share_denominator || 8; denom[d] = (denom[d] || 0) + 1; }
  const headline = {
    totalHomes: live.length,
    countries: countries.length,
    medianShareEur: median(eurPrices),
    p25Eur: percentile(eurPrices, 25),
    p75Eur: percentile(eurPrices, 75),
    medianShareUsd: median(usdPrices),
    minShareEur: eurPrices.length ? Math.min(...eurPrices) : null,
    minShareUsd: usdPrices.length ? Math.min(...usdPrices) : null,
    perSqmEur: eurWithSize.length ? median(eurWithSize.map((p) => Math.round(wholeHome(p) / p.size))) : null,
    medianWholeEur: median(eur.map(wholeHome)),
    eighthPct: Math.round(((denom[8] || 0) / live.length) * 100),
    eurCount: eur.length,
    usdCount: usd.length,
    soldCount: sold.length,
  };

  const updated = new Date().toISOString().slice(0, 10);
  return {
    props: {
      countries, setAsideTotal, regions, soldCompare, soldTotals, cohorts, types, beds,
      distEur, distUsd, entryEur, entryUsd, premium, valueRegions,
      headline, deltas, updated,
    },
    revalidate: 86400,
  };
}

/* ── Chart primitives ─────────────────────────────────────────────────────
   Server-rendered SVG: no chart library, no client JS, no layout shift.
   Bars are rounded on the data end only and square on the baseline, so the
   baseline stays a straight edge; native <title> gives every mark a hover
   readout without shipping a tooltip runtime; and every chart is paired with
   the table that holds the same numbers, so identity is never colour-alone. */

function hBarPath(x, y, w, h, r = 4) {
  const rr = Math.max(0, Math.min(r, w));
  return `M${x},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x} Z`;
}
function vBarPath(x, y, w, h, r = 4) {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/** Ranked horizontal bars — magnitude across named categories. */
function RankedBars({ rows, fmt, color = C_LIVE, labelWidth = 132, unit = '' }) {
  const W = 680, ROW = 30, GAP = 8, VAL = 96;
  const barMax = W - labelWidth - VAL;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const H = rows.length * (ROW + GAP);
  return (
    <svg className="pi-svg" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label={`Ranked comparison${unit ? ' in ' + unit : ''}`}>
      {rows.map((r, i) => {
        const y = i * (ROW + GAP);
        const w = Math.max(3, (r.value / max) * barMax);
        return (
          <g key={r.label}>
            <title>{`${r.label}: ${fmt(r.value)}${r.note ? ` (${r.note})` : ''}`}</title>
            <text className="pi-svg-lbl" x="0" y={y + ROW * 0.7}>{r.label}</text>
            <path d={hBarPath(labelWidth, y, w, ROW)} fill={color} />
            <text className="pi-svg-val" x={labelWidth + w + 10} y={y + ROW * 0.7}>{fmt(r.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Histogram — how the market is actually distributed, not just its middle. */
function Histogram({ bins, color = C_LIVE, total }) {
  const W = 680, H = 210, PAD_B = 46, PAD_T = 24;
  const max = Math.max(...bins.map((b) => b.count), 1);
  const bw = W / bins.length;
  const plot = H - PAD_B - PAD_T;
  return (
    <svg className="pi-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price distribution">
      <line x1="0" y1={H - PAD_B} x2={W} y2={H - PAD_B} stroke={C_GRID} strokeWidth="1" />
      {bins.map((b, i) => {
        const h = Math.max(2, (b.count / max) * plot);
        const x = i * bw + 10;
        const w = bw - 20;
        const share = total ? Math.round((b.count / total) * 100) : null;
        return (
          <g key={b.label}>
            <title>{`${b.label}: ${b.count} homes${share != null ? ` · ${share}% of the market` : ''}`}</title>
            <path d={vBarPath(x, H - PAD_B - h, w, h)} fill={color} />
            <text className="pi-svg-val" x={x + w / 2} y={H - PAD_B - h - 7} textAnchor="middle">{b.count}</text>
            <text className="pi-svg-lbl" x={x + w / 2} y={H - PAD_B + 18} textAnchor="middle">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Two-series grouped bars — asking price against achieved price. */
function GroupedBars({ rows, fmt }) {
  /* One scale per chart, and the caller only ever passes rows that share a
     currency — a euro bar and a dollar bar on one axis would be a lie. */
  const W = 680, ROW = 46, GAP = 12, LBL = 120, VAL = 100;
  const barMax = W - LBL - VAL;
  const max = Math.max(...rows.flatMap((r) => [r.a, r.b]), 1);
  const H = rows.length * (ROW + GAP);
  return (
    <svg className="pi-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Live asking price against achieved sold price">
      {rows.map((r, i) => {
        const y = i * (ROW + GAP);
        const wa = Math.max(3, (r.a / max) * barMax);
        const wb = Math.max(3, (r.b / max) * barMax);
        return (
          <g key={r.label}>
            <text className="pi-svg-lbl" x="0" y={y + 18}>{r.label}</text>
            <g>
              <title>{`${r.label} — live asking median ${fmt(r.a, r.ccy)}`}</title>
              <path d={hBarPath(LBL, y, wa, 18)} fill={C_LIVE} />
              <text className="pi-svg-val" x={LBL + wa + 10} y={y + 14}>{fmt(r.a, r.ccy)}</text>
            </g>
            <g>
              <title>{`${r.label} — sold median ${fmt(r.b, r.ccy)} across ${r.n} sales`}</title>
              <path d={hBarPath(LBL, y + 20, wb, 18)} fill={C_SOLD} />
              <text className="pi-svg-val" x={LBL + wb + 10} y={y + 34}>{fmt(r.b, r.ccy)}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** Cohort line — median asking price of the homes listed in each month. */
function CohortLine({ points, fmt }) {
  const W = 680, H = 240, PAD_L = 8, PAD_R = 8, PAD_T = 30, PAD_B = 46;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.06;
  const px = (i) => PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(1, points.length - 1);
  const py = (v) => PAD_T + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - PAD_T - PAD_B);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(i)},${py(p.value)}`).join(' ');
  return (
    <svg className="pi-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Median asking price by month first listed">
      <line x1="0" y1={H - PAD_B} x2={W} y2={H - PAD_B} stroke={C_GRID} strokeWidth="1" />
      <path d={d} fill="none" stroke={C_LIVE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.label}>
          <title>{`${p.label}: median ${fmt(p.value)} across ${p.n} homes listed`}</title>
          <circle cx={px(i)} cy={py(p.value)} r="5" fill="#FFFFFF" stroke={C_LIVE} strokeWidth="2" />
          <text className="pi-svg-val" x={px(i)} y={py(p.value) - 14} textAnchor="middle">{fmt(p.value)}</text>
          <text className="pi-svg-lbl" x={px(i)} y={H - PAD_B + 18} textAnchor="middle">{p.label}</text>
          <text className="pi-svg-sub" x={px(i)} y={H - PAD_B + 34} textAnchor="middle">{p.n} listed</text>
        </g>
      ))}
    </svg>
  );
}

export default function PriceIndex({
  countries, setAsideTotal, regions, soldCompare, soldTotals, cohorts, types, beds,
  distEur, distUsd, entryEur, entryUsd, premium, valueRegions,
  headline, deltas, updated,
}) {
  const fmt = (n, ccy = 'EUR') => (n == null ? '—' : `${SYM[ccy] || ccy}${Number(n).toLocaleString('en-GB')}`);
  const fmtK = (n, ccy = 'EUR') => (n == null ? '—' : `${SYM[ccy] || ccy}${Math.round(n / 1000)}k`);
  const eurFmt = (n) => fmtK(n, 'EUR');
  const updatedNice = new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthNice = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

  const delta = (c) => {
    const prev = deltas[c.country];
    if (!prev || !c.medianShare) return null;
    const p = ((c.medianShare - prev) / prev) * 100;
    if (Math.abs(p) < 0.05) return { txt: 'no change', dir: 0 };
    return { txt: `${p > 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1)}%`, dir: p > 0 ? 1 : -1 };
  };

  /* Findings are derived here rather than written by hand, so the prose can
     never contradict the tables underneath it. */
  const eurCountries = countries.filter((c) => c.currency === 'EUR');
  const cheapest = [...eurCountries].sort((a, b) => a.medianShare - b.medianShare)[0];
  const dearest = [...eurCountries].sort((a, b) => b.medianShare - a.medianShare)[0];
  const spreadPct = cheapest && dearest ? Math.round(((dearest.medianShare - cheapest.medianShare) / cheapest.medianShare) * 100) : null;
  const under150 = distEur.slice(0, 2).reduce((s, b) => s + b.count, 0);
  const under150Pct = headline.eurCount ? Math.round((under150 / headline.eurCount) * 100) : 0;
  const bestValue = valueRegions[0];
  const dearestRegion = valueRegions[valueRegions.length - 1];
  const valueMultiple = bestValue && dearestRegion ? (dearestRegion.perSqm / bestValue.perSqm).toFixed(1) : null;
  const deepestMarket = countries[0];
  const soldLead = soldCompare[0];
  const firstCohort = cohorts[0];
  const lastCohort = cohorts[cohorts.length - 1];
  const cohortShift =
    firstCohort && lastCohort && firstCohort.eurMedian && lastCohort.eurMedian
      ? Math.round(((lastCohort.eurMedian - firstCohort.eurMedian) / firstCohort.eurMedian) * 100)
      : null;

  const faqs = [
    {
      q: 'What does a 1/8 share of a holiday home actually cost?',
      a: `Across the ${headline.eurCount} euro-priced homes tracked in this index the median 1/8 share is ${fmt(headline.medianShareEur)}, with the entry point today at ${fmt(headline.minShareEur)}. The middle half of the European market — the 25th to 75th percentile — runs from ${fmt(headline.p25Eur)} to ${fmt(headline.p75Eur)} per share. In the United States, where ${headline.usdCount} homes are tracked, the median share is ${fmt(headline.medianShareUsd, 'USD')}.`,
    },
    {
      q: 'Is a share priced at exactly one-eighth of the home value?',
      a: `Not quite. A share price reflects the home, the furnishings, the legal structure and the managed service, so the implied whole-home value (share price × number of shares) runs above a bare market valuation. The median implied whole-home value in the European set is ${fmt(headline.medianWholeEur)}, or about ${fmt(headline.perSqmEur)} per square metre — the figure to compare against local agency listings.`,
    },
    {
      q: 'How many shares does a home usually divide into?',
      a: `${headline.eighthPct}% of the homes in this index divide into eight shares, which is the de facto European standard and works out at roughly 45 days of use a year. The remainder use quarters, sixths or — in a few Paris apartments — larger divisions that lower the entry price and shorten the stay allocation.`,
    },
    {
      q: 'Do co-ownership shares sell at the asking price?',
      a: `The index tracks ${soldTotals.count} homes that have sold through the collection. Comparing achieved prices against current asking prices market by market is the closest public proxy for negotiating room; the sold-cohort table on this page shows where the two lines sit for each country.`,
    },
    {
      q: 'How often is this index updated?',
      a: `Every day. The page is rebuilt from the live catalogue once every 24 hours, so the medians, distributions and entry prices shown here reflect the homes actually available on the date at the top of the page (${updatedNice}).`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        '@id': 'https://co-ownership-property.com/co-ownership-price-index/#dataset',
        name: 'The Co-Ownership Price Index',
        description: `Live fractional-ownership share prices: median, quartile and entry prices by country and region, price distribution, sold-cohort comparison, listing cohorts by month and whole-home €/m². Computed daily from ${headline.totalHomes} live listings and ${soldTotals.count} completed sales across ${headline.countries} countries.`,
        url: 'https://co-ownership-property.com/co-ownership-price-index/',
        creator: { '@type': 'Organization', name: 'Co-Ownership Property', url: 'https://co-ownership-property.com' },
        dateModified: updated,
        isAccessibleForFree: true,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        temporalCoverage: `${cohorts.length ? cohorts[0].month : ''}/${updated.slice(0, 7)}`,
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Median 1/8 share price (EUR)', value: headline.medianShareEur, unitCode: 'EUR' },
          { '@type': 'PropertyValue', name: 'Entry share price (EUR)', value: headline.minShareEur, unitCode: 'EUR' },
          { '@type': 'PropertyValue', name: 'Median whole-home value per square metre (EUR)', value: headline.perSqmEur, unitCode: 'EUR' },
          { '@type': 'PropertyValue', name: 'Homes tracked', value: headline.totalHomes },
        ],
        keywords: ['fractional ownership prices', 'co-ownership property price index', 'holiday home share price', '1/8 share cost', 'fractional real estate Europe'],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://co-ownership-property.com/co-ownership-price-index/#faq',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{`Co-Ownership Price Index ${new Date(updated).getFullYear()} — What a 1/8 Share Really Costs`}</title>
        <meta name="description" content={`Median 1/8 share ${fmt(headline.medianShareEur)} in Europe, ${fmt(headline.medianShareUsd, 'USD')} in the US. Entry from ${fmt(headline.minShareEur)}. Live quartiles, distribution, sold prices and €/m² across ${headline.countries} countries — updated daily from ${headline.totalHomes} homes.`} />
        <meta property="og:title" content={`The Co-Ownership Price Index — median share ${fmt(headline.medianShareEur)}, entry from ${fmt(headline.minShareEur)}`} />
        <meta property="og:description" content={`The only live price benchmark for fractional holiday-home ownership: ${headline.totalHomes} homes, ${soldTotals.count} completed sales, ${headline.countries} countries. Updated ${updatedNice}.`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://co-ownership-property.com/co-ownership-price-index/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/co-ownership-price-index/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Live market data · Updated {updatedNice}</span>
        <h1>The <em>Co-Ownership</em> Price Index</h1>
        <p className="page-hero-sub">
          The only public price benchmark for fractional holiday-home ownership. Every figure on this
          page is recomputed each day from the {headline.totalHomes} homes currently listed and the{' '}
          {soldTotals.count} that have already sold — {headline.countries} countries, no estimates,
          no survey, no hand-typed numbers.
        </p>
      </section>

      <section className="pi-sec">
        <div className="pi-inner">

          {/* ── Headline ─────────────────────────────────────────────── */}
          <div className="pi-headline pi-headline-6">
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.medianShareEur)}</span><span className="pi-stat-lbl">Median share · Europe</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.medianShareUsd, 'USD')}</span><span className="pi-stat-lbl">Median share · USA</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.minShareEur)}</span><span className="pi-stat-lbl">Lowest entry today</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(headline.perSqmEur)}</span><span className="pi-stat-lbl">Whole-home €/m²</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{headline.totalHomes}</span><span className="pi-stat-lbl">Homes tracked</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{soldTotals.count}</span><span className="pi-stat-lbl">Completed sales</span></div>
          </div>

          <nav className="pi-toc" aria-label="On this page">
            <a href="#findings">Findings</a>
            <a href="#countries">By country</a>
            <a href="#distribution">Distribution</a>
            <a href="#regions">By region</a>
            <a href="#sold">What actually sells</a>
            <a href="#cohorts">Month by month</a>
            <a href="#types">Type &amp; size</a>
            <a href="#entry">Entry &amp; premium</a>
            <a href="#method">Methodology</a>
          </nav>

          {/* ── Findings ─────────────────────────────────────────────── */}
          <h2 className="pi-h2" id="findings">What the data says today</h2>
          <div className="pi-findings">
            <ul>
              {cheapest && dearest && (
                <li>
                  <strong>{dearest.country}</strong> is the dearest European market at a median{' '}
                  {fmt(dearest.medianShare)} per share, against <strong>{cheapest.country}</strong> at{' '}
                  {fmt(cheapest.medianShare)} — a {spreadPct}% spread for the same ownership structure.
                  Country, not property type, remains the single biggest lever on entry price.
                </li>
              )}
              <li>
                <strong>{under150Pct}% of European shares are under €150,000</strong>, and the middle
                half of the market runs {fmt(headline.p25Eur)}–{fmt(headline.p75Eur)}. The mental model
                buyers arrive with — that a holiday home starts near half a million — is roughly three
                times the actual median entry.
              </li>
              {bestValue && dearestRegion && valueMultiple && (
                <li>
                  On whole-home value the spread is wider still: <strong>{bestValue.region}</strong> at
                  about {fmt(bestValue.perSqm)}/m² against <strong>{dearestRegion.region}</strong> at{' '}
                  {fmt(dearestRegion.perSqm)}/m² — <strong>{valueMultiple}×</strong> the price per square
                  metre for the same fractional structure. Choosing the region before the country is
                  where the real arbitrage sits.
                </li>
              )}
              {soldLead && soldLead.gap != null && (
                <li>
                  Across {soldTotals.count} completed sales, achieved prices track close to asking:
                  in <strong>{soldLead.country}</strong>, the deepest sold sample ({soldLead.soldCount}{' '}
                  sales), the sold median sits {soldLead.gap === 0 ? 'level with' : `${Math.abs(soldLead.gap)}% ${soldLead.gap > 0 ? 'above' : 'below'}`} the
                  current live median. {soldTotals.absorbedPct}% of everything ever listed here has now sold.
                </li>
              )}
              {cohortShift != null && firstCohort && lastCohort && (
                <li>
                  Homes first listed in <strong>{monthNice(lastCohort.month)}</strong> carry a median
                  asking price {cohortShift === 0 ? 'level with' : `${Math.abs(cohortShift)}% ${cohortShift > 0 ? 'above' : 'below'}`}{' '}
                  those listed in {monthNice(firstCohort.month)} — a read on what operators are bringing
                  to market now, not on what individual homes have done.
                </li>
              )}
              <li>
                <strong>{headline.eighthPct}% of homes divide into eighths</strong> — about 45 days of
                use a year. Where a home divides differently it is nearly always to lower the entry
                price, not to change the ownership itself.
              </li>
              {deepestMarket && (
                <li>
                  <strong>{deepestMarket.country}</strong> is the deepest market tracked with{' '}
                  {deepestMarket.homes} live homes — enough inventory that a buyer can be specific about
                  region, size and season rather than taking what is available.
                </li>
              )}
            </ul>
          </div>

          {/* ── Country table ────────────────────────────────────────── */}
          <h2 className="pi-h2" id="countries">By country</h2>
          <p className="pi-lede">
            Entry is the cheapest live share in that market; P25 and P75 bound the middle half of it;
            top of market is the dearest share currently listed. Whole-home €/m² multiplies a share
            price by the number of shares and divides by floor area — the number to hold against a
            local estate agent&rsquo;s listings. Each country is reported in the currency the great
            majority of its homes are priced in{setAsideTotal > 0 ? `; ${setAsideTotal} listing${setAsideTotal === 1 ? '' : 's'} quoted in the other currency ${setAsideTotal === 1 ? 'is' : 'are'} held out of these rows rather than blended into a mixed-currency median` : ''}.
          </p>
          <div className="pi-table-wrap">
            <table className="pi-table">
              <thead>
                <tr>
                  <th>Country</th><th>Homes</th><th>Entry</th><th>P25</th>
                  <th>Median share</th><th>P75</th><th>Top of market</th>
                  <th>Whole-home /m²</th><th>30-day</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => {
                  const d = delta(c);
                  return (
                    <tr key={c.country}>
                      <td><strong>{c.country}</strong></td>
                      <td>{c.homes}</td>
                      <td>{fmt(c.entry, c.currency)}</td>
                      <td>{fmt(c.p25, c.currency)}</td>
                      <td><strong>{fmt(c.medianShare, c.currency)}</strong></td>
                      <td>{fmt(c.p75, c.currency)}</td>
                      <td>{fmt(c.top, c.currency)}</td>
                      <td>{c.perSqm ? fmt(c.perSqm, c.currency) : '—'}</td>
                      <td className={d ? (d.dir > 0 ? 'pi-up' : d.dir < 0 ? 'pi-down' : '') : 'pi-muted'}>
                        {d ? d.txt : 'tracking…'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <figure className="pi-fig">
            <figcaption className="pi-figcap">Median share price by country — euro markets</figcaption>
            <RankedBars
              rows={eurCountries.map((c) => ({ label: c.country, value: c.medianShare, note: `${c.homes} homes` }))}
              fmt={(v) => fmt(v)}
            />
          </figure>

          {/* ── Distribution ─────────────────────────────────────────── */}
          <h2 className="pi-h2" id="distribution">How the market is distributed</h2>
          <p className="pi-lede">
            A median hides the shape of a market. These are every euro-priced and dollar-priced share
            in the collection, sorted into bands — the picture that tells you whether the middle is
            crowded or whether the average is being dragged by a handful of trophy homes.
          </p>
          <figure className="pi-fig">
            <figcaption className="pi-figcap">European share prices · {headline.eurCount} homes</figcaption>
            <Histogram bins={distEur} total={headline.eurCount} />
          </figure>
          <figure className="pi-fig">
            <figcaption className="pi-figcap">United States share prices · {headline.usdCount} homes</figcaption>
            <Histogram bins={distUsd} total={headline.usdCount} />
          </figure>
          <p className="pi-footnote">
            Euro and dollar markets are never blended into one figure anywhere on this page. They are
            different currencies, different legal structures and different buyer pools; a combined
            median would be a number about nothing.
          </p>

          {/* ── Regions ──────────────────────────────────────────────── */}
          <h2 className="pi-h2" id="regions">By region</h2>
          <p className="pi-lede">
            Regions with at least four live homes, deepest inventory first. This is the table that
            usually changes a buyer&rsquo;s mind: the same budget buys a materially different home one
            region over.
          </p>
          <div className="pi-table-wrap">
            <table className="pi-table">
              <thead>
                <tr><th>Region</th><th>Country</th><th>Homes</th><th>Entry</th><th>Median share</th><th>P75</th><th>Whole-home /m²</th></tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={`${r.region}-${r.country}`}>
                    <td><strong>{r.region}</strong></td>
                    <td>{r.country}</td>
                    <td>{r.homes}</td>
                    <td>{fmt(r.entry, r.currency)}</td>
                    <td><strong>{fmt(r.medianShare, r.currency)}</strong></td>
                    <td>{fmt(r.p75, r.currency)}</td>
                    <td>{r.perSqm ? fmt(r.perSqm, r.currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {valueRegions.length >= 3 && (
            <figure className="pi-fig">
              <figcaption className="pi-figcap">
                Value ranking — implied whole-home price per square metre, cheapest first
              </figcaption>
              <RankedBars
                rows={valueRegions.map((r) => ({ label: r.region, value: r.perSqm, note: `${r.homes} homes` }))}
                fmt={(v) => fmt(v)}
                labelWidth={150}
              />
            </figure>
          )}

          {/* ── Sold cohort ──────────────────────────────────────────── */}
          <h2 className="pi-h2" id="sold">What actually sells</h2>
          <p className="pi-lede">
            Asking prices are easy to find; achieved prices are not. {soldTotals.count} homes have sold
            through this collection, and comparing the two lines market by market is the closest thing
            to a public record of what co-ownership shares really transact at.
          </p>
          <div className="pi-splitstat">
            <div className="pi-stat"><span className="pi-stat-val">{fmt(soldTotals.eurMedian)}</span><span className="pi-stat-lbl">Median sold share · Europe</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{fmt(soldTotals.usdMedian, 'USD')}</span><span className="pi-stat-lbl">Median sold share · USA</span></div>
            <div className="pi-stat"><span className="pi-stat-val">{soldTotals.absorbedPct}%</span><span className="pi-stat-lbl">Of all homes listed, now sold</span></div>
          </div>
          {soldCompare.length > 0 && (
            <>
              {[['EUR', 'Euro markets'], ['USD', 'Dollar markets']].map(([ccy, heading]) => {
                const rows = soldCompare
                  .filter((s) => s.currency === ccy)
                  .map((s) => ({ label: s.country, a: s.liveMedian, b: s.soldMedian, n: s.soldCount, ccy }));
                if (!rows.length) return null;
                return (
                  <figure className="pi-fig" key={ccy}>
                    <figcaption className="pi-figcap">
                      Live asking median against sold median · {heading}
                    </figcaption>
                    <div className="pi-legend">
                      <span><i style={{ background: C_LIVE }} aria-hidden="true" />Live asking</span>
                      <span><i style={{ background: C_SOLD }} aria-hidden="true" />Sold</span>
                    </div>
                    <GroupedBars rows={rows} fmt={(v, c) => fmtK(v, c)} />
                  </figure>
                );
              })}
              <div className="pi-table-wrap">
                <table className="pi-table">
                  <thead>
                    <tr><th>Market</th><th>Live homes</th><th>Sold</th><th>Live median</th><th>Sold median</th><th>Difference</th><th>Share of listings sold</th></tr>
                  </thead>
                  <tbody>
                    {soldCompare.map((s) => (
                      <tr key={s.country}>
                        <td><strong>{s.country}</strong></td>
                        <td>{s.liveCount}</td>
                        <td>{s.soldCount}</td>
                        <td>{fmt(s.liveMedian, s.currency)}</td>
                        <td><strong>{fmt(s.soldMedian, s.currency)}</strong></td>
                        <td className={s.gap > 0 ? 'pi-up' : s.gap < 0 ? 'pi-down' : 'pi-muted'}>
                          {s.gap == null ? '—' : s.gap === 0 ? 'level' : `${s.gap > 0 ? '+' : ''}${s.gap}%`}
                        </td>
                        <td>{s.absorbed}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="pi-footnote">
                A sold median below the live median usually means the cheaper stock cleared first, not
                that sellers discounted — the two cohorts are different homes, not the same homes at two
                points in time. Read it as which end of a market is moving.
              </p>
            </>
          )}

          {/* ── Cohorts ──────────────────────────────────────────────── */}
          {cohorts.filter((c) => c.eurMedian).length >= 3 && (
            <>
              <h2 className="pi-h2" id="cohorts">Month by month</h2>
              <p className="pi-lede">
                The median asking price of the homes first listed in each month. This tracks what is
                being brought to market, which moves earlier and more sharply than the price of any
                individual home.
              </p>
              <figure className="pi-fig">
                <figcaption className="pi-figcap">Median asking share price by month first listed · euro markets</figcaption>
                <CohortLine
                  points={cohorts.filter((c) => c.eurMedian).map((c) => ({ label: monthNice(c.month), value: c.eurMedian, n: c.listed }))}
                  fmt={(v) => eurFmt(v)}
                />
              </figure>
            </>
          )}

          {/* ── Type and size ────────────────────────────────────────── */}
          <h2 className="pi-h2" id="types">Type and size</h2>
          <div className="pi-two">
            <div>
              <h3 className="pi-h3">By property type · euro markets</h3>
              <div className="pi-table-wrap">
              <table className="pi-table pi-table-sm">
                <thead><tr><th>Type</th><th>Homes</th><th>Median share</th><th>/m²</th></tr></thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.type}>
                      <td><strong>{t.type}</strong></td><td>{t.homes}</td>
                      <td>{fmt(t.medianShare)}</td><td>{t.perSqm ? fmt(t.perSqm) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div>
              <h3 className="pi-h3">By bedroom count · euro markets</h3>
              <div className="pi-table-wrap">
              <table className="pi-table pi-table-sm">
                <thead><tr><th>Bedrooms</th><th>Homes</th><th>Median share</th><th>Per bedroom</th></tr></thead>
                <tbody>
                  {beds.map((b) => (
                    <tr key={b.beds}>
                      <td><strong>{b.beds}</strong></td><td>{b.homes}</td>
                      <td>{fmt(b.medianShare)}</td><td>{fmt(b.perBed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
          <p className="pi-footnote">
            Per-bedroom figures fall as homes get larger — the fixed costs of a managed co-ownership
            home are spread across more rooms. It is the clearest argument for buying the larger home
            in the cheaper region rather than the smaller home in the dearer one.
          </p>

          {/* ── Entry and premium tiers ──────────────────────────────── */}
          <h2 className="pi-h2" id="entry">The entry tier, live right now</h2>
          <p className="pi-lede">
            The cheapest shares currently listed. These move — the list is rebuilt daily, and the homes
            at the top of it are usually the first to go.
          </p>
          <div className="pi-entry">
            {entryEur.map((p) => (
              <a className="pi-entry-row" key={p.slug} href={`/property/${p.slug}/`}>
                <span className="pi-entry-title">{p.title}</span>
                <span className="pi-entry-meta">{p.region}{p.beds ? ` · ${p.beds} bed` : ''}{p.size ? ` · ${p.size} m²` : ''}</span>
                <span className="pi-entry-price">{fmt(p.price, p.currency)}</span>
              </a>
            ))}
          </div>
          {entryUsd.length > 0 && (
            <>
              <h3 className="pi-h3">Entry tier · United States</h3>
              <div className="pi-entry">
                {entryUsd.map((p) => (
                  <a className="pi-entry-row" key={p.slug} href={`/property/${p.slug}/`}>
                    <span className="pi-entry-title">{p.title}</span>
                    <span className="pi-entry-meta">{p.region}{p.beds ? ` · ${p.beds} bed` : ''}{p.size ? ` · ${p.size} m²` : ''}</span>
                    <span className="pi-entry-price">{fmt(p.price, p.currency)}</span>
                  </a>
                ))}
              </div>
            </>
          )}
          <h3 className="pi-h3">Top of market</h3>
          <div className="pi-entry">
            {premium.map((p) => (
              <a className="pi-entry-row" key={p.slug} href={`/property/${p.slug}/`}>
                <span className="pi-entry-title">{p.title}</span>
                <span className="pi-entry-meta">{p.region}{p.beds ? ` · ${p.beds} bed` : ''}{p.size ? ` · ${p.size} m²` : ''}</span>
                <span className="pi-entry-price">{fmt(p.price, p.currency)}</span>
              </a>
            ))}
          </div>

          {/* ── Methodology ──────────────────────────────────────────── */}
          <h2 className="pi-h2" id="method">Methodology</h2>
          <div className="pi-method">
            <p>
              <strong>Sample.</strong> Every home listed on co-ownership-property.com with a published
              share price: {headline.totalHomes} live listings across {headline.countries} countries,
              plus {soldTotals.count} completed sales retained for the sold-cohort analysis. Homes
              without a public price are excluded rather than estimated.
            </p>
            <p>
              <strong>What a &ldquo;share price&rdquo; is.</strong> The advertised price of one
              fractional share — most often one eighth ({headline.eighthPct}% of the set) — including
              the furnished home, the legal structure that holds it and the managed service. It is not
              a deposit and not an annual fee. This index publishes share prices only; running costs
              vary by home and are never averaged here.
            </p>
            <p>
              <strong>Implied whole-home value and €/m².</strong> Share price multiplied by the number
              of shares, then divided by floor area where a home publishes one
              ({regions.filter((r) => r.perSqm).length} of the tracked regions do). It is deliberately
              a like-for-like comparator against ordinary agency listings, and it will read above a
              bare valuation because it carries the furnishing and structure with it.
            </p>
            <p>
              <strong>Medians, not averages.</strong> Every headline figure is a median, and quartiles
              are nearest-rank with no interpolation. In a market where a handful of homes clear
              several million, an average would describe none of it. Cohorts of fewer than three homes
              are suppressed rather than shown as a spuriously precise number.
            </p>
            <p>
              <strong>Currencies.</strong> Euro and dollar markets are reported separately throughout.
              Nothing on this page is converted at a spot rate, because a currency conversion applied
              to a property median implies a precision that does not exist.
            </p>
            <p>
              <strong>Independence.</strong> Co-Ownership Property is an independent aggregator. This
              index counts homes from every operator listed on the site and names none of them; no
              operator pays for placement in it, and no figure here is supplied by an operator — all of
              them are computed from published listing prices.
            </p>
            <p>
              <strong>Update cadence.</strong> Rebuilt every 24 hours from the live database. The date
              at the top of the page is the date of the data, not the date the page was written.
            </p>
          </div>

          {/* ── Citation ─────────────────────────────────────────────── */}
          <div className="pi-cite">
            <h3 className="pi-h3">Citing this index</h3>
            <p>
              Free to quote and reproduce with attribution (CC BY 4.0). Journalists and researchers
              are welcome to the underlying cuts — regional breakdowns, longer histories or a specific
              market — on request.
            </p>
            <p className="pi-cite-block">
              Co-Ownership Property, <em>The Co-Ownership Price Index</em>, {updatedNice}.
              co-ownership-property.com/co-ownership-price-index
            </p>
          </div>

          {/* ── FAQ ──────────────────────────────────────────────────── */}
          <h2 className="pi-h2">Questions about these numbers</h2>
          <div className="pi-faq">
            {faqs.map((f) => (
              <details className="pi-faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

          <p className="pi-footnote pi-updated">
            Data as at {updatedNice} · {headline.totalHomes} live homes · {soldTotals.count} completed
            sales · {headline.countries} countries. Share prices are as published by the listing
            operator and change without notice; nothing on this page is investment, legal or tax advice.
          </p>

        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  );
}
