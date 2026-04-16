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

const COUNTRY_FLAGS = {
  Spain: '🇪🇸', France: '🇫🇷', Italy: '🇮🇹',
  USA: '🇺🇸', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Mexico: '🇲🇽',
  Austria: '🇦🇹', Germany: '🇩🇪', Croatia: '🇭🇷',
  Portugal: '🇵🇹', Sweden: '🇸🇪',
};

export default function OurHomes({ allProperties }) {
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('default');

  // Unique countries for filter buttons
  const countries = useMemo(() => {
    const counts = {};
    allProperties.forEach(p => {
      counts[p.country] = (counts[p.country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, [allProperties]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = country
      ? allProperties.filter(p => p.country === country)
      : [...allProperties];

    if (sort === 'asc')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [allProperties, country, sort]);

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

      {/* Filter bar */}
      <div className="filter-bar" id="filter-bar">
        <div className="filter-row">
          <span className="filter-label">Country</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              <button
                className={`filter-btn${country === '' ? ' active' : ''}`}
                onClick={() => setCountry('')}
              >All</button>
              {countries.map(c => (
                <button
                  key={c}
                  className={`filter-btn${country === c ? ' active' : ''}`}
                  onClick={() => setCountry(c)}
                >
                  {COUNTRY_FLAGS[c] || ''} {c}
                </button>
              ))}
            </div>
          </div>
        </div>

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
              {(country || sort !== 'default') && (
                <button
                  className="clear-btn"
                  onClick={() => { setCountry(''); setSort('default'); }}
                >✕ Clear</button>
              )}
              <a href="#speak-to-expert" className="interested-btn">I&apos;m Interested</a>
            </div>
          </div>
        </div>
      </div>

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
            <button className="clear-btn" onClick={() => { setCountry(''); setSort('default'); }}>
              Clear filters
            </button>
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
