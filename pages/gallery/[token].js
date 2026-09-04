import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@vercel/analytics';
import { createClient } from '@supabase/supabase-js';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getServerSideProps({ params, query }) {
  const raw = params.token; // could be a base64 token OR a pretty slug
  let name = null, email = null, slug = null, title = null;
  // Locale comes in via ?lang= — preserved from the original email link.
  // Validated against the locale table so new languages work without an edit here.
  const langParam = typeof query.lang === 'string' ? query.lang : null;
  const locale = SUPPORTED_LOCALES.includes(langParam) ? langParam : DEFAULT_LOCALE;

  // ── Decode the path segment — it may be a base64 JSON token or a pretty slug ──
  let tok = null;
  for (const enc of ['base64url', 'base64']) {
    try {
      const o = JSON.parse(Buffer.from(raw, enc).toString('utf-8'));
      if (o && typeof o === 'object' && (o.e || o.s)) { tok = o; break; }
    } catch {}
  }

  if (tok) {
    name = tok.n || null;
    email = tok.e || null;
    if (tok.s) {
      // Legacy {n,e,s} token — redirect to the clean pretty-slug URL
      const userToken = Buffer.from(JSON.stringify({ n: name || '', e: email || '' })).toString('base64url');
      const langSuffix = locale !== 'en' ? `&lang=${locale}` : '';
      return { redirect: { destination: `/gallery/${tok.s}?t=${userToken}${langSuffix}`, permanent: false } };
    }
    // Token carries only the visitor (no property) — an old floor-plan link
    // that never resolved a property. Send them to the full collection
    // rather than a 404.
    return { redirect: { destination: '/our-homes/', permanent: false } };
  }

  // Pretty-URL format — raw IS the property slug; visitor info in ?t= param
  slug = raw;
  if (query.t) {
    try {
      const u = JSON.parse(Buffer.from(query.t, 'base64url').toString('utf-8'));
      name  = u.n || null;
      email = u.e || null;
    } catch {}
  }

  if (!slug) return { notFound: true };

  const supabase = getSupabase();
  // Publicly reachable by slug alone (the ?t= visitor token is optional), so
  // hidden/staged rows must never render here (19 Jul incident). Sold homes
  // stay viewable — gallery emails promise a permanent link and a lead's
  // saved link should not 404 the day the last share sells.
  const { data: prop } = await supabase
    .from('properties')
    .select('slug, title, img, images, photos, extra_photos, documents, country, city, region, price, currency, beds, size, status')
    .eq('slug', slug)
    .in('status', ['Live', 'for_sale', 'sold'])
    .maybeSingle();

  if (!prop) return { redirect: { destination: '/our-homes/', permanent: false } };

  return {
    props: {
      name:     name  || null,
      email:    email || null,
      property: prop,
      locale,
    },
  };
}

