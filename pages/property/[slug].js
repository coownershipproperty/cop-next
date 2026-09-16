import Head from 'next/head';
import NextImage from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { trackConversion, fbqEvent } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { getSavedUser, saveUser, visitorFromUrl } from '@/lib/savedUser';
import { isFav, toggleFav, onFavsChange } from '@/lib/favs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import { useCurrency, convertPrice, CURRENCY_SYMBOLS } from '@/hooks/useCurrency';
import ExpertForm from '@/components/ExpertForm';
import UnlockModal from '@/components/UnlockModal';
import DiscreetUnlockModal, { DISCREET_COPY, visitorToken } from '@/components/DiscreetUnlockModal';
import TourRequestModal from '@/components/TourRequestModal';
import FinancingCalculator from '@/components/FinancingCalculator';
import PropertyCard from '@/components/PropertyCard';
import { localeFromPath, localeColumns, pickLocalized, numberLocale, SUPPORTED_LOCALES, propertyHref, localizedField, ALL_LOCALES, translatedLocales, ogLocaleFor, propertyMetaDescription, formatPrice, familyPrefix, destinationAvailableIn } from '@/lib/i18n';
import PropertyWatch from '@/components/PropertyWatch';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { getFirstTouch } from '@/lib/attribution';
import hreflangLinks from '@/components/HreflangLinks';
import { buildFactsPanel } from '@/lib/propertyFactsPanel';

// ── "The numbers" panel ────────────────────────────────────────────────────
// The values arrive from the server as data ({kind:'minimum', nights:44}),
// never as finished sentences, so every language says them properly. See
// lib/propertyFactsPanel.js for why.
const FACTS_COPY = {
  en: {
    heading: 'The numbers',
    share: (n) => `A 1/${n} share`, running: 'Running costs', time: 'Your time there', left: 'Still available',
    monthly: (m) => `${m} a month`,
    nights_minimum: (n) => `${n} nights a year, minimum`,
    nights_fixed: (n) => `${n} nights a year`,
    nights_uncapped: 'No set cap on total nights',
    nights_fraction: (n) => `Your 1/${n} share of the year`,
    shares_left: (n, d) => (n === 1 ? 'One share left' : `${n} of ${d} shares left`),
    covers_advance: 'A fixed monthly advance against the home’s own budget — management, insurance, upkeep and the reserve. Electricity, heating, the clean after each stay and laundry are billed by use, on top.',
    covers_budget: 'Your share of the home’s annual budget, billed monthly and trued up at the year end.',
    verified: (d) => `Checked against the operator’s own cost sheet on ${d}.`,
    ask: 'Want the exact detail behind any of these? Ask us — we are the agent, not the operator, so we have no reason to varnish the answer.',
  },
  es: {
    heading: 'Los números',
    share: (n) => `Una participación de 1/${n}`, running: 'Gastos corrientes', time: 'Tu tiempo allí', left: 'Aún disponible',
    monthly: (m) => `${m} al mes`,
    nights_minimum: (n) => `${n} noches al año, como mínimo`,
    nights_fixed: (n) => `${n} noches al año`,
    nights_uncapped: 'Sin límite de noches',
    nights_fraction: (n) => `Tu 1/${n} del año`,
    shares_left: (n, d) => (n === 1 ? 'Queda una participación' : `Quedan ${n} de ${d} participaciones`),
    covers_advance: 'Un anticipo mensual fijo a cuenta del presupuesto de la casa — gestión, seguro, mantenimiento y el fondo de reserva. La luz, la calefacción, la limpieza tras cada estancia y la lavandería se facturan aparte, según consumo.',
    covers_budget: 'Tu parte del presupuesto anual de la casa, facturada mensualmente y regularizada a fin de año.',
    verified: (d) => `Comprobado con la hoja de costes del operador el ${d}.`,
    ask: '¿Quieres el detalle exacto de alguno de estos números? Pregúntanos — somos la agencia, no el operador, así que no tenemos motivo para maquillar la respuesta.',
  },
  fr: {
    heading: 'Les chiffres',
    share: (n) => `Une quote-part de 1/${n}`, running: 'Charges courantes', time: 'Votre temps sur place', left: 'Encore disponible',
    monthly: (m) => `${m} par mois`,
    nights_minimum: (n) => `${n} nuits par an, au minimum`,
    nights_fixed: (n) => `${n} nuits par an`,
    nights_uncapped: 'Pas de plafond de nuits',
    nights_fraction: (n) => `Votre 1/${n} de l’année`,
    shares_left: (n, d) => (n === 1 ? 'Une quote-part restante' : `${n} quotes-parts restantes sur ${d}`),
    covers_advance: 'Une avance mensuelle fixe sur le budget de la maison — gestion, assurance, entretien et fonds de réserve. L’électricité, le chauffage, le ménage après chaque séjour et le linge sont facturés à l’usage, en plus.',
    covers_budget: 'Votre part du budget annuel de la maison, facturée mensuellement et régularisée en fin d’année.',
    verified: (d) => `Vérifié sur la fiche de coûts de l’exploitant le ${d}.`,
    ask: 'Vous voulez le détail exact derrière l’un de ces chiffres ? Demandez-nous — nous sommes l’agence, pas l’exploitant, donc aucune raison d’enjoliver la réponse.',
  },
  de: {
    heading: 'Die Zahlen',
    share: (n) => `Ein 1/${n}-Anteil`, running: 'Laufende Kosten', time: 'Ihre Zeit vor Ort', left: 'Noch verfügbar',
    monthly: (m) => `${m} im Monat`,
    nights_minimum: (n) => `${n} Nächte im Jahr, mindestens`,
    nights_fixed: (n) => `${n} Nächte im Jahr`,
    nights_uncapped: 'Keine feste Obergrenze an Nächten',
    nights_fraction: (n) => `Ihr 1/${n} des Jahres`,
    shares_left: (n, d) => (n === 1 ? 'Ein Anteil frei' : `${n} von ${d} Anteilen frei`),
    covers_advance: 'Ein fester monatlicher Vorschuss auf das Budget des Hauses — Verwaltung, Versicherung, Instandhaltung und Rücklage. Strom, Heizung, die Reinigung nach jedem Aufenthalt und Wäsche werden zusätzlich nach Verbrauch abgerechnet.',
    covers_budget: 'Ihr Anteil am Jahresbudget des Hauses, monatlich abgerechnet und zum Jahresende ausgeglichen.',
    verified: (d) => `Am ${d} anhand der Kostenaufstellung des Betreibers geprüft.`,
    ask: 'Sie möchten die genauen Details hinter einer dieser Zahlen? Fragen Sie uns — wir sind der Makler, nicht der Betreiber, und haben keinen Grund, die Antwort zu beschönigen.',
  },
  it: {
    heading: 'I numeri',
    share: (n) => `Una quota di 1/${n}`, running: 'Spese correnti', time: 'Il tuo tempo lì', left: 'Ancora disponibile',
    monthly: (m) => `${m} al mese`,
    nights_minimum: (n) => `${n} notti all’anno, come minimo`,
    nights_fixed: (n) => `${n} notti all’anno`,
    nights_uncapped: 'Nessun limite di notti',
    nights_fraction: (n) => `Il tuo 1/${n} dell’anno`,
    shares_left: (n, d) => (n === 1 ? 'Resta una quota' : `Restano ${n} quote su ${d}`),
    covers_advance: 'Un anticipo mensile fisso sul bilancio della casa — gestione, assicurazione, manutenzione e fondo di riserva. Elettricità, riscaldamento, pulizia dopo ogni soggiorno e lavanderia sono fatturati a consumo, a parte.',
    covers_budget: 'La tua parte del bilancio annuale della casa, fatturata mensilmente e conguagliata a fine anno.',
    verified: (d) => `Verificato sul prospetto costi dell’operatore il ${d}.`,
    ask: 'Vuoi il dettaglio esatto dietro uno di questi numeri? Chiedicelo — siamo l’agenzia, non l’operatore, quindi non abbiamo motivo di addolcire la risposta.',
  },
  nl: {
    heading: 'De cijfers',
    share: (n) => `Een 1/${n}-aandeel`, running: 'Vaste lasten', time: 'Uw tijd daar', left: 'Nog beschikbaar',
    monthly: (m) => `${m} per maand`,
    nights_minimum: (n) => `${n} nachten per jaar, minimaal`,
    nights_fixed: (n) => `${n} nachten per jaar`,
    nights_uncapped: 'Geen vaste limiet op het aantal nachten',
    nights_fraction: (n) => `Uw 1/${n} van het jaar`,
    shares_left: (n, d) => (n === 1 ? 'Nog één aandeel' : `Nog ${n} van de ${d} aandelen`),
    covers_advance: 'Een vast maandelijks voorschot op het budget van de woning — beheer, verzekering, onderhoud en de reserve. Elektriciteit, verwarming, de schoonmaak na elk verblijf en was worden apart op gebruik afgerekend.',
    covers_budget: 'Uw deel van het jaarbudget van de woning, maandelijks gefactureerd en aan het eind van het jaar verrekend.',
    verified: (d) => `Gecontroleerd aan de hand van het kostenoverzicht van de beheerder op ${d}.`,
    ask: 'Wilt u het exacte detail achter een van deze cijfers? Vraag het ons — wij zijn de makelaar, niet de beheerder, dus we hebben geen reden om het antwoord mooier te maken.',
  },
  pt: {
    heading: 'Os números',
    share: (n) => `Uma quota de 1/${n}`, running: 'Custos correntes', time: 'O seu tempo lá', left: 'Ainda disponível',
    monthly: (m) => `${m} por mês`,
    nights_minimum: (n) => `${n} noites por ano, no mínimo`,
    nights_fixed: (n) => `${n} noites por ano`,
    nights_uncapped: 'Sem limite de noites',
    nights_fraction: (n) => `A sua 1/${n} parte do ano`,
    shares_left: (n, d) => (n === 1 ? 'Resta uma quota' : `Restam ${n} de ${d} quotas`),
    covers_advance: 'Um adiantamento mensal fixo por conta do orçamento da casa — gestão, seguro, manutenção e o fundo de reserva. Eletricidade, aquecimento, a limpeza após cada estadia e lavandaria são faturados à parte, conforme o uso.',
    covers_budget: 'A sua parte do orçamento anual da casa, faturada mensalmente e acertada no fim do ano.',
    verified: (d) => `Conferido na folha de custos do operador em ${d}.`,
    ask: 'Quer o detalhe exato por trás de algum destes números? Pergunte-nos — somos a agência, não o operador, por isso não temos motivo para suavizar a resposta.',
  },
  sv: {
    heading: 'Siffrorna',
    share: (n) => `En 1/${n}-andel`, running: 'Löpande kostnader', time: 'Din tid där', left: 'Fortfarande ledigt',
    monthly: (m) => `${m} i månaden`,
    nights_minimum: (n) => `${n} nätter om året, som lägst`,
    nights_fixed: (n) => `${n} nätter om året`,
    nights_uncapped: 'Ingen fast gräns för antal nätter',
    nights_fraction: (n) => `Din 1/${n} av året`,
    shares_left: (n, d) => (n === 1 ? 'En andel kvar' : `${n} av ${d} andelar kvar`),
    covers_advance: 'Ett fast månadsförskott mot husets egen budget — förvaltning, försäkring, underhåll och reserven. El, uppvärmning, städning efter varje vistelse och tvätt faktureras separat efter förbrukning.',
    covers_budget: 'Din del av husets årsbudget, fakturerad månadsvis och avstämd vid årets slut.',
    verified: (d) => `Kontrollerat mot driftbolagets egen kostnadssammanställning den ${d}.`,
    ask: 'Vill du ha den exakta detaljen bakom någon av siffrorna? Fråga oss — vi är mäklaren, inte driftbolaget, så vi har ingen anledning att skönmåla svaret.',
  },
  da: {
    heading: 'Tallene',
    share: (n) => `En 1/${n}-andel`, running: 'Løbende udgifter', time: 'Din tid dernede', left: 'Stadig ledigt',
    monthly: (m) => `${m} om måneden`,
    nights_minimum: (n) => `${n} nætter om året, som minimum`,
    nights_fixed: (n) => `${n} nætter om året`,
    nights_uncapped: 'Ingen fast grænse for antal nætter',
    nights_fraction: (n) => `Din 1/${n} af året`,
    shares_left: (n, d) => (n === 1 ? 'Én andel tilbage' : `${n} af ${d} andele tilbage`),
    covers_advance: 'Et fast månedligt acontobeløb mod boligens eget budget — administration, forsikring, vedligehold og henlæggelser. El, varme, rengøring efter hvert ophold og vask afregnes særskilt efter forbrug.',
    covers_budget: 'Din del af boligens årsbudget, faktureret månedligt og afregnet ved årets afslutning.',
    verified: (d) => `Kontrolleret mod driftsselskabets eget omkostningsark den ${d}.`,
    ask: 'Vil du have den præcise detalje bag et af tallene? Spørg os — vi er mægleren, ikke driftsselskabet, så vi har ingen grund til at pynte på svaret.',
  },
  no: {
    heading: 'Tallene',
    share: (n) => `En 1/${n}-andel`, running: 'Løpende kostnader', time: 'Din tid der', left: 'Fortsatt ledig',
    monthly: (m) => `${m} i måneden`,
    nights_minimum: (n) => `${n} netter i året, som et minimum`,
    nights_fixed: (n) => `${n} netter i året`,
    nights_uncapped: 'Ingen fast grense for antall netter',
    nights_fraction: (n) => `Din 1/${n} av året`,
    shares_left: (n, d) => (n === 1 ? 'Én andel igjen' : `${n} av ${d} andeler igjen`),
    covers_advance: 'Et fast månedlig forskudd mot boligens eget budsjett — forvaltning, forsikring, vedlikehold og avsetninger. Strøm, oppvarming, rengjøring etter hvert opphold og vask faktureres separat etter forbruk.',
    covers_budget: 'Din del av boligens årsbudsjett, fakturert månedlig og gjort opp ved årsslutt.',
    verified: (d) => `Kontrollert mot driftsselskapets egen kostnadsoversikt den ${d}.`,
    ask: 'Vil du ha den eksakte detaljen bak et av tallene? Spør oss — vi er megleren, ikke driftsselskapet, så vi har ingen grunn til å pynte på svaret.',
  },
};

