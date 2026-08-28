// /no/boliger/ — NO listings page. Thin wrapper around the shared
// OurHomes component, forced to NO with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function HomesNO(props) {
  return <OurHomes {...props} forceLocale="no" canonicalPath="/no/boliger/" />;
}
