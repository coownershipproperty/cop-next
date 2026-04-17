import Head from 'next/head';
import path from 'path';
import fs from 'fs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function getStaticPaths() {
  const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'posts.json'), 'utf-8'));
  return { paths: posts.map(p => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'posts.json'), 'utf-8'));
  const post = posts.find(p => p.slug === params.slug);
  if (!post) return { notFound: true };

  // Latest 5 posts (excluding current)
  const latestPosts = posts.filter(p => p.slug !== params.slug).slice(0, 5).map(p => ({
    slug: p.slug, title: p.title, category: p.category, dateFormatted: p.dateFormatted, heroImage: p.heroImage,
  }));

  // 4 featured properties (random selection for variety)
  const properties = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8'));
  const featured = properties.filter(p => p.img).slice(0, 8);
  const sideProps = [...featured].sort(() => 0.5 - Math.random()).slice(0, 4).map(p => ({
    slug: p.slug, title: p.title, img: p.img, price: p.price, currency: p.currency, country: p.country, region: p.region,
  }));

  return { props: { post, latestPosts, sideProps } };
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };

const DEST_LINKS = [
  ['French Alps', '/french-alps-fractional-ownership-properties/'],
  ['Colorado', '/colorado-fractional-ownership-properties/'],
  ['Costa del Sol', '/costa-del-sol-fractional-ownership-properties/'],
  ['Balearic Islands', '/balearics-fractional-ownership-properties/'],
  ['Italian Lakes', '/italian-lakes-fractional-ownership-properties/'],
  ['South of France', '/south-of-france-fractional-ownership-properties/'],
  ['Florida', '/florida-fractional-ownership-properties/'],
  ['Portugal', '/portugal-fractional-ownership-properties/'],
];

export default function BlogPost({ post, latestPosts, sideProps }) {
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
      </Head>

      <Header />

      {/* ── Hero ── */}
      <div className="blog-hero" style={post.heroImage ? { backgroundImage: `url('${post.heroImage}')` } : {}}>
        <div className="blog-hero-overlay">
          <div className="blog-hero-inner">
            <p className="blog-hero-cat">{post.category}</p>
            <h1 className="blog-hero-title">{post.title}</h1>
            {post.subtitle && <p className="blog-hero-sub">{post.subtitle}</p>}
            <p className="blog-hero-meta">{post.dateFormatted}</p>
          </div>
        </div>
      </div>

      {/* ── Content + Sidebar ── */}
      <div className="blog-layout">
        {/* Article */}
        <article
          className="blog-article"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Sidebar */}
        <aside className="blog-sidebar">

          {/* CTA */}
          <div className="bsb-cta">
            <p className="bsb-cta-title">Find Your Perfect Share</p>
            <p className="bsb-cta-sub">Speak with our co-ownership specialists about properties matching your lifestyle and budget.</p>
            <a href="https://co-ownership-property.com/client-form/" className="bsb-cta-btn">Book Free Consultation</a>
            <p className="bsb-cta-note">No obligation · Response within 24h</p>
          </div>

          {/* Featured Properties */}
          <div className="bsb-section">
            <p className="bsb-heading">Featured Properties</p>
            {sideProps.map(p => (
              <a key={p.slug} href={`/property/${p.slug}`} className="bsb-prop-card">
                <span className="bsb-prop-img" style={{ backgroundImage: `url('${p.img}')` }} />
                <span className="bsb-prop-body">
                  <span className="bsb-prop-title">{p.title}</span>
                  <span className="bsb-prop-price">
                    {p.price ? `From ${SYM[p.currency] || p.currency}${p.price.toLocaleString('en-GB')}` : p.region}
                  </span>
                </span>
              </a>
            ))}
            <a href="/our-homes/" className="bsb-view-all">View All Properties →</a>
          </div>

          {/* Destinations */}
          <div className="bsb-section">
            <p className="bsb-heading">Popular Destinations</p>
            {DEST_LINKS.map(([name, href]) => (
              <a key={name} href={href} className="bsb-dest-link">{name}</a>
            ))}
          </div>

          {/* Latest Posts */}
          <div className="bsb-section">
            <p className="bsb-heading">Latest From Our Blog</p>
            {latestPosts.map(p => (
              <a key={p.slug} href={`/blog/${p.slug}`} className="bsb-blog-link">
                {p.title.length > 70 ? p.title.slice(0, 70) + '…' : p.title}
              </a>
            ))}
          </div>

          {/* Starting from */}
          <div className="bsb-from">
            <p className="bsb-from-label">Starting From</p>
            <p className="bsb-from-price">€65,000</p>
            <p className="bsb-from-sub">per 1/8 share</p>
          </div>

        </aside>
      </div>

      {/* Breadcrumb back */}
      <div className="blog-back-wrap">
        <a href="/all-our-blog/" className="blog-back-link">← Back to Blog</a>
      </div>

      <Footer />
    </>
  );
}
