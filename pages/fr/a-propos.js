// /fr/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/fr.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'fr');

export default function AboutFR(props) {
  return <AboutView locale="fr" {...props} />;
}
