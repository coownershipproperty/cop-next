// /how-it-works/ — the English how-it-works page.
//
// Markup lives in components/rd/HowItWorksView.js and copy in
// content/how/en.json, because the same component now renders the Spanish,
// French and German versions too. (The other six locales route howItWorks to
// their pillar page instead — see ROUTE_SLUGS in lib/i18n.js.)
import HowItWorksView from '@/components/rd/HowItWorksView';
import { howItWorksStaticProps } from '@/lib/home-page-data';

export const getStaticProps = howItWorksStaticProps('en');

export default function HowItWorks(props) {
  return <HowItWorksView {...props} />;
}
