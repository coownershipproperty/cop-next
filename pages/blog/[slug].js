import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { createClient } from '@supabase/supabase-js';
import { FEATURED_PROPERTY_SLUGS } from '@/lib/featured-properties';
import { localeFromPath } from '@/lib/i18n';

// Locale-aware UI strings for the blog template chrome (sidebar, back link,
// related-posts heading, etc.). The post body itself is rendered from the
// locale-specific content_{es,fr} column where available, falling back to
// the English content for posts that haven't been translated yet.
const COPY = {
  en: {
    featured_heading: 'Featured Homes',
    featured_from: 'From',
    browse_all_homes: 'Browse all homes',
    quick_links_heading: 'Quick Links',
    ql_browse: 'Browse all properties',
    ql_how: 'How co-ownership works',
    ql_more: 'More articles',
    ql_contact: 'Speak to COP',
    related_eyebrow: 'Similar Posts',
    related_heading: 'More from Co-Ownership Property',
    back_link: '← Back to Blog',
  },
  es: {
    featured_heading: 'Propiedades destacadas',
    featured_from: 'Desde',
    browse_all_homes: 'Ver todas las propiedades',
    quick_links_heading: 'Enlaces rápidos',
    ql_browse: 'Ver todas las propiedades',
    ql_how: 'Cómo funciona la copropiedad',
    ql_more: 'Más artículos',
    ql_contact: 'Habla con COP',
    related_eyebrow: 'Publicaciones relacionadas',
    related_heading: 'Más de Co-Ownership Property',
    back_link: '← Volver al blog',
  },
  fr: {
    featured_heading: 'Propriétés en vedette',
    featured_from: 'À partir de',
    browse_all_homes: 'Voir toutes les propriétés',
    quick_links_heading: 'Liens rapides',
    ql_browse: 'Voir toutes les propriétés',
    ql_how: 'Comment fonctionne la copropriété',
    ql_more: "Plus d'articles",
    ql_contact: 'Parler à COP',
    related_eyebrow: 'Articles similaires',
    related_heading: 'Plus de Co-Ownership Property',
    back_link: '← Retour au blog',
  },
};

// Locale is derived from the URL path only — never from a cookie. A page at
// /blog/<slug>/ is the canonical English version regardless of any cookie
// value left over from the visitor's earlier browsing. Spanish/French blog
// posts live at /es/blog/<slug>/ and /fr/blog/<slug>/ respectively.

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£' };

function formatPropertyPrice(price, currency = 'EUR') {
  if (!price) return '';
  const amount = Number(price);
  if (Number.isNaN(amount)) return '';
  return `${CURRENCY_SYMBOLS[currency] || currency}${amount.toLocaleString('en-GB')}`;
}

function formatPropertyLocation(property) {
  return [property.city, property.region, property.country].filter(Boolean).join(' | ');
}

function BlogKeyPointIcon({ name }) {
  const paths = {
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
    deed: <><path d="M7 3h10v18H7z" /><path d="M10 7h4M10 11h4M10 15h4" /></>,
    price: <><path d="M14.5 6.5A5.5 5.5 0 1 0 14.5 17.5" /><path d="M5.5 10h8M5.5 14h8" /></>,
    bicycle: <><circle cx="7" cy="17" r="4" /><circle cx="17" cy="17" r="4" /><path d="m7 17 4-8h3l3 8M9 13h7M10 6h3" /></>,
  };

  return (
    <span className="bh-key-point-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {paths[name] || paths.deed}
      </svg>
    </span>
  );
}

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashString(value) {
  return normalizeText(value).split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
}

function getLocationAliases(term) {
  const normalized = normalizeText(term).trim();
  if (normalized.length < 3) return [];

  const stopWords = new Set(['and', 'the', 'with', 'from', 'saint', 'sainte', 'sur', 'les', 'des']);
  const tokens = normalized
    .split(' ')
    .filter(token => token.length >= 4 && !stopWords.has(token));

  return [...new Set([normalized, ...tokens])];
}

function scoreLocationTerm(term, postText, weight) {
  const aliases = getLocationAliases(term);
  if (aliases.length === 0) return 0;
  if (aliases[0] && postText.includes(aliases[0])) return weight;
  return aliases.slice(1).some(alias => postText.includes(alias)) ? Math.max(1, weight - 2) : 0;
}

