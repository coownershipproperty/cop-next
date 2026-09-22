// /da/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/da.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'da');

export default function ContactDA(props) {
  return <ContactView locale="da" {...props} />;
}
