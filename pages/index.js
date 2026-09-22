// / — the English homepage.
//
// Markup lives in components/rd/HomeView.js and copy in content/home/en.json,
// because the same component now renders all ten languages. Before 22 Sep 2026
// this file held ~560 lines of homepage that no locale shared, which is why
// the redesign reached the English site and none of the other nine.
//
// Changing the homepage means changing HomeView and the copy files. This file
// exists to be the route.
import HomeView from '@/components/rd/HomeView';
import { homeStaticProps } from '@/lib/home-page-data';

export const getStaticProps = homeStaticProps('en');

export default function Home(props) {
  return <HomeView {...props} />;
}
