import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from '@/styles/LegalPage.module.css';

export default function LegalPage({ title, description, path, sections }) {
  return (
    <>
      <Head>
        <title>{`${title} | Co-Ownership Property`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://co-ownership-property.com${path}`} />
      </Head>
      <Header />
      <article className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Legal &amp; Transparency</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className={styles.date}>Last updated: <time dateTime="2026-09-22">22 September 2026</time></p>
        </header>
        <nav className={styles.contents} aria-label={`${title} contents`}>
          <h2>Contents</h2>
          <ol>{sections.map(({ id, title: heading }) => <li key={id}><a href={`#${id}`}>{heading}</a></li>)}</ol>
        </nav>
        <div className={styles.body}>
          {sections.map(({ id, title: heading, content }, index) => (
            <section id={id} key={id}>
              <h2>{index + 1}. {heading}</h2>
              {content}
            </section>
          ))}
        </div>
        <nav className={styles.related} aria-label="Related information">
          <a href="/privacy-policy/">Privacy Policy</a>
          <a href="/terms-and-conditions/">Terms &amp; Conditions</a>
          <a href="/contact/">Contact us</a>
        </nav>
      </article>
      <Footer />
    </>
  );
}
