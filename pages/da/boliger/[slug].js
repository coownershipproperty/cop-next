// /da/boliger/{slug}/ — DA property detail pages.
//
// Re-uses the shared property page, forced to DA so the page is DA from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function PropertyDA(props) {
  return <PropertyPage {...props} forceLocale="da" />;
}
