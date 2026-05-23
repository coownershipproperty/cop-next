import { useState, useEffect } from 'react';

// Rolling "shares from" price ticker for the homepage.
// Self-contained: fetches live entry prices per country from Supabase on mount.
// Drop into components/ and render <PriceTicker /> under the "Explore our
// properties" subline. No props required.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';

// Anon key — safe in client code (read-only, RLS-guarded). Uses the project
// env var when present.
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo';

// Countries with a dedicated destination page; others fall back to all homes.
const COUNTRY_PATH = {
  Spain: '/spain-fractional-ownership-properties/',
  France: '/france-fractional-ownership-properties/',
  Italy: '/italy-fractional-ownership-properties/',
  USA: '/usa-fractional-ownership-properties/',
  Portugal: '/portugal-fractional-ownership-properties/',
  Austria: '/austria-fractional-ownership-properties/',
};

const MIN_LISTINGS = 3; // a country appears once it has at least this many homes

export default function PriceTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=country,price,currency&price=gt.0&order=price.asc&limit=1000`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    )
      .then((r) => r.json())
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const agg = {};
        for (const row of rows) {
          const c = row.country;
          if (!c) continue;
          // rows arrive price-ascending, so the first time a country is seen
          // is its lowest entry price.
          if (!agg[c]) agg[c] = { country: c, count: 0, price: row.price, currency: row.currency };
          agg[c].count += 1;
        }
        const list = Object.values(agg)
          .filter((d) => d.count >= MIN_LISTINGS)
          .sort((a, b) => Number(a.price) - Number(b.price));
        setItems(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (price, currency) => {
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${Number(price).toLocaleString('en-GB')}`;
  };

  const renderCell = (it, key, hidden) => (
    <span className="pt-cell" key={key} aria-hidden={hidden || undefined}>
      <a href={COUNTRY_PATH[it.country] || '/our-homes/'} className="pt-link">
        <span className="pt-i">
          <b>{it.country}</b>
          <em>from {fmt(it.price, it.currency)}</em>
        </span>
      </a>
      <span className="pt-sep" aria-hidden="true">&#9670;</span>
    </span>
  );

  if (!items.length) return null;

  return (
    <div className="pt-wrap" aria-label="Co-ownership shares — entry prices by destination">
      <div className="pt-label">
        <span className="pt-dot" aria-hidden="true" />
        Shares from
      </div>
      <div className="pt-window">
        <div className="pt-track">
          {items.map((it, i) => renderCell(it, `a-${i}`, false))}
          {items.map((it, i) => renderCell(it, `b-${i}`, true))}
        </div>
      </div>

      <style jsx>{`
        .pt-wrap {
          display: flex;
          background: #1f3a4d;
          overflow: hidden;
          min-height: 47px;
        }
        .pt-label {
          flex: none;
          display: flex;
          align-items: center;
          gap: 9px;
          background: #162b39;
          color: #c8a455;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0 20px;
        }
        .pt-dot {
          width: 6px;
          height: 6px;
          background: #c8a455;
          border-radius: 50%;
        }
        .pt-window {
          flex: 1;
          overflow: hidden;
        }
        .pt-track {
          display: flex;
          width: max-content;
          animation: pt-roll 42s linear infinite;
        }
        .pt-wrap:hover .pt-track {
          animation-play-state: paused;
        }
        .pt-cell {
          display: inline-flex;
          align-items: center;
        }
        .pt-link {
          text-decoration: none;
        }
        .pt-i {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          white-space: nowrap;
          padding: 14px 0;
        }
        .pt-i b {
          color: #f4f0e6;
          font-weight: 400;
          font-size: 15px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: Georgia, 'Times New Roman', serif;
        }
        .pt-i em {
          color: #c8a455;
          font-style: normal;
          font-size: 12.5px;
        }
        .pt-link:hover .pt-i b {
          color: #ffffff;
        }
        .pt-sep {
          color: #c8a455;
          opacity: 0.5;
          padding: 0 24px;
          font-size: 11px;
        }
        @keyframes pt-roll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
