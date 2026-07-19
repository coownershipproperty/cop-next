import { useState, useMemo } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import { createClient } from '@supabase/supabase-js';

// ─── Destination → property filter map (mirror of English /[slug].js) ────────
const DEST_FILTERS = {
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
  "balearics-fractional-ownership-properties":    { country: "Spain", regions: ["Mallorca","Ibiza","Menorca","Formentera"] },
  "mallorca-fractional-ownership-properties":     { country: "Spain", region: "Mallorca" },
  "ibiza-fractional-ownership-properties":        { country: "Spain", region: "Ibiza" },
  "menorca-fractional-ownership-properties":      { country: "Spain", region: "Menorca" },
  "canary-islands-fractional-ownership-properties": { country: "Spain", region: "Tenerife" },
  "costa-del-sol-fractional-ownership-properties": { country: "Spain", region: "Costa del Sol" },
  "costa-blanca-fractional-ownership-properties":  { country: "Spain", region: "Costa Blanca" },
  "costa-de-la-luz-fractional-ownership-properties": { country: "Spain", region: "Costa de la Luz" },
  "spanish-costas-fractional-ownership-properties": { country: "Spain", regions: ["Costa del Sol","Costa Blanca","Costa de la Luz"] },
  "barcelona-fractional-ownership-for-sale":        { country: "Spain", city: "Barcelona" },
  "madrid-fractional-ownership-properties":         { country: "Spain", region: "Madrid" },
  "pyrenees-mountains-fractional-ownership-properties": { country: "Spain", region: "Baqueira" },
  "french-alps-fractional-ownership-properties":    { country: "France", regions: ["French Alps", "Portes du Soleil"] },
  "south-of-france-fractional-ownership-properties": { country: "France", region: "Côte d'Azur" },
  "paris-fractional-ownership-properties":           { country: "France", region: "Paris" },
  "sardinia-fractional-ownership-properties":       { country: "Italy", region: "Sardinia" },
  "lake-como-fractional-ownership-properties":      { country: "Italy", region: "Lake Como" },
  "italian-lakes-fractional-ownership-properties":  { country: "Italy", regions: ["Lake Garda", "Lake Como", "Lago Maggiore"] },
  "liguria-fractional-ownership-properties":        { country: "Italy", region: "Liguria" },
  "london-fractional-ownership-properties":         { country: "England", region: "London" },
  "california-fractional-ownership-properties":     { country: "USA", region: "California" },
  "colorado-fractional-ownership-properties":       { country: "USA", region: "Colorado" },
  "florida-fractional-ownership-properties":        { country: "USA", region: "Florida" },
  "utah-fractional-ownership-properties":           { country: "USA", region: "Utah" },
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

// ── Breadcrumb hierarchy (mirror of English) ─────────────────────────────────
const PARENT = {
  "french-alps-fractional-ownership-properties":      "france-fractional-ownership-properties",
  "south-of-france-fractional-ownership-properties":  "france-fractional-ownership-properties",
  "paris-fractional-ownership-properties":             "france-fractional-ownership-properties",
  "balearics-fractional-ownership-properties":         "spain-fractional-ownership-properties",
  "mallorca-fractional-ownership-properties":          "spain-fractional-ownership-properties",
  "ibiza-fractional-ownership-properties":             "spain-fractional-ownership-properties",
  "menorca-fractional-ownership-properties":           "spain-fractional-ownership-properties",
  "canary-islands-fractional-ownership-properties":    "spain-fractional-ownership-properties",
  "costa-del-sol-fractional-ownership-properties":     "spain-fractional-ownership-properties",
  "costa-blanca-fractional-ownership-properties":      "spain-fractional-ownership-properties",
  "costa-de-la-luz-fractional-ownership-properties":   "spain-fractional-ownership-properties",
  "spanish-costas-fractional-ownership-properties":    "spain-fractional-ownership-properties",
  "barcelona-fractional-ownership-for-sale":           "spain-fractional-ownership-properties",
  "madrid-fractional-ownership-properties":            "spain-fractional-ownership-properties",
  "pyrenees-mountains-fractional-ownership-properties":"spain-fractional-ownership-properties",
  "sardinia-fractional-ownership-properties":          "italy-fractional-ownership-properties",
  "lake-como-fractional-ownership-properties":         "italy-fractional-ownership-properties",
  "italian-lakes-fractional-ownership-properties":     "italy-fractional-ownership-properties",
  "liguria-fractional-ownership-properties":           "italy-fractional-ownership-properties",
  "london-fractional-ownership-properties":            "england-fractional-ownership-properties",
  "california-fractional-ownership-properties":        "usa-fractional-ownership-properties",
  "colorado-fractional-ownership-properties":          "usa-fractional-ownership-properties",
  "florida-fractional-ownership-properties":           "usa-fractional-ownership-properties",
  "utah-fractional-ownership-properties":              "usa-fractional-ownership-properties",
  "aspen-fractional-ownership":                        "colorado-fractional-ownership-properties",
  "vail-fractional-ownership":                         "colorado-fractional-ownership-properties",
  "breckenridge-fractional-ownership":                 "colorado-fractional-ownership-properties",
  "park-city-fractional-ownership-2":                  "utah-fractional-ownership-properties",
  "miami-fractional-ownership":                        "florida-fractional-ownership-properties",
  "brickell-fractional-ownership-miami":               "florida-fractional-ownership-properties",
  "florida-keys-fractional-ownership":                 "florida-fractional-ownership-properties",
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": "florida-fractional-ownership-properties",
  "newport-beach-fractional-ownership":                "california-fractional-ownership-properties",
  "malibu-santa-barbara-fractional-ownership":         "california-fractional-ownership-properties",
  "napa-sonoma-fractional-ownership-wine-country-estates": "california-fractional-ownership-properties",
  "lake-tahoe-fractional-ownership-properties":        "california-fractional-ownership-properties",
  "palm-springs-fractional-ownership-desert-modern-luxury": "california-fractional-ownership-properties",
};

// ── Related destinations (same map as English) ───────────────────────────────
const RELATED = {
  "ibiza-fractional-ownership-properties":       ["mallorca-fractional-ownership-properties","menorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "mallorca-fractional-ownership-properties":    ["ibiza-fractional-ownership-properties","menorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "menorca-fractional-ownership-properties":     ["ibiza-fractional-ownership-properties","mallorca-fractional-ownership-properties","balearics-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "balearics-fractional-ownership-properties":   ["ibiza-fractional-ownership-properties","mallorca-fractional-ownership-properties","menorca-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "costa-del-sol-fractional-ownership-properties":   ["costa-blanca-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "costa-blanca-fractional-ownership-properties":    ["costa-del-sol-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "costa-de-la-luz-fractional-ownership-properties": ["costa-del-sol-fractional-ownership-properties","costa-blanca-fractional-ownership-properties","spanish-costas-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "spanish-costas-fractional-ownership-properties":  ["costa-del-sol-fractional-ownership-properties","costa-blanca-fractional-ownership-properties","costa-de-la-luz-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "pyrenees-mountains-fractional-ownership-properties": ["french-alps-fractional-ownership-properties","spain-fractional-ownership-properties","france-fractional-ownership-properties"],
  "madrid-fractional-ownership-properties":      ["spain-fractional-ownership-properties","barcelona-fractional-ownership-for-sale","balearics-fractional-ownership-properties"],
  "barcelona-fractional-ownership-for-sale":     ["spain-fractional-ownership-properties","madrid-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties"],
  "spain-fractional-ownership-properties":       ["balearics-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties","pyrenees-mountains-fractional-ownership-properties","madrid-fractional-ownership-properties","barcelona-fractional-ownership-for-sale"],
  "french-alps-fractional-ownership-properties":     ["south-of-france-fractional-ownership-properties","paris-fractional-ownership-properties","france-fractional-ownership-properties","pyrenees-mountains-fractional-ownership-properties"],
  "south-of-france-fractional-ownership-properties": ["french-alps-fractional-ownership-properties","paris-fractional-ownership-properties","france-fractional-ownership-properties"],
  "paris-fractional-ownership-properties":           ["french-alps-fractional-ownership-properties","south-of-france-fractional-ownership-properties","france-fractional-ownership-properties"],
  "france-fractional-ownership-properties":          ["french-alps-fractional-ownership-properties","south-of-france-fractional-ownership-properties","paris-fractional-ownership-properties"],
  "sardinia-fractional-ownership-properties":    ["italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "lake-como-fractional-ownership-properties":   ["italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italian-lakes-fractional-ownership-properties": ["lake-como-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "liguria-fractional-ownership-properties":     ["italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italy-fractional-ownership-properties":       ["sardinia-fractional-ownership-properties","italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties"],
  "london-fractional-ownership-properties":      ["england-fractional-ownership-properties"],
  "england-fractional-ownership-properties":     ["london-fractional-ownership-properties"],
  "california-fractional-ownership-properties":  ["colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "colorado-fractional-ownership-properties":    ["california-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties","aspen-fractional-ownership","vail-fractional-ownership","breckenridge-fractional-ownership"],
  "florida-fractional-ownership-properties":     ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties","miami-fractional-ownership"],
  "utah-fractional-ownership-properties":        ["colorado-fractional-ownership-properties","california-fractional-ownership-properties","usa-fractional-ownership-properties","park-city-fractional-ownership-2"],
  "usa-fractional-ownership-properties":         ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties"],
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
  "florida-keys-fractional-ownership":           ["miami-fractional-ownership","florida-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "brickell-fractional-ownership-miami":         ["miami-fractional-ownership","florida-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": ["florida-fractional-ownership-properties","usa-fractional-ownership-properties","california-fractional-ownership-properties"],
  "austria-fractional-ownership-properties":     ["french-alps-fractional-ownership-properties","italy-fractional-ownership-properties","france-fractional-ownership-properties"],
  "croatia-fractional-ownership-properties":     ["italy-fractional-ownership-properties","sardinia-fractional-ownership-properties","france-fractional-ownership-properties"],
  "germany-fractional-ownership-properties":     ["french-alps-fractional-ownership-properties","austria-fractional-ownership-properties","france-fractional-ownership-properties"],
  "portugal-fractional-ownership-properties":    ["spain-fractional-ownership-properties","balearics-fractional-ownership-properties","costa-del-sol-fractional-ownership-properties"],
  "sweden-fractional-ownership-properties":      ["england-fractional-ownership-properties","france-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "mexico-fractional-ownership-properties":      ["usa-fractional-ownership-properties","spain-fractional-ownership-properties"],
};

// ── Spanish destination labels (for related-destinations link text) ──────────
const ES_LABELS = {
  "spain-fractional-ownership-properties": "España — copropiedad",
  "france-fractional-ownership-properties": "Francia — copropiedad",
  "italy-fractional-ownership-properties": "Italia — copropiedad",
  "usa-fractional-ownership-properties": "Estados Unidos — copropiedad",
  "england-fractional-ownership-properties": "Inglaterra — copropiedad",
  "portugal-fractional-ownership-properties": "Portugal — copropiedad",
  "austria-fractional-ownership-properties": "Austria — copropiedad",
  "croatia-fractional-ownership-properties": "Croacia — copropiedad",
  "germany-fractional-ownership-properties": "Alemania — copropiedad",
  "sweden-fractional-ownership-properties": "Suecia — copropiedad",
  "mexico-fractional-ownership-properties": "México — copropiedad",
  "balearics-fractional-ownership-properties": "Baleares — copropiedad",
  "mallorca-fractional-ownership-properties": "Mallorca — copropiedad",
  "ibiza-fractional-ownership-properties": "Ibiza — copropiedad",
  "menorca-fractional-ownership-properties": "Menorca — copropiedad",
  "canary-islands-fractional-ownership-properties": "Islas Canarias — copropiedad",
  "costa-del-sol-fractional-ownership-properties": "Costa del Sol — copropiedad",
  "costa-blanca-fractional-ownership-properties": "Costa Blanca — copropiedad",
  "costa-de-la-luz-fractional-ownership-properties": "Costa de la Luz — copropiedad",
  "spanish-costas-fractional-ownership-properties": "Costas españolas — copropiedad",
  "barcelona-fractional-ownership-for-sale": "Barcelona — copropiedad",
  "madrid-fractional-ownership-properties": "Madrid — copropiedad",
  "pyrenees-mountains-fractional-ownership-properties": "Pirineos — copropiedad",
  "french-alps-fractional-ownership-properties": "Alpes franceses — copropiedad",
  "south-of-france-fractional-ownership-properties": "Sur de Francia — copropiedad",
  "paris-fractional-ownership-properties": "París — copropiedad",
  "sardinia-fractional-ownership-properties": "Cerdeña — copropiedad",
  "lake-como-fractional-ownership-properties": "Lago de Como — copropiedad",
  "italian-lakes-fractional-ownership-properties": "Lagos italianos — copropiedad",
  "liguria-fractional-ownership-properties": "Liguria — copropiedad",
  "london-fractional-ownership-properties": "Londres — copropiedad",
  "california-fractional-ownership-properties": "California — copropiedad",
  "colorado-fractional-ownership-properties": "Colorado — copropiedad",
  "florida-fractional-ownership-properties": "Florida — copropiedad",
  "utah-fractional-ownership-properties": "Utah — copropiedad",
  "aspen-fractional-ownership": "Aspen — copropiedad",
  "vail-fractional-ownership": "Vail — copropiedad",
  "breckenridge-fractional-ownership": "Breckenridge — copropiedad",
  "park-city-fractional-ownership-2": "Park City — copropiedad",
  "miami-fractional-ownership": "Miami — copropiedad",
  "brickell-fractional-ownership-miami": "Brickell, Miami — copropiedad",
  "florida-keys-fractional-ownership": "Florida Keys — copropiedad",
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": "30A / Emerald Coast — copropiedad",
  "newport-beach-fractional-ownership": "Newport Beach — copropiedad",
  "malibu-santa-barbara-fractional-ownership": "Malibu / Santa Barbara — copropiedad",
  "palm-springs-fractional-ownership-desert-modern-luxury": "Palm Springs — copropiedad",
  "napa-sonoma-fractional-ownership-wine-country-estates": "Napa y Sonoma — copropiedad",
  "lake-tahoe-fractional-ownership-properties": "Lago Tahoe — copropiedad",
};

function destLabel(slug) {
  return ES_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── France cluster mapping (kept for region filter) ──────────────────────────
const FRANCE_CLUSTERS = [
  { label: 'París',                regions: ['Paris'] },
  { label: 'Sur de Francia',       regions: ["Côte d'Azur"] },
  { label: 'Alpes franceses',      regions: ['French Alps', 'Portes du Soleil'] },
];

function getRegionLabel(p) {
  if (p.country === 'France' && p.region) {
    for (const c of FRANCE_CLUSTERS) {
      if (c.regions.includes(p.region)) return c.label;
    }
  }
  return p.region || p.city || null;
}

function matchesFilter(prop, filter) {
  for (const [key, val] of Object.entries(filter)) {
    const propKey = key === 'cities' ? 'city' : key === 'regions' ? 'region' : key;
    const propVal = (prop[propKey] || '').trim();
    if (!propVal) return false;
    if (key === 'regions') {
      if (!val.some(v => propVal.toLowerCase().includes(v.toLowerCase()))) return false;
    } else if (key === 'cities') {
      if (!val.some(v => propVal.toLowerCase() === v.toLowerCase() || propVal.toLowerCase().includes(v.toLowerCase()))) return false;
    } else {
      if (!propVal.toLowerCase().includes(val.toLowerCase())) return false;
    }
  }
  return true;
}

function formatPrice(price, currency) {
  const sym = { EUR: '€', USD: '$', GBP: '£' }[currency] || currency;
  const rounded = Math.round(price / 1000) * 1000;
  return `${sym}${rounded.toLocaleString('es-ES')}`;
}

// ── Rewrite internal hrefs to /es/ equivalents ───────────────────────────────
const URL_REWRITES = {
  '/how-it-works/': '/es/como-funciona/',
  '/our-homes/': '/es/propiedades/',
  '/contact/': '/es/contacto/',
  '/contact-us/': '/es/contacto/',
  '/about-us/': '/es/quienes-somos/',
  '/buying-a-co-ownership-property-faqs/': '/es/comprar-copropiedad-preguntas-frecuentes/',
  '/staying-in-my-co-ownership-property-faqs/': '/es/disfrutar-copropiedad-preguntas-frecuentes/',
  '/co-ownership-explained/': '/es/copropiedad/',
  '/ownership/': '/es/copropiedad/',
  '/all-our-blog/': '/es/blog/',
};

const ALL_DEST_SLUGS = Object.keys(DEST_FILTERS);

function rewriteHrefs(html) {
  if (!html) return html;
  for (const [from, to] of Object.entries(URL_REWRITES)) {
    html = html.split(`href="${from}"`).join(`href="${to}"`);
  }
  for (const slug of ALL_DEST_SLUGS) {
    html = html.split(`href="/${slug}/"`).join(`href="/es/destinos/${slug}/"`);
    html = html.split(`href="https://co-ownership-property.com/${slug}/"`)
               .join(`href="https://co-ownership-property.com/es/destinos/${slug}/"`);
  }
  html = html.replace(/href="\/blog\//g, 'href="/es/blog/');
  return html;
}

// ─── getStaticPaths ───────────────────────────────────────────────────────────
export async function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content', 'destinations', 'es');
  let slugs = [];
  if (fs.existsSync(contentDir)) {
    slugs = fs.readdirSync(contentDir).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));
  }
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

// ─── getStaticProps ───────────────────────────────────────────────────────────
export async function getStaticProps({ params }) {
  const { slug } = params;
  const contentPath = path.join(process.cwd(), 'content', 'destinations', 'es', `${slug}.html`);

  if (!fs.existsSync(contentPath)) {
    return { redirect: { destination: `/es/blog/${slug}/`, permanent: false } };
  }
  const rawHtml = fs.readFileSync(contentPath, 'utf-8');

  const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : slug;
  const metaMatch = rawHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const existingMetaDesc = metaMatch ? metaMatch[1] : '';

  let bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : '';

  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  body = body.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '');
  body = body.replace(/<section[^>]*class="newsletter-section"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<section[^>]*id="speak-to-expert"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
  body = body.replace(/<section[^>]*class="props-sec"[^>]*>[\s\S]*?<\/section>/g, '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: allProps } = await supabase
    .from('properties')
    .select('slug, title, title_es, title_fr, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type')
    .in('status', ['Live', 'for_sale']);

  const filter = DEST_FILTERS[slug] || null;
  const matchedRaw = filter ? (allProps || []).filter(p => matchesFilter(p, filter)) : [];
  const matchedProps = matchedRaw.slice(0, 60).map(p => ({
    slug: p.slug,
    title: p.title_es || p.title,
    title_es: p.title_es || null,
    title_fr: p.title_fr || null,
    img: p.img,
    images: (p.images || []).slice(0, 3),
    totalImages: p.total_images || 0,
    driveUrl: p.drive_url || null,
    price: p.price || null,
    currency: p.currency || 'EUR',
    share_denominator: p.share_denominator || null,
    country: p.country,
    region: p.region,
    city: p.city || '',
    beds: p.beds || 0,
    size: p.size || 0,
    label: '',
    status: p.status || '',
    property_type: p.property_type || '',
  }));

  const splitMarkers = ['class="dest-mid-cta"', 'class="dest-mid-cta ', 'id="dest-mid-cta"'];
  let splitIdx = -1;
  for (const marker of splitMarkers) {
    const idx = body.indexOf(marker);
    if (idx > 0) { splitIdx = body.lastIndexOf('<', idx); break; }
  }

  let heroHtml = splitIdx > 0 ? body.slice(0, splitIdx).trim() : body.trim();
  let restHtml = splitIdx > 0 ? body.slice(splitIdx).trim() : '';

  restHtml = restHtml.replace(/<section[^>]*><div[^>]*><h3>Which country are you interested in\?<\/h3><\/div><\/section>/g, '');
  restHtml = restHtml.replace(/<section[^>]*class="[^"]*dest-explore[^"]*"[^>]*>[\s\S]*?<\/section>/g, '');
  restHtml = restHtml.replace(/https:\/\/staging\.co-ownership-property\.com\//g, 'https://co-ownership-property.com/');
  restHtml = restHtml.replace(/href="#contact"/g, 'href="#newsletter"');
  heroHtml = heroHtml.replace(/href="#contact"/g, 'href="#newsletter"');

  heroHtml = rewriteHrefs(heroHtml);
  restHtml = rewriteHrefs(restHtml);

  const related = (RELATED[slug] || []).map(s => ({ slug: s, label: destLabel(s) }));

  const metaDesc = existingMetaDesc || `${destLabel(slug)} — casas exclusivas en copropiedad, desde una fracción 1/8 escriturada e inscrita en el Registro de la Propiedad.`;

  const FALLBACK_OG = 'https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg';
  const ogImage = matchedProps.find(p => p.img)?.img || FALLBACK_OG;

  const withPrice = matchedProps.filter(p => p.price > 0);
  const minPriceProp = withPrice.length ? withPrice.reduce((a, b) => a.price < b.price ? a : b) : null;
  const minPrice = minPriceProp?.price || null;
  const minCurrency = minPriceProp?.currency || 'EUR';

  return {
    props: {
      slug, title, metaDesc, heroHtml, restHtml,
      properties: matchedProps, related,
      ogImage, minPrice, minCurrency,
    },
    revalidate: 3600,
  };
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function DestinationPageES({
  slug, title, metaDesc, heroHtml, restHtml,
  properties, related,
  ogImage, minPrice, minCurrency,
}) {
  const canonicalUrl = `https://co-ownership-property.com/es/destinos/${slug}/`;

  const BASE = 'https://co-ownership-property.com';
  const crumbs = [{ name: 'Inicio', item: `${BASE}/es/` }];
  const parentSlug = PARENT[slug];
  if (parentSlug) {
    crumbs.push({ name: destLabel(parentSlug), item: `${BASE}/es/destinos/${parentSlug}/` });
  }
  crumbs.push({ name: destLabel(slug), item: canonicalUrl });

  const [activeFilter, setActiveFilter] = useState(null);

  const filterOptions = useMemo(() => {
    if (properties.length < 4) return [];
    const counts = {};
    for (const p of properties) {
      const label = getRegionLabel(p);
      if (label?.trim()) counts[label] = (counts[label] || 0) + 1;
    }
    const regions = Object.keys(counts).filter(r => counts[r] >= 1);
    if (regions.length < 2) return [];
    return regions.sort((a, b) => counts[b] - counts[a]);
  }, [properties]);

  const displayedProperties = activeFilter
    ? properties.filter(p => getRegionLabel(p) === activeFilter)
    : properties;

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": crumb.name,
        "item": crumb.item,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": metaDesc,
      "url": canonicalUrl,
      "image": ogImage,
      "inLanguage": "es",
      "publisher": {
        "@type": "Organization",
        "name": "Co-Ownership Property",
        "url": "https://co-ownership-property.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://co-ownership-property.com/wp-content/uploads/MAIN-LOGO-COP.svg",
        },
      },
    },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="alternate" hrefLang="en" href={`https://co-ownership-property.com/${slug}/`} />
        <link rel="alternate" hrefLang="es" href={canonicalUrl} />
        <link rel="alternate" hrefLang="fr" href={`https://co-ownership-property.com/fr/destinations/${slug}/`} />
        <link rel="alternate" hrefLang="de" href={`https://co-ownership-property.com/de/destinationen/${slug}/`} />
        <link rel="alternate" hrefLang="x-default" href={`https://co-ownership-property.com/${slug}/`} />
        {schemas.map((schema, i) => (
          <script key={i} type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <style>{`
          .dest-props-count { font-size: 14px; color: #777; margin: 0 0 20px; padding-top: 20px; }
          .dest-props-count strong { color: #2C4A5E; font-weight: 600; }
          .dest-chip-clear { background: none; border: none; padding: 0; color: #C9A84C; font-size: inherit; cursor: pointer; font-family: inherit; text-decoration: underline; }
          .dest-inline-link { color: #C9A84C; text-decoration: underline; text-underline-offset: 2px; }
          .dest-inline-link:hover { opacity: 0.75; }
        `}</style>
      </Head>

      <Header />

      <div dangerouslySetInnerHTML={{ __html: heroHtml }} />

      {properties.length > 0 && filterOptions.length >= 2 && (
        <div className="filter-bar">
          <div className="filter-row">
            <span className="filter-label">Región</span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                <button
                  className={`filter-btn${!activeFilter ? ' active' : ''}`}
                  onClick={() => setActiveFilter(null)}
                >Todas</button>
                {filterOptions.map(region => (
                  <button
                    key={region}
                    className={`filter-btn${activeFilter === region ? ' active' : ''}`}
                    onClick={() => setActiveFilter(region)}
                  >{region}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dest-props-section">
        <div className="homes-grid-wrap">
          {properties.length > 0 && (
            <p className="dest-props-count">
              {activeFilter ? (
                <>{displayedProperties.length} de {properties.length} {properties.length === 1 ? 'casa' : 'casas'}</>
              ) : (
                <>
                  {properties.length} {properties.length === 1 ? 'casa' : 'casas'}
                  {minPrice && (
                    <> &middot; desde <strong>{formatPrice(minPrice, minCurrency)}</strong></>
                  )}
                </>
              )}
            </p>
          )}

          {displayedProperties.length > 0 ? (
            <div className="homes-grid" id="homes-grid">
              {displayedProperties.map((p, idx) => (
                <PropertyCard key={p.slug} property={p} priority={idx < 3} locale="es" />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="no-props">
              <p>Ninguna casa en {activeFilter}.{' '}
                <button className="dest-chip-clear" onClick={() => setActiveFilter(null)}>
                  Ver las {properties.length} casas →
                </button>
              </p>
            </div>
          ) : (
            <div className="no-props">
              <p>Ninguna casa disponible actualmente en este destino.{' '}
                <a href="/es/propiedades/">Ver todas las casas</a> o{' '}
                <a href="/es/contacto/">contáctanos</a> para los próximos anuncios.
              </p>
            </div>
          )}
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: restHtml }} />

      {related && related.length > 0 && (
        <section className="dest-also-explore">
          <p className="dest-also-label">Otros destinos</p>
          <div className="dest-also-links">
            {related.map(r => (
              <a key={r.slug} href={`/es/destinos/${r.slug}/`} className="dest-also-link">
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
