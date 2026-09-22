/**
 * pages/404.js — the not-found page, in the visitor's language.
 *
 * Until 21 Sep 2026 this was Next's bare default: "404 | This page could not
 * be found", no nav, no footer, no way onward. A 404 on this site is almost
 * always a home that sold and was unlisted, or a stale link in an email — so
 * the page says that and sends the visitor to the homes that are available.
 *
 * Static page, so the locale comes from the path on the client.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { t, localeFromPath, routePath, DEFAULT_LOCALE } from '@/lib/i18n';

export default function NotFound() {
  const router = useRouter();
  const locale = localeFromPath(router?.asPath || '/') || DEFAULT_LOCALE;
  const homesHref = routePath(locale, 'homes') || '/our-homes/';
  const contactHref = routePath(locale, 'contact') || '/contact-us/';
  return (
    <>
      <Head>
        <title>404 — Co-Ownership Property</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className="not-found">
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1>{t('not_found.title', locale)}</h1>
        <p className="not-found-body">{t('not_found.body', locale)}</p>
        <div className="not-found-actions">
          <Link href={homesHref} className="btn btn-primary">{t('not_found.cta', locale)} →</Link>
          <Link href={contactHref} className="btn btn-ghost">{t('nav.cta', locale)}</Link>
        </div>
      </main>
      <Footer />
      <style jsx>{`
        .not-found { max-width: 720px; margin: 0 auto; padding: clamp(6rem, 14vw, 11rem) 1rem clamp(5rem, 10vw, 8rem); text-align: center; }
        .not-found-code { font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.55; margin: 0 0 1rem; }
        .not-found h1 { font-size: clamp(1.9rem, 4.2vw, 3rem); line-height: 1.12; letter-spacing: -0.02em; margin: 0 0 1rem; }
        .not-found-body { font-size: 1.05rem; line-height: 1.6; opacity: 0.75; margin: 0 auto 2rem; max-width: 520px; }
        .not-found-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
        .not-found-actions :global(a) { display: inline-flex; align-items: center; padding: 0.85rem 1.4rem; border-radius: 10px; font-weight: 500; text-decoration: none; }
        .not-found-actions :global(.btn-primary) { background: #141312; color: #fff; }
        .not-found-actions :global(.btn-ghost) { border: 1px solid rgba(0,0,0,0.14); color: inherit; }
      `}</style>
    </>
  );
}
