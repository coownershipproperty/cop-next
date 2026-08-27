// DE mirror of the programmatic town landing pages.
// Re-uses getStaticPaths / getStaticProps and the component from
// /pages/co-ownership/[town].js, forcing locale='de' so the rendered page
// is de from the very first byte — a separate, canonical URL per language
// for proper hreflang and locale-specific indexing.
import TownPage, { getStaticPaths, getStaticProps } from '@/pages/co-ownership/[town]';

export { getStaticPaths, getStaticProps };

export default function TownPage_de(props) {
  return <TownPage {...props} forceLocale="de" />;
}
