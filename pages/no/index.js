// /no/ — homepage. The real COP homepage (video hero, carousel, destinations,
// testimonials, FAQ), translated. Copy lives in content/home/no.json;
// markup in components/LocaleHome.js. Replaces the earlier text-first
// LocalePage landing, which looked nothing like the site (28 Aug).
import LocaleHome from '@/components/LocaleHome';
import { localeHomeStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeHomeStaticProps('no');

export default function Home_no(props) {
  return <LocaleHome locale="no" {...props} />;
}
