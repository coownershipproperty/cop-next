/**
 * lib/guide-page-data.js — getStaticProps/Paths for every buyer guide.
 *
 * Server-only. One function per locale so the four language versions of a
 * guide cannot drift apart in structure, and so a locale only advertises an
 * hreflang alternate once its translation actually exists on disk.
 */
import fs from 'fs';
import path from 'path';
import { GUIDE_ORDER } from '@/lib/guides-hub-copy';

export const GUIDE_LOCALES = ['en', 'es', 'fr', 'de'];
const META_FILE = { en: 'guides-meta.json', es: 'guides-meta-es.json', fr: 'guides-meta-fr.json', de: 'guides-meta-de.json' };
const CONTENT_DIR = 'content/guides';

function contentPath(locale, slug) {
  return locale === 'en'
    ? path.join(process.cwd(), CONTENT_DIR, `${slug}.html`)
    : path.join(process.cwd(), CONTENT_DIR, locale, `${slug}.html`);
}

function metaPath(locale) {
  return path.join(process.cwd(), 'lib', META_FILE[locale]);
}

export function readGuideMeta(locale) {
  const p = metaPath(locale);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ').trim();
}

export function extractFaqsFromHtml(bodyHtml) {
  const faqs = [];
  const sectionMatch = bodyHtml.match(/<section[^>]*class="[^"]*compare-faq-section[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!sectionMatch) return faqs;
  const parts = sectionMatch[1].split(/<h3[^>]*>/i);
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const qEnd = chunk.indexOf('</h3>');
    if (qEnd < 0) continue;
    const question = stripTags(chunk.slice(0, qEnd));
    const after = chunk.slice(qEnd + 5);
    const pMatches = [...after.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    if (!pMatches.length) continue;
    const answerParts = pMatches.map(m => stripTags(m[1])).filter(Boolean);
    if (!answerParts.length) continue;
    faqs.push({ question, answer: answerParts.join(' ') });
  }
  return faqs;
}

function injectH2Ids(html) {
  return html.replace(/<h2(?![^>]*\sid=)([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const text = stripTags(inner).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
    return `<h2${attrs} id="${text}">${inner}</h2>`;
  });
}

export function guideStaticPaths(locale) {
  const meta = readGuideMeta(locale);
  const paths = Object.keys(meta)
    .filter(slug => fs.existsSync(contentPath(locale, slug)))
    .map(slug => ({ params: { slug } }));
  return { paths, fallback: 'blocking' };
}

export function buildGuideProps(locale, slug) {
  const meta = readGuideMeta(locale);
  const entry = meta[slug];
  if (!entry) return { notFound: true };
  const cp = contentPath(locale, slug);
  if (!fs.existsSync(cp)) return { notFound: true };
  let body = injectH2Ids(fs.readFileSync(cp, 'utf-8'));
  const faqs = extractFaqsFromHtml(body);
  const wordCount = stripTags(body).split(/\s+/).filter(Boolean).length;
  const altLocales = GUIDE_LOCALES.filter(loc => fs.existsSync(contentPath(loc, slug)) && readGuideMeta(loc)[slug]);
  return { props: { locale, slug, entry, body, faqs, wordCount, section: 'guide', altLocales }, revalidate: 3600 };
}

export function buildGuideHubProps(locale) {
  const meta = readGuideMeta(locale);
  const present = Object.keys(meta).filter(slug => fs.existsSync(contentPath(locale, slug)));
  const ordered = [...GUIDE_ORDER.filter(s => present.includes(s)), ...present.filter(s => !GUIDE_ORDER.includes(s))];
  const items = ordered.map(slug => ({
    slug,
    country: meta[slug].country || '',
    h1: meta[slug].h1 || meta[slug].title,
    subtitle: meta[slug].subtitle || meta[slug].metaDescription || '',
    homesListed: meta[slug].homesListed || null,
  }));
  // A locale appears in the hreflang set only once it has at least one guide.
  const altLocales = GUIDE_LOCALES.filter(loc => {
    const m = readGuideMeta(loc);
    return Object.keys(m).some(slug => fs.existsSync(contentPath(loc, slug)));
  });
  return { props: { locale, items, altLocales }, revalidate: 3600 };
}
