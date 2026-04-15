import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OurHomesPage() {
  return (
    <>
      <Head>
        <title>Co-Ownership Property</title>
        <meta name="description" content="Co-Ownership Property - Luxury fractional ownership of premium properties worldwide." />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main>


        {/* ===== NAVIGATION (shared partial) ===== */}

        {/* ===== PAGE HERO ===== */}
        <section className="page-hero">
            <span className="page-hero-eyebrow">Worldwide Collection</span>
            <h1>All Our Homes</h1>
            <p className="page-hero-sub">Handpicked luxury co-ownership properties across Europe, the USA and beyond — find the home that's right for you.</p>
        </section>

        {/* ===== FILTER BAR ===== */}
        <div className="filter-bar" id="filter-bar">
            {/* Country row — scrollable */}
            <div className="filter-row" id="country-row">
                <span className="filter-label">Country</span>
                <div className="filter-scroll-outer">
                    <div className="filter-scroll-wrap" id="country-scroll">
                        <button className="filter-btn active" data-country="">All</button>
                        {/* Populated by JS */}
                    </div>
                </div>
            </div>
            {/* Region row — scrollable, shown when a country is selected */}
            <div className="filter-row region-row" id="region-row">
                <span className="filter-label">Region</span>
                <div className="filter-scroll-outer">
                    <div className="filter-scroll-wrap" id="region-scroll">
                        {/* Populated by JS */}
                    </div>
                </div>
            </div>
            {/* Sort + Type row — scrollable */}
            <div className="filter-row" id="sort-row">
                <span className="filter-label">Sort</span>
                <div className="filter-scroll-outer">
                    <div className="filter-scroll-wrap">
                        <button className="filter-btn sort-btn active" data-sort="default">Default</button>
                        <button className="filter-btn sort-btn" data-sort="asc">Price ↑ Low</button>
                        <button className="filter-btn sort-btn" data-sort="desc">Price ↓ High</button>
                        <div className="filter-divider"></div>
                        <button className="clear-btn" id="clear-btn">✕ Clear</button>
                        <a href="#speak-to-expert" className="interested-btn">I'm Interested</a>
                    </div>
                </div>
            </div>
        </div>

        {/* ===== RESULTS BAR ===== */}
        <div className="results-bar">
            <p className="results-count" id="results-count"><strong></strong> properties found</p>
        </div>

        {/* ===== PROPERTY GRID ===== */}
        <div className="homes-grid-wrap">
            <div className="homes-grid" id="homes-grid">
                {/* Rendered by JS */}
            </div>
            <div className="no-results" id="no-results">No properties match your filters. <button className="clear-btn" onclick="clearAllFilters()" style={{display: 'inline-flex', marginLeft: '0.5rem'}}>Clear filters</button></div>
        </div>

        {/* ===== LOAD MORE ===== */}
        <div className="load-more-wrap">
            <button className="load-more-btn" id="load-more-btn" style={{display: 'none'}}>Show More Properties</button>
        </div>

        {/* ===== NEWSLETTER (shared partial) ===== */}

        {/* ===== EXPERT FORM (shared partial) ===== */}

        {/* ===== FOOTER ===== */}

        {/* ===== PROPERTY DATA + CLIENT-SIDE ENGINE ===== */}
        

      </main>
    </>
  );
}
