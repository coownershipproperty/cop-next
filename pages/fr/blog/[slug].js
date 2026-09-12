// /fr/blog/[slug] — locale wrapper for individual blog posts.
//
// Until 12 Sep 2026 /fr/blog/<slug>/ was a next.config rewrite onto
// /blog/[slug], so the statically generated English page was served under
// the localised URL with an English canonical — 226 sitemap entries whose
// pages disowned themselves. A real page, as /de/blog already had, is built
// at its own path: localeFromPath() sees /fr/blog/… and the canonical,
// hreflang and chrome all agree. Same component, same data fetching.

import BlogPost, { getStaticPaths, getStaticProps } from '@/pages/blog/[slug]';

export { getStaticPaths, getStaticProps };

export default function LocaleBlogPost(props) {
  return <BlogPost {...props} />;
}
