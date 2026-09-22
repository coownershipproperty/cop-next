/**
 * lib/compare-hub-data.js — getStaticProps for every comparison hub.
 *
 * Server-only (it reads the filesystem). One function so the four hubs
 * cannot drift apart: the same order, the same grouping, and the same
 * "registered but ungrouped still appears rather than vanishing" rule.
 */
import fs from 'fs';
import path from 'path';
import { ORDER, GROUP_SLUGS, HUB_COPY } from '@/lib/compare-hub-groups';

const META_FILE = { en: 'compare-meta.json', es: 'compare-meta-es.json', fr: 'compare-meta-fr.json', de: 'compare-meta-de.json' };
const HUB_PATH = { en: '/compare/', es: '/es/comparativa/', fr: '/fr/comparaison/', de: '/de/vergleich/' };

export function buildHubProps(locale) {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', META_FILE[locale]), 'utf-8'));
  // Operator comparisons are not promoted in the public comparison hub.
  const excluded = new Set(GROUP_SLUGS.find(g => g.key === 'operators')?.slugs || []);
  const known = new Set(Object.keys(meta).filter(slug => !excluded.has(slug)));

  const items = ORDER.filter(s => known.has(s)).map(slug => ({
    slug,
    h1: meta[slug].h1 || meta[slug].title,
    subtitle: meta[slug].subtitle || meta[slug].metaDescription || '',
    dateModified: meta[slug].dateModified || null,
  }));
  // Anything registered but not in ORDER still appears, rather than vanishing.
  for (const slug of Object.keys(meta)) {
    if (!ORDER.includes(slug) && !excluded.has(slug)) {
      items.push({ slug, h1: meta[slug].h1 || meta[slug].title, subtitle: meta[slug].subtitle || '', dateModified: meta[slug].dateModified || null });
    }
  }

  const copy = HUB_COPY[locale];
  const groups = GROUP_SLUGS.map(g => ({
    key: g.key,
    heading: copy.groups[g.key].heading,
    blurb: copy.groups[g.key].blurb,
    items: g.slugs.map(s => items.find(i => i.slug === s)).filter(Boolean),
  })).filter(g => g.items.length);

  const ungrouped = items.filter(i => !GROUP_SLUGS.some(g => g.slugs.includes(i.slug)));

  // Every hub exists in every language, so the alternate set is fixed —
  // but it is built from the same map the pages use, not written twice.
  const alternates = Object.keys(HUB_PATH).map(lang => ({ lang, path: HUB_PATH[lang] }));

  return { props: { locale, items, groups, ungrouped, alternates }, revalidate: 3600 };
}
