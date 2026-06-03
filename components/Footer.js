import { useRouter } from 'next/router';
import { localeFromPath, t } from '@/lib/i18n';

// Per-locale link tables. Like the header, slugs are intentionally translated.
// Destination links currently point at the English destination pages because
// those pages are the canonical inventory landing — locale-specific destination
// pages will replace these as they're built.
const FOOTER_LINKS = {
  en: {
    discover: [
      { href: '/our-homes/', label: 'All Properties' },
      { href: '/how-it-works/', label: 'How It Works' },
      { href: '/about-us/', label: 'About Us' },
      { href: '/all-our-blog/', label: 'Our Blog' },
      { href: '/favourites/', label: '♥ My Favourites' },
    ],
    company: [
      { href: '/about-us/', label: 'About COP' },
      { href: '/how-it-works/', label: 'How It Works' },
      { href: '/all-our-blog/', label: 'Our Blog' },
      { href: '/contact/', label: 'Contact' },
    ],
    support: [
      { href: '/contact/', label: 'Get in Touch' },
      { href: '/buying-a-co-ownership-property-faqs/', label: 'Buying FAQ' },
      { href: '/faq/', label: "Buyer's Q&A" },
      { href: '/favourites/', label: 'Saved Properties' },
    ],
  },
  es: {
    discover: [
      { href: '/es/propiedades/', label: 'Todas las propiedades' },
      { href: '/es/como-funciona/', label: 'Cómo funciona' },
      { href: '/es/quienes-somos/', label: 'Quiénes somos' },
      { href: '/all-our-blog/', label: 'Blog' },
      { href: '/favourites/', label: '♥ Mis favoritos' },
    ],
    company: [
      { href: '/es/quienes-somos/', label: 'Sobre COP' },
      { href: '/es/como-funciona/', label: 'Cómo funciona' },
      { href: '/all-our-blog/', label: 'Blog' },
      { href: '/es/contacto/', label: 'Contacto' },
    ],
    support: [
      { href: '/es/contacto/', label: 'Contáctanos' },
      { href: '/es/preguntas-frecuentes/', label: 'Preguntas frecuentes' },
      { href: '/favourites/', label: 'Propiedades guardadas' },
    ],
  },
  fr: {
    discover: [
      { href: '/fr/proprietes/', label: 'Notre offre' },
      { href: '/fr/comment-ca-marche/', label: 'Comment ça marche' },
      { href: '/fr/a-propos/', label: 'À propos' },
      { href: '/all-our-blog/', label: 'Blog' },
      { href: '/favourites/', label: '♥ Mes favoris' },
    ],
    company: [
      { href: '/fr/a-propos/', label: 'À propos de COP' },
      { href: '/fr/comment-ca-marche/', label: 'Comment ça marche' },
      { href: '/all-our-blog/', label: 'Blog' },
      { href: '/fr/contact/', label: 'Contact' },
    ],
    support: [
      { href: '/fr/contact/', label: 'Nous contacter' },
      { href: '/fr/faq/', label: 'FAQ' },
      { href: '/favourites/', label: 'Propriétés sauvegardées' },
    ],
  },
  de: {
    discover: [
      { href: '/de/immobilien/', label: 'Alle Ferienimmobilien' },
      { href: '/de/so-funktionierts/', label: 'So funktioniert\'s' },
      { href: '/de/ueber-uns/', label: 'Über uns' },
      { href: '/de/blog/', label: 'Blog' },
      { href: '/de/favoriten/', label: '♥ Meine Favoriten' },
    ],
    company: [
      { href: '/de/ueber-uns/', label: 'Über COP' },
      { href: '/de/so-funktionierts/', label: 'So funktioniert\'s' },
      { href: '/de/blog/', label: 'Blog' },
      { href: '/de/kontakt/', label: 'Kontakt' },
    ],
    support: [
      { href: '/de/kontakt/', label: 'Kontakt aufnehmen' },
      { href: '/de/ferienimmobilie-kaufen-haeufige-fragen/', label: 'Häufige Fragen' },
      { href: '/de/favoriten/', label: 'Gespeicherte Immobilien' },
    ],
  },
};

// Destinations are shared (language-prefixed paths can come later).
const DESTINATIONS = [
  { href: '/spain-fractional-ownership-properties/', label: { en: 'Spain', es: 'España', fr: 'Espagne', de: 'Spanien' } },
  { href: '/france-fractional-ownership-properties/', label: { en: 'France', es: 'Francia', fr: 'France', de: 'Frankreich' } },
  { href: '/italy-fractional-ownership-properties/', label: { en: 'Italy', es: 'Italia', fr: 'Italie', de: 'Italien' } },
  { href: '/usa-fractional-ownership-properties/', label: { en: 'USA', es: 'EE. UU.', fr: 'États-Unis', de: 'USA' } },
  { href: '/portugal-fractional-ownership-properties/', label: { en: 'Portugal', es: 'Portugal', fr: 'Portugal', de: 'Portugal' } },
  { href: '/austria-fractional-ownership-properties/', label: { en: 'Austria', es: 'Austria', fr: 'Autriche', de: 'Österreich' } },
];

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

export default function Footer() {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const links = FOOTER_LINKS[locale] || FOOTER_LINKS.en;

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
        <div className="footer-col">
          <h4 className="footer-col-heading">{t('footer.discover_heading', locale)}</h4>
          <ul>
            {links.discover.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </div>

        {/* Destinations */}
        <div className="footer-col">
          <h4 className="footer-col-heading">{t('footer.destinations_heading', locale)}</h4>
          <ul>
            {DESTINATIONS.map(({ href, label }) => (
              <li key={href}><a href={href}>{label[locale] || label.en}</a></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4 className="footer-col-heading">{t('footer.company_heading', locale)}</h4>
          <ul>
            {links.company.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4 className="footer-col-heading">{t('footer.support_heading', locale)}</h4>
          <ul>
            {links.support.map(({ href, label }) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {t('site.brand', locale)}. {t('footer.rights_reserved', locale)}</p>
        <p className="footer-bottom-right">{t('site.tagline', locale)}</p>
      </div>

      <style jsx>{`
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
