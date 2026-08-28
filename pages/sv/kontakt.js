// /sv/kontakt/ — contact. The real contact page (trust cards,
// research links), translated. Copy: content/contact/sv.json.
import LocaleContact from '@/components/LocaleContact';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'sv');

export default function Contact_sv(props) {
  return <LocaleContact locale="sv" {...props} />;
}
