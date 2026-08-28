// /pt/contato/ — PT contact page. Content: content/pages/pt/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('pt', 'contact');

export default function ContactPT(props) {
  return <LocalePage {...props} />;
}
