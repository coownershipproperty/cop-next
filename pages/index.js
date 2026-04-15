import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

// Press logos shown on site
const PRESS = [
  { name: 'Financial Times', src: '/images/press-ft.png' },
  { name: 'Forbes', src: '/images/press-forbes.png' },
  { name: 'Daily Mail', src: '/images/press-dailymail.png' },
  { name: 'The Times', src: '/images/press-times.png' },
  { name: 'Business Insider', src: '/images/press-bi.png' },
  { name: 'Rolling Stone', src: '/images/press-rs.png' },
];

const DESTINATIONS = [
  { name: 'Spain', flag: '🇪🇸', count: '120+', href: '/spain-fractional-ownership-properties' },
  { name: 'France', flag: '🇫🇷', count: '15+', href: '/france-fractional-ownership-properties' },
  { name: 'Italy', flag: '🇮🇹', count: '10+', href: '/italy-fractional-ownership-properties' },
  { name: 'USA', flag: '🇺🇸', count: '160+', href: '/usa-fractional-ownership-properties' },
  { name: 'Portugal', flag: '🇵🇹', count: '5+', href: '/portugal-fractional-ownership-properties' },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', count: '10+', href: '/england-fractional-ownership-properties' },
];

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };
  if (submitted) return <p style={{ color: 'var(--gold)', textAlign: 'center', padding: '1rem' }}>Thank you! We'll be in touch.</p>;
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: 460, margin: '0 auto', flexWrap: 'wrap' }}>
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        style={{ flex: 1, minWidth: 200, padding: '0.85rem 1.2rem', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Nunito Sans, sans-serif', fontSize: '0.85rem', outline: 'none' }}
      />
      <button type="submit" className="btn-gold" style={{ whiteSpace: 'nowrap' }}>Subscribe</button>
    </form>
  );
}

function ExpertForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } catch(err) {}
    setSubmitted(true);
  };
  if (submitted) return <p style={{ color: 'var(--gold)', textAlign: 'center', padding: '2rem' }}>Thank you! We'll be in touch within a few hours.</p>;
  const inputStyle = { width: '100%', padding: '0.8rem', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontFamily: 'Nunito Sans, sans-serif', fontSize: '0.85rem', marginBottom: '1.2rem', outline: 'none' };
  return (
    <form onSubmit={handleSubmit}>
      <input required placeholder="Your name *" value={form.name} onChange={set('name')} style={inputStyle} />
      <input required type="email" placeholder="Email *" value={form.email} onChange={set('email')} style={inputStyle} />
      <input placeholder="Phone" value={form.phone} onChange={set('phone')} style={inputStyle} />
      <textarea placeholder="Any questions about a property?" value={form.message} onChange={set('message')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '0.5rem' }}>Send Enquiry</button>
    </form>
  );
}

export default function Home() {
  return (
    <Layout>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '90vh', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Mare map watermark */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'url(/images/mare-map.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', textAlign: 'center', padding: '4rem 2rem', color: 'white', maxWidth: 700 }}>
          <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Luxury Fractional Ownership</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 1.15, marginBottom: '1.5rem', color: 'white' }}>
            Own the Home You&apos;ve<br />Always <em>Wanted</em>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 520, margin: '0 auto 2.5rem' }}>
            Not timeshare. Real deeded ownership. Luxury second homes across Europe and the USA — at a fraction of the cost.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/our-homes" className="btn-gold">Browse Properties</Link>
            <Link href="/contact" className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Speak to an Expert</Link>
          </div>
        </div>
      </section>

      {/* ── PRESS BAR ── */}
      <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0', overflow: 'hidden' }}>
        <div className="marquee-inner" style={{ display: 'flex', gap: '3rem', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...PRESS, ...PRESS].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DISCOVER THE WORLD (property carousel placeholder) ── */}
      <section style={{ background: 'var(--blue)', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Explore Our Properties</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: 'white', marginBottom: '1rem' }}>
            Discover the World
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '3rem', maxWidth: 600, margin: '0 auto 3rem' }}>
            Browse our curated collection of fractional ownership opportunities across the world&apos;s most desirable destinations.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            {DESTINATIONS.map(d => (
              <Link key={d.href} href={d.href} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '2px',
                fontFamily: 'Nunito Sans, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(201,168,76,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              >
                {d.flag} {d.name}
              </Link>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '3rem', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', fontFamily: 'Playfair Display, serif', color: 'var(--gold)', fontWeight: 700 }}>234+</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Properties Available</div>
            <Link href="/our-homes" className="btn-gold" style={{ display: 'inline-block' }}>Browse All →</Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS PREVIEW ── */}
      <section style={{ background: 'var(--cream)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>The Process</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, marginBottom: '1rem', color: 'var(--blue)' }}>
            Three Steps to Your <em>Second Home</em>
          </h2>
          <div className="gold-divider" style={{ margin: '1.5rem auto 3rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            {[
              { num: '01', title: 'Browse & Choose', desc: 'Explore our curated collection and find the property that speaks to you — from Ibiza villas to Colorado chalets.' },
              { num: '02', title: 'We Handle the Legal', desc: 'Our team manages due diligence, LLC structure, and legal protection. You get real deeded ownership.' },
              { num: '03', title: 'Complete & Enjoy', desc: 'Move in and enjoy ~45 days per year. Professional management handles everything in between.' },
            ].map(step => (
              <div key={step.num} style={{ background: 'white', padding: '2.5rem', borderTop: '3px solid var(--gold)' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 700, color: 'var(--gold)', opacity: 0.3, marginBottom: '1rem' }}>{step.num}</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 500, color: 'var(--blue)', marginBottom: '0.8rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem' }}>
            <Link href="/how-it-works" className="btn-outline" style={{ display: 'inline-block', borderColor: 'var(--blue)', color: 'var(--blue)' }}>Learn More →</Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section style={{ background: 'var(--blue)', padding: '5rem 2rem', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Stay Updated</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 400, color: 'white', marginBottom: '0.5rem' }}>
          New Properties, <em>First</em>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>Join thousands of buyers who get early access to new listings.</p>
        <NewsletterForm />
      </section>

      {/* ── EXPERT FORM ── */}
      <section style={{ background: 'var(--blue)', padding: '0 2rem 5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '3rem' }}>
          <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.8rem', textAlign: 'center' }}>Free Consultation</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 400, color: 'white', textAlign: 'center', marginBottom: '0.5rem' }}>Speak to an Expert</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '2rem' }}>No pressure, no obligation. We respond within a few hours.</p>
          <ExpertForm />
        </div>
      </section>
    </Layout>
  );
}
