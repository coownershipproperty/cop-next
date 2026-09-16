/**
 * pages/how-to-buy/index.js — the buyer-guide hub.
 *
 * Four countries, one page each, and a page here so the set has an index
 * rather than four orphans. Counts and prices come from lib/guides-meta.json
 * so the hub cannot say 82 while the Spain page says something else.
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
const ORDER = ['spain', 'france', 'italy', 'usa'];

export async function getStaticProps() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'guides-meta.json'), 'utf-8'));
  const items = ORDER.filter(s => meta[s]).map(slug => ({
    slug,
    country: meta[slug].country,
    h1: meta[slug].h1,
    subtitle: meta[slug].subtitle,
    homesListed: meta[slug].homesListed || null,
  }));
  for (const slug of Object.keys(meta)) {
    if (!ORDER.includes(slug)) items.push({ slug, country: meta[slug].country, h1: meta[slug].h1, subtitle: meta[slug].subtitle, homesListed: meta[slug].homesListed || null });
  }
  return { props: { items }, revalidate: 3600 };
}

export default function BuyerGuideHub({ items }) {
  const title = 'How to Buy a Co-Ownership Share: Country Guides';
  const description = 'What you actually own, the taxes you do and do not pay, the steps in order and what it costs — for Spain, France, Italy and the United States.';
  const canonical = `${SITE_URL}/how-to-buy/`;

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
      name: 'Country buyer guides',
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.h1,
        url: `${SITE_URL}/how-to-buy/${it.slug}/`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Buyer’s guides', item: canonical },
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
          <p className="compare-eyebrow">Buyer’s Guide</p>
          <h1 className="compare-h1">How to buy, country by country</h1>
          <p className="compare-subtitle">
            What you would actually own, which taxes apply and which do not, what the purchase costs
            and how long it takes — written for one country at a time, because the structure and the
            tax change at every border and almost nothing else about the model does.
          </p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner">
            <section className="cmp-group">
              <h2>The four markets we cover</h2>
              <p>
                Between them these four hold 234 of the 268 homes we list. Each guide is built from
                the listings in that country — the prices and running costs are measured, not
                estimated — and links through to the tax and legal answers in full.
              </p>
              <ul className="cmp-list">
                {items.map(it => (
                  <li key={it.slug}>
                    <Link href={`/how-to-buy/${it.slug}/`}>
                      <strong>{it.h1}{it.homesListed ? ` — ${it.homesListed} homes` : ''}</strong>
                      <span>{it.subtitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-group">
              <h2>What these guides are not</h2>
              <p>
                They are not tax advice. They describe how the structure works and which taxes it
                does and does not trigger, which is a question about the model rather than about
                you. Your own position depends on where you are resident, what else you own and
                which treaty applies — take specialist advice before you sign, and every operator
                will tell you the same.
              </p>
            </section>

            <section className="cmp-group">
              <h2>Before the country, the operator</h2>
              <p>
                If you have not settled on who to buy from yet, that comes first — the operators
                differ on nights a year, on whether you may let the home, on resale and on where
                they sell at all.
              </p>
              <p>
                <Link href="/compare/which-co-ownership-operator/">Which operator suits which buyer &rarr;</Link>
              </p>
              <p>
                <Link href="/our-homes/">Or browse all 268 homes &rarr;</Link>
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
