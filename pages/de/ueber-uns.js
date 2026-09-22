// /de/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/de.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'de');

export default function AboutDE(props) {
  return <AboutView locale="de" {...props} />;
}
