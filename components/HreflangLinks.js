// components/HreflangLinks.js
// Renders <link rel="alternate" hreflang="..."> tags for the current page across
// every available locale, plus an x-default. Drop into the <Head> of each page
// that has locale equivalents:
//
//   <Head>
//     {hreflangLinks({ englishPath: '/how-it-works' })}
//   </Head>
//
// IMPORTANT — why this is a function call and not a <Component />:
// next/head only understands plain elements and React.Fragment as children.
// A custom component element placed inside <Head> is silently discarded (see
// onlyReactElement in next/dist/shared/lib/head.js — it flattens Fragment and
// concatenates everything else, and non-head tags never reach the output).
// This component used to be written as {hreflangLinks({ englishPath: '…' })} in 42
// pages, and as a result the site emitted no hreflang tags at all: verified
// against production on 27 Aug 2026, where /es/como-funciona/ served a
// canonical link but not one alternate. Returning an array of <link> elements
// works because React.Children.toArray flattens arrays.
//
// `englishPath` is the canonical English form of the URL; the component looks it
// up in lib/i18n.js → ROUTE_MAP and emits one tag per locale that exists for
// that page. Unlaunched locales never appear, so we never point Google at a URL
// that would 404.
//
// For dynamic pages (property, blog post, town guide) there is no ROUTE_MAP
// entry — pass `family` and `slug` instead, and optionally `locales` to
// restrict the set to those that actually have content for that slug:
//
//   {hreflangLinks({ family: 'towns', slug: 'morzine', locales: ['en','de','fr'] })}
//
// A locale may emit more than one hreflang value: `pt` emits pt-BR (the market
// we write for) and a bare pt so Portugal resolves to it rather than falling
// through to English; `no` emits nb and no.
import { alternateLocales, dynamicAlternates, SUPPORTED_LOCALES } from '@/lib/i18n';

const SITE_URL = 'https://co-ownership-property.com';

export default function hreflangLinks({ englishPath, family, slug, locales } = {}) {
  const alternates = family && slug
    ? dynamicAlternates(family, slug, { locales: locales || SUPPORTED_LOCALES })
    : alternateLocales(englishPath);

  if (alternates.length === 0) return null;

  // x-default points at the English version when one exists; otherwise the
  // first available locale (preserves the signal for locale-only pages).
  const xDefault = alternates.find((a) => a.locale === 'en') || alternates[0];

  const links = alternates.flatMap(({ locale, path, hreflangs }) =>
    (hreflangs || [locale]).map((tag) => (
      <link
        key={`hreflang-${locale}-${tag}`}
        rel="alternate"
        hrefLang={tag}
        href={`${SITE_URL}${path}`}
      />
    ))
  );

  links.push(
    <link
      key="hreflang-x-default"
      rel="alternate"
      hrefLang="x-default"
      href={`${SITE_URL}${xDefault.path}`}
    />
  );

  return links;
}
