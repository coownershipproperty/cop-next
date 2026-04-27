import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
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
      const latestRaw = jsonPosts.filter(p => p.slug !== params.slug).slice(0, 5);
      const latestPosts = latestRaw.map(p => ({
        slug: p.slug, title: p.title, category: p.category,
        dateFormatted: p.dateFormatted, heroImage: p.heroImage,
      }));
      return {
        props: { post: { ...jsonPost, content }, latestPosts },
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

  // Embedded CTAs are hidden via CSS — regex strips two-column grid for mobile
  post.content = post.content.replace(
    /(<div)([^>]*style="[^"]*grid-template-columns\s*:\s*1fr\s+1fr[^"]*")/gi,
    '$1 class="blog-two-col"$2'
  );

  // Latest 5 posts (excluding current), no content needed
  const { data: latestRows } = await supabase
    .from('posts')
    .select('slug, title, category, date_formatted, hero_image')
    .eq('published', true)
    .neq('slug', params.slug)
    .order('date', { ascending: false })
    .limit(5);

  const latestPosts = (latestRows || []).map(p => ({
    slug: p.slug, title: p.title, category: p.category,
    dateFormatted: p.date_formatted, heroImage: p.hero_image,
  }));

  return { props: { post, latestPosts }, revalidate: 3600 };
}

export default function BlogPost({ post, latestPosts }) {
  const canonicalUrl = `https://co-ownership-property.com/blog/${post.slug}/`;

  return (
    <>
      <Head>
        <title>{post.title} | Co-Ownership Property</title>
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
        <article
          className="blog-article"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

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
