// components/rd/ContactView.js
//
// The contact page, in any language. Same split as components/rd/HomeView.js:
// structure here, words in content/contact/{locale}.json.
//
// Before 22 Sep 2026 the English page was redesigned and the nine locale
// contact pages were not — six went through components/LocaleContact.js on the
// old design and es/fr/de had hand-written pages.
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import { routePath, localePrefix, ogLocaleFor } from '@/lib/i18n';
import s from '@/styles/contact-redesign.module.css';

const SITE_URL = 'https://co-ownership-property.com';
const EMAIL = 'info@co-ownership-property.com';

export default function ContactView({ locale = 'en', copy }) {
  const canonical = `${SITE_URL}${routePath(locale, 'contact') || '/contact/'}`;
  const aboutHref = routePath(locale, 'aboutUs') || '/about-us/';

  return <div className={`rd rd-home-light rd-contact ${s.page}`}>
    <Head>
      <title>{copy.meta.title}</title>
      {hreflangLinks({ englishPath: '/contact' })}
      <meta name="description" content={copy.meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={copy.meta.ogTitle || copy.meta.title} />
      <meta property="og:description" content={copy.meta.ogDescription || copy.meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocaleFor(locale)} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <Nav ctaHref={`mailto:${EMAIL}`} ctaLabel={copy.nav.emailUs} />
    <main>
      <section className={`${s.hero} rd-container`} aria-labelledby="contact-title">
        <div className={s.intro} data-rv>
          <p className={s.kicker}>{copy.hero.kicker}</p>
          <h1 id="contact-title">{copy.hero.headingTop}<br /><span>{copy.hero.headingAccent}</span></h1>
          <p className={s.description}>{copy.hero.description}</p>
          <div className={s.people}>
            <div className={s.portraits}>
              <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" width={64} height={64} />
              <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" width={64} height={64} />
            </div>
            <div><p>David &amp; Dylan</p><span>{copy.hero.replyPromise}</span></div>
          </div>
          <div className={s.direct}>
            <p className={s.kicker}>{copy.hero.emailKicker}</p>
            <a href={`mailto:${EMAIL}`}>{EMAIL} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className={s.form} data-rv="2">
          <p className={s.kicker}>{copy.form.kicker}</p>
          <ExpertForm hideIntro />
          <p className={s.note}>{copy.form.note}</p>
        </div>
      </section>
      <section className={s.next} aria-labelledby="next-title">
        <div className="rd-container" data-rv>
          <div className={s.nextHeading}>
            <div><p className={s.kicker}>{copy.next.kicker}</p><h2 id="next-title">{copy.next.heading}</h2></div>
            <Link href={aboutHref}>{copy.next.teamLink} <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={s.steps}>
            {(copy.next.steps || []).map((step, i) => (
              <article key={i}><span>{step.n || String(i + 1).padStart(2, '0')}</span><h3>{step.h}</h3><p>{step.p}</p></article>
            ))}
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
