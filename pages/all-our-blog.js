import Head from 'next/head';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import path from 'path';
import fs from 'fs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

export async function getStaticProps() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib', 'posts.json'), 'utf-8'));
  // Only pass fields needed for listing — not the full article content
  const posts = raw.map(({ slug, title, category, date, dateFormatted, excerpt, heroImage }) => ({
    slug, title, category, date, dateFormatted, excerpt, heroImage,
  }));
  return { props: { posts }, revalidate: 86400 };
}

const CATEGORIES = [
  'All',
  'Properties & Destinations',
  'Co-Ownership Basics',
  'Market Insights',
  'Legal & Finance',
  'AI & Technology',
];

export default function AllOurBlog({ posts }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter(p => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <>
      <Head>
        <title>Our Blog | Co-Ownership Property</title>
        <meta name="description" content="Insights, guides, and market intelligence on luxury fractional ownership, co-ownership properties, and the second-home market across Europe and the USA." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/all-our-blog/" />
        <meta property="og:title" content="Co-Ownership Property Blog — Fractional Ownership Insights" />
        <meta property="og:description" content="Destination guides, market analysis, and ownership stories for the discerning fractional buyer. Published daily." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/all-our-blog/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* Hero */}
      <section className="page-hero">
        <span className="page-hero-eyebrow">Insights &amp; Guides</span>
        <h1>Our <em>Blog</em></h1>
        <p className="page-hero-sub">Market intelligence, buyer guides, and destination insights for smart second-home owners.</p>
      </section>

      {/* Category Filter */}
      <div className="cat-bar">
        <div className="cat-bar-inner">
          <span className="cat-label">Topics</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <section className="blog-sec">
        <div className="blog-inner">
          <p className="blog-count">
            <strong>{filtered.length}</strong> article{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
          </p>
          <div className="blog-grid">
            {filtered.map(post => (
              <a key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-thumb">
                  {post.heroImage
                    ? <Image src={post.heroImage} alt={post.title} fill style={{objectFit:"cover"}} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    : <div className="blog-thumb-placeholder" />
                  }
                </div>
                <div className="blog-body">
                  <span className="blog-cat">{post.category}</span>
                  <h3 className="blog-title">{post.title}</h3>
                  <span className="blog-meta">{post.dateFormatted}</span>
                  <span className="blog-read">Read Article &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
