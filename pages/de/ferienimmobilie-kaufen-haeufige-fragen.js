import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

const FAQS = [
  {
    q: 'Was genau ist eine Co-Ownership-Ferienimmobilie und wie funktioniert Miteigentum?',
    a: `Eine Co-Ownership-Ferienimmobilie — auch Miteigentum oder Anteilskauf-Immobilie genannt — ist eine luxuriöse Ferienimmobilie, die gemeinsam von einer kleinen Gruppe von Käufern erworben wird, typischerweise bis zu acht, über eine Holdinggesellschaft. Diese Gesellschaft hält 100% des Grundbucheintrags: in Frankreich ist das eine SCI (Société Civile Immobilière), in Spanien eine SL (Sociedad Limitada), in Italien eine Srl, in Portugal eine Lda, in Großbritannien oder den USA eine Limited Company bzw. LLC. Jeder Käufer erwirbt einen rechtlich verbrieften Anteil an dieser Gesellschaft — und damit eine echte Eigentumsbeteiligung an der Immobilie selbst. Anders als beim Timesharing steht Ihr Name (oder der Ihrer Gesellschaft) im Grundbuch, Sie profitieren von jeglicher Wertsteigerung und können Ihren Anteil jederzeit auf dem freien Markt verkaufen. Eine professionelle Verwaltungsgesellschaft kümmert sich um sämtliche operativen Aufgaben — Wartung, Reinigung, Poolservice und Mieteinnahmen, wenn die Immobilie nicht genutzt wird — sodass Sie einfach ankommen, genießen und wieder abreisen.`,
  },
  {
    q: 'Wie unterscheidet sich Co-Ownership von Timesharing? Warum ist es die bessere Option?',
    a: `Der Unterschied ist fundamental. Timesharing gibt Ihnen das Recht, eine Immobilie für einen festen Zeitraum pro Jahr zu nutzen — Sie besitzen Zeit, kein Eigentum. Ihr Name steht in keinem Grundbuch, der Vermögenswert steigt nicht im Wert und Sie sind an ein Mitgliedschafts- oder Punktesystem gebunden, aus dem ein Ausstieg notorisch schwierig ist. Co-Ownership gibt Ihnen einen echten, im Grundbuch eingetragenen Vermögenswert. Sie besitzen einen Bruchteil einer realen Immobilie über eine Gesellschaftsstruktur. Ihr Name (oder der Ihrer Gesellschaft) erscheint im Grundbuch. Sie nehmen an jeglicher Wertsteigerung teil. Sie können Ihren Anteil mit minimaler rechtlicher Komplexität verkaufen, verschenken oder an Familienangehörige übertragen. Sie nutzen die Immobilie flexibel — ab nur 2–3 Nächten — statt einer festen Woche pro Jahr. Und ein professionelles Concierge- und Verwaltungsteam kümmert sich um alles, einschließlich der Möglichkeit, Mieteinnahmen während der Wochen zu erzielen, in denen Sie die Immobilie nicht nutzen.`,
  },
  {
    q: 'Wie viele Anteile kann ich kaufen und wie viele Tage gibt mir jeder Anteil?',
    a: `Die meisten Immobilien sind in acht gleiche Anteile strukturiert, wobei jeder 1/8-Anteil Sie zu rund 42–45 Tagen privater Nutzung pro Jahr berechtigt — etwa sechs Wochen. Sie können typischerweise ein bis vier Anteile derselben Immobilie erwerben (bis zu 50%), sodass Sie 44, 88, 132 oder bis zu 176 Tage pro Jahr ansammeln können. Mehr als 50% zu besitzen wird vermieden, um sicherzustellen, dass kein einzelner Anteilseigner die Gesellschaftsentscheidungen dominieren kann. Wenn Sie insgesamt mehr Zeit besitzen möchten, können Sie Anteile an mehreren Immobilien in verschiedenen Destinationen erwerben. Die Nutzung wird in der Regel über einen rotierenden Zeitplan oder eine digitale Buchungsplattform geregelt, die sicherstellt, dass alle Eigentümer im Lauf der Zeit fairen Zugang zu Hauptsaison-Terminen erhalten.`,
  },
  {
    q: 'Was ist im Kaufpreis eines Miteigentum-Anteils enthalten?',
    a: `Der Preis eines Co-Ownership-Anteils ist vollständig all-inclusive. Er umfasst Ihren im Grundbuch eingetragenen Eigentumsanteil, jegliche Grunderwerbsteuer oder Übertragungsabgaben, die vollen Kosten des Immobilienkaufs, Renovierungs- und Sanierungsarbeiten, professionelle Innenarchitektur, Möbel und Ausstattung sowie die rechtliche Errichtung der Eigentumsgesellschaft. Es gibt keine versteckten Extras oder überraschende Anwaltsgebühren beim Abschluss. Laufende Kosten — jährliche Hausverwaltung, Wartung, Versicherung, kommunale Steuern und Nebenkosten — werden anteilig auf alle Miteigentümer aufgeteilt, sodass Ihre jährlichen Ausgaben im Vergleich zum Alleineigentum einer vergleichbaren Immobilie sehr niedrig bleiben.`,
  },
  {
    q: 'Zahle ich Grunderwerbsteuer oder Notargebühren separat, wenn ich einen Anteil kaufe?',
    a: `Nein — das ist einer der wichtigsten finanziellen Vorteile von Co-Ownership. Grunderwerbsteuer und Notargebühren wurden einmal bezahlt, als die Immobilie ursprünglich erworben und die Eigentumsgesellschaft gegründet wurde. Wenn Sie einen Anteil dieser bestehenden Gesellschaft kaufen, lösen Sie keine neue Immobilienübertragung aus, sodass keine zusätzliche Grunderwerbsteuer anfällt. Alle Kosten sind im Anteilspreis gebündelt. Das macht den Kaufprozess deutlich kostengünstiger als den Kauf einer ganzen Immobilie, bei dem allein die Grunderwerbsteuer in Frankreich oder Spanien 7–10% des Kaufpreises ausmachen kann — und in Deutschland je nach Bundesland 3,5% bis 6,5%.`,
  },
  {
    q: 'Kann ich als ausländischer Käufer oder Nicht-Resident einen Anteil kaufen?',
    a: `Selbstverständlich. Es gibt keine Nationalitätsbeschränkungen für den Erwerb von Immobilien in Frankreich, Spanien, Italien, Portugal oder den USA — und Co-Ownership funktioniert über die gleichen rechtlichen Gesellschaftsstrukturen, die sowohl Residenten als auch Nicht-Residenten zur Verfügung stehen. In Frankreich werden Anteile über eine SCI gehalten, in Spanien über eine SL, in Italien über eine Srl, in den USA über eine LLC. Ein wichtiger steuerlicher Vorteil für Nicht-Residenten beim Kauf in Frankreich ist, dass die Vermögensteuer (IFI) nur greift, wenn der Nettowert Ihrer französischen Immobilien-Vermögenswerte 1,3 Millionen Euro übersteigt. Da Sie einen Bruchteil der Immobilie statt der gesamten besitzen, könnten Sie Miteigentümer einer 5-Millionen-Euro-Villa sein und immer noch unter dieser Schwelle bleiben — und gar keine französische Vermögensteuer zahlen.`,
  },
  {
    q: 'Kann ich einen Anteil über meine GmbH statt persönlich erwerben?',
    a: `Ja. Sie können einen Miteigentum-Anteil entweder in Ihrem persönlichen Namen oder über Ihre eigene GmbH, Stiftung oder Holding-Struktur erwerben. Die Eigentumsgesellschaft, die die Immobilie hält, ist vollständig getrennt von Ihren persönlichen oder unternehmerischen Finanzen. Aus steuerlicher Sicht wird alles innerhalb der Immobilien-Holding effizient im Auftrag aller Miteigentümer verwaltet. Sie sollten mit Ihrem eigenen Steuerberater über etwaige Meldepflichten in Ihrem Heimatland sprechen — die gleiche Sorgfalt, die Sie bei jeder Auslandsimmobilien-Investition anwenden würden. In Deutschland sollte insbesondere die Bewertung für die Erbschaftsteuer und die Behandlung im Sinne des Außensteuergesetzes besprochen werden.`,
  },
  {
    q: 'Wie lange dauert der Kaufprozess für einen Co-Ownership-Anteil?',
    a: `Der Kauf eines Anteils ist typischerweise deutlich schneller als der Kauf einer ganzen Immobilie. Für Barkäufer dauert der Prozess von der Reservierung bis zum Abschluss in der Regel 4–8 Wochen. Dies umfasst den Reservierungsvertrag, die Widerrufsfrist, die Anteilsübertragungsdokumentation (auf Deutsch und/oder Englisch verfügbar) und die Abwicklung. Wenn eine Hypothek beteiligt ist, kann es einige Monate länger dauern. Der Verkauf eines Anteils verläuft auf einem ähnlichen Zeitplan. Die Übertragung eines Anteils an ein Kind oder Familienmitglied ist sogar noch einfacher — sie kann in unter einem Monat erfolgen, oft für weniger als 500 Euro an Anwaltsgebühren, was Co-Ownership zu einer der nachfolge­planungsfreundlichsten Immobilienstrukturen macht.`,
  },
  {
    q: 'Gibt es eine Widerrufsfrist nach Unterzeichnung des Reservierungsvertrags?',
    a: `Ja, Käuferschutzmechanismen sind in den Co-Ownership-Prozess integriert. In Frankreich profitieren Käufer typischerweise von zwei bis drei separaten Widerrufsfristen in verschiedenen Phasen des Reservierungs- und Anteilskauf-Prozesses. Während jeder Frist können Sie ohne finanzielle Strafe vom Kauf zurücktreten. Alle Verträge und Dokumente werden für unsere internationalen Kunden auf Deutsch oder Englisch zusätzlich zur Landessprache bereitgestellt. Diese Transparenz und der rechtliche Schutz sind einer der Gründe, warum Co-Ownership seit Jahrzehnten von Familien und Freunden für gemeinsam besessene Ferienimmobilien in Frankreich, Spanien und Italien genutzt wird.`,
  },
  {
    q: 'Kann ich die gesamte Immobilie nutzen, obwohl ich nur einen Bruchteil besitze?',
    a: `Ja — vollständig. Wenn Sie Ihre Nutzungszeit buchen, haben Sie exklusiven Zugang zur gesamten Immobilie: jedes Schlafzimmer, Garten, Pool, Terrasse und alle Annehmlichkeiten. Die Miteigentümer wechseln sich mit ihren Aufenthalten ab, sodass Sie nie zur gleichen Zeit wie ein anderer Eigentümer in der Immobilie sind. Sie können Freunde und Familie einladen, oder ihnen erlauben, während Ihrer zugeteilten Zeit unabhängig dort zu wohnen. In jeder praktischen Hinsicht ist die Erfahrung nicht von einem Vollkauf zu unterscheiden — der Unterschied ist einfach der Preis, den Sie bezahlt haben, und die Kosten, die Sie teilen. Sie können Dinnerpartys veranstalten, in sozialen Medien posten und die Immobilie ganz und gar als Ihr eigenes Zuhause behandeln.`,
  },
  {
    q: 'Wie wird die Nutzungszeit fair zwischen den Miteigentümern aufgeteilt?',
    a: `Die Nutzung wird über ein klar definiertes und faires Rotationssystem zugewiesen. Jeder 1/8-Anteil berechtigt Sie zu rund 42–45 Tagen pro Jahr, strukturiert so, dass alle Miteigentümer über einen mehrjährigen Zyklus hinweg gleichmäßig auf Hauptsaison- und Nebensaison-Wochen zugreifen können. Viele Immobilien nutzen auch eine digitale Buchungsplattform, mit der Eigentümer bestimmte Termine reservieren, Wochen mit anderen Eigentümern tauschen oder Aufenthalte verlängern können, wo es die Verfügbarkeit zulässt. Die Verwaltungsgesellschaft administriert den Zeitplan und übernimmt die gesamte Koordination, sodass die Eigentümer nie direkt miteinander verhandeln müssen.`,
  },
  {
    q: 'Kann ich meine Wochen vermieten, wenn ich die Immobilie nicht nutze?',
    a: `In vielen Fällen ja. Eine Reihe unserer Co-Ownership-Immobilien erlaubt Eigentümern, ungenutzte Wochen in ein professionell verwaltetes Vermietungsprogramm einzubringen. Die Verwaltungsgesellschaft kümmert sich um Gäste-Marketing, Buchung, Check-in, Reinigung und Wartung. Die Mieteinnahmen werden direkt an Sie zurückgegeben. In stark nachgefragten Destinationen — der französischen Riviera, Ibiza, den französischen Alpen, Colorado — können die Mietrenditen stark genug sein, um Ihre jährlichen Betriebskosten erheblich auszugleichen und in einigen Fällen einen Nettoertrag auf Ihre Investition zu generieren. Wichtig: Ab 20. Mai 2026 gilt in Deutschland das Kurzzeitvermietungs-Daten-Gesetz (KVDG), das eine Registrierungsnummer für Plattform-Buchungen verlangt — wir unterstützen Sie dabei. Bestätigen Sie immer die Vermietungsrichtlinie für eine bestimmte Immobilie mit unserem Team vor dem Kauf.`,
  },
  {
    q: 'Wer verwaltet die Immobilie und was ist im Service enthalten?',
    a: `Jede Co-Ownership-Immobilie auf unserer Plattform wird von einer dedizierten professionellen Hausverwaltung betreut. Ihr Aufgabenbereich umfasst alles: routinemäßige Wartung und Reparaturen, professionelle Reinigung zwischen jedem Aufenthalt, Pool- und Gartenpflege, Verwaltung der Nebenkosten, kommunale Steuerabwicklung und Notrufdienst. Bei Ihrer Anreise ist die Immobilie hotelfertig — frische Bettwäsche, gefüllter Vorrat an Essentials, alles in perfekter Ordnung. Sie müssen keine Handwerker koordinieren, sich um den Kessel sorgen oder Ihren Urlaub mit der Verwaltung der Immobilie verbringen. Diese Last wird vollständig abgenommen.`,
  },
  {
    q: 'Wie lange kann ich einen Co-Ownership-Anteil besitzen? Ist es Volleigentum?',
    a: `Ja — die Immobilien sind echte Volleigentums-Vermögenswerte (in Frankreich, Spanien, Italien und Deutschland). Es gibt kein festes Enddatum für Ihr Eigentum. Sie können Ihren Anteil 10, 30 oder 50 Jahre halten, an Ihre Kinder weitergeben oder jederzeit verkaufen. Viele der verwendeten Gesellschaftsstrukturen haben eine 99-jährige rechtliche Lebensdauer, aber in der Praxis ist Ihr Eigentum unbefristet. Das ist eine grundlegend andere Voraussetzung als ein Timesharing oder eine Urlaubsclub-Mitgliedschaft, die typischerweise auslaufen oder schwere Ausstiegsklauseln enthalten. Ihr Co-Ownership-Anteil ist ein echter Immobilienvermögenswert, der mit dem zugrunde liegenden Immobilienmarkt im Wert steigt.`,
  },
  {
    q: 'Ist die Immobilie vollständig möbliert und besitze ich auch die Möbel?',
    a: `Ja in beiden Fällen. Jede Co-Ownership-Immobilie wird schlüsselfertig geliefert — professionell gestaltete Innenräume, hochwertige Möbel, voll ausgestattete Küche, Bettwäsche, Handtücher und alles, was für die tägliche Nutzung vom ersten Tag an benötigt wird. Sie müssen nichts mitbringen oder einen Cent für die Erstausstattung ausgeben. Als Miteigentümer halten Sie auch einen indirekten Eigentumsanteil an Möbeln und Ausstattung proportional zu Ihrem Anteil. Ein 1/8-Anteil entspricht 1/8 des Möbelwerts. Dies spiegelt sich im Gesamtwert Ihres Anteils wider.`,
  },
  {
    q: 'Kann ich Anteile zusammen mit Familienmitgliedern oder Freunden kaufen?',
    a: `Ja — und das ist eine der beliebtesten Arten, einen Co-Ownership-Kauf zu strukturieren. Gruppen von Freunden, Geschwistern oder erweiterten Familienmitgliedern können jeweils einen oder mehrere Anteile unabhängig voneinander kaufen, alle innerhalb derselben Eigentumsgesellschaft. Unsere professionelle Verwaltungsstruktur ist speziell darauf ausgelegt, die Reibungspunkte zu eliminieren, die oft entstehen, wenn Familien gemeinsam genutztes Eigentum informell verwalten. Ein klarer rechtlicher Rahmen, ein rotierender Nutzungsplan und eine neutrale Verwaltungsgesellschaft sorgen dafür, dass Beziehungen intakt bleiben — unabhängig davon, wie die Immobilie über die Jahre genutzt wird.`,
  },
  {
    q: 'Kann ich meine eigene Gruppe mitbringen, mit der ich eine Immobilie teile?',
    a: `Selbstverständlich. Wenn Sie eine fertige Gruppe haben — Skifreunde, die ein Chalet in den französischen Alpen wollen, Kollegen auf der Suche nach einer Villa an der Côte d'Azur oder Familienmitglieder mit Wunsch nach einer gemeinsamen Basis in Italien — können wir eine Co-Ownership-Immobilie speziell um Ihre Gruppe herum beschaffen und strukturieren. Sie regeln untereinander, wer wie viele Anteile kauft, und wir kümmern uns um alles Rechtliche, die Verwaltung und die Logistik. Die professionelle Verwaltungsebene sorgt dafür, dass selbst eng verbundene Gruppen von einem klaren Rahmen profitieren, der die Interessen aller schützt, wenn sich die Umstände im Lauf der Jahre ändern.`,
  },
  {
    q: 'Wenn ich eine Immobilie finde, die ich liebe, können Sie mir helfen, Mit-Käufer für die restlichen Anteile zu finden?',
    a: `Ja. Wenn Sie eine Immobilie identifizieren, die Sie im Miteigentum besitzen möchten, aber andere Käufer für die restlichen Anteile benötigen, können wir diese aus unserem qualifizierten Käufernetzwerk beschaffen. Wir verlangen, dass Sie sich vorab zu mindestens 50% der Gesamtanteile verpflichten. Entscheidend: Sie müssen nicht warten, bis alle Anteile verkauft sind, bevor Sie die Immobilie nutzen können — Ihre Nutzungsrechte beginnen, sobald Ihr Anteil geschaffen ist. Das bedeutet, Sie können beginnen, das Zuhause zu genießen, während die restlichen Anteile bei geprüften Miteigentümern platziert werden, statt den Prozess auszusitzen.`,
  },
  {
    q: 'Wie schnell kann ich die Immobilie nach Abschluss meines Kaufs nutzen?',
    a: `Bei Immobilien, bei denen die Gesellschaftsstruktur bereits eingerichtet und das Zuhause bezugsfertig ist, können Sie typischerweise innerhalb von Tagen nach Abschluss Ihres Anteilskaufs Buchungen vornehmen — mit ersten Aufenthalten innerhalb von Wochen. Wenn die Immobilie zum Zeitpunkt des Kaufs noch renoviert oder eingerichtet wird, gibt es eine Fertigstellungsphase, bevor sie nutzungsbereit ist. In jedem Fall ist der Zeitplan deutlich schneller als beim Kauf einer traditionellen Immobilie, bei der die notarielle Abwicklung, Renovierung und Möblierung typischerweise sechs Monate bis ein Jahr oder mehr dauern, bevor Sie das Zuhause tatsächlich genießen können.`,
  },
  {
    q: 'Kann ich eine Hypothek aufnehmen, um einen Co-Ownership-Anteil zu finanzieren?',
    a: `Ja, Finanzierung ist für Co-Ownership-Käufe verfügbar. Eine endfällige Hypothek-Struktur ist derzeit die häufigste Option, bei der Sie gegen den Wert Ihres Anteils Kredit aufnehmen. Die Mehrheit unserer Käufer sind Barkäufer oder lösen Eigenkapital aus ihrer Hauptwohnung aus, um den Kauf zu finanzieren — was es ohne die Komplexität einer neuen Hypothek-Vereinbarung zugänglich macht. Allerdings entwickelt sich der Hypothekenmarkt für Co-Ownership rasch weiter, und es werden flexiblere Optionen verfügbar — auch über deutsche Banken mit Erfahrung im internationalen Immobiliengeschäft. Kontaktieren Sie unser Team, um die neuesten Finanzierungsoptionen für Ihre Situation und das Land des Kaufs zu besprechen.`,
  },
];

