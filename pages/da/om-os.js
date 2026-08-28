// /da/om-os/ — DA about page. Content: content/pages/da/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('da', 'about');

export default function AboutDA(props) {
  return <LocalePage {...props} />;
}
