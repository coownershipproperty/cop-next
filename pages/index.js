import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Co-Ownership Property | Luxury Fractional Ownership</title>
        <meta name="description" content="Co-Ownership Property - Luxury fractional ownership of premium properties worldwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
{/* ===== HERO SECTION ===== */}
    <section className="hero">
        <video className="hero-video" autoPlay muted loop playsinline preload="auto" fetchPriority="high">
            <source src="https://co-ownership-property.com/wp-content/uploads/2026/03/fractional-ownership-luxury-holiday-homes.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>

        {/* Header & Navigation (shared partial) */}
        <header className="cop-header" id="cop-header">
    <div className="cop-logo">
        <a href="/">
            <img src="/wp-content/uploads/Main-Logo-white-COP.svg" alt="Co-Ownership Property" className="logo-white" />
            <img src="/wp-content/uploads/MAIN-LOGO-COP.svg" alt="Co-Ownership Property" className="logo-dark" />
        </a>
    </div>
    <nav className="cop-nav" id="cop-nav">
        <a href="/" className="cop-nav-active">Home</a>
        <a href="/our-homes/">Our Homes</a>
        <a href="/how-it-works/">How It Works</a>
        <a href="/about-us">About Us</a>
        <a href="/all-our-blog/">Our Blog</a>
        <a href="/favourites" className="cop-nav-favourites">My Favourites</a>
        <a href="/contact">Contact</a>
    </nav>
    <button className="cop-hamburger" id="cop-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
    </button>
