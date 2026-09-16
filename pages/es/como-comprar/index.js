/**
 * pages/es/como-comprar/index.js — the buyer-guide hub, es.
 */
import GuideHubRenderer from '@/components/GuideHubRenderer';
import { buildGuideHubProps } from '@/lib/guide-page-data';

export async function getStaticProps() {
  return buildGuideHubProps('es');
}

export default function LocaleBuyerGuideHub(props) {
  return <GuideHubRenderer {...props} />;
}