function pickSidebarProperties(rows, post) {
  const bySlug = Object.fromEntries((rows || []).map(property => [property.slug, property]));
  const orderedProperties = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(property => property && property.img);

  if (orderedProperties.length <= 3) return orderedProperties;

  const postText = normalizeText([
    post.title,
    post.category,
    post.subtitle,
    post.excerpt,
  ].filter(Boolean).join(' '));

  const scoredProperties = orderedProperties.map((property, index) => ({
    property,
    index,
    score:
      scoreLocationTerm(property.city, postText, 6) +
      scoreLocationTerm(property.region, postText, 5) +
      scoreLocationTerm(property.country, postText, 4),
  }));

  if (scoredProperties.some(item => item.score > 0)) {
    return scoredProperties
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 3)
      .map(item => item.property);
  }

  const offset = Math.abs(hashString(post.slug || post.title)) % orderedProperties.length;
  return [...orderedProperties.slice(offset), ...orderedProperties.slice(0, offset)].slice(0, 3);
}

export async function getStaticPaths() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true);

  let slugs = (data || []).map(p => p.slug);

  // Fallback: if Supabase posts table is empty (migration not yet run), use JSON file
  if (slugs.length === 0) {
    try {
      const { default: jsonPosts } = await import('@/lib/posts.json');
      slugs = jsonPosts.map(p => p.slug);
    } catch (_) {}
  }

  // fallback: 'blocking' so newly added posts render on first request without a deploy
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const supabase = getSupabase();

  // Fetch the post
  const { data: postRow } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  // Fallback: if not in Supabase yet, try the JSON file (pre-migration safety net)
  if (!postRow) {
    try {
      const { default: jsonPosts } = await import('@/lib/posts.json');
      const jsonPost = jsonPosts.find(p => p.slug === params.slug);
      if (!jsonPost) return { notFound: true };
      // Wrap in same shape and continue
      const content = (jsonPost.content || '').replace(
        /(<div)([^>]*style="[^"]*grid-template-columns\s*:\s*1fr\s+1fr[^"]*")/gi,
        '$1 class="blog-two-col"$2'
      );
      const relatedRaw = jsonPosts.filter(p => p.slug !== params.slug).slice(0, 3);
      const jsonRelatedPosts = relatedRaw.map(p => ({
        slug: p.slug, title: p.title, category: p.category,
        dateFormatted: p.dateFormatted, heroImage: p.heroImage,
      }));
      return {
        props: { post: { ...jsonPost, content }, relatedPosts: jsonRelatedPosts, featuredProperties: [] },
        revalidate: 3600,
      };
    } catch (_) { return { notFound: true }; }
  }

  // Normalise field names — preserve _es/_fr translation columns alongside
  // the English originals so the page can swap based on the visitor's locale.
  const post = {
    slug:          postRow.slug,
    title:         postRow.title,
    title_es:      postRow.title_es || null,
    title_fr:      postRow.title_fr || null,
    category:      postRow.category,
    date:          postRow.date,
    dateFormatted: postRow.date_formatted,
    subtitle:      postRow.subtitle,
    subtitle_es:   postRow.subtitle_es || null,
    subtitle_fr:   postRow.subtitle_fr || null,
    excerpt:       postRow.excerpt,
    excerpt_es:    postRow.excerpt_es || null,
    excerpt_fr:    postRow.excerpt_fr || null,
    heroImage:     postRow.hero_image,
    heroImageAlt:  postRow.hero_image_alt || null,
    heroImageCaption: postRow.hero_image_caption || null,
    keyPoints:     Array.isArray(postRow.key_points)
      ? postRow.key_points
        .filter(point => point && typeof point === 'object' && point.text)
        .slice(0, 4)
        .map(point => ({
          icon: String(point.icon || 'deed'),
          eyebrow: String(point.eyebrow || ''),
          text: String(point.text),
        }))
      : [],
    content:       postRow.content || '',
    content_es:    postRow.content_es || null,
    content_fr:    postRow.content_fr || null,
    // Author byline — column may or may not exist yet in Supabase; falls
    // back to David Olsson (founder) when unset.
    byline:        postRow.byline || null,
  };

  // Legacy imported posts can contain inline two-column grids; tag them so CSS can stack them on mobile.
  post.content = post.content.replace(
    /(<div)([^>]*style="[^"]*grid-template-columns\s*:\s*1fr\s+1fr[^"]*")/gi,
    '$1 class="blog-two-col"$2'
  );

  // Related posts: prefer same category, then fill with recent posts.
  const { data: categoryRelatedRows } = await supabase
    .from('posts')
    .select('slug, title, title_es, title_fr, category, date_formatted, hero_image')
    .eq('published', true)
    .neq('slug', params.slug)
    .eq('category', post.category)
    .order('date', { ascending: false })
    .limit(3);

  let relatedRows = categoryRelatedRows || [];

  if (relatedRows.length < 3) {
    const usedSlugs = new Set([params.slug, ...relatedRows.map(p => p.slug)]);
    const { data: fallbackRows } = await supabase
      .from('posts')
      .select('slug, title, title_es, title_fr, category, date_formatted, hero_image')
      .eq('published', true)
      .neq('slug', params.slug)
      .order('date', { ascending: false })
      .limit(8);

    relatedRows = [
      ...relatedRows,
      ...(fallbackRows || []).filter(p => !usedSlugs.has(p.slug)).slice(0, 3 - relatedRows.length),
    ];
  }

  const relatedPosts = relatedRows.map(p => ({
    slug: p.slug, title: p.title, title_es: p.title_es || null, title_fr: p.title_fr || null, category: p.category,
    dateFormatted: p.date_formatted, heroImage: p.hero_image,
  }));

  const { data: featuredRows } = await supabase
    .from('properties')
    .select('slug, title, title_es, title_fr, img, price, currency, city, region, country')
    .in('slug', FEATURED_PROPERTY_SLUGS)
    .in('status', ['Live', 'for_sale']);

  const featuredProperties = pickSidebarProperties(featuredRows, post).map(p => ({
    slug: p.slug,
    title: p.title,
    title_es: p.title_es || null,
    title_fr: p.title_fr || null,
    img: p.img,
    price: formatPropertyPrice(p.price, p.currency),
    location: formatPropertyLocation(p),
  }));

  return { props: { post, relatedPosts, featuredProperties }, revalidate: 3600 };
}

