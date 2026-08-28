// /nl/woningen/{slug}/ — NL property detail pages.
//
// Re-uses the shared property page, forced to NL so the page is NL from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function PropertyNL(props) {
  return <PropertyPage {...props} forceLocale="nl" />;
}
