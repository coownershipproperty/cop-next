// /fr/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/fr.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'fr');

export default function ContactFR(props) {
  return <ContactView locale="fr" {...props} />;
}
