import Head from 'next/head';
import Script from 'next/script';

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>Co-Ownership Explained | COP - Fractional Property Ownership</title>
        <meta name="description" content="Learn how fractional co-ownership works. Buy a genuine deeded share in luxury holiday homes across Europe and the USA. Own only what you use, share costs with like-minded co-owners." />
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
        <a href="/how-it-works/" className="cop-nav-active">How It Works</a>
        <a href="/about-us">About Us</a>
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
        <p className="eyebrow">Co-Ownership Explained</p>
        <h1>How It <em>Works</em></h1>
        <p className="subtitle">Own a share of a luxury holiday home. Use it for weeks each year. Split every cost. Keep every memory.</p>
    </section>

    {/* ===== AS FEATURED IN (carousel from homepage) ===== */}
    <div className="press-bar" role="region" aria-label="As featured in">
        <div className="press-bar-header">
            <span className="press-bar-label">As Featured In</span>
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
                    <img src="https://co-ownership-property.com/wp-content/uploads/2026/01/Fractional-ownership-in-Menaggio-3.jpeg" alt="Luxury lakeside property in Menaggio, Italy" />
                </div>
                <div className="intro-text">
                    <p className="eyebrow">The Smart Way to Own</p>
                    <h2>Own a Home Worth <em>8 Times</em> Your Budget</h2>
                    <p className="highlight">A luxury holiday home that would cost you millions to buy alone becomes yours for a fraction — with all the same rights, deeds, and appreciation.</p>
                    <p>With co-ownership, you purchase a genuine, deeded freehold share — typically 1/8 — in a premium property. It's registered in your name through a property-specific LLC. You use the home for around 45 days a year, and every cost is shared proportionally among co-owners.</p>
                    <p>This isn't timeshare. There are no points, no clubs, no catch. It's real property ownership — the kind you can resell, pass to your children, and watch appreciate in value.</p>
                    <div className="intro-stats">
                        <div>
                            <div className="intro-stat-num">1/8</div>
                            <div className="intro-stat-label">Typical Share</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">~45</div>
                            <div className="intro-stat-label">Days / Year</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">360+</div>
                            <div className="intro-stat-label">Properties</div>
                        </div>
                        <div>
                            <div className="intro-stat-num">11</div>
                            <div className="intro-stat-label">Countries</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 1b. A TRUSTED TRADITION ===== */}
    <section className="sec heritage-sec">
        <div className="heritage-inner">
            <p className="eyebrow">A Trusted Tradition</p>
            <h2>This Isn't <em>New</em></h2>
            <p>Families have shared holiday homes for centuries. Grandparents passing a villa down to three children. Cousins inheriting a farmhouse in Tuscany. Friends going in together on a chalet in the Alps. Co-ownership is one of the oldest and most natural forms of property holding in Europe.</p>
            <blockquote>Your grandparents did this. They just didn't have an LLC for it.</blockquote>
            <p>In France, joint property ownership — known as "indivision" — is one of the most common ways families hold property. Across Italy, Spain, and Austria, shared ownership of inherited homes has been the norm for generations. What's changed isn't the concept — it's the infrastructure.</p>
            <p>Today, each property is held in its own LLC with a formal co-ownership agreement, professional management, and fair scheduling. You never need to coordinate with other co-owners directly. Everything is handled for you. No awkward conversations, no disputes, no friction.</p>
        </div>
    </section>

    {/* ===== 3. WHAT YOU GET ===== */}
    <section className="sec benefits-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">What You Get</p>
            <h2>More Than Just a <em>Holiday Home</em></h2>
            <p className="lead" style={{margin: '0 auto'}}>Every property comes with professional management, legal protection, and flexibility built in.</p>

            <div className="benefits-grid">
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f3e0;</div>
                    <h3>Real Property Ownership</h3>
                    <p>A deeded freehold share registered in your name through a property-specific LLC. Not a contract — a genuine asset you own.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f4c8;</div>
                    <h3>Capital Appreciation</h3>
                    <p>Your share appreciates in value just like any property investment. Premium locations in Europe and the USA tend to grow consistently over time.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f4b0;</div>
                    <h3>Rental Income</h3>
                    <p>Not using your allocated weeks? Many of our properties allow you to rent out your unused time and earn income while you're away.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f504;</div>
                    <h3>Home Swapping</h3>
                    <p>Most properties in our portfolio offer a home exchange system. Fancy a different destination this year? Swap your stay with another co-owner.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f5d3;</div>
                    <h3>Fair Scheduling</h3>
                    <p>A rotating calendar ensures every co-owner gets peak and off-peak dates. Summer, Christmas, Easter — everyone takes turns fairly.</p>
                </div>
                <div className="benefit-card">
                    <div className="benefit-icon">&#x1f6e0;</div>
                    <h3>Fully Managed</h3>
                    <p>Professional property management handles maintenance, repairs, cleaning, and local taxes. You show up, enjoy, and leave — everything else is taken care of.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 4. COMPARISON ===== */}
    <section className="sec compare-sec">
        <div className="sec-inner">
            <p className="eyebrow">Know the Difference</p>
            <h2>Co-Ownership vs. the <em>Alternatives</em></h2>
            <p className="lead">Not all second-home options are equal. Here's how co-ownership compares.</p>

            <table className="compare-table">
                <thead>
                    <tr>
                        <th></th>
                        <th className="compare-highlight">Co-Ownership</th>
                        <th>Sole Ownership</th>
                        <th>Timeshare</th>
                        <th>Holiday Rentals</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Real property deed</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Yes — LLC share</td>
                        <td><span className="check">&#10003;</span> Yes</td>
                        <td><span className="cross">&#10007;</span> No — usage contract</td>
                        <td><span className="cross">&#10007;</span> No</td>
                    </tr>
                    <tr>
                        <td>Capital appreciation</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Full benefit</td>
                        <td><span className="check">&#10003;</span> Full benefit</td>
                        <td><span className="cross">&#10007;</span> Typically depreciates</td>
                        <td><span className="cross">&#10007;</span> None</td>
                    </tr>
                    <tr>
                        <td>Upfront cost</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> 1/8 of full price</td>
                        <td><span className="cross">&#10007;</span> 100% of full price</td>
                        <td><span className="partial">~</span> Varies widely</td>
                        <td><span className="check">&#10003;</span> None</td>
                    </tr>
                    <tr>
                        <td>Running costs</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Split 1/8</td>
                        <td><span className="cross">&#10007;</span> 100% on you</td>
                        <td><span className="cross">&#10007;</span> Annual fees regardless</td>
                        <td><span className="partial">~</span> Per-stay pricing</td>
                    </tr>
                    <tr>
                        <td>Resell freely</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Open market</td>
                        <td><span className="check">&#10003;</span> Open market</td>
                        <td><span className="cross">&#10007;</span> Extremely difficult</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>Pass to children</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Yes</td>
                        <td><span className="check">&#10003;</span> Yes</td>
                        <td><span className="cross">&#10007;</span> Usually non-transferable</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>Rental income</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> On most properties</td>
                        <td><span className="check">&#10003;</span> Yes</td>
                        <td><span className="cross">&#10007;</span> Rarely</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>Professional management</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> Included</td>
                        <td><span className="cross">&#10007;</span> You arrange it</td>
                        <td><span className="partial">~</span> Resort-managed</td>
                        <td>N/A</td>
                    </tr>
                    <tr>
                        <td>Guaranteed availability</td>
                        <td className="compare-highlight"><span className="check">&#10003;</span> ~45 days / year</td>
                        <td><span className="check">&#10003;</span> 365 days</td>
                        <td><span className="partial">~</span> Often restricted</td>
                        <td><span className="cross">&#10007;</span> Subject to booking</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    {/* ===== MID-PAGE CTA ===== */}
    <section className="mid-cta">
        <p>Ready to find your second home?</p>
        <div className="mid-cta-buttons">
            <a href="#speak-to-expert" className="btn btn-gold">Speak to an Expert</a>
            <a href="#contact" className="btn btn-outline">Join Our Newsletter</a>
        </div>
    </section>

    {/* ===== 2. HOW THE LLC MODEL WORKS ===== */}
    <section className="sec model-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">The Process</p>
            <h2>Four Steps to Your <em>Second Home</em></h2>
            <p className="lead" style={{margin: '0 auto'}}>Each property is held in its own LLC. You buy shares in that LLC — giving you genuine, registered ownership with full legal protection.</p>

            <div className="model-flow">
                <div className="model-step">
                    <div className="model-num">1</div>
                    <h3>Browse &amp; Choose</h3>
                    <p>Explore 360+ curated luxury properties. Filter by destination, lifestyle, budget, and share size.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">2</div>
                    <h3>We Handle the Legal</h3>
                    <p>Independent solicitors handle all conveyancing. A co-ownership agreement is drawn up covering schedules, costs, resale rights, and your protection.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">3</div>
                    <h3>Purchase Your Share</h3>
                    <p>Sign the deed, register your share in the property LLC, and receive your ownership certificate. Most homes are move-in ready.</p>
                </div>
                <div className="model-step">
                    <div className="model-num">4</div>
                    <h3>Enjoy &amp; Earn</h3>
                    <p>Start using your home immediately. A fair rotation calendar ensures everyone gets peak dates. Rent out unused weeks for income.</p>
                </div>
            </div>
        </div>
    </section>

    {/* ===== 6. FAQ ===== */}
    <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
            <p className="eyebrow">Common Questions</p>
            <h2>Frequently Asked <em>Questions</em></h2>
        </div>
        <ul className="faq-list">
            <li className="faq-item"><details><summary><h3>What is fractional co-ownership?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Fractional co-ownership is the purchase of a deeded freehold share in a property — typically 1/8 or 1/4. You own your share outright, registered through a property-specific LLC. You can use the property for your allocated time each year (usually 45–90 days), resell your share on the open market, or pass it to your children. It's genuine property ownership — not a rental scheme, club membership, or timeshare.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>How is it different from timeshare?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Fundamentally different. Co-ownership gives you a registered deed — real property that appreciates in value. Timeshare is a usage contract that typically depreciates. You can resell a co-ownership share on the open market; timeshare resales are notoriously difficult. Co-ownership costs are proportional and transparent; timeshare fees continue regardless of whether you use the property.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>What is the LLC structure?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Each property is held in its own dedicated LLC (Limited Liability Company). When you buy a share, you purchase membership units in that LLC — giving you legal ownership of the property proportional to your share size. This structure provides liability protection, simplifies resale, and ensures clean legal separation between co-owners.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>How much time can I use the property each year?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Usage depends on your share size. A 1/8 share gives you approximately 45 days per year (6 weeks). A 1/4 share provides about 90 days (roughly 3 months). A fair rotation calendar ensures equal distribution of peak and off-peak dates across all co-owners — everyone gets summer weeks, Christmas, and Easter over time.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Can I sell my share?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Yes. You own a deeded share, so you can resell it on the open market at any time — subject to a right-of-first-refusal clause for your co-owners. Resale is straightforward and shares in premium locations tend to appreciate in value over time.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Can I earn rental income from my share?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>On many of our properties, yes. If you're not using your allocated weeks, you can rent them out and earn income. The property management team can handle the rental process on your behalf. Availability varies by property — ask us for details on specific listings.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>What about home swapping?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Most properties in our portfolio offer a home exchange system. If you'd like to spend your allocated time at a different destination, you can arrange a swap with a co-owner at another property. It's a great way to explore different locations without additional cost.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>What costs are shared among owners?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>All running costs are divided proportionally: property taxes, insurance, utilities, maintenance, repairs, cleaning, and professional property management. A co-ownership agreement specifies exactly how costs are handled. Many properties come fully furnished and renovated, with furnishing costs included in the share price.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Are there legal restrictions on usage?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Non-residents abroad face usage limits: typically 180 days minus one day before triggering tax residency. Post-Brexit, UK citizens can spend 90 days per 180-day rolling period across the entire EU. A 1/8 or 1/4 share fits comfortably within these limits. Always consult your tax advisor about your personal situation.</p></div></details></li>
            <li className="faq-item"><details><summary><h3>Can I transfer my share to family?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Yes. Your deeded share is a genuine asset you can pass to your children or heirs — just like any property. Many families own co-ownership shares together across generations. The LLC structure makes transfers straightforward.</p></div></details></li>
        </ul>

        
    </section>

    {/* ===== CTAs (shared partials) ===== */}
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

    

      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
    </>
  );
}
