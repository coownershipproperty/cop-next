// /da/om-os/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/da.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'da');

export default function About_da(props) {
  return <LocaleAbout locale="da" {...props} />;
}
