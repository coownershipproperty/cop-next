// /sv/om-oss/ — SV about page. Content: content/pages/sv/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('sv', 'about');

export default function AboutSV(props) {
  return <LocalePage {...props} />;
}
