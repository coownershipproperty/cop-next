// /pt/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/pt.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'pt');

export default function AboutPT(props) {
  return <AboutView locale="pt" {...props} />;
}
