// /it/contatti/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/it.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'it');

export default function Contact_it(props) {
  return <LocaleContact locale="it" {...props} />;
}
