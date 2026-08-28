// /pt/sobre-nos/ — PT about page. Content: content/pages/pt/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('pt', 'about');

export default function AboutPT(props) {
  return <LocalePage {...props} />;
}
