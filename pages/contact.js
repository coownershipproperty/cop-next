import Head from 'next/head';
import Image from 'next/image';
import HreflangLinks from '@/components/HreflangLinks';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import styles from '@/styles/Contact.module.css';

const assurances = [
  {
    number: '01',
    title: 'Direct answers',
    text: 'Your enquiry goes to a co-ownership specialist, not a call centre.',
  },
  {
    number: '02',
    title: 'A reply within hours',
    text: 'We respond personally across European and US time zones.',
  },
  {
    number: '03',
    title: 'No pressure',
    text: 'Independent guidance, whether you buy now or keep researching.',
  },
];

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | Co-Ownership Property</title>
        <HreflangLinks englishPath="/contact" />
        <meta
          name="description"
          content="Speak to the COP team. Questions about fractional ownership? We respond within a few hours — no sales pressure, no obligation."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/contact/" />
        <meta property="og:title" content="Contact Co-Ownership Property" />
        <meta
          property="og:description"
          content="Questions about fractional ownership? Speak to our team — no sales pressure, no obligation. We respond within a few hours."
        />
        <meta property="og:url" content="https://co-ownership-property.com/contact/" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://co-ownership-property.com/images/contact/family-mediterranean-cove.webp"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Header />

      <div className={styles.page}>
        <section className={styles.editorialSplit} aria-labelledby="contact-heading">
          <div className={styles.imagePanel}>
            <Image
              className={styles.heroImage}
              src="/images/contact/family-mediterranean-cove.webp"
              alt="A family spending the day at a quiet Mediterranean cove"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 54vw"
            />
            <div className={styles.imageWash} />
            <div className={styles.imageCaption}>
              <span>01 / 03</span>
              <p>A conversation is the beginning of every good journey.</p>
            </div>
          </div>

          <div className={styles.contactPanel}>
            <p className={styles.eyebrow}>Begin the conversation</p>
            <h1 id="contact-heading">
              Let&apos;s find the right <em>place</em> for you.
            </h1>
            <p className={styles.intro}>
              Tell us what you are looking for. You will hear from a co-ownership
              specialist within a few hours, with clear answers and no pressure.
            </p>
            <p className={styles.directEmail}>
              Prefer to write directly?{' '}
              <a href="mailto:info@co-ownership-property.com">
                info@co-ownership-property.com
              </a>
            </p>

            <div className={styles.formShell}>
              <ExpertForm hideIntro />
              <p className={styles.privacyNote}>
                Private, personal and obligation-free.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.assurances} aria-label="What to expect">
          {assurances.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.newsletterWrap}>
          <Newsletter />
        </div>
      </div>

      <Footer />
    </>
  );
}
