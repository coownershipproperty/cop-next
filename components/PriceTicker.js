import { useState, useEffect, useRef } from 'react';

// Rolling "buy from" price ticker for the homepage.
// Self-contained: fetches live entry prices per country from Supabase on mount.
// All styling is inline and the marquee uses the Web Animations API, so there
// is no dependency on global CSS or styled-jsx scoping.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';

// Anon key — safe in client code (read-only, RLS-guarded). Uses the project
// env var when present.
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo';

// Country -> its dedicated destination page. Covers every country that
// currently has listings; any future country without a page falls back to
// /our-homes/ via the lookup in cell().
const COUNTRY_PATH = {
  USA:      '/usa-fractional-ownership-properties/',
  Spain:    '/spain-fractional-ownership-properties/',
  Italy:    '/italy-fractional-ownership-properties/',
  France:   '/france-fractional-ownership-properties/',
  Mexico:   '/mexico-fractional-ownership-properties/',
  Germany:  '/germany-fractional-ownership-properties/',
  Austria:  '/austria-fractional-ownership-properties/',
  England:  '/england-fractional-ownership-properties/',
  Portugal: '/portugal-fractional-ownership-properties/',
  Croatia:  '/croatia-fractional-ownership-properties/',
  Sweden:   '/sweden-fractional-ownership-properties/',
};

const MIN_LISTINGS = 3; // a country appears once it has at least this many homes

export default function PriceTicker() {
  const [items, setItems] = useState([]);
  const trackRef = useRef(null);
  const animRef = useRef(null);

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
          if (!agg[c]) agg[c] = { country: c, count: 0, price: row.price, currency: row.currency };
          agg[c].count += 1;
        }
        setItems(
          Object.values(agg)
            .filter((d) => d.count >= MIN_LISTINGS)
            .sort((a, b) => Number(a.price) - Number(b.price))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!items.length || !trackRef.current || !trackRef.current.animate) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const anim = trackRef.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 42000, iterations: Infinity, easing: 'linear' }
    );
    animRef.current = anim;
    return () => {
      try { anim.cancel(); } catch (e) { /* noop */ }
    };
  }, [items]);

  if (!items.length) return null;

  const fmt = (price, currency) =>
    `${currency === 'USD' ? '$' : '€'}${Number(price).toLocaleString('en-GB')}`;

  const cell = (it, key, hidden) => (
    <a
      key={key}
      href={COUNTRY_PATH[it.country] || '/our-homes/'}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '10px', padding: '14px 0' }}>
        <span style={{ color: '#f4f0e6', fontSize: '15px', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {it.country}
        </span>
        <span style={{ color: '#c8a455', fontSize: '12.5px' }}>from {fmt(it.price, it.currency)}</span>
      </span>
      <span style={{ color: '#c8a455', opacity: 0.5, padding: '0 24px', fontSize: '11px' }}>&#9670;</span>
    </a>
  );

  return (
    <div
      onMouseEnter={() => { if (animRef.current) animRef.current.pause(); }}
      onMouseLeave={() => { if (animRef.current) animRef.current.play(); }}
      style={{ display: 'flex', background: '#1f3a4d', overflow: 'hidden' }}
      aria-label="Co-ownership homes — entry prices by destination"
    >
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '9px', background: '#162b39', color: '#c8a455', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0 20px' }}>
        <span style={{ width: '6px', height: '6px', background: '#c8a455', borderRadius: '50%' }} />
        Buy from
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div ref={trackRef} style={{ display: 'flex', width: 'max-content' }}>
          {items.map((it, i) => cell(it, `a-${i}`, false))}
          {items.map((it, i) => cell(it, `b-${i}`, true))}
        </div>
      </div>
    </div>
  );
}
