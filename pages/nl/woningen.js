// /nl/woningen/ — NL listings page. Thin wrapper around the shared
// OurHomes component, forced to NL with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function HomesNL(props) {
  return <OurHomes {...props} forceLocale="nl" canonicalPath="/nl/woningen/" />;
}
