/**
 * pages/de/so-kaufen-sie/[slug].js — per-country buyer guides, de.
 * Thin wrapper; the shape lives in lib/guide-page-data.js.
 */
import ComparePageRenderer from '@/components/ComparePageRenderer';
import { guideStaticPaths, buildGuideProps } from '@/lib/guide-page-data';

export async function getStaticPaths() {
  return guideStaticPaths('de');
}

export async function getStaticProps({ params }) {
  return buildGuideProps('de', params.slug);
}

export default function LocaleBuyerGuidePage(props) {
  return <ComparePageRenderer {...props} />;
}
