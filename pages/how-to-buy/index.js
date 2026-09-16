/**
 * pages/how-to-buy/index.js — the buyer-guide hub, English.
 * Four countries, one page each, and an index so the set is not four orphans.
 */
import GuideHubRenderer from '@/components/GuideHubRenderer';
import { buildGuideHubProps } from '@/lib/guide-page-data';

export async function getStaticProps() {
  return buildGuideHubProps('en');
}

export default function BuyerGuideHub(props) {
  return <GuideHubRenderer {...props} />;
}
