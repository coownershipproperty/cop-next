// /about-us/ — the English about page.
//
// Markup lives in components/rd/AboutView.js and copy in content/about/en.json,
// because the same component now renders all ten languages.
import AboutView from '@/components/rd/AboutView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('about', 'en');

export default function AboutUs(props) {
  return <AboutView locale="en" {...props} />;
}
