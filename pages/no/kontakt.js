// /no/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/no.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'no');

export default function ContactNO(props) {
  return <ContactView locale="no" {...props} />;
}
