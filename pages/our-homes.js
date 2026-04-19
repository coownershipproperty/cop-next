import Head from 'next/head';
import { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';

/** Fisher-Yates shuffle — runs once at build time for a stable random order */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: raw, error } = await supabase
    .from('properties')
    .select('slug, title, img, price, currency, country, region, city, beds, size, status, property_type');

  if (error) {
    console.error('Supabase error (our-homes):', error);
    return { props: { allProperties: [] }, revalidate: 60 };
  }

  const allProperties = shuffle((raw || []).map(p => ({
    slug:     p.slug,
    title:    p.title,
    img:      p.img,
    price:    p.price    || null,
    currency: p.currency || 'EUR',
    country:  p.country  || '',
    region:   p.region   || '',
    city:     p.city     || '',
    beds:     p.beds     || 0,
    size:     p.size     || 0,
    label:         '',
    status:        p.status        || '',
    property_type: p.property_type || '',
  })));

  return { props: { allProperties }, revalidate: 3600 };
}

// Fixed top-country order
const TOP_COUNTRIES = ['France', 'Spain', 'USA', 'Italy'];
const COUNTRY_FLAGS = {
  France: '🇫🇷', Spain: '🇪🇸', USA: '🇺🇸', Italy: '🇮🇹',
  Mexico: '🇲🇽', Germany: '🇩🇪', Austria: '🇦🇹', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Croatia: '🇭🇷', Portugal: '🇵🇹', Sweden: '🇸🇪',
};

// France: map raw region values → cluster label
const FRANCE_CLUSTERS = [
  { label: 'Paris',           regions: ['Paris'] },
  { label: 'South of France', regions: ["Côte d'Azur"] },
  { label: 'French Alps',     regions: ['French Alps', 'Portes du Soleil'] },
];

/** Return the France cluster label for a raw region string, or null */
function franceCluserLabel(region) {
  for (const c of FRANCE_CLUSTERS) {
    if (c.regions.includes(region)) return c.label;
  }
  return null;
}

