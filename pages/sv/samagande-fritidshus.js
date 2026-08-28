// /sv/samagande-fritidshus/ — the SV pillar page.
//
// This is also SV's how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/sv.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('sv');

export default function PillarSV(props) {
  return <PillarPage {...props} />;
}
