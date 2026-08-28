// lib/home-page-data.js
//
// getStaticProps factory for the translated locale homepages
// (components/LocaleHome.js). Lives in lib/, not in the component, because a
// component module is part of the client bundle and cannot resolve node:fs —
// the same split as lib/locale-page-data.js / components/LocalePage.js.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { localeColumns, localizedField, numberLocale } from '@/lib/i18n';
import { getFeaturedSlugs } from '@/lib/featured-properties';

export function localeHomeStaticProps(locale) {
  return async function getStaticProps() {
    const copy = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'content', 'home', `${locale}.json`), 'utf-8')
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const FEATURED_PROPERTY_SLUGS = await getFeaturedSlugs(supabase);

    const { data: rows } = await supabase
      .from('properties')
      .select(`slug, ${localeColumns(['title'], { locales: [locale] })}, img, region, country, price, currency, beds, size`)
      .in('slug', FEATURED_PROPERTY_SLUGS)
      .in('status', ['Live', 'for_sale']);

    const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
    const featuredProps = FEATURED_PROPERTY_SLUGS
      .map(slug => bySlug[slug])
      .filter(Boolean)
      .map(p => ({
        slug: p.slug,
        title: localizedField(p, 'title', locale),
        img: p.img,
        region: p.region || '',
        country: p.country || '',
        price: p.price || null,
        currency: p.currency || 'EUR',
        beds: p.beds || null,
        size: p.size || null,
      }));

    const { count: propertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Live', 'for_sale']);

    // Blog posts are English-only for these locales today; surface the latest
    // English posts rather than an empty section (same fallback the ES page
    // used before Spanish posts existed).
    const { data: postRows } = await supabase
      .from('posts')
      .select('slug, title, excerpt, date, hero_image, category')
      .eq('published', true)
      .order('date', { ascending: false })
      .limit(3);

    const latestPosts = (postRows || []).map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || '',
      dateFormatted: p.date
        ? new Date(p.date).toLocaleDateString(numberLocale(locale), { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
        : '',
      heroImage: p.hero_image || '',
      category: p.category || '',
    }));

    return { props: { copy, propertyCount: propertyCount || 0, featuredProps, latestPosts }, revalidate: 3600 };
  };
}


/**
 * getStaticProps factory for pages whose only server-side input is a copy
 * JSON: content/{dir}/{locale}.json → { props: { copy } }.
 * Used by the locale about and contact pages.
 */
export function localeJsonStaticProps(dir, locale) {
  return async function getStaticProps() {
    const copy = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'content', dir, `${locale}.json`), 'utf-8')
    );
    return { props: { copy }, revalidate: 3600 };
  };
}
