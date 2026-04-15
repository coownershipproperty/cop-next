import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title, description }) {
  const pageTitle = title ? `${title} | Co-Ownership Property` : 'Co-Ownership Property | Luxury Fractional Property Ownership';
  const pageDesc = description || 'The independent guide to luxury fractional property ownership across Europe and the USA. Not timeshare. Real deeded ownership at a fraction of the cost.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
      </Head>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
