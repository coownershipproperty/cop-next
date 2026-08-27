// /it/ — Italian homepage.
//
// Content lives in content/pages/it/home.json; the markup lives in
// components/LocalePage.js. See lib/i18n.js → ROUTE_SLUGS for the Italian URL
// set, and docs/translation-glossary.md for the locked terminology
// (comproprietà / proprietà frazionata — never multiproprietà, which means
// timeshare in Italian).
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('it', 'home', { withProperties: 6 });

export default function HomeIT(props) {
  return <LocalePage {...props} />;
}
