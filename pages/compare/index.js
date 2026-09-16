/**
 * pages/compare/index.js — the English comparison hub.
 *
 * /compare used to 308 to the timeshare page, which meant the one URL people
 * and answer engines would naturally try had no page behind it, and the
 * comparisons linked to nothing but themselves. This is the hub: one
 * indexable page, an ItemList so the set is legible to a machine, and real
 * internal links between pages that were previously orphans.
 *
 * The order, the grouping and the copy now live in lib/compare-hub-groups.js
 * and the markup in components/CompareHubRenderer.js, shared with the three
 * locale hubs added 16 Sep 2026 — before that this page's slug list existed
 * only here and the locale hubs did not exist at all.
 */
import CompareHubRenderer from '@/components/CompareHubRenderer';
import { buildHubProps } from '@/lib/compare-hub-data';

export async function getStaticProps() {
  return buildHubProps('en');
}

export default function CompareHub(props) {
  return <CompareHubRenderer {...props} />;
}
