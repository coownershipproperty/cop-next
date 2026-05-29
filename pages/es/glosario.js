/**
 * pages/es/glosario.js — Spanish glossary
 * URL: /es/glosario/
 */
import fs from 'fs';
import path from 'path';
import GlossaryPageRenderer from '@/components/GlossaryPageRenderer';

const LOCALE = 'es';
const DATA_FILE = 'glossary-terms-es.json';

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', DATA_FILE), 'utf-8'));
  return { props: { locale: LOCALE, data }, revalidate: 3600 };
}

export default function EsGlosario(props) {
  return <GlossaryPageRenderer {...props} />;
}
