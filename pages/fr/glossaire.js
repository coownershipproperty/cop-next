/**
 * pages/fr/glossaire.js — French glossary
 * URL: /fr/glossaire/
 */
import fs from 'fs';
import path from 'path';
import GlossaryPageRenderer from '@/components/GlossaryPageRenderer';

const LOCALE = 'fr';
const DATA_FILE = 'glossary-terms-fr.json';

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', DATA_FILE), 'utf-8'));
  return { props: { locale: LOCALE, data }, revalidate: 3600 };
}

export default function FrGlossaire(props) {
  return <GlossaryPageRenderer {...props} />;
}
