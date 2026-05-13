// Thin wrapper: imports the OurHomes component (the listings page) and
// forces it to render in German with the canonical URL set to
// /de/immobilien/. Re-exports getStaticProps from the English page so
// data fetching is identical — only the locale changes.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function ImmobilienDE(props) {
  return <OurHomes {...props} forceLocale="de" canonicalPath="/de/immobilien/" />;
}
