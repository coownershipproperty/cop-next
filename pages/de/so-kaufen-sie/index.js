/**
 * pages/de/so-kaufen-sie/index.js — the buyer-guide hub, de.
 */
import GuideHubRenderer from '@/components/GuideHubRenderer';
import { buildGuideHubProps } from '@/lib/guide-page-data';

export async function getStaticProps() {
  return buildGuideHubProps('de');
}

export default function LocaleBuyerGuideHub(props) {
  return <GuideHubRenderer {...props} />;
}
