import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

import { townSlug, TOWN_PAGE_MIN_HOMES } from '@/lib/townSlug';
import { SUPPORTED_LOCALES, routePath, familyPrefix, translatedLocales, localeColumns } from '@/lib/i18n';

const BASE = 'https://co-ownership-property.com';

// ──────────────────────────────────────────────────────────────────────────
// PAGE GROUPS — pages that exist in more than one locale. Each group emits
// one <url> per launched locale, and every entry carries the full hreflang
// set (reciprocal alternates) so Google treats them as siblings rather than
// near-duplicates.
//
// The paths are NOT listed here. They are generated from ROUTE_SLUGS in
// lib/i18n.js, which is the single source of truth for every locale URL on
// the site — so a new language appears in the sitemap the moment its
// `launched` flag flips, with no edit to this file.
// ──────────────────────────────────────────────────────────────────────────
const PAGE_GROUP_SPECS = [
  { key: 'home',        priority: '1.0', changefreq: 'daily' },
  { key: 'homes',       priority: '0.9', changefreq: 'daily' },
  { key: 'howItWorks',  priority: '0.8', changefreq: 'monthly' },
  { key: 'aboutUs',     priority: '0.7', changefreq: 'monthly' },
  { key: 'contact',     priority: '0.6', changefreq: 'monthly' },
  { key: 'blog',        priority: '0.8', changefreq: 'daily' },
  { key: 'buyingFaqs',  priority: '0.7', changefreq: 'monthly' },
  { key: 'stayingFaqs', priority: '0.6', changefreq: 'monthly' },
];

const PAGE_GROUPS = PAGE_GROUP_SPECS.map(({ key, priority, changefreq }) => {
  const group = { priority, changefreq };
  for (const loc of SUPPORTED_LOCALES) {
    const path = routePath(loc, key);
    if (path) group[loc] = path;
  }
  return group;
});

// Per-locale pillar pages: keyword-targeted explainers built around each
// language's own primary product term. Deliberately NOT hreflang siblings —
// a Norwegian "sameie i fritidsbolig" page argues a different case to a
// different market than an Italian "comproprietà" page; they are not
// translations of one another.
/**
 * Build the { locale: path } alternate set for a dynamic page family, across
 * every launched locale. Replaces the hand-written en/es/fr/de literals that
 * had to be edited each time a language was added.
 *
 *   familyAltset('towns', 'morzine')
 *   → { en: '/co-ownership/morzine/', es: '/es/copropiedad/morzine/', … }
 */
function familyAltset(family, slug, onlyLocales = null) {
  const out = {};
  for (const loc of SUPPORTED_LOCALES) {
    if (onlyLocales && !onlyLocales.has(loc)) continue;
    const prefix = familyPrefix(loc, family);
    if (prefix) out[loc] = `${prefix}${slug}/`;
  }
  return out;
}

/**
 * Which locales actually have a translated guide for this town.
 *
 * The town route exists in all ten locales, but guides are translated town by
 * town, and the locale mirrors 404 until the translation lands (see
 * gateOnTranslation in pages/co-ownership/[town].js). The sitemap has to agree
 * with that gate: advertising a URL that 404s wastes crawl budget and teaches
 * Google the site is unreliable. English is always included — it is the source.
 */
function townGuideLocales(town) {
  const set = new Set(['en']);
  try {
    const file = path.join(process.cwd(), 'content', 'towns', `${town}.json`);
    if (!fs.existsSync(file)) return set;
    const guide = JSON.parse(fs.readFileSync(file, 'utf-8'));
    for (const loc of SUPPORTED_LOCALES) {
      const sections = guide[loc] && guide[loc].sections;
      if (sections && sections.length) set.add(loc);
    }
  } catch (e) {
    console.error('[sitemap] town guide read failed for', town, e.message);
  }
  return set;
}

const PILLAR_PAGES = SUPPORTED_LOCALES
  .map((loc) => routePath(loc, 'pillar'))
  .filter(Boolean)
  .map((url) => ({ url, priority: '0.9', changefreq: 'monthly' }));

