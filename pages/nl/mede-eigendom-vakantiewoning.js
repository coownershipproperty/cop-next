// /nl/mede-eigendom-vakantiewoning/ — the NL pillar page.
//
// This is also NL's how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/nl.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('nl');

export default function PillarNL(props) {
  return <PillarPage {...props} />;
}
