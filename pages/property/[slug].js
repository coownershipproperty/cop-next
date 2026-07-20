import Head from 'next/head';
import NextImage from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { trackConversion, fbqEvent } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import { useCurrency, convertPrice, CURRENCY_SYMBOLS } from '@/hooks/useCurrency';
import ExpertForm from '@/components/ExpertForm';
import UnlockModal from '@/components/UnlockModal';
import TourRequestModal from '@/components/TourRequestModal';
import FinancingCalculator from '@/components/FinancingCalculator';
import PropertyCard from '@/components/PropertyCard';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

// ── Locale-specific UI copy ────────────────────────────────────────────────
const COPY = {
  en: {
    cobadge: (n) => `1/${n} Co-Ownership`,
    price_qualifier: (n) => `for a 1/${n} share`,
    bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', total_size: 'Total size', per_year: 'Per year', share_size: 'Share size',
    days_label: (n) => `~${Math.floor(365 / n)} days`,
    about_heading: 'About This Property',
    desc_empty: 'Full details coming soon. Use the enquiry form to get in touch.',
    show_less: 'Show less', read_more: 'Read more',
    amenities_heading: 'Features & Amenities',
    all_amenities: (n) => `All ${n} amenities`,
    location_heading: 'Location',
    similar_heading: (country) => `Similar Properties in ${country}`,
    pillar_link: (country) => `See all ${country} fractional ownership properties →`,
    tab_overview: 'Overview', tab_look: 'Look inside', tab_amenities: 'Amenities', tab_location: 'Location', tab_coown: 'Co-ownership', tab_fin: 'Financing',
    look_heading: 'Look Inside',
    look_sub: 'Browse the photo gallery, or ask us for a full 3D walkthrough of this home.',
    look_gallery_btn: 'View photo gallery',
    tour_btn: 'Request 3D Tour',
    coown_heading: 'How Co-Ownership Works',
    coown_points: (n, days) => [
      [`You own 1/${n} of the home`, 'Real, deeded property ownership — not a timeshare, not points.'],
      [`~${days} days a year`, 'Stays are scheduled fairly between the co-owners across the whole year.'],
      ['Costs are shared', `You pay 1/${n}th of the home's total running costs, shared between all owners.`],
      ['Fully managed', 'Maintenance, cleaning and scheduling are handled for you — just arrive and enjoy.'],
      ['Sell whenever you like', 'Your share is a real asset: sell it at a price you set.'],
    ],
    missing_photos: (n) => `You're missing ${n} photos`,
    unlock_sub: 'Unlock the full gallery & floor plans — free',
    unlock_now: 'Unlock Now →',
    form_eye: 'Get in touch',
    form_title: 'Enquire About This Property',
    form_sub: 'Our team typically responds within a few hours. No obligation.',
    contact_cta: 'Contact Us',
    contact_sub: 'Enquire',
    eq_name: 'Your name', eq_name_ph: 'Full name',
    eq_email: 'Email', eq_email_ph: 'your@email.com',
    eq_phone: 'Phone', eq_phone_ph: '+1 or +44…',
    eq_msg: 'Message', eq_msg_ph: 'Any questions about this property…',
    eq_send: 'Send Enquiry →', eq_sending: 'Sending…',
    eq_thanks: (n) => `Thanks ${n}! We'll be in touch shortly.`,
    eq_err: 'Something went wrong. Please try again.',
  },
  es: {
    cobadge: (n) => `1/${n} de copropiedad`,
    price_qualifier: (n) => `por una participación de 1/${n}`,
    bedrooms: 'Dormitorios', bathrooms: 'Baños', total_size: 'Superficie total', per_year: 'Al año', share_size: 'Tamaño de fracción',
    days_label: (n) => `~${Math.floor(365 / n)} días`,
    about_heading: 'Sobre esta propiedad',
    desc_empty: 'Próximamente más detalles. Usa el formulario de contacto para obtener información.',
    show_less: 'Ver menos', read_more: 'Leer más',
    amenities_heading: 'Características y servicios',
    all_amenities: (n) => `Ver las ${n} características`,
    location_heading: 'Ubicación',
    similar_heading: (country) => `Propiedades similares en ${country}`,
    pillar_link: (country) => `Ver todas las propiedades de copropiedad en ${country} →`,
    tab_overview: 'Resumen', tab_look: 'Por dentro', tab_amenities: 'Servicios', tab_location: 'Ubicación', tab_coown: 'Copropiedad', tab_fin: 'Financiación',
    look_heading: 'Por dentro',
    look_sub: 'Explora la galería de fotos o pídenos un recorrido 3D completo de esta casa.',
    look_gallery_btn: 'Ver galería de fotos',
    tour_btn: 'Solicitar tour 3D',
    coown_heading: 'Cómo funciona la copropiedad',
    coown_points: (n, days) => [
      [`Eres dueño de 1/${n} de la casa`, 'Propiedad real inscrita a tu nombre — no es multipropiedad ni puntos.'],
      [`~${days} días al año`, 'Las estancias se reparten de forma equitativa entre los copropietarios durante todo el año.'],
      ['Los gastos se comparten', `Pagas 1/${n} de los gastos totales de la casa, repartidos entre todos los propietarios.`],
      ['Gestión integral', 'Mantenimiento, limpieza y calendario gestionados por el equipo — tú solo llega y disfruta.'],
      ['Vende cuando quieras', 'Tu participación es un activo real: véndela al precio que tú fijes.'],
    ],
    missing_photos: (n) => `Te faltan ${n} fotos`,
    unlock_sub: 'Desbloquea la galería completa y los planos — gratis',
    unlock_now: 'Desbloquear ahora →',
    form_eye: 'Contáctanos',
    form_title: 'Consulta sobre esta propiedad',
    form_sub: 'Nuestro equipo suele responder en pocas horas. Sin compromiso.',
    contact_cta: 'Contáctanos',
    contact_sub: 'Consulta',
    eq_name: 'Tu nombre', eq_name_ph: 'Nombre completo',
    eq_email: 'Correo electrónico', eq_email_ph: 'tu@email.com',
    eq_phone: 'Teléfono', eq_phone_ph: '+34 o +1…',
    eq_msg: 'Mensaje', eq_msg_ph: 'Preguntas sobre esta propiedad…',
    eq_send: 'Enviar consulta →', eq_sending: 'Enviando…',
    eq_thanks: (n) => `¡Gracias ${n}! Te contactaremos en breve.`,
    eq_err: 'Algo salió mal. Inténtalo de nuevo.',
  },
  fr: {
    cobadge: (n) => `1/${n} en copropriété`,
    price_qualifier: (n) => `pour une part de 1/${n}`,
    bedrooms: 'Chambres', bathrooms: 'Salles de bain', total_size: 'Surface totale', per_year: 'Par an', share_size: 'Taille de la part',
    days_label: (n) => `~${Math.floor(365 / n)} jours`,
    about_heading: 'À propos de ce bien',
    desc_empty: 'Plus de détails bientôt. Utilisez le formulaire pour nous contacter.',
    show_less: 'Voir moins', read_more: 'Lire la suite',
    amenities_heading: 'Caractéristiques et équipements',
    all_amenities: (n) => `Voir les ${n} équipements`,
    location_heading: 'Localisation',
    similar_heading: (country) => `Biens immobiliers similaires en ${country}`,
    pillar_link: (country) => `Voir toutes les propriétés en copropriété en ${country} →`,
    tab_overview: "Vue d'ensemble", tab_look: "À l'intérieur", tab_amenities: 'Équipements', tab_location: 'Localisation', tab_coown: 'Copropriété', tab_fin: 'Financement',
    look_heading: "À l'intérieur",
    look_sub: 'Parcourez la galerie photo ou demandez-nous une visite 3D complète de cette maison.',
    look_gallery_btn: 'Voir la galerie photo',
    tour_btn: 'Demander une visite 3D',
    coown_heading: 'Comment fonctionne la copropriété',
    coown_points: (n, days) => [
      [`Vous possédez 1/${n} de la maison`, 'Une propriété réelle, inscrite à votre nom — ni timeshare, ni points.'],
      [`~${days} jours par an`, "Les séjours sont répartis équitablement entre les copropriétaires sur toute l'année."],
      ['Les frais sont partagés', `Vous payez 1/${n} des frais totaux de la maison, répartis entre tous les propriétaires.`],
      ['Gestion complète', "Entretien, ménage et calendrier sont pris en charge — vous n'avez qu'à profiter."],
      ['Revendez quand vous voulez', 'Votre part est un actif réel : revendez-la au prix que vous fixez.'],
    ],
    missing_photos: (n) => `Il vous manque ${n} photos`,
    unlock_sub: "Débloquez la galerie complète et les plans — gratuit",
    unlock_now: 'Débloquer maintenant →',
    form_eye: 'Nous contacter',
    form_title: 'Ce bien vous intéresse ?',
    form_sub: 'Notre équipe répond généralement sous quelques heures. Sans engagement.',
    contact_cta: 'Nous contacter',
    contact_sub: 'Demande',
    eq_name: 'Votre nom', eq_name_ph: 'Nom complet',
    eq_email: 'Email', eq_email_ph: 'vous@email.com',
    eq_phone: 'Téléphone', eq_phone_ph: '+33 ou +1…',
    eq_msg: 'Message', eq_msg_ph: 'Questions sur ce bien immobilier…',
    eq_send: 'Envoyer la demande →', eq_sending: 'Envoi en cours…',
    eq_thanks: (n) => `Merci ${n} ! Nous vous contacterons sous peu.`,
    eq_err: "Une erreur s'est produite. Veuillez réessayer.",
  },
  de: {
    cobadge: (n) => `1/${n} Miteigentum`,
    price_qualifier: (n) => `für einen 1/${n}-Anteil`,
    bedrooms: 'Schlafzimmer', bathrooms: 'Badezimmer', total_size: 'Gesamtfläche', per_year: 'Pro Jahr', share_size: 'Anteilsgröße',
    days_label: (n) => `~${Math.floor(365 / n)} Tage`,
    about_heading: 'Über diese Immobilie',
    desc_empty: 'Weitere Details folgen in Kürze. Bitte nutzen Sie das Anfrageformular, um Kontakt aufzunehmen.',
    show_less: 'Weniger anzeigen', read_more: 'Mehr lesen',
    amenities_heading: 'Ausstattung & Annehmlichkeiten',
    all_amenities: (n) => `Alle ${n} Ausstattungsmerkmale`,
    location_heading: 'Lage',
    similar_heading: (country) => `Ähnliche Immobilien in ${country}`,
    pillar_link: (country) => `Alle Miteigentumsimmobilien in ${country} ansehen →`,
    tab_overview: 'Überblick', tab_look: 'Einblicke', tab_amenities: 'Ausstattung', tab_location: 'Lage', tab_coown: 'Miteigentum', tab_fin: 'Finanzierung',
    look_heading: 'Einblicke',
    look_sub: 'Stöbern Sie durch die Fotogalerie oder fordern Sie einen vollständigen 3D-Rundgang durch dieses Zuhause an.',
    look_gallery_btn: 'Fotogalerie ansehen',
    tour_btn: '3D-Rundgang anfragen',
    coown_heading: 'So funktioniert Miteigentum',
    coown_points: (n, days) => [
      [`Ihnen gehört 1/${n} des Hauses`, 'Echtes, grundbuchlich eingetragenes Eigentum — kein Timesharing, keine Punkte.'],
      [`~${days} Tage pro Jahr`, 'Die Aufenthalte werden fair über das ganze Jahr zwischen den Miteigentümern verteilt.'],
      ['Kosten werden geteilt', `Sie zahlen 1/${n} der gesamten laufenden Kosten des Hauses, geteilt unter allen Eigentümern.`],
      ['Komplett verwaltet', 'Instandhaltung, Reinigung und Kalender werden für Sie übernommen — einfach ankommen und genießen.'],
      ['Verkaufen, wann Sie möchten', 'Ihr Anteil ist ein echter Vermögenswert: Verkaufen Sie ihn zum Preis, den Sie festlegen.'],
    ],
    missing_photos: (n) => `Ihnen fehlen ${n} Fotos`,
    unlock_sub: 'Galerie und Grundrisse freischalten — kostenlos',
    unlock_now: 'Jetzt freischalten →',
    form_eye: 'Kontakt aufnehmen',
    form_title: 'Anfrage zu dieser Immobilie',
    form_sub: 'Unser Team antwortet in der Regel innerhalb weniger Stunden. Unverbindlich.',
    contact_cta: 'Kontakt',
    contact_sub: 'Anfrage',
    eq_name: 'Ihr Name', eq_name_ph: 'Vollständiger Name',
    eq_email: 'E-Mail', eq_email_ph: 'ihre@email.com',
    eq_phone: 'Telefon', eq_phone_ph: '+49 oder +1…',
    eq_msg: 'Nachricht', eq_msg_ph: 'Fragen zu dieser Immobilie…',
    eq_send: 'Anfrage senden →', eq_sending: 'Wird gesendet…',
    eq_thanks: (n) => `Vielen Dank, ${n}! Wir melden uns in Kürze bei Ihnen.`,
    eq_err: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  },
};

