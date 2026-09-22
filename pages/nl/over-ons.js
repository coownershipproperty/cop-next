// /nl/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/nl.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'nl');

export default function AboutNL(props) {
  return <AboutView locale="nl" {...props} />;
}
