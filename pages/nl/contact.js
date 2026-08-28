// /nl/contact/ — NL contact page. Content: content/pages/nl/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('nl', 'contact');

export default function ContactNL(props) {
  return <LocalePage {...props} />;
}
