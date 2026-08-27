// /it/immobili/ — Italian listings page. Thin wrapper around the shared
// OurHomes component, forced to Italian with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function ImmobiliIT(props) {
  return <OurHomes {...props} forceLocale="it" canonicalPath="/it/immobili/" />;
}
