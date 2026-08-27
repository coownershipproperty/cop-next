import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import { localeFromPath, localeColumns, pickLocalized } from '@/lib/i18n';

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const { data: rows } = await supabase
    .from('posts')
    .select(`slug, ${localeColumns(['title'])}, category, date, date_formatted, ${localeColumns(['excerpt'])}, hero_image`)
    .eq('published', true)
    .order('date', { ascending: false });

  // Fallback to JSON if Supabase table empty (pre-migration safety net)
  let source = rows || [];
  if (source.length === 0) {
    try {
      const jsonPosts = require('../lib/posts.json');
      source = jsonPosts.map(p => ({
        slug: p.slug, title: p.title, category: p.category,
        date: p.date, date_formatted: p.dateFormatted,
        excerpt: p.excerpt, hero_image: p.heroImage,
      }));
    } catch (_) {}
  }

  // Normalise field names to match component expectations.
  // Translated fields are kept as-is; the component picks them based on locale.
  const posts = source.map(p => ({
    slug:          p.slug,
    title:         p.title,
    ...pickLocalized(p, ['title']),
    category:      p.category,
    date:          p.date,
    dateFormatted: p.date_formatted || p.dateFormatted,
    excerpt:       p.excerpt,
    ...pickLocalized(p, ['excerpt']),
    heroImage:     p.hero_image || p.heroImage,
  }));

  return { props: { posts }, revalidate: 3600 };
}

// Locale-specific UI strings — the page can be served at /all-our-blog,
// /es/blog or /fr/blog and detects which from the URL path.
const COPY = {
  en: {
    title_tag: 'Our Blog | Co-Ownership Property',
    meta_desc: 'Insights, guides, and market intelligence on luxury fractional ownership, co-ownership properties, and the second-home market across Europe and the USA.',
    og_title: 'Co-Ownership Property Blog — Fractional Ownership Insights',
    og_desc: 'Destination guides, market analysis, and ownership stories for the discerning fractional buyer. Published daily.',
    eyebrow: 'Insights & Guides',
    h1_a: 'Our',
    h1_b: 'Blog',
    sub: 'Market intelligence, buyer guides, and destination insights for smart second-home owners.',
    topics_label: 'Topics',
    article_singular: 'article',
    article_plural: 'articles',
    in_category: (cat) => ` in ${cat}`,
    read_article: 'Read Article →',
    blog_path_prefix: '/blog',
    categories: ['All', 'Properties & Destinations', 'Co-Ownership Basics', 'Market Insights', 'Legal & Finance', 'AI & Technology'],
  },
  es: {
    title_tag: 'Nuestro Blog | Co-Ownership Property',
    meta_desc: 'Análisis, guías y datos de mercado sobre copropiedad de lujo, propiedad fraccionada y segunda residencia en Europa y EE. UU.',
    og_title: 'Blog Co-Ownership Property — Análisis sobre copropiedad',
    og_desc: 'Guías de destino, análisis de mercado y experiencias reales de copropietarios. Publicaciones nuevas cada semana.',
    eyebrow: 'Análisis y guías',
    h1_a: 'Nuestro',
    h1_b: 'Blog',
    sub: 'Inteligencia de mercado, guías para compradores y análisis de destinos para quienes buscan una segunda residencia con cabeza.',
    topics_label: 'Temas',
    article_singular: 'artículo',
    article_plural: 'artículos',
    in_category: (cat) => ` en ${cat}`,
    read_article: 'Leer artículo →',
    blog_path_prefix: '/es/blog',
    categories: ['Todos', 'Propiedades y Destinos', 'Conceptos de Copropiedad', 'Análisis de Mercado', 'Legal y Fiscal', 'IA y Tecnología'],
  },
  fr: {
    title_tag: 'Notre Blog | Co-Ownership Property',
    meta_desc: 'Analyses, guides et données de marché sur la copropriété de luxe, la propriété fractionnée et la résidence secondaire en Europe et aux États-Unis.',
    og_title: 'Blog Co-Ownership Property — Analyses sur la copropriété',
    og_desc: 'Guides de destination, analyses de marché et témoignages de copropriétaires. De nouvelles publications chaque semaine.',
    eyebrow: 'Analyses & guides',
    h1_a: 'Notre',
    h1_b: 'Blog',
    sub: "Veille de marché, guides pour acheteurs et analyses de destinations pour acquérir une résidence secondaire en toute sérénité.",
    topics_label: 'Thèmes',
    article_singular: 'article',
    article_plural: 'articles',
    in_category: (cat) => ` dans ${cat}`,
    read_article: "Lire l'article →",
    blog_path_prefix: '/fr/blog',
    categories: ['Tous', 'Propriétés & Destinations', 'Notions de Copropriété', 'Analyses de Marché', 'Juridique & Fiscal', 'IA & Technologie'],
  },
  de: {
    title_tag: 'Unser Blog | Co-Ownership Property',
    meta_desc: 'Analysen, Ratgeber und Marktdaten zu Luxus-Miteigentum, Ferienimmobilien im Bruchteilseigentum und dem Zweitwohnsitzmarkt in Europa und den USA.',
    og_title: 'Co-Ownership Property Blog — Einblicke ins Miteigentum',
    og_desc: 'Reiseziel-Ratgeber, Marktanalysen und Erfahrungen echter Miteigentümer. Neue Beiträge jede Woche.',
    eyebrow: 'Analysen & Ratgeber',
    h1_a: 'Unser',
    h1_b: 'Blog',
    sub: 'Marktintelligenz, Käufer-Ratgeber und Reiseziel-Analysen für anspruchsvolle Zweitwohnsitz-Käufer.',
    topics_label: 'Themen',
    article_singular: 'Beitrag',
    article_plural: 'Beiträge',
    in_category: (cat) => ` in ${cat}`,
    read_article: 'Artikel lesen →',
    blog_path_prefix: '/de/blog',
    categories: ['Alle', 'Immobilien & Reiseziele', 'Miteigentum-Grundlagen', 'Marktanalysen', 'Recht & Steuern', 'KI & Technologie'],
  },
};