// ──────────────────────────────────────────────────────────────────────────
// LOCALE-ONLY pages — pillar content commissioned per-language for SEO,
// with no direct English equivalent. No hreflang alternates emitted.
// ──────────────────────────────────────────────────────────────────────────
const LOCALE_ONLY_PAGES = [
  // Pillar pages themselves come from PILLAR_PAGES above (generated).
  // Spanish pillar + SEO posts
  { url: '/es/blog/copropiedad-vs-multipropiedad/',   priority: '0.85', changefreq: 'monthly' },
  { url: '/es/blog/guia-comprar-copropiedad-espana/', priority: '0.85', changefreq: 'monthly' },
  // French pillar + SEO posts
  { url: '/fr/blog/acheter-residence-secondaire-a-plusieurs/',   priority: '0.85', changefreq: 'monthly' },
  { url: '/fr/blog/copropriete-vs-multipropriete/',              priority: '0.8',  changefreq: 'monthly' },
  // German pillar — added in 1e0424e plan; SEO posts to follow once written
];

// ──────────────────────────────────────────────────────────────────────────
// English-only pages that don't have locale variants (yet).
// ──────────────────────────────────────────────────────────────────────────
const EN_ONLY_PAGES = [
  { url: '/our-mission/',  priority: '0.5', changefreq: 'monthly' },
  { url: '/ownership/',    priority: '0.5', changefreq: 'monthly' },
  { url: '/viewings/',     priority: '0.7', changefreq: 'weekly' },
  { url: '/collections/mosaic-collection/', priority: '0.8', changefreq: 'weekly' },
  // /favourites/ intentionally excluded — noindex personal page
];

// ──────────────────────────────────────────────────────────────────────────
// Legacy locale-only short-slug destination pages. These exist as
// hand-written keyword-targeted landing pages alongside the full-translation
// pillars (e.g. /es/destinos/mallorca/ alongside /es/destinos/mallorca-
// fractional-ownership-properties/). They serve different keywords so we
// index them separately WITHOUT hreflang to the EN pillar — Google should
// treat them as distinct pages, not translations.
// ──────────────────────────────────────────────────────────────────────────
const LEGACY_DEST_LOCALE_PAGES = [
  { url: '/es/destinos/mallorca/',     priority: '0.75', changefreq: 'monthly' },
  { url: '/es/destinos/ibiza/',        priority: '0.75', changefreq: 'monthly' },
  { url: '/fr/destinations/mallorque/', priority: '0.75', changefreq: 'monthly' },
  { url: '/fr/destinations/ibiza/',    priority: '0.75', changefreq: 'monthly' },
];

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

