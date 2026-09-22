// /es/ — how it works. The same component the English page renders, with
// this locale's copy from content/how/es.json.
import HowItWorksView from '@/components/rd/HowItWorksView';
import { howItWorksStaticProps } from '@/lib/home-page-data';

export const getStaticProps = howItWorksStaticProps('es');

export default function HowItWorksES(props) {
  return <HowItWorksView {...props} />;
}
