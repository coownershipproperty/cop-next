// /sv/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/sv.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'sv');

export default function AboutSV(props) {
  return <AboutView locale="sv" {...props} />;
}
