/**
 * pages/es/como-comprar/[slug].js — per-country buyer guides, es.
 * Thin wrapper; the shape lives in lib/guide-page-data.js.
 */
import ComparePageRenderer from '@/components/ComparePageRenderer';
import { guideStaticPaths, buildGuideProps } from '@/lib/guide-page-data';

export async function getStaticPaths() {
  return guideStaticPaths('es');
}

export async function getStaticProps({ params }) {
  return buildGuideProps('es', params.slug);
}

export default function LocaleBuyerGuidePage(props) {
  return <ComparePageRenderer {...props} />;
}
