/**
 * pages/how-to-buy/[slug].js — per-country buyer guides, English.
 *
 * The site had 236 FAQ pages, roughly thirty of them tax and legal, and no
 * page that assembled them into one journey for a buyer in one country. The
 * tax answers existed; nobody could find them in the order they need them.
 * These guides are that order: structure, what you need, the steps, the
 * cost measured from our own listings, tax, stay limits, letting, financing.
 *
 * Renders through ComparePageRenderer with section="guide" — same shape of
 * page, same CSS, different breadcrumb and hreflang set. Locale siblings
 * live at pages/{es,fr,de}/{como-comprar,comment-acheter,so-kaufen-sie}/.
 */
import ComparePageRenderer from '@/components/ComparePageRenderer';
import { guideStaticPaths, buildGuideProps } from '@/lib/guide-page-data';

export async function getStaticPaths() {
  return guideStaticPaths('en');
}

export async function getStaticProps({ params }) {
  return buildGuideProps('en', params.slug);
}

export default function BuyerGuidePage(props) {
  return <ComparePageRenderer {...props} />;
}
