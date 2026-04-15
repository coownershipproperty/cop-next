import Head from 'next/head';
import Script from 'next/script';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | Co-Ownership Property</title>
        <meta name="description" content="Speak to the COP team. Questions about fractional ownership? We respond within a few hours — no sales pressure, no obligation." />
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
        <a href="/about-us">About Us</a>
        <a href="/all-our-blog/">Our Blog</a>
        <a href="/favourites" className="cop-nav-favourites">My Favourites</a>
        <a href="/contact" className="cop-nav-active">Contact</a>
    </nav>
    <button className="cop-hamburger" id="cop-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
    </button>
</header>

    {/* HERO */}
    <section className="page-hero">
        <p className="eyebrow">We're Here to Help</p>
        <h1>Get in <em>Touch</em></h1>
        <p className="subtitle">Questions about co-ownership, a specific property, or just want to understand how it all works? We'll give you straight answers — no sales pressure.</p>
    </section>

    {/* TRUST STRIP */}
    <section className="trust-sec">
        <div className="trust-inner">
            <p className="eyebrow" style={{textAlign: 'center'}}>How We Work</p>
            <h2 style={{textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: '0'}}>What to Expect When You Contact Us</h2>
            <div className="trust-grid">
                <div className="trust-card">
                    <div className="trust-icon">&amp;#x2709;</div>
                    <h3>Email Us Directly</h3>
                    <p>Prefer to write? Reach us at<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />We read every message personally.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&amp;#x23F0;</div>
                    <h3>Fast Response</h3>
                    <p>We typically respond within a few hours — often faster. For USA enquiries, please allow for the time difference. We'll always get back to you.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&amp;#x2713;</div>
                    <h3>No Pressure, No Obligation</h3>
                    <p>We ask questions, point you to the right properties, and leave the decision entirely to you. We're independent — not tied to any platform or developer.</p>
                </div>
            </div>
        </div>
    </section>

    {/* EXPERT FORM (shared partial = the main contact form) */}
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

    {/* HELPFUL LINKS */}
    <section className="links-sec">
        <div className="links-inner">
            <p className="eyebrow" style={{textAlign: 'center'}}>Still Researching?</p>
            <h2 style={{textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '0'}}>Not Ready to Get in Touch Yet?</h2>
            <div className="links-grid">
                <a href="/how-it-works/" className="link-card">
                    <span className="link-cat">How It Works</span>
                    <span className="link-title">The buying process, step by step</span>
                    <span className="link-desc">From first enquiry to signed contracts — what happens, in what order, and what you need to prepare.</span>
                    <span className="link-arrow">Read the guide &rarr;</span>
                </a>
                <a href="/how-it-works/#faq" className="link-card">
                    <span className="link-cat">The Comparison</span>
                    <span className="link-title">Co-ownership vs. buying the whole property</span>
                    <span className="link-desc">Usage, costs, appreciation, and exit — laid out side by side without the marketing spin.</span>
                    <span className="link-arrow">See the comparison &rarr;</span>
                </a>
                <a href="/all-our-blog/" className="link-card">
                    <span className="link-cat">Our Blog</span>
                    <span className="link-title">Market insights &amp; buyer guides</span>
                    <span className="link-desc">In-depth articles on destinations, legals, investment returns, and everything a smart buyer needs to know.</span>
                    <span className="link-arrow">Browse articles &rarr;</span>
                </a>
            </div>
        </div>
    </section>

    {/* NEWSLETTER */}
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

    {/* FOOTER */}
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

    

      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}
