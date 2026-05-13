import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

const FAQS = [
  {
    q: 'Wie buche ich einen Aufenthalt in meiner Co-Ownership-Ferienimmobilie?',
    a: `Reservierungen werden direkt über die Hausverwaltungs-Plattform vorgenommen — in den meisten Fällen über eine dedizierte Mobile-App oder einen Online-Kalender Ihrer Verwaltungsgesellschaft. Der Kalender ist je nach Anbieter typischerweise 10 bis 24 Monate im Voraus geöffnet. Sie sehen verfügbare Termine, wählen Ihren Aufenthalt aus, und die Buchung wird sofort innerhalb Ihrer saisonalen Zuteilung bestätigt. Ihre Miteigentümer buchen unabhängig auf demselben System, wobei der Zeitplan so gestaltet ist, dass nie zwei Eigentümer gleichzeitig in der Immobilie sind. Die Miteigentümer werden zudem mit komplementären Aufenthaltspräferenzen ausgewählt, um Konflikte um Hauptsaison-Termine von vornherein zu minimieren.`,
  },
  {
    q: 'Wie weit im Voraus sollte ich meinen Aufenthalt buchen?',
    a: `Sie können bis zu 24 Monate im Voraus buchen, mit einer Mindestvorlaufzeit von zwei Tagen für kurzfristige Aufenthalte. Während der Haupt- und Mittelsaison erfolgen Buchungen über ein Optionssystem: Sie können einen bevorzugten Termin mindestens 120 Tage vor der geplanten Anreise sichern. Die meisten Verwaltungssysteme arbeiten mit zwei Buchungskategorien — Vorausbuchungen für Hauptzeiten (typischerweise weit vor der Saison bestätigt) und Last-Minute-Buchungen (mindestens zwei Tage Vorlauf, bis zu 30 Tagen im Voraus), die direkt im Kalender vorgenommen werden, ohne dass eine Bestätigung des Verwalters erforderlich ist. Das System ist darauf ausgelegt, den Eigentümern maximale Flexibilität zu geben und gleichzeitig Fairness in der Eigentümergruppe zu gewährleisten.`,
  },
  {
    q: 'Wie viele Tage pro Jahr kann ich in meiner Co-Ownership-Immobilie übernachten?',
    a: `Ihre jährliche Zuteilung steht in direktem Verhältnis zur Anzahl der Anteile, die Sie besitzen. Ein 1/8-Anteil berechtigt Sie zu 1/8 des Kalenderjahres — typischerweise 42 bis 45 Nächte, was etwa sechs Wochen oder 1,5 Monate pro Jahr entspricht. Diese Nächte sind über die Saisons der Immobilie verteilt (Haupt-, Mittel- und Nebensaison bei den meisten Ski- und Küstenimmobilien), um sicherzustellen, dass alle Eigentümer auf rotierender Basis einen fairen Anteil am Hochsaison-Zugang erhalten. Wenn Sie mehr als einen Anteil besitzen, skaliert Ihre Gesamtzuteilung anteilig: 2 Anteile = etwa 3 Monate pro Jahr, 3 Anteile = 4,5 Monate, und 4 Anteile (das Maximum von 50%) = 6 Monate. Einige Immobilien sind in 1/4-Anteile strukturiert, was die Zuteilung pro Anteil verdoppelt. Kontaktieren Sie uns für spezifische Details zur Immobilie, an der Sie interessiert sind.`,
  },
  {
    q: 'Kann ich ungenutzte Tage zur Erzielung von Mieteinnahmen verwenden?',
    a: `In vielen Fällen ja. Wenn Sie planen, einen Teil oder die gesamte zugeteilte Zeit in einer bestimmten Saison nicht zu nutzen, erlauben viele unserer Co-Ownership-Immobilien, diese Tage in ein professionell verwaltetes Vermietungsprogramm einzubringen. Die Verwaltungsgesellschaft übernimmt alle gästebezogenen Aufgaben — Inserierung, Buchung, Check-in, Reinigung und Auscheck —, während die Mieteinnahmen direkt an Sie zurückgegeben werden. Mietrenditen in stark nachgefragten Destinationen wie der französischen Riviera, Ibiza, den französischen Alpen und der Toskana können hoch genug sein, um Ihre jährlichen Verwaltungsgebühren zu decken und in einigen Fällen einen Nettoertrag zu erzeugen. Beachten Sie, dass Vermietungsgenehmigungen je nach Immobilie und lokaler Regulierung variieren — einige Gebiete schränken die Kurzzeitvermietung ein. Ab 20. Mai 2026 gilt in Deutschland zudem das Kurzzeitvermietungs-Daten-Gesetz (KVDG), das eine Registrierungsnummer für Plattform-Buchungen erfordert. Bestätigen Sie immer mit unserem Team für eine bestimmte Immobilie vor dem Kauf.`,
  },
  {
    q: 'Wie sind die Anreise- und Abreisezeiten?',
    a: `Die Standard-Anreisezeit ist 15:00 Uhr und die Standard-Abreisezeit 11:00 Uhr. Diese Zeiten sind so festgelegt, dass das Reinigungsteam ausreichend Zeit hat, die Immobilie zwischen aufeinanderfolgenden Eigentümeraufenthalten auf hotelähnlichen Standard zu bringen. Das genaue Zeitfenster kann je nach Immobilie leicht variieren, abhängig vom Zeitplan des Reinigungsteams und der Lücke zwischen Buchungen. Wenn Sie einen frühen Check-in oder späten Check-out benötigen, lohnt es sich immer, Ihren Hausverwalter im Voraus zu kontaktieren — wenn kein anderer Aufenthalt geplant ist, ist eine Anpassung oft möglich.`,
  },
  {
    q: 'Wie lang ist die Mindestaufenthaltsdauer?',
    a: `Der Standard-Mindestaufenthalt beträgt zwei Nächte. Einige Co-Ownership-Anbieter und Immobilien arbeiten jedoch wochenweise, insbesondere Skichalets und Resort-Immobilien, bei denen wöchentliche Wechsel aus logistischer Sicht praktischer sind. Die Mindestaufenthaltsdauer ist darauf ausgelegt, operative Effizienz (Reinigung, Vorbereitung und Verwaltungskosten) mit Flexibilität für die Eigentümer auszubalancieren. Wenn Sie eine spezifische Anforderung haben — beispielsweise eine Wochenendreise oder eine Übernachtung — kontaktieren Sie uns, und wir können Sie beraten, welche Immobilien in unserem Portfolio am besten für kurze Aufenthalte geeignet sind.`,
  },
  {
    q: 'Kann ich Gäste und Familie zu meinem Aufenthalt einladen?',
    a: `Selbstverständlich. Während Ihrer reservierten Aufenthalte gehört die Immobilie ganz Ihnen. Sie können Freunde, Familienmitglieder und Gäste einladen, sich Ihnen anzuschließen, oder ihnen erlauben, die Immobilie während Ihrer zugeteilten Zeit unabhängig zu nutzen. Das Zuhause gehört Ihnen für die Dauer Ihrer Buchung — jeder Raum, jede Annehmlichkeit, der Pool, der Garten und alle Einrichtungen. Es gibt keine Einschränkung der Gästezahl bis zur ausgewiesenen Kapazität der Immobilie und keine zusätzliche Gebühr für Gäste. Sie können eine Dinnerparty veranstalten, die Familie für den vollen Aufenthalt zu Besuch haben oder Ihre Zeit einem Freund leihen. Die Erfahrung ist identisch mit dem Alleineigentum.`,
  },
  {
    q: 'Kann ich meinen Aufenthalt jemand anderem leihen oder schenken?',
    a: `Ja. Als Miteigentümer haben Sie das Recht, Ihren gebuchten Aufenthalt einem Familienmitglied, Freund oder Gast Ihrer Wahl zu übertragen. Es ist nicht erforderlich, dass Sie während eines Aufenthalts, den Sie jemand anderem zugeteilt haben, physisch anwesend sind. Dies ist einer der praktischen Vorteile von Co-Ownership gegenüber Timesharing — Sie besitzen den Vermögenswert und die zugehörigen Zeitrechte, also können Sie sie nach Belieben innerhalb der Hausordnung der Immobilie nutzen. Wenn Sie Ihren Aufenthalt jemandem leihen, der mit der Immobilie oder dem Verwaltungssystem nicht vertraut ist, ist es gute Praxis, ihn im Voraus über Anreise- und Abreiseverfahren sowie die Hausordnung zu informieren.`,
  },
  {
    q: 'Was ist bei meiner Anreise an der Immobilie inbegriffen?',
    a: `Die Immobilie wird vor jeder Anreise auf hotelfertigen Standard vorbereitet. Dazu gehören professionell gewaschene Bettwäsche und Handtücher, eine saubere und voll ausgestattete Küche und alle Geräte in funktionsfähigem Zustand. Die meisten Co-Ownership-Immobilien sind mit den Grundessentials ausgestattet — Reinigungsmittel, Papierwaren und Badezimmer-Verbrauchsgüter. Einige Anbieter inkludieren ein Willkommenspaket mit lokalen Produkten oder Wein. Das Zuhause ist nach hohem Standard innenarchitektonisch gestaltet, vollständig möbliert und mit allem ausgestattet, was für die tägliche Nutzung benötigt wird. Sie müssen außer Ihren persönlichen Sachen und dem Essen für Ihren Aufenthalt nichts mitbringen.`,
  },
  {
    q: 'Wer kümmert sich zwischen den Aufenthalten um die Immobilie?',
    a: `Eine dedizierte professionelle Hausverwaltung ist jederzeit für die Immobilie verantwortlich. Zwischen den Aufenthalten kümmert sie sich um Reinigung und Hauswirtschaft, routinemäßige Wartung und Inspektionen, Garten- und Poolpflege, Verwaltung der Nebenkosten und alle Reparaturen. Wenn während Ihres Aufenthalts etwas Aufmerksamkeit erfordert — ein Geräteproblem, eine Wartungsfrage oder ein Notfall — ist Ihr Hausverwalter direkt erreichbar und reagiert typischerweise zeitnah. Sie kommen nie an, um ein Problem vorzufinden, das nicht angegangen wurde. Das Verwaltungsteam ist Ihr Ansprechpartner für alles Immobilienbezogene und lässt Sie einfach Ihre Zeit dort genießen.`,
  },
  {
    q: 'Was sind die laufenden Eigentumskosten während meiner Aufenthalte?',
    a: `Ihre laufenden Kosten als Miteigentümer werden anteilig zwischen allen Eigentümern aufgeteilt und umfassen typischerweise: Hausverwaltungsgebühren, Wartung und Reparaturen, Versicherung, kommunale Steuern, Nebenkosten und etwaige Gemeinschaftsgebühren. Diese Kosten werden entsprechend Ihrem Eigentumsanteil aufgeteilt — als 1/8-Eigentümer zahlen Sie 1/8 der jährlichen Betriebskosten, unabhängig davon, wie viele Nächte Sie tatsächlich nutzen. Die jährlichen Kosten variieren je nach Immobilie und Standort, sind aber durchgängig deutlich niedriger als die entsprechenden Kosten des Vollkaufs einer vergleichbaren Immobilie. Während Ihrer zugeteilten Zeit gibt es keine zusätzlichen Übernachtungsgebühren für die Nutzung der Immobilie.`,
  },
  {
    q: 'Wie funktioniert die saisonale Terminplanung für Ski- und Küstenimmobilien?',
    a: `Ski- und Küstenimmobilien arbeiten typischerweise über zwei oder drei Saisons — Haupt-, Mittel- und Nebensaison (manchmal auch eine zusätzliche Übergangssaison). Jede Saison hat unterschiedliche Nachfrageniveaus und entsprechend unterschiedliche Buchungsdynamiken. Ihre jährliche Nächte-Zuteilung wird über diese Saisons aufgeteilt, in der Regel über einen rotierenden Zeitplan, der sicherstellt, dass jeder Miteigentümer über einen mehrjährigen Zyklus Zugang zu Hauptsaison-Terminen erhält. Dies verhindert, dass ein einzelner Eigentümer jedes Jahr Weihnachtswoche oder Hochsommer monopolisiert. Die Rotation wird transparent von der Verwaltungsgesellschaft verwaltet, und der Zeitplan wird allen Eigentümern lange vor jeder Saison mitgeteilt.`,
  },
  {
    q: 'Kann ich meine zugeteilten Termine mit anderen Miteigentümern tauschen?',
    a: `Ja, in vielen Fällen. Das Buchungssystem, das von den meisten unserer Verwaltungspartner verwendet wird, erlaubt Eigentümern, die Verfügbarkeit zu sehen und — wo ein anderer Eigentümer zustimmt — zugeteilte Termine zu tauschen. Einige Anbieter erlauben auch, ungenutzte Tage in einer Saison zu „bunkern" und in einer anderen zu nutzen, vorbehaltlich der Verfügbarkeit. Diese Flexibilität ist einer der praktischen Vorteile des Co-Ownership-Modells — wenn sich Ihre Pläne ändern, verlieren Sie Ihre Zeit nicht einfach. Kontaktieren Sie Ihren Hausverwalter, um die spezifischen Tausch- und Flexibilitätsoptionen für Ihre Immobilie zu verstehen.`,
  },
  {
    q: 'Sind Haustiere in Co-Ownership-Immobilien erlaubt?',
    a: `Haustier-Richtlinien variieren je nach Immobilie und sind im Co-Ownership-Vertrag und der Hausordnung festgelegt. Einige Immobilien heißen Haustiere willkommen, während andere sie einschränken, um Möbel, Gärten und das Erlebnis anderer Eigentümer zu schützen. Wenn das Reisen mit einem Haustier für Sie wichtig ist, sollten Sie das vor dem Kauf klären — unser Team kann verfügbare Immobilien nach haustierfreundlichen Richtlinien filtern. Wo Haustiere erlaubt sind, gelten Standard-Goodpractice-Regeln: Haustiere von Möbeln fernhalten, sicherstellen, dass die Immobilie bei Abreise sauber ist, und der Verwaltungsgesellschaft Vorabbenachrichtigung geben.`,
  },
  {
    q: 'Was passiert, wenn während meines Aufenthalts etwas beschädigt wird?',
    a: `Geringfügige Abnutzung und Verschleiß werden vom allgemeinen Wartungsbudget der Immobilie abgedeckt, das gleichmäßig auf alle Miteigentümer verteilt wird. Wenn während Ihres Aufenthalts Schäden über die normale Nutzung hinaus entstehen — beispielsweise versehentliche Beschädigung von Möbeln oder Geräten — wird von Ihnen erwartet, dass Sie diese umgehend dem Hausverwalter melden. Die meisten Co-Ownership-Vereinbarungen enthalten eine Schadenskaution oder einen Versicherungsmechanismus, um solche Eventualitäten abzudecken und sicherzustellen, dass die Immobilie vor der Ankunft des nächsten Eigentümers wieder in vollem Standard ist. Transparenz und prompte Kommunikation mit dem Verwaltungsteam ist alles, was erforderlich ist; der Prozess wird professionell und ohne Drama gehandhabt.`,
  },
  {
    q: 'Kann ich Änderungen oder Verbesserungen an der Immobilie vornehmen?',
    a: `Größere Änderungen an der Immobilie — Neudekoration, strukturelle Modifikationen oder bedeutende Anschaffungen — erfordern Zustimmung aller Miteigentümer und werden über die Verwaltungsgesellschaft koordiniert. Das ist beabsichtigt: Die Immobilie ist ein gemeinsamer Vermögenswert, und alle Änderungen betreffen alle Eigentümer. In der Praxis übernimmt die Verwaltungsgesellschaft alle bedeutenden Entscheidungen im Auftrag der Eigentümergruppe, und die meisten Immobilien sind bereits nach hohem Standard möbliert und gestaltet, der wenig Eingriff erfordert. Wenn Sie Vorschläge oder Verbesserungen im Sinn haben, ist der richtige Ansatz, sie über den Kommunikationskanal der Miteigentümer oder bei der periodischen Eigentümerversammlung anzusprechen, wo alle Stimmen gehört werden.`,
  },
];

