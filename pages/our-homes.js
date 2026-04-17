import Head from 'next/head';
import { useState, useMemo } from 'react';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';

export async function getStaticProps() {
  const data = fs.readFileSync(
    path.join(process.cwd(), 'lib', 'properties.json'),
    'utf-8'
  );
  return { props: { allProperties: JSON.parse(data) } };
}

// Fixed top-country order (everything else → "Other")
const TOP_COUNTRIES = ['France', 'Spain', 'USA', 'Italy'];
const COUNTRY_FLAGS  = {
  France: '🇫🇷', Spain: '🇪🇸', USA: '🇺🇸', Italy: '🇮🇹',
};

// Regions with fewer than this many properties get rolled into "Other"
const REGION_MIN = 2;

export default function OurHomes({ allProperties }) {
  const [country, setCountry] = useState('');   // '' = All, 'OTHER' = Other countries
  const [region,  setRegion]  = useState('');   // '' = all regions, 'OTHER' = grouped rest
  const [sort,    setSort]    = useState('default');

  // Derived region list for the selected country (only for the 4 top countries)
  const regionData = useMemo(() => {
    if (!country || country === 'OTHER') return { main: [], otherNames: [] };
    const counts = {};
    allProperties
      .filter(p => p.country === country && p.region)
      .forEach(p => { counts[p.region] = (counts[p.region] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const main       = sorted.filter(([, c]) => c >= REGION_MIN).map(([r]) => r);
    const otherNames = sorted.filter(([, c]) => c <  REGION_MIN).map(([r]) => r);
    return { main, otherNames };
  }, [allProperties, country]);

  const showRegionRow    = regionData.main.length > 0;
  const hasOtherRegions  = regionData.otherNames.length > 0;

  // Filtered + sorted property list
  const filtered = useMemo(() => {
    let list = [...allProperties];

    // Country filter
    if (country === 'OTHER') {
      list = list.filter(p => !TOP_COUNTRIES.includes(p.country));
    } else if (country) {
      list = list.filter(p => p.country === country);
    }

    // Region filter (only relevant when a specific top country is active)
    if (region === 'OTHER') {
      list = list.filter(p => regionData.otherNames.includes(p.region));
    } else if (region) {
      list = list.filter(p => p.region === region);
    }

    // Sort
    if (sort === 'asc')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [allProperties, country, region, sort, regionData]);

  const hasActiveFilters = country || sort !== 'default';

  function handleCountry(c) {
    setCountry(c);
    setRegion('');   // always reset region when switching country
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

        {/* Row 2 — Region (only when a top country is selected and has regions) */}
        {showRegionRow && (
          <div className="filter-row">
            <span className="filter-label">Region</span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                {regionData.main.map(r => (
                  <button
                    key={r}
                    className={`filter-btn${region === r ? ' active' : ''}`}
                    onClick={() => setRegion(region === r ? '' : r)}
                  >{r}</button>
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
            </div>
          </div>
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
