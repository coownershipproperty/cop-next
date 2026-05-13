import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// /de/kontakt/ — German contact page. Shares the ExpertForm component
// with the English /contact/ — the form itself is locale-aware via
// localeFromPath() and posts the correct 'de' locale to the autoreply
// pipeline so confirmation emails are sent in German.

export default function KontaktDE() {
  return (
    <>
      <Head>
        <title>Kontakt | Co-Ownership Property</title>
        <meta name="description" content="Sprechen Sie mit dem COP-Team. Fragen zu Co-Ownership-Ferienimmobilien oder Miteigentum-Anteilen? Wir antworten innerhalb weniger Stunden — ohne Verkaufsdruck, ohne Verpflichtung." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/de/kontakt/" />
        <HreflangLinks englishPath="/contact" />
        <meta property="og:title" content="Co-Ownership Property kontaktieren" />
        <meta property="og:description" content="Fragen zu Co-Ownership-Ferienimmobilien? Sprechen Sie mit unserem Team — ohne Verkaufsdruck, ohne Verpflichtung." />
        <meta property="og:url" content="https://co-ownership-property.com/de/kontakt/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Kontakt</span>
        <h1>Sprechen Sie <em>mit uns</em></h1>
        <p className="page-hero-sub">Wir antworten typischerweise innerhalb weniger Stunden. Auf Deutsch, Englisch, Spanisch oder Französisch.</p>
      </section>

      <section className="sec">
        <div className="sec-inner" style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 2rem', fontFamily: 'var(--font-nunito, Arial, sans-serif)', color: '#2C4A5E' }}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Egal ob Sie eine konkrete Frage zu einer bestimmten Ferienimmobilie haben, grundsätzlich verstehen wollen, wie Co-Ownership rechtlich und steuerlich funktioniert, oder einfach mit jemandem sprechen möchten, der den europäischen Markt kennt — wir sind für Sie da.</p>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Füllen Sie das Formular unten aus, und ein Mitglied unseres Teams meldet sich bei Ihnen — meist noch am selben Tag. Sie können Ihre Anfrage auf Deutsch stellen; wir antworten in der Sprache, in der Sie schreiben.</p>
        </div>
      </section>

      <ExpertForm />
      <Newsletter />
      <Footer />
    </>
  );
}
