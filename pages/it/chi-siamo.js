// /it/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/it.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'it');

export default function AboutIT(props) {
  return <AboutView locale="it" {...props} />;
}
