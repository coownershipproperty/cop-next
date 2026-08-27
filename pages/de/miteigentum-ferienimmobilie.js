import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import hreflangLinks from '@/components/HreflangLinks';

// German pillar page targeting `Miteigentum` (legal anchor) and
// `Ferienimmobilie` (highest commercial-intent search keyword). This is
// the keyword-dense, authoritative explainer that anchors the rest of
// the /de/ blog and category network.
//
// Structure follows the "definitive guide" pattern that ranks for big head
// terms: long-form, sub-headings as questions (FAQ-style), internal links to
// supporting blog posts, jurisdiction-specific legal/tax detail (BGB §§ 741–758,
// Grunderwerbsteuer per Bundesland, KVDG Kurzzeitvermietung, Erbschaftsteuer).
export default function MiteigentumFerienimmobiliePillar() {
  return (
    <>
      <Head>
        <title>Miteigentum an Ferienimmobilien: der vollständige Leitfaden für deutsche Käufer [2026]</title>
        <meta
          name="description"
          content="Vollständiger Leitfaden zu Miteigentum und Co-Ownership an Ferienimmobilien: wie es funktioniert, rechtliches Modell (BGB, GmbH, ausländische SPV), Kosten, Steuern und Unterschiede zum Timesharing. Aktualisiert 2026."
        />
        <link rel="canonical" href="https://co-ownership-property.com/de/miteigentum-ferienimmobilie/" />
        {hreflangLinks({ englishPath: '/de/miteigentum-ferienimmobilie' })}

        <meta property="og:type" content="article" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:title" content="Miteigentum an Ferienimmobilien: der vollständige Leitfaden für deutsche Käufer" />
        <meta property="og:description" content="Wie Miteigentum an Ferienimmobilien funktioniert, rechtliches Modell, Steuern und Unterschiede zum Timesharing. Leitfaden 2026." />

        {/* FAQ schema markup helps win featured snippets for question-based queries */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Was ist Miteigentum an einer Ferienimmobilie?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Miteigentum (Co-Ownership) ist ein rechtliches Modell, bei dem mehrere Käufer gemeinsam eine Ferienimmobilie erwerben. Jeder Miteigentümer ist echter Eigentümer eines Bruchteils der Immobilie — typischerweise 1/8 — und hat Anspruch auf etwa 6 Wochen exklusive Nutzung pro Jahr.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Ist das dasselbe wie Timesharing?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Nein. Beim Timesharing erwerben Sie nur ein Nutzungsrecht für einen bestimmten Zeitraum, ohne Eigentum an der Immobilie. Beim Miteigentum erwerben Sie einen rechtlich verbrieften Eigentumsanteil, der vererbbar, verkaufbar ist und an der Wertentwicklung der Immobilie teilnimmt.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Welche Steuern fallen beim Kauf eines Anteils an?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Bei einem Anteilskauf über eine bestehende LLC (Limited Liability Company), die die Immobilie hält, fällt typischerweise keine zusätzliche Grunderwerbsteuer im Land der Immobilie an, da die Steuer beim ursprünglichen Erwerb durch die LLC bereits gezahlt wurde. In Deutschland kann je nach LLC-Struktur die Vermögensbewertung für Erbschaft- und Schenkungsteuer relevant sein.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Welche Destinationen eignen sich für deutsche Käufer?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Die beliebtesten Destinationen sind Mallorca und Ibiza in Spanien, Gardasee, Comer See und Toskana in Italien, Algarve in Portugal, sowie Tirol und das Salzburger Land in Österreich. Inland sind Sylt, die Ostsee und die Nordsee für deutsche Co-Ownership-Modelle relevant.',
                  },
                },
              ],
            }),
          }}
        />
      </Head>
      <Header />

      <main className="cop-pillar">
        <article className="cop-pillar-inner">

          {/* Header ────────────────────────────────────────────────────────── */}
          <header className="cop-pillar-header">
            <p className="cop-pillar-eyebrow">Vollständiger Leitfaden · Aktualisiert 2026</p>
            <h1>Miteigentum an Ferienimmobilien: der vollständige Leitfaden für deutsche Käufer</h1>
            <p className="cop-pillar-lead">
              <strong>Miteigentum</strong> — auch <strong>Co-Ownership</strong> oder
              <strong> Anteilskauf</strong> genannt — ist heute die effizienteste Art, eine
              luxuriöse Ferienimmobilie zu besitzen, ohne die vollen Kosten allein zu tragen.
              Dieser Leitfaden erklärt, was Miteigentum ist, wie es rechtlich funktioniert, was
              Sie zahlen, wie es sich vom Timesharing unterscheidet und wie Sie die richtige
              Immobilie und den richtigen Anbieter auswählen.
            </p>
          </header>

          {/* TOC ──────────────────────────────────────────────────────────── */}
          <nav className="cop-pillar-toc" aria-label="Inhaltsverzeichnis">
            <h2>Inhaltsverzeichnis</h2>
            <ol>
              <li><a href="#was-ist">Was ist Miteigentum?</a></li>
              <li><a href="#wie-funktioniert">Wie funktioniert es in der Praxis?</a></li>
              <li><a href="#vs-timesharing">Miteigentum vs. Timesharing: der entscheidende Unterschied</a></li>
              <li><a href="#rechtlich">Rechtliches Modell: BGB, GmbH, ausländische SPV</a></li>
              <li><a href="#kosten">Kosten: Kaufpreis und laufende Ausgaben</a></li>
              <li><a href="#steuern">Steuern: Grunderwerbsteuer, AfA, Erbschaftsteuer</a></li>
              <li><a href="#destinationen">Beste Destinationen für deutsche Käufer</a></li>
              <li><a href="#auswahl">Wie wählen Sie die richtige Immobilie und den richtigen Anbieter</a></li>
              <li><a href="#verkaufen">Was, wenn ich meinen Anteil verkaufen möchte?</a></li>
              <li><a href="#faq">Häufige Fragen</a></li>
            </ol>
          </nav>

          {/* 1. What is it ───────────────────────────────────────────────── */}
          <section id="was-ist">
            <h2>1. Was ist Miteigentum?</h2>
            <p>
              <strong>Miteigentum</strong> ist ein Modell des Immobilieneigentums, bei dem
              mehrere Käufer gemeinsam eine Immobilie erwerben und sich Kosten und Nutzung
              proportional teilen. Im verbreitetsten Modell in Europa und Nordamerika wird die
              Immobilie in <strong>8 gleiche Anteile</strong> aufgeteilt, und jeder
              Miteigentümer erwirbt <strong>mindestens einen Anteil (1/8)</strong>, was ihm
              das Recht auf etwa <strong>6 Wochen exklusive Nutzung pro Jahr</strong> gibt.
            </p>
            <p>
              Es ist kein neues Konzept. Miteigentum ist im deutschen Bürgerlichen Gesetzbuch
              ausdrücklich geregelt, in den <em>§§ 741 bis 758 BGB</em>. Was relativ neu ist —
              etwa seit 2020 in Europa weit verbreitet — ist die Professionalisierung des
              Modells: spezialisierte Anbieter, die sich um Kauf, rechtliche Struktur,
              professionelle Verwaltung der Immobilie, Buchungen, Wartung, Reinigung,
              Dienstleistungen und den Kalender zwischen den Miteigentümern kümmern.
            </p>
            <p>
              Der Unterschied zum traditionellen Kauf einer Ferienimmobilie ist offensichtlich:
              Statt 1.200.000 Euro für eine Luxusvilla auf Mallorca zu zahlen, zahlen Sie
              150.000 Euro für einen 1/8-Anteil. Der Unterschied zur Vermietung ist ebenfalls
              klar: <strong>es ist echtes Eigentum</strong>. Ihr Name steht im Anteilsregister,
              der Anteil ist vererbbar, verkaufbar, und Sie profitieren von der Wertsteigerung
              der Immobilie.
            </p>
          </section>

          {/* 2. How it works in practice ─────────────────────────────────── */}
          <section id="wie-funktioniert">
            <h2>2. Wie funktioniert es in der Praxis?</h2>
            <p>Der Prozess folgt typischerweise fünf Schritten:</p>
            <ol className="cop-pillar-steps">
              <li>
                <strong>Auswahl der Immobilie.</strong> Wählen Sie die Villa oder das
                Apartment aus den verfügbaren Optionen. Bei COP finden Sie Immobilien der
                führenden europäischen Co-Ownership-Anbieter, gefiltert nach Destination,
                Schlafzimmern, Preis und Ausstattung.
              </li>
              <li>
                <strong>Reservierung und rechtliche Due Diligence.</strong> Sobald Sie den
                Anteil ausgewählt haben, den Sie kaufen möchten, unterschreiben Sie eine
                Reservierungsvereinbarung mit dem Anbieter. Der Anteil wird für den Zeitraum
                reserviert, der für die rechtliche Due Diligence und die endgültige
                Unterschrift benötigt wird.
              </li>
              <li>
                <strong>Eintritt in die LLC.</strong> Die Immobilie wird in einer eigens
                gegründeten <strong>LLC (Limited Liability Company)</strong> gehalten —
                derselben Struktur, die einheitlich über das gesamte globale Portfolio hinweg
                verwendet wird, in jedem Markt gleich. Der Miteigentümer erwirbt den
                Mitgliedschaftsanteil (membership interest), der seinem Bruchteil entspricht.
                Falls die LLC für eine neue Immobilie noch nicht existiert, wird sie im
                Kaufprozess gegründet. Der Anteilskauf wird vor einem <strong>Notar</strong>
                in einer öffentlichen Urkunde formalisiert.
              </li>
              <li>
                <strong>Eintritt in die Verwaltungsstruktur.</strong> Nach dem Notartermin
                tritt der Miteigentümer in die professionelle Verwaltungsstruktur ein: er
                erhält Zugriff auf die digitale Buchungsplattform, Vertragsdokumentation und
                eine Ansprechperson für jegliche Vorfälle in der Immobilie.
              </li>
              <li>
                <strong>Erste Nutzung und laufende Verwaltung.</strong> Ab dem Moment, in dem
                der Miteigentümer den Anteil erwirbt, kann er die Immobilie gemäß dem
                vereinbarten Kalender nutzen. Wartung, Reinigung, Steuern und Verwaltung sind
                vollständig delegiert.
              </li>
            </ol>
            <p>
              Der gesamte Prozess dauert typischerweise zwischen <strong>4 und 8 Wochen</strong>,
              deutlich weniger als der Kauf einer ganzen Immobilie im Ausland (in der Regel
              3–6 Monate).
            </p>
          </section>

          {/* 3. vs Timesharing ──────────────────────────────────────────── */}
          <section id="vs-timesharing">
            <h2>3. Miteigentum vs. Timesharing: der entscheidende Unterschied</h2>
            <p>
              Es ist die häufigste Verwechslung — und wichtig zu klären. Miteigentum ist
              <strong> echtes Immobilieneigentum</strong>: Sie sind im Grundbuch oder
              Anteilsregister eingetragen, der Anteil ist vererbbar, kann frei verkauft werden
              und nimmt an der Wertentwicklung der Immobilie teil. Timesharing ist nur ein
              <strong> Nutzungsrecht für eine bestimmte Zeit</strong>: Sie besitzen nichts, der
              Vertrag verfällt nach einer definierten Periode (in der Regel 25–50 Jahre) und
              hat keinen Wiederverkaufswert.
            </p>

            <table className="cop-pillar-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Miteigentum (Co-Ownership)</th>
                  <th>Timesharing</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Was Sie kaufen</td>
                  <td>1/8 der Immobilie (echtes Eigentum)</td>
                  <td>Nutzungsrecht für 1 Woche/Jahr</td>
                </tr>
                <tr>
                  <td>Im Grundbuch</td>
                  <td>Ja</td>
                  <td>Nein</td>
                </tr>
                <tr>
                  <td>Vererbbarkeit</td>
                  <td>Ja, ohne Einschränkung</td>
                  <td>Begrenzt, oft Sondergebühren</td>
                </tr>
                <tr>
                  <td>Wiederverkauf</td>
                  <td>Freier Markt, mit Wertsteigerung</td>
                  <td>Sehr schwierig, häufig Verlust</td>
                </tr>
                <tr>
                  <td>Wertentwicklung</td>
                  <td>Folgt dem Immobilienmarkt</td>
                  <td>Verliert in der Regel an Wert</td>
                </tr>
                <tr>
                  <td>Zeitliche Bindung</td>
                  <td>Unbefristet</td>
                  <td>25–50 Jahre vertraglich gebunden</td>
                </tr>
                <tr>
                  <td>Verwaltung</td>
                  <td>Professionell, anteilig bezahlt</td>
                  <td>Vom Betreiber gesteuert, jährliche Gebühren</td>
                </tr>
              </tbody>
            </table>

            <p>
              Kurz gesagt: Miteigentum ist „kaufen", Timesharing ist „mieten mit Vertrag".
              Wenn Sie nach echtem Vermögen suchen, das vererbbar ist und im Wert steigt, ist
              Miteigentum das richtige Modell.
            </p>
          </section>

          {/* 4. Legal model ─────────────────────────────────────────────── */}
          <section id="rechtlich">
            <h2>4. Rechtliches Modell: BGB, GmbH und ausländische SPV</h2>
            <p>
              Die rechtliche Struktur des Miteigentums ist über das gesamte globale Portfolio
              hinweg einheitlich: Jede Immobilie wird in einer eigens gegründeten
              <strong> LLC (Limited Liability Company)</strong> gehalten, unabhängig vom Land der
              Immobilie — Spanien, Frankreich, Italien, Portugal, Österreich oder USA. Die LLC
              hält 100% des Grundbucheintrags der Immobilie, und jeder der typischerweise acht
              Miteigentümer hält einen gleichen Mitgliedschaftsanteil
              (<em>membership interest</em>) an dieser LLC.
            </p>
            <p>
              Die LLC-Struktur bietet mehrere praktische Vorteile, die für deutsche Käufer
              relevant sind:
            </p>
            <ul>
              <li>
                <strong>Konsistenz über Länder hinweg.</strong> Egal ob die Immobilie auf
                Mallorca, am Comer See, an der Algarve, in Tirol oder an der Côte d'Azur liegt
                — die rechtliche Struktur ist identisch. Sie verstehen ein Modell und können
                es überall anwenden.
              </li>
              <li>
                <strong>Klare Haftungsbeschränkung.</strong> Ihre Haftung ist auf Ihre
                Beteiligung an der LLC begrenzt. Persönliche Risiken aus Immobilienbetrieb
                (z. B. Schäden, Personenverletzungen) werden durch die LLC abgeschirmt.
              </li>
              <li>
                <strong>Vereinfachter Wiederverkauf.</strong> Bei einem Verkauf übertragen Sie
                Ihren Mitgliedschaftsanteil an der LLC, nicht direktes Eigentum an der
                Immobilie. Das spart die vollen Notargebühren und Grunderwerbsteuern, die bei
                einem klassischen Immobilienverkauf anfallen würden.
              </li>
              <li>
                <strong>Cleanere Nachfolgeplanung.</strong> Mitgliedschaftsanteile lassen sich
                über mehrere Jurisdiktionen hinweg sauberer vererben als Direkteigentum an
                Immobilien in jeweils unterschiedlichen Ländern. Für deutsche Käufer ist die
                Bewertung im Sinne der deutschen Erbschaft- und Schenkungsteuer mit dem
                Steuerberater zu klären.
              </li>
              <li>
                <strong>Transparente Verwaltung.</strong> Die LLC zahlt selbst die laufenden
                Steuern und Kosten der Immobilie (Grundsteuer, IBI/IMU/IMT, Versicherung etc.).
                Sie als Mitglied haben es nur mit den persönlichen steuerlichen Folgen Ihres
                LLC-Anteils in Ihrem Wohnsitzland zu tun.
              </li>
            </ul>
            <p>
              Die LLC selbst wird durch eine <strong>Miteigentümervereinbarung</strong>
              (Operating Agreement / Co-Ownership Agreement) ergänzt, die detailliert regelt:
              Buchungssystem, Saisonrotation, Vorkaufsrecht der bestehenden Miteigentümer,
              Verkaufsverfahren, Streitbeilegung, Verwaltungsentscheidungen und Reservebudget.
            </p>
          </section>

          {/* 5. Costs ──────────────────────────────────────────────────── */}
          <section id="kosten">
            <h2>5. Kosten: Kaufpreis und laufende Ausgaben</h2>
            <p>Die Gesamtkosten beim Miteigentum gliedern sich in zwei Kategorien:</p>

            <h3>Einmalige Kosten (Kauf)</h3>
            <ul>
              <li>
                <strong>Anteilspreis</strong>. Typischerweise 1/8 des Immobilienpreises plus
                ein anteiliges Aufgeld für Innenausstattung, Möblierung, Anbieter-Marge und
                rechtliche Strukturierung. Ein 1/8-Anteil an einer Mallorca-Villa, die als
                ganze Einheit 1,2 Mio. € kosten würde, kostet typischerweise 150.000–180.000 €.
              </li>
              <li>
                <strong>Anteilsübertragungskosten</strong>. Notargebühren, etwaige
                Übertragungssteuern (in Spanien ITP, in Frankreich droits d'enregistrement, in
                Italien imposta di registro). Für Anteilskäufe an bestehenden Holdings
                deutlich niedriger als bei Direktkauf einer Immobilie.
              </li>
              <li>
                <strong>Beratungskosten</strong>. Anwalt und Steuerberater für Due Diligence —
                typischerweise 1.500–3.500 € abhängig von Komplexität.
              </li>
            </ul>

            <h3>Jährliche laufende Kosten</h3>
            <ul>
              <li>
                <strong>Verwaltungsgebühr</strong> (Hausverwaltung): 2.500–4.500 € pro
                1/8-Anteil und Jahr, abhängig von Immobilie und Anbieter.
              </li>
              <li>
                <strong>Anteilige Betriebskosten</strong>: 1/8 von Versicherungen, kommunalen
                Steuern (IBI in Spanien, taxe foncière in Frankreich, IMU in Italien, IMI in
                Portugal, Grundsteuer in Deutschland), Wartung, Pool, Garten, Nebenkosten.
                Insgesamt typischerweise 1.500–3.500 € pro 1/8-Anteil und Jahr.
              </li>
              <li>
                <strong>Sonderumlagen</strong>: für größere Renovierungen oder Reparaturen,
                typischerweise alle 7–12 Jahre.
              </li>
            </ul>
            <p>
              Insgesamt liegen die jährlichen laufenden Kosten für einen 1/8-Anteil
              typischerweise bei <strong>4.000–8.000 €</strong> — einem Bruchteil dessen, was
              Vollkauf und alleinige Verwaltung kosten würden.
            </p>
          </section>

          {/* 6. Tax ─────────────────────────────────────────────────────── */}
          <section id="steuern">
            <h2>6. Steuern: Grunderwerbsteuer, AfA und Erbschaftsteuer</h2>

            <h3>Beim Kauf</h3>
            <p>
              Wenn Sie einen Mitgliedschaftsanteil an einer bestehenden LLC erwerben, die die
              Immobilie hält, fällt typischerweise <strong>keine zusätzliche Grunderwerbsteuer
              im Land der Immobilie</strong> an, da diese beim ursprünglichen Erwerb durch die
              LLC bereits gezahlt wurde. Sie zahlen nur die Anteilsübertragungssteuer, die
              deutlich niedriger ist.
            </p>
            <p>
              Beim Direktkauf einer deutschen Inlandsimmobilie (z. B. Sylt) im
              Bruchteilseigentum nach BGB fällt jedoch <strong>Grunderwerbsteuer</strong> an,
              die je nach Bundesland zwischen <strong>3,5% (Bayern)</strong> und
              <strong> 6,5%</strong> (Brandenburg, Nordrhein-Westfalen, Schleswig-Holstein,
              Saarland) liegt. Hinzu kommen Notarkosten und Grundbuchgebühren von etwa 1,5–2%.
            </p>

            <h3>Während des Eigentums</h3>
            <p>
              Wenn der Anteil über eine Holdinggesellschaft im Ausland gehalten wird, sind die
              jährlichen Steuern (IBI, IMU, IMI, taxe foncière) bereits in den anteiligen
              Betriebskosten enthalten. In Deutschland steuerlich relevant ist gegebenenfalls:
            </p>
            <ul>
              <li>
                <strong>Beteiligungsmeldungen</strong>. Wesentliche Auslandsbeteiligungen
                müssen ggf. nach § 138 AO gemeldet werden.
              </li>
              <li>
                <strong>Hinzurechnungsbesteuerung nach AStG</strong>. In bestimmten Konstellationen
                relevant — Ihr Steuerberater kann prüfen, ob Ihre Beteiligung darunter fällt.
              </li>
              <li>
                <strong>Mieteinnahmen aus dem Ausland</strong>. Wenn ungenutzte Wochen
                vermietet werden und Sie deutsche Steueransässigkeit haben, sind die Einkünfte
                in der deutschen Steuererklärung anzugeben — meist mit Anrechnung der im
                Ausland gezahlten Steuer nach den jeweiligen Doppelbesteuerungsabkommen.
              </li>
              <li>
                <strong>AfA (Absetzung für Abnutzung)</strong>. Bei Anteilen, die als
                Investition gehalten werden, kann die AfA über den Holding-Eintritt steuerlich
                relevant sein — abhängig von der konkreten Strukturierung.
              </li>
            </ul>

            <h3>Wichtig ab 20. Mai 2026: das KVDG</h3>
            <p>
              Mit dem <strong>Kurzzeitvermietungs-Daten-Gesetz (KVDG)</strong>, das am
              20. Mai 2026 in Kraft tritt, müssen Eigentümer, die ihre Immobilie über
              Plattformen wie Airbnb oder Booking.com vermieten, eine offizielle
              Registrierungsnummer beantragen und auf dem Inserat anzeigen. Das gilt auch für
              Mieteinnahmen aus dem Anteilskauf-Modell, wenn ungenutzte Wochen über
              Plattformen vermietet werden. Reputable Anbieter unterstützen Sie bei der
              Registrierung.
            </p>

            <h3>Erbschaft- und Schenkungsteuer</h3>
            <p>
              Beim Tod oder bei Schenkung wird der Wert des Anteils nach den Regeln des
              <strong> deutschen Erbschaftsteuergesetzes (ErbStG)</strong> bewertet, wenn der
              Erblasser oder Beschenkende deutscher Staatsangehöriger oder in Deutschland
              ansässig ist. Bei Anteilen an ausländischen Holdinggesellschaften gibt es
              Bewertungsabschläge nach §§ 13a und 13b ErbStG für Betriebsvermögen, sofern die
              Voraussetzungen erfüllt sind. Persönliche Freibeträge (500.000 € für Ehepartner,
              400.000 € pro Kind, 200.000 € pro Enkelkind) reduzieren die Steuerlast erheblich.
            </p>
            <p>
              Wichtig: Im Land der Immobilie kann eine zusätzliche lokale Erbschaftsteuer
              anfallen. In Spanien variieren die Sätze stark zwischen den Autonomen
              Gemeinschaften — Madrid und Andalusien haben effektive Sätze nahe Null für direkte
              Erben, Katalonien deutlich höhere. In Italien gilt ein 1-Million-Euro-Freibetrag
              pro Erbe bei direkten Verwandten und nur 4% darüber. In Portugal gibt es
              <strong> keine Erbschaftsteuer für direkte Erben</strong> — eine der
              attraktivsten Regelungen in Europa.
            </p>
          </section>

          {/* 7. Top destinations ────────────────────────────────────────── */}
          <section id="destinationen">
            <h2>7. Beste Destinationen für deutsche Käufer</h2>
            <p>
              Die für deutsche Co-Ownership-Käufer relevantesten Destinationen lassen sich
              nach Region kategorisieren:
            </p>

            <h3>Spanien</h3>
            <p>
              <strong>Mallorca</strong> ist mit großem Abstand die dominante Destination für
              deutsche Käufer. Innerhalb Mallorcas konzentrieren sich die meisten Co-Ownership-
              Angebote auf den Südwesten (Andratx, Camp de Mar, Bendinat, Calvià-Küste), die
              Nordküste (Pollensa, Cala San Vicente, Formentor) sowie das Tramuntana-Gebiet
              (Deià, Sóller, Banyalbufar). Preise pro Quadratmeter im Premium-Segment liegen
              zwischen 7.500 und 9.500 €.
            </p>
            <p>
              <strong>Ibiza</strong> ist die zweitwichtigste Insel — teurer als Mallorca, mit
              Premium-Lagen bei 11.000–22.000 €/m². <strong>Teneriffa</strong> bietet
              ganzjähriges Klima zu attraktiven Preisen. Die <strong>Costa del Sol</strong>
              (Marbella, Estepona, Sotogrande) ist klassisches deutsches Käufergebiet.
            </p>

            <h3>Italien</h3>
            <p>
              Die <strong>norditalienischen Seen</strong> (Gardasee, Comer See, Lago Maggiore)
              sind extrem populär bei deutschen Käufern — kulturelle Nähe, gute
              Erreichbarkeit über die Alpen, mildes Klima. Die <strong>Toskana</strong>
              (Chianti, Val d'Orcia, Maremma) bleibt ein Klassiker für rustikales
              Landleben-Eigentum. <strong>Sardinien</strong> (Costa Smeralda) liegt im
              Premium-Segment mit Preisen über 15.000 €/m² in Porto Cervo prime.
            </p>

            <h3>Österreich</h3>
            <p>
              <strong>Tirol</strong> (Kitzbühel, St. Anton, die Arlberg-Region) ist der
              führende Alpenmarkt für Skichalets, mit ganzjähriger Nutzung dank starker
              Sommer-Infrastruktur. Das <strong>Salzburger Land</strong> (Saalbach,
              Zell am See) bietet etwas zugänglichere Preise. Beachten Sie:
              österreichisches Recht beschränkt Zweitwohnsitz-Käufe in Tirol für
              Nicht-EU-Bürger; deutsche EU-Bürger haben in der Regel Zugang.
            </p>

            <h3>Deutschland</h3>
            <p>
              Im Inland ist <strong>Sylt</strong> die prestigeträchtigste Co-Ownership-Adresse
              — insbesondere Kampen, Wenningstedt und Westerland-Süd. Die
              <strong> Ostsee</strong> (Timmendorfer Strand, Ahrenshoop, Heiligendamm,
              Usedom) bietet ruhigere Eigentumsstrukturen. Die <strong>Nordsee</strong>
              (Föhr, Amrum, Borkum) ist als Co-Ownership-Markt noch in Entwicklung. Bayern
              (Tegernsee, Starnberger See, Chiemgau) hat klassisches Premium-Inlandseigentum.
            </p>

            <h3>Portugal</h3>
            <p>
              Die <strong>Algarve</strong> (Quinta do Lago, Vale do Lobo, Vilamoura) ist die
              wichtigste Destination für deutsche Käufer, mit ganzjährigem mildem Klima und
              dem Vorteil keiner Erbschaftsteuer für direkte Erben.
            </p>

            <h3>Frankreich</h3>
            <p>
              Die <strong>Côte d'Azur</strong> (Cannes, Saint-Tropez, Mougins) und die
              <strong> französischen Alpen</strong> (Megève, Chamonix, Courchevel,
              Val d'Isère) sind klassisch. Wie überall im Portfolio strukturieren wir auch in
              Frankreich über eine eigens gegründete LLC, die die Immobilie hält.
            </p>
          </section>

          {/* 8. How to choose ───────────────────────────────────────────── */}
          <section id="auswahl">
            <h2>8. Wie wählen Sie die richtige Immobilie und den richtigen Anbieter</h2>
            <p>Beim Erwerb eines Co-Ownership-Anteils sind drei Ebenen der Sorgfalt entscheidend:</p>

            <h3>Die Immobilie selbst</h3>
            <p>
              Würde diese Immobilie auch im Vollkauf wünschenswert sein? Lage, Bauqualität,
              architektonische Pedigree, lokale Marktdynamik, Wertentwicklungspotenzial. Die
              Anteilsstruktur kann eine schwache Immobilie nicht retten.
            </p>

            <h3>Der Anbieter</h3>
            <p>
              Verifizierbare Erfolgsbilanz (Anzahl Immobilien, Anzahl Jahre, Anzahl
              abgeschlossener Käufe und Wiederverkäufe), institutionelle Hinterlegung,
              transparente Sekundärmarkt-Daten, klare Trennung von Anbieter-Geldern und
              Holding-Geldern, ausgereifte operative Prozesse. Anbieter, die diese Daten
              nicht zur Verfügung stellen, sollten kritisch hinterfragt werden.
            </p>

            <h3>Die rechtliche Struktur</h3>
            <p>
              Die Miteigentümervereinbarung, die Statuten der Holdinggesellschaft, die
              Verwaltungsverträge — alle vor der Reservierung in Ruhe und mit Beratung Ihres
              eigenen Anwalts geprüft. Achten Sie besonders auf: Ausstiegsmechanismen,
              Vorkaufsrechte, Bewertungsmethodik bei Anteilsverkauf, Stimmrechte bei größeren
              Entscheidungen, Streitbeilegungsverfahren. Eine vage formulierte Vereinbarung
              wird sich später rächen.
            </p>
          </section>

          {/* 9. Selling ─────────────────────────────────────────────────── */}
          <section id="verkaufen">
            <h2>9. Was, wenn ich meinen Anteil verkaufen möchte?</h2>
            <p>
              Einer der zentralen Vorteile gegenüber Timesharing: Sie können Ihren Anteil
              jederzeit verkaufen. Der typische Prozess:
            </p>
            <ol>
              <li>
                <strong>Verkaufsmitteilung an den Anbieter.</strong> Sie informieren den
                Anbieter und der Vorkaufsrecht-Mechanismus aktiviert sich — bestehende
                Miteigentümer haben in der Regel 30–60 Tage, den Anteil zum vereinbarten Preis
                zu erwerben.
              </li>
              <li>
                <strong>Bewertung und Listing.</strong> Falls bestehende Miteigentümer ablehnen,
                vermarktet der Anbieter den Anteil über sein Netzwerk qualifizierter Käufer.
                Der Preis basiert typischerweise auf dem ursprünglichen Kaufpreis plus
                aufgelaufener Wertsteigerung.
              </li>
              <li>
                <strong>Verkauf und Übertragung.</strong> Ein neuer Käufer übernimmt den
                Anteil. Übertragungskosten und etwaige Verkaufsprovisionen fallen an —
                typischerweise 5–10% des Verkaufspreises. Die Mehrwertsteuer auf Veräußerung
                folgt den lokalen Regeln im Land der Immobilie sowie deutschen Steuerregeln
                bei Veräußerungsgewinnen innerhalb der Spekulationsfrist.
              </li>
            </ol>
            <p>
              Mediane Verkaufszeiten in etablierten Anbieter-Märkten liegen zwischen
              <strong> 6 und 14 Wochen</strong>. Anteile in Premium-Lagen (Mallorca-Südwest,
              Ibiza-Sant Josep, Algarve Golden Triangle, Côte d'Azur prime, Tirol Top-Lagen)
              verkaufen sich deutlich schneller als in weniger nachgefragten Märkten.
            </p>
          </section>

          {/* 10. FAQ ────────────────────────────────────────────────────── */}
          <section id="faq">
            <h2>10. Häufige Fragen</h2>

            <h3>Kann ich meinen Anteil über meine GmbH erwerben?</h3>
            <p>
              Ja. Die meisten Anbieter erlauben, dass die Anteile auf eine Gesellschaft oder
              Vermögensstruktur eingetragen sind. Es lohnt sich, dies in der Due Diligence mit
              einem Steuerberater zu prüfen — besonders im Hinblick auf
              Erbschaftsteuer-Bewertung und etwaige Auslandsmeldepflichten.
            </p>

            <h3>Wie viele Wochen pro Jahr habe ich Anspruch auf?</h3>
            <p>
              Ein 1/8-Anteil entspricht ungefähr <strong>6 Wochen pro Jahr</strong>, verteilt
              über die Saisons der Immobilie. Größere Anteile (1/4, 1/2) skalieren proportional.
              Buchungen werden über die Plattform des Anbieters mit fairer Saisonrotation
              verwaltet.
            </p>

            <h3>Kann ich die Immobilie in Wochen vermieten, in denen ich sie nicht nutze?</h3>
            <p>
              Bei den meisten Immobilien ja. Die Verwaltungsgesellschaft kümmert sich um den
              gesamten Vermietungsprozess (Marketing, Buchungen, Reinigung, Steuern), und die
              Mieteinnahmen werden an Sie ausgezahlt. Wichtig: Ab 20. Mai 2026 verlangt das
              KVDG eine Registrierungsnummer für Plattform-Buchungen.
            </p>

            <h3>Kann ich mehr als einen Anteil derselben Immobilie kaufen?</h3>
            <p>
              Die meisten Anbieter erlauben den Kauf von 2/8 oder mehr, mit entsprechender
              Erhöhung der jährlichen Nutzungswochen. Einige begrenzen die Konzentration pro
              Miteigentümer (in der Regel auf maximal 50%), um die Diversität zu wahren.
            </p>

            <h3>Gibt es Finanzierungsmöglichkeiten?</h3>
            <p>
              Einige Anbieter arbeiten mit Partnerbanken, die spezifische Finanzierung für
              den Anteilskauf anbieten. Die Konditionen sind meist ähnlich einer
              traditionellen Hypothek (LTV 50–65%, wettbewerbsfähiger Zinssatz). Deutsche
              Banken mit Erfahrung im internationalen Immobiliengeschäft (HypoVereinsbank,
              Deutsche Bank Wealth Management, einige Sparkassen mit
              Auslandsabteilung) sind erste Anlaufstellen. Konsultieren Sie direkt den
              Anbieter.
            </p>

            <h3>Werde ich steuerlich im Land der Immobilie ansässig, wenn ich einen Anteil kaufe?</h3>
            <p>
              Nein. Der Kauf eines Anteils macht Sie nicht zum Steuerresidenten. Die steuerliche
              Ansässigkeit wird nach Anwesenheitstagen (typischerweise 183-Tage-Regel) und
              anderen Kriterien bestimmt, nicht durch bloßen Immobilienbesitz. Ein 1/8-Anteil
              mit ca. 45 Nutzungstagen pro Jahr liegt komfortabel unter allen relevanten
              Schwellenwerten.
            </p>

            <h3>Was passiert, wenn der Anbieter insolvent wird?</h3>
            <p>
              Die Immobilie wird in einer separaten Holdinggesellschaft gehalten, von der die
              Miteigentümer Mitglieder sind. Wenn der Anbieter insolvent wird, ist die
              zugrundeliegende Eigentumsstruktur unberührt — die Immobilie gehört nach wie vor
              der Holding und die Holding gehört nach wie vor den Miteigentümern. Was Sie
              brauchen würden, ist eine Ersatzverwaltungsgesellschaft, und die meisten
              Vereinbarungen enthalten Bestimmungen, dass die Eigentümer einen neuen Anbieter
              wählen können. Achten Sie auf eine klare Trennung von Anbieter-Geldern und
              Holding-Vermögen.
            </p>
          </section>

          {/* CTA ──────────────────────────────────────────────────────────── */}
          <section className="cop-pillar-cta">
            <h2>Beginnen Sie, Immobilien zu entdecken</h2>
            <p>
              Sehen Sie Co-Ownership-Ferienimmobilien, die jetzt verfügbar sind — auf
              Mallorca, Ibiza, an der Costa del Sol, am Gardasee, in der Toskana, in Tirol und
              weiteren europäischen Destinationen. Sie können nach Preis, Schlafzimmern und
              Ausstattung filtern.
            </p>
            <p>
              <a href="/de/immobilien/" className="cop-cta-primary">Alle Immobilien ansehen</a>
              <a href="/de/kontakt/" className="cop-cta-secondary">Mit einem Berater sprechen</a>
            </p>
          </section>

        </article>
      </main>

      <Footer />
    </>
  );
}
