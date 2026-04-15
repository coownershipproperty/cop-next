import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

export default function ContactUs() {
  return (
    <>
      <Head>
        <title>Contact Us | Co-Ownership Property</title>
        <meta name="description" content="Speak to the COP team. Questions about fractional ownership? We respond within a few hours — no sales pressure, no obligation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div dangerouslySetInnerHTML={{__html: bodyHtml}} />
      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}

const bodyHtml = `<!-- HERO -->
    <section class="page-hero">
        <p class="eyebrow">We're Here to Help</p>
        <h1>Get in <em>Touch</em></h1>
        <p class="subtitle">Questions about co-ownership, a specific property, or just want to understand how it all works? We'll give you straight answers — no sales pressure.</p>
    </section>

    <!-- TRUST STRIP -->
    <section class="trust-sec">
        <div class="trust-inner">
            <p class="eyebrow" style="text-align:center;">How We Work</p>
            <h2 style="text-align:center;font-size:clamp(1.8rem,3.5vw,2.4rem);margin-bottom:0;">What to Expect When You Contact Us</h2>
            <div class="trust-grid">
                <div class="trust-card">
                    <div class="trust-icon">&#x2709;</div>
                    <h3>Email Us Directly</h3>
                    <p>Prefer to write? Reach us at<br><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br>We read every message personally.</p>
                </div>
                <div class="trust-card">
                    <div class="trust-icon">&#x23F0;</div>
                    <h3>Fast Response</h3>
                    <p>We typically respond within a few hours — often faster. For USA enquiries, please allow for the time difference. We'll always get back to you.</p>
                </div>
                <div class="trust-card">
                    <div class="trust-icon">&#x2713;</div>
                    <h3>No Pressure, No Obligation</h3>
                    <p>We ask questions, point you to the right properties, and leave the decision entirely to you. We're independent — not tied to any platform or developer.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- EXPERT FORM (shared partial = the main contact form) -->
        <!-- ===== SPEAK TO AN EXPERT (shared partial) ===== -->
    

    <!-- HELPFUL LINKS -->
    <section class="links-sec">
        <div class="links-inner">
            <p class="eyebrow" style="text-align:center;">Still Researching?</p>
            <h2 style="text-align:center;font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:0;">Not Ready to Get in Touch Yet?</h2>
            <div class="links-grid">
                <a href="/how-it-works/" class="link-card">
                    <span class="link-cat">How It Works</span>
                    <span class="link-title">The buying process, step by step</span>
                    <span class="link-desc">From first enquiry to signed contracts — what happens, in what order, and what you need to prepare.</span>
                    <span class="link-arrow">Read the guide &rarr;</span>
                </a>
                <a href="/how-it-works/#faq" class="link-card">
                    <span class="link-cat">The Comparison</span>
                    <span class="link-title">Co-ownership vs. buying the whole property</span>
                    <span class="link-desc">Usage, costs, appreciation, and exit — laid out side by side without the marketing spin.</span>
                    <span class="link-arrow">See the comparison &rarr;</span>
                </a>
                <a href="/all-our-blog/" class="link-card">
                    <span class="link-cat">Our Blog</span>
                    <span class="link-title">Market insights &amp; buyer guides</span>
                    <span class="link-desc">In-depth articles on destinations, legals, investment returns, and everything a smart buyer needs to know.</span>
                    <span class="link-arrow">Browse articles &rarr;</span>
                </a>
            </div>
        </div>
    </section>

    <!-- NEWSLETTER -->
        <!-- ===== NEWSLETTER SIGNUP (shared partial) ===== -->
    

    <!-- FOOTER -->`;
