import Head from 'next/head';
import Script from 'next/script';

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us | Co-Ownership Property</title>
        <meta name="description" content="Meet the team behind Co-Ownership Property. Founded in 2022 by David Olsson, we help smart buyers access luxury second homes through fractional co-ownership." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

    <header className="cop-header scrolled" id="cop-header">
    <div className="cop-logo">
        <a href="/">
            <img src="/wp-content/uploads/MAIN-LOGO-COP.svg" alt="Co-Ownership Property" />
        </a>
    </div>
    <nav className="cop-nav" id="cop-nav">
        <a href="/">Home</a>
        <a href="/our-homes/">Our Homes</a>
        <a href="/how-it-works/">How It Works</a>
        <a href="/about-us" className="cop-nav-active">About Us</a>
        <a href="/all-our-blog/">Our Blog</a>
        <a href="/favourites" className="cop-nav-favourites">My Favourites</a>
        <a href="/contact">Contact</a>
    </nav>
    <button className="cop-hamburger" id="cop-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
    </button>
</header>

    {/* ===== HERO ===== */}
    <section className="page-hero">
        <p className="eyebrow">Our Story</p>
        <h1>About <em>Us</em></h1>
        <p className="subtitle">Meet the team dedicated to making luxury second-home ownership accessible, transparent, and smart.</p>
    </section>

    {/* ===== PRESS BAR ===== */}
    <div className="press-bar" role="region" aria-label="As featured in">
        <div className="press-bar-header"><span className="press-bar-label">As Featured In</span></div>
        <div className="press-marquee-wrap"><div className="press-track-outer">
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
        </div></div>
    </div>

    {/* ===== INTRO ===== */}
    <section className="sec intro-sec">
        <div className="intro-center">
            <p className="eyebrow">Who We Are</p>
            <h2>An Agency for Premium <em>Co-Ownership</em></h2>
            <p>Since 2022, Co-Ownership Property has been dedicated exclusively to premium fractional ownership second homes in the world's most desirable destinations.</p>
            <p>Acting 100% on the buyer's side, we collaborate only with the most reputable, transparent, and professionally managed operators across Europe and the US. We are not tied to any single platform or developer. If a property doesn't meet our standard, it doesn't appear on this site.</p>
        </div>
    </section>

    {/* ===== TEAM ===== */}
    <section className="sec team-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">The Team</p>
            <h2>Meet the People <em>Behind COP</em></h2>

            <div className="team-grid">
                <div className="team-card">
                    <div className="team-photo">
                        <img src="https://co-ownership-property.com/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" loading="lazy" />
                    </div>
                    <h3>David Olsson</h3>
                    <span className="team-role">Founder</span>
                    <p className="team-bio">Over 20 years selling premium ski properties across 40+ French Alpine resorts. David watched the market transform as clients who had once been able to buy were increasingly priced out. He founded COP in 2022 because he believed exceptional properties should be owned by people who love them — not just those who can afford to buy them outright.</p>
                </div>
                <div className="team-card">
                    <div className="team-photo">
                        <img src="https://co-ownership-property.com/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" loading="lazy" />
                    </div>
                    <h3>Dylan Olsson</h3>
                    <span className="team-role">Sales</span>
                    <p className="team-bio">Raised between London and Marbella with roots across four countries, Dylan grew up with an instinctive feel for the international buyer. After graduating in business from the University of Manchester, he set out to bridge the gap between aspiration and reality — making high-end holiday homes accessible to more people through a transparent, client-first approach.</p>
                </div>
                <div className="poppy-card">
                    <div className="team-photo">
                        <img src="https://co-ownership-property.com/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy" loading="lazy" />
                    </div>
                    <div>
                        <h3 style={{color: '#fff'}}>Poppy</h3>
                        <span className="team-role">Head of Security</span>
                        <p className="team-bio">Takes a zero-tolerance approach to squirrels, postmen, and unauthorised cats. Has been known to accept bribes in the form of cheddar cheese or belly rubs.</p>
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
                    <img src="https://co-ownership-property.com/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" alt="Luxury Alpine chalet interior" loading="lazy" />
                </div>
                <div className="story-text">
                    <p className="eyebrow">Why We Started</p>
                    <h2>A Market That Left <em>People Behind</em></h2>
                    <p>David spent over two decades selling premium properties in the French Alps. In the early days, French mortgage rates sat below 2%, terms stretched to 25 years, and Alpine resort prices — while never cheap — still bore a meaningful relationship to Parisian ones. Buying a ski property was a realistic aspiration for a professional family.</p>
                    <p>That world gradually disappeared. Between 2017 and 2022, prices in the most sought-after resorts rose by 30–50%, in some areas overtaking Paris per square metre. The chalet in Meribel, the flat in Chamonix — these had become cash-buyer territory.</p>
                    <blockquote>The clients I had worked with for years still wanted to buy — they just couldn't afford to anymore. They were simply priced out.
                        <span className="quote-attr">David Olsson — Founder</span>
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
                    <p className="eyebrow">The Solution</p>
                    <h2>A Better Way to <em>Own</em></h2>
                    <p>Where a whole Alpine property might now require over &euro;800,000, a fractional share brings genuine ownership within reach from around &euro;100,000. You own a deeded share of a premium property, it appreciates with the market, and you decide when to sell.</p>
                    <p>A single one-eighth share gives you six weeks of use per year — 45 days. The average second-home owner uses their property just 35 days a year, so a fractional share already exceeds typical personal use.</p>
                    <p>And there's nothing to stop you going further: buy two shares in the same property, or combine a share in an Alpine chalet with a share in an Ibiza villa. The properties work independently, the ownership structure is the same, and your calendar is yours to arrange.</p>
                    <blockquote>The average second home sits empty for 330 days a year. A fractional share gives you more time in an exceptional property — at a fraction of the cost.</blockquote>
                </div>
                <div className="story-img">
                    <img src="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" alt="Ibiza villa with pool" loading="lazy" />
                </div>
            </div>
        </div>
    </section>

    {/* ===== MID-PAGE CTA ===== */}
    <section style={{background: 'var(--blue)', padding: '60px 3rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>Ready to find your second home?</p>
        <div style={{display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a href="#speak-to-expert" style={{display: 'inline-block', padding: '14px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'var(--warm-gold)', color: '#fff', textDecoration: 'none', transition: 'background 0.3s'}}>Speak to an Expert</a>
            <a href="#contact" style={{display: 'inline-block', padding: '13px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'all 0.3s'}}>Join Our Newsletter</a>
        </div>
    </section>

    {/* ===== TESTIMONIALS ===== */}
    <section className="sec testi-sec" style={{background: 'var(--cream-bg)'}}>
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">What Our Clients Say</p>
            <h2>Real Owners, Real <em>Stories</em></h2>

            <div className="testi-grid">
                <div className="testi-card">
                    <div className="testi-photo"><img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" loading="lazy" /></div>
                    <div className="testi-name">Astrid</div>
                    <span className="testi-loc">Mougins, South of France</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">From the first stay, everything felt effortless. It's like arriving at your own home with the comfort of a hotel. The beds are made, towels ready — nothing to think about. Every visit starts with calm, not chores. I love it already, and I don't have to worry about a thing.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry &amp; Nicole" loading="lazy" /></div>
                    <div className="testi-name">Harry &amp; Nicole</div>
                    <span className="testi-loc">La Plagne, French Alps</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">Owning a place in the French Alps had always been a dream. Fractional ownership offered the perfect solution — all the benefits of a luxury mountain home without the stress and cost of managing a whole property. Our son can now invite his school friends to ski for half term. It truly made our dream a reality.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><img src="https://co-ownership-property.com/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo &amp; Anne" loading="lazy" /></div>
                    <div className="testi-name">Mateo &amp; Anne</div>
                    <span className="testi-loc">Lake Tahoe, California</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">We've been driving up from LA to Tahoe every summer for years, but couldn't justify a whole house. This ownership model felt like the perfect middle way. We finally own a piece of the land without the guilt of an unused mortgage. Transparent from day one — we couldn't be happier.</p>
                </div>
                <div className="testi-card">
                    <div className="testi-photo"><img src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca-300x300.jpg" alt="Jan &amp; Family" loading="lazy" /></div>
                    <div className="testi-name">Jan &amp; Family</div>
                    <span className="testi-loc">Port d'Andratx, Mallorca</span>
                    <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p className="testi-quote">I sold my French holiday home, took the profit, and used just a quarter of that to buy a much nicer villa. Guilt gone. The villa is stunning, the kids love it, and the remaining weeks are rented out — more than covering the monthly running costs. Highly recommended.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== CTAs ===== */}
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

    {/* ===== FOOTER ===== */}
    <footer>
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

    

      <Script src="/js/about-us.js" strategy="afterInteractive" />
    </>
  );
}