export default function BlogPost({ post, relatedPosts = [], featuredProperties = [] }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;

  // Pick the localised version of each post field; fall back to English.
  const title    = post[`title_${locale}`]    || post.title;
  const subtitle = post[`subtitle_${locale}`] || post.subtitle;
  const excerpt  = post[`excerpt_${locale}`]  || post.excerpt;
  const content  = post[`content_${locale}`]  || post.content;

  // Canonical URL is per-locale so search engines treat /blog/<slug>,
  // /es/blog/<slug> and /fr/blog/<slug> as separate language variants
  // rather than duplicate content.
  const blogPathPrefix = locale === 'en' ? '/blog' : `/${locale}/blog`;
  const canonicalUrl = `https://co-ownership-property.com${blogPathPrefix}/${post.slug}/`;
  const visibleRelatedPosts = relatedPosts.slice(0, 3);

  // ── Resolve author for byline + schema ──────────────────────────────────
  // Posts opt into a named byline via the (optional) `byline` field. When
  // unset, the founder David Olsson is the implicit author — most editorial
  // content on COP is his thinking. AI engines benefit from a Person entity
  // attribution rather than the Organization fallback that was previously
  // used here. Where the named author matches the team on /about-us/, we
  // reference the canonical Person @id so the entity graph is consistent
  // across the site.
  const KNOWN_AUTHORS = {
    'David Olsson': {
      '@id': 'https://co-ownership-property.com/about-us/#david-olsson',
      url: 'https://co-ownership-property.com/about-us/',
      image: 'https://co-ownership-property.com/wp-content/uploads/2025/11/unnamed-4-1.jpg',
      jobTitle: 'Founder',
    },
    'Dylan Olsson': {
      '@id': 'https://co-ownership-property.com/about-us/#dylan-olsson',
      url: 'https://co-ownership-property.com/about-us/',
      image: 'https://co-ownership-property.com/wp-content/uploads/2025/12/1761762811297.jpg',
      jobTitle: 'Sales',
    },
  };
  const authorName = (post.byline && String(post.byline).trim()) || 'David Olsson';
  const known = KNOWN_AUTHORS[authorName];
  const authorSchema = known
    ? { '@type': 'Person', '@id': known['@id'], name: authorName, url: known.url, image: known.image, jobTitle: known.jobTitle }
    : { '@type': 'Person', name: authorName };
  const authorUrl = known ? known.url : null;
  const bylinePrefix = locale === 'es' ? 'Por' : locale === 'fr' ? 'Par' : 'By';

  return (
    <>
      <Head>
        <title>{`${title} | Co-Ownership Property`}</title>
        <meta name="description" content={excerpt || subtitle || title} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt || subtitle} />
        {post.heroImage && <meta property="og:image" content={post.heroImage} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": title,
          "description": excerpt || subtitle || '',
          "image": post.heroImage || '',
          "url": canonicalUrl,
          "datePublished": post.date || '',
          "dateModified": post.date || '',
          "author": authorSchema,
          "publisher": {
            "@type": "Organization",
            "@id": "https://co-ownership-property.com/#organization",
            "name": "Co-Ownership Property",
            "url": "https://co-ownership-property.com",
            "logo": { "@type": "ImageObject", "url": "https://co-ownership-property.com/wp-content/uploads/2025/10/COP-Logo-Large.png" }
          },
          "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
          "inLanguage": locale
        }) }} />
        {/* Font aliases for WP inline styles handled via CSS variables in globals.css —
            no duplicate Google Fonts request needed */}
      </Head>

      <Header />

      {/* ── Blog Header ── */}
      <div className="bh-header">
        <div className="bh-header-inner">
          {post.category && <p className="bh-cat">{post.category}</p>}
          <h1 className="bh-title">{title}</h1>
          {subtitle && <p className="bh-sub">{subtitle}</p>}
          <p className="bh-meta">
            <span className="bh-byline">
              {bylinePrefix}{' '}
              {authorUrl
                ? <a href={authorUrl} rel="author">{authorName}</a>
                : <span rel="author">{authorName}</span>}
            </span>
            {post.dateFormatted && <span className="bh-date-inline">{post.dateFormatted}</span>}
          </p>
        </div>
      </div>

      {/* ── Hero Image ── */}
      {post.heroImage && (
        <figure className="bh-image-wrap">
          <div className="bh-image">
            <Image
              src={post.heroImage}
              alt={post.heroImageAlt || title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          {post.heroImageCaption && (
            <figcaption className="bh-image-caption">{post.heroImageCaption}</figcaption>
          )}
        </figure>
      )}

      {post.keyPoints.length > 0 && (
        <section className="bh-key-points" aria-label="Article at a glance">
          {post.keyPoints.map((point, index) => (
            <div className="bh-key-point" key={`${point.eyebrow}-${index}`}>
              <BlogKeyPointIcon name={point.icon} />
              <div>
                {point.eyebrow && <small>{point.eyebrow}</small>}
                <strong>{point.text}</strong>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Article ── */}
      <div className="blog-layout">
        <main className="blog-main">
          <article
            className="blog-article"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </main>

        <aside className="blog-sidebar" aria-label="Article sidebar">
          {featuredProperties.length > 0 && (
            <section className="bsb-section">
              <h2 className="bsb-heading">{t.featured_heading}</h2>
              {featuredProperties.map(property => {
                const propTitle = property[`title_${locale}`] || property.title;
                return (
                  <a key={property.slug} href={`/property/${property.slug}/`} className="bsb-prop-card">
                    <span className="bsb-prop-img-wrap">
                      <Image
                        src={property.img}
                        alt={propTitle}
                        fill
                        sizes="320px"
                        style={{ objectFit: 'cover' }}
                      />
                    </span>
                    <span className="bsb-prop-body">
                      {property.location && <span className="bsb-prop-loc">{property.location}</span>}
                      <span className="bsb-prop-title">{propTitle}</span>
                      {property.price && <span className="bsb-prop-price">{t.featured_from} {property.price}</span>}
                    </span>
                  </a>
                );
              })}
              <a className="bsb-view-all" href="/our-homes/">{t.browse_all_homes}</a>
            </section>
          )}

          <section className="bsb-section">
            <h2 className="bsb-heading">{t.quick_links_heading}</h2>
            <a className="bsb-dest-link" href={locale === 'es' ? '/es/propiedades/' : locale === 'fr' ? '/fr/proprietes/' : '/our-homes/'}>{t.ql_browse} <span>→</span></a>
            <a className="bsb-dest-link" href={locale === 'es' ? '/es/copropiedad/' : locale === 'fr' ? '/fr/copropriete-residence-secondaire/' : '/how-it-works/'}>{t.ql_how} <span>→</span></a>
            <a className="bsb-dest-link" href={locale === 'es' ? '/es/blog/' : locale === 'fr' ? '/fr/blog/' : '/all-our-blog/'}>{t.ql_more} <span>→</span></a>
            <a className="bsb-dest-link" href={locale === 'es' ? '/es/contacto/' : locale === 'fr' ? '/fr/contact/' : '/contact/'}>{t.ql_contact} <span>→</span></a>
          </section>
        </aside>
      </div>

      {visibleRelatedPosts.length > 0 && (
        <section className="blog-related">
          <p className="blog-related-eyebrow">{t.related_eyebrow}</p>
          <h2>{t.related_heading}</h2>
          <div className="blog-related-grid">
            {visibleRelatedPosts.map(related => (
              <a key={related.slug} href={`${locale === 'en' ? '/blog' : `/${locale}/blog`}/${related.slug}/`} className="blog-related-card">
                <span className="blog-related-img">
                  {related.heroImage
                    ? (
                      <Image
                        src={related.heroImage}
                        alt={related[`title_${locale}`] || related.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    )
                    : <span className="blog-related-placeholder" />
                  }
                </span>
                <span className="blog-related-body">
                  {related.category && <span className="blog-related-cat">{related.category}</span>}
                  <span className="blog-related-title">{related[`title_${locale}`] || related.title}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Breadcrumb back */}
      <div className="blog-back-wrap">
        <a href={locale === 'es' ? '/es/blog/' : locale === 'fr' ? '/fr/blog/' : '/all-our-blog/'} className="blog-back-link">{t.back_link}</a>
      </div>

      <Newsletter />
      <ExpertForm />

      <Footer />
    </>
  );
}
