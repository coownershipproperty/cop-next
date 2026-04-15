import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';


export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>Co-Ownership Explained | COP - Fractional Property Ownership</title>
        <meta name="description" content="Learn how fractional co-ownership works. Buy a genuine deeded share in luxury holiday homes across Europe and the USA. Own only what you use, share costs with like-minded co-owners." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
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
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-times.png" alt="The Times" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-express.png" alt="Express" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width="200" height="50" /></div>
            </div>
            <div className="press-track" aria-hidden="true">
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-times.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-ft.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-dailymail.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-forbes.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-express.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width="200" height="50" /></div>
                <div className="press-logo-item"><img src="https://staging.co-ownership-property.com/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width="200" height="50" /></div>
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
    
        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}
    

    {/* ===== FOOTER ===== */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
    </>
  );
}