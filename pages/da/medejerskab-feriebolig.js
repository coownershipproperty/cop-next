// /da/medejerskab-feriebolig/ — the DA pillar page.
//
// This is also DA's how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/da.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('da');

export default function PillarDA(props) {
  return <PillarPage {...props} />;
}
