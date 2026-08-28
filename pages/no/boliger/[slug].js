// /no/boliger/{slug}/ — NO property detail pages.
//
// Re-uses the shared property page, forced to NO so the page is NO from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function PropertyNO(props) {
  return <PropertyPage {...props} forceLocale="no" />;
}
