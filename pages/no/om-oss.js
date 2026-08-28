// /no/om-oss/ — NO about page. Content: content/pages/no/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('no', 'about');

export default function AboutNO(props) {
  return <LocalePage {...props} />;
}
