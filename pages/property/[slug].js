import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
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

  // Extract title + meta from <head>
  const titleMatch = rawHtml.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : slug;
  const metaMatch = rawHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  const metaDesc = metaMatch ? metaMatch[1] : '';

  // Extract <body> content
  let bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : '';

  // ── Extract the main property JS script before stripping scripts ──
  // This block contains COP_IMGS, copLbOpen, copOpenModal, copLoadMap, etc.
  let propScript = '';
  const scriptMatch = body.match(/<script>([\s\S]*?const COP_IMGS[\s\S]*?)<\/script>/);
  if (scriptMatch) {
    propScript = scriptMatch[1]
      // Point AJAX calls to the WordPress backend (absolute URL)
      .replace(
        /fetch\('\/wp-admin\/admin-ajax\.php'/g,
        "fetch('https://staging.co-ownership-property.com/wp-admin/admin-ajax.php'"
      )
      // Fix any remaining staging image URLs to production
      .replace(
        /https:\/\/staging\.co-ownership-property\.com\/wp-content\//g,
        'https://co-ownership-property.com/wp-content/'
      );
  }

  // ── Strip sections we don't need (shared nav/footer rendered by React) ──
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  body = body.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '');
  body = body.replace(/<section[^>]*class="newsletter-section"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<section[^>]*id="speak-to-expert"[^>]*>[\s\S]*?<\/section>/g, '');
  body = body.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');

  // ── Strip WP floating widgets / junk that appears after </footer> ──
  body = body.replace(/<input[^>]+id="wpestate_ajax_log_reg"[^>]*\/?>/gi, '');
  body = body.replace(/<a\b[^>]*class="[^"]*backtop[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  body = body.replace(/<a\b[^>]*class="[^"]*contact-box[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  body = body.replace(/<!--Compare Starts here-->[\s\S]*?<!--Compare Ends here-->/gi, '');
  // Truncate at the end of the last </section> — removes contactformwrapper,
  // prop-compare, lightbox_property_wrapper and anything else WP appended
  const lastSectionEnd = body.lastIndexOf('</section>');
  if (lastSectionEnd !== -1) {
    body = body.slice(0, lastSectionEnd + '</section>'.length);
  }

  // Fix image URLs to production
  body = body.replace(
    /https:\/\/staging\.co-ownership-property\.com\/wp-content\//g,
    'https://co-ownership-property.com/wp-content/'
  );
  // Fix similar-property hrefs to point to Next.js routes
  body = body.replace(
    /href="https:\/\/staging\.co-ownership-property\.com\/property\/([^"]+)"/g,
    'href="/property/$1"'
  );

  // ── Clean description HTML artifact (escaped entities leaking as text) ──
  // WordPress sometimes ends descriptions with &lt;h5 class=&quot;other-amen...
  body = body.replace(/&lt;h5\s[^<]*/g, '');

  return {
    props: { slug, title, metaDesc, bodyHtml: body.trim(), propScript },
  };
}

export default function PropertyPage({ title, metaDesc, bodyHtml, propScript }) {
  // Re-run any header scroll logic after hydration
  useEffect(() => {
    const header = document.getElementById('cop-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Property page body — gallery, two-col layout, similar properties */}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {/* Property JS — gallery lightbox, map, unlock modal, enquiry form
          afterInteractive = deferred until after page paints (no render block) */}
      {propScript && (
        <Script
          id="prop-page-js"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: propScript }}
        />
      )}

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
