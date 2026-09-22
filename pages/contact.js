import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import s from '@/styles/contact-redesign.module.css';

export default function Contact() {
  return <div className={`rd rd-home-light rd-contact ${s.page}`}>
    <Head>
      <title>Contact Us | Co-Ownership Property</title>
      {hreflangLinks({ englishPath: '/contact' })}
      <meta name="description" content="Get in touch with David and Dylan at COP. Ask about a home, share your plans or find out more about co-ownership." />
      <link rel="canonical" href="https://co-ownership-property.com/contact/" />
      <meta property="og:title" content="Contact Us | Co-Ownership Property" />
      <meta property="og:description" content="A home in mind? A question about co-ownership? Let's talk." />
      <meta property="og:url" content="https://co-ownership-property.com/contact/" />
      <meta property="og:type" content="website" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <Nav ctaHref="mailto:info@co-ownership-property.com" ctaLabel="Email us" />
    <main>
      <section className={`${s.hero} rd-container`} aria-labelledby="contact-title">
        <div className={s.intro} data-rv>
          <p className={s.kicker}>Contact us</p>
          <h1 id="contact-title">Let’s talk about<br /><span>your next home.</span></h1>
          <p className={s.description}>A home you have spotted. A destination you love. Or a question about co-ownership. Tell us what you have in mind.</p>
          <div className={s.people}>
            <div className={s.portraits}>
              <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" width={64} height={64} />
              <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" width={64} height={64} />
            </div>
            <div><p>David &amp; Dylan</p><span>A personal reply within one working day.</span></div>
          </div>
          <div className={s.direct}>
            <p className={s.kicker}>Prefer email?</p>
            <a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className={s.form} data-rv="2">
          <p className={s.kicker}>Send us a message</p>
          <ExpertForm hideIntro />
          <p className={s.note}>Just a conversation. No obligation.</p>
        </div>
      </section>
      <section className={s.next} aria-labelledby="next-title">
        <div className="rd-container" data-rv>
          <div className={s.nextHeading}><div><p className={s.kicker}>What happens next</p><h2 id="next-title">From your first hello.</h2></div><Link href="/about-us/">Meet the team <span aria-hidden="true">↗</span></Link></div>
          <div className={s.steps}>
            <article><span>01</span><h3>We get to know your plans.</h3><p>Where you would like to be, how you would use your home and what matters to you.</p></article>
            <article><span>02</span><h3>You get the real details.</h3><p>Availability, share prices and running costs for the homes that fit. If a home does not suit, we say so.</p></article>
            <article><span>03</span><h3>You decide what comes next.</h3><p>Ask more questions, arrange an introduction to the team managing the home, or take your time.</p></article>
          </div>
        </div>
      </section>
      <section className={`rd-section ${s.newsletter}`} aria-label="Newsletter">
        <div className="rd-container"><div className="rd-news" data-rv><div className="rd-news-body"><Newsletter editorial /></div></div></div>
      </section>
    </main>
    <Footer />
  </div>;
}
