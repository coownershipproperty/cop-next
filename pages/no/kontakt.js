// /no/kontakt/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/no.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'no');

export default function Contact_no(props) {
  return <LocaleContact locale="no" {...props} />;
}
