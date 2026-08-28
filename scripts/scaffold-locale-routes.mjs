#!/usr/bin/env node
/**
 * scripts/scaffold-locale-routes.mjs
 *
 * Writes the thin route files for a locale from ROUTE_SLUGS in lib/i18n.js.
 * Every one of these files is a wrapper — the content lives in
 * content/pages/{locale}/*.json and content/pillars/{locale}.json, and the
 * markup lives in the shared components. Generating them keeps the wrappers
 * identical across locales and makes it obvious when one has drifted.
 *
 *   node scripts/scaffold-locale-routes.mjs nl
 *   node scripts/scaffold-locale-routes.mjs nl --force   (overwrite existing)
 *
 * Slugs are read straight out of lib/i18n.js, so this can never disagree with
 * the route map: if a family is null there, no file is written for it.
 */
import fs from 'node:fs';
import path from 'node:path';

const locale = process.argv[2];
const force = process.argv.includes('--force');
if (!locale) {
  console.error('usage: node scripts/scaffold-locale-routes.mjs <locale> [--force]');
  process.exit(1);
}

// Parse ROUTE_SLUGS out of lib/i18n.js without importing it (it uses the @/
// alias and JSON imports, neither of which plain node resolves).
const src = fs.readFileSync('lib/i18n.js', 'utf-8');
const row = new RegExp(`^\\s{2}${locale}: \\{ home: ''.*$`, 'm').exec(src);
if (!row) {
  console.error(`no ROUTE_SLUGS row for locale "${locale}" in lib/i18n.js`);
  process.exit(1);
}
const slugs = {};
for (const m of row[0].matchAll(/(\w+): (?:'([^']*)'|null)/g)) {
  slugs[m[1]] = m[2] === undefined ? null : m[2];
}

const NAME = locale.toUpperCase();
const files = {};

files[`pages/${locale}/index.js`] = `// /${locale}/ — ${NAME} homepage.
//
// Content: content/pages/${locale}/home.json. Markup: components/LocalePage.js.
// URL set: ROUTE_SLUGS in lib/i18n.js. Terminology: docs/translation-glossary.md.
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('${locale}', 'home', { withProperties: 6 });

export default function Home${NAME}(props) {
  return <LocalePage {...props} />;
}
`;

if (slugs.aboutUs) {
  files[`pages/${locale}/${slugs.aboutUs}.js`] = `// /${locale}/${slugs.aboutUs}/ — ${NAME} about page. Content: content/pages/${locale}/about.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('${locale}', 'about');

export default function About${NAME}(props) {
  return <LocalePage {...props} />;
}
`;
}

if (slugs.contact) {
  files[`pages/${locale}/${slugs.contact}.js`] = `// /${locale}/${slugs.contact}/ — ${NAME} contact page. Content: content/pages/${locale}/contact.json
import LocalePage from '@/components/LocalePage';
import { localePageStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = localePageStaticProps('${locale}', 'contact');

export default function Contact${NAME}(props) {
  return <LocalePage {...props} />;
}
`;
}

if (slugs.howItWorks) {
  files[`pages/${locale}/${slugs.howItWorks}.js`] = `// /${locale}/${slugs.howItWorks}/ — the ${NAME} pillar page.
//
// This is also ${NAME}'s how-it-works: ROUTE_SLUGS maps howItWorks to this slug,
// so the page joins the /how-it-works/ hreflang cluster rather than standing
// alone. Content: content/pillars/${locale}.json.
import PillarPage from '@/components/PillarPage';
import { pillarStaticProps } from '@/lib/locale-page-data';

export const getStaticProps = pillarStaticProps('${locale}');

export default function Pillar${NAME}(props) {
  return <PillarPage {...props} />;
}
`;
}

if (slugs.homes) {
  files[`pages/${locale}/${slugs.homes}.js`] = `// /${locale}/${slugs.homes}/ — ${NAME} listings page. Thin wrapper around the shared
// OurHomes component, forced to ${NAME} with its own canonical URL.
import OurHomes, { getStaticProps as ourHomesGetStaticProps } from '@/pages/our-homes';

export const getStaticProps = ourHomesGetStaticProps;

export default function Homes${NAME}(props) {
  return <OurHomes {...props} forceLocale="${locale}" canonicalPath="/${locale}/${slugs.homes}/" />;
}
`;
}

if (slugs.property) {
  files[`pages/${locale}/${slugs.property}/[slug].js`] = `// /${locale}/${slugs.property}/{slug}/ — ${NAME} property detail pages.
//
// Re-uses the shared property page, forced to ${NAME} so the page is ${NAME} from
// the first byte and Google gets a separate canonical URL per property per
// language.
import PropertyPage, { getStaticPaths, getStaticProps } from '@/pages/property/[slug]';

export { getStaticPaths, getStaticProps };

export default function Property${NAME}(props) {
  return <PropertyPage {...props} forceLocale="${locale}" />;
}
`;
}

if (slugs.favourites) {
  files[`pages/${locale}/${slugs.favourites}.js`] = `// /${locale}/${slugs.favourites}/ — ${NAME} favourites. Same localStorage-backed list
// as /favourites/, rendered with ${NAME} strings and ${NAME} property URLs.
import Favourites from '../favourites';

export default function Favourites${NAME}() {
  return <Favourites locale="${locale}" />;
}
`;
}

let written = 0, skipped = 0;
for (const [file, body] of Object.entries(files)) {
  if (fs.existsSync(file) && !force) { console.log('skip (exists)', file); skipped++; continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
  console.log('wrote', file);
  written++;
}
console.log(`\n${locale}: ${written} written, ${skipped} skipped`);