// Locale comes from URL path only — never from a cookie. The canonical
// /property/<slug>/ URL is English; Spanish/French versions live at
// /es/propiedades/<slug>/ and /fr/proprietes/<slug>/ via the locale-prefixed
// wrappers, which pass forceLocale in.
//
// Cookie-based detection was removed because a stale cookie (from an earlier
// session or the old geo-redirect) silently rendered Spanish content on the
// English URL.
function useLocaleFromCookie(initialFromRouter) {
  return initialFromRouter;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getStaticPaths() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('properties')
    .select('slug')
    .in('status', ['Live', 'for_sale']);
  return {
    paths: (data || []).map(p => ({ params: { slug: p.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  try {
    const supabase = getSupabase();
    // Selects '*' to include the new title_es/title_fr/description_es/description_fr/
    // amenities_es/amenities_fr columns alongside the English originals. Falls back
    // gracefully when a row hasn't been translated yet.
    //
    // Wrapped in try/catch + explicit error checks so that requests for slugs
    // that no longer exist in the DB (renamed/removed properties — happens
    // when the sync-sheet pipeline rewrites slugs) return a clean 404 instead
    // of crashing into a 5xx. Google Search Console was flagging ~12 URLs as
    // "Server error (5xx)" for exactly this reason — old slugs that got
    // renamed since the page was last crawled.
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .eq('slug', params.slug)
      .maybeSingle();

    if (propErr || !property) return { notFound: true };

    // Hidden/sold rows must never render publicly (19 Jul incident): only
    // Live / for_sale get a page. `revalidate` lets the page reappear
    // automatically if the status goes back to Live.
    if (!['Live', 'for_sale'].includes(property.status)) {
      return { notFound: true, revalidate: 3600 };
    }

    const prop = {
      ...property,
      driveUrl: property.drive_url,
      dateAdded: property.date_added,
    };

    // Enhanced sections (tab bar, Look inside + 3D tour, Co-ownership,
    // Financing) render on Pacaso-partner listings only (Dylan, 20 Jul 2026).
    // Computed HERE, server-side, and passed as a plain boolean so the
    // partner name itself never reaches the client.
    const showEnhancedSections = property.partner === 'pacaso';

    // Partner-agnostic mandate: partner identity must never reach the
    // browser. The rendered page never shows it, but getStaticProps props are
    // serialised into __NEXT_DATA__ verbatim — so strip the partner fields
    // and any raw scraped/AI text variants that may mention the partner.
    delete prop.partner;
    delete prop.partner_url;
    delete prop.notes;
    delete prop.description_scraped;
    delete prop.description_original;
    delete prop.description_ai;
    delete prop.description_ai_es;
    delete prop.description_ai_fr;
    delete prop.description_ai_de;

    // Similar homes — COP's own catalog only, never a partner feed:
    // same country (same region preferred), price within ±30%, Live/for_sale,
    // current property excluded, max 3. Best-effort: if it errors we render
    // the page with an empty similar list instead of breaking the whole page.
    let similar = [];
    try {
      const { data: similarRaw } = await supabase
        .from('properties')
        .select('slug, title, title_es, title_fr, title_de, img, images, price, currency, share_denominator, country, region, city, beds, size, status')
        .eq('country', property.country)
        .neq('slug', property.slug)
        .in('status', ['Live', 'for_sale'])
        .limit(200);
      const basePrice = Number(property.price) > 0 ? Number(property.price) : null;
      const candidates = (similarRaw || [])
        // ±30% price band (skipped when the current home has no price)
        .filter(c => !basePrice || (Number(c.price) > 0
          && Number(c.price) >= basePrice * 0.7
          && Number(c.price) <= basePrice * 1.3))
        // Same region first, then closest by price
        .sort((a, b) => {
          const aRegion = property.region && a.region === property.region ? 0 : 1;
          const bRegion = property.region && b.region === property.region ? 0 : 1;
          if (aRegion !== bRegion) return aRegion - bRegion;
          if (!basePrice) return 0;
          return Math.abs(Number(a.price) - basePrice) - Math.abs(Number(b.price) - basePrice);
        });
      similar = candidates.slice(0, 3).map(p => ({
        slug: p.slug,
        title: p.title,
        title_es: p.title_es || null,
        title_fr: p.title_fr || null,
        title_de: p.title_de || null,
        img: p.img || null,
        images: Array.isArray(p.images) ? p.images.slice(0, 3) : [],
        price: p.price || null,
        currency: p.currency || 'EUR',
        share_denominator: p.share_denominator || null,
        country: p.country || null,
        region: p.region || null,
        city: p.city || null,
        beds: p.beds || null,
        size: p.size || null,
        status: p.status || null,
        driveUrl: null, // no gallery-lock slide on similar cards
      }));
    } catch (_) {
      similar = [];
    }

    return { props: { property: prop, similar, showEnhancedSections }, revalidate: 3600 };
  } catch (err) {
    // Any unexpected error → 404, never let it become a 5xx.
    console.error(`property/[slug] getStaticProps failed for "${params.slug}":`, err);
    return { notFound: true };
  }
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency, locale = 'en-GB') { return `${SYM[currency] || currency}${price.toLocaleString(locale)}`; }
function fmtApprox(amount, locale = 'en-GB') {
  return (Math.round(amount / 1_000) * 1_000).toLocaleString(locale);
}
const SITE_URL = 'https://co-ownership-property.com';
const PROPERTY_HREFLANG_LOCALES = ['en', 'es', 'fr', 'de'];

function propertyPathForLocale(slug, locale) {
  if (locale === 'es') return `/es/propiedades/${slug}/`;
  if (locale === 'fr') return `/fr/proprietes/${slug}/`;
  if (locale === 'de') return `/de/immobilien/${slug}/`;
  return `/property/${slug}/`;
}

// Given a property record and a target locale, return the best title /
// description / amenities — translated where available, English fallback.
function localizedFields(p, locale) {
  return {
    title:       p[`title_${locale}`]       || p.title       || '',
    description: p[`description_${locale}`] || p.description || '',
    amenities:   (Array.isArray(p[`amenities_${locale}`]) && p[`amenities_${locale}`].length)
                   ? p[`amenities_${locale}`]
                   : (p.amenities || []),
  };
}

function Img({ src, alt, loading = 'lazy', priority = false, sizes = '100vw' }) {
  return (
    <NextImage
      src={src || '/images/placeholder.jpg'}
      alt={alt || ''}
      fill
      quality={90}
      loading={priority ? 'eager' : loading}
      priority={priority}
      sizes={sizes}
      style={{ objectFit: 'cover' }}
    />
  );
}

/* ── Enquiry form (locale-aware) ── */
function EnquiryForm({ propertyTitle, propertyUrl, locale }) {
  const t = COPY[locale] || COPY.en;
  const saved = getSavedUser();
  const [f, setF] = useState({ name: saved.name, email: saved.email, phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    try {
      const r = await fetch('/api/enquiry/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, property: propertyTitle, url: propertyUrl, locale, [HONEYPOT_FIELD]: honeypot }) });
      if (r.ok) {
        saveUser({ name: f.name, email: f.email });
        trackConversion('generate_lead', 'Lead', {
          event_category: 'property_enquiry',
          property_title: propertyTitle,
          locale,
        });
        track('enquiry_submitted', {
          source: 'property_page',
          property: propertyTitle,
          url: propertyUrl,
          locale,
        });
      }
      setStatus(r.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  }

  if (status === 'done') return (
    <div className="eq-done"><span className="eq-tick">✓</span><p>{t.eq_thanks(f.name)}</p></div>
  );

  const fields = [
    ['name',  t.eq_name,  'text',  t.eq_name_ph,  true],
    ['email', t.eq_email, 'email', t.eq_email_ph, true],
    ['phone', t.eq_phone, 'tel',   t.eq_phone_ph, true],
  ];

  return (
    <form onSubmit={submit} className="eq-form">
      <HoneypotField />
      {fields.map(([k, label, type, ph, req]) => (
        <div key={k} className="eq-field">
          <label>{label}{req ? ' *' : ''}</label>
          <input type={type} placeholder={ph} value={f[k]} onChange={set(k)} required={req} />
        </div>
      ))}
      <div className="eq-field">
        <label>{t.eq_msg}</label>
        <textarea rows={4} placeholder={t.eq_msg_ph} value={f.message} onChange={set('message')} />
      </div>
      <button type="submit" className="eq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? t.eq_sending : t.eq_send}
      </button>
      {status === 'error' && <p className="eq-err">{t.eq_err}</p>}
    </form>
  );
}

/* ── Main page ── */
export default function PropertyPage({ property: p, similar, showEnhancedSections = false, forceLocale = null }) {
  const router = useRouter();
  // forceLocale wins for SSG'd /es/propiedades/[slug] and /fr/proprietes/[slug]
  // wrappers — those pages know their locale at build time. For the canonical
  // /property/[slug] route, fall back to URL path detection then cookie.
  const detected = useLocaleFromCookie(localeFromPath(router.asPath || router.pathname));
  const locale = forceLocale || detected;
  const t = COPY[locale] || COPY.en;
  const localeNumberFmt = locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-GB';

  const local = localizedFields(p, locale);

  const [showUnlock, setShowUnlock] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const cx = useCurrency();
  const [amenExpanded, setAmenExpanded] = useState(false);
  const heroImg = p.img || p.images?.[0] || '/images/placeholder.jpg';
  const galleryTotal = Array.isArray(p.photos) && p.photos.length > 0
    ? p.photos.length + (Array.isArray(p.extra_photos) ? p.extra_photos.length : 0)
    : (p.total_images || p.images.length);
  const missingCount = galleryTotal;
  const descParas = local.description ? local.description.split('\n').filter(Boolean) : [];
  const descVisible = descExpanded ? descParas : descParas.slice(0, 2);
  const descHasMore = descParas.length > 2;
  const touchStartX = useRef(null);

  useEffect(() => {
    setSaved(isFav(p.slug));
    return onFavsChange((slugs) => setSaved(slugs.includes(p.slug)));
  }, [p.slug]);

  useEffect(() => {
    fbqEvent('ViewContent', {
      content_ids:  [p.slug],
      content_type: 'product',
      content_name: local.title,
      ...(p.price    && { value: p.price }),
      ...(p.currency && { currency: p.currency }),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.slug]);

  function toggleSave() {
    const nowSaved = toggleFav(p.slug);
    setSaved(nowSaved);
    track(nowSaved ? 'favourite_added' : 'favourite_removed', {
      property: local.title,
      slug: p.slug,
    });
  }

  const mobileSlides = [
    ...(p.images.slice(0, 3).map((img, i) => ({ type: 'img', src: img, idx: i }))),
    { type: 'lock' },
  ];

  // ── SEO meta (always English on initial render — see useLocaleFromCookie note) ──
  const propStyle   = (p.property_style || p.property_type || 'property').toLowerCase();
  const propLocation = [p.city || p.region, p.country].filter(Boolean).join(', ');
  const metaDesc = p.price
    ? `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership at ${fmt(p.price, p.currency)}. Real deeded ownership, own only what you use.`
    : `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership. Real deeded ownership, own only what you use.`;
  // Canonical URL per locale — wrapper routes pass forceLocale so each
  // translated property URL has its own canonical.
  const canonicalPath = propertyPathForLocale(p.slug, locale);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImage = p.img && p.img.startsWith('http') ? p.img : `${SITE_URL}${p.img}`;

  return (
    <>
      <Head>
        <title>{`${local.title} | Co-Ownership Property`}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {PROPERTY_HREFLANG_LOCALES.map(hrefLocale => (
          <link
            key={hrefLocale}
            rel="alternate"
            hrefLang={hrefLocale}
            href={`${SITE_URL}${propertyPathForLocale(p.slug, hrefLocale)}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${propertyPathForLocale(p.slug, 'en')}`} />
        <meta property="og:title" content={`${local.title} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${local.title} | Co-Ownership Property`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImage} />
        {/* ── Schema.org entity graph ─────────────────────────────────────
            RealEstateListing (the offering) + Accommodation (the underlying
            place) + BreadcrumbList. Cross-linked via @id so AI engines see
            one coherent entity. Adds bathrooms, geo, amenities, availability,
            and a mentions link to the country pillar — fields that were
            missing in the previous minimal RealEstateListing block. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "RealEstateListing",
              "@id": canonicalUrl + "#listing",
              "name": p.title,
              "description": metaDesc,
              "url": canonicalUrl,
              "image": (p.images && p.images.length > 0) ? p.images.slice(0, 12) : [ogImage],
              "datePosted": p.dateAdded || undefined,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": p.city || p.region || undefined,
                "addressRegion": p.region || undefined,
                "addressCountry": p.country || undefined,
              },
              "geo": (typeof p.lat === "number" && typeof p.lng === "number") ? {
                "@type": "GeoCoordinates",
                "latitude": p.lat,
                "longitude": p.lng,
              } : undefined,
              "numberOfRooms": p.beds || undefined,
              "numberOfBedrooms": p.beds || undefined,
              "numberOfBathroomsTotal": p.baths || undefined,
              "numberOfFullBathrooms": p.baths || undefined,
              "floorSize": p.size > 0 ? { "@type": "QuantitativeValue", "value": p.size, "unitCode": "MTK" } : undefined,
              "amenityFeature": (Array.isArray(p.amenities) && p.amenities.length > 0)
                ? p.amenities.map(a => ({ "@type": "LocationFeatureSpecification", "name": a, "value": true }))
                : undefined,
              "accommodationCategory": "Fractional ownership — 1/8 deeded share",
              "mainEntityOfPage": canonicalUrl,
              "offers": p.price ? {
                "@type": "Offer",
                "url": canonicalUrl,
                "price": p.price,
                "priceCurrency": p.currency || "EUR",
                "availability": p.status === "Live"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                "itemOffered": { "@id": canonicalUrl + "#accommodation" },
                "seller": { "@id": "https://co-ownership-property.com/#organization" },
              } : undefined,
              "mentions": (p.country) ? [{
                "@type": "Place",
                "name": p.country,
                "url": `https://co-ownership-property.com/${p.country.toLowerCase().replace(/\s+/g, "-")}-fractional-ownership-properties/`,
              }] : undefined,
            },
            {
              "@type": "Accommodation",
              "@id": canonicalUrl + "#accommodation",
              "name": p.title,
              "description": metaDesc,
              "image": (p.images && p.images.length > 0) ? p.images.slice(0, 12) : [ogImage],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": p.city || p.region || undefined,
                "addressRegion": p.region || undefined,
                "addressCountry": p.country || undefined,
              },
              "geo": (typeof p.lat === "number" && typeof p.lng === "number") ? {
                "@type": "GeoCoordinates",
                "latitude": p.lat,
                "longitude": p.lng,
              } : undefined,
              "numberOfBedrooms": p.beds || undefined,
              "numberOfBathroomsTotal": p.baths || undefined,
              "floorSize": p.size > 0 ? { "@type": "QuantitativeValue", "value": p.size, "unitCode": "MTK" } : undefined,
              "amenityFeature": (Array.isArray(p.amenities) && p.amenities.length > 0)
                ? p.amenities.map(a => ({ "@type": "LocationFeatureSpecification", "name": a, "value": true }))
                : undefined,
              "accommodationCategory": "Fractional ownership — 1/8 deeded share",
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://co-ownership-property.com/" },
                { "@type": "ListItem", "position": 2, "name": "Our Homes", "item": "https://co-ownership-property.com/our-homes/" },
                ...(p.country ? [{ "@type": "ListItem", "position": 3, "name": p.country, "item": `https://co-ownership-property.com/${p.country.toLowerCase().replace(/\s+/g, "-")}-fractional-ownership-properties/` }] : []),
                { "@type": "ListItem", "position": p.country ? 4 : 3, "name": p.title, "item": canonicalUrl },
              ]
            }
          ]
        }) }} />
      </Head>

      <Header />

      {/* ── Mobile carousel ── */}
      <div
        className="pp-mob-carousel"
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 40) setMobileSlide(s => Math.min(s + 1, mobileSlides.length - 1));
          else if (diff < -40) setMobileSlide(s => Math.max(s - 1, 0));
          touchStartX.current = null;
        }}
      >
        <button className={`pp-heart-btn${saved ? ' saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from favourites' : 'Save property'}>
          {saved
            ? <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          }
        </button>
        <div className="pp-mob-track" style={{ transform: `translateX(${-mobileSlide * 100}%)` }}>
          {mobileSlides.map((slide, i) =>
            slide.type === 'img' ? (
              <div key={i} className="pp-mob-slide" onClick={() => setLightbox(slide.idx)}>
                <Img src={slide.src} alt={`${local.title} ${i + 1}`} priority={i === 0} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ) : (
              <div key={i} className="pp-mob-slide pp-mob-lock" onClick={() => setShowUnlock(true)}>
                <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span className="pp-mob-lock-title">{t.missing_photos(missingCount)}</span>
                <span className="pp-mob-lock-sub">{t.unlock_sub}</span>
                <span className="pp-mob-lock-btn">{t.unlock_now}</span>
              </div>
            )
          )}
        </div>
        {mobileSlide > 0 && (
          <button className="pp-mob-arrow pp-mob-prev" onClick={() => setMobileSlide(s => s - 1)}>&#8249;</button>
        )}
        {mobileSlide < mobileSlides.length - 1 && (
          <button className="pp-mob-arrow pp-mob-next" onClick={() => setMobileSlide(s => s + 1)}>&#8250;</button>
        )}
        <div className="pp-mob-dots">
          {mobileSlides.map((_, i) => (
            <button key={i} className={`pp-mob-dot${i === mobileSlide ? ' active' : ''}`} onClick={() => setMobileSlide(i)} />
          ))}
        </div>
      </div>

      {/* ── Desktop gallery ── */}
      <div className="pp-gallery">
        <button className={`pp-heart-btn${saved ? ' saved' : ''}`} onClick={toggleSave} aria-label={saved ? 'Remove from favourites' : 'Save property'}>
          {saved
            ? <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          }
        </button>
        <div className="pp-gallery-hero" onClick={() => setLightbox(0)}>
          <Img src={heroImg} alt={local.title} priority sizes="(max-width: 960px) 67vw, 75vw" />
        </div>
        <div className="pp-gallery-thumb" onClick={() => p.images[1] && setLightbox(1)}>
          {p.images[1] ? <Img src={p.images[1]} alt={`${local.title} 2`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        <div className="pp-gallery-thumb" onClick={() => p.images[2] && setLightbox(2)}>
          {p.images[2] ? <Img src={p.images[2]} alt={`${local.title} 3`} sizes="(max-width: 960px) 33vw, 25vw" /> : <div className="pp-gallery-blank" />}
        </div>
        <div className="pp-gallery-lock" onClick={() => setShowUnlock(true)}>
          <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
          <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="pp-lock-title">{t.missing_photos(missingCount)}</span>
          <span className="pp-lock-sub">{t.unlock_sub}</span>
          <span className="pp-lock-cta-btn">{t.unlock_now}</span>
        </div>
      </div>

      {/* ── Anchor tabs (Pacaso listings only) ── */}
      {showEnhancedSections && (
      <nav className="pp-tabs" aria-label="Property sections">
        <a href="#overview" className="pp-tab">{t.tab_overview}</a>
        <a href="#look-inside" className="pp-tab">{t.tab_look}</a>
        {local.amenities.length > 0 && <a href="#amenities" className="pp-tab">{t.tab_amenities}</a>}
        {(p.lat || p.city) && <a href="#location" className="pp-tab">{t.tab_location}</a>}
        <a href="#co-ownership" className="pp-tab">{t.tab_coown}</a>
        {Number(p.price) > 0 && <a href="#financing" className="pp-tab">{t.tab_fin}</a>}
      </nav>
      )}

      {/* ── Content ── */}
      <div className="pp-content" id="overview">
        <div className="pp-left">

          <div className="pp-price-row">
            <span className="pp-price" title={p.price && cx && convertPrice(p.price, p.currency || 'EUR', cx) != null ? `Listed at ${fmt(p.price, p.currency)}` : undefined}>
              {(() => {
                const fromCcy = p.currency || 'EUR';
                const converted = p.price ? convertPrice(p.price, fromCcy, cx) : null;
                if (converted != null) {
                  const sym = CURRENCY_SYMBOLS[cx.currency] || cx.currency;
                  return `~${sym}${fmtApprox(converted, localeNumberFmt)}`;
                }
                return p.price ? fmt(p.price, fromCcy, localeNumberFmt) : null;
              })()}
            </span>
            {p.price > 0 && (
              <span className="pp-price-qualifier">{t.price_qualifier(p.share_denominator || 8)}</span>
            )}
            {p.status && String(p.status).toLowerCase().includes('sold') && (
              <span className="pp-badge pp-badge-sold-out">Sold Out</span>
            )}
            <span className="pp-badge">{t.cobadge(p.share_denominator || 8)}</span>
          </div>

          <nav className="pp-crumb">
            {[p.city, p.region, p.country].filter(Boolean).map((c, i, arr) => (
              <span key={i}>{c}{i < arr.length - 1 && <span className="pp-crumb-sep"> · </span>}</span>
            ))}
          </nav>

          <h1 className="pp-title">{local.title}</h1>

          <div className="pp-stats">
            {p.beds > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.beds}</span><span className="pp-stat-lbl">{t.bedrooms}</span></div>}
            {p.baths > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.baths}</span><span className="pp-stat-lbl">{t.bathrooms}</span></div>}
            {p.size > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.size} m²</span><span className="pp-stat-lbl">{t.total_size}</span></div>}
            <div className="pp-stat"><span className="pp-stat-val">{t.days_label(p.share_denominator || 8)}</span><span className="pp-stat-lbl">{t.per_year}</span></div>
            <div className="pp-stat"><span className="pp-stat-val">1/{p.share_denominator || 8}</span><span className="pp-stat-lbl">{t.share_size}</span></div>
            <a
              href="#property-enquiry"
              className="pp-stat pp-contact-stat"
              onClick={() => track('property_contact_cta_click', { property: local.title, slug: p.slug, locale })}
            >
              <span className="pp-stat-val pp-contact-stat-val">{t.contact_cta}</span>
              <span className="pp-stat-lbl">{t.contact_sub}</span>
            </a>
          </div>

          <div className="pp-desc">
            <h2 className="pp-heading">{t.about_heading}</h2>
            {local.description ? (
              <>
                {descVisible.map((para, i) => {
                  const parts = para.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  );
                })}
                {descHasMore && (
                  <button className="pp-seemore" onClick={() => setDescExpanded(v => !v)}>
                    {descExpanded ? t.show_less : t.read_more}
                  </button>
                )}
              </>
            ) : <p className="pp-desc-empty">{t.desc_empty}</p>}
          </div>

          {/* ── Look inside: gallery + 3D tour request (no tour is ever
                 embedded or linked — the team sends it by email).
                 Pacaso listings only. ── */}
          {showEnhancedSections && (
          <div className="pp-look" id="look-inside">
            <h2 className="pp-heading">{t.look_heading}</h2>
            <p className="pp-look-sub">{t.look_sub}</p>
            <div className="pp-look-actions">
              <button type="button" className="pp-look-btn" onClick={() => setLightbox(0)}>
                {t.look_gallery_btn}
              </button>
              <button
                type="button"
                className="pp-look-btn pp-look-btn-tour"
                onClick={() => {
                  setShowTour(true);
                  track('tour_request_opened', { property: local.title, slug: p.slug, locale });
                }}
              >
                {t.tour_btn}
              </button>
            </div>
          </div>
          )}

          {local.amenities.length > 0 && (
            <div className={`pp-amenities${amenExpanded ? ' expanded' : ''}`} id="amenities">
              <h2 className="pp-heading">{t.amenities_heading}</h2>
              <ul className="pp-amenity-list">
                {local.amenities.map((a, i) => (
                  <li key={i} className={`pp-amenity-item${i >= 6 ? ' pp-amenity-extra' : ''}`}>
                    <span className="pp-amenity-dot"></span>{a}
                  </li>
                ))}
              </ul>
              {local.amenities.length > 6 && (
                <button className="pp-seemore" onClick={() => setAmenExpanded(v => !v)}>
                  {amenExpanded ? t.show_less : t.all_amenities(local.amenities.length)}
                </button>
              )}
            </div>
          )}

          {(p.lat || p.city) && (
            <div className="pp-location-section" id="location">
              <h2 className="pp-heading">{t.location_heading}</h2>
              <p className="pp-location-text">{[p.city, p.region, p.country].filter(Boolean).join(', ')}</p>
              {p.lat && p.lng && (
                <div className="pp-map-wrap">
                  <iframe
                    title="Property location"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${p.lat},${p.lng}`)}&z=13&output=embed`}
                    width="100%" height="280" style={{ border: 0, display: 'block' }} loading="lazy" allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Co-ownership: how the model works (Pacaso listings only) ── */}
          {showEnhancedSections && (
          <div className="pp-coown" id="co-ownership">
            <h2 className="pp-heading">{t.coown_heading}</h2>
            <ul className="pp-coown-list">
              {t.coown_points(p.share_denominator || 8, Math.floor(365 / (p.share_denominator || 8))).map(([pointTitle, pointText], i) => (
                <li key={i} className="pp-coown-item">
                  <strong>{pointTitle}</strong>
                  <span>{pointText}</span>
                </li>
              ))}
            </ul>
          </div>
          )}

          {/* ── Financing calculator — COP's own widget, generic maths, no
                 partner claims. Pacaso listings only. ── */}
          {showEnhancedSections && Number(p.price) > 0 && (
            <div className="pp-financing" id="financing">
              <FinancingCalculator
                sharePrice={Number(p.price)}
                currency={p.currency || 'EUR'}
                shareDenominator={p.share_denominator || 8}
                locale={locale}
              />
            </div>
          )}

        </div>{/* /pp-left */}

        <div className="pp-right" id="property-enquiry">
          <div className="pp-form-card">
            <p className="pp-form-eye">{t.form_eye}</p>
            <h3 className="pp-form-title">{t.form_title}</h3>
            <p className="pp-form-sub">{t.form_sub}</p>
            <EnquiryForm propertyTitle={local.title} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} locale={locale} />
          </div>
        </div>

        {(() => {
          // Country pillar URL — every country in the dataset has a matching
          // /{slug}-fractional-ownership-properties/ pillar in EN. Locale
          // variants exist patchily, so always link to the EN canonical
          // pillar; visitors land somewhere coherent and AI crawlers (which
          // mostly index EN) get a clean upward link from property → pillar.
          const pillarSlug = p.country ? p.country.toLowerCase().replace(/\s+/g, '-') : null;
          const pillarHref = pillarSlug ? `/${pillarSlug}-fractional-ownership-properties/` : null;
          if (!pillarHref && similar.length === 0) return null;
          return (
            <div className="pp-similar">
              {similar.length > 0 && (
                <>
                  <h2 className="pp-heading">{t.similar_heading(p.country)}</h2>
                  <div className="pp-similar-grid">
                    {similar.map(s => (
                      <PropertyCard key={s.slug} property={s} />
                    ))}
                  </div>
                </>
              )}
              {pillarHref && (
                <p className="pp-pillar-link">
                  <a href={pillarHref}>{t.pillar_link(p.country)}</a>
                </p>
              )}
            </div>
          );
        })()}

      </div>{/* /pp-content */}

      {lightbox !== null && (() => {
        const lbImages = p.images.slice(0, 3);
        const total = lbImages.length + 1;
        const isLockSlide = lightbox >= lbImages.length;
        return (
          <div className="pp-lb" onClick={() => setLightbox(null)}>
            <button className="pp-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
            <button className="pp-lb-prev" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + total) % total); }} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 6 9 12 15 18"/>
              </svg>
            </button>
            {isLockSlide ? (
              <div className="pp-lb-lock" onClick={e => { e.stopPropagation(); setLightbox(null); setShowUnlock(true); }}>
                <div className="pp-lb-lock-blur" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,marginBottom:12,color:'#fff'}}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span className="pp-lb-lock-title">{t.missing_photos(missingCount)}</span>
                <span className="pp-lb-lock-sub">{t.unlock_sub}</span>
                <span className="pp-lb-lock-btn">{t.unlock_now}</span>
              </div>
            ) : (
              <img src={lbImages[lightbox]} alt={local.title} onClick={e => e.stopPropagation()} />
            )}
            <button className="pp-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % total); }} aria-label="Next photo">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18"/>
              </svg>
            </button>
            <span className="pp-lb-count">{lightbox + 1} / {total}</span>
          </div>
        );
      })()}

      {showUnlock && <UnlockModal propertyTitle={local.title} driveUrl={p.driveUrl} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} onClose={() => setShowUnlock(false)} />}
      {showEnhancedSections && showTour && (
        <TourRequestModal
          propertyTitle={local.title}
          propertySlug={p.slug}
          propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`}
          propertyCountry={p.country || null}
          onClose={() => setShowTour(false)}
        />
      )}

      <Newsletter />
      <Footer />
    </>
  );
}
