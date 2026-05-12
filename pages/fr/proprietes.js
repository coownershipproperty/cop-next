// Thin wrapper: imports OurHomes and forces it to render in French with the
// canonical URL set to /fr/proprietes/. Same data, same component, different
// locale + canonical.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function ProprietesFR(props) {
  return <OurHomes {...props} forceLocale="fr" canonicalPath="/fr/proprietes/" />;
}
