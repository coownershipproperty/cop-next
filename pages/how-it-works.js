import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';


export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>Co-Ownership Explained | COP - Fractional Property Ownership</title>
        {hreflangLinks({ englishPath: '/how-it-works' })}
        <meta name="description" content="Learn how fractional co-ownership works. Buy a genuine deeded share in luxury holiday homes across Europe and the USA. Own only what you use, share costs with like-minded co-owners." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/how-it-works/" />
        <meta property="og:title" content="How Co-Ownership Works | Fractional Property Ownership Explained" />
        <meta property="og:description" content="Learn how fractional co-ownership works. Buy a genuine deeded share in luxury holiday homes across Europe and the USA from a fraction of the cost." />
        <meta property="og:url" content="https://co-ownership-property.com/how-it-works/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* ── Schema.org FAQPage + WebPage ────────────────────────────────
            Mirrors the question-then-answer structure of the page so AI
            engines can lift self-contained passages on "what is fractional
            ownership", "how is it different from timeshare", LLC structure,
            scheduling, rental, resale, etc. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": "https://co-ownership-property.com/how-it-works/#webpage",
              "url": "https://co-ownership-property.com/how-it-works/",
              "name": "Co-Ownership Explained | COP - Fractional Property Ownership",
              "description": "Learn how fractional co-ownership works. Buy a genuine deeded share in luxury holiday homes across Europe and the USA. Own only what you use, share costs with like-minded co-owners.",
              "inLanguage": "en",
              "isPartOf": { "@id": "https://co-ownership-property.com/#website" },
              "about": { "@id": "https://co-ownership-property.com/#organization" },
              "mainEntity": { "@id": "https://co-ownership-property.com/how-it-works/#faq" },
              "publisher": { "@id": "https://co-ownership-property.com/#organization" }
            },
            {
              "@type": "FAQPage",
              "@id": "https://co-ownership-property.com/how-it-works/#faq",
              "inLanguage": "en",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is fractional co-ownership and how does it work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fractional co-ownership means buying a legally deeded share — typically 1/8 — of a luxury second home through a property-specific LLC registered in your name. You acquire real equity in a real asset: if the property appreciates, your share appreciates proportionally. A 1/8 share entitles you to approximately 45 days of use per year, a proportional share of any rental income, and 1/8 of the property's value when it sells. Costs are split proportionally among co-owners. Unlike a timeshare, your name sits behind the property deed and you can sell on the open market whenever you choose."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How is co-ownership different from a timeshare?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The difference is fundamental. A timeshare gives you the right to use a property for a fixed period each year — you own time, not real estate. Your name is not on any property deed, the asset does not appreciate, and you are locked into a membership or points system that is notoriously difficult to exit. Co-ownership gives you a genuine, deeded property asset through an LLC. Your name appears on the deed, you share in any capital appreciation, you can sell on the open market, you can gift or pass your share to family, and the booking system is flexible — from as little as 2–3 nights — rather than a fixed week every year."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What does a 1/8 share entitle me to?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each 1/8 share entitles you to approximately 45 days of private use per year — roughly six weeks. The home is yours during those weeks with exclusive access to every bedroom, garden, pool, terrace, and amenity. You can invite friends and family, or allow them to stay independently during your allocated time. Usage is allocated through a rotating calendar so every co-owner gets fair access to peak and off-peak dates over time. The average second-home owner uses their property just 35 days a year, so a 1/8 share already exceeds typical personal use."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the LLC structure and why is it used?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every property on COP is held in a purpose-built LLC (limited-liability company) that owns 100% of the property deed. As a buyer you acquire a legally deeded membership interest in that LLC — and by extension a genuine ownership stake in the property itself. The same structure is used consistently across France, Spain, Italy, Portugal, the USA and Mexico. This structure makes resale straightforward because you transfer LLC shares rather than triggering a full property conveyance, avoiding the notaire and stamp-duty costs of conventional resale. Before purchase you receive the full LLC documentation for review with independent legal counsel."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How is usage time scheduled fairly between co-owners?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Usage is allocated through a clearly defined and fair rotation system. Each 1/8 share entitles you to approximately 45 days per year, structured so all co-owners access high-season and shoulder-season weeks equitably over a multi-year cycle. Most properties use a digital booking platform that lets owners reserve specific dates, swap weeks with other owners, or extend stays where availability permits. The property management company administers the schedule and handles all coordination — owners never need to negotiate directly with each other."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I rent out my unused weeks?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On many of our properties, yes. Unused weeks can be placed into a professionally managed rental programme. The management company handles guest marketing, booking, check-in, housekeeping, and maintenance. Rental income is returned directly to you after the platform fee. In high-demand destinations — the French Riviera, Ibiza, the French Alps, Colorado — rental yields can be strong enough to offset annual running costs significantly. Rental availability varies by location and some areas have local restrictions on short-term lets, so always confirm the rental policy for a specific property before purchase."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who manages the property day-to-day?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every co-ownership property on COP is managed by a dedicated professional property management company. Their remit covers routine maintenance and repairs, professional housekeeping between every stay, pool and garden care, utility management, local tax compliance, and emergency call-out. When you arrive, the home is hotel-ready — fresh linens, stocked essentials, everything in perfect order. The annual service charge — paid at 1/8 of the total — covers management fees, building insurance, local taxes, utility standing charges, and a maintenance reserve fund."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I sell my share when I want to exit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When you decide to exit, a professional resale process is in place. The supported resale process runs through the COP owner network — your fractional share is marketed to an existing audience of qualified prospects already familiar with co-ownership and the LLC structure, and you retain full control over price and timing. Across the COP portfolio the typical timeline from listing to completion is around a month or less — well below the 6–24 months that whole-property resales typically take. Because you are transferring LLC shares rather than real property, exit costs are materially lower than a conventional sale: no full conveyancing fees, no agent percentage on the full property value."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are the running costs of co-ownership?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Running costs are shared proportionally among co-owners. Your annual service charge — paid at 1/8 of the total for a 1/8 share — covers professional property management, building insurance, local property taxes (such as taxe foncière in France or IBI in Spain), utility standing charges, routine maintenance, and a maintenance reserve fund. Many co-owners cover a meaningful portion of their annual service charge through rental income on unused weeks. The exact annual figure varies with property size and location and is disclosed upfront before purchase."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is fractional co-ownership a good investment?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Co-ownership is best understood as a lifestyle investment rather than a pure financial vehicle. You capture full proportional price appreciation — your 1/8 share appreciates at the same percentage rate as the whole property — and prime resort destinations across Europe and the USA have appreciated consistently over the long term, supported by strict planning controls that limit new supply. The capital efficiency of fractional ownership lets you access trophy-address real estate at 1/8 the capital commitment of full ownership while retaining all the investment characteristics: deeded equity, price growth participation, and open-market resale. For most buyers, the primary return is in lifestyle use; capital appreciation is the long-term upside."
                  }
                }
              ]
            },
            {
              "@type": "HowTo",
              "@id": "https://co-ownership-property.com/how-it-works/#howto",
              "name": "How to buy a fractional co-ownership share",
              "description": "The step-by-step process of acquiring a deeded fractional share in a luxury second home through the Co-Ownership Property marketplace.",
              "totalTime": "P6W",
              "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "EUR",
                "minValue": 100000,
                "maxValue": 2000000
              },
              "tool": [
                { "@type": "HowToTool", "name": "Reservation contract" },
                { "@type": "HowToTool", "name": "Cooling-off period waiver (optional)" },
                { "@type": "HowToTool", "name": "Share-transfer documentation (in English)" }
              ],
              "step": [
                {
                  "@type": "HowToStep",
                  "position": 1,
                  "name": "Browse and compare properties",
                  "text": "Start at /our-homes/ to browse 350+ live fractional listings across 30+ destinations. Filter by country, region, share price, and partner operator. Use the comparison pages (/compare/) to evaluate operators side-by-side: Pacaso vs MYNE, MYNE vs Vivla, fractional vs timeshare, fractional vs whole second home.",
                  "url": "https://co-ownership-property.com/our-homes/"
                },
                {
                  "@type": "HowToStep",
                  "position": 2,
                  "name": "Request property details and unlock photos",
                  "text": "On any property page, request exclusive photos and the full property pack. You'll receive the full image gallery and a member of the COP team will be in touch within a few hours to walk you through pricing, the LLC structure, the booking calendar, and any operator-specific nuances.",
                  "url": "https://co-ownership-property.com/our-homes/"
                },
                {
                  "@type": "HowToStep",
                  "position": 3,
                  "name": "Reserve your share",
                  "text": "Sign the reservation contract and pay a small deposit. The deposit is fully refundable during the cooling-off period (typically 14 days in France, similar in other EU jurisdictions). The reservation locks in your specific share number and entry into the LLC.",
                  "url": "https://co-ownership-property.com/buying-a-co-ownership-property-faqs/"
                },
                {
                  "@type": "HowToStep",
                  "position": 4,
                  "name": "Legal due diligence and share-transfer documentation",
                  "text": "The operator's legal team prepares the share-transfer documentation in both English and the local language. You receive the LLC operating agreement, the property deed, the management agreement, and the booking rotation rules. Review with your own counsel if you wish — COP can introduce you to specialist cross-border real estate lawyers.",
                  "url": "https://co-ownership-property.com/buying-a-co-ownership-property-faqs/"
                },
                {
                  "@type": "HowToStep",
                  "position": 5,
                  "name": "Settlement and completion",
                  "text": "On completion (typically 4–8 weeks after reservation for cash buyers; longer if financing is involved), the share is transferred to your name, you receive the keys and booking-system credentials, and the property becomes immediately available for use. You're now a deeded co-owner.",
                  "url": "https://co-ownership-property.com/buying-a-co-ownership-property-faqs/"
                },
                {
                  "@type": "HowToStep",
                  "position": 6,
                  "name": "Use, rent, swap or sell",
                  "text": "Book your weeks through the operator's booking platform. Rent out unused weeks (where the operator permits) for rental income. Swap weeks with other co-owners or other COP properties via the operator's exchange program. When you're ready to exit, list your share through the operator's supported resale process — typical timeline is around a month, well below the 6–24 months whole-property resales typically take.",
                  "url": "https://co-ownership-property.com/staying-in-my-co-ownership-property-faqs/"
                }
              ]
            }
          ]
        }) }} />
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
                    <Image src="https://cdn.prod.website-files.com/63f61b4f9800c52e560f1914/6910dcda781c75aa91ca0cf7_DJI_0957_58_59_60_61.jpeg" alt="Luxury villa with pool in Mouans-Sartoux, Côte d'Azur" fill quality={90} style={{objectFit:'cover'}} sizes="(max-width: 900px) 100vw, 50vw" />
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

            <div className="compare-table-scroll">
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
        </div>
    </section>

    {/* ===== MID-PAGE CTA ===== */}
    <section className="mid-cta">
        <p>Ready to find your second home?</p>
        <div className="mid-cta-buttons">
            <a href="#speak-to-expert" className="btn btn-gold">Speak to an Expert</a>
            <a href="#newsletter" className="btn btn-blue">Join Our Newsletter</a>
        </div>
        <p style={{marginTop: '1.6rem', fontSize: '0.92rem'}}>
            Still researching? Browse our <a href="/faq/">independent buyer&rsquo;s Q&amp;A</a> covering pricing, resale, LLC structure, tax and the difference from timeshare.
        </p>
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
    </>
  );
}
