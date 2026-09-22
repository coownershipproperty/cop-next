// /pt/ — contact page. The same component the English contact page renders,
// with this locale's copy from content/contact/pt.json.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'pt');

export default function ContactPT(props) {
  return <ContactView locale="pt" {...props} />;
}
