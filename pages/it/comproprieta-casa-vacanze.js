// /it/comproprieta-casa-vacanze/ — the Italian pillar page.
//
// This is also Italian's "how it works": ROUTE_SLUGS maps howItWorks to this
// slug, so the page joins the /how-it-works/ hreflang cluster rather than
// standing alone. Content: content/pillars/it.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('it');

export default function ComproprietaCasaVacanzeIT(props) {
  return <PillarPage {...props} />;
}
