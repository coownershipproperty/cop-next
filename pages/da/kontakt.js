// /da/kontakt/ — DA contact page. Content: content/pages/da/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('da', 'contact');

export default function ContactDA(props) {
  return <LocalePage {...props} />;
}
