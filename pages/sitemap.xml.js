import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://co-ownership-property.com';

// ── English static pages ──────────────────────────────────────────────────
const STATIC_PAGES_EN = [
  { url: '/',                                            priority: '1.0', changefreq: 'daily',   alternates: { en: '/', es: '/es/', fr: '/fr/' } },
  { url: '/our-homes/',                                  priority: '0.9', changefreq: 'daily'   },
  { url: '/how-it-works/',                               priority: '0.8', changefreq: 'monthly', alternates: { en: '/how-it-works/', es: '/es/como-funciona/', fr: '/fr/comment-ca-marche/' } },
  { url: '/about-us/',                                   priority: '0.7', changefreq: 'monthly' },
  { url: '/all-our-blog/',                               priority: '0.8', changefreq: 'daily'   },
  { url: '/contact/',                                    priority: '0.6', changefreq: 'monthly' },
  { url: '/buying-a-co-ownership-property-faqs/',        priority: '0.7', changefreq: 'monthly' },
  { url: '/staying-in-my-co-ownership-property-faqs/',   priority: '0.6', changefreq: 'monthly' },
  { url: '/our-mission/',                                priority: '0.5', changefreq: 'monthly' },
  { url: '/ownership/',                                  priority: '0.5', changefreq: 'monthly' },
  // /favourites/ intentionally excluded — noindex personal page
];

// ── Spanish locale static pages ───────────────────────────────────────────
const STATIC_PAGES_ES = [
  { url: '/es/',                priority: '0.9', changefreq: 'daily'   },
  { url: '/es/copropiedad/',    priority: '0.9', changefreq: 'monthly' }, // pillar — high priority
  // Pages added as they ship:
  // { url: '/es/como-funciona/',  priority: '0.8', changefreq: 'monthly' },
  // { url: '/es/propiedades/',    priority: '0.8', changefreq: 'daily'   },
  // { url: '/es/blog/copropiedad-vs-multipropiedad/', priority: '0.7', changefreq: 'monthly' },
];

// ── French locale static pages ────────────────────────────────────────────
const STATIC_PAGES_FR = [
  { url: '/fr/',                                       priority: '0.9', changefreq: 'daily'   },
  { url: '/fr/copropriete-residence-secondaire/',     priority: '0.9', changefreq: 'monthly' }, // pillar — high priority
  // Pages added as they ship:
  // { url: '/fr/comment-ca-marche/',                   priority: '0.8', changefreq: 'monthly' },
  // { url: '/fr/proprietes/',                          priority: '0.8', changefreq: 'daily'   },
  // { url: '/fr/blog/copropriete-vs-multipropriete/',  priority: '0.7', changefreq: 'monthly' },
  // { url: '/fr/blog/acheter-residence-secondaire-a-plusieurs/', priority: '0.7', changefreq: 'monthly' },
];

function xmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
}

// Single URL entry with optional <xhtml:link> alternates for hreflang.
function urlEntry(loc, priority, changefreq, lastmod, alternates) {
  const altLinks = alternates
    ? Object.entries(alternates).map(([locale, path]) =>
        `\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(BASE + path)}" />`
      ).join('')
    : '';
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${altLinks}
  </url>`;
}

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

  // Blog posts
  const posts = JSON.parse(fs.readFileSync(path.join(cwd, 'lib', 'posts.json'), 'utf-8'));

  // Destination slugs
  const destDir = path.join(cwd, 'content', 'destinations');
  const destSlugs = fs.readdirSync(destDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // English static pages (with hreflang alternates where available)
    ...STATIC_PAGES_EN.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq, null, p.alternates)),

    // Spanish locale pages
    ...STATIC_PAGES_ES.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // French locale pages
    ...STATIC_PAGES_FR.map(p => urlEntry(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Destination pages
    ...destSlugs.map(slug =>
      urlEntry(`${BASE}/${slug}/`, '0.8', 'weekly')
    ),

    // Property pages — from Supabase (always reflects current slugs)
    ...(properties || []).map(p =>
      urlEntry(`${BASE}/property/${p.slug}/`, '0.7', 'weekly', p.date_added ? p.date_added.split('T')[0] : today)
    ),

    // Blog posts
    ...posts.map(p =>
      urlEntry(`${BASE}/blog/${p.slug}/`, '0.6', 'never', p.date || today)
    ),
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
