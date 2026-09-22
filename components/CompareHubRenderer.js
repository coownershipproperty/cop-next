import PublicArticleBody from '@/components/PublicArticleBody';
import PublicPageHeader from '@/components/PublicPageHeader';
/**
 * components/CompareHubRenderer.js — the comparison hub in any language.
 *
 * pages/compare/index.js is the English hub and predates this; the three
 * locale hubs all render through here. Content comes from the locale's own
 * compare-meta-{lang}.json, so a comparison appears in a language the moment
 * that language has a translation of it, and never before.
 */
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';
import { HUB_COPY } from '@/lib/compare-hub-groups';
import { ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';
const HOMES_PATH = { en: '/our-homes/', es: '/es/propiedades/', fr: '/fr/proprietes/', de: '/de/immobilien/' };
const HOME_PATH = { en: '/', es: '/es/', fr: '/fr/', de: '/de/' };

export default function CompareHubRenderer({ locale, items, groups, ungrouped, alternates }) {
  const ui = UI_STRINGS[locale];
  const copy = HUB_COPY[locale];
  const sectionPath = URL_PATHS[locale].compare;
  const canonical = `${SITE_URL}${sectionPath}/`;
  const homesHref = HOMES_PATH[locale] || '/our-homes/';

  const graph = [
    {
      '@type': 'CollectionPage',
      '@id': `${canonical}#page`,
      url: canonical,
      name: copy.title,
      description: copy.description,
      inLanguage: locale,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#list`,
      name: copy.listName,
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.h1,
        url: `${SITE_URL}${sectionPath}/${it.slug}/`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: ui.homeLabel, item: `${SITE_URL}${HOME_PATH[locale] || '/'}` },
        { '@type': 'ListItem', position: 2, name: ui.compareLabel, item: canonical },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>{`${copy.title} | Co-Ownership Property`}</title>
        <meta name="description" content={copy.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        {alternates.map(a => (
          <link key={a.lang} rel="alternate" hrefLang={a.lang} href={`${SITE_URL}${a.path}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/compare/`} />
        <meta property="og:title" content={copy.title} />
        <meta property="og:description" content={copy.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }} />
      </Head>

      <Header />

      <article className="compare-page">
        <PublicPageHeader>
          <p className="compare-eyebrow">{copy.eyebrow}</p>
          <h1 className="compare-h1">{copy.h1}</h1>
          <p className="compare-subtitle">{copy.subtitle}</p>
        </PublicPageHeader>

        <PublicArticleBody>
          <div className="compare-body-inner">
            {groups.map(group => (
              <section key={group.key} className="cmp-group">
                <h2>{group.heading}</h2>
                <p>{group.blurb}</p>
                <ul className="cmp-list">
                  {group.items.map(it => (
                    <li key={it.slug}>
                      <Link href={`${sectionPath}/${it.slug}/`}>
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
                <h2>{copy.moreHeading}</h2>
                <ul className="cmp-list">
                  {ungrouped.map(it => (
                    <li key={it.slug}>
                      <Link href={`${sectionPath}/${it.slug}/`}>
                        <strong>{it.h1}</strong>
                        <span>{it.subtitle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="cmp-group">
              <h2>{copy.skipHeading}</h2>
              <p>{copy.skipBody}</p>
              <p>
                <Link href={homesHref}>{copy.skipLink} &rarr;</Link>
              </p>
            </section>
          </div>
        </PublicArticleBody>
      </article>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
