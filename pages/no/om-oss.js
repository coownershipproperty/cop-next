// /no/om-oss/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/no.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'no');

export default function About_no(props) {
  return <LocaleAbout locale="no" {...props} />;
}
