/**
 * pages/fr/comment-acheter/[slug].js — per-country buyer guides, fr.
 * Thin wrapper; the shape lives in lib/guide-page-data.js.
 */
import ComparePageRenderer from '@/components/ComparePageRenderer';
import { guideStaticPaths, buildGuideProps } from '@/lib/guide-page-data';

export async function getStaticPaths() {
  return guideStaticPaths('fr');
}

export async function getStaticProps({ params }) {
  return buildGuideProps('fr', params.slug);
}

export default function LocaleBuyerGuidePage(props) {
  return <ComparePageRenderer {...props} />;
}
