import Layout from '../components/Layout';
import Link from 'next/link';

const TEAM = [
  {
    name: 'David Olsson',
    role: 'Founder',
    bio: "David founded Co-Ownership Property after watching clients repeatedly priced out of the second-home market. Having seen firsthand how the fractional model transforms access to luxury property, he set out to build the most trusted independent marketplace in Europe.",
  },
  {
    name: 'Dylan Olsson',
    role: 'Sales',
    bio: "Dylan leads client relationships and works directly with buyers from initial enquiry through to completion. His focus is on matching the right family to the right property — never rushing, never pressuring.",
  },
];

export default function AboutUs() {
  return (
    <Layout title="About Us" description="The independent marketplace for luxury fractional property ownership. Meet the team behind Co-Ownership Property.">
      {/* Hero */}
      <section style={{ background: 'var(--blue)', padding: '7rem 2rem 4rem', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>The Team</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, color: 'white', marginBottom: '1rem' }}>
          About <em>Us</em>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto' }}>
          An independent agency for premium co-ownership — 100% on the buyer&apos;s side.
        </p>
      </section>

      {/* Intro */}
      <section style={{ background: 'var(--cream)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Founded 2022</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, color: 'var(--blue)', marginBottom: '1.5rem' }}>
            An Agency for Premium Co-Ownership
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, fontSize: '1rem', marginBottom: '1.2rem' }}>
            We started Co-Ownership Property because we kept seeing the same problem: clients who wanted a luxury second home in France, Spain, or Italy — but couldn&apos;t justify paying full price for a home they&apos;d use a few weeks a year.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, fontSize: '1rem' }}>
            We&apos;re 100% independent. We&apos;re not tied to any platform or developer — which means we can give you completely honest advice about which co-ownership options are right for you and which to avoid.
          </p>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: 'var(--blue)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.8rem' }}>The People</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 400, color: 'white' }}>Meet the Team</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {TEAM.map(person => (
              <div key={person.name} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '2.5rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '2px solid var(--gold)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--gold)' }}>{person.name[0]}</span>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: 'white', marginBottom: '0.3rem' }}>{person.name}</h3>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>{person.role}</div>
                <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontSize: '0.88rem' }}>{person.bio}</p>
              </div>
            ))}
          </div>
          {/* Poppy */}
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: 'var(--gold)' }}>P</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'white', marginBottom: '0.2rem' }}>Poppy</h3>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.4rem' }}>Head of Security</div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>Keeps the office safe and morale high. Non-negotiable presence at all strategy meetings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section style={{ background: 'var(--cream)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem', textAlign: 'center' }}>A Market That Left People Behind</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--blue)', marginBottom: '1.5rem', textAlign: 'center' }}>Our Story</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            David was working with clients who wanted a second home in southern France or the Balearic Islands. They could easily afford the annual running costs — but the purchase price of a home they&apos;d use 30-40 days a year simply didn&apos;t make financial sense.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            The fractional model already existed — but it was fragmented, confusing, and almost impossible to navigate independently. Most platforms were tied to specific developers with commercial incentives. Independent advice was nowhere to be found.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
            So we built it. A genuinely independent marketplace — one that works for buyers, not sellers.
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--blue)', padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 400, color: 'white', marginBottom: '1.5rem' }}>Get in Touch</h2>
        <Link href="/contact" className="btn-gold">Contact Us</Link>
      </section>
    </Layout>
  );
}
