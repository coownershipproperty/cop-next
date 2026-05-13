import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import { FEATURED_PROPERTY_SLUGS } from '@/lib/featured-properties';

// German locale homepage. Structure mirrors pages/index.js (English) and
// pages/es/index.js (Spanish) — same sections, same CSS classes, same
// images. Only the visible text and CTA destinations are translated.
//
// Strategic notes from the German market research baked in:
//  - Title tag uses `Ferienimmobilie` (highest commercial-intent search term).
//  - Body copy uses `Co-Ownership` as the primary product term (kept as English
//    loanword, which Germans search for) plus `Miteigentum` as the legal
//    German anchor.
//  - Formal Sie register throughout (correct for the buyer demographic).
//  - CTAs route to /de/ slugs where they exist; fall back to English-locale
//    pages for routes we haven't fully built out yet.

const SYM = { EUR: '€', USD: '$', GBP: '£' };

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: rows } = await supabase
    .from('properties')
    .select('slug, title, title_de, img, region, country, price, currency, beds, size')
    .in('slug', FEATURED_PROPERTY_SLUGS);

  const bySlug = Object.fromEntries((rows || []).map(p => [p.slug, p]));
  const featuredProps = FEATURED_PROPERTY_SLUGS
    .map(slug => bySlug[slug])
    .filter(Boolean)
    .map(p => ({
      slug: p.slug,
      // Use German title where the translation column has been populated;
      // fall back to English so the page renders before backfill.
      title: p.title_de || p.title,
      img: p.img,
      region: p.region || '',
      country: p.country || '',
      price: p.price || null,
      currency: p.currency || 'EUR',
      beds: p.beds || null,
      size: p.size || null,
    }));

  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  return { props: { propertyCount: propertyCount || 0, featuredProps }, revalidate: 3600 };
}

