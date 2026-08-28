// /sv/bostader/{slug}/ — SV property detail pages.
//
// Re-uses the shared property page, forced to SV so the page is SV from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function PropertySV(props) {
  return <PropertyPage {...props} forceLocale="sv" />;
}
