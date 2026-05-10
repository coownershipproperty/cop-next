import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getFavSlugs, onFavsChange } from '@/lib/favs';
import { localeFromPath, t, SUPPORTED_LOCALES, localizedPath } from '@/lib/i18n';

// Per-locale nav link tables. Slugs intentionally differ per locale (Spanish
// keyword research wants /es/como-funciona/, French wants /fr/comment-ca-marche/,
// etc.). Adding a new locale = add an entry here.
const NAV_LINKS = {
  en: [
    { href: '/',              labelKey: 'nav.home' },
    { href: '/our-homes',    labelKey: 'nav.our_homes' },
    { href: '/how-it-works', labelKey: 'nav.how_it_works' },
    { href: '/about-us',     labelKey: 'nav.about_us' },
    { href: '/all-our-blog', labelKey: 'nav.blog' },
    { href: '/favourites',   labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/contact',      labelKey: 'nav.contact' },
  ],
  es: [
    { href: '/es/',                  labelKey: 'nav.home' },
    { href: '/es/propiedades/',      labelKey: 'nav.our_homes' },
    { href: '/es/como-funciona/',    labelKey: 'nav.how_it_works' },
    { href: '/es/quienes-somos/',    labelKey: 'nav.about_us' },
    { href: '/es/blog/',             labelKey: 'nav.blog' },
    { href: '/favourites',           labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/es/contacto/',         labelKey: 'nav.contact' },
  ],
  fr: [
    { href: '/fr/',                  labelKey: 'nav.home' },
    { href: '/fr/proprietes/',       labelKey: 'nav.our_homes' },
    { href: '/fr/comment-ca-marche/', labelKey: 'nav.how_it_works' },
    { href: '/fr/a-propos/',         labelKey: 'nav.about_us' },
    { href: '/fr/blog/',             labelKey: 'nav.blog' },
    { href: '/favourites',           labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/fr/contact/',          labelKey: 'nav.contact' },
  ],
};

export default function Header() {
  const router = useRouter();
  const path = router.asPath || router.pathname;
  const locale = localeFromPath(path);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);

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

  const navLinks = NAV_LINKS[locale] || NAV_LINKS.en;
  const homeHref = locale === 'en' ? '/' : `/${locale}/`;

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
          <a href={homeHref} className="cop-logo-link">
            <img src="/images/cop-logo.svg" alt={t('site.brand', locale)} className="logo-dark" />
          </a>
        </div>

        {/* Invisible spacer keeps logo centred on mobile */}
        <div className="cop-header-spacer" aria-hidden="true"></div>

        {/* Nav — desktop: absolute centre; mobile: left drawer */}
        <nav className={`cop-nav${menuOpen ? ' active' : ''}`} id="cop-nav">
          {navLinks.map(({ href, labelKey, extra, badge }) => {
            const isActive = path === href || (href !== homeHref && path.startsWith(href.replace(/\/$/, '')));
            const cls = [extra, isActive ? 'cop-nav-active' : ''].filter(Boolean).join(' ') || undefined;
            return (
              <a key={href} href={href} className={cls} onClick={() => setMenuOpen(false)}>
                {t(labelKey, locale)}
                {badge && favCount > 0 && (
                  <span className="cop-fav-badge">{favCount}</span>
                )}
              </a>
            );
          })}

          {/* Language switcher — minimal, low-prominence by design */}
          <LanguageSwitcher currentLocale={locale} currentPath={path} />
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

function LanguageSwitcher({ currentLocale, currentPath }) {
  // Strip locale prefix to get canonical English path for ROUTE_MAP lookup.
  const englishPath = stripLocalePrefix(currentPath, currentLocale);

  return (
    <div className="cop-lang-switcher" aria-label="Language">
      {SUPPORTED_LOCALES.map((loc) => {
        if (loc === currentLocale) {
          return <span key={loc} className="cop-lang-current">{loc.toUpperCase()}</span>;
        }
        // Try to find the equivalent localised path; fall back to locale home.
        const target = localizedPath(englishPath, loc) || (loc === 'en' ? '/' : `/${loc}/`);
        return (
          <a key={loc} href={target} className="cop-lang-link" hrefLang={loc}>
            {loc.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}

function stripLocalePrefix(path, locale) {
  if (locale === 'en') return path;
  if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1) || '/';
  if (path === `/${locale}`) return '/';
  return path;
}
