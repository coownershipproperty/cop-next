/**
 * pages/faq/[slug].js — English FAQ / Q&A pages
 *
 * Thin wrapper around components/FaqPageRenderer. Reads English content
 * from content/faq/{slug}.html and metadata from lib/faq-meta.json,
 * then delegates rendering. Locale-specific siblings will live at
 * pages/{es,fr,de}/{preguntas,questions,fragen}/[slug].js once translated.
 *
 * Mirrors pages/compare/[slug].js exactly.
 */

import fs from 'fs';
import path from 'path';
import FaqPageRenderer from '@/components/FaqPageRenderer';

const LOCALE = 'en';
const META_FILE = 'faq-meta.json';
const CONTENT_DIR = 'content/faq';

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFaqsFromHtml(bodyHtml) {
  const faqs = [];
  // Capture <h2> followed by paragraphs as Q&A pairs (each H2 becomes one
  // additional Question in the FAQPage schema). Skips H2s that look like
  // section dividers ("Further reading", "Related questions").
  const parts = bodyHtml.split(/<h2[^>]*>/i);
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const qEnd = chunk.indexOf('</h2>');
    if (qEnd < 0) continue;
    const question = stripTags(chunk.slice(0, qEnd));
    if (!question || /further reading|related questions/i.test(question)) continue;
    const after = chunk.slice(qEnd + 5);
    const pMatches = [...after.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    if (!pMatches.length) continue;
    const answerParts = pMatches.slice(0, 3).map(m => stripTags(m[1])).filter(Boolean);
    if (!answerParts.length) continue;
    faqs.push({ question, answer: answerParts.join(' ') });
  }
  return faqs;
}

function injectH2Ids(html) {
  return html.replace(/<h2(?![^>]*\sid=)([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const text = stripTags(inner).toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
    return `<h2${attrs} id="${text}">${inner}</h2>`;
  });
}

export async function getStaticPaths() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', META_FILE), 'utf-8'));
  return {
    paths: Object.keys(meta).map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
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

  // Resolve related slugs from meta to full entries for the related-questions
  // sidebar at the bottom of each page.
  const related = (entry.related || [])
    .map(s => meta[s] ? { slug: s, h1: meta[s].h1 } : null)
    .filter(Boolean)
    .slice(0, 6);

  return { props: { locale: LOCALE, slug, entry, body, faqs, wordCount, related }, revalidate: 3600 };
}

export default function EnFaqPage(props) {
  return <FaqPageRenderer {...props} />;
}
