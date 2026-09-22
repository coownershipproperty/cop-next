// /it/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/it.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'it');

export default function ContactIT(props) {
  return <ContactView locale="it" {...props} />;
}
