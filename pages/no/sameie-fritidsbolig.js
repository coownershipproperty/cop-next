// /no/sameie-fritidsbolig/ — the NO pillar page.
//
// This is also NO's how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/no.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('no');

export default function PillarNO(props) {
  return <PillarPage {...props} />;
}
