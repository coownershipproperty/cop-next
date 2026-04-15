import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';

// ─── Destination → property filter map ───────────────────────────────────────
const DEST_FILTERS = {
  // ── COUNTRIES ──────────────────────────────────────────────────
  "spain-fractional-ownership-properties":        { country: "Spain" },
  "france-fractional-ownership-properties":       { country: "France" },
  "italy-fractional-ownership-properties":        { country: "Italy" },
  "usa-fractional-ownership-properties":          { country: "USA" },
  "england-fractional-ownership-properties":      { country: "England" },
  "mexico-fractional-ownership-properties":       { country: "Mexico" },
  "austria-fractional-ownership-properties":      { country: "Austria" },
  "croatia-fractional-ownership-properties":      { country: "Croatia" },
  "germany-fractional-ownership-properties":      { country: "Germany" },
  "portugal-fractional-ownership-properties":     { country: "Portugal" },
  "sweden-fractional-ownership-properties":       { country: "Sweden" },

  // ── SPANISH ISLANDS ────────────────────────────────────────────
  "balearics-fractional-ownership-properties":    { country: "Spain", regions: ["Mallorca","Ibiza","Menorca","Formentera"] },
  "mallorca-fractional-ownership-properties":     { country: "Spain", region: "Mallorca" },
  "ibiza-fractional-ownership-properties":        { country: "Spain", region: "Ibiza" },
  "menorca-fractional-ownership-properties":      { country: "Spain", region: "Menorca" },
  "formentera-fractional-ownership":              { country: "Spain", region: "Formentera" },
  "alcudia-port-dalcudia-fractional-ownership-properties": { country: "Spain", city: "Alcudia" },
  "andratx-fractional-ownership-properties-co-ownership-property": { country: "Spain", city: "Andratx" },
  "pollenca-port-de-pollenca-fractional-ownership-properties": { country: "Spain", city: "Pollenca" },
  "santa-ponsa-fractional-ownership-properties":  { country: "Spain", city: "Santa Ponsa" },
  "santanyi-fractional-ownership-properties":     { country: "Spain", city: "Santanyi" },
  "canary-islands-fractional-ownership-properties": { country: "Spain", region: "Canary Islands" },

  // ── SPANISH COSTAS ─────────────────────────────────────────────
  "costa-del-sol-fractional-ownership-properties": { country: "Spain", region: "Costa del Sol" },
  "costa-blanca-fractional-ownership-properties":  { country: "Spain", region: "Costa Blanca" },
  "costa-de-la-luz-fractional-ownership-properties": { country: "Spain", region: "Costa de la Luz" },
  "costa-de-la-luz-fractional-property-for-sale":   { country: "Spain", region: "Costa de la Luz" },
  "spanish-costas-fractional-ownership-properties": { country: "Spain", regions: ["Costa del Sol","Costa Blanca","Costa de la Luz"] },
  "barcelona-fractional-ownership-for-sale":        { country: "Spain", city: "Barcelona" },
  "madrid-fractional-ownership-properties":         { country: "Spain", region: "Madrid" },
  "pyrenees-mountains-fractional-ownership-properties": { country: "Spain", region: "Pyrenees" },

  // ── FRANCE ─────────────────────────────────────────────────────
  "french-alps-fractional-ownership-properties":    { country: "France", region: "French Alps" },
  "south-of-france-fractional-ownership-properties": { country: "France", region: "South of France" },
  "paris-fractional-ownership-properties":           { country: "France", region: "Paris" },

  // ── ITALY ──────────────────────────────────────────────────────
  "sardinia-fractional-ownership-properties":       { country: "Italy", region: "Sardinia" },
  "lake-como-fractional-ownership-properties":      { country: "Italy", city: "Lake Como" },
  "italian-lakes-fractional-ownership-properties":  { country: "Italy" },
  "liguria-fractional-ownership-properties":        { country: "Italy", region: "Liguria" },

  // ── UK ─────────────────────────────────────────────────────────
  "london-fractional-ownership-properties":         { country: "England", region: "London" },

  // ── USA STATES ─────────────────────────────────────────────────
  "california-fractional-ownership-properties":     { country: "USA", region: "California" },
  "colorado-fractional-ownership-properties":       { country: "USA", region: "Colorado" },
  "florida-fractional-ownership-properties":        { country: "USA", region: "Florida" },
  "utah-fractional-ownership-properties":           { country: "USA", region: "Utah" },

  // ── USA CITIES ─────────────────────────────────────────────────
  "aspen-fractional-ownership":                     { country: "USA", city: "Aspen" },
  "breckenridge-fractional-ownership":              { country: "USA", city: "Breckenridge" },
  "vail-fractional-ownership":                      { country: "USA", city: "Vail" },
  "park-city-fractional-ownership-2":               { country: "USA", city: "Park City" },
  "miami-fractional-ownership":                     { country: "USA", cities: ["Miami","Miami Beach"] },
  "brickell-fractional-ownership-miami":            { country: "USA", cities: ["Miami","Miami Beach"] },
  "florida-keys-fractional-ownership":              { country: "USA", cities: ["Islamorada","Key Colony Beach"] },
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": { country: "USA", city: "Rosemary Beach" },
  "newport-beach-fractional-ownership":             { country: "USA", city: "Newport Beach" },
  "malibu-santa-barbara-fractional-ownership":      { country: "USA", cities: ["Malibu","Santa Barbara","Montecito"] },
  "palm-springs-fractional-ownership-desert-modern-luxury": { country: "USA", cities: ["Palm Springs","Palm Desert","Indian Wells","La Quinta"] },
  "napa-sonoma-fractional-ownership-wine-country-estates": { country: "USA", cities: ["Napa","Healdsburg","St. Helena","Calistoga"] },
  "lake-tahoe-fractional-ownership-properties":     { country: "USA", cities: ["Truckee","South Lake Tahoe","Olympic Valley","Incline Village","Homewood","Tahoma","Tahoe City"] },
};

