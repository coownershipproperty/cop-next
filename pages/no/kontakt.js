// /no/kontakt/ — NO contact page. Content: content/pages/no/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('no', 'contact');

export default function ContactNO(props) {
  return <LocalePage {...props} />;
}
