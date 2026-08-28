// /nl/over-ons/ — NL about page. Content: content/pages/nl/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('nl', 'about');

export default function AboutNL(props) {
  return <LocalePage {...props} />;
}
