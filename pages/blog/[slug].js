import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { createClient } from '@supabase/supabase-js';
import { FEATURED_PROPERTY_SLUGS } from '@/lib/featured-properties';

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

  // Normalise field names
  const post = {
    slug:          postRow.slug,
    title:         postRow.title,
    category:      postRow.category,
    date:          postRow.date,
    dateFormatted: postRow.date_formatted,
    subtitle:      postRow.subtitle,
    excerpt:       postRow.excerpt,
    heroImage:     postRow.hero_image,
    content:       postRow.content || '',
  };

  // Legacy imported posts can contain inline two-column grids; tag them so CSS can stack them on mobile.
  post.content = post.content.replace(
    /(<div)([^>]*style="[^"]*grid-template-columns\s*:\s*1fr\s+1fr[^"]*")/gi,
    '$1 class="blog-two-col"$2'
  );

  // Related posts: prefer same category, then fill with recent posts.
  const { data: categoryRelatedRows } = await supabase
    .from('posts')
    .select('slug, title, category, date_formatted, hero_image')
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
      .select('slug, title, category, date_formatted, hero_image')
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
    slug: p.slug, title: p.title, category: p.category,
    dateFormatted: p.date_formatted, heroImage: p.hero_image,
  }));

  const { data: featuredRows } = await supabase
    .from('properties')
    .select('slug, title, img, price, currency, city, region, country')
    .in('slug', FEATURED_PROPERTY_SLUGS);

  const featuredProperties = pickSidebarProperties(featuredRows, post).map(p => ({
    slug: p.slug,
    title: p.title,
    img: p.img,
    price: formatPropertyPrice(p.price, p.currency),
    location: formatPropertyLocation(p),
  }));

  return { props: { post, relatedPosts, featuredProperties }, revalidate: 3600 };
}

export default function BlogPost({ post, relatedPosts = [], featuredProperties = [] }) {
  const canonicalUrl = `https://co-ownership-property.com/blog/${post.slug}/`;
  const visibleRelatedPosts = relatedPosts.slice(0, 3);

  return (
    <>
      <Head>
        <title>{`${post.title} | Co-Ownership Property`}</title>
        <meta name="description" content={post.excerpt || post.subtitle || post.title} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.subtitle} />
        {post.heroImage && <meta property="og:image" content={post.heroImage} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt || post.subtitle || '',
          "image": post.heroImage || '',
          "url": canonicalUrl,
          "datePublished": post.date || '',
          "dateModified": post.date || '',
          "author": { "@type": "Organization", "name": "Co-Ownership Property", "url": "https://co-ownership-property.com" },
          "publisher": {
            "@type": "Organization",
            "name": "Co-Ownership Property",
            "logo": { "@type": "ImageObject", "url": "/wp-content/uploads/2025/10/COP-Logo-Large.png" }
          },
          "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
        }) }} />
        {/* Font aliases for WP inline styles handled via CSS variables in globals.css —
            no duplicate Google Fonts request needed */}
      </Head>

      <Header />

      {/* ── Blog Header ── */}
      <div className="bh-header">
        <div className="bh-header-inner">
          {post.category && <p className="bh-cat">{post.category}</p>}
          <h1 className="bh-title">{post.title}</h1>
          {post.subtitle && <p className="bh-sub">{post.subtitle}</p>}
          {post.dateFormatted && <p className="bh-date">{post.dateFormatted}</p>}
        </div>
      </div>

      {/* ── Hero Image ── */}
      {post.heroImage && (
        <div className="bh-image-wrap">
          <div className="bh-image">
            <Image
              src={post.heroImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        </div>
      )}

      {/* ── Article ── */}
      <div className="blog-layout">
        <main className="blog-main">
          <article
            className="blog-article"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </main>

        <aside className="blog-sidebar" aria-label="Article sidebar">
          {featuredProperties.length > 0 && (
            <section className="bsb-section">
              <h2 className="bsb-heading">Featured Homes</h2>
              {featuredProperties.map(property => (
                <a key={property.slug} href={`/property/${property.slug}/`} className="bsb-prop-card">
                  <span className="bsb-prop-img-wrap">
                    <Image
                      src={property.img}
                      alt={property.title}
                      fill
                      sizes="320px"
                      style={{ objectFit: 'cover' }}
                    />
                  </span>
                  <span className="bsb-prop-body">
                    {property.location && <span className="bsb-prop-loc">{property.location}</span>}
                    <span className="bsb-prop-title">{property.title}</span>
                    {property.price && <span className="bsb-prop-price">From {property.price}</span>}
                  </span>
                </a>
              ))}
              <a className="bsb-view-all" href="/our-homes/">Browse all homes</a>
            </section>
          )}

          <section className="bsb-section">
            <h2 className="bsb-heading">Quick Links</h2>
            <a className="bsb-dest-link" href="/our-homes/">Browse all properties <span>→</span></a>
            <a className="bsb-dest-link" href="/how-it-works/">How co-ownership works <span>→</span></a>
            <a className="bsb-dest-link" href="/all-our-blog/">More articles <span>→</span></a>
            <a className="bsb-dest-link" href="/contact/">Speak to COP <span>→</span></a>
          </section>
        </aside>
      </div>

      {visibleRelatedPosts.length > 0 && (
        <section className="blog-related">
          <p className="blog-related-eyebrow">Similar Posts</p>
          <h2>More from Co-Ownership Property</h2>
          <div className="blog-related-grid">
            {visibleRelatedPosts.map(related => (
              <a key={related.slug} href={`/blog/${related.slug}/`} className="blog-related-card">
                <span className="blog-related-img">
                  {related.heroImage
                    ? (
                      <Image
                        src={related.heroImage}
                        alt={related.title}
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
                  <span className="blog-related-title">{related.title}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Breadcrumb back */}
      <div className="blog-back-wrap">
        <a href="/all-our-blog/" className="blog-back-link">← Back to Blog</a>
      </div>

      <Newsletter />
      <ExpertForm />

      <Footer />
    </>
  );
}
