import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();
  const path = router.pathname;

  const navLinks = [
    { href: '/',              label: 'Home' },
    { href: '/our-homes',    label: 'Our Homes' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about-us',     label: 'About Us' },
    { href: '/all-our-blog', label: 'Our Blog' },
    { href: '/favourites',   label: 'My Favourites', extra: 'cop-nav-favourites' },
    { href: '/contact',      label: 'Contact' },
  ];

  return (
    <header className="cop-header scrolled" id="cop-header">
      <div className="cop-logo">
        <a href="/" className="cop-logo-link">
          <span className="cop-logo-text">Co-Ownership<br />Property</span>
        </a>
      </div>
      <nav className="cop-nav" id="cop-nav">
        {navLinks.map(({ href, label, extra }) => {
          const isActive = path === href || (href !== '/' && path.startsWith(href));
          const cls = [extra, isActive ? 'cop-nav-active' : ''].filter(Boolean).join(' ') || undefined;
          return <a key={href} href={href} className={cls}>{label}</a>;
        })}
      </nav>
      <button className="cop-hamburger" id="cop-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </header>
  );
}
