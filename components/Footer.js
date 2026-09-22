import { useRouter } from 'next/router';
import { useState } from 'react';
import { localeFromPath, t, routePath } from '@/lib/i18n';
import { DESTINATIONS as DESTINATION_FILTERS, COUNTRY_PILLARS } from '@/lib/destinations';

// Footer columns, generated per locale from ROUTE_SLUGS in lib/i18n.js and
// the message catalogues. Previously a hand-maintained table per locale, which
// is how the Spanish and French footers ended up linking at /favourites/ and
// /all-our-blog/ — the English pages — instead of their own.
//
// Each entry is [routeKey, messageKey] and resolves to that locale's own URL.
// A third element is a fixed href for pages that exist only in English.
const FOOTER_COLS = {
  discover: [
    ['homes',      'footer.all_properties'],
    ['howItWorks', 'nav.how_it_works'],
    ['aboutUs',    'nav.about_us'],
    ['blog',       'nav.blog'],
    // English-only for now, like /list-with-cop/ above it. The hub itself
    // links the localised siblings of each comparison.
    [null,         'footer.compare', '/compare/'],
    // English-only for now — the country guides have no locale siblings yet.
    [null,         'footer.buying_guides', '/how-to-buy/'],
    ['favourites', 'nav.favourites'],
  ],
  company: [
    ['aboutUs',    'footer.about_cop'],
    ['howItWorks', 'nav.how_it_works'],
    ['blog',       'nav.blog'],
    ['contact',    'nav.contact'],
    [null,         'footer.list_your_home', '/list-with-cop/'],
  ],
  support: [
    ['contact',     'footer.get_in_touch'],
    [null,          'footer.sign_in', '/signin/'],
    ['buyingFaqs',  'footer.faq_buying'],
    ['stayingFaqs', 'footer.faq_staying'],
    ['favourites',  'footer.saved_properties'],
  ],
};

function footerLinks(locale) {
  const build = (col) => FOOTER_COLS[col]
    .map(([routeKey, messageKey, fixedHref]) => ({
      href: fixedHref || routePath(locale, routeKey),
      label: t(messageKey, locale),
    }))
    .filter((l) => l.href);
  return { discover: build('discover'), company: build('company'), support: build('support') };
}

// Country labels. The SET of countries is not maintained here — it comes from
// COUNTRY_PILLARS in lib/destinations.js, which is the file that decides what
// a country pillar page is. This footer used to carry its own hand-written
// list and had drifted to six entries while eleven pillar pages existed and
// returned 200, so Germany, Mexico, England, Sweden and Croatia had no link
// from any page on the site. A pillar with no label falls back to its English
// country name rather than vanishing from the footer. (David, 17 Sep 2026)
const COUNTRY_LABELS = {
  'usa-fractional-ownership-properties':      { en: 'USA',      es: 'EE. UU.',  fr: 'États-Unis', de: 'USA',        it: 'Stati Uniti', nl: 'Verenigde Staten', pt: 'Estados Unidos', sv: 'USA',       da: 'USA',      no: 'USA' },
  'spain-fractional-ownership-properties':    { en: 'Spain',    es: 'España',   fr: 'Espagne',    de: 'Spanien',    it: 'Spagna',      nl: 'Spanje',           pt: 'Espanha',        sv: 'Spanien',   da: 'Spanien',  no: 'Spania' },
  'italy-fractional-ownership-properties':    { en: 'Italy',    es: 'Italia',   fr: 'Italie',     de: 'Italien',    it: 'Italia',      nl: 'Italië',           pt: 'Itália',         sv: 'Italien',   da: 'Italien',  no: 'Italia' },
  'france-fractional-ownership-properties':   { en: 'France',   es: 'Francia',  fr: 'France',     de: 'Frankreich', it: 'Francia',     nl: 'Frankrijk',        pt: 'França',         sv: 'Frankrike', da: 'Frankrig', no: 'Frankrike' },
  'austria-fractional-ownership-properties':  { en: 'Austria',  es: 'Austria',  fr: 'Autriche',   de: 'Österreich', it: 'Austria',     nl: 'Oostenrijk',       pt: 'Áustria',        sv: 'Österrike', da: 'Østrig',   no: 'Østerrike' },
  'germany-fractional-ownership-properties':  { en: 'Germany',  es: 'Alemania', fr: 'Allemagne',  de: 'Deutschland', it: 'Germania',   nl: 'Duitsland',        pt: 'Alemanha',       sv: 'Tyskland',  da: 'Tyskland', no: 'Tyskland' },
  'mexico-fractional-ownership-properties':   { en: 'Mexico',   es: 'México',   fr: 'Mexique',    de: 'Mexiko',     it: 'Messico',     nl: 'Mexico',           pt: 'México',         sv: 'Mexiko',    da: 'Mexico',   no: 'Mexico' },
  'portugal-fractional-ownership-properties': { en: 'Portugal', es: 'Portugal', fr: 'Portugal',   de: 'Portugal',   it: 'Portogallo',  nl: 'Portugal',         pt: 'Portugal',       sv: 'Portugal',  da: 'Portugal', no: 'Portugal' },
  'england-fractional-ownership-properties':  { en: 'England',  es: 'Inglaterra', fr: 'Angleterre', de: 'England',  it: 'Inghilterra', nl: 'Engeland',         pt: 'Inglaterra',     sv: 'England',   da: 'England',  no: 'England' },
  'sweden-fractional-ownership-properties':   { en: 'Sweden',   es: 'Suecia',   fr: 'Suède',      de: 'Schweden',   it: 'Svezia',      nl: 'Zweden',           pt: 'Suécia',         sv: 'Sverige',   da: 'Sverige',  no: 'Sverige' },
  'croatia-fractional-ownership-properties':  { en: 'Croatia',  es: 'Croacia',  fr: 'Croatie',    de: 'Kroatien',   it: 'Croazia',     nl: 'Kroatië',          pt: 'Croácia',        sv: 'Kroatien',  da: 'Kroatien', no: 'Kroatia' },
};

