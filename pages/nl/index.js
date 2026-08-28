// /nl/ — NL homepage.
//
// Content: content/pages/nl/home.json. Markup: components/LocalePage.js.
// URL set: ROUTE_SLUGS in lib/i18n.js. Terminology: docs/translation-glossary.md.
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('nl', 'home', { withProperties: 6 });

export default function HomeNL(props) {
  return <LocalePage {...props} />;
}
