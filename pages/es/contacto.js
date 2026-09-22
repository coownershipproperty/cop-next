// /es/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/es.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'es');

export default function ContactES(props) {
  return <ContactView locale="es" {...props} />;
}
