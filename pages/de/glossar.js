/**
 * pages/de/glossar.js — German glossary
 * URL: /de/glossar/
 */
import fs from 'fs';
import path from 'path';
import GlossaryPageRenderer from '@/components/GlossaryPageRenderer';

const LOCALE = 'de';
const DATA_FILE = 'glossary-terms-de.json';

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', DATA_FILE), 'utf-8'));
  return { props: { locale: LOCALE, data }, revalidate: 3600 };
}

export default function DeGlossar(props) {
  return <GlossaryPageRenderer {...props} />;
}
