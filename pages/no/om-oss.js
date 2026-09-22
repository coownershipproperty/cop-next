// /no/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/no.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'no');

export default function AboutNO(props) {
  return <AboutView locale="no" {...props} />;
}
