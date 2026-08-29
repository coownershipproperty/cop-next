import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getFavSlugs, onFavsChange } from '@/lib/favs';
import { localeFromPath, t, SUPPORTED_LOCALES, localizedPath, canonicalEnglishKey, PROPERTY_URL_PREFIX,
         destinationAvailableIn, DYNAMIC_URL_FAMILIES, LOCALE_ROOT_PATHS, LOCALE_NAMES, NOT_AVAILABLE_LABEL, routePath } from '@/lib/i18n';

// DYNAMIC_URL_FAMILIES, LOCALE_ROOT_PATHS and LOCALE_NAMES are all derived from
// the locale table in lib/i18n.js — see ROUTE_SLUGS there. They used to be
// hand-maintained here, which meant adding a language touched this file too.

// Every destination slug ends with one of these suffixes (audit the corpus:
// `-fractional-ownership-properties` is the canonical pattern; a handful of
// older slugs use `-fractional-ownership` or longer variants like
// `-fractional-ownership-miami` / `-fractional-ownership-emerald-coast-...`).
// We use this to detect EN destination URLs without false-positive-matching
// every single-segment root path.
const DESTINATION_SLUG_RE = /-fractional-ownership(-|$)/;

function detectDynamicFamily(path, currentLocale) {
  if (LOCALE_ROOT_PATHS.has(path)) return null;
  for (const fam of DYNAMIC_URL_FAMILIES) {
    const prefix = fam.prefixes[currentLocale];
    if (!prefix) continue;
    if (currentLocale === 'en' && fam.family === 'destinations') {
      // EN destinations live at /{slug}/ (root level). Only match when the
      // single-segment slug looks like a destination slug — otherwise every
      // root-level page would be misdetected (/about-us/, /contact/, etc.).
      const slug = path.replace(/^\//, '').replace(/\/$/, '');
      if (slug && !slug.includes('/') && DESTINATION_SLUG_RE.test(slug)) {
        return { family: fam.family, slug, prefixes: fam.prefixes };
      }
      continue;
    }
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
// Main navigation, generated per locale from ROUTE_SLUGS in lib/i18n.js.
// A locale that has no page for an entry (routePath returns null) simply
// doesn't get that link — which is how a language can launch with a focused
// page set instead of a nav bar full of 404s.
const NAV_ITEMS = [
  { key: 'home',       labelKey: 'nav.home' },
  { key: 'homes',      labelKey: 'nav.our_homes' },
  { key: 'howItWorks', labelKey: 'nav.how_it_works' },
  { key: 'aboutUs',    labelKey: 'nav.about_us' },
  { key: 'blog',       labelKey: 'nav.blog' },
  { key: 'favourites', labelKey: 'nav.favourites', extra: 'cop-nav-favourites', badge: true },
  { key: 'contact',    labelKey: 'nav.contact' },
];

const NAV_LINKS = Object.fromEntries(
  SUPPORTED_LOCALES.map((loc) => [
    loc,
    NAV_ITEMS
      .map(({ key, ...rest }) => ({ ...rest, href: routePath(loc, key) }))
      .filter((item) => item.href),
  ])
);

export default function Header() {
  const router = useRouter();
  const path = router.asPath || router.pathname;
  const locale = localeFromPath(path);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setLangOpen(false);
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
          {/* In-drawer language toggle — looks like the other nav items but
              expands a small flag picker below when tapped. */}
          {menuOpen && (
            <>
              <button
                type="button"
                className={`cop-nav-lang-toggle${langOpen ? ' open' : ''}`}
                aria-expanded={langOpen}
                onClick={() => setLangOpen(prev => !prev)}
              >
                {t('nav.language', locale)}
                <span className="cop-nav-lang-chev" aria-hidden="true">{langOpen ? '−' : '+'}</span>
              </button>
              {langOpen && (
                <LanguageSwitcher currentLocale={locale} currentPath={path} />
              )}
            </>
          )}
        </nav>

        {/* Language switcher — desktop: a compact "EN ▾" dropdown trigger,
            opens a panel listing the other locales. Hidden on mobile (drawer
            uses the full-tile picker below the nav links). */}
        <LanguageDropdown currentLocale={locale} currentPath={path} />

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



// Render both a flag and the native locale name. CSS shows only the flag on
// desktop (where the 2x2 grid uses full-bleed flags) and only the text label
// on mobile/drawer (where luxury brands universally use native-language text).
// The drawer picker shows the same uppercase locale code the desktop dropdown
// uses (EN / ES / FR …) rather than a flag. Flags were dropped on 29 Aug 2026:
// Dylan didn't want them, ten of them never fit a phone drawer legibly, and a
// flag is a country not a language anyway (pt here is Brazil, en is UK+US).
// In the drawer the native language name is the visible label and the
// two-letter code sits right-aligned as a small tag (the row is a flex
// space-between of the two). Desktop contexts hide .cop-lang-label via CSS.
function LocaleTag({ loc }) {
  return (
    <>
      <span className="cop-lang-label">{LOCALE_NAMES[loc]}</span>
      <span className="cop-lang-code">{loc.toUpperCase()}</span>
    </>
  );
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


  function targetForLocale(loc) {
    if (dyn) {
      const prefix = dyn.prefixes[loc];
      if (!prefix) return null;
      // Destinations: only link if the target locale actually has the page.
      // FR has 5 country pillars; ES has none; DE has all 48. EN is the
      // canonical set (always renderable at /{slug}/ via pages/[slug].js).
      if (dyn.family === 'destinations') {
        if (!destinationAvailableIn(dyn.slug, loc)) return null;
        return `${prefix}${dyn.slug}/`;
      }
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
              <LocaleTag loc={loc} />
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
              <LocaleTag loc={loc} />
            </span>
          );
        }
        return (
          <a key={loc} href={target} className="cop-lang-link" hrefLang={loc} aria-label={LOCALE_NAMES[loc]} title={LOCALE_NAMES[loc]}>
            <LocaleTag loc={loc} />
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

// ── Desktop language dropdown ──────────────────────────────────────────────
// Trigger: a compact pill showing the current locale code uppercase (e.g. "EN")
// with a chevron. Click → opens a panel listing the OTHER supported locales
// (the current one is omitted — you're already there). Each row: flag + native
// language name. Unavailable target locales show greyed out with tooltip.
//
// Closes on: click outside, route change, Escape key.
function LanguageDropdown({ currentLocale, currentPath }) {
  const [open, setOpen] = useState(false);
  const rootRef = useState(null)[0]; // placeholder; we use refs below
  // We track the ref via a callback so we don't need useRef ergonomics
  // (keeps the import surface unchanged — useState/useEffect only).
  // For click-outside detection we measure event target against the
  // dropdown root using a data attribute selector.

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      // Close when the click lands outside the dropdown
      if (!e.target.closest('[data-cop-lang-dropdown]')) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Close on route change (page navigation)
  useEffect(() => { setOpen(false); }, [currentPath]);

  // Resolve target URLs the same way LanguageSwitcher does (dyn family +
  // canonical ROUTE_MAP). Inlined here so the dropdown is self-contained.
  const dyn = detectDynamicFamily(currentPath, currentLocale);
  const englishPath = canonicalEnglishKey(currentPath) || stripLocalePrefix(currentPath, currentLocale);

  function targetForLocale(loc) {
    if (dyn) {
      const prefix = dyn.prefixes[loc];
      if (!prefix) return null;
      if (dyn.family === 'destinations') {
        if (!destinationAvailableIn(dyn.slug, loc)) return null;
        return `${prefix}${dyn.slug}/`;
      }
      return `${prefix}${dyn.slug}/`;
    }
    return localizedPath(englishPath, loc);
  }

  // Locales to show in the panel — exclude the current one
  const otherLocales = SUPPORTED_LOCALES.filter((l) => l !== currentLocale);

  return (
    <div
      className="cop-lang-dropdown"
      data-cop-lang-dropdown
      aria-label="Language"
    >
      <button
        type="button"
        className={`cop-lang-dropdown-trigger${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${LOCALE_NAMES[currentLocale]}. Click to change language.`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cop-lang-dropdown-code">{currentLocale.toUpperCase()}</span>
        <span className="cop-lang-dropdown-chev" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="cop-lang-dropdown-panel" role="listbox">
          {otherLocales.map((loc) => {
            const target = targetForLocale(loc);
            const unavailable = !target;
            const label = loc.toUpperCase();
            return (
              <li key={loc} role="option" aria-selected="false">
                {unavailable ? (
                  <span
                    className="cop-lang-dropdown-item cop-lang-dropdown-item-disabled"
                    title={NOT_AVAILABLE_LABEL[loc]}
                    aria-label={LOCALE_NAMES[loc] + ' — ' + NOT_AVAILABLE_LABEL[loc]}
                    aria-disabled="true"
                  >
                    {label}
                  </span>
                ) : (
                  <a
                    href={target}
                    className="cop-lang-dropdown-item"
                    hrefLang={loc}
                    aria-label={LOCALE_NAMES[loc]}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