</header>

        {/* Hero Content */}
        <div className="hero-content">
            <h1 className="hero-heading">
                <span className="hero-pre">Your window to the</span>
                <em>world's finest</em>
                <span className="hero-rule"></span>
                <span className="hero-post">co-ownership</span>
            </h1>
        </div>

        {/* Hero Bottom Section */}
        <div className="hero-bottom">
            <div className="hero-ctas">
                <a href="/properties" className="hero-cta-primary">Browse Properties &rarr;</a>
                <a href="/how-it-works" className="hero-cta-secondary">How It Works</a>
            </div>
        </div>
    </section>

    {/* ===== PRESS MARQUEE ===== */}
    <div className="press-bar" role="region" aria-label="As featured in">
        <div className="press-bar-header">
            <span className="press-bar-label">As Featured In</span>
        </div>
        <div className="press-marquee-wrap">
        <div className="press-track-outer">
            {/* Set 1 */}
            <div className="press-track">
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-express.png" alt="Express" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" loading="eager" width="200" height="50" />
                </div>
            </div>
            {/* Set 2 (identical – creates seamless infinite loop) */}
            <div className="press-track" aria-hidden="true">
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-times.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-ft.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-forbes.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-express.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" loading="eager" width="200" height="50" />
                </div>
                <div className="press-logo-item">
                    <img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" loading="eager" width="200" height="50" />
                </div>
            </div>
        </div>
        </div>
    </div>

    {/* ===== INTRODUCTION SECTION ===== */}
    <section className="intro-section">
        <p className="intro-text">
            Discover the world of luxury co-ownership. From sun-drenched Mediterranean villas to chic city apartments, from vineyard estates to Alpine retreats, each property feels effortlessly yours.
        </p>
        <p className="intro-subtext">
            Every listing is carefully curated, beautifully designed, and expertly managed. More than ownership, it's a gateway to timeless landscapes, cultural treasures, and unforgettable family moments.
        </p>
    </section>

    {/* ===== CO-OWNERSHIP EXPLAINER ===== */}
    <section className="explainer-section">
        <div className="explainer-intro">
            <h2>What is Co-Ownership?</h2>
            <p>Co-ownership lets you buy a legal share of a premium holiday property — and use it fully, just as you would a home you owned outright. You get the lifestyle without the full price tag, and share only the costs.</p>
        </div>
        <div className="explainer-grid">
            <div className="explainer-item">
                <div className="explainer-num">01</div>
                <div className="explainer-divider"></div>
                <h3>You Own a Legal Share</h3>
                <p>You purchase a <strong>1/8 share</strong> of a premium property. It's <strong>real ownership, registered in your name</strong>, with full legal protections. Our properties are designed to <strong>appreciate in value</strong>, giving you the benefits of real estate as an investment. You have full flexibility to <strong>sell your share at any time</strong> — you set the price, and we help find a buyer.</p>
                <p className="explainer-stat">Shares sell in under a month on average.</p>
            </div>
            <div className="explainer-item">
                <div className="explainer-num">02</div>
                <div className="explainer-divider"></div>
                <h3>Guaranteed Usage</h3>
                <p><strong>Your weeks are yours.</strong> A fair, structured schedule ensures every owner gets their time without competing for dates — <strong>including peak season.</strong> No timeshare, no points, no compromise. It feels like home — you arrive and <strong>your belongings are there, everything is set up, and the property is fully managed</strong> so you can simply enjoy it.</p>
            </div>
            <div className="explainer-item">
                <div className="explainer-num">03</div>
                <div className="explainer-divider"></div>
                <h3>Shared Running Costs</h3>
                <p>Maintenance, management fees and running costs are <strong>divided equally among owners.</strong> On many properties, when you're not using it, it can be <strong>rented out — generating income</strong> that further offsets your costs. <strong>We handle everything.</strong></p>
            </div>
            <div className="explainer-item">
                <div className="explainer-num">04</div>
                <div className="explainer-divider"></div>
                <h3>Added Benefits</h3>
                <p>Co-ownership brings wider advantages too — from <strong>favourable tax treatment</strong> and <strong>simplified inheritance planning</strong>, to the flexibility of <strong>home-swapping</strong> with fellow owners across our portfolio of properties worldwide.</p>
            </div>
        </div>
    </section>

    {/* ===== CTA BAND ===== */}
    <section className="cta-band">
        <p className="cta-band-eyebrow">Co-Ownership Property</p>
        <h2 className="cta-band-heading">Own a share of somewhere <em>extraordinary</em></h2>
        <span className="cta-band-rule"></span>
        <p className="cta-band-sub">From a villa on the Côte d'Azur to a chalet in Aspen — fractional ownership gives you a genuine stake in the world's finest homes, at a fraction of the cost.</p>
        <div className="cta-band-buttons">
            <a href="#speak-to-expert" className="cta-band-primary">Speak to an Expert</a>
            <a href="#contact" className="cta-band-secondary">Subscribe to Newsletter</a>
        </div>
    </section>

    {/* ===== PROPERTIES CAROUSEL SECTION ===== */}
    <section className="properties-section" id="properties">
        <h2 className="section-heading">Explore Our Properties</h2>
        <p className="section-subtitle">Browse our curated collection of fractional ownership opportunities across the world's most desirable destinations.</p>

        <ul className="prop-list" id="prop-list">
                        <li className="prop-see-more-slide">
                <div className="prop-card prop-card-see-more">
                    <a href="/properties" className="prop-see-more-inner">
                        <span className="prop-see-more-count">234</span>
                        <span className="prop-see-more-label">properties</span>
                        <span className="prop-see-more-cta">Browse All &rarr;</span>
                    </a>
                </div>
            </li>
        </ul>

        <div className="prop-nav">
            <button className="prop-nav-btn" id="prop-prev">&#8592;</button>
            <span className="prop-counter"><span id="prop-current">1</span> / <span id="prop-total">234</span></span>
            <button className="prop-nav-btn" id="prop-next">&#8594;</button>
        </div>
    </section>

    {/* ===== DESTINATIONS SECTION ===== */}
    <section className="destinations-section" id="destinations">
        <h2 className="section-heading">Our Destinations</h2>

        {/* Tab navigation */}
        <div className="dest-tabs">
            <button className="dest-tab-btn active" data-dest="france">France</button>
            <button className="dest-tab-btn" data-dest="spain">Spain</button>
            <button className="dest-tab-btn" data-dest="usa">USA</button>
            <button className="dest-tab-btn" data-dest="italy">Italy</button>
            <button className="dest-tab-btn" data-dest="portugal">Portugal</button>
            <button className="dest-tab-btn" data-dest="austria">Austria</button>
            <button className="dest-tab-btn" data-dest="england">England</button>
            <button className="dest-tab-btn" data-dest="sweden">Sweden</button>
            <button className="dest-tab-btn" data-dest="germany">Germany</button>
            <button className="dest-tab-btn" data-dest="croatia">Croatia</button>
            <button className="dest-tab-btn" data-dest="mexico">Mexico</button>
        </div>

        {/* Panels */}
        <div className="dest-panels">

            <div className="dest-panel active" id="dest-france">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/france-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-france.webp" alt="France" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">France</div>
                    <p className="dest-info-desc">From the sun-drenched shores of the Côte d'Azur to the ski slopes of the French Alps and the timeless elegance of Paris, France is Europe's most coveted address for fractional ownership.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-spain">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/spain-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-spain.webp" alt="Spain" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Spain</div>
                    <p className="dest-info-desc">Spain combines world-class beaches, vibrant culture and year-round sunshine across Mallorca, Ibiza, the Costa del Sol and beyond — all at remarkable value for discerning co-owners.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-italy">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/italy-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-italy-v2.webp" alt="Italy" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Italy</div>
                    <p className="dest-info-desc">Italy's extraordinary landscapes — from the glassy waters of Lake Como to the ancient villages of Liguria and the Tuscan hills — make it a perennial favourite for discerning co-owners.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-portugal">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/portugal-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-portugal.webp" alt="Portugal" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Portugal</div>
                    <p className="dest-info-desc">From the golden coastline of the Algarve to the elegant boulevards of Lisbon and the unspoilt beauty of the Silver Coast, Portugal is one of Europe's most exciting destinations for luxury co-ownership.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-austria">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/austria-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-austria.webp" alt="Austria" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Austria</div>
                    <p className="dest-info-desc">Austria's Alpine splendour — from the world-class ski resorts of Tyrol to the grand imperial charm of Vienna — makes it one of Europe's most rewarding destinations for luxury fractional ownership.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-england">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/england-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-england.webp" alt="England" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">England</div>
                    <p className="dest-info-desc">London remains one of the world's great cities for luxury property — from Mayfair townhouses to riverside apartments — while the English countryside offers idyllic retreats for discerning co-owners.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-sweden">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/sweden-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-sweden.webp" alt="Sweden" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Sweden</div>
                    <p className="dest-info-desc">Sweden's dramatic landscapes — from the Stockholm archipelago to the forested lake districts of the north — offer a uniquely peaceful setting for luxury co-ownership away from the crowds.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-germany">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/germany-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-germany.webp" alt="Germany" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Germany</div>
                    <p className="dest-info-desc">From the Bavarian Alps and the shores of Lake Constance to the cultural capitals of Berlin and Munich, Germany offers a compelling range of luxury property opportunities for co-owners.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-croatia">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/croatia-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-croatia.webp" alt="Croatia" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Croatia</div>
                    <p className="dest-info-desc">Croatia's breathtaking Adriatic coastline, crystal-clear waters and historic walled towns like Dubrovnik make it one of the Mediterranean's most coveted destinations for luxury fractional ownership.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-usa">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/usa-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-usa-v2.webp" alt="USA" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">USA</div>
                    <p className="dest-info-desc">From the surf culture of California to the ski slopes of Colorado and the waterfront glamour of Florida, America's luxury property market offers extraordinary opportunities for international co-owners.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

            <div className="dest-panel" id="dest-mexico">
                <div className="dest-country-outline" style={{backgroundImage: "url('/wp-content/uploads/mexico-line.webp')"}}></div>
                <div className="dest-img-wrap">
                    <img src="/wp-content/uploads/dest-mexico-v2.webp" alt="Mexico" loading="lazy" width="504" height="466" />
                </div>
                <div className="dest-info">
                    <div className="dest-info-name">Mexico</div>
                    <p className="dest-info-desc">From the turquoise shores of the Riviera Maya to the Pacific glamour of Los Cabos, Mexico offers extraordinary luxury at exceptional value — making it one of the most exciting co-ownership markets in the world.</p>
                    <a href="#properties" className="dest-explore-btn">Explore Properties</a>
                </div>
            </div>

        </div>
    </section>


    {/* ===== TESTIMONIALS SECTION ===== */}
    <section className="testimonials-section" id="testimonials">
        <h2 className="section-heading">Homeowner Stories</h2>
        <div className="testimonials-grid">
            <div className="testimonial-card">
                <img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" className="testimonial-image" loading="lazy" />
                <p className="testimonial-quote">"From the first stay, everything felt effortless — like arriving at your own home with the comfort of a hotel. Provence is now part of our rhythm. I don't have to worry about a thing."</p>
                <div className="testimonial-author">Astrid</div>
                <div className="testimonial-location">Mougins, South of France</div>
            </div>
            <div className="testimonial-card">
                <img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry &amp; Nicole" className="testimonial-image" loading="lazy" />
                <p className="testimonial-quote">"Fractional ownership gave us the Alpine dream we thought was out of reach. The process was seamless, and our son now brings his school friends to ski. It's become a proper family home."</p>
                <div className="testimonial-author">Harry &amp; Nicole</div>
                <div className="testimonial-location">La Plagne, French Alps</div>
            </div>
            <div className="testimonial-card">
                <img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo &amp; Anne" className="testimonial-image" loading="lazy" />
                <p className="testimonial-quote">"We finally own a piece of the land without the guilt of an unused mortgage. Transparent from day one — we couldn't be happier. Already planning our next share in Europe."</p>
                <div className="testimonial-author">Mateo &amp; Anne</div>
                <div className="testimonial-location">LA, California</div>
            </div>
            <div className="testimonial-card">
                <img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Family-swimming-in-Mallorca.jpg" alt="Jan &amp; The Family" className="testimonial-image" loading="lazy" />
                <p className="testimonial-quote">"I sold my French holiday home and bought a much nicer villa in Mallorca for a quarter of the price. The team handled everything flawlessly — it feels like ours the moment we walk through the door."</p>
                <div className="testimonial-author">Jan &amp; The Family</div>
                <div className="testimonial-location">Mallorca, Spain</div>
            </div>
        </div>
    </section>

    {/* ===== LATEST POSTS SECTION ===== */}
    <section className="latest-posts-section">
        <span className="lp-eyebrow">From the Blog</span>
        <h2 className="section-heading">Latest Insights</h2>
        <p className="lp-subtitle">Destination guides, market analysis and ownership stories — published daily for the discerning buyer.</p>

        <div className="latest-posts-grid">
                        <article className="lp-card" onclick="window.location='https://staging.co-ownership-property.com/the-algarve-golden-triangle-why-portugals-most-exclusive-coast-is-europes-smartest-co-ownership-destination-in-2026/'">
                                <div className="lp-image-wrap">
                    <img src="https://staging.co-ownership-property.com/wp-content/uploads/2026/04/algarve-golden-triangle-co-ownership-luxury-property-2026-hero-768x1152.jpg"
                         alt="The Algarve Golden Triangle: Why Portugal&#8217;s Most Exclusive Coast Is Europe&#8217;s Smartest Co-Ownership Destination in 2026"
                         className="lp-image"
                         loading="lazy"
                         decoding="async" />
                </div>
                                <div className="lp-content">
                    <span className="lp-date">13 Apr 2026</span>
                    <h3 className="lp-title">The Algarve Golden Triangle: Why Portugal&#8217;s Most Exclusive Coast Is Europe&#8217;s Smartest Co-Ownership Destination in 2026</h3>
                    <p className="lp-excerpt">Discover why the Algarve&#039;s Golden Triangle is Europe&#039;s top co-ownership destination in 2026. Quinta do Lago, Vale do Lobo fractional…</p>
                    <a href="https://staging.co-ownership-property.com/the-algarve-golden-triangle-why-portugals-most-exclusive-coast-is-europes-smartest-co-ownership-destination-in-2026/" className="lp-read-more">Read Article →</a>
                </div>
            </article>
                        <article className="lp-card" onclick="window.location='https://staging.co-ownership-property.com/three-paths-luxury-fractional-ownership-success-stories/'">
                                <div className="lp-image-wrap">
                    <img src="https://staging.co-ownership-property.com/wp-content/uploads/2026/04/three-paths-luxury-fractional-ownership-success-stories-hero-768x512.jpg"
                         alt="Three Paths to Luxury: How Real Buyers Are Using Fractional Ownership to Transform Their Holiday Home Experience"
                         className="lp-image"
                         loading="lazy"
                         decoding="async" />
                </div>
                                <div className="lp-content">
                    <span className="lp-date">12 Apr 2026</span>
                    <h3 className="lp-title">Three Paths to Luxury: How Real Buyers Are Using Fractional Ownership to Transform Their Holiday Home Experience</h3>
                    <p className="lp-excerpt">Discover how three different buyer profiles transformed their holiday home experience through fractional ownership — from downsizers to first-time luxury…</p>
                    <a href="https://staging.co-ownership-property.com/three-paths-luxury-fractional-ownership-success-stories/" className="lp-read-more">Read Article →</a>
                </div>
            </article>
                        <article className="lp-card" onclick="window.location='https://staging.co-ownership-property.com/idle-asset-problem-fractional-ownership-investment-second-homes/'">
                                <div className="lp-image-wrap">
                    <img src="https://staging.co-ownership-property.com/wp-content/uploads/2026/04/idle-asset-problem-fractional-ownership-investment-second-homes-hero-768x512.jpg"
                         alt="The Idle Asset Problem: Why Smart Investors Are Choosing Fractional Ownership Over Empty Second Homes"
                         className="lp-image"
                         loading="lazy"
                         decoding="async" />
                </div>
                                <div className="lp-content">
                    <span className="lp-date">12 Apr 2026</span>
                    <h3 className="lp-title">The Idle Asset Problem: Why Smart Investors Are Choosing Fractional Ownership Over Empty Second Homes</h3>
                    <p className="lp-excerpt">Discover why smart investors are switching from underused second homes to fractional ownership. Cut costs by 87%, enjoy 45 days…</p>
                    <a href="https://staging.co-ownership-property.com/idle-asset-problem-fractional-ownership-investment-second-homes/" className="lp-read-more">Read Article →</a>
                </div>
            </article>
                    </div>

        <div className="lp-footer">
            <a href="/all-our-blog/" className="lp-all-btn">View All Articles</a>
        </div>
    </section>

    {/* ===== NEWSLETTER (shared partial) ===== */}
        {/* ===== NEWSLETTER SIGNUP (shared partial) ===== */}
    <section className="newsletter-section" id="newsletter">
        <h2 className="newsletter-heading">Be The First To Know</h2>
        <p className="newsletter-subtitle">Join our community for exclusive listings and destination insights delivered straight to your inbox.</p>
        <form className="newsletter-form" id="cop-newsletter-form" novalidate>
            <input type="email" name="email" placeholder="Enter your email address" required />
            <button type="submit" className="newsletter-btn">Join Newsletter</button>
        </form>
        <p className="newsletter-form-msg" id="newsletter-form-msg"></p>
    </section>

    {/* ===== EXPERT FORM (shared partial) ===== */}
        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}
    <section className="expert-section" id="speak-to-expert">
        <div className="expert-inner">
            <p className="expert-eyebrow">Get in Touch</p>
            <h2 className="expert-heading">Speak to an <em>expert</em></h2>
            <p className="expert-sub">Tell us what you're looking for and one of our co-ownership specialists will be in touch within 24 hours.</p>

            <form className="expert-form" id="expert-enquiry-form" novalidate>
                <input type="hidden" name="nonce" value="9e3a8b0450" />                <div className="expert-form-grid">
                    <div className="expert-form-field">
                        <label htmlFor="ef-name">Name <span>*</span></label>
                        <input type="text" id="ef-name" name="name" placeholder="Your name" required />
                    </div>
                    <div className="expert-form-field">
                        <label htmlFor="ef-email">Email Address <span>*</span></label>
                        <input type="email" id="ef-email" name="email" placeholder="your@email.com" required />
                    </div>
                    <div className="expert-form-field">
                        <label htmlFor="ef-phone">Phone Number <span>*</span></label>
                        <input type="tel" id="ef-phone" name="phone" placeholder="+44 7700 000000" required />
                    </div>
                    <div className="expert-form-field">
                        <label>Destinations</label>
                        <div className="dest-multiselect" id="dest-multiselect">
                            <div className="dest-trigger" id="dest-trigger">
                                <span className="dest-placeholder">Select destinations</span>
                            </div>
                            <div className="dest-dropdown" id="dest-dropdown">
                                                                <div className="dest-option" data-value="France">
                                    <span className="dest-check"></span>
                                    🇫🇷 France                                </div>
                                                                <div className="dest-option" data-value="Spain">
                                    <span className="dest-check"></span>
                                    🇪🇸 Spain                                </div>
                                                                <div className="dest-option" data-value="Italy">
                                    <span className="dest-check"></span>
                                    🇮🇹 Italy                                </div>
                                                                <div className="dest-option" data-value="USA">
                                    <span className="dest-check"></span>
                                    🇺🇸 USA                                </div>
                                                                <div className="dest-option" data-value="Portugal">
                                    <span className="dest-check"></span>
                                    🇵🇹 Portugal                                </div>
                                                                <div className="dest-option" data-value="Austria">
                                    <span className="dest-check"></span>
                                    🇦🇹 Austria                                </div>
                                                                <div className="dest-option" data-value="England">
                                    <span className="dest-check"></span>
                                    🏴󠁧󠁢󠁥󠁮󠁧󠁿 England                                </div>
                                                                <div className="dest-option" data-value="Sweden">
                                    <span className="dest-check"></span>
                                    🇸🇪 Sweden                                </div>
                                                                <div className="dest-option" data-value="Germany">
                                    <span className="dest-check"></span>
                                    🇩🇪 Germany                                </div>
                                                                <div className="dest-option" data-value="Croatia">
                                    <span className="dest-check"></span>
                                    🇭🇷 Croatia                                </div>
                                                                <div className="dest-option" data-value="Mexico">
                                    <span className="dest-check"></span>
                                    🇲🇽 Mexico                                </div>
                                                            </div>
                        </div>
                        <input type="hidden" name="destination" id="ef-destination" />
                    </div>
                    <div className="expert-form-field">
                        <label htmlFor="ef-budget">Budget Range</label>
                        <select id="ef-budget" name="budget">
                            <option value="" disabled selected>Select a budget</option>
                            <option>Under €100,000</option>
                            <option>€100,000 – €200,000</option>
                            <option>€200,000 – €350,000</option>
                            <option>€350,000 – €500,000</option>
                            <option>€500,000 – €750,000</option>
                            <option>€750,000 – €1,000,000</option>
                            <option>Over €1,000,000</option>
                        </select>
                    </div>
                    <div className="expert-form-field">
                        <label htmlFor="ef-message">Message</label>
                        <textarea id="ef-message" name="message" placeholder="Tell us more about what you're looking for (optional)"></textarea>
                    </div>
                </div>
                <div className="expert-submit">
                    <button type="submit" className="expert-submit-btn">Send Enquiry</button>
                    <p className="expert-form-msg" id="expert-form-msg"></p>
                </div>
            </form>
        </div>
    </section>

    {/* ===== FAQ SECTION ===== */}
    <section className="faq-section" id="faq">
        <p className="faq-eyebrow">Common Questions</p>
        <h2 className="faq-heading">Frequently Asked <em>Questions</em></h2>
        <p className="faq-subheading">Everything you need to know about luxury co-ownership — and why it's the smartest way to own a holiday home.</p>
        <div className="faq-list">

            <details className="faq-item">
                <summary className="faq-q"><span>What is fractional or co-ownership of a holiday home?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Co-ownership means you and a small number of other owners each purchase a deeded share of a fully managed luxury property. You own a real fraction of the home — typically one-eighth — and unlike a timeshare, you hold genuine legal ownership of the property itself. It combines the pride and financial benefits of real property ownership with the ease of a five-star hotel experience, at a fraction of the cost of buying outright.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>How is co-ownership different from timeshare?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Unlike a timeshare, co-ownership gives you a real share of the property deed, meaning you benefit from any appreciation in value and can sell your share on the open market whenever you choose. Because these are luxury properties in high-demand locations, prices typically do rise over time. There is no membership club, no points system, and no long-term contractual lock-in. You are a genuine property owner with full legal rights over your fraction.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>What does the purchase price include?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Your purchase price covers your deeded share of the property along with its full furnishings, interior design, and equipment. Many of our homes are professionally styled to a turnkey standard, so they are move-in ready from day one. Ongoing costs such as maintenance, insurance, property management, and local taxes are shared proportionally among all co-owners, keeping individual running costs very low.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>How is usage time divided between owners?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Every one-eighth share gives you 45 days — roughly six weeks — which is one-eighth of a year. Each property has a clear usage schedule that rotates fairly so all owners enjoy peak-season access over time. Many operators also offer a digital booking platform so you can swap, extend, or exchange weeks with fellow owners flexibly.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>Can I rent out my weeks when I'm not using them?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>In many cases, yes. Many of our properties allow owners to place unused weeks into a managed rental programme. The property management company handles guest screening, check-in, cleaning, and maintenance, while rental income is returned to you. This can offset your annual running costs significantly and, in popular destinations, even generate a net return.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>Who manages the property day to day?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Every home on our platform is looked after by a professional property management company. They handle everything from routine maintenance and housekeeping to landscaping, pool care, and emergency repairs. You arrive to a pristine, hotel-quality home every visit — without lifting a finger.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>Can I sell my share later?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Absolutely. Because you hold a deeded share, you can sell it at any time on the open market — just like any other property. If the home has appreciated in value, you benefit from that growth in proportion to your ownership share. Our team can also assist with resales to our network of qualified buyers.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>Which destinations and property types do you offer?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>We curate luxury co-ownership homes across Europe and the United States, including France, Spain, Italy, Portugal, Austria, England, and several US destinations. Properties range from coastal villas and Parisian apartments to Alpine chalets and Tuscan farmhouses. Every home is hand-selected for its location, build quality, and lifestyle appeal.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>Is co-ownership a good investment?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Co-ownership allows you to access a high-value property at a fraction of the cost of buying outright, freeing capital for other investments. You enjoy potential property appreciation, possible rental income, and the personal value of a luxury holiday home — all while sharing costs with fellow owners. It is increasingly recognised as one of the most financially sensible ways to own a second home.</p></div>
            </details>

            <details className="faq-item">
                <summary className="faq-q"><span>How do I get started?</span><svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg></summary>
                <div className="faq-a"><p>Simply browse our collection above or speak to one of our property specialists using the enquiry form. We will walk you through available homes, answer any questions, and guide you through the purchase process from start to finish — with full legal and financial transparency at every step.</p></div>
            </details>

        </div>
    </section>

    {/* FAQ Structured Data (SEO) */}
    

    {/* ===== FOOTER ===== */}    <footer>
        <div className="footer-content">
            <div className="footer-logo">
                <a href="/" className="footer-logo-link" style={{textDecoration: 'none'}}>
                    <div style={{fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontStyle: 'italic', color: '#fff', letterSpacing: '.02em', marginBottom: '6px', lineHeight: '1.2'}}>Co-Ownership<br />Properties</div>
                </a>
                <p className="footer-tagline" style={{fontSize: '.82rem', lineHeight: '1.7', color: 'rgba(255,255,255,.55)', maxWidth: '220px', marginBottom: '24px'}}>The independent guide to luxury fractional ownership across Europe &amp; the USA.</p>
                <div className="footer-social">
                    <a href="#" className="social-icon" aria-label="Facebook">f</a>
                    <a href="#" className="social-icon" aria-label="Instagram">in</a>
                    <a href="#" className="social-icon" aria-label="LinkedIn">in</a>
                    <a href="#" className="social-icon" aria-label="X / Twitter">&#120143;</a>
                </div>
            </div>

            <div className="footer-section">
                <h4>Discover</h4>
                <ul>
                    <li><a href="/our-homes/">All Properties</a></li>
                    <li><a href="/how-it-works/">How It Works</a></li>
                    <li><a href="/about-us/">About Us</a></li>
                    <li><a href="/all-our-blog/">Our Blog</a></li>
                    <li><a href="/favourites/">&#9829; My Favourites</a></li>
                </ul>
            </div>

            <div className="footer-section">
                <h4>Destinations</h4>
                <ul>
                    <li><a href="/spain-fractional-ownership-properties/">Spain</a></li>
                    <li><a href="/france-fractional-ownership-properties/">France</a></li>
                    <li><a href="/italy-fractional-ownership-properties/">Italy</a></li>
                    <li><a href="/usa-fractional-ownership-properties/">USA</a></li>
                    <li><a href="/portugal-fractional-ownership-properties/">Portugal</a></li>
                    <li><a href="/austria-fractional-ownership-properties/">Austria</a></li>
                </ul>
            </div>

            <div className="footer-section">
                <h4>Company</h4>
                <ul>
                    <li><a href="/about-us/">About COP</a></li>
                    <li><a href="/how-it-works/">How It Works</a></li>
                    <li><a href="/all-our-blog/">Our Blog</a></li>
                    <li><a href="/contact-us/">Contact</a></li>
                </ul>
            </div>

            <div className="footer-section">
                <h4>Support</h4>
                <ul>
                    <li><a href="/contact-us/">Get in Touch</a></li>
                    <li><a href="/how-it-works/#faq">FAQ</a></li>
                    <li><a href="/contact-us/">Book a Call</a></li>
                    <li><a href="/favourites/">Saved Properties</a></li>
                </ul>
            </div>
        </div>

        <div className="footer-bottom">
            <p className="footer-copyright">&copy; 2026 Co-Ownership Property. All rights reserved.</p>
            <div className="footer-legal">
                <a href="/privacy-policy/">Privacy Policy</a>
                <a href="/terms/">Terms of Use</a>
                <a href="#">Cookie Policy</a>
            </div>
        </div>
    </footer>

    {/* jQuery + Slick (same carousel library as August Collections) */}
    
    

    {/* ===== VANILLA JAVASCRIPT ===== */}
    
    </>
  );
}
