// components/HreflangLinks.js
// Renders <link rel="alternate" hreflang="..."> tags for the current page across
// every available locale, plus an x-default. Drop into the <Head> of each page
// that has locale equivalents:
//
//   <Head>
//     <HreflangLinks englishPath="/how-it-works" />
//   </Head>
//
// `englishPath` is the canonical English form of the URL; the component looks
// it up in lib/i18n.js → ROUTE_MAP and emits one tag per locale that exists
// for that page.
import Head from 'next/head';
import { alternateLocales } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

export default function HreflangLinks({ englishPath }) {
  const alternates = alternateLocales(englishPath);
  if (alternates.length === 0) return null;

  // x-default points at the English version when one exists; otherwise the
  // first available locale (preserves SEO signal for fully-localised pages).
  const xDefault = alternates.find(a => a.locale === 'en') || alternates[0];

  return (
    <>
      {alternates.map(({ locale, path }) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={`${SITE_URL}${path}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${xDefault.path}`} />
    </>
  );
}
