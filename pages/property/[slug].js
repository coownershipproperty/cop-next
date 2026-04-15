import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

export async function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content', 'properties');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
  return {
    paths: files.map(f => ({ params: { slug: f.replace('.html', '') } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const contentPath = path.join(process.cwd(), 'content', 'properties', `${slug}.html`);

  if (!fs.existsSync(contentPath)) return { notFound: true };

  const rawHtml = fs.readFileSync(contentPath, 'utf-8');

  // Extract title + meta
  const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : slug;
  const metaMatch = rawHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const metaDesc = metaMatch ? metaMatch[1] : '';

  // Extract unique body (property detail content only)
  let bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : '';

  // Strip shared sections
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  body = body.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '');
  body = body.replace(/<section[^>]*class="newsletter-section"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<section[^>]*id="speak-to-expert"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');

  // Fix image URLs — point to production not staging
  body = body.replace(/https:\/\/staging\.co-ownership-property\.com\//g, 'https://co-ownership-property.com/');

  return {
    props: { slug, title, metaDesc, bodyHtml: body.trim() },
  };
}

export default function PropertyPage({ title, metaDesc, bodyHtml }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
