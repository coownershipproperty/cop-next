// /da/ — homepage.
//
// The same component the English homepage renders, with this locale's copy.
// Until 22 Sep 2026 this was a hand-written page mirroring the design the site
// had before the redesign, which is how nine locales ended up looking like a
// different company from the English site. Copy lives in
// content/home/da.json; markup in components/rd/HomeView.js.
import HomeView from '@/components/rd/HomeView';
import { homeStaticProps } from '@/lib/home-page-data';

export const getStaticProps = homeStaticProps('da');

export default function HomeDA(props) {
  return <HomeView {...props} />;
}
