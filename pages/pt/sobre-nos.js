// /pt/sobre-nos/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/pt.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'pt');

export default function About_pt(props) {
  return <LocaleAbout locale="pt" {...props} />;
}
