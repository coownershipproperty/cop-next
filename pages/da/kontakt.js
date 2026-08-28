// /da/kontakt/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/da.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'da');

export default function Contact_da(props) {
  return <LocaleContact locale="da" {...props} />;
}
