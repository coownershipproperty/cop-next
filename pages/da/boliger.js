// /da/boliger/ — DA listings page. Thin wrapper around the shared
// OurHomes component, forced to DA with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function HomesDA(props) {
  return <OurHomes {...props} forceLocale="da" canonicalPath="/da/boliger/" />;
}
