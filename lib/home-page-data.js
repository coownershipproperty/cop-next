// lib/home-page-data.js
//
// getStaticProps for the homepage, in any language.
//
// One factory, ten locales. Before 22 Sep 2026 there were three separate data
// paths — the English page had its own inline getStaticProps, six locales went
// through localeHomeStaticProps here, and es/fr/de each had a hand-written
// copy — which is how the English homepage ended up with destination tiles and
// the localised ones did not.
//
// Lives in lib/, not in the component, because a component module is part of
// the client bundle and cannot resolve node:fs — the same split as
// lib/locale-page-data.js / components/LocalePage.js.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { localeColumns, numberLocale, routePath, localePrefix } from '@/lib/i18n';
import { getFeaturedSlugs } from '@/lib/featured-properties';

// Destination tiles: order, and the English pillar page each one links to.
// Labels come from the locale's copy file. A locale with its own destination
// pages gets those; the rest link to that locale's listing page rather than
// dropping the reader into an English pillar page.
const DESTINATION_ORDER = [
  { key: 'usa',      country: 'USA',      href: '/usa-fractional-ownership-properties/' },
  { key: 'spain',    country: 'Spain',    href: '/spain-fractional-ownership-properties/' },
  { key: 'italy',    country: 'Italy',    href: '/italy-fractional-ownership-properties/' },
  { key: 'france',   country: 'France',   href: '/france-fractional-ownership-properties/' },
  { key: 'austria',  country: 'Austria',  href: '/austria-fractional-ownership-properties/' },
  { key: 'germany',  country: 'Germany',  href: '/germany-fractional-ownership-properties/' },
  { key: 'mexico',   country: 'Mexico',   href: '/mexico-fractional-ownership-properties/' },
  { key: 'portugal', country: 'Portugal', href: '/portugal-fractional-ownership-properties/' },
  { key: 'england',  country: 'England',  href: '/england-fractional-ownership-properties/' },
  { key: 'sweden',   country: 'Sweden',   href: '/sweden-fractional-ownership-properties/' },
  { key: 'croatia',  country: 'Croatia',  href: '/croatia-fractional-ownership-properties/' },
];

// Tile photo per country: a real, bright listing photo (David, 20 Sep — the
// dark-graded set is for the hero only). Chosen by slug; if that home is no
// longer live the tile falls back to the top-priced live listing's photo.
const DEST_PICK = {
  usa: 'palm-desert-california-4-bed-house-with-pool',
  spain: 'peguera-mallorca-spain-4-bed-villa-with-sea-views-infinity-pool',
  italy: 'castiglioncello-del-trinoro-si-italy-4-bed-house',
  france: '7th-arrondissement-paris-france-2-bed-apartment',
  austria: 'burserberg-austria-3-bed-penthouse-with-mountain-views',
  germany: 'tegernsee-bavaria-germany-3-bed-penthouse-maisonette-with-lake-views',
  mexico: 'cabo-san-lucas-mexico-3-bed-villa-with-infinity-pool',
  portugal: 'albufeira-algarve-portugal-4-bed-villa-with-sea-view-roof-terrace',
  england: 'london-england-3-bed-house-2',
  sweden: 'norrnas-sweden-5-bed-villa-with-terrace',
  croatia: 'kukci-croatia-3-bed-villa-with-sea-views',
};

const DEST_OVERRIDE_IMG = {
  usa: '/redesign/usa-palm-desert.jpg',
  spain: '/redesign/spain-sunny-v1.png',
  portugal: '/redesign/portugal-tidy-v1.png',
};

function readCopy(locale) {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'content', 'home', `${locale}.json`), 'utf-8')
  );
}

/**
 * getStaticProps for the homepage of `locale`.
 *
 *   export const getStaticProps = homeStaticProps('es');
 */