export default function OurHomes({ allProperties }) {
  const [countries, setCountries] = useState([]); // [] = All; array of selected countries
  const [regions,   setRegions]   = useState([]); // [] = all; array of selected region labels
  const [sort,      setSort]      = useState('default');

  // ── Toggle a country in/out of selection ────────────────────────────────────
  function toggleCountry(c) {
    if (c === '') { setCountries([]); setRegions([]); return; } // "All" resets
    setCountries(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      return next;
    });
    setRegions([]); // reset regions whenever country selection changes
  }

  // ── Toggle a region in/out of selection ─────────────────────────────────────
  function toggleRegion(r) {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  // ── Region buttons: union across all selected countries ──────────────────────
  const regionButtons = useMemo(() => {
    if (countries.length === 0) return [];
    const all = [];
    for (const c of countries) {
      if (c === 'OTHER') {
        const seen = new Set();
        allProperties.filter(p => !TOP_COUNTRIES.includes(p.country) && p.country).forEach(p => seen.add(p.country));
        all.push(...[...seen].sort());
      } else if (c === 'France') {
        FRANCE_CLUSTERS
          .filter(cl => allProperties.some(p => p.country === 'France' && cl.regions.includes(p.region)))
          .sort((a, b) =>
            allProperties.filter(p => p.country === 'France' && b.regions.includes(p.region)).length -
            allProperties.filter(p => p.country === 'France' && a.regions.includes(p.region)).length
          )
          .forEach(cl => all.push(cl.label));
      } else {
        const seen = new Set();
        allProperties.filter(p => p.country === c && p.region).forEach(p => seen.add(p.region));
        all.push(...[...seen].sort((a, b) =>
          allProperties.filter(p => p.country === c && p.region === b).length -
          allProperties.filter(p => p.country === c && p.region === a).length
        ));
      }
    }
    return [...new Set(all)]; // deduplicate
  }, [allProperties, countries]);

  // Whether any selected country has un-clustered/regionless properties
  const hasOtherRegions = useMemo(() => {
    if (countries.length === 0) return false;
    return countries.some(c => {
      if (c === 'OTHER') return false;
      if (c === 'France') return allProperties.some(p => p.country === 'France' && !franceCluserLabel(p.region));
      return allProperties.some(p => p.country === c && !p.region);
    });
  }, [allProperties, countries]);

  const showRegionRow = countries.length > 0 && (regionButtons.length > 0 || hasOtherRegions);

  // ── Helper: does a property match a region label? ───────────────────────────
  function propMatchesRegion(p, label) {
    const cluster = FRANCE_CLUSTERS.find(cl => cl.label === label);
    if (cluster) return p.country === 'France' && cluster.regions.includes(p.region);
    if (label === 'OTHER') {
      if (p.country === 'France') return !franceCluserLabel(p.region);
      return !p.region;
    }
    // Could be a raw country name (OTHER mode) or a raw region name
    return p.region === label || p.country === label;
  }

  // ── Filtered + sorted property list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allProperties];

    // Country filter — match any selected country
    if (countries.length > 0) {
      list = list.filter(p =>
        countries.some(c => {
          if (c === 'OTHER') return !TOP_COUNTRIES.includes(p.country);
          return p.country === c;
        })
      );
    }

    // Region filter — match any selected region label
    if (regions.length > 0) {
      list = list.filter(p => regions.some(r => propMatchesRegion(p, r)));
    }

    // Sort
    if (sort === 'asc')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [allProperties, countries, regions, sort]);

  const hasActiveFilters = countries.length > 0 || sort !== 'default';

  function clearAll() {
    setCountries([]);
    setRegions([]);
    setSort('default');
  }

  return (
    <>
      <Head>
        <title>All Our Homes | Co-Ownership Property</title>
        <meta name="description" content="Browse all our luxury co-ownership properties worldwide. Filter by destination, region and price." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/our-homes/" />
        <meta property="og:title" content="Browse 333+ Luxury Co-Ownership Properties | Co-Ownership Property" />
        <meta property="og:description" content="Browse luxury fractional ownership properties across Spain, France, Italy, the USA and more. Filter by destination and price." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/our-homes/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* Hero */}
      <section className="page-hero">
        <span className="page-hero-eyebrow">Worldwide Collection</span>
        <h1>All Our Homes</h1>
        <p className="page-hero-sub">Handpicked luxury co-ownership properties across Europe, the USA and beyond — find the home that&apos;s right for you.</p>
      </section>

      {/* ── Filter bar ── */}
      <div className="filter-bar" id="filter-bar">

        {/* Row 1 — Country (multi-select) */}
        <div className="filter-row">
          <span className="filter-label">Country</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              <button
                className={`filter-btn${countries.length === 0 ? ' active' : ''}`}
                onClick={() => toggleCountry('')}
              >All</button>

              {TOP_COUNTRIES.map(c => (
                <button
                  key={c}
                  className={`filter-btn${countries.includes(c) ? ' active' : ''}`}
                  onClick={() => toggleCountry(c)}
                >
                  {COUNTRY_FLAGS[c]} {c}
                </button>
              ))}

              <button
                className={`filter-btn${countries.includes('OTHER') ? ' active' : ''}`}
                onClick={() => toggleCountry('OTHER')}
              >🌐 Other</button>
            </div>
          </div>
        </div>

        {/* Row 2 — Region (multi-select, shown when any country selected) */}
        {showRegionRow && (
          <div className="filter-row">
            <span className="filter-label">
              {countries.length === 1 && countries[0] === 'OTHER' ? 'Country' : 'Region'}
            </span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                {regionButtons.map(r => (
                  <button
                    key={r}
                    className={`filter-btn${regions.includes(r) ? ' active' : ''}`}
                    onClick={() => toggleRegion(r)}
                  >
                    {COUNTRY_FLAGS[r] ? `${COUNTRY_FLAGS[r]} ` : ''}{r}
                  </button>
                ))}
                {hasOtherRegions && (
                  <button
                    className={`filter-btn${regions.includes('OTHER') ? ' active' : ''}`}
                    onClick={() => toggleRegion('OTHER')}
                  >Other</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Row 3 — Sort + Clear + CTA */}
        <div className="filter-row">
          <span className="filter-label">Sort</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              {[['default','Default'],['asc','Price ↑ Low'],['desc','Price ↓ High']].map(([val, label]) => (
                <button
                  key={val}
                  className={`filter-btn sort-btn${sort === val ? ' active' : ''}`}
                  onClick={() => setSort(val)}
                >{label}</button>
              ))}
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearAll}>✕ Clear</button>
              )}
              {/* Desktop: CTA inline in sort row */}
              <a href="#speak-to-expert" className="interested-btn desktop-only-cta">I&apos;M INTERESTED</a>
            </div>
          </div>
        </div>

        {/* Mobile: CTA on its own centred row */}
        <div className="filter-cta-row">
          <a href="#speak-to-expert" className="interested-btn">I&apos;M INTERESTED</a>
        </div>

      </div>{/* end filter-bar */}

      {/* Cream section wrapper */}
      <div className="our-homes-section">

        {/* Results count */}
        <div className="results-bar">
          <p className="results-count">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>

        {/* Property grid */}
        <div className="homes-grid-wrap">
          {filtered.length > 0 ? (
            <div className="homes-grid" id="homes-grid">
              {filtered.map(p => <PropertyCard key={p.slug} property={p} />)}
            </div>
          ) : (
            <div className="no-results">
              <p>No properties match your filters.</p>
              <button className="clear-btn" onClick={clearAll}>Clear filters</button>
            </div>
          )}
        </div>

      </div>{/* end our-homes-section */}

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
