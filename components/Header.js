import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { getFavSlugs, onFavsChange } from '@/lib/favs';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
];

export default function Header() {
  const router = useRouter();
  const path = router.pathname;
  const locale = router.locale || 'en';
  const [menuOpen, setMenuOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Hydrate favourites count and keep it live
  useEffect(() => {
    setFavCount(getFavSlugs().length);
    return onFavsChange((slugs) => setFavCount(slugs.length));
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const switchLocale = (code) => {
    setLangOpen(false);
    router.push(router.asPath, router.asPath, { locale: code });
  };

  const navLinks = [
    { href: '/',              label: 'Home' },
    { href: '/our-homes',    label: 'Our Homes' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about-us',     label: 'About Us' },
    { href: '/all-our-blog', label: 'Our Blog' },
    { href: '/favourites',   label: 'My Favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/contact',      label: 'Contact' },
  ];

  return (
    <>
      <header className="cop-header scrolled" id="cop-header">
        {/* Hamburger — left on mobile */}
        <button
          className={`cop-hamburger${menuOpen ? ' open' : ''}`}
          id="cop-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span></span><span></span><span></span>
        </button>

        {/* Logo — centred on mobile via CSS */}
        <div className="cop-logo">
          <a href="/" className="cop-logo-link">
            <img src="/images/cop-logo.svg" alt="Co-Ownership Property" className="logo-dark" />
          </a>
        </div>

        {/* Language switcher */}
        <div className="cop-lang" ref={langRef}>
          <button
            className="cop-lang-toggle"
            aria-expanded={langOpen}
            aria-label="Select language"
            onClick={() => setLangOpen((o) => !o)}
          >
            {LANGUAGES.find((l) => l.code === locale)?.label ?? 'EN'}
            <span className="cop-lang-arrow" aria-hidden="true">▾</span>
          </button>
          {langOpen && (
            <ul className="cop-lang-dropdown" role="listbox">
              {LANGUAGES.map((lang) => (
                <li key={lang.code} role="option" aria-selected={lang.code === locale}>
                  <button
                    className={lang.code === locale ? 'active' : ''}
                    onClick={() => switchLocale(lang.code)}
                  >
                    <span className="cop-lang-code">{lang.label}</span>
                    <span className="cop-lang-name">{lang.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invisible spacer keeps logo centred on mobile */}
        <div className="cop-header-spacer" aria-hidden="true"></div>

        {/* Nav — desktop: absolute centre; mobile: left drawer */}
        <nav className={`cop-nav${menuOpen ? ' active' : ''}`} id="cop-nav">
          {navLinks.map(({ href, label, extra, badge }) => {
            const isActive = path === href || (href !== '/' && path.startsWith(href));
            const cls = [extra, isActive ? 'cop-nav-active' : ''].filter(Boolean).join(' ') || undefined;
            return (
              <a key={href} href={href} className={cls} onClick={() => setMenuOpen(false)}>
                {label}
                {badge && favCount > 0 && (
                  <span className="cop-fav-badge">{favCount}</span>
                )}
              </a>
            );
          })}
        </nav>
      </header>

      {/* Dark overlay behind drawer — tap to close */}
      {menuOpen && (
        <div
          className="cop-nav-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
