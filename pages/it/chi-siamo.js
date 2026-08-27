// /it/chi-siamo/ — Italian "about us". Content: content/pages/it/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('it', 'about');

export default function ChiSiamoIT(props) {
  return <LocalePage {...props} />;
}