export default function FerienimmobilieKaufenFAQs() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Head>
        <title>Ferienimmobilie kaufen — Häufige Fragen | Co-Ownership Property</title>
        <meta name="description" content="Alles, was Sie über den Kauf einer Co-Ownership-Ferienimmobilie wissen müssen — rechtliche Struktur, Kosten, Hypotheken und der Kaufprozess von Angebot bis Abschluss." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/ferienimmobilie-kaufen-haeufige-fragen/" />
        <HreflangLinks englishPath="/buying-a-co-ownership-property-faqs" />
        <meta property="og:title" content="Ferienimmobilie kaufen — Häufige Fragen" />
        <meta property="og:description" content="Alles, was Sie über den Kauf einer Co-Ownership-Ferienimmobilie wissen müssen — rechtliche Struktur, Kosten, Hypotheken und der Kaufprozess." />
        <meta property="og:url" content="https://co-ownership-property.com/de/ferienimmobilie-kaufen-haeufige-fragen/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        }) }} />
      </Head>
      <Header />

      {/* Hero */}
      <section className="page-hero">
        <p className="eyebrow">Käufer-Leitfäden</p>
        <h1>Ferienimmobilie kaufen — <em>Häufige Fragen</em></h1>
        <p className="subtitle">Alles, was Sie über den Erwerb eines Miteigentum-Anteils wissen müssen — von rechtlicher Struktur und Kosten bis zum Kaufprozess und darüber hinaus.</p>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-section">
        <p className="faq-eyebrow">Häufige Fragen</p>
        <h2 className="faq-heading">Häufig gestellte <em>Fragen</em></h2>
        <div className="bfaq-list">
          {FAQS.map((item, i) => (
            <div key={i} className="bfaq-row">
              <button
                className="bfaq-btn"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="bfaq-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="bfaq-question">{item.q}</span>
                <span className={`bfaq-arrow${open === i ? ' bfaq-arrow--open' : ''}`} />
              </button>
              {open === i && (
                <div className="bfaq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Helpful links */}
      <section className="sec" style={{ background: 'var(--cream-bg)', paddingTop: 60, paddingBottom: 80 }}>
        <div className="sec-inner" style={{ maxWidth: 760 }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Hilfreiche Ressourcen</p>
          <div className="bfaq-links">
            <a href="/de/immobilien/" className="bfaq-link">Alle Immobilien ansehen →</a>
            <a href="/de/ueber-uns/" className="bfaq-link">Über Co-Ownership Property →</a>
            <a href="/de/so-funktionierts/" className="bfaq-link">So funktioniert Co-Ownership →</a>
            <a href="/de/blog/" className="bfaq-link">Marktanalysen &amp; Leitfäden →</a>
            <a href="/de/aufenthalt-ferienimmobilie-haeufige-fragen/" className="bfaq-link">Aufenthalt in Ihrer Immobilie — FAQs →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
