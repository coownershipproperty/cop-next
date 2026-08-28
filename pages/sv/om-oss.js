// /sv/om-oss/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/sv.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'sv');

export default function About_sv(props) {
  return <LocaleAbout locale="sv" {...props} />;
}
