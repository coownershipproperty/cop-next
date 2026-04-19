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
  "canary-islands-fractional-ownership-properties": { country: "Spain", region: "Tenerife" },

  // ── SPANISH COSTAS ─────────────────────────────────────────────
  "costa-del-sol-fractional-ownership-properties": { country: "Spain", region: "Costa del Sol" },
  "costa-blanca-fractional-ownership-properties":  { country: "Spain", region: "Costa Blanca" },
  "costa-de-la-luz-fractional-ownership-properties": { country: "Spain", region: "Costa de la Luz" },
  "costa-de-la-luz-fractional-property-for-sale":   { country: "Spain", region: "Costa de la Luz" },
  "spanish-costas-fractional-ownership-properties": { country: "Spain", regions: ["Costa del Sol","Costa Blanca","Costa de la Luz"] },
  "barcelona-fractional-ownership-for-sale":        { country: "Spain", city: "Barcelona" },
  "madrid-fractional-ownership-properties":         { country: "Spain", region: "Madrid" },
  "pyrenees-mountains-fractional-ownership-properties": { country: "Spain", region: "Baqueira" },

  // ── FRANCE ─────────────────────────────────────────────────────
  "french-alps-fractional-ownership-properties":    { country: "France", regions: ["French Alps", "Portes du Soleil"] },
  "south-of-france-fractional-ownership-properties": { country: "France", region: "Côte d'Azur" },
  "paris-fractional-ownership-properties":           { country: "France", region: "Paris" },

  // ── ITALY ──────────────────────────────────────────────────────
  "sardinia-fractional-ownership-properties":       { country: "Italy", region: "Sardinia" },
  "lake-como-fractional-ownership-properties":      { country: "Italy", region: "Lake Como" },
  "italian-lakes-fractional-ownership-properties":  { country: "Italy", regions: ["Lake Garda", "Lake Como", "Lago Maggiore"] },
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