function matchesFilter(prop, filter) {
  for (const [key, val] of Object.entries(filter)) {
    const propVal = (prop[key === 'cities' ? 'city' : key] || '').trim();
    if (!propVal) return false; // empty field never matches a filter
    if (key === 'regions') {
      if (!val.some(v => propVal.toLowerCase().includes(v.toLowerCase()))) return false;
    } else if (key === 'cities') {
      if (!val.some(v => propVal.toLowerCase() === v.toLowerCase() || propVal.toLowerCase().includes(v.toLowerCase()))) return false;
    } else {
      // Exact or contains match — but propVal must be non-empty (checked above)
      if (!propVal.toLowerCase().includes(val.toLowerCase())) return false;
    }
  }
  return true;
}

export async function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content', 'destinations');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
  const slugs = files.map(f => f.replace('.html', ''));
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const contentPath = path.join(process.cwd(), 'content', 'destinations', `${slug}.html`);
  const rawHtml = fs.readFileSync(contentPath, 'utf-8');

  // Extract title + meta
  const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : slug;
  const metaMatch = rawHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const metaDesc = metaMatch ? metaMatch[1] : '';

  // Extract unique body content (hero + SEO sections only)
  let bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : '';

  // Strip shared sections
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  body = body.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '');
  body = body.replace(/<section[^>]*class="newsletter-section"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<section[^>]*id="speak-to-expert"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
  // Remove the empty property grid section (we'll inject our own)
  body = body.replace(/<section[^>]*class="props-sec"[^>]*>[\s\S]*?<\/section>/g, '');
  // Remove mid-page CTA (we keep it but move it - actually keep it)

  // Filter properties for this destination
  const allProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8'));
  const filter = DEST_FILTERS[slug] || null;
  const matchedProps = filter ? allProps.filter(p => matchesFilter(p, filter)) : [];

  // Split body: hero section (before mid-cta) and rest (mid-cta onwards)
  const splitMarkers = ['class="dest-mid-cta"', 'class="dest-mid-cta ', 'id="dest-mid-cta"'];
  let splitIdx = -1;
  for (const marker of splitMarkers) {
    const idx = body.indexOf(marker);
    if (idx > 0) {
      // Find the opening < of this element
      splitIdx = body.lastIndexOf('<', idx);
      break;
    }
  }

  const heroHtml = splitIdx > 0 ? body.slice(0, splitIdx).trim() : body.trim();
  const restHtml = splitIdx > 0 ? body.slice(splitIdx).trim() : '';

  return {
    props: { slug, title, metaDesc, heroHtml, restHtml, properties: matchedProps },
  };
}

export default function DestinationPage({ slug, title, metaDesc, heroHtml, restHtml, properties }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      {/* Hero section (from staging) */}
      <div dangerouslySetInnerHTML={{ __html: heroHtml }} />

      {/* Property grid — same layout as Our Homes page */}
      <div className="homes-grid-wrap">
        {properties.length > 0 ? (
          <>
            <div className="results-bar">
              <p className="results-count">
                <strong>{properties.length}</strong> {properties.length === 1 ? 'property' : 'properties'} found
              </p>
            </div>
            <div className="homes-grid" id="homes-grid">
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </>
        ) : (
          <div className="no-props">
            <p>No properties currently listed for this destination. <a href="/our-homes/">Browse all properties</a> or <a href="/contact">contact us</a> for upcoming listings.</p>
          </div>
        )}
      </div>

      {/* Rest of page: CTA, SEO content, related locations */}
      <div dangerouslySetInnerHTML={{ __html: restHtml }} />

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
