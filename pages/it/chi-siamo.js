// /it/chi-siamo/ — about us. The real about page (team, story, press,
// testimonials), translated. Copy: content/about/it.json.
import LocaleAbout from '@/components/LocaleAbout';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'it');

export default function About_it(props) {
  return <LocaleAbout locale="it" {...props} />;
}
