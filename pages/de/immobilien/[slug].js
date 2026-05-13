// /de/immobilien/[slug] — German wrapper for the property detail page.
//
// Re-uses getStaticPaths / getStaticProps and the page component from
// /pages/property/[slug].js, just forcing locale='de' so the rendered page
// (titles, descriptions, UI strings) is German from the very first byte
// rather than swapping in via the cookie hook after hydration.
//
// This gives Google a separate, canonical German URL per property — the
// missing piece for proper hreflang and locale-specific indexing on the
// German market.

import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function DePropertyPage(props) {
  return <PropertyPage {...props} forceLocale="de" />;
}
