// /sv/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/sv.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'sv');

export default function ContactSV(props) {
  return <ContactView locale="sv" {...props} />;
}
