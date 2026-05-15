import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getFavSlugs, onFavsChange } from '@/lib/favs';
import { localeFromPath, t, SUPPORTED_LOCALES, localizedPath, canonicalEnglishKey, PROPERTY_URL_PREFIX } from '@/lib/i18n';

// Per-locale URL prefixes for dynamic-route page families. Used by the
// language switcher to translate the current URL when no static ROUTE_MAP
// entry exists (property/{slug}/, blog/{slug}/, destinationen/{slug}/, etc.).
const DYNAMIC_URL_FAMILIES = [
  {
    family: 'property',
    prefixes: { en: '/property/', es: '/es/propiedades/', fr: '/fr/proprietes/', de: '/de/immobilien/' },
  },
  {
    family: 'blog',
    prefixes: { en: '/blog/', es: '/es/blog/', fr: '/fr/blog/', de: '/de/blog/' },
  },
  {
    family: 'destinations',
    // EN destinations live at root /{slug}/ via pages/[slug].js (handled below
    // via the enFamily flag so it doesn't accidentally match every URL).
    // ES destinations live under /es/destinos/{slug}/ — only a couple exist so far
    // (mallorca, ibiza), every other slug 404s. Same for FR.
    // DE mirrors live at /de/destinationen/{slug}/ for every EN destination.
    prefixes: { en: '/', es: '/es/destinos/', fr: '/fr/destinations/', de: '/de/destinationen/' },
    enFamily: 'root',
  },
];

// Locale homepages — must never be misdetected as a single-segment dynamic-route
// page. Without this guard, the destinations-family `en: '/'` prefix would match
// `/es/` and decide the slug is "es", routing FR/DE links to /fr/destinations/es/
// (404). Block these explicitly.
const LOCALE_ROOT_PATHS = new Set(['/', '/es/', '/fr/', '/de/']);

function detectDynamicFamily(path, currentLocale) {
  if (LOCALE_ROOT_PATHS.has(path)) return null;
  for (const fam of DYNAMIC_URL_FAMILIES) {
    const prefix = fam.prefixes[currentLocale];
    if (!prefix) continue;
    // Match prefix at start; the rest is the slug (+ optional trailing /)
    if (currentLocale === 'en' && fam.family === 'destinations') continue; // EN destinations are root-level, ambiguous
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length).replace(/\/$/, '');
      if (slug && !slug.includes('/')) {
        return { family: fam.family, slug, prefixes: fam.prefixes };
      }
    }
  }
  return null;
}

