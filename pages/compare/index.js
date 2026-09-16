/**
 * pages/compare/index.js — the comparison hub.
 *
 * /compare used to 308 to the timeshare page, which meant the one URL people
 * and answer engines would naturally try had no page behind it, and the six
 * comparisons linked to nothing but themselves. This is the hub: one
 * indexable page, an ItemList so the set is legible to a machine, and real
 * internal links between pages that were previously orphans.
 *
 * Content comes from lib/compare-meta.json, so a new comparison appears here
 * the moment it is registered — there is no second list to keep in step.
 */
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const SITE_URL = 'https://co-ownership-property.com';

// The order a buyer actually needs them in: what is this thing, then is it
// worth it, then who from, then why through us.
const ORDER = [
  'fractional-ownership-vs-timeshare',
  'fractional-ownership-vs-second-home',
  'pacaso-vs-myne',
  'myne-vs-vivla',
  'pacaso-vs-vivla',
  'cop-vs-going-direct',
];

const GROUPS = [
  {
    key: 'model',
    heading: 'Is co-ownership the right thing at all?',
    blurb: 'Before the operator matters, the model has to. These two answer the questions everybody asks first — whether this is a timeshare wearing a better suit, and whether it beats simply buying a whole house.',
    slugs: ['fractional-ownership-vs-timeshare', 'fractional-ownership-vs-second-home'],
  },
  {
    key: 'operators',
    heading: 'Which operator suits you',
    blurb: 'The models differ in ways that decide the purchase: nights a year, whether you may let the home, how resale works, and where the houses are. Compared side by side, on the same facts, in the same order.',
    slugs: ['pacaso-vs-myne', 'myne-vs-vivla', 'pacaso-vs-vivla'],
  },
  {
    key: 'route',
    heading: 'And how you buy',
    blurb: 'The question we are asked most often, answered plainly.',
    slugs: ['cop-vs-going-direct'],
  },
];

export async function getStaticProps() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'compare-meta.json'), 'utf-8'));
  const known = new Set(Object.keys(meta));
  const items = ORDER.filter(s => known.has(s)).map(slug => ({
    slug,
    h1: meta[slug].h1 || meta[slug].title,
    subtitle: meta[slug].subtitle || meta[slug].metaDescription,
    dateModified: meta[slug].dateModified || null,
  }));
  // Anything registered but not in ORDER still appears, rather than vanishing.
  for (const slug of Object.keys(meta)) {
    if (!ORDER.includes(slug)) {
      items.push({ slug, h1: meta[slug].h1 || meta[slug].title, subtitle: meta[slug].subtitle || '', dateModified: meta[slug].dateModified || null });
    }
  }
  const groups = GROUPS.map(g => ({
    ...g,
    items: g.slugs.map(s => items.find(i => i.slug === s)).filter(Boolean),
  })).filter(g => g.items.length);
  const ungrouped = items.filter(i => !GROUPS.some(g => g.slugs.includes(i.slug)));
  return { props: { items, groups, ungrouped }, revalidate: 3600 };
}

export default function CompareHub({ items, groups, ungrouped }) {
  // Front-loaded: the site name is appended after this, and Google truncates
  // the tail, so the words that must survive go first.
  const title = 'Co-Ownership Compared: Operators, Timeshare, Outright';
  const description = 'Six comparisons in one place: co-ownership against timeshare and against a whole second home, Pacaso, MYNE and Vivla side by side, and agent versus direct.';
  const canonical = `${SITE_URL}/compare/`;

  const graph = [
    {
      '@type': 'CollectionPage',
      '@id': `${canonical}#page`,
      url: canonical,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#list`,
      name: 'Co-ownership comparisons',
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.h1,
        url: `${SITE_URL}/compare/${it.slug}/`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: canonical },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>{`${title} | Co-Ownership Property`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }} />
      </Head>

      <Header />

      <article className="compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">Compare</p>
          <h1 className="compare-h1">Co-ownership, compared</h1>
          <p className="compare-subtitle">
            Every question a buyer asks before committing, answered in one place and on the same
            facts. We list homes from six operators and are paid by none of them until something
            completes, which is why these read like comparisons rather than advertisements.
          </p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner">
            {groups.map(group => (
              <section key={group.key} className="cmp-group">
                <h2>{group.heading}</h2>
                <p>{group.blurb}</p>
                <ul className="cmp-list">
                  {group.items.map(it => (
                    <li key={it.slug}>
                      <Link href={`/compare/${it.slug}/`}>
                        <strong>{it.h1}</strong>
                        <span>{it.subtitle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {ungrouped.length > 0 && (
              <section className="cmp-group">
                <h2>More comparisons</h2>
                <ul className="cmp-list">
                  {ungrouped.map(it => (
                    <li key={it.slug}>
                      <Link href={`/compare/${it.slug}/`}>
                        <strong>{it.h1}</strong>
                        <span>{it.subtitle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="cmp-group">
              <h2>Or skip the reading</h2>
              <p>
                The comparisons matter less once you have a home in front of you with its price, its
                running cost and its usage terms printed on the page. That is what every listing
                here carries.
              </p>
              <p>
                <Link href="/our-homes/">Browse the homes &rarr;</Link>
              </p>
            </section>
          </div>
        </section>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
