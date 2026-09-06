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
    withMessage: `I've got your questions and will come back to you shortly with answers to each of them.`,
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
    withMessage: `He recibido tus preguntas y te responderé en breve a cada una de ellas.`,
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
    withMessage: `J'ai bien reçu vos questions et je reviens vers vous très vite avec une réponse à chacune d'elles.`,
    noMessageProp: `Avez-vous des questions sur le bien ou sur le fonctionnement de la copropriété ? Envoyez-les-moi et je les transmettrai directement à l'équipe qui gère ce bien — elle vous recontactera avec tous les détails.`,
    noMessageGeneral: `Dites-m'en un peu plus sur ce que vous recherchez — la région, le budget approximatif pour une part et la fréquence d'utilisation — et je vous orienterai vers les biens qui correspondent.`,
    close: `Dès que vous le souhaitez, je peux aussi vous mettre directement en relation avec l'équipe qui gère ce bien — elle pourra vous donner tous les détails sur le bien et sur le fonctionnement de la copropriété.`,
    closeGeneral: `Dès que vous aurez un ou deux biens en vue, je vous mettrai directement en relation avec l'équipe qui les gère — elle pourra vous donner tous les détails sur le bien et sur le fonctionnement de la copropriété.`,
    sign: 'Dylan',
  },
};

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
      ? `<a href="${escapeHtml(propertyUrl)}" style="color:#1E3448;text-decoration:underline;">${title}</a>`
      : `<strong>${title}</strong>`;
  }

  const greeting = firstName ? t.greetingName(escapeHtml(firstName)) : t.greetingNoName;
  const intro    = hasProp ? t.introProp(link) : t.introGeneral;

  const asked = !!String(message || '').trim();
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
  const loc = ['en', 'es', 'fr'].includes(locale) ? locale : 'en';
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
      templateProps: { locale: loc, hadMessage: !!String(message || '').trim() },
      propertyTitle: propertyTitle || null, propertyUrl: propertyUrl || null,
      notes: 'Enquiry auto-reply (instant)',
    },
  });
  return { subject };
}