const DESTINATIONS = COUNTRY_PILLARS.map((slug) => ({
  href: `/${slug}/`,
  label: COUNTRY_LABELS[slug] || { en: (DESTINATION_FILTERS[slug] && DESTINATION_FILTERS[slug].country) || slug },
}));

// Social channels shown under the brand mark.
const SOCIAL = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61582108534258',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  },
  {
    label: 'X',
    href: 'https://x.com/fractional_guru',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/co-ownership-properties/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
];

function FooterGroup({ name, title, children, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`footer-col ${className}`} data-expanded={open}>
      <h4 className="footer-col-heading footer-desktop-heading">{title}</h4>
      <button type="button" className="footer-mobile-toggle" aria-expanded={open}
        aria-controls={`footer-${name}`} onClick={() => setOpen(!open)}>
        {title}<span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div className="footer-group-links" id={`footer-${name}`}>{children}</div>
    </div>
  );
}

export default function Footer() {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const links = footerLinks(locale);

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-text">Co-Ownership<br />Properties</div>
          <div className="footer-social">
            {SOCIAL.map(({ label, href, path }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
              </a>
            ))}
          </div>
        </div>

        {/* Discover */}
        <FooterGroup name="discover" title={t('footer.discover_heading', locale)}>
          <ul>
            {links.discover.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </FooterGroup>

        {/* Destinations — two sub-columns, because this list is eleven long
            against five in Company and Support, and a single column left the
            footer with a 700px ragged edge. */}
        <FooterGroup name="destinations" className="footer-col-destinations" title={t('footer.destinations_heading', locale)}>
          <ul>
            {DESTINATIONS.map(({ href, label }) => (
              <li key={href}><a href={href}>{label[locale] || label.en}</a></li>
            ))}
          </ul>
        </FooterGroup>

        {/* Company */}
        <FooterGroup name="company" title={t('footer.company_heading', locale)}>
          <ul>
            {links.company.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </FooterGroup>

        {/* Support */}
        <FooterGroup name="support" title={t('footer.support_heading', locale)}>
          <ul>
            {links.support.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </FooterGroup>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {t('site.brand', locale)}. {t('footer.rights_reserved', locale)}</p>
        <p className="footer-legal">
          <a href="/privacy-policy/">{t('footer.privacy', locale)}</a>
          <span aria-hidden="true">·</span>
          <a href="/terms-and-conditions/">{t('footer.terms', locale)}</a>
        </p>
        <p className="footer-entity">PREMPROPERTY SL · NIF B93358489 · Marbella, Spain</p>
      </div>

      <style jsx>{`
        :global(.footer-mobile-toggle) { display: none; }
        /* Copyright left, the two policies right, the company identity on its
           own full-width line underneath (footer-bottom is a wrapping flex
           row, so flex-basis:100% breaks it onto that line). */
        :global(.footer-legal) { display: flex; align-items: center; gap: 10px; }
        :global(.footer-legal a) { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; }
        :global(.footer-legal a:hover) { opacity: .75; }
        :global(.footer-legal span) { opacity: .45; }
        :global(.footer-entity) { flex-basis: 100%; order: 3; margin-top: 14px; font-size: 12px; opacity: .55; }
        @media (max-width: 760px) {
          :global(.rd .footer-bottom) { align-items: center; text-align: center; gap: 14px; }
          :global(.footer-legal) { justify-content: center; }
          :global(.footer-entity) { margin-top: 2px; }
        }
        @media (max-width: 760px) {
          :global(.rd .site-footer) { padding: 36px 0 28px; }
          :global(.rd .footer-inner) { display: flex; flex-direction: column; align-items: stretch; gap: 0; }
          :global(.rd .footer-brand) { padding-bottom: 28px; }
          :global(.rd .footer-social a) { width: 44px; height: 44px; }
          :global(.rd .footer-desktop-heading) { display: none; }
          :global(.rd .footer-col) { border-top: 1px solid rgba(255,255,255,.14); }
          :global(.rd .footer-mobile-toggle) {
            display: flex; align-items: center; justify-content: space-between;
            width: 100%; min-height: 60px; padding: 16px 0; border: 0;
            background: transparent; color: #e6ded0; text-align: left;
            font: inherit; font-size: 15px; cursor: pointer;
          }
          :global(.rd .footer-mobile-toggle span) { font-size: 22px; color: #bba983; }
          :global(.rd .footer-group-links) { display: none; }
          :global(.rd .footer-col[data-expanded="true"] .footer-group-links) { display: block; padding-bottom: 20px; }
          :global(.rd .footer-col ul) { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
          :global(.rd .footer-col li a) { min-height: 44px; font-size: 14px; }
          :global(.rd .footer-bottom) { margin-top: 20px; padding: 22px 20px 52px; text-align: left; font-size: 12px; line-height: 1.7; }
        }
        .footer-social {
          display: flex;
          gap: 0.6rem;
          margin-top: 1.05rem;
        }
        .footer-social a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          opacity: 0.85;
          transition: opacity 0.15s ease, border-color 0.15s ease;
        }
        .footer-social a:hover {
          opacity: 1;
          border-color: rgba(255, 255, 255, 0.6);
        }
        .footer-social svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
      `}</style>
    </footer>
  );
}
