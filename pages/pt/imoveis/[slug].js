// /pt/imoveis/{slug}/ — PT property detail pages.
//
// Re-uses the shared property page, forced to PT so the page is PT from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function PropertyPT(props) {
  return <PropertyPage {...props} forceLocale="pt" />;
}
