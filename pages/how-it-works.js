import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

const FAQ = [
  { q: "What exactly is co-ownership?", a: "Co-ownership means you own a legal share of a property — typically 1/8 — giving you roughly 45 days per year. You own real property deeds, not points or timeshare weeks. Each property is held in its own LLC, so your investment is protected." },
  { q: "Is this the same as timeshare?", a: "No — completely different. Timeshare gives you the right to use a property but you own nothing. Co-ownership gives you deeded ownership of a fraction of the property. You can sell your share, pass it on, or even use it as collateral." },
  { q: "How does the scheduling work?", a: "Each co-owner gets approximately 45 days per year. Scheduling is managed through a fair, rotating system. You book your preferred dates through our management platform, with priority rotating each year." },
  { q: "Who manages the property?", a: "A professional property management company handles everything — maintenance, cleaning, repairs, and day-to-day operations. You never have to deal with other co-owners directly." },
  { q: "What is the LLC structure?", a: "Each property is held in its own LLC (Limited Liability Company). You buy shares in that LLC, giving you legal ownership while protecting your personal assets. The structure is regulated, transparent, and designed specifically for co-ownership." },
  { q: "Can I sell my share?", a: "Yes. Your share is a real asset you own outright. You can sell it at any time on the open market, often at a profit as property values appreciate." },
];

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);
  return (
    <Layout title="How It Works" description="Understand exactly how luxury fractional co-ownership works — from the LLC structure to scheduling and management.">
      {/* Hero */}
      <section style={{ background: 'var(--blue)', padding: '7rem 2rem 4rem', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>The Model</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, color: 'white', marginBottom: '1rem' }}>
          How It <em>Works</em>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto' }}>
          Not timeshare. Real deeded ownership — at a fraction of the cost.
        </p>
      </section>

      {/* Intro */}
      <section style={{ background: 'var(--cream)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Own a Home Worth 8× Your Budget</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, color: 'var(--blue)', marginBottom: '1.5rem' }}>
            The Smart Way to Own
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, fontSize: '1rem', marginBottom: '1.2rem' }}>
            Co-ownership lets you buy a 1/8 share of a luxury property, giving you around 45 days per year for just a fraction of the full purchase price. The home is professionally managed, fully furnished, and ready the moment you arrive.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, fontSize: '1rem' }}>
            Each property is held in its own LLC structure — the same legal framework used by institutional investors worldwide. You own a real asset. You can sell it, pass it on, or watch it appreciate.
          </p>
        </div>
      </section>

      {/* 3 Steps */}
      <section style={{ background: 'white', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="eyebrow" style={{ marginBottom: '1rem' }}>The Process</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--blue)' }}>Three Steps to Your Second Home</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              { num: '01', title: 'Browse & Choose', desc: 'Explore our curated portfolio across 11 countries. Every property is pre-vetted for quality, location, and legal clarity. Find the one that feels like yours.' },
              { num: '02', title: 'We Handle the Legal', desc: 'Independent solicitors manage conveyancing, due diligence, and the LLC formation. We guide you through every step — typically 4-8 weeks from offer to ownership.' },
              { num: '03', title: 'Complete & Enjoy', desc: 'Arrive to a professionally managed, fully furnished home. Book your ~45 days per year through our scheduling platform. The rest takes care of itself.' },
            ].map(step => (
              <div key={step.num} style={{ padding: '2.5rem', borderTop: '3px solid var(--gold)', background: 'var(--cream)' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3.5rem', fontWeight: 700, color: 'var(--gold)', opacity: 0.25, lineHeight: 1 }}>{step.num}</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--blue)', margin: '1rem 0 0.8rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.9rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--cream)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="eyebrow" style={{ marginBottom: '0.8rem' }}>Common Questions</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 400, color: 'var(--blue)' }}>Frequently Asked Questions</h2>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: '100%', textAlign: 'left', padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 500, color: 'var(--blue)'
              }}>
                <span>{item.q}</span>
                <span style={{ color: 'var(--gold)', fontSize: '1.3rem', lineHeight: 1 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '0.9rem', paddingBottom: '1.5rem' }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--blue)', padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 400, color: 'white', marginBottom: '1rem' }}>Ready to find your second home?</h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/our-homes" className="btn-gold">Browse Properties</Link>
          <Link href="/contact" className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>Speak to an Expert</Link>
        </div>
      </section>
    </Layout>
  );
}