// Locale-aware UI strings for the gallery page. Mirrors the locale that the
// recipient was emailed in (en / es / fr / de) so the form, eyebrow, labels,
// counter and success state all match the property page's language.
const COPY = {
  en: {
    eyebrow: 'Private Enquiry',
    title_l1: 'I want to find', title_l2: 'out more',
    sub: "Leave your details and we'll be in touch.",
    mobile_heading: 'I want to know more',
    name: 'Name', email: 'Email',
    phone: 'Phone number', message: 'Message', optional: '(optional)',
    msg_placeholder: (title) => `I'd love to find out more about ${title}…`,
    submit: "I'm Interested — Get In Touch",
    sending: 'Sending…',
    note: "No obligation · We'll be in touch soon",
    err_phone: 'Please enter your phone number.',
    err_generic: 'Something went wrong — please try again.',
    success_title: "Thank you — we'll be in touch",
    success_body: (first) =>
      first ? `${first}, your enquiry has been received. We'll be in touch shortly.`
            : "Your enquiry has been received. We'll be in touch shortly.",
    view_listing: 'View the full listing →',
    extra_label: 'Additional Photos',
    doc_label: 'Floor Plan & Documents',
    enquiry_counter: 'ENQUIRY',
    per_share: ' per share',
    interested_btn: "I'm Interested",
    prev_aria: 'Previous', next_aria: 'Next',
    slide_aria: (n) => `Go to slide ${n}`,
    private_gallery: 'Private Gallery',
    zoom_in: 'Zoom in', zoom_out: 'Zoom out', zoom_reset: 'Reset zoom',
  },
  es: {
    eyebrow: 'Consulta privada',
    title_l1: 'Quiero saber', title_l2: 'más',
    sub: 'Déjanos tus datos y nos pondremos en contacto contigo.',
    mobile_heading: 'Quiero saber más',
    name: 'Nombre', email: 'Correo electrónico',
    phone: 'Número de teléfono', message: 'Mensaje', optional: '(opcional)',
    msg_placeholder: (title) => `Me gustaría saber más sobre ${title}…`,
    submit: 'Me interesa — Contactar',
    sending: 'Enviando…',
    note: 'Sin compromiso · Te contactaremos pronto',
    err_phone: 'Por favor, introduce tu número de teléfono.',
    err_generic: 'Algo salió mal — por favor, inténtalo de nuevo.',
    success_title: 'Gracias — te contactaremos',
    success_body: (first) =>
      first ? `${first}, hemos recibido tu consulta. Nos pondremos en contacto contigo en breve.`
            : 'Hemos recibido tu consulta. Nos pondremos en contacto contigo en breve.',
    view_listing: 'Ver la ficha completa →',
    extra_label: 'Fotos adicionales',
    doc_label: 'Plano y documentos',
    enquiry_counter: 'CONSULTA',
    per_share: ' por participación',
    interested_btn: 'Me interesa',
    prev_aria: 'Anterior', next_aria: 'Siguiente',
    slide_aria: (n) => `Ir a la diapositiva ${n}`,
    private_gallery: 'Galería privada',
    zoom_in: 'Acercar', zoom_out: 'Alejar', zoom_reset: 'Restablecer zoom',
  },
  fr: {
    eyebrow: 'Demande privée',
    title_l1: "J'aimerais en", title_l2: 'savoir plus',
    sub: 'Laissez-nous vos coordonnées et nous reviendrons vers vous.',
    mobile_heading: "J'aimerais en savoir plus",
    name: 'Nom', email: 'Email',
    phone: 'Numéro de téléphone', message: 'Message', optional: '(optionnel)',
    msg_placeholder: (title) => `J'aimerais en savoir plus sur ${title}…`,
    submit: 'Je suis intéressé(e) — Me contacter',
    sending: 'Envoi…',
    note: 'Sans engagement · Nous reviendrons vers vous très bientôt',
    err_phone: 'Veuillez saisir votre numéro de téléphone.',
    err_generic: 'Une erreur est survenue — veuillez réessayer.',
    success_title: 'Merci — nous reviendrons vers vous',
    success_body: (first) =>
      first ? `${first}, votre demande a bien été reçue. Nous reviendrons vers vous très prochainement.`
            : 'Votre demande a bien été reçue. Nous reviendrons vers vous très prochainement.',
    view_listing: "Voir l'annonce complète →",
    extra_label: 'Photos supplémentaires',
    doc_label: 'Plans et documents',
    enquiry_counter: 'DEMANDE',
    per_share: ' par part',
    interested_btn: 'Je suis intéressé(e)',
    prev_aria: 'Précédent', next_aria: 'Suivant',
    slide_aria: (n) => `Aller à la diapositive ${n}`,
    private_gallery: 'Galerie privée',
    zoom_in: 'Zoomer', zoom_out: 'Dézoomer', zoom_reset: 'Réinitialiser le zoom',
  },
  de: {
    eyebrow: 'Persönliche Anfrage',
    title_l1: 'Ich möchte mehr', title_l2: 'erfahren',
    sub: 'Hinterlassen Sie Ihre Kontaktdaten und wir melden uns bei Ihnen.',
    mobile_heading: 'Ich möchte mehr erfahren',
    name: 'Name', email: 'E-Mail',
    phone: 'Telefonnummer', message: 'Nachricht', optional: '(optional)',
    msg_placeholder: (title) => `Ich würde gerne mehr über ${title} erfahren…`,
    submit: 'Ich bin interessiert — Kontakt aufnehmen',
    sending: 'Wird gesendet…',
    note: 'Unverbindlich · Wir melden uns in Kürze',
    err_phone: 'Bitte geben Sie Ihre Telefonnummer ein.',
    err_generic: 'Etwas ist schiefgelaufen — bitte versuchen Sie es erneut.',
    success_title: 'Vielen Dank — wir melden uns bei Ihnen',
    success_body: (first) =>
      first ? `${first}, wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.`
            : 'Wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.',
    view_listing: 'Vollständige Anzeige ansehen →',
    extra_label: 'Weitere Fotos',
    doc_label: 'Grundriss & Unterlagen',
    enquiry_counter: 'ANFRAGE',
    per_share: ' pro Anteil',
    interested_btn: 'Ich bin interessiert',
    prev_aria: 'Zurück', next_aria: 'Weiter',
    slide_aria: (n) => `Zu Folie ${n}`,
    private_gallery: 'Private Galerie',
    zoom_in: 'Vergrößern', zoom_out: 'Verkleinern', zoom_reset: 'Zoom zurücksetzen',
  },
  it: {
    eyebrow: 'Richiesta privata',
    title_l1: 'Voglio saperne', title_l2: 'di più',
    sub: 'Lasciaci i tuoi dati e ti ricontattiamo.',
    mobile_heading: 'Voglio saperne di più',
    name: 'Nome', email: 'Email',
    phone: 'Numero di telefono', message: 'Messaggio', optional: '(facoltativo)',
    msg_placeholder: (title) => `Vorrei saperne di più su ${title}…`,
    submit: 'Mi interessa — contattatemi',
    sending: 'Invio in corso…',
    note: 'Senza impegno · Ti ricontattiamo a breve',
    err_phone: 'Inserisci il tuo numero di telefono.',
    err_generic: 'Qualcosa è andato storto — riprova.',
    success_title: 'Grazie — ti ricontattiamo',
    success_body: (first) =>
      first ? `${first}, abbiamo ricevuto la tua richiesta. Ti ricontattiamo a breve.`
            : 'Abbiamo ricevuto la tua richiesta. Ti ricontattiamo a breve.',
    view_listing: 'Vedi l\'annuncio completo →',
    extra_label: 'Altre foto',
    doc_label: 'Planimetria e documenti',
    enquiry_counter: 'RICHIESTA',
    per_share: ' per quota',
    interested_btn: 'Mi interessa',
    prev_aria: 'Indietro', next_aria: 'Avanti',
    slide_aria: (n) => `Vai alla slide ${n}`,
    private_gallery: 'Galleria privata',
    zoom_in: 'Ingrandisci', zoom_out: 'Riduci', zoom_reset: 'Reimposta zoom',
  },
  nl: {
    eyebrow: 'Persoonlijke aanvraag',
    title_l1: 'Ik wil meer', title_l2: 'weten',
    sub: 'Laat uw gegevens achter en wij nemen contact met u op.',
    mobile_heading: 'Ik wil meer weten',
    name: 'Naam', email: 'E-mail',
    phone: 'Telefoonnummer', message: 'Bericht', optional: '(optioneel)',
    msg_placeholder: (title) => `Ik zou graag meer willen weten over ${title}…`,
    submit: 'Ik heb interesse — neem contact op',
    sending: 'Verzenden…',
    note: 'Vrijblijvend · Wij nemen spoedig contact op',
    err_phone: 'Vul uw telefoonnummer in.',
    err_generic: 'Er is iets misgegaan — probeer het opnieuw.',
    success_title: 'Hartelijk dank — wij nemen contact met u op',
    success_body: (first) =>
      first ? `${first}, wij hebben uw aanvraag ontvangen en nemen spoedig contact met u op.`
            : 'Wij hebben uw aanvraag ontvangen en nemen spoedig contact met u op.',
    view_listing: 'Volledige aanbieding bekijken →',
    extra_label: 'Extra foto\'s',
    doc_label: 'Plattegrond & documenten',
    enquiry_counter: 'AANVRAAG',
    per_share: ' per aandeel',
    interested_btn: 'Ik heb interesse',
    prev_aria: 'Vorige', next_aria: 'Volgende',
    slide_aria: (n) => `Naar dia ${n}`,
    private_gallery: 'Privégalerij',
    zoom_in: 'Inzoomen', zoom_out: 'Uitzoomen', zoom_reset: 'Zoom herstellen',
  },
  pt: {
    eyebrow: 'Solicitação privada',
    title_l1: 'Quero saber', title_l2: 'mais',
    sub: 'Deixe seus dados e entraremos em contato.',
    mobile_heading: 'Quero saber mais',
    name: 'Nome', email: 'E-mail',
    phone: 'Telefone', message: 'Mensagem', optional: '(opcional)',
    msg_placeholder: (title) => `Gostaria de saber mais sobre ${title}…`,
    submit: 'Tenho interesse — entrar em contato',
    sending: 'Enviando…',
    note: 'Sem compromisso · Entraremos em contato em breve',
    err_phone: 'Informe seu telefone.',
    err_generic: 'Algo deu errado — tente novamente.',
    success_title: 'Obrigado — entraremos em contato',
    success_body: (first) =>
      first ? `${first}, recebemos sua solicitação e entraremos em contato em breve.`
            : 'Recebemos sua solicitação e entraremos em contato em breve.',
    view_listing: 'Ver o anúncio completo →',
    extra_label: 'Fotos adicionais',
    doc_label: 'Planta e documentos',
    enquiry_counter: 'SOLICITAÇÃO',
    per_share: ' por cota',
    interested_btn: 'Tenho interesse',
    prev_aria: 'Anterior', next_aria: 'Próximo',
    slide_aria: (n) => `Ir para o slide ${n}`,
    private_gallery: 'Galeria privada',
    zoom_in: 'Ampliar', zoom_out: 'Reduzir', zoom_reset: 'Redefinir zoom',
  },
  sv: {
    eyebrow: 'Personlig förfrågan',
    title_l1: 'Jag vill veta', title_l2: 'mer',
    sub: 'Lämna dina kontaktuppgifter så hör vi av oss.',
    mobile_heading: 'Jag vill veta mer',
    name: 'Namn', email: 'E-post',
    phone: 'Telefonnummer', message: 'Meddelande', optional: '(valfritt)',
    msg_placeholder: (title) => `Jag skulle gärna vilja veta mer om ${title}…`,
    submit: 'Jag är intresserad — kontakta mig',
    sending: 'Skickar…',
    note: 'Helt förutsättningslöst · Vi hör av oss inom kort',
    err_phone: 'Ange ditt telefonnummer.',
    err_generic: 'Något gick fel — försök igen.',
    success_title: 'Tack — vi hör av oss',
    success_body: (first) =>
      first ? `${first}, vi har tagit emot din förfrågan och hör av oss inom kort.`
            : 'Vi har tagit emot din förfrågan och hör av oss inom kort.',
    view_listing: 'Se hela objektet →',
    extra_label: 'Fler bilder',
    doc_label: 'Planritning & dokument',
    enquiry_counter: 'FÖRFRÅGAN',
    per_share: ' per andel',
    interested_btn: 'Jag är intresserad',
    prev_aria: 'Föregående', next_aria: 'Nästa',
    slide_aria: (n) => `Gå till bild ${n}`,
    private_gallery: 'Privat galleri',
    zoom_in: 'Zooma in', zoom_out: 'Zooma ut', zoom_reset: 'Återställ zoom',
  },
  da: {
    eyebrow: 'Personlig forespørgsel',
    title_l1: 'Jeg vil gerne vide', title_l2: 'mere',
    sub: 'Efterlad dine kontaktoplysninger, så vender vi tilbage til dig.',
    mobile_heading: 'Jeg vil gerne vide mere',
    name: 'Navn', email: 'E-mail',
    phone: 'Telefonnummer', message: 'Besked', optional: '(valgfrit)',
    msg_placeholder: (title) => `Jeg vil gerne vide mere om ${title}…`,
    submit: 'Jeg er interesseret — kontakt mig',
    sending: 'Sender…',
    note: 'Uforpligtende · Vi vender tilbage hurtigst muligt',
    err_phone: 'Indtast venligst dit telefonnummer.',
    err_generic: 'Noget gik galt — prøv venligst igen.',
    success_title: 'Mange tak — vi vender tilbage til dig',
    success_body: (first) =>
      first ? `${first}, vi har modtaget din forespørgsel og vender tilbage hurtigst muligt.`
            : 'Vi har modtaget din forespørgsel og vender tilbage hurtigst muligt.',
    view_listing: 'Se hele boligannoncen →',
    extra_label: 'Flere billeder',
    doc_label: 'Plantegning & dokumenter',
    enquiry_counter: 'FORESPØRGSEL',
    per_share: ' pr. andel',
    interested_btn: 'Jeg er interesseret',
    prev_aria: 'Forrige', next_aria: 'Næste',
    slide_aria: (n) => `Gå til slide ${n}`,
    private_gallery: 'Privat galleri',
    zoom_in: 'Zoom ind', zoom_out: 'Zoom ud', zoom_reset: 'Nulstil zoom',
  },
  no: {
    eyebrow: 'Personlig henvendelse',
    title_l1: 'Jeg vil vite', title_l2: 'mer',
    sub: 'Legg igjen kontaktinformasjonen din, så tar vi kontakt.',
    mobile_heading: 'Jeg vil vite mer',
    name: 'Navn', email: 'E-post',
    phone: 'Telefonnummer', message: 'Melding', optional: '(valgfritt)',
    msg_placeholder: (title) => `Jeg vil gjerne vite mer om ${title}…`,
    submit: 'Jeg er interessert — ta kontakt',
    sending: 'Sender…',
    note: 'Uforpliktende · Vi tar kontakt snart',
    err_phone: 'Oppgi telefonnummeret ditt.',
    err_generic: 'Noe gikk galt — prøv igjen.',
    success_title: 'Takk — vi tar kontakt',
    success_body: (first) =>
      first ? `${first}, vi har mottatt henvendelsen din og tar kontakt snart.`
            : 'Vi har mottatt henvendelsen din og tar kontakt snart.',
    view_listing: 'Se hele annonsen →',
    extra_label: 'Flere bilder',
    doc_label: 'Plantegning og dokumenter',
    enquiry_counter: 'HENVENDELSE',
    per_share: ' per andel',
    interested_btn: 'Jeg er interessert',
    prev_aria: 'Forrige', next_aria: 'Neste',
    slide_aria: (n) => `Gå til bilde ${n}`,
    private_gallery: 'Privat galleri',
    zoom_in: 'Zoom inn', zoom_out: 'Zoom ut', zoom_reset: 'Tilbakestill zoom',
  },
};

