import { useState, useMemo } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import destinationFaqs from '@/lib/destination-faqs.json';
import destSameAs from '@/lib/destination-sameas.json';

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
  "lake-garda-fractional-ownership-properties":     { country: "Italy", region: "Lake Garda" },
  "italian-lakes-fractional-ownership-properties":  { country: "Italy", regions: ["Lake Garda", "Lake Como", "Lago Maggiore"] },
  "liguria-fractional-ownership-properties":        { country: "Italy", region: "Liguria" },

  // ── MEXICO ─────────────────────────────────────────────────────
  "los-cabos-fractional-ownership-properties":      { country: "Mexico", cities: ["Cabo San Lucas", "San Jose Del Cabo", "San José Del Cabo", "Cabo"] },

  // ── UK ─────────────────────────────────────────────────────────
  "london-fractional-ownership-properties":         { country: "England", region: "London" },

  // ── USA STATES ─────────────────────────────────────────────────
  "california-fractional-ownership-properties":     { country: "USA", region: "California" },
  "colorado-fractional-ownership-properties":       { country: "USA", region: "Colorado" },
  "florida-fractional-ownership-properties":        { country: "USA", region: "Florida" },
  "utah-fractional-ownership-properties":           { country: "USA", region: "Utah" },
  "south-carolina-fractional-ownership-properties": { country: "USA", region: "South Carolina" },
  "wyoming-fractional-ownership-properties":        { country: "USA", region: "Wyoming" },
  "arizona-fractional-ownership-properties":        { country: "USA", region: "Arizona" },
  "nevada-fractional-ownership-properties":         { country: "USA", region: "Nevada" },

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
  "lake-garda-fractional-ownership-properties":        "italy-fractional-ownership-properties",
  "italian-lakes-fractional-ownership-properties":     "italy-fractional-ownership-properties",
  "liguria-fractional-ownership-properties":           "italy-fractional-ownership-properties",
  "los-cabos-fractional-ownership-properties":         "mexico-fractional-ownership-properties",
  "london-fractional-ownership-properties":            "england-fractional-ownership-properties",
  "california-fractional-ownership-properties":        "usa-fractional-ownership-properties",
  "colorado-fractional-ownership-properties":          "usa-fractional-ownership-properties",
  "florida-fractional-ownership-properties":           "usa-fractional-ownership-properties",
  "utah-fractional-ownership-properties":              "usa-fractional-ownership-properties",
  "south-carolina-fractional-ownership-properties":    "usa-fractional-ownership-properties",
  "wyoming-fractional-ownership-properties":           "usa-fractional-ownership-properties",
  "arizona-fractional-ownership-properties":           "usa-fractional-ownership-properties",
  "nevada-fractional-ownership-properties":            "usa-fractional-ownership-properties",
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
  "lake-como-fractional-ownership-properties":   ["lake-garda-fractional-ownership-properties","italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "lake-garda-fractional-ownership-properties":  ["lake-como-fractional-ownership-properties","italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italian-lakes-fractional-ownership-properties": ["lake-como-fractional-ownership-properties","lake-garda-fractional-ownership-properties","liguria-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "liguria-fractional-ownership-properties":     ["italian-lakes-fractional-ownership-properties","sardinia-fractional-ownership-properties","italy-fractional-ownership-properties"],
  "italy-fractional-ownership-properties":       ["sardinia-fractional-ownership-properties","italian-lakes-fractional-ownership-properties","liguria-fractional-ownership-properties"],
  "london-fractional-ownership-properties":      ["england-fractional-ownership-properties"],
  "england-fractional-ownership-properties":     ["london-fractional-ownership-properties"],
  "california-fractional-ownership-properties":  ["colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "colorado-fractional-ownership-properties":    ["california-fractional-ownership-properties","utah-fractional-ownership-properties","usa-fractional-ownership-properties","aspen-fractional-ownership","vail-fractional-ownership","breckenridge-fractional-ownership"],
  "florida-fractional-ownership-properties":     ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties","miami-fractional-ownership"],
  "utah-fractional-ownership-properties":        ["colorado-fractional-ownership-properties","california-fractional-ownership-properties","usa-fractional-ownership-properties","park-city-fractional-ownership-2"],
  "usa-fractional-ownership-properties":         ["california-fractional-ownership-properties","colorado-fractional-ownership-properties","florida-fractional-ownership-properties","utah-fractional-ownership-properties"],
  "south-carolina-fractional-ownership-properties": ["florida-fractional-ownership-properties","30a-fractional-ownership-emerald-coast-co-ownership-beach-homes","california-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "wyoming-fractional-ownership-properties":     ["colorado-fractional-ownership-properties","aspen-fractional-ownership","utah-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "arizona-fractional-ownership-properties":     ["palm-springs-fractional-ownership-desert-modern-luxury","california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
  "nevada-fractional-ownership-properties":      ["lake-tahoe-fractional-ownership-properties","california-fractional-ownership-properties","colorado-fractional-ownership-properties","usa-fractional-ownership-properties"],
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
  "mexico-fractional-ownership-properties":      ["los-cabos-fractional-ownership-properties","usa-fractional-ownership-properties","spain-fractional-ownership-properties"],
  "los-cabos-fractional-ownership-properties":   ["mexico-fractional-ownership-properties","palm-springs-fractional-ownership-desert-modern-luxury","california-fractional-ownership-properties","usa-fractional-ownership-properties"],
};

// ── Keywords to recognise in content per destination slug ────────────────────
const DEST_KEYWORDS = {
  // Country pillars — added so the other 47 destinations auto-link to the four
  // highest-volume pages. "USA" is matched word-bounded so "USA" won't link
  // when it's already inside an existing href like "/usa-fractional…".
  "spain-fractional-ownership-properties":  ["Spain"],
  "france-fractional-ownership-properties": ["France"],
  "italy-fractional-ownership-properties":  ["Italy"],
  "usa-fractional-ownership-properties":    ["United States", "the USA", "USA"],
  "french-alps-fractional-ownership-properties": ["French Alps", "Alps", "Chamonix", "Courchevel", "Méribel", "Megève", "Val d'Isère"],
  "south-of-france-fractional-ownership-properties": ["South of France", "Côte d'Azur", "Riviera", "Provence"],
  "paris-fractional-ownership-properties": ["Paris"],
  "balearics-fractional-ownership-properties": ["Balearics", "Balearic Islands"],
  "canary-islands-fractional-ownership-properties": ["Canary Islands", "Tenerife"],
  "costa-del-sol-fractional-ownership-properties": ["Costa del Sol", "Marbella"],
  "costa-blanca-fractional-ownership-properties": ["Costa Blanca", "Alicante"],
  "costa-de-la-luz-fractional-ownership-properties": ["Costa de la Luz"],
  "spanish-costas-fractional-ownership-properties": ["Spanish Costas"],
  "italian-lakes-fractional-ownership-properties": ["Italian Lakes", "Lago Maggiore"],
  "lake-como-fractional-ownership-properties": ["Lake Como", "Como"],
  "lake-garda-fractional-ownership-properties": ["Lake Garda"],
  "los-cabos-fractional-ownership-properties": ["Los Cabos", "Cabo San Lucas", "San José del Cabo"],
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
  "south-carolina-fractional-ownership-properties": ["South Carolina", "Kiawah Island", "Hilton Head"],
  "wyoming-fractional-ownership-properties": ["Wyoming", "Jackson Hole"],
  "arizona-fractional-ownership-properties": ["Arizona", "Scottsdale"],
  "nevada-fractional-ownership-properties": ["Incline Village"],
  "london-fractional-ownership-properties": ["London"],
  "england-fractional-ownership-properties": ["England", "UK"],
  "austria-fractional-ownership-properties": ["Austria", "Vienna"],
  "croatia-fractional-ownership-properties": ["Croatia", "Dubrovnik", "Dalmatian"],
  "germany-fractional-ownership-properties": ["Germany", "Bavaria"],
  "portugal-fractional-ownership-properties": ["Portugal", "Lisbon", "Algarve"],
  "sweden-fractional-ownership-properties": ["Sweden", "Stockholm"],
  "mexico-fractional-ownership-properties": ["Mexico", "Tulum"],
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

// Same cluster map as our-homes — keeps region labels consistent across the site
const FRANCE_CLUSTERS = [
  { label: 'Paris',           regions: ['Paris'] },
  { label: 'South of France', regions: ["Côte d'Azur"] },
  { label: 'French Alps',     regions: ['French Alps', 'Portes du Soleil'] },
];

/** Returns the display label for a property's region, applying France clusters */
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

async function withShareDenominators(properties) {
  if (!properties.length) return properties;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return properties;

  try {
    const supabase = createClient(url, key);
    const rows = [];
    const slugs = properties.map(p => p.slug).filter(Boolean);
    for (let i = 0; i < slugs.length; i += 80) {
      const { data, error } = await supabase
        .from('properties')
        .select('slug, share_denominator')
        .in('slug', slugs.slice(i, i + 80));

      if (error) return properties;
      rows.push(...(data || []));
    }

    const bySlug = Object.fromEntries(
      rows.map(p => [p.slug, p.share_denominator || null])
    );
    return properties.map(p => ({
      ...p,
      share_denominator: bySlug[p.slug] || p.share_denominator || null,
    }));
  } catch (_) {
    return properties;
  }
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

// ── Strip nested section by class ────────────────────────────────────────────
// Walks <section>/</section> tokens (not chars — substring-on-attrs caused false
// matches before). On unbalanced source HTML (legacy WP migration left a couple
// of files with an open <section class="dest-faq-sec"> that never closes at its
// own depth) we strip from the marker through end-of-input, which is safer than
// returning the original untouched and leaking the orphan FAQ block live.
function removeSectionByClass(html, cls) {
  const openClsRe = new RegExp(`<section[^>]*class="[^"]*${cls}[^"]*"[^>]*>`);
  const start = html.search(openClsRe);
  if (start === -1) return html;

  const sectionTokenRe = /<section[\s>][^>]*>|<\/section>/gi;
  sectionTokenRe.lastIndex = start;
  let depth = 0, m;
  while ((m = sectionTokenRe.exec(html)) !== null) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        return html.slice(0, start) + html.slice(m.index + m[0].length);
      }
    } else {
      depth++;
    }
  }
  // Unbalanced — strip from marker to end of input rather than leak the block.
  return html.slice(0, start);
}

// ── FAQ items for schema markup (reads from JSON data, falls back to HTML) ────
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

// ── Heading ID injection + TOC extraction ────────────────────────────────────
// Adds id="..." to every <h2>/<h3> in restHtml (slugified from heading text)
// so we get anchor links + a TOC nav. Also returns the harvested headings.
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Inject the TOC HTML right after the mid-CTA closing tag in restHtml so the
// reading flow is: mid-CTA → TOC → §A. Falls back to prepending if no mid-CTA.
function injectTocAfterMidCta(restHtml, tocH2s) {
  const tocHtml = `<nav class="dest-toc" aria-label="On this page"><p class="dest-toc-label">On this page</p><ol>${
    tocH2s.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')
  }</ol></nav>`;
  // Find the closing </div> of the dest-mid-cta block. Mid-CTA pattern is
  // <div class="dest-mid-cta"><div class="dest-mid-cta-inner">…</div></div>
  const ctaCloseRe = /<\/div>\s*<\/div>\s*(?=<section)/;
  const m = restHtml.search(ctaCloseRe);
  if (m === -1) return tocHtml + restHtml;
  // Move past the matched closing pattern
  const idx = restHtml.search(/<section/);
  if (idx === -1) return tocHtml + restHtml;
  return restHtml.slice(0, idx) + tocHtml + restHtml.slice(idx);
}

function injectHeadingIds(html) {
  const used = new Set();
  const toc = [];
  const out = html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (full, tag, attrs, inner) => {
    // Skip if already has an id
    if (/\sid\s*=/i.test(attrs)) return full;
    const text = stripTags(inner);
    if (!text) return full;
    let id = slugifyHeading(text);
    if (!id) return full;
    let unique = id, n = 2;
    while (used.has(unique)) { unique = `${id}-${n++}`; }
    used.add(unique);
    toc.push({ level: tag === 'h2' ? 2 : 3, id: unique, text });
    return `<${tag}${attrs} id="${unique}">${inner}</${tag}>`;
  });
  return { html: out, toc };
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
  let matchedProps = filter ? allProps.filter(p => matchesFilter(p, filter)) : [];
  matchedProps = await withShareDenominators(matchedProps);

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

  // Strip old dest-faq-sec block (replaced by JSON-driven FAQ component)
  restHtml = removeSectionByClass(restHtml, 'dest-faq-sec');

  // Inject internal links into content
  restHtml = injectInternalLinks(restHtml, slug);

  // Auto-add id="..." to H2/H3 in restHtml so we get anchor links + TOC navigation
  const headingResult = injectHeadingIds(restHtml);
  restHtml = headingResult.html;
  const toc = headingResult.toc;

  // Word count of the editorial body — used to decide TOC visibility + Article schema
  const restWordCount = stripTags(restHtml).split(/\s+/).filter(Boolean).length;

  const related = (RELATED[slug] || []).map(s => ({ slug: s, label: destLabel(s) }));

  // ── Pillar/cluster hierarchy (built from PARENT map) ────────────────────────
  // Pillar  = a slug that has children but no parent (Spain, France, Italy, USA, plus
  //           California/Florida/Colorado/Utah which are USA child-pillars)
  // Cluster = a slug that has a parent (every region/city below a country)
  const parentSlug = PARENT[slug] || null;
  const parent = parentSlug ? { slug: parentSlug, label: destLabel(parentSlug) } : null;
  const children = Object.entries(PARENT)
    .filter(([childSlug, p]) => p === slug)
    .map(([childSlug]) => ({ slug: childSlug, label: destLabel(childSlug) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // FAQ data from JSON (accurate, SEO-rich content for all 48 destinations)
  const faqData = destinationFaqs[slug] || null;

  // SEO: FAQ schema items (from JSON data if available, else fallback to HTML extraction)
  const faqItems = faqData
    ? faqData.items.slice(0, 8).map(item => ({ question: item.q, answer: stripTags(item.a).slice(0, 500) }))
    : extractFaqItems(rawHtml);

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

  // ── TouristDestination geo coordinates aggregated from matched properties ───
  let aggLat = null, aggLng = null;
  const propsWithCoords = matchedProps.filter(p => p.lat && p.lng);
  if (propsWithCoords.length) {
    aggLat = +(propsWithCoords.reduce((s, p) => s + parseFloat(p.lat), 0) / propsWithCoords.length).toFixed(4);
    aggLng = +(propsWithCoords.reduce((s, p) => s + parseFloat(p.lng), 0) / propsWithCoords.length).toFixed(4);
  }

  // ── Hreflang locales: which language versions of this destination exist? ──
  // Build the list at build time by checking which mirror files exist.
  const hreflangLocales = [{ locale: 'en', path: `/${slug}/` }];
  const dePath = path.join(process.cwd(), 'content', 'destinations', 'de', `${slug}.html`);
  if (fs.existsSync(dePath)) {
    hreflangLocales.push({ locale: 'de', path: `/de/destinationen/${slug}/` });
  }
  // Future-proof for ES/FR when those destination directories ship.
  const esPath = path.join(process.cwd(), 'content', 'destinations', 'es', `${slug}.html`);
  if (fs.existsSync(esPath)) {
    hreflangLocales.push({ locale: 'es', path: `/es/destinos/${slug}/` });
  }
  const frPath = path.join(process.cwd(), 'content', 'destinations', 'fr', `${slug}.html`);
  if (fs.existsSync(frPath)) {
    hreflangLocales.push({ locale: 'fr', path: `/fr/destinations/${slug}/` });
  }

  return {
    props: {
      slug, title, metaDesc, heroHtml, restHtml,
      properties: matchedProps, related, faqItems, faqData,
      ogImage, minPrice, minCurrency,
      parent, children,
      aggLat, aggLng,
      toc, restWordCount,
      breadcrumbItems: buildBreadcrumbs(slug, destLabel(slug)),
      hreflangLocales,
    },
  };
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function DestinationPage({
  slug, title, metaDesc, heroHtml, restHtml,
  properties, related, faqItems, faqData,
  ogImage, minPrice, minCurrency,
  parent, children,
  aggLat, aggLng,
  toc, restWordCount,
  breadcrumbItems: breadcrumbItemsProp,
  hreflangLocales,
}) {
  const canonicalUrl = `https://co-ownership-property.com/${slug}/`;
  const breadcrumbItems = breadcrumbItemsProp || buildBreadcrumbs(slug, title);
  // Show TOC sidebar on long pages (>5k words restHtml or 4+ H2 headings)
  const tocH2s = (toc || []).filter(h => h.level === 2);
  const showToc = (restWordCount || 0) > 5000 || tocH2s.length >= 4;

  // ── Filter state ──────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState(null);
  // SSR-render only the first N cards so the editorial guide + FAQ land inside
  // the byte budget AI retrieval crawlers fetch (~150KB). Rest reveal client-side.
  const SSR_CARD_CAP = 12;
  const [showAllCards, setShowAllCards] = useState(false);

  // Derive unique region display labels (applies France cluster mapping)
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

  // TouristDestination — gives Google a destination-specific entity to surface
  // in destination-search rich results.
  schemas.push({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": destLabel(slug),
    "description": metaDesc,
    "url": canonicalUrl,
    "image": ogImage,
    ...(aggLat != null && aggLng != null ? {
      "geo": { "@type": "GeoCoordinates", "latitude": aggLat, "longitude": aggLng }
    } : {}),
    ...(Array.isArray(destSameAs[slug]) && destSameAs[slug].length ? {
      "sameAs": destSameAs[slug]
    } : {}),
    "touristType": ["Fractional ownership buyers", "Second-home owners", "Vacation-home buyers"],
  });

  // ItemList — wraps the property grid so each listed property gets indexed as
  // a RealEstateListing. Capped at 20 to keep schema payload manageable.
  if (properties.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListOrder": "https://schema.org/ItemListUnordered",
      "numberOfItems": properties.length,
      "itemListElement": properties.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://co-ownership-property.com/property/${p.slug}/`,
        "name": p.title,
      })),
    });
  }

  // RealEstateAgent — entity-recognition signal for property-related search,
  // helps COP show up in branded + service-type queries (e.g. "fractional ownership agency France")
  schemas.push({
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Co-Ownership Property",
    "url": "https://co-ownership-property.com",
    "logo": "https://co-ownership-property.com/wp-content/uploads/MAIN-LOGO-COP.svg",
    "image": "https://co-ownership-property.com/wp-content/uploads/MAIN-LOGO-COP.svg",
    "description": "Co-Ownership Property (COP) is a curated marketplace for deeded fractional ownership of luxury second homes worldwide — Europe, the United States, Mexico — held in purpose-built LLC structures with full professional management.",
    "areaServed": [
      { "@type": "Country", "name": "France" },
      { "@type": "Country", "name": "Spain" },
      { "@type": "Country", "name": "Italy" },
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "Portugal" },
      { "@type": "Country", "name": "Mexico" },
    ],
    "sameAs": [
      "https://co-ownership-property.com",
    ],
  });

  // Article schema for the long-form editorial body — gives Google a clearer
  // "this is editorial content" signal than the e-commerce property grid above.
  if ((restWordCount || 0) > 1500) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": metaDesc,
      "image": ogImage,
      "wordCount": restWordCount,
      "inLanguage": "en",
      "mainEntityOfPage": canonicalUrl,
      "url": canonicalUrl,
      "author": {
        "@type": "Organization",
        "name": "Co-Ownership Property",
        "url": "https://co-ownership-property.com",
      },
      "publisher": {
        "@type": "Organization",
        "name": "Co-Ownership Property",
        "url": "https://co-ownership-property.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://co-ownership-property.com/wp-content/uploads/MAIN-LOGO-COP.svg",
        },
      },
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
        {/* Hreflang — emits one tag per locale that actually has a destination file */}
        {(hreflangLocales || []).map(({ locale, path: lpath }) => (
          <link key={locale} rel="alternate" hrefLang={locale}
            href={`https://co-ownership-property.com${lpath}`} />
        ))}
        <link rel="alternate" hrefLang="x-default"
          href={`https://co-ownership-property.com/${slug}/`} />
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
          /* ── Property count strip ── */
          .dest-props-count {
            font-size: 14px;
            color: #777;
            margin: 0 0 20px;
            padding-top: 20px;
          }
          .dest-props-count strong {
            color: #2C4A5E;
            font-weight: 600;
          }
          .dest-show-all-wrap {
            text-align: center;
            margin: 32px 0 8px;
          }
          .dest-show-all-btn {
            display: inline-block;
            padding: 13px 34px;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-family: 'Nunito Sans', sans-serif;
            background: transparent;
            color: #2C4A5E;
            border: 1.5px solid #2C4A5E;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.25s;
          }
          .dest-show-all-btn:hover {
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

          /* ── Visible breadcrumbs (also rendered as JSON-LD BreadcrumbList) ── */
          .dest-breadcrumbs {
            max-width: 1400px;
            margin: 0 auto;
            padding: 18px 3rem 0;
            font-family: 'Nunito Sans', Arial, sans-serif;
          }
          .dest-breadcrumbs ol {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 0;
            margin: 0;
            list-style: none;
          }
          .dest-breadcrumbs li {
            font-size: 12px;
            color: #6B8A9E;
            font-weight: 600;
            letter-spacing: 0.04em;
          }
          .dest-breadcrumbs a {
            color: #6B8A9E;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: color 180ms ease, border-color 180ms ease;
          }
          .dest-breadcrumbs a:hover { color: #C9A84C; border-bottom-color: #C9A84C; }
          .dest-breadcrumb-sep { margin: 0 8px; color: #C9A84C; opacity: 0.6; }
          .dest-breadcrumbs li[aria-current="page"], .dest-breadcrumbs span[aria-current="page"] {
            color: #2C4A5E;
          }
          @media (max-width: 768px) {
            .dest-breadcrumbs { padding: 14px 1.5rem 0; }
          }

          /* ── Table of Contents ── (long pages only) — sits right after the
             navy mid-CTA at the top of the editorial body */
          .dest-toc {
            max-width: 1200px;
            margin: 0 auto;
            padding: 36px 3rem 28px;
            background: #fff;
            border-bottom: 1px solid rgba(201,168,76,0.20);
            font-family: 'Nunito Sans', Arial, sans-serif;
          }
          @media (max-width: 768px) { .dest-toc { padding: 28px 1.5rem 24px; } }
          .dest-toc-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.20em;
            text-transform: uppercase;
            color: #6B8A9E;
            margin: 0 0 14px;
          }
          .dest-toc ol {
            list-style: none;
            padding: 0;
            margin: 0;
            counter-reset: toc;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
          }
          @media (max-width: 700px) { .dest-toc ol { grid-template-columns: 1fr; } }
          .dest-toc li {
            counter-increment: toc;
            font-size: 14px;
            line-height: 1.4;
          }
          .dest-toc li::before {
            content: counter(toc, decimal-leading-zero);
            display: inline-block;
            width: 26px;
            color: #C9A84C;
            font-weight: 700;
            font-size: 11px;
          }
          .dest-toc a {
            color: #2C4A5E;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 1px solid transparent;
            transition: color 180ms ease, border-color 180ms ease;
          }
          .dest-toc a:hover { color: #C9A84C; border-bottom-color: #C9A84C; }

          /* Smooth scrolling for in-page anchor jumps */
          html { scroll-behavior: smooth; }
          .dest-article :target {
            scroll-margin-top: 88px;
          }

          /* ── Cluster card: "Part of {Country}" — shown above restHtml on cluster pages ── */
          .dest-cluster-up {
            max-width: 1100px;
            margin: 28px auto 12px;
            padding: 14px 20px;
            background: #F5F2EC;
            border-left: 3px solid #C9A84C;
            display: flex;
            align-items: center;
            gap: 14px;
            font-family: 'Nunito Sans', Arial, sans-serif;
          }
          .dest-cluster-up-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #6B8A9E;
            margin: 0;
          }
          .dest-cluster-up-link {
            font-size: 15px;
            font-weight: 700;
            color: #2C4A5E;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 180ms ease, color 180ms ease;
          }
          .dest-cluster-up-link:hover {
            color: #C9A84C;
            border-bottom-color: #C9A84C;
          }

          /* ── Cluster grid: "Regions in {Country}" — cream-band style so it
             flows with the editorial sections instead of breaking out as a
             foreign navy block. */
          .dest-cluster-down {
            background: #F5F2EC;
            padding: 72px 3rem;
            color: #2C4A5E;
          }
          .dest-cluster-down-inner {
            max-width: 1100px;
            margin: 0 auto;
          }
          .dest-cluster-down-eyebrow {
            font-family: 'Nunito Sans', Arial, sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #C9A84C;
            margin: 0 0 12px;
          }
          .dest-cluster-down-h2 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.7rem, 3.2vw, 2.2rem);
            font-weight: 400;
            color: #2C4A5E;
            margin: 0 0 28px;
            line-height: 1.2;
          }
          .dest-cluster-down-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          @media (max-width: 900px) { .dest-cluster-down-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 560px) { .dest-cluster-down-grid { grid-template-columns: 1fr; } }
          .dest-cluster-down-tile {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 22px;
            background: #fff;
            border: 1px solid rgba(201, 168, 76, 0.20);
            color: #2C4A5E;
            text-decoration: none;
            font-family: 'Nunito Sans', Arial, sans-serif;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.01em;
            transition: border-color 180ms ease, color 180ms ease, transform 220ms ease;
          }
          .dest-cluster-down-tile:hover {
            border-color: #C9A84C;
            color: #C9A84C;
            transform: translateX(2px);
          }
          .dest-cluster-down-tile-arrow {
            color: #C9A84C;
            opacity: 0.7;
            margin-left: 12px;
            transition: opacity 180ms ease;
          }
          .dest-cluster-down-tile:hover .dest-cluster-down-tile-arrow {
            opacity: 1;
          }
          @media (max-width: 768px) {
            .dest-cluster-down { padding: 50px 1.5rem; }
          }
        `}</style>
      </Head>

      <Header />

      {/* Visible breadcrumbs — uses the BreadcrumbList structured data */}
      <nav className="dest-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {breadcrumbItems.map((crumb, i) => (
            <li key={i}>
              {i < breadcrumbItems.length - 1 ? (
                <>
                  <a href={crumb.item.replace('https://co-ownership-property.com', '')}>{crumb.name}</a>
                  <span className="dest-breadcrumb-sep">›</span>
                </>
              ) : (
                <span aria-current="page">{crumb.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Hero */}
      <div dangerouslySetInnerHTML={{ __html: heroHtml }} />

      {/* ── Filter bar — same design as Our Homes, shown when ≥2 region options ── */}
      {properties.length > 0 && filterOptions.length >= 2 && (
        <div className="filter-bar">
          <div className="filter-row">
            <span className="filter-label">Area</span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                <button
                  className={`filter-btn${!activeFilter ? ' active' : ''}`}
                  onClick={() => setActiveFilter(null)}
                >All</button>
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

      {/* Property grid */}
      <div className="dest-props-section">
        <div className="homes-grid-wrap">

          {/* Count + price */}
          {properties.length > 0 && (
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
          )}

          {displayedProperties.length > 0 ? (
            <>
            <div className="homes-grid" id="homes-grid">
              {(showAllCards ? displayedProperties : displayedProperties.slice(0, SSR_CARD_CAP)).map((p, idx) => (
                <PropertyCard key={p.id} property={p} priority={idx < 3} />
              ))}
            </div>
            {!showAllCards && displayedProperties.length > SSR_CARD_CAP && (
              <div className="dest-show-all-wrap">
                <button className="dest-show-all-btn" onClick={() => setShowAllCards(true)}>
                  Show all {displayedProperties.length} properties &rarr;
                </button>
              </div>
            )}
            </>
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

      {/* ── Cluster card: "Part of {Country}" — links up the pillar/cluster hierarchy ── */}
      {parent && (
        <aside className="dest-cluster-up" aria-label={`Part of ${parent.label}`}>
          <p className="dest-cluster-up-eyebrow">Part of</p>
          <a href={`/${parent.slug}/`} className="dest-cluster-up-link">
            {parent.label} fractional ownership →
          </a>
        </aside>
      )}

      {/* Rest of editorial content (internal links injected at build time).
          The TOC is rendered as the FIRST element of the editorial body via
          a build-time inject below, so the natural reading flow is:
          property grid → mid-CTA → TOC → §A onwards. */}
      <article className="dest-article" dangerouslySetInnerHTML={{
        __html: showToc && tocH2s.length > 0
          ? injectTocAfterMidCta(restHtml, tocH2s)
          : restHtml
      }} />

      {/* ── Cluster grid: "Regions in {Country}" — pillar pages link down to all clusters ── */}
      {children && children.length > 0 && (
        <section className="dest-cluster-down" aria-label={`Regions in ${destLabel(slug)}`}>
          <div className="dest-cluster-down-inner">
            <p className="dest-cluster-down-eyebrow">Explore</p>
            <h2 className="dest-cluster-down-h2">Regions in {destLabel(slug)}</h2>
            <div className="dest-cluster-down-grid">
              {children.map(c => (
                <a key={c.slug} href={`/${c.slug}/`} className="dest-cluster-down-tile">
                  {c.label}
                  <span className="dest-cluster-down-tile-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ section — rendered from destination-faqs.json using homepage design ── */}
      {faqData && faqData.items && faqData.items.length > 0 && (
        <section className="faq-section">
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 3rem' }}>
            <p className="faq-eyebrow">Questions &amp; Answers</p>
            <h2 className="faq-heading">{faqData.title}</h2>
            <div className="faq-list">
              {faqData.items.map((item, i) => (
                <details key={i} className="faq-item">
                  <summary className="faq-q"><span>{item.q}</span></summary>
                  <div className="faq-a" dangerouslySetInnerHTML={{ __html: item.a }} />
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Also Explore — hidden on pillar pages (children.length > 0), because
          the "Regions in {Country}" cluster nav above already covers that role.
          Shown on cluster/region/city pages where it serves siblings + parent. */}
      {related && related.length > 0 && (!children || children.length === 0) && (
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