// ── Related destinations — clusters show parent+siblings, pillars show clusters ──
const RELATED = {
  // Spain — Balearics cluster
  "ibiza-fractional-ownership-properties":       ["mallorca-fractional-ownership-properties","menorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "mallorca-fractional-ownership-properties":    ["ibiza-fractional-ownership-properties","menorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "menorca-fractional-ownership-properties":     ["ibiza-fractional-ownership-properties","mallorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "balearics-fractional-ownership-properties":   ["ibiza-fractional-ownership-properties","mallorca-fractional-ownership-properties","menorca-fractional-ownership-properties","spain-fractional-ownership-properties"],
  // Spain — Costas cluster
  "costa-del-sol-fractional-ownership-properties":   ["costa-blanca-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "costa-blanca-fractional-ownership-properties":    ["costa-del-sol-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "costa-de-la-luz-fractional-ownership-properties": ["costa-del-sol-fractional-ownership-properties","costa-blanca-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "spanish-costas-fractional-ownership-properties":  ["costa-del-sol-fractional-ownership-properties","costa-blanca-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spain-fractional-ownership-properties"],
  // Spain — other
  "pyrenees-mountains-fractional-ownership-properties": ["french-alps-fractional-ownership-properties","spain-fractional-ownership-properties","france-fractional-ownership-properties"],
  "madrid-fractional-ownership-properties":      ["spain-fractional-ownership-properties","barcelona-fractional-ownership-for-sale","balearics-fractional-ownership-properties"],
  "barcelona-fractional-ownership-for-sale":     ["spain-fractional-ownership-properties","madrid-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties"],
  // Spain pillar — shows all its clusters
  "spain-fractional-ownership-properties":       ["balearics-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties","pyrenees-mountains-fractional-ownership-properties","madrid-fractional-ownership-properties","barcelona-fractional-ownership-for-sale"],
  // France
  "french-alps-fractional-ownership-properties":     ["south-of-france-fractional-ownership-properties","paris-fractional-ownership-properties","france-fractional-ownership-properties","pyrenees-mountains-fractional-ownership-properties"],
  "south-of-france-fractional-ownership-properties": ["french-alps-fractional-ownership-properties","paris-fractional-ownership-properties","france-fractional-ownership-properties"],
  "paris-fractional-ownership-properties":           ["french-alps-fractional-ownership-properties","south-of-france-fractional-ownership-properties","france-fractional-ownership-properties"],
  "france-fractional-ownership-properties":          ["french-alps-fractional-ownership-properties","south-of-france-fractional-ownership-properties","paris-fractional-ownership-properties"],
  // Italy
  "sardinia-fractional-ownership-properties":    ["italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "lake-como-fractional-ownership-properties":   ["italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italian-lakes-fractional-ownership-properties": ["lake-como-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "liguria-fractional-ownership-properties":     ["italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italy-fractional-ownership-properties":       ["sardinia-fractional-ownership-properties","italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties"],
  // UK
  "london-fractional-ownership-properties":      ["england-fractional-ownership-properties"],
  "england-fractional-ownership-properties":     ["london-fractional-ownership-properties"],
  // USA — states (pillars)
  "california-fractional-ownership-properties":  ["colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "colorado-fractional-ownership-properties":    ["california-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties","aspen-fractional-ownership","vail-fractional-ownership","breckenridge-fractional-ownership"],
  "florida-fractional-ownership-properties":     ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties","miami-fractional-ownership"],
  "utah-fractional-ownership-properties":        ["colorado-fractional-ownership-properties","california-fractional-ownership-properties","usa-fractional-ownership-properties","park-city-fractional-ownership-2"],
  "usa-fractional-ownership-properties":         ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties"],
  // USA — cities (clusters)
  "aspen-fractional-ownership":                  ["vail-fractional-ownership","breckenridge-fractional-ownership","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "vail-fractional-ownership":                   ["aspen-fractional-ownership","breckenridge-fractional-ownership","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "breckenridge-fractional-ownership":           ["aspen-fractional-ownership","vail-fractional-ownership","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "park-city-fractional-ownership-2":            ["utah-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "miami-fractional-ownership":                  ["florida-fractional-ownership-properties","newport-beach-fractional-ownership","usa-fractional-ownership-properties"],
  "newport-beach-fractional-ownership":          ["california-fractional-ownership-properties","malibu-santa-barbara-fractional-ownership","napa-sonoma-fractional-ownership-wine-country-estates","usa-fractional-ownership-properties"],
  "malibu-santa-barbara-fractional-ownership":   ["california-fractional-ownership-properties","newport-beach-fractional-ownership","usa-fractional-ownership-properties"],
  "napa-sonoma-fractional-ownership-wine-country-estates": ["california-fractional-ownership-properties","newport-beach-fractional-ownership","usa-fractional-ownership-properties"],
  "lake-tahoe-fractional-ownership-properties":  ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "palm-springs-fractional-ownership-desert-modern-luxury": ["california-fractional-ownership-properties","newport-beach-fractional-ownership","usa-fractional-ownership-properties"],

  "canary-islands-fractional-ownership-properties": ["spain-fractional-ownership-properties","balearics-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties"],
  // USA — Florida sub-destinations
  "florida-keys-fractional-ownership":           ["miami-fractional-ownership","florida-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "brickell-fractional-ownership-miami":         ["miami-fractional-ownership","florida-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": ["florida-fractional-ownership-properties","usa-fractional-ownership-properties","california-fractional-ownership-properties"],
  // Empty country pillars — show nearby countries + our homes
  "austria-fractional-ownership-properties":     ["french-alps-fractional-ownership-properties","italy-fractional-ownership-properties","france-fractional-ownership-properties"],
  "croatia-fractional-ownership-properties":     ["italy-fractional-ownership-properties","sardinia-fractional-ownership-properties","france-fractional-ownership-properties"],
  "germany-fractional-ownership-properties":     ["french-alps-fractional-ownership-properties","austria-fractional-ownership-properties","france-fractional-ownership-properties"],
  "portugal-fractional-ownership-properties":    ["spain-fractional-ownership-properties","balearics-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties"],
  "sweden-fractional-ownership-properties":      ["england-fractional-ownership-properties","france-fractional-ownership-properties","spain-fractional-ownership-properties"],
  // Mexico
  "mexico-fractional-ownership-properties":      ["usa-fractional-ownership-properties","spain-fractional-ownership-properties"],
};

// Slug → clean display label
function destLabel(slug) {
  return slug
    .replace(/-fractional-ownership-properties$/, '')
    .replace(/-fractional-ownership$/, '')
    .replace(/-fractional-property-for-sale$/, '')
    .replace(/-co-ownership-beach-homes$/, '')
    .replace(/-fractional-ownership-wine-country-estates$/, '')
    .replace(/-fractional-ownership-desert-modern-luxury$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^Park City.*/, 'Park City')
    .replace(/^30A.*/, '30A / Emerald Coast')
    .trim();
}

function matchesFilter(prop, filter) {
  for (const [key, val] of Object.entries(filter)) {
    // Map plural filter keys to singular property fields
    const propKey = key === 'cities' ? 'city' : key === 'regions' ? 'region' : key;
    const propVal = (prop[propKey] || '').trim();
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
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const contentPath = path.join(process.cwd(), 'content', 'destinations', `${slug}.html`);

  // If this slug has no destination content file, treat it as a blog post URL
  // and redirect — catches any old WordPress root-level blog post links
  if (!fs.existsSync(contentPath)) {
    return {
      redirect: { destination: `/blog/${slug}/`, permanent: true },
    };
  }
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

  let heroHtml = splitIdx > 0 ? body.slice(0, splitIdx).trim() : body.trim();
  let restHtml = splitIdx > 0 ? body.slice(splitIdx).trim() : '';

  // ── Clean up staging content ──────────────────────────────────
  // Remove 'Which country are you interested in?'
  restHtml = restHtml.replace(/<section[^>]*><div[^>]*><h3>Which country are you interested in\?<\/h3><\/div><\/section>/g, '');
  // Remove the entire staging 'Also Explore / Explore More' section — replaced by our own
  restHtml = restHtml.replace(/<section[^>]*class="[^"]*dest-explore[^"]*"[^>]*>[\s\S]*?<\/section>/g, '');
  // Shorten FAQ title
  restHtml = restHtml.replace(/<h2([^>]*)>[^<]*?—\s*Frequently Asked Questions<\/h2>/g, '<h2$1>Frequently Asked Questions</h2>');
  // Fix staging image URLs
  restHtml = restHtml.replace(/https:\/\/staging\.co-ownership-property\.com\//g, 'https://co-ownership-property.com/');
  // Fix newsletter CTA — "#contact" doesn't exist; point to the Newsletter section
  restHtml = restHtml.replace(/href="#contact"/g, 'href="#newsletter"');
  heroHtml = heroHtml.replace(/href="#contact"/g, 'href="#newsletter"');
  
  // Build related destinations list
  const related = (RELATED[slug] || []).map(s => ({ slug: s, label: destLabel(s) }));

  return {
    props: { slug, title, metaDesc, heroHtml, restHtml, properties: matchedProps, related },
  };
}

export default function DestinationPage({ slug, title, metaDesc, heroHtml, restHtml, properties, related }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={`https://co-ownership-property.com/${slug}/`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content={`https://co-ownership-property.com/${slug}/`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDesc} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://co-ownership-property.com/" },
            { "@type": "ListItem", "position": 2, "name": title, "item": `https://co-ownership-property.com/${slug}/` },
          ]
        }) }} />
      </Head>
      <Header />

      {/* Hero section (from staging) */}
      <div dangerouslySetInnerHTML={{ __html: heroHtml }} />

      {/* Property grid — full-width cream background */}
      <div className="dest-props-section">
      <div className="homes-grid-wrap">
        {properties.length > 0 ? (
          <div className="homes-grid" id="homes-grid">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="no-props">
            <p>No properties currently listed for this destination. <a href="/our-homes/">Browse all properties</a> or <a href="/contact">contact us</a> for upcoming listings.</p>
          </div>
        )}
      </div>
      </div>{/* end dest-props-section */}

      {/* Rest of page: CTA, SEO content, related locations */}
      <div dangerouslySetInnerHTML={{ __html: restHtml }} />

      {/* Also Explore — smart related destinations, no arrows */}
      {related && related.length > 0 && (
        <section className="dest-also-explore">
          <p className="dest-also-label">Also Explore</p>
          <div className="dest-also-links">
            {related.map(r => (
              <a key={r.slug} href={`/${r.slug}/`} className="dest-also-link">
                {r.label}
              </a>
            ))}
          </div>
        </section>
      )}

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
