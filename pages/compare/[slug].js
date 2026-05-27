/**
 * pages/compare/[slug].js
 *
 * Renderer for /compare/{slug}/ — operational comparison pages.
 *
 * Each page emits a Schema.org @graph with:
 *   WebPage + Article + FAQPage + BreadcrumbList
 *
 * The Article's author is linked by @id to the canonical David Person
 * entity on /about-us/ so AI engines see one consistent founder identity
 * across COP. When the comparison names specific partner operators
 * (Pacaso vs MYNE, etc.) the page also emits a `mentions` array linking
 * each operator's canonical URL so co-occurrence is explicit.
 *
 * Content lives in:  content/compare/{slug}.html  — editorial body
 * Metadata lives in: lib/compare-meta.json        — title, og image, etc.
 *
 * Pattern matches pages/[slug].js (destinations) — static HTML body + JSON
 * metadata + dynamic schema renderer.
 */

import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const SITE_URL = 'https://co-ownership-property.com';

// ── Helpers ────────────────────────────────────────────────────────────────
function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Walk the `.compare-faq-section` block in the body and pull out
// <h3>Q</h3><p>A1</p><p>A2</p> blocks into Q&A pairs for FAQPage schema.
function extractFaqsFromHtml(bodyHtml) {
  const faqs = [];
  const sectionMatch = bodyHtml.match(/<section[^>]*class="[^"]*compare-faq-section[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  if (!sectionMatch) return faqs;
  const inner = sectionMatch[1];
  // Split on <h3> markers, then for each chunk extract Q + all following <p> until next <h3>
  const parts = inner.split(/<h3[^>]*>/i);
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
    const answer = answerParts.join(' ');
    faqs.push({ question, answer });
  }
  return faqs;
}

// Auto-add stable id="" attributes to H2 headings so anchor links work.
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

// ── getStaticPaths ─────────────────────────────────────────────────────────
export async function getStaticPaths() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'compare-meta.json'), 'utf-8'));
  return {
    paths: Object.keys(meta).map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

// ── getStaticProps ─────────────────────────────────────────────────────────
export async function getStaticProps({ params }) {
  const { slug } = params;
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'compare-meta.json'), 'utf-8'));
  const entry = meta[slug];
  if (!entry) return { notFound: true };

  const contentPath = path.join(process.cwd(), 'content', 'compare', `${slug}.html`);
  if (!fs.existsSync(contentPath)) return { notFound: true };

  let body = fs.readFileSync(contentPath, 'utf-8');
  body = injectH2Ids(body);

  const faqs = extractFaqsFromHtml(body);
  const wordCount = stripTags(body).split(/\s+/).filter(Boolean).length;

  return {
    props: { slug, entry, body, faqs, wordCount },
    revalidate: 3600,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ComparePage({ slug, entry, body, faqs, wordCount }) {
  const canonicalUrl = `${SITE_URL}/compare/${slug}/`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  // ── Schema.org entity graph ──────────────────────────────────────────────
  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl + "#webpage",
      "url": canonicalUrl,
      "name": fullTitle,
      "description": entry.metaDescription,
      "inLanguage": "en",
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": SITE_URL + "/#organization" },
      "mainEntity": { "@id": canonicalUrl + "#article" },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": canonicalUrl + "#breadcrumb" },
    },
    {
      "@type": "Article",
      "@id": canonicalUrl + "#article",
      "headline": entry.h1,
      "description": entry.metaDescription,
      "url": canonicalUrl,
      "image": entry.ogImage,
      "datePublished": entry.datePublished,
      "dateModified": entry.dateModified,
      "wordCount": wordCount,
      "author": {
        "@type": "Person",
        "@id": SITE_URL + "/about-us/#david-olsson",
        "name": "David Olsson",
        "url": SITE_URL + "/about-us/",
      },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "mainEntityOfPage": { "@id": canonicalUrl + "#webpage" },
      ...(Array.isArray(entry.mentionsBrands) && entry.mentionsBrands.length > 0 ? {
        "mentions": entry.mentionsBrands.map(b => ({
          "@type": "Organization",
          "name": b.name,
          "url": b.url,
        })),
      } : {}),
    },
    ...(faqs.length > 0 ? [{
      "@type": "FAQPage",
      "@id": canonicalUrl + "#faq",
      "inLanguage": "en",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer },
      })),
    }] : []),
    {
      "@type": "BreadcrumbList",
      "@id": canonicalUrl + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": "Compare", "item": SITE_URL + "/compare/" },
        { "@type": "ListItem", "position": 3, "name": entry.h1, "item": canonicalUrl },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={entry.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={entry.title} />
        <meta property="og:description" content={entry.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={entry.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }) }} />
      </Head>

      <Header />

      <article className="compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">Comparison Guide</p>
          <h1 className="compare-h1">{entry.h1}</h1>
          {entry.subtitle && <p className="compare-subtitle">{entry.subtitle}</p>}
          <p className="compare-meta">
            <span className="compare-byline">
              By <a href={SITE_URL + '/about-us/'} rel="author">David Olsson</a>
            </span>
            <span className="compare-date-inline">Updated {new Date(entry.dateModified).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="compare-wc-inline">{Math.round(wordCount / 100) * 100} words · {Math.ceil(wordCount / 230)} min read</span>
          </p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner" dangerouslySetInnerHTML={{ __html: body }} />
        </section>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
