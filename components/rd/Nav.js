// Floating light nav pill for the redesigned (dark) pages.
// Mobile sheet is a sibling of the pill, and neither sits under anything with
// transform/filter/backdrop-filter — WebKit would make that the containing
// block for a fixed element (the Apr–Sep 2026 iPhone menu bug).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { localeFromPath, t, routePath, SUPPORTED_LOCALES, LOCALE_META } from '@/lib/i18n';

const ITEMS = [
  { key: 'homes',      labelKey: 'nav.our_homes' },
  { key: 'howItWorks', labelKey: 'nav.how_it_works' },
  { key: 'aboutUs',    labelKey: 'nav.about_us' },
  { key: 'blog',       labelKey: 'nav.blog' },
  { key: 'contact',    labelKey: 'nav.contact' },
];

export default function Nav({ ctaHref = '#speak-to-expert', ctaLabel = 'Speak to us' }) {
  const router = useRouter();
  const path = router.asPath || router.pathname || '/';
  const locale = localeFromPath(path);
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);
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
    <div className="rd-nav-wrap">
      <nav className="rd-nav" aria-label="Main">
        <Link href={homeHref} className="rd-nav-logo" aria-label={t('site.brand', locale)}>
          <img src="/images/cop-logo.svg" alt="" width="70" height="34" />
        </Link>
        <ul className="rd-nav-links">
          {links.map(({ href, label }) => (
            <li key={href}><Link href={href} aria-current={clean === href ? 'page' : undefined}>{label}</Link></li>
          ))}
        </ul>
        <div className="rd-nav-right">
          <div className="rd-nav-lang">
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => { const to = routePath(e.target.value, 'home'); if (to) window.location.href = to; }}
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc} value={loc}>{loc.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <a href={ctaHref} className="rd-nav-cta">{ctaLabel}</a>
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
        {links.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        <a href={ctaHref} className="rd-nav-cta" onClick={() => setOpen(false)}>{ctaLabel}</a>
        <div className="rd-nav-lang">
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => { const to = routePath(e.target.value, 'home'); if (to) window.location.href = to; }}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>{LOCALE_META[loc].name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
