/**
 * components/GuideHubRenderer.js — the buyer-guide hub in any language.
 * Counts and subtitles come from that locale's guides-meta file, so the hub
 * cannot say 82 while the Spain page says something else.
 */
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { UI_STRINGS, URL_PATHS } from '@/lib/locale-ui-strings';
import { GUIDE_HUB_COPY } from '@/lib/guides-hub-copy';
import { ogLocaleFor } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';
const HOMES_PATH = { en: '/our-homes/', es: '/es/propiedades/', fr: '/fr/proprietes/', de: '/de/immobilien/' };
const HOME_PATH = { en: '/', es: '/es/', fr: '/fr/', de: '/de/' };

export default function GuideHubRenderer({ locale, items, altLocales, copy: copyProp }) {
  const ui = UI_STRINGS[locale];
  // `copy` arrives from getStaticProps with the {{inventory}} tokens filled.
  const copy = copyProp || GUIDE_HUB_COPY[locale];
  const sectionPath = URL_PATHS[locale].guide;
  const canonical = `${SITE_URL}${sectionPath}/`;
  const comparePath = URL_PATHS[locale].compare;

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
        { '@type': 'ListItem', position: 2, name: ui.guideLabel, item: canonical },
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
        {altLocales.map(loc => (
          <link key={loc} rel="alternate" hrefLang={loc} href={`${SITE_URL}${URL_PATHS[loc].guide}/`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${URL_PATHS.en.guide}/`} />
        <meta property="og:title" content={copy.title} />
        <meta property="og:description" content={copy.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }} />
      </Head>

      <Header />

      <article className="compare-page">
        <section className="compare-hero">
          <p className="compare-eyebrow">{copy.eyebrow}</p>
          <h1 className="compare-h1">{copy.h1}</h1>
          <p className="compare-subtitle">{copy.subtitle}</p>
        </section>

        <section className="compare-body">
          <div className="compare-body-inner">
            <section className="cmp-group">
              <h2>{copy.marketsHeading}</h2>
              <p>{copy.marketsBlurb}</p>
              <ul className="cmp-list">
                {items.map(it => (
                  <li key={it.slug}>
                    <Link href={`${sectionPath}/${it.slug}/`}>
                      <strong>{it.h1}{it.homesListed ? ` — ${it.homesListed} ${copy.homesSuffix}` : ''}</strong>
                      <span>{it.subtitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cmp-group">
              <h2>{copy.notHeading}</h2>
              <p>{copy.notBody}</p>
            </section>

            <section className="cmp-group">
              <h2>{copy.operatorHeading}</h2>
              <p>{copy.operatorBody}</p>
              <p><Link href={`${comparePath}/which-co-ownership-operator/`}>{copy.operatorLink} &rarr;</Link></p>
              <p><Link href={HOMES_PATH[locale] || '/our-homes/'}>{copy.homesLink} &rarr;</Link></p>
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
