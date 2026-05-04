import Head from 'next/head';
import { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import { track } from '@vercel/analytics';

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
    .select('slug, title, img, images, total_images, drive_url, price, currency, country, region, city, beds, size, status, property_type');

  if (error) {
    console.error('Supabase error (our-homes):', error);
    return { props: { allProperties: [] }, revalidate: 60 };
  }

  const allProperties = shuffle((raw || []).map(p => ({
    slug:     p.slug,
    title:    p.title,
    img:      p.img,
    images:      (p.images || []).slice(0, 3),
    totalImages: p.total_images || 0,
    driveUrl:    p.drive_url   || null,
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

const PAGE_SIZE = 24;

export default function OurHomes({ allProperties }) {
  const [countries,    setCountries]    = useState([]); // [] = All; array of selected countries
  const [regions,      setRegions]      = useState([]); // [] = all; array of selected region labels
  const [sort,         setSort]         = useState('default');
  const [page,         setPage]         = useState(1);
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertEmail,    setAlertEmail]    = useState('');
  const [alertName,     setAlertName]     = useState('');
  const [alertStatus,   setAlertStatus]   = useState('idle'); // idle | sending | done | error
  const [alertRegions,  setAlertRegions]  = useState([]);
  const [alertMaxPrice, setAlertMaxPrice] = useState('');

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

  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = visible.length < filtered.length;

  const hasActiveFilters = countries.length > 0 || sort !== 'default';

  function clearAll() {
    setCountries([]);
    setRegions([]);
    setSort('default');
    setPage(1);
  }

  function toggleCountryAndReset(c) {
    toggleCountry(c);
    setPage(1);
  }

  function toggleRegionAndReset(r) {
    toggleRegion(r);
    setPage(1);
  }

  function closeAlert() {
    setAlertOpen(false);
    setAlertStatus('idle');
    setAlertRegions([]);
    setAlertMaxPrice('');
    setAlertExpanded({});
  }

  function toggleAlertRegion(val) {
    setAlertRegions(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  async function submitAlert(e) {
    e.preventDefault();
    setAlertStatus('sending');
    try {
      const r = await fetch('/api/save-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    alertEmail,
          name:     alertName || null,
          regions:  alertRegions.length > 0 ? alertRegions : ['All'],
          maxPrice: alertMaxPrice || null,
        }),
      });
      if (r.ok) {
        track('property_alert_saved', {
          regions: alertRegions.length > 0 ? alertRegions.join(', ') : 'All',
          max_price: alertMaxPrice || 'unspecified',
        });
      }
      setAlertStatus(r.ok ? 'done' : 'error');
    } catch { setAlertStatus('error'); }
  }

  function setSortAndReset(s) {
    setSort(s);
    setPage(1);
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
                onClick={() => toggleCountryAndReset('')}
              >All</button>

              {TOP_COUNTRIES.map(c => (
                <button
                  key={c}
                  className={`filter-btn${countries.includes(c) ? ' active' : ''}`}
                  onClick={() => toggleCountryAndReset(c)}
                >
                  {COUNTRY_FLAGS[c]} {c}
                </button>
              ))}

              <button
                className={`filter-btn${countries.includes('OTHER') ? ' active' : ''}`}
                onClick={() => toggleCountryAndReset('OTHER')}
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
                    onClick={() => toggleRegionAndReset(r)}
                  >
                    {COUNTRY_FLAGS[r] ? `${COUNTRY_FLAGS[r]} ` : ''}{r}
                  </button>
                ))}
                {hasOtherRegions && (
                  <button
                    className={`filter-btn${regions.includes('OTHER') ? ' active' : ''}`}
                    onClick={() => toggleRegionAndReset('OTHER')}
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
                  onClick={() => setSortAndReset(val)}
                >{label}</button>
              ))}
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearAll}>✕ Clear</button>
              )}
              <button
                className="save-alert-btn desktop-only-cta"
                onClick={() => setAlertOpen(true)}
                title="Get emailed when new matching properties are listed"
              >Get property alerts</button>
            </div>
          </div>
        </div>

        {/* Mobile: CTAs on their own centred row */}
        <div className="filter-cta-row">
          <button className="save-alert-btn" onClick={() => setAlertOpen(true)}>Get property alerts</button>
        </div>

      </div>{/* end filter-bar */}

      {/* Cream section wrapper */}
      <div className="our-homes-section">

        {/* Results count */}
        <div className="results-bar">
          <p className="results-count">
            Showing <strong>{visible.length}</strong> of <strong>{filtered.length}</strong> {filtered.length === 1 ? 'property' : 'properties'}
          </p>
        </div>

        {/* Property grid */}
        <div className="homes-grid-wrap">
          {filtered.length > 0 ? (
            <>
              <div className="homes-grid" id="homes-grid">
                {visible.map(p => <PropertyCard key={p.slug} property={p} />)}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
                    Load more ({filtered.length - visible.length} remaining)
                  </button>
                </div>
              )}
            </>
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

      {/* ── Save Alert Modal ── */}
      {alertOpen && (
        <div className="ul-overlay" onClick={closeAlert}>
          <div className="ul-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <button className="ul-close" onClick={closeAlert}>×</button>
            {alertStatus === 'done' ? (
              <div className="ul-success">
                <div className="ul-tick">✓</div>
                <h3>Alert saved!</h3>
                <p>We&apos;ll email you at <strong>{alertEmail}</strong> as soon as a matching property is listed.</p>
              </div>
            ) : (
              <>
                <p className="ul-eye">Property Alerts</p>
                <h3>Be the first to know</h3>
                <p className="ul-sub">Tell us what you&apos;re looking for. The moment a new matching property is added to the site, you&apos;ll be the first to know.</p>

                <form onSubmit={submitAlert} className="ul-form">

                  {/* Destinations */}
                  <div className="alert-field-label">Destinations <span style={{color:'#9EAFBC',fontWeight:300}}>(optional)</span></div>
                  <div className="alert-dest-wrap">
                    {[
                      { country: 'Spain',           children: ['Mallorca','Ibiza','Menorca','Costa del Sol','Costa Blanca','Barcelona','Canary Islands'] },
                      { country: 'France',          children: ['South of France','French Alps','Paris'] },
                      { country: 'Italy',           children: ['Italian Lakes','Sardinia','Liguria'] },
                      { country: 'USA',             children: ['Colorado','Florida','California','Utah'] },
                      { country: 'United Kingdom',  children: ['London','England'] },
                      { country: 'Other',           children: ['Austria','Croatia','Germany','Mexico','Portugal','Sweden'] },
                    ].map(({ country, children }) => (
                      <div key={country} className="alert-dest-group">
                        {/* Country row — selectable */}
                        <label className="alert-check-row alert-check-country">
                          <input
                            type="checkbox"
                            className="alert-check-input"
                            checked={alertRegions.includes(country)}
                            onChange={() => toggleAlertRegion(country)}
                          />
                          <span className="alert-check-box" />
                          <span className="alert-check-label">{country}</span>
                        </label>
                        {/* Region rows — indented */}
                        {children.map(child => (
                          <label key={child} className="alert-check-row alert-check-region">
                            <input
                              type="checkbox"
                              className="alert-check-input"
                              checked={alertRegions.includes(child)}
                              onChange={() => toggleAlertRegion(child)}
                            />
                            <span className="alert-check-box" />
                            <span className="alert-check-label">{child}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Budget */}
                  <div className="alert-field">
                    <div className="alert-field-label">Max Budget <span style={{color:'#9EAFBC',fontWeight:300}}>(optional)</span></div>
                    <select value={alertMaxPrice} onChange={e => setAlertMaxPrice(e.target.value)} className="alert-select" style={{width:'100%'}}>
                      <option value="">Any budget</option>
                      <option value="100000">Under €100,000</option>
                      <option value="200000">Up to €200,000</option>
                      <option value="350000">Up to €350,000</option>
                      <option value="500000">Up to €500,000</option>
                      <option value="750000">Up to €750,000</option>
                      <option value="1000000">Up to €1,000,000</option>
                      <option value="9999999">€1,000,000+</option>
                    </select>
                  </div>

                  {/* Name + Email */}
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={alertName}
                    onChange={e => setAlertName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Your email address *"
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                    required
                  />

                  <button type="submit" disabled={alertStatus === 'sending'}>
                    {alertStatus === 'sending' ? 'Saving…' : 'Save Alert →'}
                  </button>
                  {alertStatus === 'error' && <p className="ul-err">Something went wrong. Please try again.</p>}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
