// /it/immobili/{slug}/ — Italian property detail pages. Re-uses the shared
// property page, forced to Italian so the page is Italian from the first byte
// and Google gets a separate canonical URL per property per language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function ItPropertyPage(props) {
  return <PropertyPage {...props} forceLocale="it" />;
}
