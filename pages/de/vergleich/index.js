/**
 * pages/de/vergleich/index.js — the de comparison hub.
 *
 * Every de comparison page emits a BreadcrumbList whose second item is
 * this URL, and the nav links here too. Until 16 Sep 2026 it was a 404.
 */
import CompareHubRenderer from '@/components/CompareHubRenderer';
import { buildHubProps } from '@/lib/compare-hub-data';

export async function getStaticProps() {
  return buildHubProps('de');
}

export default function LocaleCompareHub(props) {
  return <CompareHubRenderer {...props} />;
}