export function homeStaticProps(locale) {
  return async function getStaticProps() {
    const copy = readCopy(locale);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let FEATURED_PROPERTY_SLUGS = await getFeaturedSlugs(supabase);

    // Self-healing daily rotation: if the featured table hasn't been rewritten
    // today (cron missed, scheduler hiccup), rotate it right here during the
    // ISR rebuild. computeFeaturedLineup is deterministic per date, so a later
    // cron run writing the same day's lineup is a harmless no-op. English only
    // — ten locales racing to write the same rows would be ten times the work
    // for the same result.
    if (locale === 'en') {
      try {
        const { data: freshness } = await supabase
          .from('featured_properties')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);
        const lastWrite = freshness?.[0]?.updated_at ? freshness[0].updated_at.slice(0, 10) : null;
        const today = new Date().toISOString().slice(0, 10);
        if (lastWrite && lastWrite < today && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { computeFeaturedLineup } = await import('@/lib/featured-rotation');
          const { createSupabaseAdminClient } = await import('@/lib/supabaseAdmin');
          const db = createSupabaseAdminClient();
          const lineup = await computeFeaturedLineup(db, today);
          if (lineup && lineup.length > 0) {
            const now = new Date().toISOString();
            await db.from('featured_properties').delete().neq('slug', '');
            await db.from('featured_properties').insert(
              lineup.map((item, i) => ({ slug: item.slug, position: i, reason: item.reason, updated_at: now }))
            );
            FEATURED_PROPERTY_SLUGS = lineup.map((l) => l.slug);
            console.log(`[home] self-healed featured rotation for ${today} (${lineup.length} slots)`);
          }
        }
      } catch (e) {
        console.error('[home] self-heal rotation skipped:', e.message);
      }
    }

    // Featured properties. The title comes through in every language the row
    // has, because PropertyCard picks `title_${locale}` itself.
    const titleColumns = locale === 'en' ? 'title' : `title, ${localeColumns(['title'], { locales: [locale] })}`;
    const { data: rows, error: featuredError } = await supabase
      .from('properties')
      .select(`slug, ${titleColumns}, img, images, total_images, drive_url, region, country, price, currency, share_denominator, beds, size, date_added, is_discreet`)
      .in('slug', FEATURED_PROPERTY_SLUGS)
      .in('status', ['Live', 'for_sale'])
      .eq('is_discreet', false);

    const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
    const featuredProps = FEATURED_PROPERTY_SLUGS
      .map(slug => bySlug[slug])
      .filter(Boolean)
      .map(p => ({
        slug: p.slug,
        title: p.title,
        ...(locale === 'en' ? {} : { [`title_${locale}`]: p[`title_${locale}`] || p.title }),
        img: p.img,
        images: (p.images || []).slice(0, 3),
        totalImages: p.is_discreet ? 1 : (p.total_images || 0),
        hasGallery: !p.is_discreet && !!p.drive_url,
        discreet: !!p.is_discreet,
        share_denominator: p.share_denominator || null,
        dateAdded: p.date_added || null,
        region: p.region || '',
        country: p.country || '',
        price: p.price || null,
        currency: p.currency || 'EUR',
        beds: p.beds || null,
        size: p.size || null,
        // "New" tag — listed in the last 7 days. Computed at build; the page
        // revalidates hourly so it stays fresh enough.
        isNew: !!(p.date_added && (Date.now() - Date.parse(p.date_added)) < 7 * 864e5),
      }));

    const { count: propertyCount, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Live', 'for_sale']);

    // Blog posts are English-only today. es/fr/de route /xx/blog/, so the card
    // keeps the reader inside their own language even though the article is in
    // English. it/nl/pt/sv/da/no have no blog route at all, and HomeView drops
    // the whole section for them rather than linking out of the language.
    const hasBlog = Boolean(routePath(locale, 'blog'));
    const { data: postRows, error: postsError } = hasBlog
      ? await supabase
          .from('posts')
          .select('slug, title, excerpt, date, hero_image, category')
          .eq('published', true)
          .order('date', { ascending: false })
          .limit(3)
      : { data: [], error: null };

    if (featuredError || countError || postsError) {
      console.error(`Supabase error (homepage ${locale}):`, { featured: featuredError, count: countError, posts: postsError });
      // A failed ISR refresh must leave the last known-good homepage intact.
      throw new Error(`Unable to refresh the ${locale} homepage data from Supabase`);
    }

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

    // Destinations, from the same live inventory. One query, ~300 rows at
    // build time; nothing here is typed in by hand.
    const { data: liveRows } = await supabase
      .from('properties')
      .select('slug, country, img, price, currency, is_discreet')
      .in('status', ['Live', 'for_sale']);
    const byCountry = {};
    const imgBySlug = {};
    for (const r of liveRows || []) {
      const c = r.country || '';
      // Discreet homes count towards each country (they are for sale, and the
      // homepage total already includes them) but never lend their photo.
      const showable = !r.is_discreet;
      if (showable && r.slug && r.img) imgBySlug[r.slug] = r.img;
      if (!byCountry[c]) byCountry[c] = { count: 0, img: showable ? (r.img || '') : '', top: -1 };
      byCountry[c].count += 1;
      const pr = Number(r.price) || 0;
      if (showable && pr > byCountry[c].top && r.img) { byCountry[c].top = pr; byCountry[c].img = r.img; }
    }

    const localeDestinations = routePath(locale, 'destinations');
    const localeHomes = routePath(locale, 'homes') || '/our-homes/';
    const labels = copy?.destinations?.labels || {};
    const destinations = DESTINATION_ORDER
      .map(({ key, country, href }) => ({
        key,
        label: labels[key] || country,
        href: locale === 'en'
          ? href
          : (localeDestinations ? `${localeDestinations}${href.replace(/^\//, '')}` : localeHomes),
        count: byCountry[country]?.count || 0,
        img: DEST_OVERRIDE_IMG[key] || imgBySlug[DEST_PICK[key]] || byCountry[country]?.img || '',
      }))
      .filter(d => d.count > 0);

    return {
      props: { locale, copy, propertyCount: propertyCount || 0, featuredProps, latestPosts, destinations },
      revalidate: 3600,
    };
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
