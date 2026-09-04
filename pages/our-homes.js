import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import { track } from '@vercel/analytics';
import { localeFromPath, localeColumns, pickLocalized, ogLocaleFor } from '@/lib/i18n';

/** Fisher-Yates shuffle — runs once at build time for a stable random order */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Parse a date_added value into a sortable timestamp; missing/bad dates sort last. */
function dateVal(d) {
  const t = d ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: raw, error } = await supabase
    .from('properties')
    .select(`slug, ${localeColumns(['title'])}, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type, date_added, is_discreet`)
    // Public listings: hidden & staged rows must never render (19 Jul incident).
    // Sold homes DO stay in the catalogue — PropertyCard puts the Sold Out
    // banner across the photo — but they are pushed to the end of the grid
    // below, so live inventory always leads.
    .in('status', ['Live', 'for_sale', 'sold']);

  if (error) {
    console.error('Supabase error (our-homes):', error);
    // Keep serving the previous ISR page during a transient database outage.
    // Returning [] here poisons the cache with an apparently empty catalogue.
    throw new Error('Unable to refresh the property catalogue from Supabase');
  }

  const isSold = p => String(p.status || '').toLowerCase().includes('sold');
  // Shuffle live and sold independently, then concatenate: the grid stays
  // randomised on each build, but a sold home never takes a top slot.
  const ordered = [
    ...shuffle((raw || []).filter(p => !isSold(p))),
    ...shuffle((raw || []).filter(isSold)),
  ];

  const allProperties = (ordered.map(p => ({
    slug:     p.slug,
    title:    p.title,
    // Translated titles flow straight through; PropertyCard picks the right
    // one based on its own locale detection (router or cookie).
    ...pickLocalized(p, ['title']),
    img:      p.img,
    images:      (p.images || []).slice(0, 3),
    totalImages: p.is_discreet ? 1 : (p.total_images || 0),
    driveUrl:    p.is_discreet ? null : (p.drive_url || null),
    price:    p.price    || null,
    currency: p.currency || 'EUR',
    share_denominator: p.share_denominator || null,
    country:  p.country  || '',
    region:   p.region   || '',
    city:     p.city     || '',
    beds:     p.beds     || 0,
    size:     p.size     || 0,
    label:         p.is_discreet ? 'Private Sale' : '',
    status:        p.status        || '',
    property_type: p.property_type || '',
    dateAdded:     p.date_added    || null,
  })));

  return { props: { allProperties }, revalidate: 3600 };
}

// Fixed top-country order
const TOP_COUNTRIES = ['France', 'Spain', 'USA', 'Italy'];
const COUNTRY_FLAGS = {
  France: '🇫🇷', Spain: '🇪🇸', USA: '🇺🇸', Italy: '🇮🇹',
  Mexico: '🇲🇽', Germany: '🇩🇪', Austria: '🇦🇹', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Croatia: '🇭🇷', Portugal: '🇵🇹', Sweden: '🇸🇪',
};

// France: map raw region values → cluster label
const FRANCE_CLUSTERS = [
  { label: 'Paris',           regions: ['Paris'] },
  { label: 'South of France', regions: ["Côte d'Azur"] },
  { label: 'French Alps',     regions: ['French Alps', 'Portes du Soleil'] },
];

/** Return the France cluster label for a raw region string, or null */
function franceCluserLabel(region) {
  for (const c of FRANCE_CLUSTERS) {
    if (c.regions.includes(region)) return c.label;
  }
  return null;
}

