// NL mirror of the programmatic town landing pages.
// Re-uses getStaticPaths / getStaticProps and the component from
// /pages/co-ownership/[town].js, forcing locale='nl' so the page is nl from
// the first byte — a separate canonical URL per language for hreflang and
// locale-specific indexing.
//
// gateOnTranslation 404s this mirror for any town whose guide has not been
// translated into nl yet, so a NL URL never serves an English body. New
// towns appear here automatically the day their translation lands.
import TownPage, {
  getStaticPaths,
  getStaticProps as baseGetStaticProps,
  gateOnTranslation,
} from '@/pages/co-ownership/[town]';

export { getStaticPaths };

export async function getStaticProps(ctx) {
  return gateOnTranslation(await baseGetStaticProps(ctx), 'nl');
}

export default function TownPage_nl(props) {
  return <TownPage {...props} forceLocale="nl" />;
}
