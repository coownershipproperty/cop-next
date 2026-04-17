import Head from 'next/head';
import { useState, useMemo } from 'react';
import fs from 'fs';
import path from 'path';
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
  const data = fs.readFileSync(
    path.join(process.cwd(), 'lib', 'properties.json'),
    'utf-8'
  );
  return { props: { allProperties: shuffle(JSON.parse(data)) } };
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
  const [country, setCountry] = useState('');   // '' = All, 'OTHER' = other countries
  const [region,  setRegion]  = useState('');   // '' = all, 'OTHER' = grouped rest
  const [sort,    setSort]    = useState('default');

  // ── Region/sub-filter buttons for the selected country ─────────────────────
  const regionButtons = useMemo(() => {
    // "Other" country → show individual country names as sub-filter buttons
    if (country === 'OTHER') {
      const seen = new Set();
      allProperties
        .filter(p => !TOP_COUNTRIES.includes(p.country) && p.country)
        .forEach(p => seen.add(p.country));
      return [...seen].sort();  // alphabetical; no "Other" button needed (all are shown)
    }

    if (!country) return [];

    if (country === 'France') {
      // Return cluster labels sorted by property count desc
      return FRANCE_CLUSTERS
        .filter(c => allProperties.some(
          p => p.country === 'France' && c.regions.includes(p.region)
        ))
        .sort((a, b) =>
          allProperties.filter(p => p.country === 'France' && b.regions.includes(p.region)).length -
          allProperties.filter(p => p.country === 'France' && a.regions.includes(p.region)).length
        )
        .map(c => c.label);
    }

    // USA, Spain, Italy — return all distinct region values, sorted by count desc
    const seen = new Set();
    allProperties
      .filter(p => p.country === country && p.region)
      .forEach(p => seen.add(p.region));
    return [...seen].sort((a, b) =>
      allProperties.filter(p => p.country === country && p.region === b).length -
      allProperties.filter(p => p.country === country && p.region === a).length
    );
  }, [allProperties, country]);

  // Whether to show an "Other" sub-filter button (properties in country that don't fit any shown region/cluster)
  const hasOtherRegions = useMemo(() => {
    if (!country || country === 'OTHER') return false;
    if (country === 'France') {
      return allProperties.some(p => p.country === 'France' && !franceCluserLabel(p.region));
    }
    // For USA/Spain/Italy: "Other" = properties with no region set
    return allProperties.some(p => p.country === country && !p.region);
  }, [allProperties, country]);

  const showRegionRow = country !== '' && (regionButtons.length > 0 || hasOtherRegions);

  // ── Filtered + sorted property list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allProperties];

    // Country filter
    if (country === 'OTHER') {
      if (region) {
        // region holds an actual country name when in "OTHER" mode
        list = list.filter(p => p.country === region);
      } else {
        list = list.filter(p => !TOP_COUNTRIES.includes(p.country));
      }
    } else if (country) {
      list = list.filter(p => p.country === country);

      // Region sub-filter
      if (region === 'OTHER') {
        if (country === 'France') {
          list = list.filter(p => !franceCluserLabel(p.region));
        } else {
          list = list.filter(p => !p.region);
        }
      } else if (region) {
        if (country === 'France') {
          const cluster = FRANCE_CLUSTERS.find(c => c.label === region);
          if (cluster) list = list.filter(p => cluster.regions.includes(p.region));
        } else {
          list = list.filter(p => p.region === region);
        }
      }
    }

    // Sort
    if (sort === 'asc')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [allProperties, country, region, sort]);

  const hasActiveFilters = country || sort !== 'default';

  function handleCountry(c) {
    setCountry(c);
    setRegion('');
  }

  function clearAll() {
    setCountry('');
    setRegion('');
    setSort('default');
  }

  return (
    <>
      <Head>
        <title>All Our Homes | Co-Ownership Property</title>
        <meta name="description" content="Browse all our luxury co-ownership properties worldwide. Filter by destination, region and price." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Browse 333+ Luxury Co-Ownership Properties | Co-Ownership Property" />
        <meta property="og:description" content="Browse luxury fractional ownership properties across Spain, France, Italy, the USA and more. Filter by destination and price." />
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

        {/* Row 1 — Country */}
        <div className="filter-row">
          <span className="filter-label">Country</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              <button
                className={`filter-btn${country === '' ? ' active' : ''}`}
                onClick={() => handleCountry('')}
              >All</button>

              {TOP_COUNTRIES.map(c => (
                <button
                  key={c}
                  className={`filter-btn${country === c ? ' active' : ''}`}
                  onClick={() => handleCountry(c)}
                >
                  {COUNTRY_FLAGS[c]} {c}
                </button>
              ))}

              <button
                className={`filter-btn${country === 'OTHER' ? ' active' : ''}`}
                onClick={() => handleCountry('OTHER')}
              >🌐 Other</button>
            </div>
          </div>
        </div>

        {/* Row 2 — Region / sub-country (shown whenever a country is selected) */}
        {showRegionRow && (
          <div className="filter-row">
            <span className="filter-label">
              {country === 'OTHER' ? 'Country' : 'Region'}
            </span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                {regionButtons.map(r => (
                  <button
                    key={r}
                    className={`filter-btn${region === r ? ' active' : ''}`}
                    onClick={() => setRegion(region === r ? '' : r)}
                  >
                    {COUNTRY_FLAGS[r] ? `${COUNTRY_FLAGS[r]} ` : ''}{r}
                  </button>
                ))}
                {hasOtherRegions && (
                  <button
                    className={`filter-btn${region === 'OTHER' ? ' active' : ''}`}
                    onClick={() => setRegion(region === 'OTHER' ? '' : 'OTHER')}
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
              <a href="#speak-to-expert" className="interested-btn">I&apos;M INTERESTED</a>
            </div>
          </div>
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
