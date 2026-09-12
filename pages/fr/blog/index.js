// /fr/blog/ — localised blog index. Real page instead of a rewrite onto
// /all-our-blog/ (see [slug].js in this folder for why).

import AllOurBlog, { getStaticProps as allBlogGetStaticProps } from '@/pages/all-our-blog';

export const getStaticProps = allBlogGetStaticProps;

export default function BlogIndexLocale(props) {
  return <AllOurBlog {...props} />;
}
