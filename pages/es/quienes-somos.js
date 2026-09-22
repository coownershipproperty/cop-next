// /es/ — about page. The same component the English about page renders,
// with this locale's copy from content/about/es.json.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'es');

export default function AboutES(props) {
  return <AboutView locale="es" {...props} />;
}
