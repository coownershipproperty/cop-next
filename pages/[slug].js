import { useState, useMemo } from 'react';
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

// ── Parent map for breadcrumb hierarchy ──────────────────────────────────────
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

// ── Related destinations ──────────────────────────────────────────────────────
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

// ── Keywords to recognise in content per destination slug ────────────────────
const DEST_KEYWORDS = {
  "french-alps-fractional-ownership-properties": ["French Alps", "Alps", "Chamonix", "Courchevel", "Méribel", "Megève", "Val d'Isère"],
  "south-of-france-fractional-ownership-properties": ["South of France", "Côte d'Azur", "Riviera", "Provence"],
  "paris-fractional-ownership-properties": ["Paris"],
  "balearics-fractional-ownership-properties": ["Balearics", "Balearic Islands"],
  "canary-islands-fractional-ownership-properties": ["Canary Islands", "Tenerife"],
  "costa-del-sol-fractional-ownership-properties": ["Costa del Sol", "Marbella"],
  "costa-blanca-fractional-ownership-properties": ["Costa Blanca", "Alicante"],
  "costa-de-la-luz-fractional-ownership-properties": ["Costa de la Luz"],
  "spanish-costas-fractional-ownership-properties": ["Spanish Costas"],
  "italian-lakes-fractional-ownership-properties": ["Italian Lakes", "Lake Garda", "Lago Maggiore"],
  "lake-como-fractional-ownership-properties": ["Lake Como", "Como"],
  "sardinia-fractional-ownership-properties": ["Sardinia"],
  "liguria-fractional-ownership-properties": ["Liguria", "Ligurian"],
  "mallorca-fractional-ownership-properties": ["Mallorca"],
  "ibiza-fractional-ownership-properties": ["Ibiza"],
  "menorca-fractional-ownership-properties": ["Menorca"],
  "barcelona-fractional-ownership-for-sale": ["Barcelona"],
  "madrid-fractional-ownership-properties": ["Madrid"],
  "pyrenees-mountains-fractional-ownership-properties": ["Pyrenees", "Baqueira"],
  "malibu-santa-barbara-fractional-ownership": ["Malibu", "Santa Barbara", "Montecito"],
  "napa-sonoma-fractional-ownership-wine-country-estates": ["Napa Valley", "Napa", "Sonoma", "Wine Country"],
  "lake-tahoe-fractional-ownership-properties": ["Lake Tahoe", "Tahoe"],
  "palm-springs-fractional-ownership-desert-modern-luxury": ["Palm Springs", "Palm Desert", "Coachella Valley"],
  "florida-keys-fractional-ownership": ["Florida Keys", "Key West", "Key Largo"],
  "brickell-fractional-ownership-miami": ["Brickell"],
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": ["30A", "Emerald Coast", "Rosemary Beach", "Seaside"],
  "aspen-fractional-ownership": ["Aspen"],
  "vail-fractional-ownership": ["Vail"],
  "breckenridge-fractional-ownership": ["Breckenridge"],
  "park-city-fractional-ownership-2": ["Park City"],
  "miami-fractional-ownership": ["Miami"],
  "newport-beach-fractional-ownership": ["Newport Beach"],
  "california-fractional-ownership-properties": ["California"],
  "colorado-fractional-ownership-properties": ["Colorado"],
  "florida-fractional-ownership-properties": ["Florida"],
  "utah-fractional-ownership-properties": ["Utah"],
  "london-fractional-ownership-properties": ["London"],
  "england-fractional-ownership-properties": ["England", "UK"],
  "austria-fractional-ownership-properties": ["Austria", "Vienna"],
  "croatia-fractional-ownership-properties": ["Croatia", "Dubrovnik", "Dalmatian"],
  "germany-fractional-ownership-properties": ["Germany", "Bavaria"],
  "portugal-fractional-ownership-properties": ["Portugal", "Lisbon", "Algarve"],
  "sweden-fractional-ownership-properties": ["Sweden", "Stockholm"],
  "mexico-fractional-ownership-properties": ["Mexico", "Tulum", "Los Cabos"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function stripTags(str) {
  return decodeEntities(str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function formatPrice(price, currency) {
  const sym = { EUR: '€', USD: '$', GBP: '£' }[currency] || currency;
  const rounded = Math.round(price / 1000) * 1000;
  return `${sym}${rounded.toLocaleString('en-GB')}`;
}

// ── FAQ extraction ────────────────────────────────────────────────────────────
function extractFaqItems(html) {
  const items = [];
  try {
    const listMatch = html.match(/<div[^>]*class="dest-faq-list"[^>]*>([\s\S]*)/);
    if (!listMatch) return items;
    const chunks = listMatch[1].split(/<section[^>]*class="dest-sec[^"]*"[^>]*>/);
    for (const chunk of chunks.slice(1)) {
      const h2Match = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
      if (!h2Match) continue;
      const question = stripTags(h2Match[1]);
      if (!question) continue;
      const pMatches = [...chunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
      const answerParts = pMatches.map(m => stripTags(m[1])).filter(Boolean);
      if (!answerParts.length) continue;
      const answer = answerParts.join(' ').slice(0, 500).replace(/\s+$/, '');
      items.push({ question, answer });
    }
  } catch (e) {}
  return items.slice(0, 6);
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
function buildBreadcrumbs(slug, title) {
  const BASE = 'https://co-ownership-property.com';
  const crumbs = [{ name: 'Home', item: `${BASE}/` }];
  const parentSlug = PARENT[slug];
  if (parentSlug) crumbs.push({ name: destLabel(parentSlug), item: `${BASE}/${parentSlug}/` });
  crumbs.push({ name: title, item: `${BASE}/${slug}/` });
  return crumbs;
}

// ── Improved meta description ─────────────────────────────────────────────────
function buildMetaDesc(slug, properties, existingDesc) {
  if (!properties.length) return existingDesc;
  const withPrice = properties.filter(p => p.price > 0);
  if (!withPrice.length) return existingDesc;
  const minProp = withPrice.reduce((a, b) => a.price < b.price ? a : b);
  const priceStr = formatPrice(minProp.price, minProp.currency || 'EUR');
  const count = properties.length;
  const name = destLabel(slug);
  return `${count} co-ownership ${count === 1 ? 'property' : 'properties'} in ${name} from ${priceStr}. Real deeded ownership — not timeshare. Luxury homes at a fraction of the cost.`;
}

// ── Internal link injection ───────────────────────────────────────────────────
// Injects one hyperlink per related destination into content text nodes.
// Skips text inside existing <a> tags to avoid nesting.
function injectInternalLinks(html, currentSlug) {
  const related = RELATED[currentSlug] || [];
  if (!related.length) return html;

  // Build target list sorted by keyword length (longest first → avoid partial matches)
  const targets = [];
  for (const slug of related) {
    if (slug === currentSlug) continue;
    const keywords = DEST_KEYWORDS[slug] || [destLabel(slug)];
    for (const kw of keywords) {
      targets.push({ keyword: kw, url: `/${slug}/`, slug });
    }
  }
  targets.sort((a, b) => b.keyword.length - a.keyword.length);

  const linkedSlugs = new Set();
  let inAnchor = 0;

  // Split into tag/text tokens and only process text tokens
  const tokens = html.split(/(<[^>]*>)/);

  return tokens.map(token => {
    if (token.startsWith('<')) {
      if (/^<a[\s>]/i.test(token)) inAnchor++;
      else if (/^<\/a>/i.test(token)) inAnchor = Math.max(0, inAnchor - 1);
      return token;
    }
    // Pure text node — skip if inside an existing link
    if (inAnchor > 0 || !token.trim()) return token;

    let text = token;
    for (const { keyword, url, slug } of targets) {
      if (linkedSlugs.has(slug)) continue;
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use lookahead/behind that works with accented chars too
      const re = new RegExp(`(?<![\\wÀ-ɏ-])${escaped}(?![\\wÀ-ɏ-])`, 'i');
      if (re.test(text)) {
        text = text.replace(re, m => `<a href="${url}" class="dest-inline-link">${m}</a>`);
        linkedSlugs.add(slug);
      }
    }
    return text;
  }).join('');
}

// ─── getStaticPaths ───────────────────────────────────────────────────────────
export async function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content', 'destinations');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
  const slugs = files.map(f => f.replace('.html', ''));
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

// ─── getStaticProps ───────────────────────────────────────────────────────────
export async function getStaticProps({ params }) {
  const { slug } = params;
  const contentPath = path.join(process.cwd(), 'content', 'destinations', `${slug}.html`);

  if (!fs.existsSync(contentPath)) {
    return { redirect: { destination: `/blog/${slug}/`, permanent: true } };
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

  const allProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8'));
  const filter = DEST_FILTERS[slug] || null;
  const matchedProps = filter ? allProps.filter(p => matchesFilter(p, filter)) : [];

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
  restHtml = restHtml.replace(/<h2([^>]*)>[^<]*?—\s*Frequently Asked Questions<\/h2>/g, '<h2$1>Frequently Asked Questions</h2>');
  restHtml = restHtml.replace(/https:\/\/staging\.co-ownership-property\.com\//g, 'https://co-ownership-property.com/');
  restHtml = restHtml.replace(/href="#contact"/g, 'href="#newsletter"');
  heroHtml = heroHtml.replace(/href="#contact"/g, 'href="#newsletter"');

  // Inject internal links into content
  restHtml = injectInternalLinks(restHtml, slug);

  const related = (RELATED[slug] || []).map(s => ({ slug: s, label: destLabel(s) }));

  // SEO: FAQ schema
  const faqItems = extractFaqItems(rawHtml);

  // SEO: OG image from first matched property
  const FALLBACK_OG = 'https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg';
  const ogImage = matchedProps.find(p => p.img)?.img || FALLBACK_OG;

  // SEO: improved meta description
  const metaDesc = buildMetaDesc(slug, matchedProps, existingMetaDesc);

  // Price range for hero strip
  const withPrice = matchedProps.filter(p => p.price > 0);
  const minPriceProp = withPrice.length ? withPrice.reduce((a, b) => a.price < b.price ? a : b) : null;
  const minPrice = minPriceProp?.price || null;
  const minCurrency = minPriceProp?.currency || 'EUR';

  return {
    props: {
      slug, title, metaDesc, heroHtml, restHtml,
      properties: matchedProps, related, faqItems, ogImage,
      minPrice, minCurrency,
    },
  };
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function DestinationPage({
  slug, title, metaDesc, heroHtml, restHtml,
  properties, related, faqItems, ogImage,
  minPrice, minCurrency,
}) {
  const canonicalUrl = `https://co-ownership-property.com/${slug}/`;
  const breadcrumbItems = buildBreadcrumbs(slug, title);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState(null);

  // Derive unique region/city values from the property list for filter chips
  const filterOptions = useMemo(() => {
    if (properties.length < 4) return [];
    const counts = {};
    for (const p of properties) {
      const val = p.region || p.city;
      if (val?.trim()) counts[val] = (counts[val] || 0) + 1;
    }
    const regions = Object.keys(counts).filter(r => counts[r] >= 1);
    if (regions.length < 2) return [];
    return regions.sort((a, b) => counts[b] - counts[a]);
  }, [properties]);

  const displayedProperties = activeFilter
    ? properties.filter(p => (p.region || p.city) === activeFilter)
    : properties;

  // ── Schemas ───────────────────────────────────────────────────────────────
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((crumb, i) => ({
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
      "inLanguage": "en",
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

  if (faqItems.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(({ question, answer }) => ({
        "@type": "Question",
        "name": question,
        "acceptedAnswer": { "@type": "Answer", "text": answer },
      })),
    });
  }

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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        {schemas.map((schema, i) => (
          <script key={i} type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <style>{`
          /* ── Property count + filter chips ── */
          .dest-props-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            padding: 20px 0 12px;
          }
          .dest-props-count {
            font-size: 14px;
            color: #777;
            margin: 0;
          }
          .dest-props-count strong {
            color: #2C4A5E;
            font-weight: 600;
          }
          .dest-filter-chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .dest-chip {
            padding: 5px 14px;
            border-radius: 20px;
            border: 1px solid #2C4A5E;
            background: transparent;
            color: #2C4A5E;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.18s, color 0.18s;
            font-family: inherit;
            line-height: 1.5;
          }
          .dest-chip:hover,
          .dest-chip.active {
            background: #2C4A5E;
            color: #fff;
          }
          .dest-chip-clear {
            background: none;
            border: none;
            padding: 0;
            color: #C9A84C;
            font-size: inherit;
            cursor: pointer;
            font-family: inherit;
            text-decoration: underline;
          }
          /* ── Inline content links ── */
          .dest-inline-link {
            color: #C9A84C;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .dest-inline-link:hover { opacity: 0.75; }
        `}</style>
      </Head>

      <Header />

      {/* Hero */}
      <div dangerouslySetInnerHTML={{ __html: heroHtml }} />

      {/* Property grid */}
      <div className="dest-props-section">
        <div className="homes-grid-wrap">

          {/* Count + price + filter chips */}
          {properties.length > 0 && (
            <div className="dest-props-meta">
              <p className="dest-props-count">
                {activeFilter ? (
                  <>{displayedProperties.length} of {properties.length} {properties.length === 1 ? 'property' : 'properties'}</>
                ) : (
                  <>
                    {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                    {minPrice && (
                      <> &middot; from <strong>{formatPrice(minPrice, minCurrency)}</strong></>
                    )}
                  </>
                )}
              </p>
              {filterOptions.length >= 2 && (
                <div className="dest-filter-chips">
                  <button
                    className={`dest-chip${!activeFilter ? ' active' : ''}`}
                    onClick={() => setActiveFilter(null)}
                  >All</button>
                  {filterOptions.map(region => (
                    <button
                      key={region}
                      className={`dest-chip${activeFilter === region ? ' active' : ''}`}
                      onClick={() => setActiveFilter(region)}
                    >{region}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {displayedProperties.length > 0 ? (
            <div className="homes-grid" id="homes-grid">
              {displayedProperties.map((p, idx) => (
                <PropertyCard key={p.id} property={p} priority={idx < 3} />
              ))}
            </div>
          ) : properties.length > 0 ? (
            // Filter applied but no results
            <div className="no-props">
              <p>No properties in {activeFilter}.{' '}
                <button className="dest-chip-clear" onClick={() => setActiveFilter(null)}>
                  Show all {properties.length} properties →
                </button>
              </p>
            </div>
          ) : (
            // No properties at all for this destination
            <div className="no-props">
              <p>No properties currently listed for this destination.{' '}
                <a href="/our-homes/">Browse all properties</a> or{' '}
                <a href="/contact">contact us</a> for upcoming listings.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Rest of editorial content (internal links injected at build time) */}
      <div dangerouslySetInnerHTML={{ __html: restHtml }} />

      {/* Also Explore */}
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