export default function AufenthaltFerienimmobilieFAQs() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Head>
        <title>Aufenthalt in Ihrer Ferienimmobilie — Häufige Fragen | Co-Ownership Property</title>
        <meta name="description" content="Alles, was Sie über den Aufenthalt in Ihrer Co-Ownership-Ferienimmobilie wissen müssen — Buchung Ihrer Zeit, Anreise, Gäste, saisonale Terminplanung, Mieteinnahmen und Hausordnung." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/aufenthalt-ferienimmobilie-haeufige-fragen/" />
        <HreflangLinks englishPath="/staying-in-my-co-ownership-property-faqs" />
        <meta property="og:title" content="Aufenthalt in Ihrer Co-Ownership-Ferienimmobilie — Häufige Fragen" />
        <meta property="og:description" content="Alles, was Sie über den Aufenthalt in Ihrer Co-Ownership-Ferienimmobilie wissen müssen — Buchung, Anreise, Gäste, saisonale Terminplanung und mehr." />
        <meta property="og:url" content="https://co-ownership-property.com/de/aufenthalt-ferienimmobilie-haeufige-fragen/" />
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
        <p className="eyebrow">Eigentümer-Leitfäden</p>
        <h1>Aufenthalt in Ihrer Ferienimmobilie — <em>Häufige Fragen</em></h1>
        <p className="subtitle">Alles, was Sie über die Buchung Ihrer Zeit, die Anreise, das Empfangen von Gästen und das Beste aus Ihrer Co-Ownership-Ferienimmobilie wissen müssen.</p>
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
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Nützliche Ressourcen</p>
          <div className="bfaq-links">
            <a href="/de/ferienimmobilie-kaufen-haeufige-fragen/" className="bfaq-link">Ferienimmobilie kaufen — Häufige Fragen →</a>
            <a href="/de/so-funktionierts/" className="bfaq-link">So funktioniert Co-Ownership →</a>
            <a href="/de/immobilien/" className="bfaq-link">Alle Immobilien ansehen →</a>
            <a href="/de/blog/" className="bfaq-link">Marktanalysen &amp; Leitfäden →</a>
            <a href="/terms-and-conditions/" className="bfaq-link">AGB →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
