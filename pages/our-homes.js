import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

const COUNTRIES = ['All', 'France', 'Spain', 'USA', 'Italy', 'Other'];

export default function OurHomes() {
  const [country, setCountry] = useState('All');

  return (
    <Layout title="All Our Homes" description="Browse our handpicked luxury co-ownership properties across Europe, the USA and beyond.">
      {/* Hero */}
      <section style={{ background: 'var(--blue)', padding: '7rem 2rem 4rem', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Worldwide Collection</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, color: 'white', marginBottom: '1rem' }}>
          All Our Homes
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>
          Handpicked luxury co-ownership properties across Europe, the USA and beyond — find the home that&apos;s right for you.
        </p>
      </section>

      {/* Filter bar */}
      <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.2rem 2rem' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Country</span>
          {COUNTRIES.map(c => (
            <button key={c} onClick={() => setCountry(c)} style={{
              padding: '0.4rem 1rem',
              background: country === c ? 'var(--blue)' : 'transparent',
              color: country === c ? 'white' : 'var(--muted)',
              border: '1px solid ' + (country === c ? 'var(--blue)' : 'var(--border)'),
              fontFamily: 'Nunito Sans, sans-serif',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>{c}</button>
          ))}
        </div>
      </section>

      {/* Properties grid - will be populated from Sheet */}
      <section style={{ background: 'var(--cream)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            234+ properties available — loading from our portfolio...
          </p>
          {/* Property cards will render here once data layer is connected */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {/* Placeholder */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'white', height: 380, opacity: 0.4, animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 240, background: '#e0dcd4' }} />
                <div style={{ padding: '1.2rem' }}>
                  <div style={{ height: 12, background: '#e0dcd4', width: '60%', marginBottom: '0.8rem' }} />
                  <div style={{ height: 20, background: '#e0dcd4', width: '80%', marginBottom: '0.5rem' }} />
                  <div style={{ height: 16, background: '#e0dcd4', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.6} }`}</style>
    </Layout>
  );
}
