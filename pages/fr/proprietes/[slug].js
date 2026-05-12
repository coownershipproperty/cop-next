// /fr/proprietes/[slug] — French wrapper for the property detail page.
//
// Mirrors the Spanish wrapper at /es/propiedades/[slug] — re-exports the same
// getStaticPaths / getStaticProps from /property/[slug].js and renders the
// shared component with forceLocale='fr'. Gives Google a clean, canonical
// French URL per property.

import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function FrPropertyPage(props) {
  return <PropertyPage {...props} forceLocale="fr" />;
}
