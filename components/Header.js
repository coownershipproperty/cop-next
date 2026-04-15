import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const NAV = [
  { label: 'Home',        href: '/' },
  { label: 'Our Homes',   href: '/our-homes' },
  { label: 'How It Works',href: '/how-it-works' },
  { label: 'About Us',    href: '/about-us' },
  { label: 'Our Blog',    href: '/all-our-blog' },
  { label: '♥ My Favourites', href: '/favourites' },
  { label: 'Contact',     href: '/contact' },
];

export default function Header() {
  const { pathname } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'white',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '80px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--blue)' }}>COP</span>
          <span style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: '0.5rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '1px' }}>CO-OWNERSHIP PROPERTIES</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '1.8rem', alignItems: 'center' }} className="desktop-nav">
          {NAV.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                fontFamily: 'Nunito Sans, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: active ? 'var(--blue)' : 'var(--muted)',
                borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'color 0.2s',
              }}>{label}</Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <div style={{ width: 24, height: 2, background: 'var(--blue)', margin: '5px 0' }} />
          <div style={{ width: 24, height: 2, background: 'var(--blue)', margin: '5px 0' }} />
          <div style={{ width: 24, height: 2, background: 'var(--blue)', margin: '5px 0' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'white', borderTop: '1px solid var(--border)',
          padding: '1rem 2rem 1.5rem',
        }}>
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '0.7rem 0',
                fontFamily: 'Nunito Sans, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: pathname === href ? 'var(--gold)' : 'var(--text)',
                borderBottom: '1px solid var(--border)',
              }}
            >{label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
