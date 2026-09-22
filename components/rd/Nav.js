// Floating light nav pill for the redesigned (dark) pages.
// Mobile sheet is a sibling of the pill, and neither sits under anything with
// transform/filter/backdrop-filter — WebKit would make that the containing
// block for a fixed element (the Apr–Sep 2026 iPhone menu bug).
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFavSlugs, onFavsChange } from '@/lib/favs';
import savedStyles from '@/styles/saved-nav.module.css';
import { localeFromPath, t, routePath, SUPPORTED_LOCALES, LOCALE_META } from '@/lib/i18n';

const ITEMS = [
  { key: 'home',       labelKey: 'nav.home' },
  { key: 'homes',      labelKey: 'nav.our_homes' },
  { key: 'howItWorks', labelKey: 'nav.how_it_works' },
  { key: 'aboutUs',    labelKey: 'nav.about_us' },
  { key: 'blog',       labelKey: 'nav.blog' },
  { key: 'contact',    labelKey: 'nav.contact' },
];

function LanguagePicker({ locale }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!expanded) return;
    const dismiss = event => { if (!ref.current?.contains(event.target)) setExpanded(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [expanded]);
  return <div className="rd-language" ref={ref} onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);}} onKeyDown={event => {
    if (event.key === 'Escape') {setExpanded(false);trigger.current?.focus();}
  }}>
    <button ref={trigger} className="rd-language-trigger" type="button" aria-label={`Language: ${LOCALE_META[locale].name}`} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(v => !v)}>
      {locale.toUpperCase()}<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.3" /></svg>
    </button>
    {expanded && <div className="rd-language-panel" id={id} aria-label="Choose a language">
      {SUPPORTED_LOCALES.map(loc => <Link key={loc} href={routePath(loc,'home')} lang={loc} hrefLang={loc} aria-current={locale === loc ? 'true' : undefined} onClick={() => setExpanded(false)}><span>{LOCALE_META[loc].name}</span><span aria-hidden="true">{locale === loc ? '✓' : loc.toUpperCase()}</span></Link>)}
    </div>}
  </div>;
}

export default function Nav({ ctaHref, ctaLabel = 'Speak to us', propertyHero = false }) {
  const router = useRouter();
  const path = router.asPath || router.pathname || '/';
  const locale = localeFromPath(path);
  // The global contact action must not change meaning from page to page.
  // Explicitly labelled alternatives (such as "Email us") retain their target.
  const contactHref = ctaLabel === 'Speak to us'
    ? routePath(locale, 'contact')
    : (ctaHref || routePath(locale, 'contact'));
  const [open, setOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    setSavedCount(getFavSlugs().length);
    return onFavsChange(slugs => setSavedCount(slugs.length));
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [inPropertyHero, setInPropertyHero] = useState(propertyHero);
  const navRef = useRef(null);
  useEffect(() => {
    let previous = window.scrollY;
    let travel = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      previous = y;
      setScrolled(y > 80);
      let withinPropertyHero = false;
      if (propertyHero) {
        const page = navRef.current?.closest('.rd');
        const boundary = page?.querySelector('.pp-tabs') || page?.querySelector('.pp-gallery');
        withinPropertyHero = !boundary || boundary.getBoundingClientRect().bottom > 0;
        setInPropertyHero(withinPropertyHero);
      }
      if (withinPropertyHero || open || reduced.matches || y < 100 || navRef.current?.contains(document.activeElement)) {
        travel = 0;
        setHidden(false);
        return;
      }
      if (Math.sign(delta) !== Math.sign(travel)) travel = 0;
      travel += delta;
      if (travel > 36) setHidden(true);
      if (travel < -12) setHidden(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, propertyHero, path]);

  useEffect(() => { setOpen(false); setHidden(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = ITEMS
    .filter(({ key }) => locale === 'en' || key !== 'blog')
    .map(({ key, labelKey }) => ({ href: routePath(locale, key), label: t(labelKey, locale) }))
    .filter((l) => l.href);
  const homeHref = routePath(locale, 'home') || '/';
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') + '/';

  return (
    <div className={`rd-nav-wrap${propertyHero && inPropertyHero ? ' is-property-hero' : ''}${scrolled ? ' is-scrolled' : ''}${hidden && !open ? ' is-hidden' : ''}`}>
      <nav ref={navRef} className="rd-nav" aria-label="Main" onFocusCapture={() => setHidden(false)}>
        <Link href={homeHref} className="rd-nav-logo" aria-label={t('site.brand', locale)}>
          <span className="rd-nav-wordmark"><img src="/images/cop-logo.svg" alt="" width="70" height="34" /></span>
        </Link>
        <ul className="rd-nav-links">
          {links.map(({ href, label }) => (
            <li key={href}><Link href={href} aria-current={clean === href ? 'page' : undefined}>{label}</Link></li>
          ))}
        </ul>
        <div className="rd-nav-right">
          <Link href={routePath(locale, 'favourites')} className={savedStyles.link} aria-label={`${locale === 'en' ? 'Saved homes' : t('nav.favourites', locale)} (${savedCount})`} title={locale === 'en' ? 'Saved homes' : t('nav.favourites', locale)} aria-current={clean === routePath(locale, 'favourites') ? 'page' : undefined}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={savedCount ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
            <span className={savedStyles.count} aria-hidden="true">{savedCount}</span>
          </Link>
          <div className="rd-nav-lang">
            <LanguagePicker locale={locale} />
          </div>
          <a href={contactHref} className="rd-nav-cta">{ctaLabel}</a>
          <button
            type="button"
            className="rd-nav-burger"
            aria-label="Menu"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls="rd-nav-sheet"
            onClick={() => setOpen((o) => !o)}
          ><span /></button>
        </div>
      </nav>
      <div className="rd-nav-sheet" id="rd-nav-sheet" data-open={open ? 'true' : 'false'}>
        {links.map(({ href, label }) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={clean === href ? 'page' : undefined}>{label}</Link>)}
        <div className="rd-mobile-menu-tools">
          <Link className="rd-mobile-saved" href={routePath(locale, 'favourites')} aria-current={clean === routePath(locale, 'favourites') ? 'page' : undefined} onClick={() => setOpen(false)}>{locale === 'en' ? 'Saved homes' : t('nav.favourites', locale)} · {savedCount}</Link>
          <div className="rd-nav-lang"><LanguagePicker locale={locale} /></div>
        </div>
        <a href={contactHref} className="rd-nav-cta" onClick={() => setOpen(false)}>{ctaLabel}</a>
      </div>
    </div>
  );
}
