// /da/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/da.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'da');

export default function AboutDA(props) {
  return <AboutView locale="da" {...props} />;
}
