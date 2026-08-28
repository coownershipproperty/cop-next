// /sv/kontakt/ — SV contact page. Content: content/pages/sv/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('sv', 'contact');

export default function ContactSV(props) {
  return <LocalePage {...props} />;
}
