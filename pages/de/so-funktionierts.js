// /de/ — how it works. The same component the English page renders, with
// this locale's copy from content/how/de.json.
import HowItWorksView from '@/components/rd/HowItWorksView';
import { howItWorksStaticProps } from '@/lib/home-page-data';

export const getStaticProps = howItWorksStaticProps('de');

export default function HowItWorksDE(props) {
  return <HowItWorksView {...props} />;
}
