// Thin wrapper: imports the OurHomes component (the listings page) and
// forces it to render in Spanish with the canonical URL set to
// /es/propiedades/. Re-exports getStaticProps from the English page so
// data fetching is identical — only the locale changes.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function PropiedadesES(props) {
  return <OurHomes {...props} forceLocale="es" canonicalPath="/es/propiedades/" />;
}
