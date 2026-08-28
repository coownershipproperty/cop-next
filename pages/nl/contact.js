// /nl/contact/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/nl.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'nl');

export default function Contact_nl(props) {
  return <LocaleContact locale="nl" {...props} />;
}
