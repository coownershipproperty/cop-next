import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

export default function UeberUnsDE() {
  return (
    <>
      <Head>
        <title>Über uns | Co-Ownership Property</title>
        <meta name="description" content="Lernen Sie das Team hinter Co-Ownership Property kennen. 2022 von David Olsson gegründet — wir helfen smarten Käufern, über Miteigentum-Anteile in europäische Luxus-Ferienimmobilien zu investieren." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/de/ueber-uns/" />
        <HreflangLinks englishPath="/about-us" />
        <meta property="og:title" content="Über uns | Co-Ownership Property" />
        <meta property="og:description" content="Lernen Sie das Team kennen, das smarten Käufern beim Zugang zu Luxus-Ferienimmobilien über Co-Ownership hilft." />
        <meta property="og:url" content="https://co-ownership-property.com/de/ueber-uns/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">Über uns</span>
        <h1>Unabhängig. <em>Unparteiisch.</em> Kompetent.</h1>
        <p className="page-hero-sub">Wir sind die unabhängige Plattform für luxuriöse Co-Ownership-Ferienimmobilien in Europa und den USA — und arbeiten ausschließlich für Sie als Käufer.</p>
      </section>

      <section className="sec">
        <div className="sec-inner" style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 5rem', fontFamily: 'var(--font-nunito, Arial, sans-serif)', color: '#2C4A5E' }}>
          <p style={{ fontSize: '1.18rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>Co-Ownership Property wurde 2022 von David Olsson gegründet — mit der einfachen Überzeugung, dass der Kauf einer Ferienimmobilie heute viel intelligenter und transparenter sein kann als das traditionelle Vollkaufmodell.</p>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Wir sind keine Immobilienverkäufer und keine Anbieter mit eigenem Bestand. Wir sind eine unabhängige Plattform, die die besten europäischen und US-amerikanischen Co-Ownership-Anbieter aggregiert, vergleicht und an einer Stelle zugänglich macht. Unser Geschäftsmodell zwingt uns dazu, ehrlich zu sein: Wir verdienen nur dann, wenn Sie als Käufer eine Immobilie finden, die wirklich zu Ihnen passt.</p>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '2.5rem 0 1.25rem', color: '#2C4A5E' }}>Was uns unterscheidet</h2>
          <ul style={{ fontSize: '1.05rem', lineHeight: 1.75, paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.75rem' }}><strong>Unabhängigkeit.</strong> Wir vertreten keinen einzelnen Anbieter. Wir zeigen Ihnen Immobilien aus dem gesamten europäischen Markt — und sagen Ihnen ehrlich, welche Optionen für Ihre Situation am besten passen.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>Tiefe Expertise.</strong> Unser Team hat seit 2022 hunderte Co-Ownership-Käufer durch den Prozess begleitet — von der ersten Anfrage über die rechtliche Prüfung bis zum Notartermin. Wir kennen die Strukturen, die Anbieter und die Stolperfallen.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>Volle Transparenz.</strong> Alle Kosten, alle vertraglichen Strukturen, alle steuerlichen Implikationen werden vor dem Kauf offen kommuniziert. Keine versteckten Gebühren, kein Verkaufsdruck.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>Kein Druck.</strong> Wir antworten auf Anfragen typischerweise innerhalb weniger Stunden — aber wir setzen Sie nie unter Zeitdruck. Eine Ferienimmobilie ist eine bedeutende Entscheidung. Sie nehmen sich die Zeit, die Sie brauchen.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '2.5rem 0 1.25rem', color: '#2C4A5E' }}>Sprechen Sie mit uns</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>Ob Sie konkrete Fragen zu einer bestimmten Immobilie haben oder grundsätzlich erst einmal verstehen wollen, wie Co-Ownership funktioniert: Wir freuen uns auf das Gespräch. Antworten Sie auf jede unserer E-Mails oder nutzen Sie das Kontaktformular — ein echter Mensch meldet sich bei Ihnen.</p>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.75 }}><a href="/de/kontakt/" style={{ color: '#C9A84C', fontWeight: 700 }}>Kontakt aufnehmen →</a></p>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
