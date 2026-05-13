// /de/blog/[slug] — German wrapper for individual blog posts.
//
// Mirrors the /es/blog and /fr/blog pattern — re-uses the English blog
// post component and data fetching, just forces locale='de' so the
// chrome (header, footer, FAQ block, CTAs) renders in German. The post
// body itself is served in German if the translation column is populated
// (see scripts/translate-content.js --locale=de) or English otherwise,
// matching the existing fallback pattern.

import BlogPost, { getStaticPaths, getStaticProps } from '@/pages/blog/[slug]';

export { getStaticPaths, getStaticProps };

export default function DeBlogPost(props) {
  return <BlogPost {...props} forceLocale="de" />;
}
