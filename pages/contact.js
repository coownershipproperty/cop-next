import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';


export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | Co-Ownership Property</title>
        <meta name="description" content="Speak to the COP team. Questions about fractional ownership? We respond within a few hours — no sales pressure, no obligation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/contact/" />
        <meta property="og:title" content="Contact Co-Ownership Property" />
        <meta property="og:description" content="Questions about fractional ownership? Speak to our team — no sales pressure, no obligation. We respond within a few hours." />
        <meta property="og:url" content="https://co-ownership-property.com/contact/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
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
                    <div className="trust-icon">&#x2709;</div>
                    <h3>Email Us Directly</h3>
                    <p>Prefer to write? Reach us at<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />We read every message personally.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&#x23F0;</div>
                    <h3>Fast Response</h3>
                    <p>We typically respond within a few hours — often faster. For USA enquiries, please allow for the time difference. We'll always get back to you.</p>
                </div>
                <div className="trust-card">
                    <div className="trust-icon">&#x2713;</div>
                    <h3>No Pressure, No Obligation</h3>
                    <p>We ask questions, point you to the right properties, and leave the decision entirely to you. We're independent — not tied to any platform or developer.</p>
                </div>
            </div>
        </div>
    </section>

    {/* EXPERT FORM (shared partial = the main contact form) */}
        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}
    

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
    

    {/* FOOTER */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}