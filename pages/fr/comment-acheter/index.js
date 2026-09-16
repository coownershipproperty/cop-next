/**
 * pages/fr/comment-acheter/index.js — the buyer-guide hub, fr.
 */
import GuideHubRenderer from '@/components/GuideHubRenderer';
import { buildGuideHubProps } from '@/lib/guide-page-data';

export async function getStaticProps() {
  return buildGuideHubProps('fr');
}

export default function LocaleBuyerGuideHub(props) {
  return <GuideHubRenderer {...props} />;
}
