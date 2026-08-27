import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';


export default function SoFunktionierts() {
  return (
    <>
      <Head>
        <title>Co-Ownership erklärt | COP — Miteigentum an Ferienimmobilien</title>
        <meta name="description" content="Erfahren Sie, wie Co-Ownership funktioniert. Erwerben Sie einen rechtlich verbrieften Anteil an Luxus-Ferienimmobilien in Europa und den USA. Besitzen Sie nur, was Sie nutzen, teilen Sie die Kosten mit gleichgesinnten Miteigentümern." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/so-funktionierts/" />
        {hreflangLinks({ englishPath: '/how-it-works' })}
        <meta property="og:title" content="So funktioniert Co-Ownership | Miteigentum an Ferienimmobilien erklärt" />
        <meta property="og:description" content="Erfahren Sie, wie Miteigentum funktioniert. Erwerben Sie einen rechtlich verbrieften Anteil an Luxus-Ferienimmobilien in Europa und den USA — zu einem Bruchteil der Kosten." />
        <meta property="og:url" content="https://co-ownership-property.com/de/so-funktionierts/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
{/* ===== HERO ===== */}
    <section className="page-hero">
        <p className="eyebrow">Co-Ownership erklärt</p>
        <h1>So <em>funktioniert's</em></h1>
        <p className="subtitle">Besitzen Sie einen Anteil an einer luxuriösen Ferienimmobilie. Nutzen Sie sie wochenlang im Jahr. Teilen Sie alle Kosten. Behalten Sie jede Erinnerung.</p>
    </section>

    {/* ===== AS FEATURED IN (carousel from homepage) ===== */}
    <div className="press-bar" role="region" aria-label="Bekannt aus">
        <div className="press-bar-header">
            <span className="press-bar-label">Bekannt aus</span>
        </div>
        <div className="press-marquee-wrap">
        <div className="press-track-outer">
            <div className="press-track">
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width="200" height="50" /></div>
            </div>
            <div className="press-track" aria-hidden="true">
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-times.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-ft.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-express.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width="200" height="50" /></div>
            </div>
        </div>
        </div>
    </div>

    {/* ===== 1. EMOTIONAL INTRO ===== */}
    <section className="sec intro-sec">
        <div className="sec-inner">
            <div className="intro-grid">
                <div className="intro-img">
                    <Image src="https://cdn.prod.website-files.com/63f61b4f9800c52e560f1914/6910dcda781c75aa91ca0cf7_DJI_0957_58_59_60_61.jpeg" alt="Luxus-Villa mit Pool in Mouans-Sartoux, Côte d'Azur" fill quality={90} style={{objectFit:'cover'}} sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className="intro-text">
                    <p className="eyebrow">Die intelligente Art zu besitzen</p>
                    <h2>Besitzen Sie eine Immobilie im Wert des <em>Achtfachen</em> Ihres Budgets</h2>
                    <p className="highlight">Eine luxuriöse Ferienimmobilie, deren Vollkauf Sie Millionen kosten würde, gehört Ihnen für einen Bruchteil — mit denselben Rechten, denselben Eintragungen und derselben Wertentwicklung.</p>
                    <p>Beim Co-Ownership erwerben Sie einen echten, im Grundbuch eingetragenen Anteil — typischerweise 1/8 — an einer Premium-Immobilie. Er ist über eine immobilienspezifische Holdinggesellschaft auf Ihren Namen registriert. Sie nutzen die Immobilie etwa 45 Tage pro Jahr, und alle Kosten werden anteilig auf die Miteigentümer verteilt.</p>
                    <p>Das ist kein Timesharing. Keine Punkte, keine Clubs, kein Haken. Es ist echtes Immobilieneigentum — eines, das Sie weiterverkaufen, an Ihre Kinder vererben und im Wert steigen sehen können.</p>
                    <div className="intro-stats">
                        <div>
                            <div className="intro-stat-num">1/8</div>
                            <div className="intro-stat-label">Typischer Anteil</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">~45</div>
                            <div className="intro-stat-label">Tage / Jahr</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">360+</div>
                            <div className="intro-stat-label">Immobilien</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">11</div>
                            <div className="intro-stat-label">Länder</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 1b. A TRUSTED TRADITION ===== */}
    <section className="sec heritage-sec">
        <div className="heritage-inner">
            <p className="eyebrow">Eine bewährte Tradition</p>
            <h2>Das ist <em>nichts Neues</em></h2>
            <p>Familien teilen sich Ferienimmobilien seit Jahrhunderten. Großeltern, die eine Villa an drei Kinder weitergeben. Cousins, die ein Bauernhaus in der Toskana erben. Freunde, die sich gemeinsam ein Chalet in den Alpen leisten. Miteigentum ist eine der ältesten und natürlichsten Formen des Immobilienbesitzes in Europa.</p>
            <blockquote>Ihre Großeltern haben das gemacht. Sie hatten nur keine GmbH dafür.</blockquote>
            <p>In Frankreich ist gemeinsames Immobilieneigentum — bekannt als „indivision" — eine der häufigsten Arten, wie Familien Eigentum halten. In Italien, Spanien und Österreich ist das geteilte Eigentum an geerbten Immobilien seit Generationen die Norm. Was sich geändert hat, ist nicht das Konzept — sondern die Infrastruktur.</p>
            <p>Heute wird jede Immobilie in einer eigenen Gesellschaft gehalten, mit einem formellen Co-Ownership-Vertrag, professioneller Verwaltung und fairer Terminplanung. Sie müssen sich nie direkt mit anderen Miteigentümern abstimmen. Alles wird für Sie erledigt. Keine unangenehmen Gespräche, keine Streitigkeiten, keine Reibungspunkte.</p>
        </div>
    </section>

    {/* ===== 3. WHAT YOU GET ===== */}
    <section className="sec benefits-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Was Sie bekommen</p>
            <h2>Mehr als nur eine <em>Ferienimmobilie</em></h2>
            <p className="lead" style={{margin: '0 auto'}}>Jede Immobilie kommt mit professioneller Verwaltung, rechtlichem Schutz und eingebauter Flexibilität.</p>

            <div className="benefits-grid">
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f3e0;</div>
                    <h3>Echtes Immobilieneigentum</h3>
                    <p>Ein im Grundbuch eingetragener Anteil, registriert auf Ihren Namen über eine immobilienspezifische Holdinggesellschaft. Kein Vertrag — ein echter Vermögenswert, den Sie besitzen.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f4c8;</div>
                    <h3>Wertsteigerung</h3>
                    <p>Ihr Anteil steigt im Wert wie jede Immobilieninvestition. Premium-Standorte in Europa und den USA wachsen tendenziell beständig im Lauf der Zeit.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f4b0;</div>
                    <h3>Mieteinnahmen</h3>
                    <p>Sie nutzen Ihre zugeteilten Wochen nicht? Bei vielen unserer Immobilien können Sie Ihre ungenutzten Zeiten vermieten und während Ihrer Abwesenheit Einnahmen erzielen.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f504;</div>
                    <h3>Hausaustausch</h3>
                    <p>Die meisten Immobilien in unserem Portfolio bieten ein Tauschsystem an. Lust auf eine andere Destination dieses Jahr? Tauschen Sie Ihren Aufenthalt mit einem anderen Miteigentümer.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f5d3;</div>
                    <h3>Faire Terminplanung</h3>
                    <p>Ein rotierender Kalender stellt sicher, dass jeder Miteigentümer Hauptsaison- und Nebensaison-Termine bekommt. Sommer, Weihnachten, Ostern — alle wechseln sich fair ab.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f6e0;</div>
                    <h3>Vollständig verwaltet</h3>
                    <p>Eine professionelle Hausverwaltung kümmert sich um Wartung, Reparaturen, Reinigung und kommunale Steuern. Sie kommen an, genießen und reisen ab — alles andere wird erledigt.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 4. COMPARISON ===== */}
    <section className="sec compare-sec">
        <div className="sec-inner">
            <p className="eyebrow">Den Unterschied kennen</p>
            <h2>Co-Ownership vs. die <em>Alternativen</em></h2>
            <p className="lead">Nicht alle Ferienimmobilien-Optionen sind gleich. So vergleicht sich Co-Ownership.</p>

            <div className="compare-table-scroll">
            <table className="compare-table">
                <thead>
                    <tr>
                        <th></th>
                        <th className="compare-highlight">Co-Ownership</th>
                        <th>Alleineigentum</th>
                        <th>Timesharing</th>
                        <th>Ferienvermietung</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Echte Grundbucheintragung</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Ja — Anteil über Holding</td>
                        <td><span className="check">&#10003;</span> Ja</td>
                        <td><span className="cross">&#10007;</span> Nein — nur Nutzungsvertrag</td>
                        <td><span className="cross">&#10007;</span> Nein</td>
                    </tr>
                    <tr>
                        <td>Wertsteigerung</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Voller Vorteil</td>
                        <td><span className="check">&#10003;</span> Voller Vorteil</td>
                        <td><span className="cross">&#10007;</span> Verliert meist an Wert</td>
                        <td><span className="cross">&#10007;</span> Keine</td>
                    </tr>
                    <tr>
                        <td>Anschaffungskosten</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> 1/8 des Vollpreises</td>
                        <td><span className="cross">&#10007;</span> 100% des Vollpreises</td>
                        <td><span className="partial">~</span> Stark variabel</td>
                        <td><span className="check">&#10003;</span> Keine</td>
                    </tr>
                    <tr>
                        <td>Laufende Kosten</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Geteilt 1/8</td>
                        <td><span className="cross">&#10007;</span> 100% bei Ihnen</td>
                        <td><span className="cross">&#10007;</span> Jährliche Gebühren unabhängig von Nutzung</td>
                        <td><span className="partial">~</span> Pro Aufenthalt</td>
                    </tr>
                    <tr>
                        <td>Frei verkaufbar</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Freier Markt</td>
                        <td><span className="check">&#10003;</span> Freier Markt</td>
                        <td><span className="cross">&#10007;</span> Sehr schwierig</td>
                        <td>Nicht zutreffend</td>
                    </tr>
                    <tr>
                        <td>An Kinder vererbbar</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Ja</td>
                        <td><span className="check">&#10003;</span> Ja</td>
                        <td><span className="cross">&#10007;</span> Meist nicht übertragbar</td>
                        <td>Nicht zutreffend</td>
                    </tr>
                    <tr>
                        <td>Mieteinnahmen</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Bei den meisten Immobilien</td>
                        <td><span className="check">&#10003;</span> Ja</td>
                        <td><span className="cross">&#10007;</span> Selten</td>
                        <td>Nicht zutreffend</td>
                    </tr>
                    <tr>
                        <td>Professionelle Verwaltung</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Inklusive</td>
                        <td><span className="cross">&#10007;</span> Sie organisieren sie selbst</td>
                        <td><span className="partial">~</span> Resort-verwaltet</td>
                        <td>Nicht zutreffend</td>
                    </tr>
                    <tr>
                        <td>Garantierte Verfügbarkeit</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> ~45 Tage / Jahr</td>
                        <td><span className="check">&#10003;</span> 365 Tage</td>
                        <td><span className="partial">~</span> Oft eingeschränkt</td>
                        <td><span className="cross">&#10007;</span> Buchungsabhängig</td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    </section>

    {/* ===== MID-PAGE CTA ===== */}
    <section className="mid-cta">
        <p>Bereit, Ihre Ferienimmobilie zu finden?</p>
        <div className="mid-cta-buttons">
            <a href="#speak-to-expert" className="btn btn-gold">Mit einem Experten sprechen</a>
            <a href="#newsletter" className="btn btn-blue">Newsletter abonnieren</a>
        </div>
    </section>

    {/* ===== 2. HOW THE LLC MODEL WORKS ===== */}
    <section className="sec model-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Der Prozess</p>
            <h2>Vier Schritte zu Ihrer <em>Ferienimmobilie</em></h2>
            <p className="lead" style={{margin: '0 auto'}}>Jede Immobilie wird in einer eigenen Holdinggesellschaft gehalten. Sie kaufen Anteile an dieser Gesellschaft — und erhalten so echtes, eingetragenes Eigentum mit vollem rechtlichem Schutz.</p>

            <div className="model-flow">
                <div className="model-step">
                    <div className="model-num">1</div>
                    <h3>Stöbern &amp; Auswählen</h3>
                    <p>Entdecken Sie über 360 kuratierte Luxus-Immobilien. Filtern Sie nach Destination, Lebensstil, Budget und Anteilsgröße.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">2</div>
                    <h3>Wir kümmern uns um das Rechtliche</h3>
                    <p>Unabhängige Anwälte übernehmen die gesamte notarielle Abwicklung. Ein Co-Ownership-Vertrag wird aufgesetzt, der Termine, Kosten, Wiederverkaufsrechte und Ihren Schutz abdeckt.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">3</div>
                    <h3>Anteil erwerben</h3>
                    <p>Unterzeichnen Sie die Urkunde, lassen Sie Ihren Anteil in der Gesellschaft eintragen und erhalten Sie Ihre Eigentumsbescheinigung. Die meisten Immobilien sind bezugsfertig.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">4</div>
                    <h3>Genießen &amp; Verdienen</h3>
                    <p>Beginnen Sie sofort, Ihre Immobilie zu nutzen. Ein faires Rotationssystem stellt sicher, dass jeder Hauptsaison-Termine bekommt. Vermieten Sie ungenutzte Wochen für Einnahmen.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 6. FAQ ===== */}
    <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Häufige Fragen</p>
            <h2>Häufig gestellte <em>Fragen</em></h2>
        </div>
        <ul className="faq-list">
            <li className="faq-item"><details><summary><h3>Was ist Miteigentum an einer Ferienimmobilie?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Co-Ownership ist der Erwerb eines im Grundbuch eingetragenen Anteils an einer Immobilie — typischerweise 1/8 oder 1/4. Sie besitzen Ihren Anteil als Eigentum, eingetragen über eine immobilienspezifische Holdinggesellschaft. Sie können die Immobilie für Ihre zugeteilte Zeit pro Jahr nutzen (in der Regel 45–90 Tage), Ihren Anteil am freien Markt weiterverkaufen oder an Ihre Kinder weitergeben. Es ist echtes Immobilieneigentum — keine Mietvereinbarung, kein Mitgliedschaftsclub und kein Timesharing.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Wie unterscheidet es sich vom Timesharing?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Grundlegend anders. Co-Ownership gibt Ihnen eine eingetragene Eigentumsurkunde — echtes Eigentum, das im Wert steigt. Timesharing ist ein Nutzungsvertrag, der typischerweise an Wert verliert. Sie können einen Co-Ownership-Anteil am freien Markt verkaufen; Timesharing-Wiederverkäufe sind notorisch schwierig. Co-Ownership-Kosten sind anteilig und transparent; Timesharing-Gebühren laufen weiter, unabhängig davon, ob Sie die Immobilie nutzen.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Was ist die LLC-Struktur?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Jede Immobilie wird in einer eigens gegründeten LLC (Limited Liability Company) gehalten — derselben Struktur, die einheitlich über das gesamte globale Portfolio hinweg verwendet wird, in jedem Markt gleich. Wenn Sie einen Anteil kaufen, erwerben Sie einen Mitgliedschaftsanteil (membership interest) an dieser LLC — und erhalten so Eigentum an der Immobilie, anteilig zu Ihrer Anteilsgröße. Diese Struktur bietet Haftungsschutz, vereinfacht den Wiederverkauf und sorgt für eine saubere rechtliche Trennung zwischen den Miteigentümern.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Wie viel Zeit kann ich die Immobilie pro Jahr nutzen?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Die Nutzung hängt von Ihrer Anteilsgröße ab. Ein 1/8-Anteil gibt Ihnen ungefähr 45 Tage pro Jahr (6 Wochen). Ein 1/4-Anteil entspricht etwa 90 Tagen (rund 3 Monate). Ein faires Rotationssystem sorgt für eine gleichmäßige Verteilung von Hauptsaison- und Nebensaison-Terminen über alle Miteigentümer hinweg — jeder bekommt mit der Zeit Sommerwochen, Weihnachten und Ostern.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Kann ich meinen Anteil verkaufen?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Ja. Sie besitzen einen im Grundbuch eingetragenen Anteil und können ihn jederzeit am freien Markt weiterverkaufen — vorbehaltlich einer Vorkaufsklausel zugunsten Ihrer Miteigentümer. Der Wiederverkauf ist unkompliziert und Anteile in Premium-Lagen tendieren dazu, im Wert zu steigen.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Kann ich Mieteinnahmen aus meinem Anteil erzielen?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Bei vielen unserer Immobilien ja. Wenn Sie Ihre zugeteilten Wochen nicht nutzen, können Sie sie vermieten und Einnahmen erzielen. Das Verwaltungsteam kann den Vermietungsprozess in Ihrem Namen übernehmen. Die Verfügbarkeit variiert je nach Immobilie — fragen Sie uns nach Details zu konkreten Angeboten. Hinweis: Ab 20. Mai 2026 gilt das deutsche Kurzzeitvermietungs-Daten-Gesetz (KVDG), das eine nationale Registrierungsnummer für Plattform-Buchungen verlangt.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Was hat es mit dem Hausaustausch auf sich?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Die meisten Immobilien in unserem Portfolio bieten ein Tauschsystem an. Wenn Sie Ihre zugeteilte Zeit lieber an einer anderen Destination verbringen möchten, können Sie einen Tausch mit einem Miteigentümer einer anderen Immobilie arrangieren. Eine großartige Möglichkeit, verschiedene Orte ohne zusätzliche Kosten zu erkunden.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Welche Kosten teilen sich die Eigentümer?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Alle laufenden Kosten werden anteilig aufgeteilt: Grundsteuern, Versicherungen, Nebenkosten, Wartung, Reparaturen, Reinigung und professionelle Verwaltung. Ein Co-Ownership-Vertrag legt genau fest, wie Kosten gehandhabt werden. Viele Immobilien sind vollständig möbliert und renoviert; die Möblierungskosten sind im Anteilspreis enthalten.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Gibt es rechtliche Einschränkungen bei der Nutzung?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Nicht-ansässige im Ausland unterliegen Nutzungsbeschränkungen: Typischerweise 180 Tage minus einen Tag, bevor die steuerliche Ansässigkeit ausgelöst wird. Für deutsche Staatsbürger innerhalb des Schengen-Raums ist das in der Regel kein Thema. Britische Staatsbürger können nach dem Brexit 90 Tage pro 180-Tage-Zeitraum innerhalb der gesamten EU verbringen. Ein 1/8- oder 1/4-Anteil passt komfortabel in diese Grenzen. Konsultieren Sie immer Ihren Steuerberater zu Ihrer persönlichen Situation.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Kann ich meinen Anteil an die Familie übertragen?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Ja. Ihr im Grundbuch eingetragener Anteil ist ein echter Vermögenswert, den Sie an Ihre Kinder oder Erben weitergeben können — wie jede andere Immobilie. Viele Familien besitzen Co-Ownership-Anteile gemeinsam über Generationen hinweg. Die Holdinggesellschaft-Struktur macht Übertragungen unkompliziert. Hinweis zur deutschen Erbschaftsteuer: Da Sie einen Geschäftsanteil halten, gelten besondere Bewertungsregeln — Ihr Steuerberater kann Sie zu Freibeträgen und Bewertungsabschlägen beraten.</p></div></details></li>
        </ul>


    </section>

    {/* ===== CTAs (shared partials) ===== */}
        {/* ===== NEWSLETTER SIGNUP (shared partial) ===== */}

        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}


    {/* ===== FOOTER ===== */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
    </>
  );
}
