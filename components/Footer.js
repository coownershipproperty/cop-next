import { useRouter } from 'next/router';
import { localeFromPath, t } from '@/lib/i18n';

// Per-locale link tables. Like the header, slugs are intentionally translated.
// Destination links currently point at the English destination pages because
// those pages are the canonical inventory landing — locale-specific destination
// pages will replace these as they're built.
const FOOTER_LINKS = {
  en: {
    discover: [
      { href: '/our-homes/',    label: 'All Properties' },
      { href: '/how-it-works/', label: 'How It Works' },
      { href: '/about-us/',     label: 'About Us' },
      { href: '/all-our-blog/', label: 'Our Blog' },
      { href: '/favourites/',   label: '♥ My Favourites' },
    ],
    company: [
      { href: '/about-us/',     label: 'About COP' },
      { href: '/how-it-works/', label: 'How It Works' },
      { href: '/all-our-blog/', label: 'Our Blog' },
      { href: '/contact/',      label: 'Contact' },
    ],
    support: [
      { href: '/contact/',                              label: 'Get in Touch' },
      { href: '/buying-a-co-ownership-property-faqs/',  label: 'FAQ' },
      { href: '/favourites/',                           label: 'Saved Properties' },
    ],
  },
  es: {
    discover: [
      { href: '/es/propiedades/',     label: 'Todas las propiedades' },
      { href: '/es/como-funciona/',   label: 'Cómo funciona' },
      { href: '/es/quienes-somos/',   label: 'Quiénes somos' },
      { href: '/all-our-blog/',       label: 'Blog' },
      { href: '/favourites/',         label: '♥ Mis favoritos' },
    ],
    company: [
      { href: '/es/quienes-somos/',   label: 'Sobre COP' },
      { href: '/es/como-funciona/',   label: 'Cómo funciona' },
      { href: '/all-our-blog/',       label: 'Blog' },
      { href: '/es/contacto/',        label: 'Contacto' },
    ],
    support: [
      { href: '/es/contacto/',                  label: 'Contáctanos' },
      { href: '/es/preguntas-frecuentes/',      label: 'Preguntas frecuentes' },
      { href: '/favourites/',                   label: 'Propiedades guardadas' },
    ],
  },
  fr: {
    discover: [
      { href: '/fr/proprietes/',         label: 'Toutes les propriétés' },
      { href: '/fr/comment-ca-marche/',  label: 'Comment ça marche' },
      { href: '/fr/a-propos/',           label: 'À propos' },
      { href: '/all-our-blog/',          label: 'Blog' },
      { href: '/favourites/',            label: '♥ Mes favoris' },
    ],
    company: [
      { href: '/fr/a-propos/',           label: 'À propos de COP' },
      { href: '/fr/comment-ca-marche/',  label: 'Comment ça marche' },
      { href: '/all-our-blog/',          label: 'Blog' },
      { href: '/fr/contact/',            label: 'Contact' },
    ],
    support: [
      { href: '/fr/contact/',                  label: 'Nous contacter' },
      { href: '/fr/faq/',                      label: 'FAQ' },
      { href: '/favourites/',                  label: 'Propriétés sauvegardées' },
    ],
  },
  de: {
    discover: [
      { href: '/de/immobilien/',          label: 'Alle Ferienimmobilien' },
      { href: '/de/so-funktionierts/',    label: 'So funktioniert\'s' },
      { href: '/de/ueber-uns/',           label: 'Über uns' },
      { href: '/de/blog/',                label: 'Blog' },
      { href: '/de/favoriten/',           label: '♥ Meine Favoriten' },
    ],
    company: [
      { href: '/de/ueber-uns/',           label: 'Über COP' },
      { href: '/de/so-funktionierts/',    label: 'So funktioniert\'s' },
      { href: '/de/blog/',                label: 'Blog' },
      { href: '/de/kontakt/',             label: 'Kontakt' },
    ],
    support: [
      { href: '/de/kontakt/',                                       label: 'Kontakt aufnehmen' },
      { href: '/de/ferienimmobilie-kaufen-haeufige-fragen/',        label: 'Häufige Fragen' },
      { href: '/de/favoriten/',                                     label: 'Gespeicherte Immobilien' },
    ],
  },
};

// Destinations are shared (language-prefixed paths can come later).
const DESTINATIONS = [
  { href: '/spain-fractional-ownership-properties/',    label: { en: 'Spain',    es: 'España',  fr: 'Espagne',     de: 'Spanien' } },
  { href: '/france-fractional-ownership-properties/',   label: { en: 'France',   es: 'Francia', fr: 'France',      de: 'Frankreich' } },
  { href: '/italy-fractional-ownership-properties/',    label: { en: 'Italy',    es: 'Italia',  fr: 'Italie',      de: 'Italien' } },
  { href: '/usa-fractional-ownership-properties/',      label: { en: 'USA',      es: 'EE. UU.', fr: 'États-Unis',  de: 'USA' } },
  { href: '/portugal-fractional-ownership-properties/', label: { en: 'Portugal', es: 'Portugal',fr: 'Portugal',    de: 'Portugal' } },
  { href: '/austria-fractional-ownership-properties/',  label: { en: 'Austria',  es: 'Austria', fr: 'Autriche',    de: 'Österreich' } },
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
    </footer>
  );
}
