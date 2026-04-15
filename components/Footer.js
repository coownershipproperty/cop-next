import Link from 'next/link';

const DESTINATIONS = [
  { label: 'Spain',       href: '/spain-fractional-ownership-properties' },
  { label: 'France',      href: '/france-fractional-ownership-properties' },
  { label: 'Italy',       href: '/italy-fractional-ownership-properties' },
  { label: 'USA',         href: '/usa-fractional-ownership-properties' },
  { label: 'Portugal',    href: '/portugal-fractional-ownership-properties' },
  { label: 'Austria',     href: '/austria-fractional-ownership-properties' },
  { label: 'England',     href: '/england-fractional-ownership-properties' },
];

const COMPANY = [
  { label: 'Our Homes',    href: '/our-homes' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About Us',     href: '/about-us' },
  { label: 'Our Blog',     href: '/all-our-blog' },
  { label: 'Contact',      href: '/contact' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#2C4A5E', color: 'white', padding: '4rem 2rem 2rem' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>COP</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>CO-OWNERSHIP PROPERTIES</div>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              The independent guide to luxury fractional property ownership across Europe and the USA.
            </p>
          </div>

          {/* Destinations */}
          <div>
            <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.2rem' }}>Destinations</h4>
            {DESTINATIONS.map(({ label, href }) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='var(--gold)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.7)'}
              >{label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.2rem' }}>Company</h4>
            {COMPANY.map(({ label, href }) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='var(--gold)'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.7)'}
              >{label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.2rem' }}>Get In Touch</h4>
            <a href="mailto:info@co-ownership-property.com" style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.6rem' }}>
              info@co-ownership-property.com
            </a>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              No pressure, no obligation. We respond within a few hours.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          © {new Date().getFullYear()} Co-Ownership Property. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
