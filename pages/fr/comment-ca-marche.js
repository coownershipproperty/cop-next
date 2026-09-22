// /fr/ — how it works. The same component the English page renders, with
// this locale's copy from content/how/fr.json.
import HowItWorksView from '@/components/rd/HowItWorksView';
import { howItWorksStaticProps } from '@/lib/home-page-data';

export const getStaticProps = howItWorksStaticProps('fr');

export default function HowItWorksFR(props) {
  return <HowItWorksView {...props} />;
}
