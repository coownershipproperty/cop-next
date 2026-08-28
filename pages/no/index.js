// /no/ — NO homepage.
//
// Content: content/pages/no/home.json. Markup: components/LocalePage.js.
// URL set: ROUTE_SLUGS in lib/i18n.js. Terminology: docs/translation-glossary.md.
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('no', 'home', { withProperties: 6 });

export default function HomeNO(props) {
  return <LocalePage {...props} />;
}
