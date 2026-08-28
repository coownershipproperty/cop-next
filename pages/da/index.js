// /da/ — DA homepage.
//
// Content: content/pages/da/home.json. Markup: components/LocalePage.js.
// URL set: ROUTE_SLUGS in lib/i18n.js. Terminology: docs/translation-glossary.md.
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('da', 'home', { withProperties: 6 });

export default function HomeDA(props) {
  return <LocalePage {...props} />;
}
