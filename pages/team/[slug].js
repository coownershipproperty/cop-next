/**
 * pages/team/[slug].js
 *
 * Renderer for /team/{slug}/ — full editorial bio pages for COP team
 * members (David Olsson, Dylan Olsson, etc.).
 *
 * Each page emits a Schema.org @graph with:
 *   WebPage + ProfilePage + Person + BreadcrumbList
 *
 * The Person node uses the same @id that's used in /about-us/ schema
 * (https://co-ownership-property.com/about-us/#david-olsson, etc.) so AI
 * engines reconcile the entity across pages — the bio here, the team
 * section on /about-us/, and the byline references on blog/compare/partners
 * pages all describe one canonical Person.
 *
 * Content lives in:  content/team/{slug}.html
 * Metadata in:       lib/team-meta.json
 */

import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const SITE_URL = 'https://co-ownership-property.com';

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
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
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'team-meta.json'), 'utf-8'));
  return {
    paths: Object.keys(meta).map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'team-meta.json'), 'utf-8'));
  const entry = meta[slug];
  if (!entry) return { notFound: true };

  const contentPath = path.join(process.cwd(), 'content', 'team', `${slug}.html`);
  if (!fs.existsSync(contentPath)) return { notFound: true };

  let body = fs.readFileSync(contentPath, 'utf-8');
  body = injectH2Ids(body);

  const wordCount = stripTags(body).split(/\s+/).filter(Boolean).length;

  return { props: { slug, entry, body, wordCount }, revalidate: 3600 };
}

export default function TeamMemberPage({ slug, entry, body, wordCount }) {
  const canonicalUrl = `${SITE_URL}/team/${slug}/`;
  // Reuse the canonical Person @id from /about-us/ so the entity is one
  // and the same across all pages that reference this team member.
  const personId = `${SITE_URL}/about-us/#${slug}`;
  const fullTitle = `${entry.title} | Co-Ownership Property`;

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl + "#webpage",
      "url": canonicalUrl,
      "name": fullTitle,
      "description": entry.metaDescription,
      "inLanguage": "en",
      "isPartOf": { "@id": SITE_URL + "/#website" },
      "about": { "@id": personId },
      "mainEntity": { "@id": personId },
      "publisher": { "@id": SITE_URL + "/#organization" },
      "breadcrumb": { "@id": canonicalUrl + "#breadcrumb" },
    },
    {
      "@type": "ProfilePage",
      "@id": canonicalUrl + "#profilepage",
      "url": canonicalUrl,
      "name": entry.title,
      "isPartOf": { "@id": canonicalUrl + "#webpage" },
      "about": { "@id": personId },
      "mainEntity": { "@id": personId },
    },
    {
      "@type": "Person",
      "@id": personId,
      "name": entry.name,
      "givenName": entry.givenName,
      "familyName": entry.familyName,
      "jobTitle": entry.jobTitle,
      "description": entry.subtitle,
      "image": entry.image,
      "url": canonicalUrl,
      "knowsAbout": entry.knowsAbout,
      "knowsLanguage": entry.knowsLanguage,
      "worksFor": { "@id": SITE_URL + "/#organization" },
      "mainEntityOfPage": { "@id": canonicalUrl + "#profilepage" },
      "sameAs": [],
    },
    {
      "@type": "BreadcrumbList",
      "@id": canonicalUrl + "#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
        { "@type": "ListItem", "position": 2, "name": "About Us", "item": SITE_URL + "/about-us/" },
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
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={entry.ogImage} />
        <meta property="profile:first_name" content={entry.givenName} />
        <meta property="profile:last_name" content={entry.familyName} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }) }} />
      </Head>

      <Header />

      <article className="compare-page team-page">
        <section className="team-hero">
          <div className="team-hero-inner">
            <div className="team-hero-photo">
              <Image src={entry.image} alt={entry.name} fill style={{objectFit: 'cover'}} sizes="180px" priority />
            </div>
            <div className="team-hero-text">
              <p className="compare-eyebrow">{entry.jobTitle} · Co-Ownership Property</p>
              <h1 className="compare-h1">{entry.name}</h1>
              {entry.subtitle && <p className="compare-subtitle" style={{margin: '0 0 16px'}}>{entry.subtitle}</p>}
              <p className="compare-meta" style={{justifyContent: 'flex-start'}}>
                <span className="compare-date-inline">Updated {new Date(entry.dateModified).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="compare-wc-inline">{Math.round(wordCount / 100) * 100} words</span>
              </p>
            </div>
          </div>
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