// ── Locale-specific UI copy ────────────────────────────────────────────────
const COPY = {
  en: {
    cobadge: (n) => `1/${n} Co-Ownership`,
    price_qualifier: (n) => `for a 1/${n} share`,
    bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', total_size: 'Total size', per_year: 'Per year', share_size: 'Share size',
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
    unlock_sub: 'Unlock once — see every gallery on the site, free',
    unlock_now: 'Unlock Now →',
    unlocked_title: 'Your galleries are unlocked',
    unlocked_sub: 'View the full photo gallery for this home',
    view_gallery_btn: 'View Gallery →',
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
    eq_chips: (sym) => [
      { k: 'when', q: 'When are you thinking?',
        o: ['Next 3 months', 'This year', 'Just looking'] ,
        v: ['3-months', 'this-year', 'browsing'] },
      { k: 'budget', q: 'Roughly what were you thinking of spending?',
        o: [`Under ${sym}200k`, `${sym}200\u2013400k`, `${sym}400k+`, 'Rather not say'] ,
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: 'seen', q: 'Have you looked at co-ownership before?',
        o: ["First I've heard of it", 'Been looking a while', 'I already own a share'] },
    ],
    eq_chip_labels: { when: 'Timing', budget: 'Budget', seen: 'Experience' },
    eq_note_add: 'Add a note (optional)',
  },
  es: {
    cobadge: (n) => `1/${n} de copropiedad`,
    price_qualifier: (n) => `por una participación de 1/${n}`,
    bedrooms: 'Dormitorios', bathrooms: 'Baños', total_size: 'Superficie total', per_year: 'Al año', share_size: 'Tamaño de fracción',
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
    unlock_sub: 'Desbloquea una vez — ve todas las galerías del sitio, gratis',
    unlock_now: 'Desbloquear ahora →',
    unlocked_title: 'Tus galerías están desbloqueadas',
    unlocked_sub: 'Ver la galería de fotos completa de esta vivienda',
    view_gallery_btn: 'Ver galería →',
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
    eq_chips: (sym) => [
      { k: 'when', q: '\u00bfPara cu\u00e1ndo lo est\u00e1s pensando?',
        o: ['En los pr\u00f3ximos 3 meses', 'Este a\u00f1o', 'Solo estoy mirando'] ,
        v: ['3-months', 'this-year', 'browsing'] },
      { k: 'budget', q: '\u00bfQu\u00e9 presupuesto tienes en mente, m\u00e1s o menos?',
        o: [`Menos de 200.000 ${sym}`, `200.000\u2013400.000 ${sym}`, `M\u00e1s de 400.000 ${sym}`, 'Prefiero no decirlo'] ,
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: 'seen', q: '\u00bfHab\u00edas visto antes la copropiedad?',
        o: ['Es la primera vez', 'Llevo tiempo mirando', 'Ya tengo una participaci\u00f3n'] },
    ],
    eq_chip_labels: { when: 'Plazo', budget: 'Presupuesto', seen: 'Experiencia' },
    eq_note_add: 'A\u00f1adir un comentario (opcional)',
  },
  fr: {
    cobadge: (n) => `1/${n} en copropriété`,
    price_qualifier: (n) => `pour une part de 1/${n}`,
    bedrooms: 'Chambres', bathrooms: 'Salles de bain', total_size: 'Surface totale', per_year: 'Par an', share_size: 'Taille de la part',
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
    unlock_sub: "Débloquez une fois — voyez toutes les galeries du site, gratuit",
    unlock_now: 'Débloquer maintenant →',
    unlocked_title: 'Vos galeries sont débloquées',
    unlocked_sub: 'Voir la galerie photo complète de ce bien',
    view_gallery_btn: 'Voir la galerie →',
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
    eq_chips: (sym) => [
      { k: 'when', q: 'Dans quel d\u00e9lai envisagez-vous ?',
        o: ['Dans les 3 mois', 'Cette ann\u00e9e', 'Je regarde seulement'] ,
        v: ['3-months', 'this-year', 'browsing'] },
      { k: 'budget', q: 'Quel budget envisagez-vous, en gros ?',
        o: [`Moins de 200 000 ${sym}`, `200 000\u2013400 000 ${sym}`, `Plus de 400 000 ${sym}`, 'Je pr\u00e9f\u00e8re ne pas dire'] ,
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: 'seen', q: 'Connaissiez-vous d\u00e9j\u00e0 la copropri\u00e9t\u00e9 ?',
        o: ["C'est la premi\u00e8re fois", 'Je cherche depuis un moment', 'Je poss\u00e8de d\u00e9j\u00e0 une part'] },
    ],
    eq_chip_labels: { when: 'D\u00e9lai', budget: 'Budget', seen: 'Exp\u00e9rience' },
    eq_note_add: 'Ajouter un message (facultatif)',
  },
  de: {
    cobadge: (n) => `1/${n} Miteigentum`,
    price_qualifier: (n) => `für einen 1/${n}-Anteil`,
    bedrooms: 'Schlafzimmer', bathrooms: 'Badezimmer', total_size: 'Gesamtfläche', per_year: 'Pro Jahr', share_size: 'Anteilsgröße',
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
    unlock_sub: 'Einmal freischalten — alle Galerien der Website sehen, kostenlos',
    unlock_now: 'Jetzt freischalten →',
    unlocked_title: 'Ihre Galerien sind freigeschaltet',
    unlocked_sub: 'Die vollständige Fotogalerie dieses Objekts ansehen',
    view_gallery_btn: 'Galerie ansehen →',
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
    eq_chips: (sym) => [
      { k: 'when', q: 'Wann denken Sie daran?',
        o: ['In den n\u00e4chsten 3 Monaten', 'Dieses Jahr', 'Ich schaue mich nur um'] ,
        v: ['3-months', 'this-year', 'browsing'] },
      { k: 'budget', q: 'Mit welchem Budget rechnen Sie ungef\u00e4hr?',
        o: [`Unter 200.000 ${sym}`, `200.000\u2013400.000 ${sym}`, `\u00dcber 400.000 ${sym}`, 'Lieber nicht sagen'] ,
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: 'seen', q: 'Kannten Sie Miteigentum schon?',
        o: ['Zum ersten Mal davon geh\u00f6rt', 'Schaue mich schon l\u00e4nger um', 'Ich besitze bereits einen Anteil'] },
    ],
    eq_chip_labels: { when: 'Zeitraum', budget: 'Budget', seen: 'Erfahrung' },
    eq_note_add: 'Nachricht hinzuf\u00fcgen (optional)',
  },

  /* it / nl / pt added 16 Sep 2026. All three are launched locales with live,
     indexed property pages (/it/immobili/, /nl/woningen/, /pt/imoveis/) and
     ~255 of 295 homes carrying translated titles and descriptions — but this
     table stopped at four, so every one of those pages served its enquiry
     form, its price qualifier and its co-ownership explainer in English.
     sv/da/no are in FACTS_COPY and BELL_COPY but are not launched, so they
     are deliberately not here yet. */
  it: {
    cobadge: (n) => `1/${n} di comproprietà`,
    price_qualifier: (n) => `per una quota di 1/${n}`,
    bedrooms: "Camere da letto", bathrooms: "Bagni", total_size: "Superficie totale", per_year: "All'anno", share_size: "Dimensione della quota",
    about_heading: "Informazioni su questo immobile",
    desc_empty: "I dettagli completi saranno disponibili a breve. Scrivici usando il modulo di richiesta informazioni.",
    show_less: "Mostra meno", read_more: "Leggi tutto",
    amenities_heading: "Caratteristiche e servizi",
    all_amenities: (n) => `Vedi tutti i ${n} servizi`,
    location_heading: "Posizione",
    similar_heading: (country) => `${country}: immobili simili`,
    pillar_link: (country) => `${country}: vedi tutti gli immobili in comproprietà →`,
    tab_overview: "Panoramica", tab_look: "Interni", tab_amenities: "Servizi", tab_location: "Posizione", tab_coown: "Comproprietà", tab_fin: "Finanziamento",
    look_heading: "Uno sguardo all'interno",
    look_sub: "Sfoglia la galleria fotografica, oppure chiedici un tour virtuale 3D completo di questa casa.",
    look_gallery_btn: "Visualizza la galleria fotografica",
    tour_btn: "Richiedi un tour 3D",
    coown_heading: "Come funziona la comproprietà",
    coown_points: (n, days) => [
      [`Possiede 1/${n} della casa`, "Proprietà immobiliare reale, con atto notarile a suo nome — non una multiproprietà, non un sistema a punti."],
      [`~${days} giorni all'anno`, "I soggiorni sono distribuiti in modo equo tra i comproprietari nell'arco di tutto l'anno."],
      ["I costi sono condivisi", `Paga 1/${n} dei costi di gestione complessivi della casa, ripartiti tra tutti i proprietari.`],
      ["Gestione completa", "Manutenzione, pulizie e calendario dei soggiorni sono gestiti per lei — non le resta che arrivare e godersi la casa."],
      ["Può vendere quando vuole", "La sua quota è un bene reale: può venderla al prezzo che stabilisce lei."],
    ],
    missing_photos: (n) => `Ci sono ancora ${n} foto da vedere`,
    unlock_sub: "Sblocca una volta sola — vedrai tutte le gallerie del sito, gratis",
    unlock_now: "Sblocca ora →",
    unlocked_title: "Le sue gallerie sono sbloccate",
    unlocked_sub: "Visualizza la galleria fotografica completa di questa casa",
    view_gallery_btn: "Visualizza la galleria →",
    form_eye: "Scrivici",
    form_title: "Richiedi informazioni su questo immobile",
    form_sub: "Il nostro team risponde di solito entro poche ore. Senza impegno.",
    contact_cta: "Contattaci",
    contact_sub: "Richiedi informazioni",
    eq_name: "Il suo nome", eq_name_ph: "Nome e cognome",
    eq_email: "Email", eq_email_ph: "your@email.com",
    eq_phone: "Telefono", eq_phone_ph: "+39 o +1…",
    eq_msg: "Messaggio", eq_msg_ph: "Domande su questo immobile…",
    eq_send: "Invia richiesta →", eq_sending: "Invio in corso…",
    eq_thanks: (n) => `Grazie ${n}! La ricontatteremo a breve.`,
    eq_err: "Qualcosa è andato storto. Riprova.",
    eq_chips: (sym) => [
      { k: "when", q: "Che tempi ha in mente?",
        o: ["Nei prossimi 3 mesi", "Quest'anno", "Sto solo guardando"],
        v: ['3-months', 'this-year', 'browsing'] },
      { k: "budget", q: "Che budget ha in mente, più o meno?",
        o: [`Meno di 200.000 ${sym}`, `200.000–400.000 ${sym}`, `Oltre 400.000 ${sym}`, "Preferisco non dirlo"],
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: "seen", q: "Ha già valutato la comproprietà?",
        o: ["È la prima volta che ne sento parlare", "È da un po' che cerco", "Ho già una quota"] },
    ],
    eq_chip_labels: { when: "Tempi", budget: "Budget", seen: "Esperienza" },
    eq_note_add: "Aggiungi un messaggio (facoltativo)",
  },
  nl: {
    cobadge: (n) => `1/${n} mede-eigendom`,
    price_qualifier: (n) => `voor een 1/${n}-aandeel`,
    bedrooms: "Slaapkamers", bathrooms: "Badkamers", total_size: "Totale oppervlakte", per_year: "Per jaar", share_size: "Aandeelgrootte",
    about_heading: "Over deze woning",
    desc_empty: "Volledige details volgen binnenkort. Gebruik het formulier om contact met ons op te nemen.",
    show_less: "Minder tonen", read_more: "Meer lezen",
    amenities_heading: "Kenmerken & voorzieningen",
    all_amenities: (n) => `Alle ${n} voorzieningen`,
    location_heading: "Locatie",
    similar_heading: (country) => `Vergelijkbare woningen in ${country}`,
    pillar_link: (country) => `Bekijk alle woningen met mede-eigendom in ${country} →`,
    tab_overview: "Overzicht", tab_look: "Binnenkijken", tab_amenities: "Voorzieningen", tab_location: "Locatie", tab_coown: "Mede-eigendom", tab_fin: "Financiering",
    look_heading: "Binnenkijken",
    look_sub: "Bekijk de fotogalerij of vraag ons om een volledige 3D-rondleiding door deze woning.",
    look_gallery_btn: "Fotogalerij bekijken",
    tour_btn: "3D-rondleiding aanvragen",
    coown_heading: "Hoe mede-eigendom werkt",
    coown_points: (n, days) => [
      [`U bezit 1/${n} van de woning`, "Echt eigendom, vastgelegd in de akte — geen timeshare, geen punten."],
      [`~${days} dagen per jaar`, "Verblijven worden het hele jaar door eerlijk verdeeld tussen de mede-eigenaren."],
      ["De kosten worden gedeeld", `U betaalt 1/${n} van de totale lopende kosten van de woning, gedeeld door alle eigenaren.`],
      ["Volledig beheerd", "Onderhoud, schoonmaak en planning worden voor u geregeld — u komt alleen nog aan en geniet."],
      ["Verkoop wanneer u wilt", "Uw aandeel is een echt bezit: u verkoopt het tegen een prijs die u zelf bepaalt."],
    ],
    missing_photos: (n) => `U mist ${n} foto's`,
    unlock_sub: "Eén keer ontgrendelen — bekijk elke galerij op de site, gratis",
    unlock_now: "Nu ontgrendelen →",
    unlocked_title: "Uw galerijen zijn ontgrendeld",
    unlocked_sub: "Bekijk de volledige fotogalerij van deze woning",
    view_gallery_btn: "Galerij bekijken →",
    form_eye: "Neem contact op",
    form_title: "Informatie aanvragen over deze woning",
    form_sub: "Ons team reageert meestal binnen een paar uur. Geheel vrijblijvend.",
    contact_cta: "Contact opnemen",
    contact_sub: "Informatie aanvragen",
    eq_name: "Uw naam", eq_name_ph: "Volledige naam",
    eq_email: "E-mail", eq_email_ph: "your@email.com",
    eq_phone: "Telefoon", eq_phone_ph: "+31 of +1…",
    eq_msg: "Bericht", eq_msg_ph: "Vragen over deze woning…",
    eq_send: "Aanvraag versturen →", eq_sending: "Versturen…",
    eq_thanks: (n) => `Bedankt ${n}! We nemen snel contact met u op.`,
    eq_err: "Er is iets misgegaan. Probeer het opnieuw.",
    eq_chips: (sym) => [
      { k: "when", q: "Aan welke termijn denkt u?",
        o: ["De komende 3 maanden", "Dit jaar", "Ik kijk alleen rond"],
        v: ['3-months', 'this-year', 'browsing'] },
      { k: "budget", q: "Aan welk budget denkt u ongeveer?",
        o: [`Minder dan ${sym} 200.000`, `${sym} 200.000–400.000`, `Meer dan ${sym} 400.000`, "Zeg ik liever niet"],
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: "seen", q: "Kende u mede-eigendom al?",
        o: ["Ik hoor er nu voor het eerst van", "Ik kijk al een tijdje rond", "Ik bezit al een aandeel"] },
    ],
    eq_chip_labels: { when: "Termijn", budget: "Budget", seen: "Ervaring" },
    eq_note_add: "Bericht toevoegen (optioneel)",
  },
  pt: {
    cobadge: (n) => `1/${n} em compropriedade`,
    price_qualifier: (n) => `por uma quota de 1/${n}`,
    bedrooms: "Quartos", bathrooms: "Casas de banho", total_size: "Área total", per_year: "Por ano", share_size: "Dimensão da quota",
    about_heading: "Sobre este imóvel",
    desc_empty: "Descrição completa em breve. Use o formulário de contacto para falar connosco.",
    show_less: "Ver menos", read_more: "Ler mais",
    amenities_heading: "Características e comodidades",
    all_amenities: (n) => `Todas as ${n} comodidades`,
    location_heading: "Localização",
    similar_heading: (country) => `Imóveis semelhantes em ${country}`,
    pillar_link: (country) => `Ver todos os imóveis em compropriedade em ${country} →`,
    tab_overview: "Visão geral", tab_look: "Ver por dentro", tab_amenities: "Comodidades", tab_location: "Localização", tab_coown: "Compropriedade", tab_fin: "Financiamento",
    look_heading: "Ver por dentro",
    look_sub: "Percorra a galeria de fotografias ou peça-nos uma visita virtual 3D completa desta casa.",
    look_gallery_btn: "Ver galeria de fotografias",
    tour_btn: "Pedir visita 3D",
    coown_heading: "Como funciona a compropriedade",
    coown_points: (n, days) => [
      [`É proprietário de 1/${n} da casa`, "Propriedade real, com escritura em seu nome — não é multipropriedade nem um sistema de pontos."],
      [`~${days} dias por ano`, "As estadias são agendadas de forma justa entre os comproprietários ao longo de todo o ano."],
      ["Os custos são partilhados", `Paga 1/${n} das despesas correntes da casa, repartidas por todos os proprietários.`],
      ["Gestão completa", "Tratamos da manutenção, das limpezas e do calendário de estadias — basta chegar e aproveitar."],
      ["Venda quando quiser", "A sua quota é um ativo real: pode vendê-la pelo preço que definir."],
    ],
    missing_photos: (n) => `Está a perder ${n} fotografias`,
    unlock_sub: "Desbloqueie uma vez — veja todas as galerias do site, sem custos",
    unlock_now: "Desbloquear agora →",
    unlocked_title: "As suas galerias estão desbloqueadas",
    unlocked_sub: "Veja a galeria de fotografias completa desta casa",
    view_gallery_btn: "Ver galeria →",
    form_eye: "Fale connosco",
    form_title: "Peça informações sobre este imóvel",
    form_sub: "A nossa equipa costuma responder em poucas horas. Sem compromisso.",
    contact_cta: "Contacte-nos",
    contact_sub: "Pedir informações",
    eq_name: "O seu nome", eq_name_ph: "Nome completo",
    eq_email: "Email", eq_email_ph: "your@email.com",
    eq_phone: "Telemóvel", eq_phone_ph: "+351 ou +1…",
    eq_msg: "Mensagem", eq_msg_ph: "Alguma dúvida sobre este imóvel…",
    eq_send: "Enviar pedido →", eq_sending: "A enviar…",
    eq_thanks: (n) => `Obrigado, ${n}! Entraremos em contacto em breve.`,
    eq_err: "Algo correu mal. Tente novamente, por favor.",
    eq_chips: (sym) => [
      { k: "when", q: "Para quando está a pensar?",
        o: ["Nos próximos 3 meses", "Este ano", "Só estou a ver"],
        v: ['3-months', 'this-year', 'browsing'] },
      { k: "budget", q: "Que orçamento tem em mente, mais ou menos?",
        o: [`Menos de 200.000 ${sym}`, `200.000–400.000 ${sym}`, `Mais de 400.000 ${sym}`, "Prefiro não dizer"],
        v: ['under-200k', '200-400k', '400k+', ''] },
      { k: "seen", q: "Já conhecia a compropriedade?",
        o: ["É a primeira vez que ouço falar", "Já ando a ver há algum tempo", "Já tenho uma quota"] },
    ],
    eq_chip_labels: { when: "Quando", budget: "Orçamento", seen: "Experiência" },
    eq_note_add: "Adicionar uma nota (opcional)",
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

// Statuses that get a public detail page.
//
// `hidden` means hidden — staged rows from the listing-sync pipeline must never
// be reachable (19 Jul incident). `sold` is NOT hidden: a sold home keeps its
// page and renders the Sold Out treatment (the badge in the price row, an
// OutOfStock offer in the schema, and the Live-only "similar homes" block as
// the recovery path). Those URLs are indexed and are handed out in enquiry,
// unlock and gallery emails, so 404ing them loses the link equity and dead-ends
// the lead. Discovery surfaces that publish a headline count -- destination
// grids, homepages, sitemap, feeds, alerts, price ticker, "similar homes" --
// stay Live/for_sale, so counts still describe what is actually buyable.
const PUBLIC_STATUSES = ['Live', 'for_sale', 'sold'];

function normaliseLocation(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function distanceKm(origin, candidate) {
  const coordinateValues = [origin.lat, origin.lng, candidate.lat, candidate.lng];
  if (coordinateValues.some(value => value === null || value === undefined || value === '')) return null;

  const originLat = Number(origin.lat);
  const originLng = Number(origin.lng);
  const candidateLat = Number(candidate.lat);
  const candidateLng = Number(candidate.lng);
  if (![originLat, originLng, candidateLat, candidateLng].every(Number.isFinite)) return null;

  const toRadians = degrees => degrees * Math.PI / 180;
  const latDelta = toRadians(candidateLat - originLat);
  const lngDelta = toRadians(candidateLng - originLng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(originLat)) * Math.cos(toRadians(candidateLat))
    * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rankSimilarProperties(origin, candidates) {
  const originCity = normaliseLocation(origin.city);
  const originRegion = normaliseLocation(origin.region);
  const originPrice = Number(origin.price);

  return candidates
    .map(candidate => {
      const sameCity = originCity && normaliseLocation(candidate.city) === originCity;
      const sameRegion = originRegion && normaliseLocation(candidate.region) === originRegion;
      const distance = distanceKm(origin, candidate);
      const price = Number(candidate.price);

      return {
        candidate,
        // Location always wins. Coordinates rank the remaining same-country
        // homes by physical proximity; price is only a tie-breaker.
        locationTier: sameCity ? 0 : (sameRegion ? 1 : (distance === null ? 3 : 2)),
        distance: distance ?? Number.POSITIVE_INFINITY,
        priceDifference: Number.isFinite(originPrice) && originPrice > 0 && Number.isFinite(price)
          ? Math.abs(price - originPrice) / originPrice
          : Number.POSITIVE_INFINITY,
      };
    })
    .sort((a, b) => (
      a.locationTier - b.locationTier
      || a.distance - b.distance
      || a.priceDifference - b.priceDifference
      || a.candidate.slug.localeCompare(b.candidate.slug)
    ))
    .map(({ candidate }) => candidate);
}

export async function getStaticPaths() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('properties')
    .select('slug, is_discreet')
    .in('status', PUBLIC_STATUSES);

  // A failed catalogue read must fail the build. Treating it as an empty
  // catalogue would deploy successfully without any pre-rendered properties.
  if (error) throw error;

  // Discreet Sale homes are never pre-rendered: their getStaticProps returns
  // a redirect, which Next.js only allows at request time (fallback:
  // 'blocking'), never during the build ("gsp-redirect-during-prerender").
  return {
    paths: (data || []).filter(p => !p.is_discreet).map(p => ({ params: { slug: p.slug } })),
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
    // A successful query with no row is a genuine 404. A query error is not:
    // it must be thrown so ISR keeps the last good page rather than replacing
    // it with a cached false 404 during a transient Supabase incident.
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .eq('slug', params.slug)
      .in('status', PUBLIC_STATUSES)
      .maybeSingle();

    if (propErr) throw propErr;
    if (!property) return { notFound: true, revalidate: 3600 };

    // Hidden/staged rows must never render publicly (19 Jul incident).
    // Sold rows do get a page -- see PUBLIC_STATUSES above. `revalidate` lets a
    // page appear or disappear automatically when the status changes.
    if (!PUBLIC_STATUSES.includes(property.status)) {
      return { notFound: true, revalidate: 3600 };
    }

    // Discreet Sale homes have no listing page at all (David, 15 Sep 2026):
    // the card opens the request popup and the brochure arrives by email.
    // Anyone landing on the URL goes to the Discreet Sale collection instead.
    if (property.is_discreet) {
      return { redirect: { destination: '/our-homes/?discreet=1', permanent: false }, revalidate: 3600 };
    }

    const prop = {
      ...property,
      // Booleans and counts only. `drive_url` is a publicly readable Google
      // Drive folder and `photos`/`extra_photos` are the gated gallery itself:
      // spreading the row put all three into __NEXT_DATA__, so the "unlock"
      // was decorative for anyone who opened the page source (16 Sep 2026).
      hasGallery: !!property.drive_url,
      galleryTotal: (Array.isArray(property.photos) && property.photos.length > 0)
        ? property.photos.length + (Array.isArray(property.extra_photos) ? property.extra_photos.length : 0)
        : (property.total_images || (property.images || []).length),
      dateAdded: property.date_added,
    };
    delete prop.drive_url;
    delete prop.photos;
    delete prop.extra_photos;
    delete prop.documents;

    // Enhanced sections (tab bar, Look inside + 3D tour, Co-ownership,
    // Financing) render on Pacaso-partner listings only (Dylan, 20 Jul 2026).
    // Computed HERE, server-side, and passed as a plain boolean so the
    // partner name itself never reaches the client.
    const showEnhancedSections = property.partner === 'pacaso';

    // The numbers block. Built here because it needs the partner and the fact
    // table, and resolved into an anonymous shape so the partner's name never
    // reaches __NEXT_DATA__ (see lib/propertyFactsPanel.js). Discreet homes
    // get nothing: their whole page is a teaser until the visitor enquires.
    const facts = property.is_discreet ? null : await buildFactsPanel(supabase, property);

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
    // Every locale's AI-description column, not a hand-listed few — a missed
    // column here would ship partner-identifying text into __NEXT_DATA__.
    for (const loc of ALL_LOCALES) delete prop[`description_ai_${loc}`];

    // Discreet-sale homes ship ONE photo, the title and the headline numbers.
    // Description, amenities, every photo, the brochure extras and the Drive
    // gallery are stripped here so they never reach __NEXT_DATA__; the page
    // fetches them from /api/discreet-listing once the visitor has enquired.
    if (property.is_discreet) {
      prop.images = property.img ? [property.img] : [];
      prop.total_images = 1;
      prop.galleryTotal = 1;
      prop.hasGallery = false;
      delete prop.description;
      delete prop.amenities;
      for (const loc of ALL_LOCALES) { delete prop[`description_${loc}`]; delete prop[`amenities_${loc}`]; }
    }

    // Similar homes — COP's own catalog only, never a partner feed. Rank by
    // same city, then same region, then geographic distance within the country;
    // price only breaks ties. Current property excluded, max 3. Best-effort:
    // if it errors we render the page with an empty similar list instead of
    // breaking the whole page.
    let similar = [];
    try {
      // Perf note (28 Aug 2026): this used to select `images` (the full
      // photo-URL array) and every locale's title for up to 200 rows, on
      // every ISR build of every property URL in every locale — ~1–3 MB and
      // 0.4–0.6 s per build. When the translation backfill put ~2,500 new
      // property URLs into the sitemap at once, the resulting crawl storm
      // saturated Supabase (the 28 Aug 522 outage / admin lag). Candidate
      // ranking now fetches only lightweight location fields. This
      // lets locality outrank price without reintroducing the old multi-MB
      // payload; translated titles and image arrays are fetched only for the
      // three winning cards.
      const { data: similarRaw, error: similarError } = await supabase
        .from('properties')
        .select('slug, price, country, region, city, lat, lng, status')
        .eq('country', property.country)
        .neq('slug', property.slug)
        // Deliberately NOT PUBLIC_STATUSES: never recommend a sold home.
        // On a sold page this block is the recovery path to buyable stock.
        .in('status', ['Live', 'for_sale'])
        // The largest current country has fewer than 200 public homes. Keep a
        // generous ceiling while preventing an unbounded future payload.
        .limit(500);
      if (similarError) throw similarError;

      const ranked = rankSimilarProperties(
        property,
        (similarRaw || []).filter(candidate => Number(candidate.price) > 0)
      ).slice(0, 3);
      let top3 = [];
      if (ranked.length) {
        const { data: cardRows, error: cardError } = await supabase
          .from('properties')
          .select(`slug, ${localeColumns(['title'])}, img, images, price, currency, share_denominator, country, region, city, beds, size, status`)
          .in('slug', ranked.map(p => p.slug));
        if (cardError) throw cardError;
        const cardsBySlug = Object.fromEntries((cardRows || []).map(row => [row.slug, row]));
        top3 = ranked.map(row => cardsBySlug[row.slug]).filter(Boolean);
      }

      similar = top3.map(p => ({
        slug: p.slug,
        title: p.title,
        ...pickLocalized(p, ['title']),
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
        hasGallery: false, // no gallery-lock slide on similar cards
      }));
    } catch (_) {
      similar = [];
    }

    // Which locales this property is genuinely translated into. Drives the
    // hreflang set and noindex below: an Italian URL serving an English title
    // and description is thin content, so we do not ask Google to index it
    // until the translation lands. Computed from the full row before the
    // partner fields are stripped.
    const hreflangLocales = translatedLocales(property, ['title', 'description']);

    return { props: { property: prop, similar, showEnhancedSections, facts: facts || null, hreflangLocales }, revalidate: 3600 };
  } catch (err) {
    // Failed ISR regeneration keeps serving the previous successful page.
    // Do not turn infrastructure/query failures into cacheable 404s.
    console.error(`property/[slug] getStaticProps failed for "${params.slug}":`, err);
    throw err;
  }
}

const SYM = { EUR: '€', USD: '$', GBP: '£' };
function fmt(price, currency, locale = 'en-GB') { return `${SYM[currency] || currency}${price.toLocaleString(locale)}`; }
function fmtApprox(amount, locale = 'en-GB') {
  return (Math.round(amount / 1_000) * 1_000).toLocaleString(locale);
}
const SITE_URL = 'https://co-ownership-property.com';
// Every launched locale has a property-detail mirror, so the hreflang set and
// the path builder both come straight from the locale table.
const PROPERTY_HREFLANG_LOCALES = SUPPORTED_LOCALES;

function propertyPathForLocale(slug, locale) {
  return propertyHref(slug, locale);
}

// Given a property record and a target locale, return the best title /
// description / amenities — translated where available, English fallback.
function localizedFields(p, locale) {
  const amenities = p[`amenities_${locale}`];
  return {
    title:       localizedField(p, 'title', locale) || '',
    description: localizedField(p, 'description', locale) || '',
    amenities:   (Array.isArray(amenities) && amenities.length) ? amenities : (p.amenities || []),
  };
}

const COUNTRY_DESTINATIONS = {
  Austria: { code: 'AT', slug: 'austria-fractional-ownership-properties' },
  Croatia: { code: 'HR', slug: 'croatia-fractional-ownership-properties' },
  England: {
    slug: 'england-fractional-ownership-properties',
    labels: { en: 'England', es: 'Inglaterra', fr: 'Angleterre', de: 'England', it: 'Inghilterra', nl: 'Engeland', pt: 'Inglaterra', sv: 'England', da: 'England', no: 'England' },
  },
  France: { code: 'FR', slug: 'france-fractional-ownership-properties' },
  Germany: { code: 'DE', slug: 'germany-fractional-ownership-properties' },
  Italy: { code: 'IT', slug: 'italy-fractional-ownership-properties' },
  Mexico: { code: 'MX', slug: 'mexico-fractional-ownership-properties' },
  MEX: { code: 'MX', slug: 'mexico-fractional-ownership-properties' },
  Portugal: { code: 'PT', slug: 'portugal-fractional-ownership-properties' },
  Spain: { code: 'ES', slug: 'spain-fractional-ownership-properties' },
  Sweden: { code: 'SE', slug: 'sweden-fractional-ownership-properties' },
  USA: {
    code: 'US',
    slug: 'usa-fractional-ownership-properties',
    labels: { en: 'USA', es: 'EE. UU.', fr: 'États-Unis', de: 'USA', it: 'Stati Uniti', nl: 'VS', pt: 'EUA', sv: 'USA', da: 'USA', no: 'USA' },
  },
};

const MAIN_REGION_DESTINATIONS = [
  { country: 'France', regions: ["Côte d'Azur", 'Côte d’Azur'], slug: 'south-of-france-fractional-ownership-properties', labels: { en: 'South of France', es: 'Sur de Francia', fr: 'Sud de la France', de: 'Südfrankreich', it: 'Sud della Francia', nl: 'Zuid-Frankrijk', pt: 'Sul da França', sv: 'Södra Frankrike', da: 'Sydfrankrig', no: 'Sør-Frankrike' } },
  { country: 'France', regions: ['French Alps', 'Portes du Soleil'], slug: 'french-alps-fractional-ownership-properties', labels: { en: 'French Alps', es: 'Alpes franceses', fr: 'Alpes françaises', de: 'Französische Alpen', it: 'Alpi francesi', nl: 'Franse Alpen', pt: 'Alpes Franceses', sv: 'Franska Alperna', da: 'Franske Alper', no: 'De franske Alpene' } },
  { country: 'France', regions: ['Paris'], slug: 'paris-fractional-ownership-properties', label: 'Paris' },
  { country: 'Italy', regions: ['Sardinia'], slug: 'sardinia-fractional-ownership-properties', label: 'Sardinia' },
  { country: 'Italy', regions: ['Lake Como'], cities: ['Lake Como'], slug: 'lake-como-fractional-ownership-properties', label: 'Lake Como' },
  { country: 'Italy', regions: ['Lago Maggiore', 'Lake Garda'], slug: 'italian-lakes-fractional-ownership-properties', labels: { en: 'Italian Lakes', es: 'Lagos italianos', fr: 'Lacs italiens', de: 'Italienische Seen', it: 'Laghi italiani', nl: 'Italiaanse meren', pt: 'Lagos italianos', sv: 'Italienska sjöarna', da: 'Italienske søer', no: 'Italienske innsjøer' } },
  { country: 'Italy', regions: ['Liguria'], slug: 'liguria-fractional-ownership-properties', label: 'Liguria' },
  { country: 'Spain', regions: ['Ibiza'], cities: ['Ibiza'], slug: 'ibiza-fractional-ownership-properties', label: 'Ibiza' },
  { country: 'Spain', regions: ['Menorca'], cities: ['Menorca'], slug: 'menorca-fractional-ownership-properties', label: 'Menorca' },
  { country: 'Spain', regions: ['Mallorca'], slug: 'mallorca-fractional-ownership-properties', label: 'Mallorca' },
  { country: 'Spain', regions: ['Tenerife', 'Canary Islands'], slug: 'canary-islands-fractional-ownership-properties', labels: { en: 'Canary Islands', es: 'Islas Canarias', fr: 'Îles Canaries', de: 'Kanarische Inseln', it: 'Isole Canarie', nl: 'Canarische Eilanden', pt: 'Ilhas Canárias', sv: 'Kanarieöarna', da: 'De Kanariske Øer', no: 'Kanariøyene' } },
  { country: 'Spain', regions: ['Costa del Sol'], slug: 'costa-del-sol-fractional-ownership-properties', label: 'Costa del Sol' },
  { country: 'Spain', regions: ['Costa Blanca'], slug: 'costa-blanca-fractional-ownership-properties', label: 'Costa Blanca' },
  { country: 'Spain', regions: ['Costa de la Luz'], slug: 'costa-de-la-luz-fractional-ownership-properties', label: 'Costa de la Luz' },
  { country: 'Spain', regions: ['Madrid'], slug: 'madrid-fractional-ownership-properties', label: 'Madrid' },
  { country: 'Spain', regions: ['Baqueira', 'Pyrenees'], slug: 'pyrenees-mountains-fractional-ownership-properties', labels: { en: 'Pyrenees', es: 'Pirineos', fr: 'Pyrénées', de: 'Pyrenäen', it: 'Pirenei', nl: 'Pyreneeën', pt: 'Pirenéus', sv: 'Pyrenéerna', da: 'Pyrenæerne', no: 'Pyreneene' } },
  { country: 'England', regions: ['London'], slug: 'london-fractional-ownership-properties', label: 'London' },
  ...['Arizona', 'California', 'Colorado', 'Florida', 'Nevada', 'South Carolina', 'Utah', 'Wyoming'].map(region => ({
    country: 'USA',
    regions: [region],
    slug: `${region.toLowerCase().replaceAll(' ', '-')}-fractional-ownership-properties`,
    label: region,
  })),
];

function destinationHref(slug, locale) {
  const targetLocale = destinationAvailableIn(slug, locale) ? locale : 'en';
  return `${familyPrefix(targetLocale, 'destinations')}${slug}/`;
}

function destinationLabel(destination, locale, fallback) {
  return destination.labels?.[locale] || destination.labels?.en || destination.label || fallback;
}

function countryLabel(country, destination, locale) {
  const configured = destinationLabel(destination, locale, null);
  if (configured) return configured;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(destination.code) || country;
  } catch {
    return country;
  }
}

function destinationTrailForProperty(property, locale) {
  const mainRegion = MAIN_REGION_DESTINATIONS.find(destination => (
    destination.country === property.country
    && (destination.cities?.includes(property.city) || destination.regions.includes(property.region))
  ));
  const country = COUNTRY_DESTINATIONS[property.country];

  return [
    property.city && { label: property.city },
    mainRegion
      ? { label: destinationLabel(mainRegion, locale, property.region), href: destinationHref(mainRegion.slug, locale) }
      : (property.region && { label: property.region }),
    property.country && (country
      ? { label: countryLabel(property.country, country, locale), href: destinationHref(country.slug, locale) }
      : { label: property.country }),
  ].filter(Boolean);
}

function LocationTrail({ items, separator }) {
  return items.map((item, index) => (
    <span key={`${item.label}-${index}`}>
      {item.href
        ? <a className="pp-location-link" href={item.href}>{item.label}</a>
        : item.label}
      {index < items.length - 1 && <span className="pp-crumb-sep">{separator}</span>}
    </span>
  ));
}

// ── Notify-me bell on the gallery ─────────────────────────────────────────
// Replaces the old bottom-left "Track this home" text pill (Dylan, 28 Aug:
// the pill distracted from the photos). A round icon button under the heart,
// opening a small popover — price and share-availability alerts for exactly
// this home. Posts to the same /api/track-property endpoint as PropertyWatch.
const BELL_COPY = {
  en: { title: 'Notify me!', sub: 'Get an email if the price or the number of available shares changes — only this home, never spam.', placeholder: 'Your email address', btn: 'Notify me', done: "Done — we'll email you the moment anything changes.", error: 'Something went wrong — please try again.', aria: 'Get notified about this home' },
  es: { title: '¡Avísame!', sub: 'Recibe un email si cambia el precio o el número de participaciones disponibles — solo de esta propiedad.', placeholder: 'Tu correo electrónico', btn: 'Avisarme', done: 'Hecho — te escribiremos en cuanto algo cambie.', error: 'Algo salió mal — inténtalo de nuevo.', aria: 'Recibir avisos de esta propiedad' },
  fr: { title: 'Prévenez-moi !', sub: 'Recevez un e-mail si le prix ou le nombre de quotes-parts disponibles change — uniquement pour ce bien.', placeholder: 'Votre adresse e-mail', btn: 'Me prévenir', done: 'C\u2019est noté — nous vous écrirons dès que quelque chose change.', error: 'Une erreur est survenue — veuillez réessayer.', aria: 'Être averti pour ce bien' },
  de: { title: 'Benachrichtigen Sie mich!', sub: 'Sie erhalten eine E-Mail, wenn sich der Preis oder die Zahl der verfügbaren Anteile ändert — nur für diese Immobilie.', placeholder: 'Ihre E-Mail-Adresse', btn: 'Benachrichtigen', done: 'Erledigt — wir melden uns, sobald sich etwas ändert.', error: 'Etwas ist schiefgelaufen — bitte erneut versuchen.', aria: 'Bei Änderungen benachrichtigt werden' },
  it: { title: 'Avvisami!', sub: 'Ricevi una email se cambia il prezzo o il numero di quote disponibili — solo per questa casa.', placeholder: 'Il tuo indirizzo email', btn: 'Avvisami', done: 'Fatto — ti scriviamo appena cambia qualcosa.', error: 'Qualcosa è andato storto — riprova.', aria: 'Ricevi avvisi su questa casa' },
  nl: { title: 'Houd mij op de hoogte!', sub: 'U ontvangt een e-mail als de prijs of het aantal beschikbare aandelen verandert — alleen voor deze woning.', placeholder: 'Uw e-mailadres', btn: 'Houd mij op de hoogte', done: 'Klaar — we mailen u zodra er iets verandert.', error: 'Er ging iets mis — probeer het opnieuw.', aria: 'Meldingen over deze woning' },
  pt: { title: 'Avise-me!', sub: 'Você recebe um e-mail se o preço ou o número de cotas disponíveis mudar — apenas desta casa.', placeholder: 'Seu e-mail', btn: 'Avise-me', done: 'Pronto — escreveremos assim que algo mudar.', error: 'Algo deu errado — tente novamente.', aria: 'Receber avisos sobre esta casa' },
  sv: { title: 'Meddela mig!', sub: 'Få ett mejl om priset eller antalet tillgängliga andelar ändras — bara för det här huset.', placeholder: 'Din e-postadress', btn: 'Meddela mig', done: 'Klart — vi hör av oss så fort något ändras.', error: 'Något gick fel — försök igen.', aria: 'Få aviseringar om det här huset' },
  da: { title: 'Giv mig besked!', sub: 'Få en mail, hvis prisen eller antallet af ledige andele ændrer sig — kun for denne bolig.', placeholder: 'Din e-mailadresse', btn: 'Giv mig besked', done: 'Klaret — vi skriver, så snart noget ændrer sig.', error: 'Noget gik galt — prøv igen.', aria: 'Få besked om denne bolig' },
  no: { title: 'Varsle meg!', sub: 'Få en e-post hvis prisen eller antall tilgjengelige andeler endres — kun for denne boligen.', placeholder: 'Din e-postadresse', btn: 'Varsle meg', done: 'Klart — vi skriver så snart noe endres.', error: 'Noe gikk galt — prøv igjen.', aria: 'Få varsler om denne boligen' },
};

function NotifyBell({ slug, locale, title }) {
  const t = BELL_COPY[locale] || BELL_COPY.en;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error

  async function submit(e) {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/track-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug, kind: 'watch', locale }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button
        className={`pp-bell-btn${open ? ' open' : ''}`}
        aria-label={t.aria}
        onClick={() => {
          setOpen(o => !o);
          if (!open) track('property_watch_opened', { property: title, slug, locale });
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
      </button>
      {open && (
        <div className="pp-bell-pop" role="dialog" aria-label={t.title}>
          <button className="pp-bell-close" aria-label="Close" onClick={() => setOpen(false)}>&times;</button>
          <p className="pp-bell-title">{t.title}</p>
          {state === 'done' ? (
            <p className="pp-bell-done">✓ {t.done}</p>
          ) : (
            <>
              <p className="pp-bell-sub">{t.sub}</p>
              <form className="pp-bell-form" onSubmit={submit}>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder={t.placeholder}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={state === 'busy'}>{t.btn}</button>
              </form>
              {state === 'error' && <p className="pp-bell-error">{t.error}</p>}
            </>
          )}
        </div>
      )}
    </>
  );
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
function EnquiryForm({ propertySlug, propertyTitle, propertyUrl, locale, currencySymbol = '\u20ac' }) {
  const t = COPY[locale] || COPY.en;
  const saved = getSavedUser();
  const [f, setF] = useState({ name: saved.name, email: saved.email, phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  /* Tap-to-answer, in place of the free-text box.
     Of 1,186 property enquiries on record, 21 carried a typed message — 1.8%.
     The box was therefore asking 98% of people to stare at an empty field and
     then skip it, while telling the person writing the reply nothing at all.
     Three taps answer the questions every reply currently has to guess:
     when, how much, and whether they already understand the model.
     The free-text box survives behind a disclosure for the 1.8% who use it. */
  const [chips, setChips] = useState({});
  const [noteOpen, setNoteOpen] = useState(false);
  const chipQs = typeof t.eq_chips === 'function' ? t.eq_chips(currencySymbol) : [];
  const tapChip = (k, v) => setChips(prev => (prev[k] === v ? (() => { const n = { ...prev }; delete n[k]; return n; })() : { ...prev, [k]: v }));

  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    try {
      /* The chip answers go into the same `message` field the textarea used, so
         nothing downstream — CRM, reply drafter, notification email — changes. */
      const answered = chipQs
        .filter(c => chips[c.k])
        .map(c => `${(t.eq_chip_labels && t.eq_chip_labels[c.k]) || c.k}: ${chips[c.k]}`);
      const composed = [answered.join('\n'), f.message.trim()].filter(Boolean).join('\n\n');
      /* Canonical budget value, matched to the tapped label by position.
         The label must not be parsed: "Mas de 400.000" and "Uber 400.000"
         carry no "+", so parseBudgetRange reads them as a single number and
         returns them as a MAXIMUM — recording "over 400k" as "up to 400k",
         the exact opposite, and then matching the buyer to cheap homes. */
      const canon = (key) => {
        const q = chipQs.find(c => c.k === key);
        return q && chips[key] && q.v ? q.v[q.o.indexOf(chips[key])] || '' : '';
      };
      const budgetValue = canon('budget');
      const timeframeValue = canon('when');
      /* The budget chip also goes up as `budget`, which the API already parses
         into leads.budget_min / budget_max (parseBudgetRange handles "Under
         X200k", "X200-400k" and "X400k+" whatever the currency symbol, since it
         only reads the digits). Without this the answer is text in a message
         field and cannot be sorted or filtered on — which was the whole point
         of asking. "Rather not say" parses to nulls and is harmless. */
      const r = await fetch('/api/enquiry/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, message: composed, budget: budgetValue || undefined, timeframe: timeframeValue || undefined, property: propertyTitle, propertySlug, url: propertyUrl, attribution: getFirstTouch(), locale, [HONEYPOT_FIELD]: honeypot }) });
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
          chips_answered: answered.length,
          chip_when: chips.when || '',
          chip_budget: chips.budget || '',
          chip_seen: chips.seen || '',
          typed_note: f.message.trim() ? 1 : 0,
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
      {chipQs.map(c => (
        <div key={c.k} className="eq-chips">
          <span className="eq-chips-q">{c.q}</span>
          <div className="eq-chips-row">
            {c.o.map(opt => (
              <button
                type="button"
                key={opt}
                className={'eq-chip' + (chips[c.k] === opt ? ' is-on' : '')}
                aria-pressed={chips[c.k] === opt}
                onClick={() => tapChip(c.k, opt)}
              >{opt}</button>
            ))}
          </div>
        </div>
      ))}

      {noteOpen ? (
        <div className="eq-field">
          <label>{t.eq_msg}</label>
          <textarea rows={3} placeholder={t.eq_msg_ph} value={f.message} onChange={set('message')} autoFocus />
        </div>
      ) : (
        <button type="button" className="eq-note-add" onClick={() => setNoteOpen(true)}>
          {t.eq_note_add || t.eq_msg}
        </button>
      )}
      <button type="submit" className="eq-submit" disabled={status === 'sending'}>
        {status === 'sending' ? t.eq_sending : t.eq_send}
      </button>
      {status === 'error' && <p className="eq-err">{t.eq_err}</p>}
    </form>
  );
}

/**
 * Sticky enquiry bar — phones only.
 *
 * On desktop the enquiry form sits in a sticky right rail and is never more
 * than a glance away. On a phone that rail stacks to the very bottom of a
 * long page, so the call to action is effectively absent for the audience
 * that engages most: mobile runs 58% engaged against desktop's 33% and
 * produces as many form starts from half the users.
 *
 * This shows the price and one button once the hero has scrolled past.
 * (17 Sep 2026)
 */
function StickyEnquiryBar({ priceLabel, shareLabel, ctaLabel, onTap }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Appear after roughly one screen, hide again at the foot of the page so
    // it never sits on top of the enquiry form it is pointing at.
    const onScroll = () => {
      const y = window.scrollY || 0;
      const atFoot = (window.innerHeight + y) > (document.body.scrollHeight - 900);
      setShown(y > 520 && !atFoot);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className={`pp-stickybar${shown ? ' is-in' : ''}`} aria-hidden={!shown}>
      <span className="pp-stickybar-price">
        <span className="pp-stickybar-val">{priceLabel}</span>
        <span className="pp-stickybar-lbl">{shareLabel}</span>
      </span>
      <a
        href="#property-enquiry"
        className="pp-stickybar-btn"
        tabIndex={shown ? 0 : -1}
        onClick={onTap}
      >
        {ctaLabel}
      </a>
    </div>
  );
}

/* ── Main page ── */
export default function PropertyPage({ property: p0, similar, showEnhancedSections = false, facts = null, forceLocale = null, hreflangLocales = null }) {
  const router = useRouter();
  // Discreet-sale homes: the static props carry a stripped row; once the
  // visitor has enquired the full listing is fetched and merged in here.
  const [fullListing, setFullListing] = useState(null);
  const [discreetBusy, setDiscreetBusy] = useState(false);
  const [showDiscreet, setShowDiscreet] = useState(false);
  const p = fullListing ? { ...p0, ...fullListing } : p0;
  const discreetLocked = !!p0.is_discreet && !fullListing;
  // forceLocale wins for SSG'd /es/propiedades/[slug] and /fr/proprietes/[slug]
  // wrappers — those pages know their locale at build time. For the canonical
  // /property/[slug] route, fall back to URL path detection then cookie.
  const detected = useLocaleFromCookie(localeFromPath(router.asPath || router.pathname));
  const locale = forceLocale || detected;
  const t = COPY[locale] || COPY.en;
  const localeNumberFmt = numberLocale(locale);

  const local = localizedFields(p, locale);
  const locationTrail = destinationTrailForProperty(p, locale);

  // The numbers panel. `facts` arrives as data, never as sentences, so each
  // language phrases it itself — see lib/propertyFactsPanel.js.
  const ft = FACTS_COPY[locale] || FACTS_COPY.en;
  const usageText = (() => {
    const u = facts && facts.usage;
    if (!u) return null;
    if (u.kind === 'uncapped') return ft.nights_uncapped;
    if (u.kind === 'minimum' && u.nights) return ft.nights_minimum(u.nights);
    if (u.kind === 'fixed' && u.nights) return ft.nights_fixed(u.nights);
    return ft.nights_fraction(u.denom);
  })();
  // The running cost and the verified-on line were derived here. Both left
  // the page on 17 Sep 2026; the fact rows behind them are untouched.

  const [showUnlock, setShowUnlock] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [saved, setSaved] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { try { setUnlocked(!!getSavedUser().validated); } catch (e) {} }, []);

  // Arriving from a gallery link with no visitor token (see pages/gallery/
  // [token].js): open the unlock straight away rather than making them hunt
  // for the button they had already used once.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('unlock') === '1') {
      try { if (getSavedUser().validated) { viewGallery(); return; } } catch (e) {}
      setShowUnlock(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the full discreet listing for a known visitor. Known = a saved,
  // validated user in this browser, or a ?t= visitor token on the URL (the
  // link the enquiry popup / emails carry). One enquiry unlocks every
  // discreet home; the API records which homes each person opens.
  async function loadDiscreetListing(email, name) {
    if (!p0.is_discreet || !email || discreetBusy) return;
    setDiscreetBusy(true);
    try {
      const r = await fetch('/api/discreet-listing/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: p0.slug, email }),
      });
      if (r.ok) {
        const data = await r.json();
        setFullListing(data);
        saveUser({ name: name || getSavedUser().name || '', email, validated: true });
        setUnlocked(true);
      }
    } catch (e) { /* stays locked */ }
    setDiscreetBusy(false);
  }
  useEffect(() => {
    // Personalised email links land here with ?t= naming the reader. Persist
    // them for the rest of the visit so every form on the site is pre-filled
    // and the gallery link carries their token — this runs for every home,
    // discreet or not.
    let email = null, name = null;
    try {
      const fromLink = visitorFromUrl();
      if (fromLink) { email = fromLink.email; name = fromLink.name || null; saveUser({ name: name || '', email }); }
    } catch (e) { /* bad token → treat as anonymous */ }

    if (!p0.is_discreet) return;
    if (!email) { try { const su = getSavedUser(); if (su.validated && su.email) email = su.email; } catch (e) {} }
    if (email) loadDiscreetListing(email, name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p0.slug]);
  function viewGallery() {
    const su = getSavedUser();
    // Carry the visitor token: the gallery of a discreet-sale home only opens
    // for someone who has enquired, and it identifies them on any home.
    const params = [];
    if (su.email) { const tok = visitorToken(su.name, su.email); if (tok) params.push(`t=${tok}`); }
    if (locale !== 'en') params.push(`lang=${locale}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    if (typeof window !== 'undefined') window.open(`/gallery/${p.slug}${qs}`, '_blank');
    // Log this property view + queue its photos email (server batches so it's never spammy)
    if (su.email) {
      fetch('/api/unlock-drive/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: su.name, email: su.email, phone: su.phone,
          propertyTitle: local.title,
          propertyUrl: `https://co-ownership-property.com/property/${p.slug}/`,
          propertyCountry: p.country, locale, [HONEYPOT_FIELD]: '',
        }),
      }).catch(() => {});
    }
  }
  const [descExpanded, setDescExpanded] = useState(false);
  const cx = useCurrency();

  const [amenExpanded, setAmenExpanded] = useState(false);
  const heroImg = p.img || p.images?.[0] || '/images/placeholder.jpg';
  const galleryTotal = p.galleryTotal || p.total_images || p.images.length;
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

  // ── SEO meta ────────────────────────────────────────────────────────────
  // English keeps its original hand-tuned template. Every other locale composes
  // its description from that locale's own title (see propertyMetaDescription
  // in lib/i18n.js) — before this, translated property URLs shipped an English
  // meta description, which cost both the ranking and the snippet.
  const propStyle   = (p.property_style || p.property_type || 'property').toLowerCase();
  const propLocation = [p.city || p.region, p.country].filter(Boolean).join(', ');
  const metaDesc = locale === 'en'
    ? (p.price
        ? `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership at ${fmt(p.price, p.currency)}. Real deeded ownership, own only what you use.`
        : `${p.beds}-bed ${propStyle} in ${propLocation} — fractional co-ownership. Real deeded ownership, own only what you use.`)
    : propertyMetaDescription(locale, {
        title: local.title,
        // formatPrice, not fmt(): fmt is hard-wired to en-GB grouping, which
        // prints €219,000 on an Italian page where the number is €219.000.
        price: p.price ? formatPrice(p.price, p.currency, locale) : '',
      });
  // Canonical URL per locale — wrapper routes pass forceLocale so each
  // translated property URL has its own canonical.
  // Only the locales this property is genuinely translated into get an
  // hreflang entry, and a locale URL that is not translated yet is noindex.
  // English is always indexable. See translatedLocales() in lib/i18n.js.
  const indexableLocales = hreflangLocales && hreflangLocales.length
    ? hreflangLocales
    : PROPERTY_HREFLANG_LOCALES;
  // A discreet-sale home is kept out of the index entirely.
  //
  // `is_discreet` was only ever a CONTENT gate — getStaticProps strips the
  // description, amenities and all but one photo — but the page still emitted a
  // normal title, description, canonical, hreflang set and RealEstateListing
  // JSON-LD, and the sitemap listed it. An indexed page headed "Porto Cervo,
  // Sardinia — 5-Bed Villa With Sea Views" with a photo and a price is not
  // discreet from the seller's neighbours, which is the point of the label.
  // Today this changes nothing (0 discreet homes are Live); it matters the
  // moment the 29 staged ones are released.
  //
  // TO REVERSE (if discreet is meant as "public teaser, gated detail" rather
  // than "quiet listing"): delete `&& !p0.is_discreet` here and drop the
  // is_discreet filter in pages/sitemap.xml.js. Nothing else depends on it.
  // (10 Sep 2026 — David asleep, taking the reversible option.)
  const isIndexable = indexableLocales.includes(locale) && !p0.is_discreet;
  const canonicalPath = propertyPathForLocale(p.slug, locale);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImage = p.img && p.img.startsWith('http') ? p.img : `${SITE_URL}${p.img}`;

  return (
    <>
      <Head>
        {/* No " | Co-Ownership Property" suffix. Live property titles average
            59 characters and run to 117; with the 24-character suffix, 341 of
            351 exceeded the ~60 Google renders, so the brand was never visible
            on a single property SERP — it only pushed the part that
            distinguishes the home out of view. The brand is in the domain. It
            stays on og:title below, where social cards have the room and the
            context helps. (10 Sep 2026) */}
        <title>{local.title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {isIndexable
          ? hreflangLinks({ family: 'property', slug: p.slug, locales: indexableLocales })
          : <meta name="robots" content="noindex,follow" />}
        <meta property="og:title" content={`${local.title} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content={ogLocaleFor(locale)} />
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

      {discreetLocked ? (
        /* ── Discreet sale, locked: one photograph + unlock the full listing ── */
        <div className="pp-discreet-hero" onClick={() => setShowDiscreet(true)} role="button" tabIndex={0}>
          {heroImg && <Img src={heroImg} alt={local.title} sizes="100vw" priority />}
          <span className="pp-discreet-badge">{(DISCREET_COPY[locale] || DISCREET_COPY.en).badge}</span>
          <span className="pp-discreet-cta">{discreetBusy ? (DISCREET_COPY[locale] || DISCREET_COPY.en).btn_sending : (DISCREET_COPY[locale] || DISCREET_COPY.en).btn_idle}</span>
        </div>
      ) : (<>
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
                {/* Slide 0 is eager but NOT priority. The mobile carousel and
                    the desktop gallery are both always in the DOM — CSS hides
                    one per breakpoint — and both used to mark their first
                    image `priority`, so next/image emitted two
                    <link rel=preload as=image> in the head for two DIFFERENT
                    files (gallery-0.jpg here, hero.jpg there). Two preloads at
                    identical priority compete for bandwidth, which is exactly
                    what delays LCP. One preload is enough; the desktop hero
                    keeps it. Still `eager`, so slide 0 is never lazy-loaded.
                    NOTE this removes the duplicate PRELOAD, not the duplicate
                    FETCH — display:none does not stop an <img> loading, so
                    ~40% of above-the-fold image bytes are still discarded.
                    Fixing that needs the two blocks to share one src, or to
                    render conditionally; see the SEO audit. (10 Sep 2026) */}
                <Img src={slide.src} alt={`${local.title} ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ) : (
              <div key={i} className="pp-mob-slide pp-mob-lock" onClick={() => unlocked ? viewGallery() : setShowUnlock(true)}>
                <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>{unlocked ? <path d="M7 11V7a5 5 0 019.9-1"/> : <path d="M7 11V7a5 5 0 0110 0v4"/>}
                </svg>
                <span className="pp-mob-lock-title">{unlocked ? t.unlocked_title : t.missing_photos(missingCount)}</span>
                <span className="pp-mob-lock-sub">{unlocked ? t.unlocked_sub : t.unlock_sub}</span>
                <span className="pp-mob-lock-btn">{unlocked ? t.view_gallery_btn : t.unlock_now}</span>
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
        {!String(p.status || '').toLowerCase().includes('sold') && (
          <NotifyBell slug={p.slug} locale={locale} title={local.title} />
        )}
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
        <div className="pp-gallery-lock" onClick={() => unlocked ? viewGallery() : setShowUnlock(true)}>
          <div className="pp-lock-blur-bg" style={{ backgroundImage: `url('${heroImg}')` }} />
          <svg className="pp-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>{unlocked ? <path d="M7 11V7a5 5 0 019.9-1"/> : <path d="M7 11V7a5 5 0 0110 0v4"/>}
          </svg>
          <span className="pp-lock-title">{unlocked ? t.unlocked_title : t.missing_photos(missingCount)}</span>
          <span className="pp-lock-sub">{unlocked ? t.unlocked_sub : t.unlock_sub}</span>
          <span className="pp-lock-cta-btn">{unlocked ? t.view_gallery_btn : t.unlock_now}</span>
        </div>
      </div>
      </>)}

      {/* ── Anchor tabs (Pacaso listings only) ── */}
      {(showEnhancedSections || usageText) && (
      <nav className="pp-tabs" aria-label="Property sections">
        <a href="#overview" className="pp-tab">{t.tab_overview}</a>
        {showEnhancedSections && <a href="#look-inside" className="pp-tab">{t.tab_look}</a>}
        {local.amenities.length > 0 && <a href="#amenities" className="pp-tab">{t.tab_amenities}</a>}
        {(p.lat || p.city) && <a href="#location" className="pp-tab">{t.tab_location}</a>}
        <a href="#co-ownership" className="pp-tab">{t.tab_coown}</a>
        {facts?.mortgage && Number(p.price) > 0 && <a href="#financing" className="pp-tab">{t.tab_fin}</a>}
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
            <LocationTrail items={locationTrail} separator=" · " />
          </nav>

          <h1 className="pp-title">{local.title}</h1>

          <div className="pp-stats">
            {p.beds > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.beds}</span><span className="pp-stat-lbl">{t.bedrooms}</span></div>}
            {p.baths > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.baths}</span><span className="pp-stat-lbl">{t.bathrooms}</span></div>}
            {p.size > 0 && <div className="pp-stat"><span className="pp-stat-val">{p.size} m²</span><span className="pp-stat-lbl">{t.total_size}</span></div>}
            {/* The old value here was ~365/n, which invents a number: it put
                "~45 days" on Pacaso homes, which have no cap at all, and on
                MYNE homes whose real figure is 44 as a floor. It now says
                what the fact table actually knows, or nothing. */}
            {/* No usage figure, no stat. The fallback here used to be
                t.days_label(), which is 365 divided by the share denominator —
                the generator behind every "~45 days" on the site. It is not a
                number any operator publishes: it is a cap on Pacaso, who have
                none, and it understates MYNE's 44 and &Hamlet's 45, both of
                which are floors. Removed 17 Sep 2026; an empty slot is better
                than an invented one. */}
            {usageText
              ? <div className="pp-stat"><span className="pp-stat-val pp-stat-val-sm">{usageText}</span><span className="pp-stat-lbl">{t.per_year}</span></div>
              : null}
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

          {/* Micro-commitment capture: track a live home / waitlist on a sold one */}
          <PropertyWatch
            slug={p.slug}
            region={p.region || p.country}
            locale={locale}
            mode={String(p.status || '').toLowerCase().includes('sold') ? 'waitlist' : 'watch'}
          />

          {discreetLocked ? (
            <div className="pp-discreet-panel">
              <p className="ul-eye">{(DISCREET_COPY[locale] || DISCREET_COPY.en).badge}</p>
              <h2 className="pp-heading">{(DISCREET_COPY[locale] || DISCREET_COPY.en).locked_title}</h2>
              <p>{(DISCREET_COPY[locale] || DISCREET_COPY.en).locked_sub}</p>
              <button type="button" className="pp-discreet-btn" onClick={() => setShowDiscreet(true)} disabled={discreetBusy}>
                {discreetBusy ? (DISCREET_COPY[locale] || DISCREET_COPY.en).btn_sending : (DISCREET_COPY[locale] || DISCREET_COPY.en).btn_idle}
              </button>
            </div>
          ) : (
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
          )}

          {/* ── The numbers ──
                 The share price and the time, from property_facts and only
                 where verified. A missing figure leaves its row out rather
                 than being estimated.

                 The running cost and the shares-remaining row were here and
                 came out on David's instruction (17 Sep 2026): both are
                 answers we give a buyer once they are talking to us, not
                 figures to publish beside the price. The usage figure stays,
                 because the alternative was the invented ~365/n. ── */}
          {facts && usageText && !discreetLocked && (
            <div className="pp-numbers" id="the-numbers">
              <h2 className="pp-heading">{ft.heading}</h2>
              <div className="pp-num-rows">
                {p.price > 0 && (
                  <div className="pp-num-row">
                    <span className="pp-num-lbl">{ft.share(facts.denom)}</span>
                    <span className="pp-num-val">{fmt(p.price, p.currency || 'EUR', localeNumberFmt)}</span>
                  </div>
                )}
                {usageText && (
                  <div className="pp-num-row">
                    <span className="pp-num-lbl">{ft.time}</span>
                    <span className="pp-num-val">{usageText}</span>
                  </div>
                )}
              </div>
              <p className="pp-num-ask">{ft.ask}</p>
            </div>
          )}

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
              <p className="pp-location-text"><LocationTrail items={locationTrail} separator=", " /></p>
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

          {/* ── Co-ownership: how the model works ──
                 Was Pacaso-only, which hid the best explainer on the site from
                 148 of 268 listings. Now everywhere, and the usage bullet says
                 what the fact table knows rather than 365 divided by eight. ── */}
          {(showEnhancedSections || usageText) && (
          <div className="pp-coown" id="co-ownership">
            <h2 className="pp-heading">{t.coown_heading}</h2>
            <ul className="pp-coown-list">
              {t.coown_points(p.share_denominator || 8, Math.floor(365 / (p.share_denominator || 8)))
                .map(([pointTitle, pointText], i) => {
                  // Bullet 1 is the usage one, and its stock title is 365/n —
                  // the invented figure. Where the fact table knows the real
                  // one, that wins; where it does not, the bullet is dropped
                  // rather than shown with a number nobody publishes.
                  if (i === 1) {
                    if (!usageText) return null;
                    pointTitle = usageText;
                  }
                  return (
                    <li key={i} className="pp-coown-item">
                      <strong>{pointTitle}</strong>
                      <span>{pointText}</span>
                    </li>
                  );
                })
                .filter(Boolean)}
            </ul>
          </div>
          )}

          {/* ── Financing calculator — COP's own widget, generic maths, no
                 partner claims. Pacaso listings only. ── */}
          {/* ── Financing ──
                 The calculator asks for a down payment and an interest rate,
                 so it only belongs where mortgage-style financing actually
                 exists: MYNE's partner banks, Pacaso to 70% LTV, &Hamlet
                 through Nordea. Vivla's facility is secured on an investment
                 portfolio and Abitaro's is ten interest-free instalments —
                 a mortgage calculator would misdescribe both — and Paris
                 shares are cash purchases. ── */}
          {facts?.mortgage && Number(p.price) > 0 && (
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
            <EnquiryForm propertySlug={p.slug} propertyTitle={local.title} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} locale={locale} currencySymbol={(cx && CURRENCY_SYMBOLS[cx.currency]) || CURRENCY_SYMBOLS[p.currency || 'EUR'] || '\u20ac'} />
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
                  <h2 className="pp-heading">{t.similar_heading(p.region || p.city || p.country)}</h2>
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
              <div className="pp-lb-lock" onClick={e => { e.stopPropagation(); setLightbox(null); unlocked ? viewGallery() : setShowUnlock(true); }}>
                <div className="pp-lb-lock-blur" style={{ backgroundImage: `url('${heroImg}')` }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40,marginBottom:12,color:'#fff'}}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>{unlocked ? <path d="M7 11V7a5 5 0 019.9-1"/> : <path d="M7 11V7a5 5 0 0110 0v4"/>}
                </svg>
                <span className="pp-lb-lock-title">{unlocked ? t.unlocked_title : t.missing_photos(missingCount)}</span>
                <span className="pp-lb-lock-sub">{unlocked ? t.unlocked_sub : t.unlock_sub}</span>
                <span className="pp-lb-lock-btn">{unlocked ? t.view_gallery_btn : t.unlock_now}</span>
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

      {showDiscreet && (
        <DiscreetUnlockModal
          property={p0}
          title={local.title}
          onClose={() => setShowDiscreet(false)}
          onUnlocked={({ email, name }) => { setShowDiscreet(false); loadDiscreetListing(email, name); }}
        />
      )}
      {showUnlock && <UnlockModal propertyTitle={local.title} propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`} onClose={() => setShowUnlock(false)} />}
      {showEnhancedSections && showTour && (
        <TourRequestModal
          propertyTitle={local.title}
          propertySlug={p.slug}
          propertyUrl={`https://co-ownership-property.com/property/${p.slug}/`}
          propertyCountry={p.country || null}
          onClose={() => setShowTour(false)}
        />
      )}

      <StickyEnquiryBar
        priceLabel={fmt(p.price, p.currency || 'EUR', localeNumberFmt)}
        shareLabel={t.cobadge(p.share_denominator || 8)}
        ctaLabel={t.contact_cta}
        onTap={() => track('property_stickybar_click', { property: local.title, slug: p.slug, locale })}
      />

      <Newsletter />
      <Footer />
    </>
  );
}
