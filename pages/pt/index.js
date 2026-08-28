// /pt/ — PT homepage.
//
// Content: content/pages/pt/home.json. Markup: components/LocalePage.js.
// URL set: ROUTE_SLUGS in lib/i18n.js. Terminology: docs/translation-glossary.md.
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('pt', 'home', { withProperties: 6 });

export default function HomePT(props) {
  return <LocalePage {...props} />;
}
