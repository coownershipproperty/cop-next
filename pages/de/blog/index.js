// /de/blog/ — German blog index. Re-uses the all-our-blog component
// from the English page and forces locale='de' so the chrome and post
// previews render in German. Post bodies are German if a translation
// column is populated (translate-content.js --locale=de) or English
// otherwise — same fallback pattern as /es/blog/ and /fr/blog/.

import AllOurBlog, { getStaticProps as allBlogGetStaticProps } from '@/pages/all-our-blog';

export const getStaticProps = allBlogGetStaticProps;

export default function BlogIndexDE(props) {
  return <AllOurBlog {...props} forceLocale="de" canonicalPath="/de/blog/" />;
}