// ── Zoom helpers ──
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.5; // per +/- button press or keyboard +/- press
const clampScale = (v) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));
const clampPan = (v, scale, dim) => {
  const max = ((scale - 1) * dim) / 2;
  return Math.min(max, Math.max(-max, v));
};
const touchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
const touchMid = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });

export default function GalleryPage({ name, email, property, locale = 'en' }) {
  const t = COPY[locale] || COPY.en;
  const rawImages = Array.isArray(property.images) ? property.images : [];

  // When photos is empty we fall back to images (MYNE properties).
  // In that case the MYNE workflow can also upload those same renders as
  // items inside extra_photos — we want to deduplicate to avoid showing
  // the same image twice. But ONLY drop items that actually match a hero
  // image by URL. The previous logic blindly sliced the first N items off
  // extra_photos which silently dropped floor plans for properties where
  // extra_photos contained floor-plan/brochure shots first (e.g. the Ses
  // Salines listing where extra_photos[0..2] were floor plans, not dupes).
  const usingImagesFallback =
    (!Array.isArray(property.photos) || property.photos.length === 0) &&
    rawImages.length > 0;

  const photos = Array.isArray(property.photos) && property.photos.length > 0
    ? property.photos
    : rawImages.length > 0
    ? rawImages
    : property.img ? [property.img] : [];

  const extrasRaw = Array.isArray(property.extra_photos) ? property.extra_photos : [];
  const heroUrlSet = new Set(rawImages);
  const extras = usingImagesFallback
    ? extrasRaw.filter(url => !heroUrlSet.has(url))
    : extrasRaw;

  const documents = Array.isArray(property.documents)    ? property.documents    : [];

  // Slides: hero photos → brochure extras → floor plans/docs → enquiry
  // type: 'photo' | 'extra' | 'document'
  const slides = [
    ...photos.map(url    => ({ url, type: 'photo' })),
    ...extras.map(url    => ({ url, type: 'extra' })),
    ...documents.map(url => ({ url, type: 'document' })),
  ];

  const totalSlides = slides.length + 1; // +1 for enquiry
  const enquiryIndex = slides.length;

  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);
  const [formState, setFormState] = useState({ name: name || '', email: email || '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const touchStartX = useRef(null);

  // ── Zoom & pan state (image slides only — never the enquiry slide) ──
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0, smooth: false });
  const [panning, setPanning] = useState(false);
  const stageRef = useRef(null);
  const zoomRef = useRef(zoom);
  const indexRef = useRef(index);
  const gestureRef = useRef({ lastDist: null, lastMid: null, lastTouch: null, pinched: false });
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { indexRef.current = index; }, [index]);

  // Changing slide always starts fresh at 1×
  useEffect(() => { setZoom({ scale: 1, x: 0, y: 0, smooth: false }); }, [index]);

  // Multiply the current scale by `factor`, keeping the screen point (cx, cy)
  // anchored (defaults to the stage centre). Zooming back to 1× recentres.
  const zoomBy = useCallback((factor, cx, cy, smooth = false) => {
    const el = stageRef.current;
    const w = el ? el.clientWidth : 0;
    const h = el ? el.clientHeight : 0;
    setZoom(z => {
      const scale = clampScale(z.scale * factor);
      if (scale === z.scale) return z;
      if (scale <= 1) return { scale: 1, x: 0, y: 0, smooth };
      const px = (cx == null ? w / 2 : cx) - w / 2;
      const py = (cy == null ? h / 2 : cy) - h / 2;
      const ratio = scale / z.scale;
      const x = px - (px - z.x) * ratio;
      const y = py - (py - z.y) * ratio;
      return { scale, x: clampPan(x, scale, w), y: clampPan(y, scale, h), smooth };
    });
  }, []);

  const panBy = useCallback((dx, dy) => {
    const el = stageRef.current;
    const w = el ? el.clientWidth : 0;
    const h = el ? el.clientHeight : 0;
    setZoom(z => z.scale <= 1 ? z : {
      ...z,
      x: clampPan(z.x + dx, z.scale, w),
      y: clampPan(z.y + dy, z.scale, h),
      smooth: false,
    });
  }, []);

  const resetZoom = useCallback(() => setZoom({ scale: 1, x: 0, y: 0, smooth: true }), []);

  const firstName = name ? name.split(' ')[0] : null;
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ' }[property.currency] || '€';
  const priceStr = property.price ? `${sym}${Number(property.price).toLocaleString('en-GB')}` : null;
  const locationParts = [property.city, property.region, property.country].filter(Boolean);
  const location = [...new Set(locationParts)].join(', ');

  const goTo = useCallback((next, dir) => {
    if (animating || next === index) return;
    setDirection(dir);
    setPrev(index);
    setAnimating(true);
    setIndex(next);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 500);
  }, [animating, index]);

  const goNext = useCallback(() => {
    if (index < totalSlides - 1) goTo(index + 1, 1);
  }, [index, totalSlides, goTo]);

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1, -1);
  }, [index, goTo]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Keyboard zoom: + / - / 0 (skip while typing in the enquiry form)
  useEffect(() => {
    const handler = (e) => {
      if (index === enquiryIndex) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP, null, null, true);
      else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM_STEP, null, null, true);
      else if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, enquiryIndex, zoomBy, resetZoom]);

  // Wheel zoom + touch pinch-zoom & pan. Native NON-passive listeners so we can
  // preventDefault() — React's delegated wheel/touch handlers are passive and
  // can't stop browser page-zoom (trackpad pinch arrives as wheel+ctrlKey).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const g = gestureRef.current;

    const onWheel = (e) => {
      if (indexRef.current === enquiryIndex) return; // enquiry form scrolls natively
      e.preventDefault();
      // ctrlKey ⇒ trackpad pinch — browsers report a larger effective delta
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      zoomBy(factor, e.clientX, e.clientY);
    };

    const isInteractive = (target) =>
      target && target.closest && target.closest('button, a, input, textarea, select');

    const onTouchStart = (e) => {
      if (indexRef.current === enquiryIndex) return;
      if (isInteractive(e.target)) return; // never swallow taps on buttons/links
      if (e.touches.length === 2) {
        g.pinched = true; // suppress swipe navigation for this whole gesture
        g.lastDist = touchDist(e.touches);
        g.lastMid = touchMid(e.touches);
        e.preventDefault();
      } else if (e.touches.length === 1 && zoomRef.current.scale > 1) {
        g.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
      }
    };

    const onTouchMove = (e) => {
      if (indexRef.current === enquiryIndex) return;
      if (e.touches.length === 2 && g.lastDist) {
        e.preventDefault();
        const d = touchDist(e.touches);
        const m = touchMid(e.touches);
        zoomBy(d / g.lastDist, m.x, m.y);
        panBy(m.x - g.lastMid.x, m.y - g.lastMid.y); // two-finger pan
        g.lastDist = d;
        g.lastMid = m;
      } else if (e.touches.length === 1 && g.lastTouch && zoomRef.current.scale > 1) {
        e.preventDefault();
        const t2 = e.touches[0];
        panBy(t2.clientX - g.lastTouch.x, t2.clientY - g.lastTouch.y);
        g.lastTouch = { x: t2.clientX, y: t2.clientY };
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) { g.lastDist = null; g.lastMid = null; }
      if (e.touches.length === 0) {
        g.lastTouch = null;
        // let the (suppressed) swipe touchend run before clearing the flag
        setTimeout(() => { g.pinched = false; }, 60);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enquiryIndex, zoomBy, panBy]);

  // Mouse drag-to-pan (desktop, while zoomed)
  const handlePanMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setPanning(true);
    let last = { x: e.clientX, y: e.clientY };
    const move = (ev) => {
      panBy(ev.clientX - last.x, ev.clientY - last.y);
      last = { x: ev.clientX, y: ev.clientY };
    };
    const up = () => {
      setPanning(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    // While zoomed (or mid-pinch) the finger is panning, not swiping to navigate
    if (gestureRef.current.pinched || zoom.scale > 1) { touchStartX.current = null; return; }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const honeypot = e.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    if (!formState.phone.trim()) { setError(t.err_phone); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/gallery-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          message: formState.message,
          propertySlug: property.slug,
          propertyTitle: property.title,
          propertyUrl: `https://co-ownership-property.com/property/${property.slug}/`,
          locale,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        track('enquiry_submitted', {
          source: 'gallery_page',
          property: property.title,
          slug: property.slug,
        });
      }
      else setError(t.err_generic);
    } catch {
      setError(t.err_generic);
    } finally {
      setSubmitting(false);
    }
  };

  const isEnquiry    = index === enquiryIndex;
  const isZoomed     = zoom.scale > 1;
  const isPrevEnquiry = prev === enquiryIndex;
  const currentType  = !isEnquiry ? slides[index]?.type : null;
  const isDocument   = currentType === 'document';
  const isExtra      = currentType === 'extra';
  const isNonPhoto   = isEnquiry || isDocument || isExtra || index !== 0; // hide property info overlay

  return (
    <>
      <Head>
        <title>{`${property.title} — ${t.private_gallery} | Co-Ownership Property`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
        {/* Set <html lang="..."> so screen readers + browser translators pick up the right language */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang = ${JSON.stringify(locale)};`
          }}
        />
      </Head>

      <div
        ref={stageRef}
        style={{
          ...s.stage,
          // Disable the browser's own pan/zoom on image slides so our pinch/pan
          // handlers own the gesture; the enquiry slide keeps native scrolling.
          touchAction: isEnquiry ? 'auto' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ── SLIDES ── */}
        {slides.map((slide, i) => {
          const isCurrent  = index === i;
          const isPrevSlide = prev === i;
          const isDoc   = slide.type === 'document';
          const isExtr  = slide.type === 'extra';
          const isPhoto = slide.type === 'photo';
          return (
            <div
              key={slide.url}
              style={{
                ...s.slide,
                opacity: isCurrent ? 1 : isPrevSlide ? 1 : 0,
                zIndex: isCurrent ? 2 : isPrevSlide ? 1 : 0,
                transition: isCurrent ? 'opacity 0.55s ease' : 'none',
                background: '#0A1520',
                // flex-centre for contained slides so images never upscale
                ...(isDoc || isExtr ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.url}
                alt={`${property.title} — ${isDoc ? 'document' : isExtr ? 'extra' : 'photo'} ${i + 1}`}
                draggable={false}
                style={{
                  ...(isDoc ? s.slideImgDoc : isExtr ? s.slideImgExtra : s.slideImg),
                  ...(isCurrent ? {
                    transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                    transition: zoom.smooth ? 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    willChange: 'transform',
                  } : {}),
                }}
              />
              {/* gradient only on full-bleed photos */}
              {isPhoto && <div style={s.gradient} />}
              {/* extra photos label */}
              {isExtr && (
                <div style={s.extraLabel}>{t.extra_label}</div>
              )}
              {/* document label */}
              {isDoc && (
                <div style={s.docLabel}>{t.doc_label}</div>
              )}
            </div>
          );
        })}

        {/* ── ENQUIRY SLIDE ── */}
        <div style={{
          ...s.slide,
          background: '#0F1D2A',
          opacity: isEnquiry ? 1 : isPrevEnquiry ? 1 : 0,
          zIndex: isEnquiry ? 2 : isPrevEnquiry ? 1 : 0,
          transition: isEnquiry ? 'opacity 0.55s ease' : 'none',
          overflowY: 'auto',
        }}>
          <div style={s.enquiryInner} className="gallery-enquiry-inner">
            {!submitted ? (
              <>
                <p style={s.eEyebrow} className="gallery-e-eyebrow">{t.eyebrow}</p>
                <h2 style={s.eTitle} className="e-title">
                  <em>{t.title_l1}<br />{t.title_l2}</em>
                </h2>
                <p style={s.eProperty} className="gallery-e-property">{property.title}</p>
                <div style={s.eRule} className="gallery-e-rule" />
                <p style={s.eSub} className="gallery-e-sub">
                  {t.sub}
                </p>

                {/* Mobile-only compact heading */}
                <p className="gallery-mobile-heading" style={{ display: 'none' }}>{t.mobile_heading}</p>

                <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
                  <HoneypotField />
                  <div className="gallery-form-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.fieldLabel}>{t.name}</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.fieldLabel}>{t.email}</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={e => setFormState(p => ({ ...p, email: e.target.value }))}
                        style={s.input}
                      />
                    </div>
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>
                      {t.phone} <span style={{ color: '#C9A84C' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={e => setFormState(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+44 7700 900000"
                      style={s.input}
                      required
                    />
                  </div>
                  <div className="gallery-msg-wrap" style={s.fieldWrap}>
                    <label style={s.fieldLabel}>
                      {t.message} <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>{t.optional}</span>
                    </label>
                    <textarea
                      value={formState.message}
                      onChange={e => setFormState(p => ({ ...p, message: e.target.value }))}
                      placeholder={t.msg_placeholder(property.title)}
                      style={{ ...s.input, height: 90, resize: 'none' }}
                      rows={3}
                    />
                  </div>
                  {error && <p style={s.errorMsg}>{error}</p>}
                  <button type="submit" style={s.submitBtn} disabled={submitting}>
                    {submitting ? t.sending : t.submit}
                  </button>
                  <p style={s.formNote} className="gallery-form-note">{t.note}</p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <div style={s.successIcon}>✓</div>
                <h2 style={s.successTitle}>{t.success_title}</h2>
                <p style={s.successSub}>
                  {t.success_body(firstName)}
                </p>
                <a href={`https://co-ownership-property.com/property/${property.slug}/`} style={s.successLink}>
                  {t.view_listing}
                </a>
              </div>
            )}
          </div>
          {/* subtle gold top line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
        </div>

        {/* ── NAV BAR ── */}
        <nav style={s.nav} className="gallery-nav">
          <a href="https://co-ownership-property.com" style={s.navLogo} className="gallery-nav-logo">
            Co-Ownership Property
          </a>
        </nav>

        {/* ── PROPERTY INFO (bottom left, photo slides only) ── */}
        <div className="gallery-info" style={{
          ...s.info,
          opacity: isNonPhoto ? 0 : 1,
          transform: isNonPhoto ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          pointerEvents: isNonPhoto ? 'none' : 'auto',
        }}>
          {location && <p style={s.infoLocation} className="gallery-info-location">{location.toUpperCase()}</p>}
          <h1 style={s.infoTitle} className="info-title">{property.title}</h1>
          {priceStr && (
            <p style={s.infoPrice} className="gallery-info-price">
              {priceStr}
              <span style={s.infoPriceSub}>{t.per_share}</span>
            </p>
          )}
        </div>

        {/* ── COUNTER (bottom right) ── */}
        <div style={s.counter}>
          {isEnquiry
            ? <span style={{ color: '#C9A84C', letterSpacing: '0.2em' }}>{t.enquiry_counter}</span>
            : <>{index + 1} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span> {totalSlides}</>
          }
        </div>

        {/* ── CLICK ZONES (left half = prev, right half = next) — hidden while zoomed so dragging pans instead of navigating ── */}
        {!isEnquiry && !isZoomed && (
          <>
            {index > 0 && (
              <div
                onClick={goPrev}
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              />
            )}
            {index < totalSlides - 1 && (
              <div
                onClick={goNext}
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 5, cursor: 'pointer' }}
              />
            )}
          </>
        )}

        {/* ── PAN LAYER (drag to pan while zoomed; double-click resets) ── */}
        {!isEnquiry && isZoomed && (
          <div
            onMouseDown={handlePanMouseDown}
            onDoubleClick={resetZoom}
            style={{
              position: 'absolute', inset: 0, zIndex: 5,
              cursor: panning ? 'grabbing' : 'grab',
            }}
          />
        )}

        {/* ── ZOOM CONTROLS ── */}
        {!isEnquiry && (
          <div style={s.zoomWrap} className="gallery-zoom">
            <button
              type="button"
              className="gallery-zoom-btn"
              onClick={() => zoomBy(ZOOM_STEP, null, null, true)}
              disabled={zoom.scale >= MAX_ZOOM}
              aria-label={t.zoom_in}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M16.2 16.2L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M11 8.2v5.6M8.2 11h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="gallery-zoom-btn"
              onClick={() => zoomBy(1 / ZOOM_STEP, null, null, true)}
              disabled={!isZoomed}
              aria-label={t.zoom_out}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M16.2 16.2L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M8.2 11h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
            {isZoomed && (
              <button
                type="button"
                className="gallery-zoom-btn"
                onClick={resetZoom}
                aria-label={t.zoom_reset}
              >
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', fontFamily: "'Jost', Arial, sans-serif" }}>1×</span>
              </button>
            )}
            <span style={s.zoomHintLabel} className="gallery-zoom-label">ZOOM</span>
          </div>
        )}

        {/* ── I'M INTERESTED BUTTON ── */}
        {!isEnquiry && (
          <div style={s.interestedWrap}>
            <button className="gallery-interested" onClick={() => goTo(enquiryIndex, 1)}>
              {t.interested_btn}
            </button>
          </div>
        )}

        {/* ── DOT INDICATORS ── */}
        <div style={s.dots} className="gallery-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={t.slide_aria(i + 1)}
              style={{
                ...s.dot,
                background: i === index ? '#C9A84C' : 'rgba(255,255,255,0.35)',
                width: i === index ? 24 : 6,
              }}
            />
          ))}
        </div>

        {/* ── PREV ARROW ── (hidden on enquiry slide to avoid overlapping form) */}
        {index > 0 && (
          <button style={{ ...s.arrow, left: 0 }} className={isEnquiry ? 'gallery-prev-enquiry' : ''} onClick={goPrev} aria-label={t.prev_aria}>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M9 1L1 9L9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ── NEXT ARROW ── */}
        {index < totalSlides - 1 && (
          <button style={{ ...s.arrow, right: 0 }} onClick={goNext} aria-label={t.next_aria}>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M1 1L9 9L1 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ── SWIPE HINT (first load) ── */}
        {index === 0 && photos.length > 1 && (
          <div style={s.swipeHint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.15em' }}>SWIPE</span>
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; background: #0F1D2A; }
        input, textarea { -webkit-appearance: none; border-radius: 0 !important; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { outline: none; border-color: rgba(201,168,76,0.6) !important; }
        button:focus { outline: none; }
        .gallery-interested {
          font-family: 'Jost', Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
          background: rgba(15,29,42,0.45);
          border: 1px solid rgba(201,168,76,0.75);
          padding: 13px 36px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.35s ease, border-color 0.35s ease, color 0.35s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .gallery-interested:hover {
          background: #C9A84C;
          border-color: #C9A84C;
          color: #0F1D2A;
        }
        .gallery-zoom-btn {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(10,20,32,0.6);
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 2px 16px rgba(0,0,0,0.35);
          transition: border-color 0.3s ease, color 0.3s ease, background 0.3s ease, opacity 0.3s ease;
        }
        .gallery-zoom-btn:hover:not(:disabled) {
          border-color: #C9A84C;
          color: #C9A84C;
          background: rgba(10,20,32,0.8);
        }
        .gallery-zoom-btn:disabled { opacity: 0.4; cursor: default; }
        @media (max-width: 640px) {
          /* Nav */
          .gallery-nav { padding: 0 18px !important; height: 52px !important; }
          .gallery-nav-logo { font-size: 10px !important; letter-spacing: 0.16em !important; }
          .gallery-nav-link { font-size: 10px !important; letter-spacing: 0.12em !important; }

          /* Photo info overlay — completely hidden on mobile */
          .gallery-info { display: none !important; }

          /* Interested button */
          .gallery-interested { font-size: 9px !important; padding: 11px 28px !important; letter-spacing: 0.22em !important; }

          /* Enquiry slide — compact heading + fields + button only */
          .gallery-enquiry-inner { padding: 68px 24px 72px !important; justify-content: center !important; }
          .gallery-e-eyebrow { display: none !important; }
          .e-title { display: none !important; }
          .gallery-e-property { display: none !important; }
          .gallery-e-rule { display: none !important; }
          .gallery-e-sub { display: none !important; }
          .gallery-form-note { display: none !important; }
          .gallery-mobile-heading {
            display: block !important;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px;
            font-weight: 300;
            font-style: italic;
            color: #fff;
            text-align: center;
            margin: 0 0 28px;
            letter-spacing: 0.02em;
            line-height: 1.3;
          }

          /* Form: stack name+email vertically, hide message */
          .gallery-form-row { flex-direction: column !important; gap: 0 !important; margin-bottom: 0 !important; }
          .gallery-form-row > div { margin-bottom: 12px !important; }
          .gallery-msg-wrap { display: none !important; }

          /* Dots: tighter on mobile */
          .gallery-dots { gap: 4px !important; bottom: 14px !important; }

          /* Prev arrow: shift further left on enquiry slide so it clears the email field */
          .gallery-prev-enquiry { left: -14px !important; }

          /* Zoom controls: keep full 44px touch targets under the shorter mobile nav */
          .gallery-zoom { top: 60px !important; right: 12px !important; gap: 8px !important; }
        }
      `}</style>
    </>
  );
}

const s = {
  stage: {
    position: 'fixed', inset: 0,
    background: '#0F1D2A',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute', inset: 0,
    willChange: 'opacity',
  },
  slideImg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'contain', objectPosition: 'center',
    display: 'block',
    // Very subtle brightness lift so photos pop slightly over the dark frame
    filter: 'brightness(1.04) saturate(1.04)',
  },

  // Extra (brochure) photos — flex-centered, never upscaled beyond natural size
  slideImgExtra: {
    display: 'block',
    maxWidth: '60%',
    maxHeight: 'calc(100% - 160px)',
    width: 'auto',
    height: 'auto',
  },
  extraLabel: {
    position: 'absolute', top: 80, left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 600, letterSpacing: '0.26em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)',
    zIndex: 10, whiteSpace: 'nowrap',
  },
  // Floor plans / documents — flex-centered, never upscaled beyond natural size
  slideImgDoc: {
    display: 'block',
    maxWidth: '80%',
    maxHeight: 'calc(100% - 160px)',
    width: 'auto',
    height: 'auto',
  },
  docLabel: {
    position: 'absolute', top: 80, left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 600, letterSpacing: '0.26em',
    textTransform: 'uppercase', color: '#C9A84C',
    zIndex: 10, whiteSpace: 'nowrap',
  },
  gradient: {
    // Just enough bottom darkening to keep the page-counter + "I'm interested"
    // CTA legible over light photos — but no broad navy wash any more.
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: '22%',
    background: 'linear-gradient(to top, rgba(10,20,32,0.55) 0%, rgba(10,20,32,0.0) 100%)',
    pointerEvents: 'none',
  },

  // Nav
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 60,
    // Lighter top fade — just enough to keep the logo readable
    background: 'linear-gradient(to bottom, rgba(10,20,32,0.40) 0%, transparent 100%)',
  },
  navLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.8)',
    letterSpacing: '0.28em', textTransform: 'uppercase', textDecoration: 'none',
  },
  navLink: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 500, color: '#C9A84C',
    letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
  },

  // Property info
  info: {
    position: 'absolute', bottom: 92, left: 0,
    padding: '0 0 0 24px',
    maxWidth: 260,
    zIndex: 10,
    pointerEvents: 'none',
  },
  infoLocation: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: '0.2em',
    color: '#C9A84C', margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  infoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24, fontWeight: 300, color: '#fff',
    margin: '0 0 8px', lineHeight: 1.25,
  },
  infoPrice: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 19, fontWeight: 300, color: 'rgba(255,255,255,0.85)',
    margin: 0,
  },
  infoPriceSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em',
  },

  // Counter
  counter: {
    position: 'absolute', bottom: 26, left: 32, zIndex: 10,
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 300, letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.45)',
  },

  // Interested button
  interestedWrap: {
    position: 'absolute', bottom: 68, left: '50%',
    transform: 'translateX(-50%)', zIndex: 10,
  },
  interestedBtn: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: '#0F1D2A',
    background: '#C9A84C', border: 'none',
    padding: '10px 28px', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Zoom controls (top right, below the nav)
  zoomWrap: {
    position: 'absolute', top: 76, right: 20, zIndex: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  zoomHintLabel: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 8, fontWeight: 600, letterSpacing: '0.3em',
    color: 'rgba(255,255,255,0.75)',
    textShadow: '0 1px 8px rgba(0,0,0,0.7)',
    marginTop: 2, paddingLeft: '0.3em', // optically recentre the letterspaced text
    pointerEvents: 'none', userSelect: 'none',
  },

  // Dot indicators
  dots: {
    position: 'absolute', bottom: 22, left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: 6, alignItems: 'center', zIndex: 10,
  },
  dot: {
    height: 6, borderRadius: 3,
    border: 'none', padding: 0, cursor: 'pointer',
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // Arrows
  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 56, height: 80,
    background: 'none', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10,
    padding: '0 18px',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute', bottom: 80, right: 80, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    opacity: 0,
    animation: 'fadeInOut 3s ease 1.5s forwards',
  },

  // Enquiry slide inner
  enquiryInner: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 10vw 60px',
    overflowY: 'auto',
  },
  eEyebrow: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 500, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: '#C9A84C', margin: '0 0 14px',
  },
  eTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36, fontWeight: 300, color: '#fff',
    margin: '0 0 20px', lineHeight: 1.2,
  },
  eProperty: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 400, letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.4)', margin: '0 0 20px',
    textTransform: 'uppercase',
  },
  eRule: { width: 32, height: 1, background: '#C9A84C', margin: '0 auto 22px' },
  eSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.75, margin: '0 0 28px', maxWidth: 380, textAlign: 'center',
  },

  // Pre-filled identity
  prefilled: {
    display: 'flex', gap: 0, marginBottom: 24,
    borderTop: '1px solid rgba(201,168,76,0.2)',
    borderBottom: '1px solid rgba(201,168,76,0.12)',
    width: '100%', maxWidth: 420,
  },
  prefilledItem: {
    flex: 1, padding: '12px 0 12px',
  },
  prefilledDivider: {
    width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '8px 20px 8px 0',
  },
  prefilledLabel: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: 4,
  },
  prefilledValue: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  // Form
  fieldWrap: { width: '100%', maxWidth: 420, marginBottom: 16, textAlign: 'left' },
  fieldLabel: {
    display: 'block', fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 500, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  input: {
    display: 'block', width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '13px 16px',
    fontFamily: "'Jost', Arial, sans-serif", fontSize: 14,
    color: '#fff', transition: 'border-color 0.2s',
  },
  errorMsg: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 12, color: '#ff8080', margin: '0 0 12px',
  },
  submitBtn: {
    display: 'block', width: '100%', maxWidth: 420, margin: '0 auto',
    padding: '15px 24px',
    background: '#C9A84C', border: 'none', cursor: 'pointer',
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: '#0F1D2A',
    marginTop: 4,
  },
  formNote: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, color: 'rgba(255,255,255,0.25)',
    margin: '12px 0 0', letterSpacing: '0.08em',
  },

  // Success
  successIcon: {
    width: 56, height: 56, borderRadius: '50%',
    border: '1px solid #C9A84C',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', color: '#C9A84C', fontSize: 22,
  },
  successTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 300, color: '#fff', margin: '0 0 16px',
  },
  successSub: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7, margin: '0 0 28px',
  },
  successLink: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 500, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none',
  },
};
