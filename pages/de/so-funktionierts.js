import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// /de/so-funktionierts/ — How co-ownership works in German.
// Slug matches the URL convention used by the broader German fractional-
// ownership market. Sie register throughout. Replaces the placeholder
// nav target so all-German visitors land on a real page.

export default function SoFunktioniertsDE() {
  return (
    <>
      <Head>
        <title>So funktioniert Co-Ownership — Miteigentum an Ferienimmobilien | COP</title>
        <meta name="description" content="Co-Ownership einfach erklärt: Wie Miteigentum an Ferienimmobilien rechtlich funktioniert, was im Kaufpreis enthalten ist, wie die Nutzung aufgeteilt wird und wann sich Anteilskauf wirtschaftlich lohnt." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/de/so-funktionierts/" />
        <HreflangLinks englishPath="/how-it-works" />
        <meta property="og:title" content="So funktioniert Co-Ownership — Miteigentum an Ferienimmobilien" />
        <meta property="og:description" content="Co-Ownership einfach erklärt: Anteilskauf, Nutzungsrechte, Kosten, rechtliche Struktur." />
        <meta property="og:url" content="https://co-ownership-property.com/de/so-funktionierts/" />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="de_DE" />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">So funktioniert's</span>
        <h1>Co-Ownership in <em>vier Schritten</em></h1>
        <p className="page-hero-sub">Echtes Miteigentum an einer Ferienimmobilie — rechtlich verbrieft, professionell verwaltet, ab 1/8 der Kosten.</p>
      </section>

      <section className="sec">
        <div className="sec-inner" style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 5rem', fontFamily: 'var(--font-nunito, Arial, sans-serif)', color: '#2C4A5E' }}>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '0 0 1.25rem', color: '#2C4A5E' }}>1. Sie wählen Ihre Ferienimmobilie</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Stöbern Sie in unserer kuratierten Auswahl von Ferienimmobilien in ganz Europa und den USA. Jede Immobilie wurde nach Lage, Bauqualität und Lebensstil-Attraktivität ausgewählt — von einer Villa auf Mallorca über ein Stadthaus in Lissabon bis zu einem Chalet in Tirol.</p>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '2.5rem 0 1.25rem', color: '#2C4A5E' }}>2. Sie erwerben einen rechtlich verbrieften Anteil</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Sie kaufen typischerweise einen 1/8-Anteil an der Immobilie über eine Holdinggesellschaft (in der Regel eine spanische SL, italienische Srl, portugiesische Lda oder vergleichbare Struktur im Land der Immobilie). Der Anteil ist rechtlich verbrieftes Bruchteilseigentum — Ihr Name steht im Anteilsregister, Sie haben einen echten Eigentumsanteil an einem realen Vermögenswert.</p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Anders als beim Timesharing erwerben Sie keine bloße Nutzungslizenz, sondern einen Eigentumsanteil, den Sie jederzeit am freien Markt wiederverkaufen können — mit voller Beteiligung an einer eventuellen Wertsteigerung.</p>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '2.5rem 0 1.25rem', color: '#2C4A5E' }}>3. Sie nutzen die Immobilie ca. 45 Tage pro Jahr</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Ein 1/8-Anteil entspricht ca. sechs bis sieben Wochen Nutzung pro Jahr. Die Nutzung wird über ein faires Buchungssystem geregelt — meistens per App, mit Reservierungen von 48 Stunden im Voraus bis zu zwei Jahren in die Zukunft. Hochsaison-Wochen (Sommer, Skiferien, Weihnachten) werden über ein Rotationssystem fair zwischen allen Miteigentümern verteilt.</p>

          <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.85rem', margin: '2.5rem 0 1.25rem', color: '#2C4A5E' }}>4. Wir kümmern uns um alles dazwischen</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Eine professionelle Hausverwaltung übernimmt sämtliche operativen Aufgaben: Reinigung zwischen den Aufenthalten, Wartung, Gartenpflege, Poolservice, Versicherungen, Steuerzahlungen, Reparaturen und die Koordination zwischen den Miteigentümern. Die Kosten dafür werden anteilig auf alle Miteigentümer verteilt und im Voraus transparent ausgewiesen.</p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>Sie kommen an, Ihre Sachen sind aus dem Lager geholt, der Kühlschrank ist gefüllt — Sie genießen einfach.</p>

          <div style={{ marginTop: '4rem', padding: '2.5rem 2rem', background: '#2C4A5E', color: '#fff', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', margin: '0 0 1rem', fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Bereit für Ihren ersten Anteil?</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 1.5rem' }}>Stöbern Sie in den verfügbaren Ferienimmobilien oder sprechen Sie direkt mit einem unserer Spezialisten.</p>
            <a href="/de/immobilien/" style={{ display: 'inline-block', margin: '0 0.5rem', padding: '0.85rem 1.75rem', background: '#C9A84C', color: '#2C4A5E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-nunito, Arial, sans-serif)' }}>Immobilien ansehen</a>
            <a href="/de/kontakt/" style={{ display: 'inline-block', margin: '0 0.5rem', padding: '0.85rem 1.75rem', background: 'transparent', color: '#fff', border: '1.5px solid #fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'var(--font-nunito, Arial, sans-serif)' }}>Mit Experte sprechen</a>
          </div>

        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
