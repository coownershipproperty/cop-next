// /pt/contato/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/pt.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'pt');

export default function Contact_pt(props) {
  return <LocaleContact locale="pt" {...props} />;
}
