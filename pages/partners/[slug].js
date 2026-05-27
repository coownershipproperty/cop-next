/**
 * pages/partners/[slug].js
 *
 * Renderer for /partners/{slug}/ — operational profile pages for each
 * partner operator whose properties are sold through Co-Ownership Property
 * (Pacaso, MYNE, Vivla, &Hamlet, Abitaro).
 *
 * Each page emits a Schema.org @graph with:
 *   WebPage + AboutPage + Article + Organization (the partner) + FAQPage
 *   + BreadcrumbList
 *
 * The Organization node has @id matching the partner's canonical entity
 * (used by AI engines for cross-page entity linking). The Article's author
 * is linked via @id to the canonical David Person entity on /about-us/.
 * The page's `mentions` array surfaces the partner Organization so AI
 * engines build co-occurrence between COP and the operator.
 *
 * Content lives in:  content/partners/{slug}.html
 * Metadata in:       lib/partners-meta.json
 *
 * Mirrors pages/compare/[slug].js architecturally.
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
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'partners-meta.json'), 'utf-8'));
  return {
    paths: Object.keys(meta).map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

// ── getStaticProps ─────────────────────────────────────────────────────────
export async function getStaticProps({ params }) {
  const { slug } = params;
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'partners-meta.json'), 'utf-8'));
  const entry = meta[slug];
  if (!entry) return { notFound: true };

  const contentPath = path.join(process.cwd(), 'content', 'partners', `${slug}.html`);
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
export default function PartnerPage({ slug, entry, body, faqs, wordCount }) {
  const canonicalUrl = `${SITE_URL}/partners/${slug}/`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  // Partner Organization @id — used for entity linking and the mentions array
  const partnerOrgId = `${SITE_URL}/partners/${slug}/#partner-organization`;

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
      "about": { "@id": partnerOrgId },
      "mainEntity": { "@id": canonicalUrl + "#article" },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": canonicalUrl + "#breadcrumb" },
    },
    {
      "@type": "AboutPage",
      "@id": canonicalUrl + "#aboutpage",
      "url": canonicalUrl,
      "name": entry.title,
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "about": { "@id": partnerOrgId },
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
        "url": SITE_URL + "/team/david-olsson/",
      },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "mainEntityOfPage": { "@id": canonicalUrl + "#webpage" },
      "about": { "@id": partnerOrgId },
      "mentions": [{ "@id": partnerOrgId }],
    },
    {
      "@type": "Organization",
      "@id": partnerOrgId,
      "name": entry.name,
      "legalName": entry.legalName,
      "url": entry.website,
      "foundingDate": entry.founded,
      ...(entry.headquarters ? {
        "address": {
          "@type": "PostalAddress",
          "addressLocality": entry.headquarters,
        },
      } : {}),
      "description": entry.subtitle,
      ...(Array.isArray(entry.countriesCoverage) ? {
        "areaServed": entry.countriesCoverage.map(c => ({ "@type": "Country", "name": c })),
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
        { "@type": "ListItem", "position": 2, "name": "Partners", "item": SITE_URL + "/partners/" },
        { "@type": "ListItem", "position": 3, "name": entry.name, "item": canonicalUrl },
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

      <article className="compare-page partner-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">Partner Profile</p>
          <h1 className="compare-h1">{entry.h1.replace(' [2026]', '')}</h1>
          {entry.subtitle && <p className="compare-subtitle">{entry.subtitle}</p>}
          <p className="compare-meta">
            <span className="compare-byline">
              By <a href={SITE_URL + '/team/david-olsson/'} rel="author">David Olsson</a>
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