function urlEntry(loc, priority, changefreq, lastmod, alternates) {
  const altLinks = alternates
    ? Object.entries(alternates).map(([locale, p]) =>
        `\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(BASE + p)}" />`
      ).join('')
    : '';
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${altLinks}
  </url>`;
}

// Emit one <url> per locale defined in the group. Every entry carries the
// same hreflang set so all variants point to each other.
function emitGroup(group, lastmod) {
  // Iterate SUPPORTED_LOCALES rather than a literal list — this used to be
  // hardcoded to ['en','es','fr','de'], which silently dropped every locale
  // added afterwards from the sitemap.
  const alternates = {};
  for (const locale of SUPPORTED_LOCALES) {
    if (group[locale]) alternates[locale] = group[locale];
  }
  return Object.keys(alternates).map(locale =>
    urlEntry(`${BASE}${group[locale]}`, group.priority, group.changefreq, lastmod, alternates)
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sitemap
// ──────────────────────────────────────────────────────────────────────────
export async function getServerSideProps({ res }) {
  const cwd = process.cwd();

  // Properties — fetch from Supabase so slugs are always current
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: properties } = await supabase
    .from('properties')
    // Locale title/description columns come along so translatedLocales() can
    // decide which locale URLs are genuinely translated and worth indexing.
    .select(`slug, date_added, city, ${localeColumns(['title', 'description'], { base: false })}`)
    .in('status', ['Live', 'for_sale'])
    .order('date_added', { ascending: false });

  // Blog posts (from static JSON for stability)
  const posts = JSON.parse(fs.readFileSync(path.join(cwd, 'lib', 'posts.json'), 'utf-8'));

  // English destination slugs — all 48 destination HTML files at the root level
  // (URL pattern is /<slug>/, e.g. /france-fractional-ownership-properties/).
  const destDir = path.join(cwd, 'content', 'destinations');
  const destSlugs = fs.readdirSync(destDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));

  // German destination mirrors at content/destinations/de/<slug>.html
  // (URL pattern is /de/destinationen/<slug>/).
  const destDirDe = path.join(cwd, 'content', 'destinations', 'de');
  const destSlugsDeSet = new Set(
    fs.existsSync(destDirDe)
      ? fs.readdirSync(destDirDe).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
      : []
  );

  // Spanish destination mirrors at content/destinations/es/<slug>.html
  // (URL pattern is /es/destinos/<slug>/).
  const destDirEs = path.join(cwd, 'content', 'destinations', 'es');
  const destSlugsEsSet = new Set(
    fs.existsSync(destDirEs)
      ? fs.readdirSync(destDirEs).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
      : []
  );

  // French destination mirrors at content/destinations/fr/<slug>.html
  // (URL pattern is /fr/destinations/<slug>/).
  const destDirFr = path.join(cwd, 'content', 'destinations', 'fr');
  const destSlugsFrSet = new Set(
    fs.existsSync(destDirFr)
      ? fs.readdirSync(destDirFr).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
      : []
  );

  // Comparison pages at content/compare/<slug>.html — operational guides
  // (fractional-vs-timeshare, Pacaso vs MYNE, etc.). EN + ES + FR + DE.
  const compareDir = path.join(cwd, 'content', 'compare');
  const compareSlugs = fs.existsSync(compareDir)
    ? fs.readdirSync(compareDir).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
    : [];
  const compareSlugsEsSet = new Set(fs.existsSync(path.join(compareDir, 'es')) ? fs.readdirSync(path.join(compareDir, 'es')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const compareSlugsFrSet = new Set(fs.existsSync(path.join(compareDir, 'fr')) ? fs.readdirSync(path.join(compareDir, 'fr')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const compareSlugsDeSet = new Set(fs.existsSync(path.join(compareDir, 'de')) ? fs.readdirSync(path.join(compareDir, 'de')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);

  // Partner profile pages at content/partners/<slug>.html — per-operator
  // operational profiles. EN + ES + FR + DE.
  const partnersDir = path.join(cwd, 'content', 'partners');
  const partnerSlugs = fs.existsSync(partnersDir)
    ? fs.readdirSync(partnersDir).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
    : [];
  const partnerSlugsEsSet = new Set(fs.existsSync(path.join(partnersDir, 'es')) ? fs.readdirSync(path.join(partnersDir, 'es')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const partnerSlugsFrSet = new Set(fs.existsSync(path.join(partnersDir, 'fr')) ? fs.readdirSync(path.join(partnersDir, 'fr')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const partnerSlugsDeSet = new Set(fs.existsSync(path.join(partnersDir, 'de')) ? fs.readdirSync(path.join(partnersDir, 'de')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);

  // Glossary — single page per locale.
  const glossaryLocales = ['en'];
  if (fs.existsSync(path.join(cwd, 'lib', 'glossary-terms-es.json'))) glossaryLocales.push('es');
  if (fs.existsSync(path.join(cwd, 'lib', 'glossary-terms-fr.json'))) glossaryLocales.push('fr');
  if (fs.existsSync(path.join(cwd, 'lib', 'glossary-terms-de.json'))) glossaryLocales.push('de');

  // FAQ / Q&A pages at content/faq/<slug>.html — AI-bait Q&A content.
  // EN-only for now; ES / FR / DE folders reserved for later translation.
  const faqDir = path.join(cwd, 'content', 'faq');
  const faqSlugs = fs.existsSync(faqDir)
    ? fs.readdirSync(faqDir).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''))
    : [];
  const faqSlugsEsSet = new Set(fs.existsSync(path.join(faqDir, 'es')) ? fs.readdirSync(path.join(faqDir, 'es')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const faqSlugsFrSet = new Set(fs.existsSync(path.join(faqDir, 'fr')) ? fs.readdirSync(path.join(faqDir, 'fr')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);
  const faqSlugsDeSet = new Set(fs.existsSync(path.join(faqDir, 'de')) ? fs.readdirSync(path.join(faqDir, 'de')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : []);


  // Pillar slugs get higher priority + more frequent crawl signal.
  // Country pillars + regional pillars all rewritten to the new 10k+ word
  // editorial standard with full DE/ES/FR translations. These are the
  // pages we want Google indexing most aggressively.
  const PILLAR_SLUGS = new Set([
    // Country pillars
    'spain-fractional-ownership-properties',
    'france-fractional-ownership-properties',
    'italy-fractional-ownership-properties',
    'usa-fractional-ownership-properties',
    'portugal-fractional-ownership-properties',
    'austria-fractional-ownership-properties',
    'germany-fractional-ownership-properties',
    // Regional pillars (rewritten to new standard with full translations)
    'mallorca-fractional-ownership-properties',
    'french-alps-fractional-ownership-properties',
    'italian-lakes-fractional-ownership-properties',
    'costa-del-sol-fractional-ownership-properties',
    'sardinia-fractional-ownership-properties',
    'marbella-fractional-ownership-properties',
    'lake-como-fractional-ownership-properties',
    'south-of-france-fractional-ownership-properties',
    'paris-fractional-ownership-properties',
    'ibiza-fractional-ownership-properties',
  ]);

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Locale-paired static pages
    ...PAGE_GROUPS.flatMap(g => emitGroup(g)),

    // English-only static pages
    ...EN_ONLY_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Per-locale pillar pages, generated from ROUTE_SLUGS
    ...PILLAR_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Locale-only SEO content (no hreflang alternates)
    ...LOCALE_ONLY_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Legacy short-slug ES/FR destination landing pages (standalone, no
    // hreflang to EN pillar — they target different keywords).
    ...LEGACY_DEST_LOCALE_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // All destinations — emit EN at root (/<slug>/) plus every locale
    // mirror that exists (DE, ES, FR) with reciprocal hreflang across all
    // available locales. Pillars get higher priority (0.9); regions/cities 0.8.
    ...destSlugs
      .flatMap(slug => {
        const priority = PILLAR_SLUGS.has(slug) ? '0.9' : '0.8';
        const hasDe = destSlugsDeSet.has(slug);
        const hasEs = destSlugsEsSet.has(slug);
        const hasFr = destSlugsFrSet.has(slug);
        const altset = { en: `/${slug}/` };
        if (hasEs) altset.es = `/es/destinos/${slug}/`;
        if (hasFr) altset.fr = `/fr/destinations/${slug}/`;
        if (hasDe) altset.de = `/de/destinationen/${slug}/`;
        const out = [
          urlEntry(`${BASE}/${slug}/`, priority, 'weekly', today, altset),
        ];
        if (hasEs) out.push(urlEntry(`${BASE}${altset.es}`, priority, 'weekly', today, altset));
        if (hasFr) out.push(urlEntry(`${BASE}${altset.fr}`, priority, 'weekly', today, altset));
        if (hasDe) out.push(urlEntry(`${BASE}${altset.de}`, priority, 'weekly', today, altset));
        return out;
      }),

    // Comparison pages — EN + ES + FR + DE with reciprocal hreflang.
    // Priority 0.85 (these are money pages for AI-search citation).
    ...compareSlugs.flatMap(slug => {
      const altset = { en: `/compare/${slug}/` };
      if (compareSlugsEsSet.has(slug)) altset.es = `/es/comparativa/${slug}/`;
      if (compareSlugsFrSet.has(slug)) altset.fr = `/fr/comparaison/${slug}/`;
      if (compareSlugsDeSet.has(slug)) altset.de = `/de/vergleich/${slug}/`;
      const out = [urlEntry(`${BASE}/compare/${slug}/`, '0.85', 'monthly', today, altset)];
      if (altset.es) out.push(urlEntry(`${BASE}${altset.es}`, '0.85', 'monthly', today, altset));
      if (altset.fr) out.push(urlEntry(`${BASE}${altset.fr}`, '0.85', 'monthly', today, altset));
      if (altset.de) out.push(urlEntry(`${BASE}${altset.de}`, '0.85', 'monthly', today, altset));
      return out;
    }),

    // Partner profile pages — EN + ES + FR + DE with reciprocal hreflang.
    ...partnerSlugs.flatMap(slug => {
      const altset = { en: `/partners/${slug}/` };
      if (partnerSlugsEsSet.has(slug)) altset.es = `/es/socios/${slug}/`;
      if (partnerSlugsFrSet.has(slug)) altset.fr = `/fr/partenaires/${slug}/`;
      if (partnerSlugsDeSet.has(slug)) altset.de = `/de/partner/${slug}/`;
      const out = [urlEntry(`${BASE}/partners/${slug}/`, '0.85', 'monthly', today, altset)];
      if (altset.es) out.push(urlEntry(`${BASE}${altset.es}`, '0.85', 'monthly', today, altset));
      if (altset.fr) out.push(urlEntry(`${BASE}${altset.fr}`, '0.85', 'monthly', today, altset));
      if (altset.de) out.push(urlEntry(`${BASE}${altset.de}`, '0.85', 'monthly', today, altset));
      return out;
    }),

    // Glossary — EN + ES + FR + DE with reciprocal hreflang. Priority 0.8.
    ...(() => {
      const altset = {};
      glossaryLocales.forEach(loc => {
        altset[loc] = loc === 'en' ? '/glossary/' : loc === 'es' ? '/es/glosario/' : loc === 'fr' ? '/fr/glossaire/' : '/de/glossar/';
      });
      return Object.entries(altset).map(([loc, p]) => urlEntry(`${BASE}${p}`, '0.8', 'monthly', today, altset));
    })(),

    // FAQ hub + individual Q&A pages. EN-only for now; ES/FR/DE alternates
    // emitted if the locale file exists. Priority 0.85 — these are AI-citation
    // money pages, treat them on par with /compare/.
    urlEntry(`${BASE}/faq/`, '0.85', 'weekly', today, { en: '/faq/' }),
    ...faqSlugs.flatMap(slug => {
      const altset = { en: `/faq/${slug}/` };
      if (faqSlugsEsSet.has(slug)) altset.es = `/es/preguntas/${slug}/`;
      if (faqSlugsFrSet.has(slug)) altset.fr = `/fr/questions/${slug}/`;
      if (faqSlugsDeSet.has(slug)) altset.de = `/de/fragen/${slug}/`;
      const out = [urlEntry(`${BASE}/faq/${slug}/`, '0.85', 'monthly', today, altset)];
      if (altset.es) out.push(urlEntry(`${BASE}${altset.es}`, '0.85', 'monthly', today, altset));
      if (altset.fr) out.push(urlEntry(`${BASE}${altset.fr}`, '0.85', 'monthly', today, altset));
      if (altset.de) out.push(urlEntry(`${BASE}${altset.de}`, '0.85', 'monthly', today, altset));
      return out;
    }),

    // Property detail pages — one entry per launched locale, with reciprocal
    // hreflang. Every locale has a property mirror, so this follows the locale
    // table rather than a fixed list.
    ...(properties || []).flatMap(p => {
      // Only locales this property is actually translated into. An untranslated
      // locale URL is noindex on the page itself (see pages/property/[slug].js),
      // so listing it here would contradict the page and waste crawl budget.
      const locales = translatedLocales(p, ['title', 'description']);
      const altset = {};
      for (const loc of locales) {
        const prefix = familyPrefix(loc, 'property');
        if (prefix) altset[loc] = `${prefix}${p.slug}/`;
      }
      const lastmod = p.date_added ? p.date_added.split('T')[0] : today;
      return Object.values(altset).map(
        (url) => urlEntry(`${BASE}${url}`, '0.7', 'weekly', lastmod, altset)
      );
    }),

    // Programmatic town landing pages (/co-ownership/{town}/ and locale
    // mirrors) — one entry per town with at least TOWN_PAGE_MIN_HOMES live
    // homes, matching getStaticPaths in pages/co-ownership/[town].js.
    ...(() => {
      const counts = {};
      for (const p of properties || []) {
        const t = townSlug(p.city);
        if (t) counts[t] = (counts[t] || 0) + 1;
      }
      return Object.entries(counts)
        .filter(([, n]) => n >= TOWN_PAGE_MIN_HOMES)
        .flatMap(([t]) => {
          const altset = familyAltset('towns', t, townGuideLocales(t));
          return Object.values(altset).map(
            (url) => urlEntry(`${BASE}${url}`, '0.75', 'weekly', today, altset)
          );
        });
    })(),

    // Blog posts — one entry per launched locale, with reciprocal hreflang. Bodies are
    // translated for the top-9 most-recent; the rest serve EN content under
    // localised chrome + translated title/excerpt, which is enough for
    // indexing and signals the page exists in the visitor's language.
    ...posts.flatMap(p => {
      const altset = familyAltset('blogPost', p.slug);
      return Object.values(altset).map(
        (url) => urlEntry(`${BASE}${url}`, '0.6', 'never', p.date || today, altset)
      );
    }),
  ];

  // xmlns:xhtml namespace required for the <xhtml:link> alternate tags.
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() { return null; }
