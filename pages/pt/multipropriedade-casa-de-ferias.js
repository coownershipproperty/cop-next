// /pt/multipropriedade-casa-de-ferias/ — the PT pillar page.
//
// This is also PT's how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/pt.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('pt');

export default function PillarPT(props) {
  return <PillarPage {...props} />;
}