// Per-locale nav link tables. Slugs intentionally differ per locale (Spanish
// keyword research wants /es/como-funciona/, French wants /fr/comment-ca-marche/,
// etc.). Adding a new locale = add an entry here.
const NAV_LINKS = {
  en: [
    { href: '/',             labelKey: 'nav.home' },
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
    { href: '/es/favoritos/',        labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/es/contacto/',         labelKey: 'nav.contact' },
  ],
  fr: [
    { href: '/fr/',                  labelKey: 'nav.home' },
    { href: '/fr/proprietes/',       labelKey: 'nav.our_homes' },
    { href: '/fr/comment-ca-marche/', labelKey: 'nav.how_it_works' },
    { href: '/fr/a-propos/',         labelKey: 'nav.about_us' },
    { href: '/fr/blog/',             labelKey: 'nav.blog' },
    { href: '/fr/favoris/',          labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/fr/contact/',          labelKey: 'nav.contact' },
  ],
  de: [
    { href: '/de/',                    labelKey: 'nav.home' },
    { href: '/de/immobilien/',         labelKey: 'nav.our_homes' },
    { href: '/de/so-funktionierts/',   labelKey: 'nav.how_it_works' },
    { href: '/de/ueber-uns/',          labelKey: 'nav.about_us' },
    { href: '/de/blog/',               labelKey: 'nav.blog' },
    { href: '/de/favoriten/',          labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
    { href: '/de/kontakt/',            labelKey: 'nav.contact' },
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

        {/* Nav — desktop: absolute centre; mobile: left drawer.
            Language switcher is OUTSIDE this nav so it doesn't bloat the
            centered block and push it into the logo on mid-size screens. */}
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
          {/* Language switcher inside the drawer when mobile menu is open */}
          {menuOpen && <LanguageSwitcher currentLocale={locale} currentPath={path} />}
        </nav>

        {/* Language switcher — desktop: absolute right, hidden on mobile */}
        <LanguageSwitcher currentLocale={locale} currentPath={path} desktopOnly />

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

// Inline SVG flag icons. Tiny, consistent-rendering, no extra deps.
// Each flag is in a 60-wide viewBox so the inline `width` controls its
// rendered size; the wrapper sets that to ~24px for the desktop grid.
const FLAG_SVGS = {
  en: (
    // Union Jack (Great Britain). Standard 60×30 ratio.
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <clipPath id="cop-flag-en-t"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z" /></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#cop-flag-en-t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  es: (
    // Spain — simplified red/yellow/red (drop the coat of arms at this size)
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </svg>
  ),
  fr: (
    // France — tricolore (blue, white, red) vertical
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="40" fill="#002395" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ED2939" />
    </svg>
  ),
  de: (
    // Germany — black, red, yellow horizontal
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="60" height="40" fill="#000" />
      <rect y="13.33" width="60" height="13.33" fill="#DD0000" />
      <rect y="26.67" width="60" height="13.34" fill="#FFCE00" />
    </svg>
  ),
};

const LOCALE_NAMES = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' };

function Flag({ loc }) {
  return <span className="cop-flag">{FLAG_SVGS[loc]}</span>;
}

function LanguageSwitcher({ currentLocale, currentPath, desktopOnly = false }) {
  // For dynamic-route pages (property / blog / destinations) we can build
  // cross-locale URLs from per-locale prefix maps without needing an entry
  // in ROUTE_MAP. Check this first.
  const dyn = detectDynamicFamily(currentPath, currentLocale);

  // Otherwise resolve the canonical English ROUTE_MAP key. We try a reverse
  // lookup first (so /fr/proprietes/ correctly maps to /our-homes), and fall
  // back to a naive prefix strip for any page that lives outside ROUTE_MAP.
  const englishPath = canonicalEnglishKey(currentPath) || stripLocalePrefix(currentPath, currentLocale);

  // Tooltip shown when a target locale has no equivalent page for the user
  // to switch to (e.g. clicking ES on an English-only blog post).
  const NOT_AVAILABLE_LABEL = {
    en: 'Not yet available in English',
    es: 'Aún no disponible en español',
    fr: 'Pas encore disponible en français',
    de: 'Noch nicht auf Deutsch verfügbar',
  };

  function targetForLocale(loc) {
    if (dyn) {
      const prefix = dyn.prefixes[loc];
      if (!prefix) return null;
      // For destinations the EN equivalent is at /{slug}/ (root level) —
      // skip cross-link to EN until we add a wrapper there.
      if (dyn.family === 'destinations' && loc === 'en') return null;
      return `${prefix}${dyn.slug}/`;
    }
    return localizedPath(englishPath, loc);
  }

  return (
    <div className={`cop-lang-switcher${desktopOnly ? ' cop-lang-switcher-desktop' : ''}`} aria-label="Language">
      {SUPPORTED_LOCALES.map((loc) => {
        if (loc === currentLocale) {
          return (
            <span key={loc} className="cop-lang-current" aria-label={LOCALE_NAMES[loc]} aria-current="true">
              <Flag loc={loc} />
            </span>
          );
        }
        const target = targetForLocale(loc);
        if (!target) {
          return (
            <span
              key={loc}
              className="cop-lang-link cop-lang-unavailable"
              title={NOT_AVAILABLE_LABEL[loc]}
              aria-label={LOCALE_NAMES[loc] + ' — ' + NOT_AVAILABLE_LABEL[loc]}
              aria-disabled="true"
            >
              <Flag loc={loc} />
            </span>
          );
        }
        return (
          <a key={loc} href={target} className="cop-lang-link" hrefLang={loc} aria-label={LOCALE_NAMES[loc]} title={LOCALE_NAMES[loc]}>
            <Flag loc={loc} />
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
