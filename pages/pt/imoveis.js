// /pt/imoveis/ — PT listings page. Thin wrapper around the shared
// OurHomes component, forced to PT with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function HomesPT(props) {
  return <OurHomes {...props} forceLocale="pt" canonicalPath="/pt/imoveis/" />;
}
