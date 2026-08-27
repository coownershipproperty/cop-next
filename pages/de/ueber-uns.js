import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';


export default function UeberUns() {
  return (
    <>
      <Head>
        <title>Über uns | Co-Ownership Property</title>
        <meta name="description" content="Lernen Sie das Team hinter Co-Ownership Property kennen. 2022 von David Olsson gegründet — wir helfen smarten Käufern, über Miteigentum-Anteile in europäische Luxus-Ferienimmobilien zu investieren." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/de/ueber-uns/" />
        {hreflangLinks({ englishPath: '/about-us' })}
        <meta property="og:title" content="Über uns | Co-Ownership Property" />
        <meta property="og:description" content="Lernen Sie das Team hinter Co-Ownership Property kennen. Wir helfen smarten Käufern beim Zugang zu Luxus-Ferienimmobilien über Miteigentum." />
        <meta property="og:url" content="https://co-ownership-property.com/de/ueber-uns/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
{/* ===== HERO ===== */}
    <section className="page-hero">
        <p className="eyebrow">Unsere Geschichte</p>
        <h1>Über <em>uns</em></h1>
        <p className="subtitle">Lernen Sie das Team kennen, das luxuriösen Ferienimmobilien-Besitz zugänglich, transparent und intelligent macht.</p>
    </section>

    {/* ===== PRESS BAR ===== */}
    <div className="press-bar" role="region" aria-label="Bekannt aus">
        <div className="press-bar-header"><span className="press-bar-label">Bekannt aus</span></div>
        <div className="press-marquee-wrap"><div className="press-track-outer">
            <div className="press-track">
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width={200} height={50} /></div>
            </div>
            <div className="press-track" aria-hidden="true">
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width={200} height={50} /></div>
                <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width={200} height={50} /></div>
            </div>
        </div></div>
    </div>

    {/* ===== INTRO ===== */}
    <section className="sec intro-sec">
        <div className="intro-center">
            <p className="eyebrow">Wer wir sind</p>
            <h2>Eine Agentur für Premium-<em>Co-Ownership</em></h2>
            <p>Seit 2022 widmet sich Co-Ownership Property ausschließlich Premium-Ferienimmobilien im Miteigentum an den begehrtesten Destinationen der Welt.</p>
            <p>Wir agieren zu 100% auf der Käuferseite und arbeiten ausschließlich mit den renommiertesten, transparentesten und professionell verwalteten Anbietern in Europa und den USA zusammen. Wir sind an keine einzelne Plattform und keinen Bauträger gebunden. Erfüllt eine Immobilie unseren Standard nicht, erscheint sie nicht auf dieser Seite.</p>
        </div>
    </section>

    {/* ===== TEAM ===== */}
    <section className="sec team-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Das Team</p>
            <h2>Die Menschen <em>hinter COP</em></h2>

            <div className="team-grid">
                <div className="team-card">
                    <div className="team-photo">
                        <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
                    </div>
                    <h3>David Olsson</h3>
                    <span className="team-role">Gründer</span>
                    <p className="team-bio">Über 20 Jahre Erfahrung im Verkauf von Premium-Skiimmobilien in mehr als 40 französischen Alpenresorts. David erlebte, wie sich der Markt veränderte und Kunden, die früher kaufen konnten, zunehmend aus dem Markt gedrängt wurden. Er gründete COP 2022, weil er überzeugt war, dass außergewöhnliche Immobilien Menschen gehören sollten, die sie lieben — nicht nur denen, die sie sich vollständig leisten können.</p>
                </div>
                <div className="team-card">
                    <div className="team-photo">
                        <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
                    </div>
                    <h3>Dylan Olsson</h3>
                    <span className="team-role">Vertrieb</span>
                    <p className="team-bio">Aufgewachsen zwischen London und Marbella, mit Wurzeln in vier Ländern, entwickelte Dylan ein instinktives Gespür für den internationalen Käufer. Nach seinem Wirtschaftsstudium an der University of Manchester machte er es sich zur Aufgabe, die Lücke zwischen Wunsch und Realität zu schließen — und hochwertige Ferienimmobilien durch einen transparenten, kundenorientierten Ansatz für mehr Menschen zugänglich zu machen.</p>
                </div>
                <div className="poppy-card">
                    <div className="team-photo">
                        <Image src="/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy" fill style={{objectFit:"cover"}} sizes="140px" />
                    </div>
                    <div>
                        <h3 style={{color: '#fff'}}>Poppy</h3>
                        <span className="team-role">Leiterin Sicherheit</span>
                        <p className="team-bio">Verfolgt eine Null-Toleranz-Politik gegenüber Eichhörnchen, Postboten und unautorisierten Katzen. Bekannt dafür, Bestechung in Form von Cheddar-Käse oder Bauchkraulen anzunehmen.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* ===== OUR STORY ===== */}
    <section className="sec story-sec">
        <div className="sec-inner">
            <div className="story-grid">
                <div className="story-img">
                    <Image src="/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" alt="Luxuriöses Alpen-Chalet von innen" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className="story-text">
                    <p className="eyebrow">Warum wir gestartet sind</p>
                    <h2>Ein Markt, der <em>Menschen zurückgelassen hat</em></h2>
                    <p>David verbrachte über zwei Jahrzehnte mit dem Verkauf von Premium-Immobilien in den französischen Alpen. In den frühen Jahren lagen die französischen Hypothekenzinsen unter 2%, Laufzeiten erstreckten sich über 25 Jahre und die Preise in den Alpenresorts standen — auch wenn nie billig — noch in einem sinnvollen Verhältnis zu denen in Paris. Eine Skiimmobilie zu kaufen war für eine berufstätige Familie ein realistisches Ziel.</p>
                    <p>Diese Welt verschwand allmählich. Zwischen 2017 und 2022 stiegen die Preise in den begehrtesten Resorts um 30–50% — in einigen Gegenden überstiegen sie sogar die Pariser Quadratmeterpreise. Das Chalet in Méribel, das Apartment in Chamonix — sie waren zur Domäne der Barzahler geworden.</p>
                    <blockquote>Die Kunden, mit denen ich jahrelang gearbeitet hatte, wollten immer noch kaufen — sie konnten es sich nur einfach nicht mehr leisten. Sie wurden schlicht aus dem Markt gedrängt.
                        <span className="quote-attr">David Olsson — Gründer</span>
                    </blockquote>
                </div>
            </div>
        </div>
    </section>

    {/* ===== THE MODEL ===== */}
    <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
            <div className="story-grid">
                <div className="story-text">
                    <p className="eyebrow">Die Lösung</p>
                    <h2>Eine bessere Art zu <em>besitzen</em></h2>
                    <p>Während eine ganze Alpenimmobilie heute oft über &euro;800.000 kostet, macht ein Anteil im Miteigentum echtes Eigentum schon ab rund &euro;100.000 zugänglich. Sie besitzen einen im Grundbuch eingetragenen Anteil an einer Premium-Immobilie, profitieren von der Wertentwicklung und entscheiden selbst, wann Sie verkaufen.</p>
                    <p>Ein einzelner 1/8-Anteil gibt Ihnen sechs Wochen Nutzung pro Jahr — 45 Tage. Der durchschnittliche Zweitwohnungsbesitzer nutzt seine Immobilie nur 35 Tage im Jahr — ein Anteil im Miteigentum übersteigt also bereits die typische persönliche Nutzung.</p>
                    <p>Und nichts spricht dagegen, weiterzugehen: Erwerben Sie zwei Anteile an derselben Immobilie oder kombinieren Sie einen Anteil an einem Alpen-Chalet mit einem Anteil an einer Ibiza-Villa. Die Immobilien funktionieren unabhängig voneinander, die Eigentumsstruktur ist dieselbe und Ihren Kalender gestalten Sie nach Ihren Wünschen.</p>
                    <blockquote>Die durchschnittliche Ferienimmobilie steht 330 Tage im Jahr leer. Ein Anteil im Miteigentum gibt Ihnen mehr Zeit in einer außergewöhnlichen Immobilie — zu einem Bruchteil der Kosten.</blockquote>
                </div>
                <div className="story-img">
                    <Image src="/wp-content/uploads/2025/11/ibiza-villa.jpg" alt="Ibiza-Villa mit Pool" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
            </div>
        </div>
    </section>

    {/* ===== MID-PAGE CTA ===== */}
    <section style={{background: 'var(--blue)', padding: '60px 3rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>Bereit, Ihre Ferienimmobilie zu finden?</p>
        <div style={{display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a href="#speak-to-expert" style={{display: 'inline-block', padding: '14px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'var(--warm-gold)', color: '#fff', textDecoration: 'none', transition: 'background 0.3s'}}>Mit einem Experten sprechen</a>
            <a href="#newsletter" style={{display: 'inline-block', padding: '13px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'all 0.3s'}}>Newsletter abonnieren</a>
        </div>
    </section>

    {/* ===== TESTIMONIALS ===== */}
    <section className="sec testi-sec" style={{background: 'var(--cream-bg)'}}>
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Was unsere Kunden sagen</p>
            <h2>Echte Eigentümer, echte <em>Geschichten</em></h2>

            <div className="testi-grid">
                <div className="testi-card">
                    <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" fill style={{objectFit:"cover"}} sizes="90px" /></div>
                    <div className="testi-name">Astrid</div>
                    <span className="testi-loc">Mougins, Südfrankreich</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">Vom ersten Aufenthalt an fühlte sich alles mühelos an. Es ist, als käme man im eigenen Zuhause an — mit dem Komfort eines Hotels. Die Betten sind gemacht, die Handtücher liegen bereit — an nichts muss man denken. Jeder Besuch beginnt mit Ruhe statt Pflichten. Ich liebe es jetzt schon und muss mir um nichts Sorgen machen.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry &amp; Nicole" fill style={{objectFit:"cover"}} sizes="90px" /></div>
                    <div className="testi-name">Harry &amp; Nicole</div>
                    <span className="testi-loc">La Plagne, Französische Alpen</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">Ein Domizil in den französischen Alpen war immer unser Traum. Co-Ownership war die perfekte Lösung — alle Vorteile eines luxuriösen Berghauses ohne Stress und Kosten der Vollverwaltung. Unser Sohn kann jetzt seine Schulfreunde zum Skifahren in den Halbjahresferien einladen. Es hat unseren Traum wirklich Wirklichkeit werden lassen.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo &amp; Anne" fill style={{objectFit:"cover"}} sizes="90px" /></div>
                    <div className="testi-name">Mateo &amp; Anne</div>
                    <span className="testi-loc">Lake Tahoe, Kalifornien</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">Wir sind seit Jahren jeden Sommer von LA nach Tahoe gefahren, konnten ein ganzes Haus aber nie rechtfertigen. Dieses Eigentumsmodell fühlte sich wie der perfekte Mittelweg an. Wir besitzen endlich ein Stück Land — ohne das schlechte Gewissen einer ungenutzten Hypothek. Vom ersten Tag an transparent — wir könnten nicht glücklicher sein.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca-300x300.jpg" alt="Jan &amp; Familie" fill style={{objectFit:"cover"}} sizes="90px" /></div>
                    <div className="testi-name">Jan &amp; Familie</div>
                    <span className="testi-loc">Port d'Andratx, Mallorca</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">Ich habe meine französische Ferienimmobilie verkauft, den Gewinn mitgenommen und nur ein Viertel davon verwendet, um eine viel schönere Villa zu kaufen. Schlechtes Gewissen weg. Die Villa ist atemberaubend, die Kinder lieben sie und die übrigen Wochen werden vermietet — das deckt die monatlichen Betriebskosten mehr als ab. Sehr empfehlenswert.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== CTAs ===== */}
        {/* ===== NEWSLETTER SIGNUP (shared partial) ===== */}

        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}


    {/* ===== FOOTER ===== */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/about-us.js" strategy="afterInteractive" />
    </>
  );
}
