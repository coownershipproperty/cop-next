import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';


export default function Kontakt() {
  return (
    <>
      <Head>
        <title>Kontakt | Co-Ownership Property</title>
        <meta name="description" content="Sprechen Sie mit dem COP-Team. Fragen zu Co-Ownership oder Miteigentum an Ferienimmobilien? Wir antworten innerhalb weniger Stunden — ohne Verkaufsdruck, ohne Verpflichtung." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/kontakt/" />
        {hreflangLinks({ englishPath: '/contact' })}
        <meta property="og:title" content="Co-Ownership Property kontaktieren" />
        <meta property="og:description" content="Fragen zu Co-Ownership-Ferienimmobilien? Sprechen Sie mit unserem Team — ohne Verkaufsdruck, ohne Verpflichtung. Wir antworten innerhalb weniger Stunden." />
        <meta property="og:url" content="https://co-ownership-property.com/de/kontakt/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
{/* HERO */}
    <section className="page-hero">
        <p className="eyebrow">Wir sind für Sie da</p>
        <h1>Mit uns <em>in Kontakt treten</em></h1>
        <p className="subtitle">Fragen zu Co-Ownership, einer bestimmten Immobilie oder einfach verstehen wollen, wie das alles funktioniert? Wir geben Ihnen klare Antworten — ohne Verkaufsdruck.</p>
    </section>

    {/* TRUST STRIP */}
    <section className="trust-sec">
        <div className="trust-inner">
            <p className="eyebrow" style={{textAlign: 'center'}}>So arbeiten wir</p>
            <h2 style={{textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: '0'}}>Was Sie erwartet, wenn Sie uns kontaktieren</h2>
            <div className="trust-grid">
                <div className="trust-card">
                    <div className="trust-icon">&#x2709;</div>
                    <h3>Schreiben Sie uns direkt</h3>
                    <p>Lieber per E-Mail? Erreichen Sie uns unter<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />Wir lesen jede Nachricht persönlich.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&#x23F0;</div>
                    <h3>Schnelle Antwort</h3>
                    <p>Wir antworten typischerweise innerhalb weniger Stunden — oft schneller. Bei US-Anfragen bitten wir um Berücksichtigung der Zeitverschiebung. Wir melden uns immer bei Ihnen.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&#x2713;</div>
                    <h3>Kein Druck, keine Verpflichtung</h3>
                    <p>Wir stellen Fragen, weisen Sie auf die richtigen Immobilien hin und überlassen die Entscheidung vollständig Ihnen. Wir sind unabhängig — an keine Plattform und keinen Bauträger gebunden.</p>
                </div>
            </div>
        </div>
    </section>

    {/* EXPERT FORM (shared partial = the main contact form) */}
        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}


    {/* HELPFUL LINKS */}
    <section className="links-sec">
        <div className="links-inner">
            <p className="eyebrow" style={{textAlign: 'center'}}>Noch in der Recherchephase?</p>
            <h2 style={{textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '0'}}>Noch nicht bereit für den Kontakt?</h2>
            <div className="links-grid">
                <a href="/de/so-funktionierts/" className="link-card">
                    <span className="link-cat">So funktioniert's</span>
                    <span className="link-title">Der Kaufprozess Schritt für Schritt</span>
                    <span className="link-desc">Von der ersten Anfrage bis zum unterschriebenen Vertrag — was passiert, in welcher Reihenfolge, und worauf Sie sich vorbereiten müssen.</span>
                    <span className="link-arrow">Anleitung lesen &rarr;</span>
                </a>
                <a href="/de/so-funktionierts/#faq" className="link-card">
                    <span className="link-cat">Der Vergleich</span>
                    <span className="link-title">Co-Ownership vs. Vollkauf einer Immobilie</span>
                    <span className="link-desc">Nutzung, Kosten, Wertentwicklung und Ausstieg — direkt gegenübergestellt, ohne Marketing-Geschwätz.</span>
                    <span className="link-arrow">Vergleich ansehen &rarr;</span>
                </a>
                <a href="/de/blog/" className="link-card">
                    <span className="link-cat">Unser Blog</span>
                    <span className="link-title">Marktanalysen &amp; Käufer-Leitfäden</span>
                    <span className="link-desc">Tiefgehende Artikel zu Destinationen, rechtlichen Aspekten, Renditen und allem, was ein smarter Käufer wissen muss.</span>
                    <span className="link-arrow">Artikel ansehen &rarr;</span>
                </a>
            </div>
        </div>
    </section>

    {/* NEWSLETTER */}
        {/* ===== NEWSLETTER SIGNUP (shared partial) ===== */}


    {/* FOOTER */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}
