// /nl/over-ons/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/nl.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'nl');

export default function About_nl(props) {
  return <LocaleAbout locale="nl" {...props} />;
}