export default function HomeDE({ propertyCount, featuredProps }) {
  return (
    <>
      <Head>
        <title>Ferienimmobilie im Miteigentum — Co-Ownership in Europa | COP</title>
        <meta name="description" content="Entdecken Sie Co-Ownership-Ferienimmobilien in Mallorca, Toskana, Costa del Sol, an der Algarve und mehr. Echtes Miteigentum mit notarieller Eintragung. Unabhängig und unparteiisch." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/" />
        <HreflangLinks englishPath="/" />
        <meta property="og:title" content="Ferienimmobilie im Miteigentum — Co-Ownership in Europa | COP" />
        <meta property="og:description" content="Entdecken Sie Co-Ownership-Ferienimmobilien in Europas besten Destinationen. Echtes Miteigentum statt Timesharing." />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content="https://co-ownership-property.com/de/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline preload="auto">
          <source src="/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-heading">
            <span className="hero-pre">Ihre Ferienimmobilie</span>
            <em>zu einem Bruchteil der Kosten</em>
            <span className="hero-rule"></span>
            <span className="hero-post">im Co-Ownership</span>
          </h1>
        </div>

        <div className="hero-bottom">
          <div className="hero-ctas">
            <a href="/de/immobilien/" className="hero-cta-primary">Immobilien ansehen &rarr;</a>
            <a href="/de/so-funktionierts/" className="hero-cta-secondary">So funktioniert's</a>
          </div>
        </div>
      </section>

      {/* ===== INTRODUCTION SECTION ===== */}
      <section className="intro-section">
        <p className="intro-text">
          Entdecken Sie die Welt des luxuriösen Co-Ownership. Von sonnenverwöhnten Mediterran-Villen über charmante Stadtwohnungen bis hin zu Weingütern und alpinen Refugien — jede Immobilie fühlt sich mühelos wie Ihre eigene an.
        </p>
        <p className="intro-subtext">
          Jede Immobilie ist sorgfältig ausgewählt, geschmackvoll gestaltet und professionell verwaltet. Mehr als nur eine Ferienimmobilie — sie ist Ihr Tor zu einzigartigen Landschaften, kulturellen Schätzen und unvergesslichen Familienmomenten.
        </p>
      </section>

      {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
      <section className="explainer-section">
        <div className="explainer-intro">
          <h2>Was ist Miteigentum an einer Ferienimmobilie?</h2>
          <p><strong>Miteigentum</strong> — auch als <strong>Co-Ownership</strong> oder <strong>Anteilskauf</strong> bekannt — ermöglicht es Ihnen, einen rechtlich verbrieften Anteil an einer hochwertigen Ferienimmobilie zu erwerben und sie vollumfänglich zu nutzen, als wäre sie ganz Ihre. Sie haben den Lebensstil und die Immobilieninvestition, teilen sich aber Kosten und laufende Ausgaben mit anderen Miteigentümern.</p>
        </div>
        <div className="explainer-grid">
          <div className="explainer-item">
            <div className="explainer-num">01</div>
            <div className="explainer-divider"></div>
            <h3>Sie erwerben einen rechtlich verbrieften Anteil</h3>
            <p>Sie kaufen <strong>1/8 der Immobilie</strong>. Es handelt sich um <strong>echtes Eigentum, im Grundbuch auf Ihren Namen eingetragen</strong>, mit vollem rechtlichem Schutz. Unsere Immobilien sind so konzipiert, dass sie <strong>im Wert steigen</strong> — Sie profitieren von einer echten Immobilieninvestition. Ihren Anteil können Sie <strong>jederzeit verkaufen</strong> — Sie bestimmen den Preis, wir helfen beim Käufer-Matching.</p>
            <p className="explainer-stat">Anteile werden im Schnitt in unter einem Monat verkauft.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">02</div>
            <div className="explainer-divider"></div>
            <h3>Garantierte Nutzungszeit</h3>
            <p><strong>Ihre Wochen gehören Ihnen.</strong> Ein faires, strukturiertes Buchungssystem stellt sicher, dass jeder Miteigentümer seine Wunschtermine ohne Konkurrenz nutzen kann — <strong>auch in der Hochsaison.</strong> Kein Timesharing, keine Punkte, keine Bindungen. Sie kommen an und <strong>Ihre Sachen sind da, alles ist vorbereitet, die Immobilie vollständig verwaltet</strong> — Sie müssen nur noch genießen.</p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">03</div>
            <div className="explainer-divider"></div>
            <h3>Geteilte Betriebskosten</h3>
            <p>Wartung, Verwaltungsgebühren und laufende Kosten werden <strong>fair zwischen allen Miteigentümern aufgeteilt.</strong> Bei vielen Immobilien können Sie ungenutzte Wochen <strong>vermieten — und so Einnahmen erzielen</strong>, die Ihre Kosten weiter ausgleichen. <strong>Wir kümmern uns um alles.</strong></p>
          </div>
          <div className="explainer-item">
            <div className="explainer-num">04</div>
            <div className="explainer-divider"></div>
            <h3>Zusätzliche Vorteile</h3>
            <p>Co-Ownership bietet weitere Vorteile — von <strong>steuerlich günstigen Strukturen</strong> über <strong>vereinfachte Nachfolgeplanung</strong> bis zur Flexibilität, <strong>Wochen mit anderen Miteigentümern</strong> aus unserem internationalen Portfolio zu tauschen.</p>
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="cta-band">
        <p className="cta-band-eyebrow">Co-Ownership Property</p>
        <h2 className="cta-band-heading">Erwerben Sie einen Anteil an etwas <em>Außergewöhnlichem</em></h2>
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">Von einer Villa an der Côte d'Azur bis zu einem Chalet in Aspen — Co-Ownership gibt Ihnen einen echten Anteil an den exklusivsten Ferienimmobilien der Welt, zu einem Bruchteil des Preises.</p>
        <div className="cta-band-buttons">
          <a href="#speak-to-expert" className="cta-band-primary">Mit einem Experten sprechen</a>
          <a href="#newsletter" className="cta-band-secondary">Newsletter abonnieren</a>
        </div>
      </section>

      {/* ===== PROPERTIES TEASER ===== */}
      <section className="properties-section" id="properties">
        <h2 className="section-heading">Ferienimmobilien im Anteilskauf</h2>
        <p className="section-subtitle">Villen, Apartments und Ferienhäuser im Miteigentum auf Mallorca, Ibiza, an der Costa del Sol, am Gardasee, in der Toskana, in Tirol und mehr — ab einem Bruchteil des Vollkaufpreises.</p>

        <div className="pc-browse-all" style={{ marginTop: '2rem' }}>
          <a href="/de/immobilien/" className="pc-browse-btn">Alle {propertyCount} Immobilien ansehen &rarr;</a>
        </div>
      </section>

      {/* ===== FAQ SECTION (German) ===== */}
      <section className="faq-section" id="faq">
        <p className="faq-eyebrow">Häufige Fragen</p>
        <h2 className="faq-heading">Fragen zum <em>Miteigentum</em></h2>
        <p className="faq-subheading">Alles, was Sie über Co-Ownership wissen müssen — und warum es die intelligenteste Art ist, eine Ferienimmobilie zu besitzen.</p>
        <div className="faq-list">

          <details className="faq-item">
            <summary className="faq-q"><span>Was ist Co-Ownership oder Miteigentum an einer Ferienimmobilie?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Beim Co-Ownership erwerben Sie zusammen mit einer kleinen Anzahl weiterer Miteigentümer einen im Grundbuch eingetragenen Anteil an einer professionell verwalteten Luxus-Ferienimmobilie. Sie besitzen einen echten Bruchteil der Immobilie — typischerweise 1/8 — und im Gegensatz zum Timesharing haben Sie ein rechtlich verbrieftes Eigentum. Es kombiniert den Stolz und die finanziellen Vorteile echten Immobilieneigentums mit dem Komfort eines Fünf-Sterne-Hotels — zu einem Bruchteil des Vollkaufpreises.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie unterscheidet sich Co-Ownership von Timesharing?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Im Gegensatz zum Timesharing erhalten Sie beim Co-Ownership einen echten, im Grundbuch eingetragenen Anteil an der Immobilie. Das bedeutet, Sie profitieren von jeglicher Wertsteigerung und können Ihren Anteil jederzeit auf dem freien Markt verkaufen. Da es sich um Luxusimmobilien in stark nachgefragten Lagen handelt, steigen die Preise typischerweise mit der Zeit. Es gibt kein Mitgliedschaftsmodell, kein Punktesystem und keine langfristige vertragliche Bindung. Sie sind ein echter Immobilieneigentümer mit allen rechtlichen Befugnissen über Ihren Anteil.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Was ist im Kaufpreis enthalten?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Ihr Kaufpreis umfasst Ihren im Grundbuch eingetragenen Anteil an der Immobilie sowie das gesamte Mobiliar, die Innenausstattung und die Geräte. Viele unserer Immobilien sind professionell eingerichtet — vom ersten Tag an bezugsfertig. Die laufenden Kosten — Wartung, Versicherungen, Verwaltung und kommunale Steuern — werden anteilig auf alle Miteigentümer verteilt, sodass Ihre individuellen Ausgaben sehr gering bleiben.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie wird die Nutzungszeit zwischen den Miteigentümern aufgeteilt?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Jeder 1/8-Anteil gibt Ihnen 45 Tage — etwa sechs Wochen — pro Jahr, also genau 1/8 des Kalenders. Jede Immobilie hat einen klaren Nutzungskalender, der fair rotiert, sodass alle Miteigentümer im Zeitverlauf Zugang zur Hochsaison erhalten. Die meisten Anbieter stellen zudem eine digitale Buchungsplattform zur Verfügung, mit der Sie Wochen flexibel tauschen, erweitern oder mit anderen Miteigentümern abstimmen können.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Kann ich meine Wochen vermieten, wenn ich sie nicht selbst nutze?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>In vielen Fällen ja. Viele unserer Immobilien erlauben es Eigentümern, ungenutzte Wochen in ein verwaltetes Vermietungsprogramm einzubringen. Die Verwaltung kümmert sich um Gästescreening, Anreise, Reinigung und Wartung — die Mieteinnahmen fließen anteilig an Sie zurück. Das kann Ihre jährlichen Betriebskosten deutlich reduzieren und in beliebten Destinationen sogar einen Nettoertrag erzeugen. Hinweis: Ab 20. Mai 2026 gilt das deutsche Kurzzeitvermietungs-Daten-Gesetz (KVDG), das eine Registrierungsnummer für Plattformbuchungen verlangt — wir unterstützen Sie dabei.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wer übernimmt die laufende Verwaltung?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Jede Immobilie auf unserer Plattform wird von einer professionellen Hausverwaltung betreut. Sie kümmert sich um alles: von routinemäßiger Wartung und Reinigung bis hin zu Gartenpflege, Poolservice und dringenden Reparaturen. Bei jeder Anreise erwartet Sie ein makelloses Zuhause auf Hotelniveau — ohne dass Sie einen Finger rühren müssen.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Kann ich meinen Anteil später verkaufen?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Selbstverständlich. Da Sie einen im Grundbuch eingetragenen Anteil halten, können Sie diesen jederzeit auf dem freien Markt verkaufen — wie jede andere Immobilie auch. Ist die Immobilie im Wert gestiegen, profitieren Sie anteilig von der Wertsteigerung. Unser Team unterstützt Sie auch beim Wiederverkauf über unser Netzwerk qualifizierter Käufer.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Welche Destinationen und Immobilientypen bieten Sie an?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Wir kuratieren Co-Ownership-Ferienimmobilien in ganz Europa und den USA — darunter Spanien (Mallorca, Ibiza, Costa del Sol), Italien (Gardasee, Comer See, Toskana, Sardinien), Frankreich (Côte d'Azur, Französische Alpen), Portugal (Algarve), Österreich (Tirol, Salzburger Land), Deutschland (Sylt, Ostsee) und weitere. Die Immobilien reichen von Küstenvillen und Pariser Apartments bis zu alpinen Chalets und toskanischen Landhäusern. Jede Immobilie wird sorgfältig nach Lage, Bauqualität und Lebensstil-Attraktivität ausgewählt.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Ist Co-Ownership eine gute Investition?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Co-Ownership ermöglicht Ihnen den Zugang zu hochwertigen Immobilien zu einem Bruchteil der Vollkaufkosten und setzt Kapital für andere Investments frei. Sie profitieren von potenzieller Wertsteigerung, möglichen Mieteinnahmen und dem persönlichen Wert einer Luxus-Ferienimmobilie — und teilen gleichzeitig die Kosten mit anderen Miteigentümern. Es wird zunehmend als eine der finanziell sinnvollsten Wege anerkannt, eine Ferienimmobilie zu besitzen.</p></div>
          </details>

          <details className="faq-item">
            <summary className="faq-q"><span>Wie fange ich an?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
            <div className="faq-a"><p>Stöbern Sie einfach in unserer Auswahl oder sprechen Sie mit einem unserer Spezialisten über das Kontaktformular. Wir zeigen Ihnen die verfügbaren Immobilien, beantworten Ihre Fragen und begleiten Sie durch den gesamten Kaufprozess — mit voller rechtlicher und finanzieller Transparenz in jedem Schritt.</p></div>
          </details>

        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
