import fs from 'fs';
import path from 'path';

const BASE = 'https://co-ownership-property.com';

// Priority / changefreq config per route type
const STATIC_PAGES = [
  { url: '/',            priority: '1.0', changefreq: 'daily'   },
  { url: '/our-homes/',  priority: '0.9', changefreq: 'daily'   },
  { url: '/how-it-works/', priority: '0.8', changefreq: 'monthly' },
  { url: '/about-us/',   priority: '0.7', changefreq: 'monthly' },
  { url: '/all-our-blog/', priority: '0.8', changefreq: 'daily' },
  { url: '/contact/',    priority: '0.6', changefreq: 'monthly' },
  { url: '/favourites/', priority: '0.4', changefreq: 'never'   },
  { url: '/buying-a-co-ownership-property-faqs/', priority: '0.7', changefreq: 'monthly' },
  { url: '/staying-in-my-co-ownership-property-faqs/', priority: '0.6', changefreq: 'monthly' },
  { url: '/our-mission/', priority: '0.5', changefreq: 'monthly' },
  { url: '/ownership/',   priority: '0.5', changefreq: 'monthly' },
];

function escape(str) {
  return str.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
}

function url(loc, priority, changefreq, lastmod) {
  return `  <url>
    <loc>${escape(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

export async function getServerSideProps({ res }) {
  const cwd = process.cwd();

  // Properties
  const properties = JSON.parse(fs.readFileSync(path.join(cwd, 'lib', 'properties.json'), 'utf-8'));

  // Blog posts
  const posts = JSON.parse(fs.readFileSync(path.join(cwd, 'lib', 'posts.json'), 'utf-8'));

  // Destination slugs
  const destDir = path.join(cwd, 'content', 'destinations');
  const destSlugs = fs.readdirSync(destDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Static pages
    ...STATIC_PAGES.map(p => url(`${BASE}${p.url}`, p.priority, p.changefreq)),

    // Destination pages
    ...destSlugs.map(slug =>
      url(`${BASE}/${slug}/`, '0.8', 'weekly')
    ),

    // Property pages
    ...properties.map(p =>
      url(`${BASE}/property/${p.slug}/`, '0.7', 'weekly', p.dateAdded || today)
    ),

    // Blog posts
    ...posts.map(p =>
      url(`${BASE}/blog/${p.slug}/`, '0.6', 'never', p.date || today)
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() { return null; }