// Locale-aware UI strings for the listings page (filters, sort, results count,
// alert modal). Keeps a single URL (/our-homes/) — locale is detected from the
// cop_locale cookie set by middleware (or from the URL path if the visitor
// lands directly on a locale-prefixed route in future).
const COPY = {
  en: {
    title_tag: 'All Our Homes | Co-Ownership Property',
    meta_desc: 'Browse all our luxury co-ownership properties worldwide. Filter by destination, region and price.',
    eyebrow: 'Worldwide Collection',
    h1: 'All Our Homes',
    sub: "Handpicked luxury co-ownership properties across Europe, the USA and beyond — find the home that's right for you.",
    label_country: 'Country', label_region: 'Region', label_sort: 'Sort',
    all: 'All', other: 'Other',
    sort_newest: 'Newest', sort_asc: 'Price ↑ Low', sort_desc: 'Price ↓ High',
    clear: '✕ Clear', clear_filters: 'Clear filters',
    get_alerts: 'Get property alerts',
    showing: 'Showing', of: 'of',
    property_singular: 'property', property_plural: 'properties',
    load_more: (n) => `Load more (${n} remaining)`,
    no_results: 'No properties match your filters.',
    alert_eye: 'Property Alerts',
    alert_heading: 'Be the first to know',
    alert_sub: "Tell us what you're looking for. The moment a new matching property is added to the site, you'll be the first to know.",
    alert_destinations: 'Destinations', alert_optional: '(optional)',
    alert_max_budget: 'Max Budget', alert_any_budget: 'Any budget',
    alert_under_100: 'Under €100,000', alert_up_to: 'Up to', alert_over_1m: '€1,000,000+',
    alert_name_ph: 'Your name (optional)', alert_email_ph: 'Your email address *',
    alert_phone_ph: 'Phone number (optional)',
    alert_save: 'Save Alert →', alert_saving: 'Saving…',
    alert_saved: 'Alert saved!',
    alert_saved_msg: "We'll email you at",
    alert_saved_msg_2: 'as soon as a matching property is listed.',
    alert_error: 'Something went wrong. Please try again.',
    country_spain: 'Spain', country_france: 'France', country_usa: 'USA', country_italy: 'Italy',
    // Region/country labels for the dynamic filter chips. Keys are the raw
    // English values stored in the DB; values are the displayed translations.
    // English locale uses identity (returns the key itself).
    region_labels: {},
    // Country headers in the alert-modal destination tree.
    alert_dest_countries: {
      Spain: 'Spain', France: 'France', Italy: 'Italy', USA: 'USA',
      'United Kingdom': 'United Kingdom', Other: 'Other',
    },
    alert_dest_children: {},
  },
  es: {
    title_tag: 'Todas nuestras propiedades | Co-Ownership Property',
    meta_desc: 'Explora todas nuestras propiedades en copropiedad de lujo. Filtra por destino, región y precio.',
    eyebrow: 'Colección mundial',
    h1: 'Todas nuestras propiedades',
    sub: 'Propiedades en copropiedad de lujo curadas a mano por Europa, EE. UU. y más allá — encuentra la que es perfecta para ti.',
    label_country: 'País', label_region: 'Región', label_sort: 'Ordenar',
    all: 'Todas', other: 'Otros',
    sort_newest: 'Más recientes', sort_asc: 'Precio ↑ Bajo', sort_desc: 'Precio ↓ Alto',
    clear: '✕ Limpiar', clear_filters: 'Limpiar filtros',
    get_alerts: 'Recibir alertas',
    showing: 'Mostrando', of: 'de',
    property_singular: 'propiedad', property_plural: 'propiedades',
    load_more: (n) => `Ver más (${n} restantes)`,
    no_results: 'Ninguna propiedad coincide con tus filtros.',
    alert_eye: 'Alertas de propiedades',
    alert_heading: 'Sé el primero en enterarte',
    alert_sub: 'Cuéntanos lo que buscas. En cuanto añadamos una propiedad que coincida, serás el primero en saberlo.',
    alert_destinations: 'Destinos', alert_optional: '(opcional)',
    alert_max_budget: 'Presupuesto máximo', alert_any_budget: 'Cualquier presupuesto',
    alert_under_100: 'Menos de €100.000', alert_up_to: 'Hasta', alert_over_1m: '€1.000.000+',
    alert_name_ph: 'Tu nombre (opcional)', alert_email_ph: 'Tu correo electrónico *',
    alert_phone_ph: 'Teléfono (opcional)',
    alert_save: 'Guardar alerta →', alert_saving: 'Guardando…',
    alert_saved: '¡Alerta guardada!',
    alert_saved_msg: 'Te avisaremos en',
    alert_saved_msg_2: 'en cuanto añadamos una propiedad que coincida.',
    alert_error: 'Algo salió mal. Inténtalo de nuevo.',
    country_spain: 'España', country_france: 'Francia', country_usa: 'EE. UU.', country_italy: 'Italia',
    region_labels: {
      // France
      'Paris': 'París',
      'South of France': 'Sur de Francia',
      "Côte d'Azur": 'Costa Azul',
      'French Alps': 'Alpes franceses',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Islas Canarias',
      // Italy
      'Italian Lakes': 'Lagos italianos', 'Lake Como': 'Lago de Como', 'Lake Garda': 'Lago de Garda',
      'Lago Maggiore': 'Lago Mayor', 'Liguria': 'Liguria', 'Sardinia': 'Cerdeña',
      // USA states
      'California': 'California', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'Londres', 'England': 'Inglaterra',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Austria', 'Croatia': 'Croacia', 'Germany': 'Alemania',
      'Mexico': 'México', 'Portugal': 'Portugal', 'Sweden': 'Suecia',
    },
    alert_dest_countries: {
      Spain: 'España', France: 'Francia', Italy: 'Italia', USA: 'EE. UU.',
      'United Kingdom': 'Reino Unido', Other: 'Otros',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Islas Canarias',
      'South of France': 'Sur de Francia', 'French Alps': 'Alpes franceses', 'Paris': 'París',
      'Italian Lakes': 'Lagos italianos', 'Sardinia': 'Cerdeña', 'Liguria': 'Liguria',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'California', 'Utah': 'Utah',
      'London': 'Londres', 'England': 'Inglaterra',
      'Austria': 'Austria', 'Croatia': 'Croacia', 'Germany': 'Alemania',
      'Mexico': 'México', 'Portugal': 'Portugal', 'Sweden': 'Suecia',
    },
  },
  fr: {
    title_tag: 'Tous nos biens | Co-Ownership Property',
    meta_desc: 'Parcourez tous nos biens de prestige en copropriété. Filtrez par destination, région et prix.',
    eyebrow: 'Collection mondiale',
    h1: 'Tous nos biens',
    sub: "Les biens de prestige en copropriété sélectionnés par notre équipe à travers l'Europe, les États-Unis et au-delà — trouvez celui qui vous convient.",
    label_country: 'Pays', label_region: 'Région', label_sort: 'Trier',
    all: 'Toutes', other: 'Autre',
    sort_newest: 'Plus récents', sort_asc: 'Prix ↑ Bas', sort_desc: 'Prix ↓ Haut',
    clear: '✕ Effacer', clear_filters: 'Effacer les filtres',
    get_alerts: 'Recevoir des alertes',
    showing: 'Affichage de', of: 'sur',
    property_singular: 'bien', property_plural: 'biens',
    load_more: (n) => `Voir plus (${n} restants)`,
    no_results: 'Aucun bien ne correspond à vos filtres.',
    alert_eye: 'Alertes biens',
    alert_heading: 'Soyez le premier informé',
    alert_sub: "Dites-nous ce que vous cherchez. Dès qu'un bien correspondant est ajouté, vous serez le premier au courant.",
    alert_destinations: 'Destinations', alert_optional: '(optionnel)',
    alert_max_budget: 'Budget maximum', alert_any_budget: 'Tout budget',
    alert_under_100: 'Moins de 100 000 €', alert_up_to: "Jusqu'à", alert_over_1m: '1 000 000 €+',
    alert_name_ph: 'Votre nom (optionnel)', alert_email_ph: 'Votre adresse email *',
    alert_phone_ph: 'Téléphone (facultatif)',
    alert_save: "Enregistrer l'alerte →", alert_saving: 'Enregistrement…',
    alert_saved: 'Alerte enregistrée !',
    alert_saved_msg: 'Nous vous enverrons un email à',
    alert_saved_msg_2: "dès qu'un bien correspondant est ajouté.",
    alert_error: "Une erreur s'est produite. Veuillez réessayer.",
    country_spain: 'Espagne', country_france: 'France', country_usa: 'États-Unis', country_italy: 'Italie',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Sud de la France',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Alpes françaises',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Majorque', 'Ibiza': 'Ibiza', 'Menorca': 'Minorque', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelone', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Îles Canaries',
      // Italy
      'Italian Lakes': 'Lacs italiens', 'Lake Como': 'Lac de Côme', 'Lake Garda': 'Lac de Garde',
      'Lago Maggiore': 'Lac Majeur', 'Liguria': 'Ligurie', 'Sardinia': 'Sardaigne',
      // USA states
      'California': 'Californie', 'Colorado': 'Colorado', 'Florida': 'Floride', 'Utah': 'Utah',
      // UK
      'London': 'Londres', 'England': 'Angleterre',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Autriche', 'Croatia': 'Croatie', 'Germany': 'Allemagne',
      'Mexico': 'Mexique', 'Portugal': 'Portugal', 'Sweden': 'Suède',
    },
    alert_dest_countries: {
      Spain: 'Espagne', France: 'France', Italy: 'Italie', USA: 'États-Unis',
      'United Kingdom': 'Royaume-Uni', Other: 'Autre',
    },
    alert_dest_children: {
      'Mallorca': 'Majorque', 'Ibiza': 'Ibiza', 'Menorca': 'Minorque',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelone', 'Canary Islands': 'Îles Canaries',
      'South of France': 'Sud de la France', 'French Alps': 'Alpes françaises', 'Paris': 'Paris',
      'Italian Lakes': 'Lacs italiens', 'Sardinia': 'Sardaigne', 'Liguria': 'Ligurie',
      'Colorado': 'Colorado', 'Florida': 'Floride', 'California': 'Californie', 'Utah': 'Utah',
      'London': 'Londres', 'England': 'Angleterre',
      'Austria': 'Autriche', 'Croatia': 'Croatie', 'Germany': 'Allemagne',
      'Mexico': 'Mexique', 'Portugal': 'Portugal', 'Sweden': 'Suède',
    },
  },
  de: {
    title_tag: 'Alle unsere Immobilien | Co-Ownership Property',
    meta_desc: 'Stöbern Sie durch alle unsere Luxus-Miteigentumsimmobilien. Filtern Sie nach Reiseziel, Region und Preis.',
    eyebrow: 'Weltweite Auswahl',
    h1: 'Alle unsere Immobilien',
    sub: 'Sorgfältig ausgewählte Luxus-Ferienimmobilien im Miteigentum in ganz Europa, den USA und darüber hinaus — finden Sie das Zuhause, das zu Ihnen passt.',
    label_country: 'Land', label_region: 'Region', label_sort: 'Sortieren',
    all: 'Alle', other: 'Sonstige',
    sort_newest: 'Neueste', sort_asc: 'Preis ↑ Niedrig', sort_desc: 'Preis ↓ Hoch',
    clear: '✕ Zurücksetzen', clear_filters: 'Filter zurücksetzen',
    get_alerts: 'Benachrichtigungen erhalten',
    showing: 'Anzeige von', of: 'von',
    property_singular: 'Immobilie', property_plural: 'Immobilien',
    load_more: (n) => `Weitere anzeigen (noch ${n})`,
    no_results: 'Keine Immobilien entsprechen Ihren Filtern.',
    alert_eye: 'Immobilien-Benachrichtigungen',
    alert_heading: 'Erfahren Sie es als Erste(r)',
    alert_sub: 'Teilen Sie uns mit, wonach Sie suchen. Sobald eine passende Immobilie hinzugefügt wird, informieren wir Sie als Erste(n).',
    alert_destinations: 'Reiseziele', alert_optional: '(optional)',
    alert_max_budget: 'Maximalbudget', alert_any_budget: 'Beliebiges Budget',
    alert_under_100: 'Unter 100.000 €', alert_up_to: 'Bis zu', alert_over_1m: 'Über 1.000.000 €',
    alert_name_ph: 'Ihr Name (optional)', alert_email_ph: 'Ihre E-Mail-Adresse *',
    alert_phone_ph: 'Telefonnummer (optional)',
    alert_save: 'Benachrichtigung speichern →', alert_saving: 'Wird gespeichert…',
    alert_saved: 'Benachrichtigung gespeichert!',
    alert_saved_msg: 'Wir senden Ihnen eine E-Mail an',
    alert_saved_msg_2: ', sobald eine passende Immobilie verfügbar ist.',
    alert_error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    country_spain: 'Spanien', country_france: 'Frankreich', country_usa: 'USA', country_italy: 'Italien',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Südfrankreich',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Französische Alpen',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Teneriffa', 'Canary Islands': 'Kanarische Inseln',
      // Italy
      'Italian Lakes': 'Italienische Seen', 'Lake Como': 'Comer See', 'Lake Garda': 'Gardasee',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Ligurien', 'Sardinia': 'Sardinien',
      // USA states
      'California': 'Kalifornien', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'England',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Österreich', 'Croatia': 'Kroatien', 'Germany': 'Deutschland',
      'Mexico': 'Mexiko', 'Portugal': 'Portugal', 'Sweden': 'Schweden',
    },
    alert_dest_countries: {
      Spain: 'Spanien', France: 'Frankreich', Italy: 'Italien', USA: 'USA',
      'United Kingdom': 'Vereinigtes Königreich', Other: 'Sonstige',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Kanarische Inseln',
      'South of France': 'Südfrankreich', 'French Alps': 'Französische Alpen', 'Paris': 'Paris',
      'Italian Lakes': 'Italienische Seen', 'Sardinia': 'Sardinien', 'Liguria': 'Ligurien',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'Kalifornien', 'Utah': 'Utah',
      'London': 'London', 'England': 'England',
      'Austria': 'Österreich', 'Croatia': 'Kroatien', 'Germany': 'Deutschland',
      'Mexico': 'Mexiko', 'Portugal': 'Portugal', 'Sweden': 'Schweden',
    },
  },
  it: {
    title_tag: 'Tutte le nostre case | Co-Ownership Property',
    meta_desc: 'Sfoglia tutte le nostre case di lusso in comproprietà nel mondo. Filtra per destinazione, regione e prezzo.',
    eyebrow: 'Selezione mondiale',
    h1: 'Tutte le nostre case',
    sub: 'Case vacanze di lusso in comproprietà selezionate una a una in Europa, negli Stati Uniti e oltre — trova quella giusta per te.',
    label_country: 'Paese', label_region: 'Regione', label_sort: 'Ordina',
    all: 'Tutti', other: 'Altro',
    sort_newest: 'Più recenti', sort_asc: 'Prezzo ↑ crescente', sort_desc: 'Prezzo ↓ decrescente',
    clear: '✕ Azzera', clear_filters: 'Azzera i filtri',
    get_alerts: 'Ricevi gli avvisi',
    showing: 'Mostrati', of: 'di',
    property_singular: 'immobile', property_plural: 'immobili',
    load_more: (n) => `Mostra altri (ne restano ${n})`,
    no_results: 'Nessun immobile corrisponde ai tuoi filtri.',
    alert_eye: 'Avvisi immobiliari',
    alert_heading: 'Scoprilo prima degli altri',
    alert_sub: 'Dicci che cosa cerchi. Appena viene aggiunto al sito un immobile che corrisponde, sarai il primo a saperlo.',
    alert_destinations: 'Destinazioni', alert_optional: '(facoltativo)',
    alert_max_budget: 'Budget massimo', alert_any_budget: 'Qualsiasi budget',
    alert_under_100: 'Meno di € 100.000', alert_up_to: 'Fino a', alert_over_1m: 'Oltre € 1.000.000',
    alert_name_ph: 'Il tuo nome (facoltativo)', alert_email_ph: 'Il tuo indirizzo email *',
    alert_phone_ph: 'Numero di telefono (facoltativo)',
    alert_save: 'Salva l\'avviso →', alert_saving: 'Salvataggio…',
    alert_saved: 'Avviso salvato!',
    alert_saved_msg: 'Ti scriveremo a',
    alert_saved_msg_2: ', appena viene pubblicato un immobile che corrisponde.',
    alert_error: 'Si è verificato un errore. Riprova.',
    country_spain: 'Spagna', country_france: 'Francia', country_usa: 'USA', country_italy: 'Italia',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Sud della Francia',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Alpi francesi',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcellona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Isole Canarie',
      // Italy
      'Italian Lakes': 'Laghi italiani', 'Lake Como': 'Lago di Como', 'Lake Garda': 'Lago di Garda',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Liguria', 'Sardinia': 'Sardegna',
      // USA states
      'California': 'California', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'Inghilterra',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Austria', 'Croatia': 'Croazia', 'Germany': 'Germania',
      'Mexico': 'Messico', 'Portugal': 'Portogallo', 'Sweden': 'Svezia',
    },
    alert_dest_countries: {
      Spain: 'Spagna', France: 'Francia', Italy: 'Italia', USA: 'USA',
      'United Kingdom': 'Regno Unito', Other: 'Altro',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcellona', 'Canary Islands': 'Isole Canarie',
      'South of France': 'Sud della Francia', 'French Alps': 'Alpi francesi', 'Paris': 'Paris',
      'Italian Lakes': 'Laghi italiani', 'Sardinia': 'Sardegna', 'Liguria': 'Liguria',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'California', 'Utah': 'Utah',
      'London': 'London', 'England': 'Inghilterra',
      'Austria': 'Austria', 'Croatia': 'Croazia', 'Germany': 'Germania',
      'Mexico': 'Messico', 'Portugal': 'Portogallo', 'Sweden': 'Svezia',
    },
  },
  nl: {
    title_tag: 'Al onze woningen | Co-Ownership Property',
    meta_desc: 'Bekijk al onze luxe woningen in mede-eigendom wereldwijd. Filter op bestemming, regio en prijs.',
    eyebrow: 'Wereldwijde collectie',
    h1: 'Al onze woningen',
    sub: 'Zorgvuldig geselecteerde luxe vakantiewoningen in mede-eigendom in heel Europa, de VS en daarbuiten — vind de woning die bij u past.',
    label_country: 'Land', label_region: 'Regio', label_sort: 'Sorteren',
    all: 'Alle', other: 'Overig',
    sort_newest: 'Nieuwste', sort_asc: 'Prijs ↑ laag', sort_desc: 'Prijs ↓ hoog',
    clear: '✕ Wissen', clear_filters: 'Filters wissen',
    get_alerts: 'Meldingen ontvangen',
    showing: 'Weergave', of: 'van',
    property_singular: 'woning', property_plural: 'woningen',
    load_more: (n) => `Meer laden (nog ${n})`,
    no_results: 'Geen woningen voldoen aan uw filters.',
    alert_eye: 'Woningmeldingen',
    alert_heading: 'Weet het als eerste',
    alert_sub: 'Vertel ons waarnaar u op zoek bent. Zodra er een passende woning op de site verschijnt, weet u het als eerste.',
    alert_destinations: 'Bestemmingen', alert_optional: '(optioneel)',
    alert_max_budget: 'Maximaal budget', alert_any_budget: 'Elk budget',
    alert_under_100: 'Onder € 100.000', alert_up_to: 'Tot', alert_over_1m: '€ 1.000.000+',
    alert_name_ph: 'Uw naam (optioneel)', alert_email_ph: 'Uw e-mailadres *',
    alert_phone_ph: 'Telefoonnummer (optioneel)',
    alert_save: 'Melding opslaan →', alert_saving: 'Opslaan…',
    alert_saved: 'Melding opgeslagen!',
    alert_saved_msg: 'Wij mailen u op',
    alert_saved_msg_2: 'zodra er een passende woning wordt aangeboden.',
    alert_error: 'Er is iets misgegaan. Probeer het opnieuw.',
    country_spain: 'Spanje', country_france: 'Frankrijk', country_usa: 'VS', country_italy: 'Italië',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Zuid-Frankrijk',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Franse Alpen',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Canarische Eilanden',
      // Italy
      'Italian Lakes': 'Italiaanse Meren', 'Lake Como': 'Comomeer', 'Lake Garda': 'Gardameer',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Ligurië', 'Sardinia': 'Sardinië',
      // USA states
      'California': 'Californië', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'Engeland',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Oostenrijk', 'Croatia': 'Kroatië', 'Germany': 'Duitsland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Zweden',
    },
    alert_dest_countries: {
      Spain: 'Spanje', France: 'Frankrijk', Italy: 'Italië', USA: 'VS',
      'United Kingdom': 'Verenigd Koninkrijk', Other: 'Overig',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Canarische Eilanden',
      'South of France': 'Zuid-Frankrijk', 'French Alps': 'Franse Alpen', 'Paris': 'Paris',
      'Italian Lakes': 'Italiaanse Meren', 'Sardinia': 'Sardinië', 'Liguria': 'Ligurië',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'Californië', 'Utah': 'Utah',
      'London': 'London', 'England': 'Engeland',
      'Austria': 'Oostenrijk', 'Croatia': 'Kroatië', 'Germany': 'Duitsland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Zweden',
    },
  },
  pt: {
    title_tag: 'Todos os nossos imóveis | Co-Ownership Property',
    meta_desc: 'Explore todos os nossos imóveis de luxo em multipropriedade. Filtre por destino, região e preço.',
    eyebrow: 'Seleção mundial',
    h1: 'Todos os nossos imóveis',
    sub: 'Imóveis de luxo em multipropriedade selecionados a dedo na Europa, nos EUA e além — encontre a casa certa para você.',
    label_country: 'País', label_region: 'Região', label_sort: 'Ordenar',
    all: 'Todos', other: 'Outros',
    sort_newest: 'Mais recentes', sort_asc: 'Preço ↑ Menor', sort_desc: 'Preço ↓ Maior',
    clear: '✕ Limpar', clear_filters: 'Limpar filtros',
    get_alerts: 'Receber alertas de imóveis',
    showing: 'Exibindo', of: 'de',
    property_singular: 'imóvel', property_plural: 'imóveis',
    load_more: (n) => `Ver mais (faltam ${n})`,
    no_results: 'Nenhum imóvel corresponde aos seus filtros.',
    alert_eye: 'Alertas de imóveis',
    alert_heading: 'Seja o primeiro a saber',
    alert_sub: 'Conte o que você procura. Assim que um imóvel compatível for adicionado ao site, você será o primeiro a saber.',
    alert_destinations: 'Destinos', alert_optional: '(opcional)',
    alert_max_budget: 'Orçamento máximo', alert_any_budget: 'Qualquer orçamento',
    alert_under_100: 'Menos de € 100.000', alert_up_to: 'Até', alert_over_1m: 'Acima de € 1.000.000',
    alert_name_ph: 'Seu nome (opcional)', alert_email_ph: 'Seu e-mail *',
    alert_phone_ph: 'Telefone (opcional)',
    alert_save: 'Salvar alerta →', alert_saving: 'Salvando…',
    alert_saved: 'Alerta salvo!',
    alert_saved_msg: 'Enviaremos um e-mail para',
    alert_saved_msg_2: 'assim que um imóvel compatível for anunciado.',
    alert_error: 'Algo deu errado. Tente novamente.',
    country_spain: 'Espanha', country_france: 'França', country_usa: 'EUA', country_italy: 'Itália',
    region_labels: {
      // França
      'Paris': 'Paris',
      'South of France': 'Sul da França',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Alpes Franceses',
      'Portes du Soleil': 'Portes du Soleil',
      // Espanha
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madri', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Ilhas Canárias',
      // Itália
      'Italian Lakes': 'Lagos Italianos', 'Lake Como': 'Lago de Como', 'Lake Garda': 'Lago de Garda',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Ligúria', 'Sardinia': 'Sardenha',
      // Estados dos EUA
      'California': 'Califórnia', 'Colorado': 'Colorado', 'Florida': 'Flórida', 'Utah': 'Utah',
      // Reino Unido
      'London': 'Londres', 'England': 'Inglaterra',
      // Países exibidos como filtros de região quando "Outros" está selecionado
      'Austria': 'Áustria', 'Croatia': 'Croácia', 'Germany': 'Alemanha',
      'Mexico': 'México', 'Portugal': 'Portugal', 'Sweden': 'Suécia',
    },
    alert_dest_countries: {
      Spain: 'Espanha', France: 'França', Italy: 'Itália', USA: 'EUA',
      'United Kingdom': 'Reino Unido', Other: 'Outros',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Ilhas Canárias',
      'South of France': 'Sul da França', 'French Alps': 'Alpes Franceses', 'Paris': 'Paris',
      'Italian Lakes': 'Lagos Italianos', 'Sardinia': 'Sardenha', 'Liguria': 'Ligúria',
      'Colorado': 'Colorado', 'Florida': 'Flórida', 'California': 'Califórnia', 'Utah': 'Utah',
      'London': 'Londres', 'England': 'Inglaterra',
      'Austria': 'Áustria', 'Croatia': 'Croácia', 'Germany': 'Alemanha',
      'Mexico': 'México', 'Portugal': 'Portugal', 'Sweden': 'Suécia',
    },
  },
  sv: {
    title_tag: 'Alla våra bostäder | Co-Ownership Property',
    meta_desc: 'Bläddra bland alla våra lyxiga bostäder i samägande världen över. Filtrera på destination, region och pris.',
    eyebrow: 'Utbud i hela världen',
    h1: 'Alla våra bostäder',
    sub: 'Handplockade lyxiga fritidsbostäder i samägande i Europa, USA och därutöver — hitta bostaden som passar dig.',
    label_country: 'Land', label_region: 'Region', label_sort: 'Sortera',
    all: 'Alla', other: 'Övrigt',
    sort_newest: 'Nyaste', sort_asc: 'Pris ↑ Lågt', sort_desc: 'Pris ↓ Högt',
    clear: '✕ Rensa', clear_filters: 'Rensa filter',
    get_alerts: 'Få bostadsbevakning',
    showing: 'Visar', of: 'av',
    property_singular: 'bostad', property_plural: 'bostäder',
    load_more: (n) => `Visa fler (${n} kvar)`,
    no_results: 'Inga bostäder matchar dina filter.',
    alert_eye: 'Bostadsbevakning',
    alert_heading: 'Var först med att veta',
    alert_sub: 'Berätta vad du söker. I samma stund som en ny matchande bostad läggs upp på webbplatsen är du först med att få veta det.',
    alert_destinations: 'Destinationer', alert_optional: '(valfritt)',
    alert_max_budget: 'Maxbudget', alert_any_budget: 'Valfri budget',
    alert_under_100: 'Under 100 000 €', alert_up_to: 'Upp till', alert_over_1m: 'Över 1 000 000 €',
    alert_name_ph: 'Ditt namn (valfritt)', alert_email_ph: 'Din e-postadress *',
    alert_phone_ph: 'Telefonnummer (valfritt)',
    alert_save: 'Spara bevakning →', alert_saving: 'Sparar…',
    alert_saved: 'Bevakning sparad!',
    alert_saved_msg: 'Vi mejlar dig på',
    alert_saved_msg_2: ' så snart en matchande bostad läggs ut.',
    alert_error: 'Något gick fel. Försök igen.',
    country_spain: 'Spanien', country_france: 'Frankrike', country_usa: 'USA', country_italy: 'Italien',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Sydfrankrike',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Franska alperna',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Teneriffa', 'Canary Islands': 'Kanarieöarna',
      // Italy
      'Italian Lakes': 'Italienska sjöarna', 'Lake Como': 'Comosjön', 'Lake Garda': 'Gardasjön',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Ligurien', 'Sardinia': 'Sardinien',
      // USA states
      'California': 'Kalifornien', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'England',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Österrike', 'Croatia': 'Kroatien', 'Germany': 'Tyskland',
      'Mexico': 'Mexiko', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
    alert_dest_countries: {
      Spain: 'Spanien', France: 'Frankrike', Italy: 'Italien', USA: 'USA',
      'United Kingdom': 'Storbritannien', Other: 'Övrigt',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Kanarieöarna',
      'South of France': 'Sydfrankrike', 'French Alps': 'Franska alperna', 'Paris': 'Paris',
      'Italian Lakes': 'Italienska sjöarna', 'Sardinia': 'Sardinien', 'Liguria': 'Ligurien',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'Kalifornien', 'Utah': 'Utah',
      'London': 'London', 'England': 'England',
      'Austria': 'Österrike', 'Croatia': 'Kroatien', 'Germany': 'Tyskland',
      'Mexico': 'Mexiko', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
  },
  da: {
    title_tag: 'Alle vores boliger | Co-Ownership Property',
    meta_desc: 'Se alle vores luksuriøse boliger i medejerskab verden over. Filtrér efter destination, region og pris.',
    eyebrow: 'Udvalg fra hele verden',
    h1: 'Alle vores boliger',
    sub: 'Nøje udvalgte luksuriøse feriboliger i medejerskab i hele Europa, USA og derudover — find den bolig, der passer til dig.',
    label_country: 'Land', label_region: 'Region', label_sort: 'Sortér',
    all: 'Alle', other: 'Andre',
    sort_newest: 'Nyeste', sort_asc: 'Pris ↑ lav', sort_desc: 'Pris ↓ høj',
    clear: '✕ Nulstil', clear_filters: 'Nulstil filtre',
    get_alerts: 'Få boligalarmer',
    showing: 'Viser', of: 'af',
    property_singular: 'bolig', property_plural: 'boliger',
    load_more: (n) => `Vis flere (${n} tilbage)`,
    no_results: 'Ingen boliger matcher dine filtre.',
    alert_eye: 'Boligalarmer',
    alert_heading: 'Vær den første, der ved det',
    alert_sub: 'Fortæl os, hvad du leder efter. I det øjeblik en ny bolig, der matcher, kommer på sitet, er du den første, der får besked.',
    alert_destinations: 'Destinationer', alert_optional: '(valgfrit)',
    alert_max_budget: 'Maksimalt budget', alert_any_budget: 'Ethvert budget',
    alert_under_100: 'Under 100 000 €', alert_up_to: 'Op til', alert_over_1m: 'Over 1 000 000 €',
    alert_name_ph: 'Dit navn (valgfrit)', alert_email_ph: 'Din e-mailadresse *',
    alert_phone_ph: 'Telefonnummer (valgfrit)',
    alert_save: 'Gem alarm →', alert_saving: 'Gemmer…',
    alert_saved: 'Alarm gemt!',
    alert_saved_msg: 'Vi sender dig en e-mail på',
    alert_saved_msg_2: ', så snart en matchende bolig kommer til salg.',
    alert_error: 'Der opstod en fejl. Prøv venligst igen.',
    country_spain: 'Spanien', country_france: 'Frankrig', country_usa: 'USA', country_italy: 'Italien',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Sydfrankrig',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'De Franske Alper',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'De Kanariske Øer',
      // Italy
      'Italian Lakes': 'De italienske søer', 'Lake Como': 'Comosøen', 'Lake Garda': 'Gardasøen',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Ligurien', 'Sardinia': 'Sardinien',
      // USA states
      'California': 'Californien', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'England',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Østrig', 'Croatia': 'Kroatien', 'Germany': 'Tyskland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
    alert_dest_countries: {
      Spain: 'Spanien', France: 'Frankrig', Italy: 'Italien', USA: 'USA',
      'United Kingdom': 'Storbritannien', Other: 'Andre',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'De Kanariske Øer',
      'South of France': 'Sydfrankrig', 'French Alps': 'De Franske Alper', 'Paris': 'Paris',
      'Italian Lakes': 'De italienske søer', 'Sardinia': 'Sardinien', 'Liguria': 'Ligurien',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'Californien', 'Utah': 'Utah',
      'London': 'London', 'England': 'England',
      'Austria': 'Østrig', 'Croatia': 'Kroatien', 'Germany': 'Tyskland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
  },
  no: {
    title_tag: 'Alle våre boliger | Co-Ownership Property',
    meta_desc: 'Utforsk alle våre luksusboliger i sameie over hele verden. Filtrer på destinasjon, region og pris.',
    eyebrow: 'Utvalg fra hele verden',
    h1: 'Alle våre boliger',
    sub: 'Nøye utvalgte luksusboliger i sameie i hele Europa, USA og andre steder — finn boligen som passer for deg.',
    label_country: 'Land', label_region: 'Region', label_sort: 'Sorter',
    all: 'Alle', other: 'Annet',
    sort_newest: 'Nyeste', sort_asc: 'Pris ↑ Lav', sort_desc: 'Pris ↓ Høy',
    clear: '✕ Nullstill', clear_filters: 'Nullstill filtre',
    get_alerts: 'Få boligvarsler',
    showing: 'Viser', of: 'av',
    property_singular: 'bolig', property_plural: 'boliger',
    load_more: (n) => `Vis flere (${n} igjen)`,
    no_results: 'Ingen boliger passer med filtrene dine.',
    alert_eye: 'Boligvarsler',
    alert_heading: 'Vær først ute',
    alert_sub: 'Fortell oss hva du er ute etter. Så snart en passende bolig legges ut, er du den første som får vite det.',
    alert_destinations: 'Destinasjoner', alert_optional: '(valgfritt)',
    alert_max_budget: 'Maksbudsjett', alert_any_budget: 'Uansett budsjett',
    alert_under_100: 'Under 100 000 €', alert_up_to: 'Opptil', alert_over_1m: 'Over 1 000 000 €',
    alert_name_ph: 'Ditt navn (valgfritt)', alert_email_ph: 'Din e-postadresse *',
    alert_phone_ph: 'Telefonnummer (valgfritt)',
    alert_save: 'Lagre varsel →', alert_saving: 'Lagrer…',
    alert_saved: 'Varselet er lagret!',
    alert_saved_msg: 'Vi sender deg en e-post til',
    alert_saved_msg_2: 'så snart en passende bolig legges ut.',
    alert_error: 'Noe gikk galt. Prøv igjen.',
    country_spain: 'Spania', country_france: 'Frankrike', country_usa: 'USA', country_italy: 'Italia',
    region_labels: {
      // France
      'Paris': 'Paris',
      'South of France': 'Sør-Frankrike',
      "Côte d'Azur": "Côte d'Azur",
      'French Alps': 'Franske Alper',
      'Portes du Soleil': 'Portes du Soleil',
      // Spain
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca', 'Formentera': 'Formentera',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca', 'Costa de la Luz': 'Costa de la Luz',
      'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Baqueira': 'Baqueira',
      'Tenerife': 'Tenerife', 'Canary Islands': 'Kanariøyene',
      // Italy
      'Italian Lakes': 'Italienske innsjøer', 'Lake Como': 'Comosjøen', 'Lake Garda': 'Gardasjøen',
      'Lago Maggiore': 'Lago Maggiore', 'Liguria': 'Liguria', 'Sardinia': 'Sardinia',
      // USA states
      'California': 'California', 'Colorado': 'Colorado', 'Florida': 'Florida', 'Utah': 'Utah',
      // UK
      'London': 'London', 'England': 'England',
      // Countries appearing as region chips when "Other" is selected
      'Austria': 'Østerrike', 'Croatia': 'Kroatia', 'Germany': 'Tyskland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
    alert_dest_countries: {
      Spain: 'Spania', France: 'Frankrike', Italy: 'Italia', USA: 'USA',
      'United Kingdom': 'Storbritannia', Other: 'Annet',
    },
    alert_dest_children: {
      'Mallorca': 'Mallorca', 'Ibiza': 'Ibiza', 'Menorca': 'Menorca',
      'Costa del Sol': 'Costa del Sol', 'Costa Blanca': 'Costa Blanca',
      'Barcelona': 'Barcelona', 'Canary Islands': 'Kanariøyene',
      'South of France': 'Sør-Frankrike', 'French Alps': 'Franske Alper', 'Paris': 'Paris',
      'Italian Lakes': 'Italienske innsjøer', 'Sardinia': 'Sardinia', 'Liguria': 'Liguria',
      'Colorado': 'Colorado', 'Florida': 'Florida', 'California': 'California', 'Utah': 'Utah',
      'London': 'London', 'England': 'England',
      'Austria': 'Østerrike', 'Croatia': 'Kroatia', 'Germany': 'Tyskland',
      'Mexico': 'Mexico', 'Portugal': 'Portugal', 'Sweden': 'Sverige',
    },
  },
};

// Helper: translate a raw region value to the active locale's display label.
// Falls back to the raw value when no translation exists (e.g. brand-new
// regions added after this map was last updated).
function regionLabel(r, t) {
  return (t.region_labels && t.region_labels[r]) || r;
}

const PAGE_SIZE = 24;

// The page renders the locale derived from its URL — no cookie magic, so the
// English /our-homes/ stays English for English visitors regardless of which
// locale they previously visited. Locale-specific listings live at separate
// URLs: /es/propiedades/ and /fr/proprietes/ each render this same component
// via thin wrapper pages that pass `forceLocale`.

export default function OurHomes({ allProperties, forceLocale, canonicalPath = '/our-homes/' }) {
  const router = useRouter();
  // forceLocale wins (set by /es/propiedades/ and /fr/proprietes/ wrappers).
  // Otherwise derive from URL path — /our-homes/ always returns 'en'.
  const locale = forceLocale || localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;
  // Maps internal English country keys to localised display labels for the
  // top-row filter buttons. Keys (e.g. 'France') are still used to filter
  // properties — only the displayed label changes.
  const COUNTRY_LABELS = {
    Spain: t.country_spain, France: t.country_france, USA: t.country_usa, Italy: t.country_italy,
  };

  const [countries,    setCountries]    = useState([]); // [] = All; array of selected countries
  const [regions,      setRegions]      = useState([]); // [] = all; array of selected region labels
  const [sort,         setSort]         = useState('newest');
  const [page,         setPage]         = useState(1);
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertEmail,    setAlertEmail]    = useState('');
  const [alertName,     setAlertName]     = useState('');
  // Optional — never required. The gallery unlock proved that asking without
  // demanding raises capture rather than costing conversions (see the 20 Jul
  // change); this is the same field, same copy, same behaviour.
  const [alertPhone,    setAlertPhone]    = useState('');
  const [alertStatus,   setAlertStatus]   = useState('idle'); // idle | sending | done | error
  const [alertRegions,  setAlertRegions]  = useState([]);
  const [alertMaxPrice, setAlertMaxPrice] = useState('');

  // Seed filter state from URL query on first render (router.isReady gate
  // ensures router.query is populated). Runs once.
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    if (q.country) {
      const c = Array.isArray(q.country) ? q.country : [q.country];
      setCountries(c);
    }
    if (q.region) {
      const r = Array.isArray(q.region) ? q.region : [q.region];
      setRegions(r);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // ── Toggle a country in/out of selection ────────────────────────────────────
  function toggleCountry(c) {
    if (c === '') { setCountries([]); setRegions([]); return; } // "All" resets
    setCountries(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      return next;
    });
    setRegions([]); // reset regions whenever country selection changes
  }

  // ── Toggle a region in/out of selection ─────────────────────────────────────
  function toggleRegion(r) {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  // ── Region buttons: union across all selected countries ──────────────────────
  const regionButtons = useMemo(() => {
    if (countries.length === 0) return [];
    const all = [];
    for (const c of countries) {
      if (c === 'OTHER') {
        const seen = new Set();
        allProperties.filter(p => !TOP_COUNTRIES.includes(p.country) && p.country).forEach(p => seen.add(p.country));
        all.push(...[...seen].sort());
      } else if (c === 'France') {
        FRANCE_CLUSTERS
          .filter(cl => allProperties.some(p => p.country === 'France' && cl.regions.includes(p.region)))
          .sort((a, b) =>
            allProperties.filter(p => p.country === 'France' && b.regions.includes(p.region)).length -
            allProperties.filter(p => p.country === 'France' && a.regions.includes(p.region)).length
          )
          .forEach(cl => all.push(cl.label));
      } else {
        const seen = new Set();
        allProperties.filter(p => p.country === c && p.region).forEach(p => seen.add(p.region));
        all.push(...[...seen].sort((a, b) =>
          allProperties.filter(p => p.country === c && p.region === b).length -
          allProperties.filter(p => p.country === c && p.region === a).length
        ));
      }
    }
    return [...new Set(all)]; // deduplicate
  }, [allProperties, countries]);

  // Whether any selected country has un-clustered/regionless properties
  const hasOtherRegions = useMemo(() => {
    if (countries.length === 0) return false;
    return countries.some(c => {
      if (c === 'OTHER') return false;
      if (c === 'France') return allProperties.some(p => p.country === 'France' && !franceCluserLabel(p.region));
      return allProperties.some(p => p.country === c && !p.region);
    });
  }, [allProperties, countries]);

  const showRegionRow = countries.length > 0 && (regionButtons.length > 0 || hasOtherRegions);

  // ── Helper: does a property match a region label? ───────────────────────────
  function propMatchesRegion(p, label) {
    const cluster = FRANCE_CLUSTERS.find(cl => cl.label === label);
    if (cluster) return p.country === 'France' && cluster.regions.includes(p.region);
    if (label === 'OTHER') {
      if (p.country === 'France') return !franceCluserLabel(p.region);
      return !p.region;
    }
    // Could be a raw country name (OTHER mode) or a raw region name
    return p.region === label || p.country === label;
  }

  // ── Filtered + sorted property list ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allProperties];

    // Country filter — match any selected country
    if (countries.length > 0) {
      list = list.filter(p =>
        countries.some(c => {
          if (c === 'OTHER') return !TOP_COUNTRIES.includes(p.country);
          return p.country === c;
        })
      );
    }

    // Region filter — match any selected region label
    if (regions.length > 0) {
      list = list.filter(p => regions.some(r => propMatchesRegion(p, r)));
    }

    // Sort
    if (sort === 'newest') list.sort((a, b) => dateVal(b.dateAdded) - dateVal(a.dateAdded));
    if (sort === 'asc')    list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc')   list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [allProperties, countries, regions, sort]);

  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = visible.length < filtered.length;

  const hasActiveFilters = countries.length > 0 || sort !== 'newest';

  function clearAll() {
    setCountries([]);
    setRegions([]);
    setSort('newest');
    setPage(1);
  }

  function toggleCountryAndReset(c) {
    toggleCountry(c);
    setPage(1);
  }

  function toggleRegionAndReset(r) {
    toggleRegion(r);
    setPage(1);
  }

  function closeAlert() {
    setAlertOpen(false);
    setAlertStatus('idle');
    setAlertRegions([]);
    setAlertMaxPrice('');
    setAlertExpanded({});
  }

  function toggleAlertRegion(val) {
    setAlertRegions(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  async function submitAlert(e) {
    e.preventDefault();
    setAlertStatus('sending');
    try {
      const r = await fetch('/api/save-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    alertEmail,
          name:     alertName || null,
          phone:    String(alertPhone || '').trim() || null,
          regions:  alertRegions.length > 0 ? alertRegions : ['All'],
          maxPrice: alertMaxPrice || null,
        }),
      });
      if (r.ok) {
        track('property_alert_saved', {
          regions: alertRegions.length > 0 ? alertRegions.join(', ') : 'All',
          max_price: alertMaxPrice || 'unspecified',
        });
      }
      setAlertStatus(r.ok ? 'done' : 'error');
    } catch { setAlertStatus('error'); }
  }

  function setSortAndReset(s) {
    setSort(s);
    setPage(1);
  }

  return (
    <>
      <Head>
        <title>{t.title_tag}</title>
        {hreflangLinks({ englishPath: '/our-homes' })}
        <meta name="description" content={t.meta_desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={`https://co-ownership-property.com${canonicalPath}`} />
        <meta property="og:title" content={t.title_tag} />
        <meta property="og:description" content={t.meta_desc} />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/04/cop-og-image.jpg" />
        <meta property="og:url" content={`https://co-ownership-property.com${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `https://co-ownership-property.com${canonicalPath}#webpage`,
              "url": `https://co-ownership-property.com${canonicalPath}`,
              "name": t.title_tag,
              "description": t.meta_desc,
              "isPartOf": { "@id": "https://co-ownership-property.com/#website" },
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://co-ownership-property.com/" },
                { "@type": "ListItem", "position": 2, "name": t.title_tag, "item": `https://co-ownership-property.com${canonicalPath}` },
              ],
            },
            {
              "@type": "ItemList",
              "itemListOrder": "https://schema.org/ItemListUnordered",
              "numberOfItems": allProperties.length,
              "itemListElement": allProperties.slice(0, 24).map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `https://co-ownership-property.com/property/${p.slug}/`,
                "name": (p[`title_${locale}`] || p.title),
              })),
            },
          ],
        }) }} />
      </Head>
      <Header />

      {/* Hero */}
      <section className="page-hero">
        <span className="page-hero-eyebrow">{t.eyebrow}</span>
        <h1>{t.h1}</h1>
        <p className="page-hero-sub">{t.sub}</p>
      </section>

      {/* ── Filter bar ── */}
      <div className="filter-bar" id="filter-bar">

        {/* Row 1 — Country (multi-select) */}
        <div className="filter-row">
          <span className="filter-label">{t.label_country}</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              <button
                className={`filter-btn${countries.length === 0 ? ' active' : ''}`}
                onClick={() => toggleCountryAndReset('')}
              >{t.all}</button>

              {TOP_COUNTRIES.map(c => (
                <button
                  key={c}
                  className={`filter-btn${countries.includes(c) ? ' active' : ''}`}
                  onClick={() => toggleCountryAndReset(c)}
                >
                  {COUNTRY_FLAGS[c]} {COUNTRY_LABELS[c] || c}
                </button>
              ))}

              <button
                className={`filter-btn${countries.includes('OTHER') ? ' active' : ''}`}
                onClick={() => toggleCountryAndReset('OTHER')}
              >🌐 {t.other}</button>
            </div>
          </div>
        </div>

        {/* Row 2 — Region (multi-select, shown when any country selected) */}
        {showRegionRow && (
          <div className="filter-row">
            <span className="filter-label">
              {countries.length === 1 && countries[0] === 'OTHER' ? t.label_country : t.label_region}
            </span>
            <div className="filter-scroll-outer">
              <div className="filter-scroll-wrap">
                {regionButtons.map(r => (
                  <button
                    key={r}
                    className={`filter-btn${regions.includes(r) ? ' active' : ''}`}
                    onClick={() => toggleRegionAndReset(r)}
                  >
                    {COUNTRY_FLAGS[r] ? `${COUNTRY_FLAGS[r]} ` : ''}{regionLabel(r, t)}
                  </button>
                ))}
                {hasOtherRegions && (
                  <button
                    className={`filter-btn${regions.includes('OTHER') ? ' active' : ''}`}
                    onClick={() => toggleRegionAndReset('OTHER')}
                  >{t.other}</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Row 3 — Sort + Clear + CTA */}
        <div className="filter-row">
          <span className="filter-label">{t.label_sort}</span>
          <div className="filter-scroll-outer">
            <div className="filter-scroll-wrap">
              {[['newest', t.sort_newest],['asc', t.sort_asc],['desc', t.sort_desc]].map(([val, label]) => (
                <button
                  key={val}
                  className={`filter-btn sort-btn${sort === val ? ' active' : ''}`}
                  onClick={() => setSortAndReset(val)}
                >{label}</button>
              ))}
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearAll}>{t.clear}</button>
              )}
              <button
                className="save-alert-btn desktop-only-cta"
                onClick={() => setAlertOpen(true)}
                title={t.get_alerts}
              >{t.get_alerts}</button>
            </div>
          </div>
        </div>

        {/* Mobile: CTAs on their own centred row */}
        <div className="filter-cta-row">
          <button className="save-alert-btn" onClick={() => setAlertOpen(true)}>{t.get_alerts}</button>
        </div>

      </div>{/* end filter-bar */}

      {/* Cream section wrapper */}
      <div className="our-homes-section">

        {/* Results count */}
        <div className="results-bar">
          <p className="results-count">
            {t.showing} <strong>{visible.length}</strong> {t.of} <strong>{filtered.length}</strong> {filtered.length === 1 ? t.property_singular : t.property_plural}
          </p>
        </div>

        {/* Property grid */}
        <div className="homes-grid-wrap">
          {filtered.length > 0 ? (
            <>
              <div className="homes-grid" id="homes-grid">
                {visible.map(p => <PropertyCard key={p.slug} property={p} />)}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
                    {t.load_more(filtered.length - visible.length)}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>{t.no_results}</p>
              <button className="clear-btn" onClick={clearAll}>{t.clear_filters}</button>
            </div>
          )}
        </div>

      </div>{/* end our-homes-section */}

      <Newsletter />
      <ExpertForm />
      <Footer />

      {/* ── Save Alert Modal ── */}
      {alertOpen && (
        <div className="ul-overlay" onClick={closeAlert}>
          <div className="ul-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <button className="ul-close" onClick={closeAlert}>×</button>
            {alertStatus === 'done' ? (
              <div className="ul-success">
                <div className="ul-tick">✓</div>
                <h3>{t.alert_saved}</h3>
                <p>{t.alert_saved_msg} <strong>{alertEmail}</strong> {t.alert_saved_msg_2}</p>
              </div>
            ) : (
              <>
                <p className="ul-eye">{t.alert_eye}</p>
                <h3>{t.alert_heading}</h3>
                <p className="ul-sub">{t.alert_sub}</p>

                <form onSubmit={submitAlert} className="ul-form">

                  {/* Destinations */}
                  <div className="alert-field-label">{t.alert_destinations} <span style={{color:'#9EAFBC',fontWeight:300}}>{t.alert_optional}</span></div>
                  <div className="alert-dest-wrap">
                    {[
                      { country: 'Spain',           children: ['Mallorca','Ibiza','Menorca','Costa del Sol','Costa Blanca','Barcelona','Canary Islands'] },
                      { country: 'France',          children: ['South of France','French Alps','Paris'] },
                      { country: 'Italy',           children: ['Italian Lakes','Sardinia','Liguria'] },
                      { country: 'USA',             children: ['Colorado','Florida','California','Utah'] },
                      { country: 'United Kingdom',  children: ['London','England'] },
                      { country: 'Other',           children: ['Austria','Croatia','Germany','Mexico','Portugal','Sweden'] },
                    ].map(({ country, children }) => (
                      <div key={country} className="alert-dest-group">
                        {/* Country row — selectable */}
                        <label className="alert-check-row alert-check-country">
                          <input
                            type="checkbox"
                            className="alert-check-input"
                            checked={alertRegions.includes(country)}
                            onChange={() => toggleAlertRegion(country)}
                          />
                          <span className="alert-check-box" />
                          <span className="alert-check-label">{(t.alert_dest_countries && t.alert_dest_countries[country]) || country}</span>
                        </label>
                        {/* Region rows — indented */}
                        {children.map(child => (
                          <label key={child} className="alert-check-row alert-check-region">
                            <input
                              type="checkbox"
                              className="alert-check-input"
                              checked={alertRegions.includes(child)}
                              onChange={() => toggleAlertRegion(child)}
                            />
                            <span className="alert-check-box" />
                            <span className="alert-check-label">{(t.alert_dest_children && t.alert_dest_children[child]) || child}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Budget */}
                  <div className="alert-field">
                    <div className="alert-field-label">{t.alert_max_budget} <span style={{color:'#9EAFBC',fontWeight:300}}>{t.alert_optional}</span></div>
                    <select value={alertMaxPrice} onChange={e => setAlertMaxPrice(e.target.value)} className="alert-select" style={{width:'100%'}}>
                      <option value="">{t.alert_any_budget}</option>
                      <option value="100000">{t.alert_under_100}</option>
                      <option value="200000">{t.alert_up_to} €200,000</option>
                      <option value="350000">{t.alert_up_to} €350,000</option>
                      <option value="500000">{t.alert_up_to} €500,000</option>
                      <option value="750000">{t.alert_up_to} €750,000</option>
                      <option value="1000000">{t.alert_up_to} €1,000,000</option>
                      <option value="9999999">{t.alert_over_1m}</option>
                    </select>
                  </div>

                  {/* Name + Email */}
                  <input
                    type="text"
                    placeholder={t.alert_name_ph}
                    value={alertName}
                    onChange={e => setAlertName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder={t.alert_email_ph}
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                    required
                  />
                  {/* Deliberately not `required` — the label says optional and
                      the field means it. Partners need a number to accept a
                      lead, so every one collected here is a lead we can act on. */}
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t.alert_phone_ph}
                    value={alertPhone}
                    onChange={e => setAlertPhone(e.target.value)}
                  />

                  <button type="submit" disabled={alertStatus === 'sending'}>
                    {alertStatus === 'sending' ? t.alert_saving : t.alert_save}
                  </button>
                  {alertStatus === 'error' && <p className="ul-err">{t.alert_error}</p>}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
