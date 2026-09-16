/**
 * pages/how-to-buy/[slug].js — per-country buyer guides.
 *
 * The site had 236 FAQ pages, roughly thirty of them tax and legal, and no
 * page that assembled them into one journey for a buyer in one country. The
 * tax answers existed; nobody could find them in the order they need them.
 * These guides are that order: structure, what you need, the steps, the
 * cost measured from our own listings, tax, stay limits, letting, financing.
 *
 * Renders through ComparePageRenderer with section="guide" — same shape of
 * page, same CSS, different breadcrumb and hreflang set.
 */

import fs from 'fs';
import path from 'path';
import ComparePageRenderer from '@/components/ComparePageRenderer';

const LOCALE = 'en';
const META_FILE = 'guides-meta.json';
const CONTENT_DIR = 'content/guides';

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/\s+/g, ' ').trim();
}

function extractFaqsFromHtml(bodyHtml) {
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

export async function getStaticPaths() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', META_FILE), 'utf-8'));
  return { paths: Object.keys(meta).map(slug => ({ params: { slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', META_FILE), 'utf-8'));
  const entry = meta[slug];
  if (!entry) return { notFound: true };
  const contentPath = path.join(process.cwd(), CONTENT_DIR, `${slug}.html`);
  if (!fs.existsSync(contentPath)) return { notFound: true };
  let body = fs.readFileSync(contentPath, 'utf-8');
  body = injectH2Ids(body);
  const faqs = extractFaqsFromHtml(body);
  const wordCount = stripTags(body).split(/\s+/).filter(Boolean).length;
  // A locale only gets an hreflang alternate once its translation exists.
  const altLocales = ['en', ...['es', 'fr', 'de'].filter(loc => fs.existsSync(path.join(process.cwd(), CONTENT_DIR, loc, `${slug}.html`)))];
  return { props: { locale: LOCALE, slug, entry, body, faqs, wordCount, section: 'guide', altLocales }, revalidate: 3600 };
}

export default function BuyerGuidePage(props) {
  return <ComparePageRenderer {...props} />;
}
