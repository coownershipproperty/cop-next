// lib/locale-page-data.js
//
// Server-only data loaders for the content-driven locale pages. These live
// apart from components/LocalePage.js and components/PillarPage.js on purpose:
// a component module is part of the client bundle, and `fs` cannot be resolved
// there. Next.js strips imports that are only reached from getStaticProps in a
// page file, so importing this module from pages/{locale}/*.js is safe.
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { localeColumns, pickLocalized } from '@/lib/i18n';

function readJson(...segments) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), ...segments), 'utf-8'));
}

/**
 * Featured inventory for a locale page's property grid. Returns rows shaped
 * for PropertyCard, carrying every launched locale's title column so the card
 * can localise itself.
 */
async function fetchProperties(limit) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase
    .from('properties')
    .select(`slug, ${localeColumns(['title'])}, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type, is_discreet`)
    // Public listings only — hidden and staged rows must never render.
    .in('status', ['Live', 'for_sale'])
    .limit(limit);

  if (error) {
    console.error('[locale-page-data] property fetch failed:', error.message);
    return [];
  }

  return (data || []).map((p) => ({
    slug: p.slug,
    title: p.title,
    ...pickLocalized(p, ['title']),
    img: p.img,
    images: (p.images || []).slice(0, 3),
    totalImages: p.is_discreet ? 1 : (p.total_images || 0),
    driveUrl: p.is_discreet ? null : (p.drive_url || null),
    price: p.price || null,
    currency: p.currency || 'EUR',
    share_denominator: p.share_denominator || null,
    country: p.country || '',
    region: p.region || '',
    city: p.city || '',
    beds: p.beds || null,
    size: p.size || null,
    status: p.status || '',
    property_type: p.property_type || '',
  }));
}

/**
 * getStaticProps factory for a content-driven locale page.
 *
 *   export const getStaticProps = localePageStaticProps('it', 'contact');
 *   export const getStaticProps = localePageStaticProps('it', 'home', { withProperties: 6 });
 */
export function localePageStaticProps(locale, page, { withProperties = 0 } = {}) {
  return async function getStaticProps() {
    const doc = readJson('content', 'pages', locale, `${page}.json`);
    const properties = withProperties ? await fetchProperties(withProperties) : [];
    return { props: { locale, doc, properties }, revalidate: 3600 };
  };
}

/**
 * getStaticProps factory for a locale's pillar page.
 *
 *   export const getStaticProps = pillarStaticProps('it');
 */
export function pillarStaticProps(locale) {
  return async function getStaticProps() {
    const doc = readJson('content', 'pillars', `${locale}.json`);
    return { props: { locale, doc }, revalidate: 3600 };
  };
}
