// /it/contatti/ — Italian contact page. Content: content/pages/it/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('it', 'contact');

export default function ContattiIT(props) {
  return <LocalePage {...props} />;
}
