import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://co-ownership-property.com';

// ──────────────────────────────────────────────────────────────────────────
// PAGE GROUPS — pages that exist in two or three locales. Each group emits
// one <url> per locale that's defined, and every entry carries the full
// hreflang set (reciprocal alternates) so Google treats them as siblings
// rather than near-duplicates.
// ──────────────────────────────────────────────────────────────────────────
const PAGE_GROUPS = [
  {
    en: '/',
    es: '/es/',
    fr: '/fr/',
    de: '/de/',
    priority: '1.0',
    changefreq: 'daily',
  },
  {
    en: '/our-homes/',
    es: '/es/propiedades/',
    fr: '/fr/proprietes/',
    de: '/de/immobilien/',
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    en: '/how-it-works/',
    es: '/es/como-funciona/',
    fr: '/fr/comment-ca-marche/',
    de: '/de/so-funktionierts/',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    en: '/about-us/',
    es: '/es/quienes-somos/',
    fr: '/fr/a-propos/',
    de: '/de/ueber-uns/',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    en: '/contact/',
    es: '/es/contacto/',
    fr: '/fr/contact/',
    de: '/de/kontakt/',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    en: '/all-our-blog/',
    es: '/es/blog/',
    fr: '/fr/blog/',
    de: '/de/blog/',
    priority: '0.8',
    changefreq: 'daily',
  },
  {
    en: '/buying-a-co-ownership-property-faqs/',
    es: '/es/comprar-copropiedad-preguntas-frecuentes/',
    fr: '/fr/acheter-copropriete-questions-frequentes/',
    de: '/de/ferienimmobilie-kaufen-haeufige-fragen/',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    en: '/staying-in-my-co-ownership-property-faqs/',
    es: '/es/disfrutar-copropiedad-preguntas-frecuentes/',
    fr: '/fr/profiter-copropriete-questions-frequentes/',
    de: '/de/aufenthalt-ferienimmobilie-haeufige-fragen/',
    priority: '0.6',
    changefreq: 'monthly',
  },
];

// ──────────────────────────────────────────────────────────────────────────
// LOCALE-ONLY pages — pillar content commissioned per-language for SEO,
// with no direct English equivalent. No hreflang alternates emitted.
// ──────────────────────────────────────────────────────────────────────────
const LOCALE_ONLY_PAGES = [
  // Spanish pillar + SEO posts
  { url: '/es/copropiedad/',                          priority: '0.9',  changefreq: 'monthly' },
  { url: '/es/blog/copropiedad-vs-multipropiedad/',   priority: '0.85', changefreq: 'monthly' },
  { url: '/es/blog/guia-comprar-copropiedad-espana/', priority: '0.85', changefreq: 'monthly' },
  // French pillar + SEO posts
  { url: '/fr/copropriete-residence-secondaire/',                priority: '0.9',  changefreq: 'monthly' },
  { url: '/fr/blog/acheter-residence-secondaire-a-plusieurs/',   priority: '0.85', changefreq: 'monthly' },
  { url: '/fr/blog/copropriete-vs-multipropriete/',              priority: '0.8',  changefreq: 'monthly' },
  // German pillar — added in 1e0424e plan; SEO posts to follow once written
  { url: '/de/miteigentum-ferienimmobilie/',                     priority: '0.9',  changefreq: 'monthly' },
];

// ──────────────────────────────────────────────────────────────────────────
// English-only pages that don't have locale variants (yet).
// ──────────────────────────────────────────────────────────────────────────
const EN_ONLY_PAGES = [
  { url: '/our-mission/',  priority: '0.5', changefreq: 'monthly' },
  { url: '/ownership/',    priority: '0.5', changefreq: 'monthly' },
  // /favourites/ intentionally excluded — noindex personal page
];

// ──────────────────────────────────────────────────────────────────────────
// Destinations — only Mallorca and Ibiza exist in ES/FR. Other English
// destinations stay English-only.
// ──────────────────────────────────────────────────────────────────────────
const DESTINATION_GROUPS = [
  {
    en: '/destinations/mallorca/',
    es: '/es/destinos/mallorca/',
    fr: '/fr/destinations/mallorque/',
    priority: '0.85',
    changefreq: 'weekly',
  },
  {
    en: '/destinations/ibiza/',
    es: '/es/destinos/ibiza/',
    fr: '/fr/destinations/ibiza/',
    priority: '0.85',
    changefreq: 'weekly',
  },
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
  const alternates = {};
  for (const locale of ['en', 'es', 'fr']) {
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
    .select('slug, date_added')
    .order('date_added', { ascending: false });

  // Blog posts (from static JSON for stability)
  const posts = JSON.parse(fs.readFileSync(path.join(cwd, 'lib', 'posts.json'), 'utf-8'));

  // English destination slugs (other than mallorca/ibiza which are in DESTINATION_GROUPS)
  const destDir = path.join(cwd, 'content', 'destinations');
  const destSlugs = fs.readdirSync(destDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
    .filter(slug => slug !== 'mallorca' && slug !== 'ibiza');

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Locale-paired static pages
    ...PAGE_GROUPS.flatMap(g => emitGroup(g)),

    // English-only static pages
    ...EN_ONLY_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Locale-only pillar + SEO content (no hreflang alternates)
    ...LOCALE_ONLY_PAGES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Destinations that have all three locales (Mallorca, Ibiza)
    ...DESTINATION_GROUPS.flatMap(g => emitGroup(g)),

    // English-only destinations
    ...destSlugs.map(slug =>
      urlEntry(`${BASE}/destinations/${slug}/`, '0.8', 'weekly')
    ),

    // Property detail pages — emit EN / ES / FR / DE with reciprocal hreflang
    ...(properties || []).flatMap(p => {
      const altset = {
        en: `/property/${p.slug}/`,
        es: `/es/propiedades/${p.slug}/`,
        fr: `/fr/proprietes/${p.slug}/`,
        de: `/de/immobilien/${p.slug}/`,
      };
      const lastmod = p.date_added ? p.date_added.split('T')[0] : today;
      return [
        urlEntry(`${BASE}${altset.en}`, '0.7', 'weekly', lastmod, altset),
        urlEntry(`${BASE}${altset.es}`, '0.7', 'weekly', lastmod, altset),
        urlEntry(`${BASE}${altset.fr}`, '0.7', 'weekly', lastmod, altset),
        urlEntry(`${BASE}${altset.de}`, '0.7', 'weekly', lastmod, altset),
      ];
    }),

    // Blog posts — emit EN / ES / FR / DE with reciprocal hreflang. Bodies are
    // translated for the top-9 most-recent; the rest serve EN content under
    // localised chrome + translated title/excerpt, which is enough for
    // indexing and signals the page exists in the visitor's language.
    ...posts.flatMap(p => {
      const altset = {
        en: `/blog/${p.slug}/`,
        es: `/es/blog/${p.slug}/`,
        fr: `/fr/blog/${p.slug}/`,
        de: `/de/blog/${p.slug}/`,
      };
      return [
        urlEntry(`${BASE}${altset.en}`, '0.6', 'never', p.date || today, altset),
        urlEntry(`${BASE}${altset.es}`, '0.6', 'never', p.date || today, altset),
        urlEntry(`${BASE}${altset.fr}`, '0.6', 'never', p.date || today, altset),
        urlEntry(`${BASE}${altset.de}`, '0.6', 'never', p.date || today, altset),
      ];
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
