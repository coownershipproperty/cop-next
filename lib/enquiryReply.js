/**
 * lib/enquiryReply.js
 *
 * The auto-reply a visitor receives the instant they submit an enquiry.
 * A short, personal note from Dylan — same plain style as the gallery
 * follow-up (lib/galleryFollowup.js), no branding or imagery — adapted for
 * an enquiry. Sent immediately via Resend; no scheduling, no cron.
 */
import { sendHtml } from '@/lib/resend';
import { escapeHtml, emailShell } from './galleryFollowup';

const FROM     = 'Dylan Olsson <dylan@co-ownership-property.com>';
const REPLY_TO = 'dylan@co-ownership-property.com';

// ── Copy (en / es / fr) ─────────────────────────────────────────────────────
const COPY = {
  en: {
    role: 'Co-Founder · Co-Ownership Property',
    subject: 'Thanks for your enquiry',
    greetingName: (n) => `Hi ${n},`,
    greetingNoName: 'Hi there,',
    introProp: (link) => `Thanks for your enquiry about ${link}!`,
    introGeneral: 'Thanks for getting in touch!',
    // With a message: quote it back, promise a proper answer to all of it.
    withMessage: `I've got your message and I'll come back to you personally very shortly.`,
    // Without a message: ask for their questions and offer the introduction.
    noMessageProp: `Do you have any questions about the home or how the co-ownership model works? Send them over and I'll relay them directly to the team that manages it — they can then get in touch with full details.`,
    noMessageGeneral: `Tell me a little about what you're looking for — the area, roughly what budget you have in mind for a share, and how often you'd use it — and I'll point you at the homes that fit.`,
    close: `Whenever you're ready, I can also put you directly in touch with the team that manages this home — they can give you the full details on the property and on how the co-ownership model works.`,
    closeGeneral: `Once you've got a home or two in mind, I'll put you directly in touch with the team that manages it — they can give you the full details on the property and on how the co-ownership model works.`,
    sign: 'Dylan',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subject: 'Gracias por tu consulta',
    greetingName: (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    introProp: (link) => `¡Gracias por tu consulta sobre ${link}!`,
    introGeneral: '¡Gracias por ponerte en contacto!',
    withMessage: `He recibido tu mensaje y te responderé personalmente muy pronto.`,
    noMessageProp: `¿Tienes alguna pregunta sobre la vivienda o sobre cómo funciona la copropiedad? Envíamela y la trasladaré directamente al equipo que la gestiona — ellos se pondrán en contacto contigo con todos los detalles.`,
    noMessageGeneral: `Cuéntame un poco qué buscas — la zona, el presupuesto aproximado para una participación y cuánto la usarías — y te indicaré las viviendas que encajan.`,
    close: `Cuando quieras, también puedo ponerte directamente en contacto con el equipo que gestiona esta vivienda — ellos pueden darte todos los detalles sobre la propiedad y sobre cómo funciona el modelo de copropiedad.`,
    closeGeneral: `Cuando tengas una o dos viviendas en mente, te pondré directamente en contacto con el equipo que las gestiona — ellos pueden darte todos los detalles sobre la propiedad y sobre cómo funciona el modelo de copropiedad.`,
    sign: 'Dylan',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subject: 'Merci pour votre demande',
    greetingName: (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    introProp: (link) => `Merci pour votre demande concernant ${link} !`,
    introGeneral: 'Merci de nous avoir contactés !',
    withMessage: `J'ai bien reçu votre message et je reviens vers vous personnellement très vite.`,
    noMessageProp: `Avez-vous des questions sur le bien ou sur le fonctionnement de la copropriété ? Envoyez-les-moi et je les transmettrai directement à l'équipe qui gère ce bien — elle vous recontactera avec tous les détails.`,
    noMessageGeneral: `Dites-m'en un peu plus sur ce que vous recherchez — la région, le budget approximatif pour une part et la fréquence d'utilisation — et je vous orienterai vers les biens qui correspondent.`,
    close: `Dès que vous le souhaitez, je peux aussi vous mettre directement en relation avec l'équipe qui gère ce bien — elle pourra vous donner tous les détails sur le bien et sur le fonctionnement de la copropriété.`,
    closeGeneral: `Dès que vous aurez un ou deux biens en vue, je vous mettrai directement en relation avec l'équipe qui les gère — elle pourra vous donner tous les détails sur le bien et sur le fonctionnement de la copropriété.`,
    sign: 'Dylan',
  },
  de: {
    role: "Mitgründer · Co-Ownership Property",
    subject: "Danke für Ihre Anfrage",
    greetingName: (n) => `Hallo ${n},`,
    greetingNoName: "Hallo,",
    introProp: (link) => `Danke für Ihre Anfrage zu ${link}!`,
    introGeneral: "Danke für Ihre Nachricht!",
    withMessage: "Ihre Nachricht ist angekommen, und ich melde mich in Kürze persönlich bei Ihnen.",
    noMessageProp: "Haben Sie Fragen zur Immobilie oder dazu, wie Miteigentum funktioniert? Schreiben Sie sie mir einfach — ich leite sie direkt an das Team weiter, das die Immobilie betreut. Die Kollegen dort melden sich dann mit allen Details bei Ihnen.",
    noMessageGeneral: "Erzählen Sie mir kurz, was Sie suchen — die Region, welches Budget Sie für einen Anteil ungefähr im Kopf haben und wie oft Sie vor Ort sein möchten. Dann zeige ich Ihnen die Immobilien, die dazu passen.",
    close: "Wann immer Sie möchten, bringe ich Sie auch direkt mit dem Team zusammen, das diese Immobilie betreut — dort bekommen Sie alle Details und erfahren genau, wie Miteigentum funktioniert.",
    closeGeneral: "Sobald Sie ein oder zwei Immobilien im Blick haben, bringe ich Sie direkt mit dem Team zusammen, das sie betreut — dort bekommen Sie alle Details und erfahren genau, wie Miteigentum funktioniert.",
    sign: "Dylan",
  },
  it: {
    role: "Cofondatore · Co-Ownership Property",
    subject: "Grazie per la Sua richiesta",
    greetingName: (n) => `Salve ${n},`,
    greetingNoName: "Salve,",
    introProp: (link) => `Grazie per la Sua richiesta di informazioni su ${link}!`,
    introGeneral: "Grazie per avermi scritto!",
    withMessage: "Ho ricevuto il Suo messaggio e Le rispondo personalmente a breve.",
    noMessageProp: "Ha domande sulla casa o su come funziona il modello di comproprietà? Me le mandi pure e le giro direttamente al team che la gestisce — poi La contatteranno loro con tutti i dettagli.",
    noMessageGeneral: "Mi racconti un po' cosa sta cercando — la zona, più o meno che budget ha in mente per una quota e con che frequenza pensa di usarla — e Le indico le case che fanno al caso Suo.",
    close: "Quando vuole, posso anche metterLa direttamente in contatto con il team che gestisce questa casa — potranno darLe tutti i dettagli sull'immobile e su come funziona il modello di comproprietà.",
    closeGeneral: "Quando avrà in mente una casa o due, La metto direttamente in contatto con il team che se ne occupa — potranno darLe tutti i dettagli sull'immobile e su come funziona il modello di comproprietà.",
    sign: "Dylan",
  },
  nl: {
    role: "Medeoprichter · Co-Ownership Property",
    subject: "Bedankt voor uw aanvraag",
    greetingName: (n) => `Hallo ${n},`,
    greetingNoName: "Hallo,",
    introProp: (link) => `Bedankt voor uw aanvraag voor ${link}!`,
    introGeneral: "Bedankt voor uw bericht!",
    withMessage: "Ik heb uw bericht ontvangen en kom snel persoonlijk bij u terug.",
    noMessageProp: "Heeft u vragen over de woning of over hoe mede-eigendom werkt? Stuur ze gerust naar me toe, dan leg ik ze rechtstreeks voor aan het team dat de woning beheert — zij nemen daarna contact met u op met alle details.",
    noMessageGeneral: "Vertel me kort wat u zoekt — de regio, ongeveer welk budget u voor een aandeel in gedachten heeft, en hoe vaak u er zou verblijven — dan laat ik u de woningen zien die daarbij passen.",
    close: "Wanneer het u uitkomt, breng ik u ook graag rechtstreeks in contact met het team dat deze woning beheert — zij kunnen u alle details geven over de woning en over hoe mede-eigendom werkt.",
    closeGeneral: "Zodra u een woning of twee op het oog heeft, breng ik u rechtstreeks in contact met het team dat die beheert — zij kunnen u alle details geven over de woning en over hoe mede-eigendom werkt.",
    sign: "Dylan",
  },
  pt: {
    role: "Cofundador · Co-Ownership Property",
    subject: "Obrigado pelo seu contacto",
    greetingName: (n) => `Olá ${n},`,
    greetingNoName: "Olá,",
    introProp: (link) => `Obrigado pelo seu contacto sobre ${link}!`,
    introGeneral: "Obrigado por ter entrado em contacto!",
    withMessage: "Recebi a sua mensagem e volto a escrever-lhe pessoalmente muito em breve.",
    noMessageProp: "Tem dúvidas sobre a casa ou sobre como funciona o modelo de compropriedade? Envie-as e eu encaminho-as diretamente para a equipa que a gere — depois entram em contacto consigo com todos os detalhes.",
    noMessageGeneral: "Diga-me um pouco sobre o que procura — a zona, mais ou menos que orçamento tem em mente para uma quota, e com que frequência pensa usá-la — e eu indico-lhe as casas que encaixam.",
    close: "Quando quiser, posso também pôr a equipa que gere esta casa em contacto direto consigo — podem dar-lhe todos os detalhes sobre a propriedade e sobre como funciona o modelo de compropriedade.",
    closeGeneral: "Assim que tiver uma casa ou duas em mente, ponho a equipa que a gere em contacto direto consigo — podem dar-lhe todos os detalhes sobre a propriedade e sobre como funciona o modelo de compropriedade.",
    sign: "Dylan",
  },
};


// The property-page form prepends the visitor's chip answers to the message
// as "Timing: …", "Budget: …", "Experience: …" lines (in the page's language;
// labels in pages/property/[slug].js eq_chip_labels). Those are not a
// question. Only what the visitor actually typed counts as a message, or a
// chip-only enquiry gets "I've got your message" and nothing to answer
// (Valerie Wattenbergh, 19 Sep 2026).
const CHIP_LINE = /^\s*(Timing|Plazo|D\u00e9lai|Délai|Zeitraum|Tempi|Termijn|Quando|Tidsplan|Budget|Presupuesto|Or\u00e7amento|Orçamento|Budsjett|Experience|Experiencia|Exp\u00e9rience|Expérience|Erfahrung|Esperienza|Ervaring|Experi\u00eancia|Experiência|Erfarenhet|Erfaring)\s*:/i;
export function ownWords(message) {
  return String(message || '')
    .split(/\r?\n/)
    .filter(line => !CHIP_LINE.test(line))
    .join('\n')
    .trim();
}

/**
 * Build the enquiry auto-reply email.
 * @param {string|null}  firstName
 * @param {string|null}  propertyTitle  — set for a property enquiry; null for a general one
 * @param {string|null}  propertyUrl
 * @param {'en'|'es'|'fr'} locale
 * @param {string}       [trackingPixelHtml]  — optional open-tracking pixel
 * @param {string|null}  [message]  — what the lead typed in the form. When present the reply
 *                                    only acknowledges it and promises answers — no quoting it
 *                                    back, no introduction offer before the questions are
 *                                    answered. (David, 5 Sep 2026)
 * @returns {{subject:string, html:string}}
 */
export function buildEnquiryReply({ firstName, propertyTitle, propertyUrl, locale, trackingPixelHtml, message }) {
  const t = COPY[locale] || COPY.en;
  const hasProp = !!(propertyTitle && String(propertyTitle).trim());

  let link = '';
  if (hasProp) {
    const title = escapeHtml(propertyTitle);
    link = propertyUrl
      ? `<a href="${escapeHtml(propertyUrl)}" style="color:#111111;text-decoration:underline;">${title}</a>`
      : `<strong>${title}</strong>`;
  }

  const greeting = firstName ? t.greetingName(escapeHtml(firstName)) : t.greetingNoName;
  const intro    = hasProp ? t.introProp(link) : t.introGeneral;

  const asked = !!ownWords(message);
  // Asked something → acknowledge and promise answers, nothing else. Asked nothing →
  // ask for their questions and offer the introduction.
  const paragraphs = asked
    ? [t.withMessage]
    : [hasProp ? t.noMessageProp : t.noMessageGeneral, hasProp ? t.close : t.closeGeneral];

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${intro}</p>
    ${paragraphs.map((p, i) => `<p style="margin:0 0 ${i === paragraphs.length - 1 ? 32 : 20}px;">${p}</p>`).join('\n    ')}
    <p style="margin:0;">${t.sign}</p>${trackingPixelHtml || ''}`;

  return { subject: t.subject, html: emailShell(body, locale, t.role) };
}

/**
 * Build and send the enquiry auto-reply immediately (no delay, no cron).
 * Best-effort — callers should wrap in try/catch.
 */
export async function sendEnquiryReply({ to, firstName, propertyTitle, propertyUrl, locale, trackingPixelHtml, message, contactId, leadId }) {
  const loc = COPY[locale] ? locale : 'en';
  const { subject, html } = buildEnquiryReply({
    firstName, propertyTitle, propertyUrl, locale: loc, trackingPixelHtml, message,
  });
  await sendHtml({
    to, subject, html, from: FROM, replyTo: REPLY_TO,
    // The caller already wrote the email_sends row (it carries the tracking
    // pixel id), so only the HTML copy goes into email_queue here.
    log: {
      trigger: 'enquiry_submitted', type: 'enquiry_auto', withSend: false,
      contactId: contactId || null, leadId: leadId || null,
      templateName: 'enquiry-autoreply',
      templateProps: { locale: loc, hadMessage: !!ownWords(message) },
      propertyTitle: propertyTitle || null, propertyUrl: propertyUrl || null,
      notes: 'Enquiry auto-reply (instant)',
    },
  });
  return { subject };
}

