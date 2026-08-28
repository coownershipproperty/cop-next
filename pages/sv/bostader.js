// /sv/bostader/ — SV listings page. Thin wrapper around the shared
// OurHomes component, forced to SV with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function HomesSV(props) {
  return <OurHomes {...props} forceLocale="sv" canonicalPath="/sv/bostader/" />;
}