// Map a localized category label back to the canonical English category name
// stored in the database, so filter buttons keep working across locales.
function buildCategoryMap(copyCategories) {
  const englishCategories = COPY.en.categories;
  const map = {};
  copyCategories.forEach((label, i) => { map[label] = englishCategories[i]; });
  return map;
}

export default function AllOurBlog({ posts }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;
  const categoryMap = useMemo(() => buildCategoryMap(t.categories), [t.categories]);
  const ALL_LABEL = t.categories[0];
  const [activeCategory, setActiveCategory] = useState(ALL_LABEL);

  // Re-pick the per-post displayed title/excerpt for the current locale,
  // falling back to the English original when no translation exists.
  const localizedPosts = useMemo(() => posts.map(p => ({
    ...p,
    displayTitle:   p[`title_${locale}`]   || p.title,
    displayExcerpt: p[`excerpt_${locale}`] || p.excerpt,
  })), [posts, locale]);

  const filtered = useMemo(() => {
    if (activeCategory === ALL_LABEL) return localizedPosts;
    const englishCategory = categoryMap[activeCategory] || activeCategory;
    return localizedPosts.filter(p => p.category === englishCategory);
  }, [localizedPosts, activeCategory, ALL_LABEL, categoryMap]);

  const canonicalPath = locale === 'en' ? '/all-our-blog/' : `/${locale}/blog/`;

  return (
    <>
      <Head>
        <title>{t.title_tag}</title>
        {hreflangLinks({ englishPath: '/all-our-blog' })}
        <meta name="description" content={t.meta_desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={`https://co-ownership-property.com${canonicalPath}`} />
        <meta property="og:title" content={t.og_title} />
        <meta property="og:description" content={t.og_desc} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content={`https://co-ownership-property.com${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* Hero */}
      <section className="page-hero">
        <span className="page-hero-eyebrow">{t.eyebrow}</span>
        <h1>{t.h1_a} <em>{t.h1_b}</em></h1>
        <p className="page-hero-sub">{t.sub}</p>
      </section>

      {/* Category Filter */}
      <div className="cat-bar">
        <div className="cat-bar-inner">
          <span className="cat-label">{t.topics_label}</span>
          {t.categories.map(cat => (
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
            <strong>{filtered.length}</strong>{' '}
            {filtered.length === 1 ? t.article_singular : t.article_plural}
            {activeCategory !== ALL_LABEL && t.in_category(activeCategory)}
          </p>
          <div className="blog-grid">
            {filtered.map(post => (
              <a key={post.slug} href={`${t.blog_path_prefix}/${post.slug}/`} className="blog-card">
                <div className="blog-thumb">
                  {post.heroImage
                    ? <Image src={post.heroImage} alt={post.displayTitle} fill quality={90} style={{objectFit:"cover"}} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    : <div className="blog-thumb-placeholder" />
                  }
                </div>
                <div className="blog-body">
                  <span className="blog-cat">{post.category}</span>
                  <h3 className="blog-title">{post.displayTitle}</h3>
                  <span className="blog-meta">{post.dateFormatted}</span>
                  <span className="blog-read">{t.read_article}</span>
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
