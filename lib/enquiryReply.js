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
    mainProp: `We've received your enquiry, along with everything you've shared with us.`,
    mainGeneral: `We've received your enquiry, along with everything you've shared with us.`,
    close: `Someone from our team will review it and be in touch with you very soon.`,
    sign: 'Dylan',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subject: 'Gracias por tu consulta',
    greetingName: (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    introProp: (link) => `¡Gracias por tu consulta sobre ${link}!`,
    introGeneral: '¡Gracias por ponerte en contacto!',
    mainProp: `Hemos recibido tu consulta, junto con todo lo que nos has compartido.`,
    mainGeneral: `Hemos recibido tu consulta, junto con todo lo que nos has compartido.`,
    close: `Alguien de nuestro equipo la revisará y se pondrá en contacto contigo muy pronto.`,
    sign: 'Dylan',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subject: 'Merci pour votre demande',
    greetingName: (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    introProp: (link) => `Merci pour votre demande concernant ${link} !`,
    introGeneral: 'Merci de nous avoir contactés !',
    mainProp: `Nous avons bien reçu votre demande, ainsi que tout ce que vous nous avez transmis.`,
    mainGeneral: `Nous avons bien reçu votre demande, ainsi que tout ce que vous nous avez transmis.`,
    close: `Un membre de notre équipe l'examinera et vous recontactera très bientôt.`,
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
 * @returns {{subject:string, html:string}}
 */
export function buildEnquiryReply({ firstName, propertyTitle, propertyUrl, locale, trackingPixelHtml }) {
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
  const main     = hasProp ? t.mainProp : t.mainGeneral;

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${intro}</p>
    <p style="margin:0 0 20px;">${main}</p>
    <p style="margin:0 0 32px;">${t.close}</p>
    <p style="margin:0;">${t.sign}</p>${trackingPixelHtml || ''}`;

  return { subject: t.subject, html: emailShell(body, locale, t.role) };
}

/**
 * Build and send the enquiry auto-reply immediately (no delay, no cron).
 * Best-effort — callers should wrap in try/catch.
 */
export async function sendEnquiryReply({ to, firstName, propertyTitle, propertyUrl, locale, trackingPixelHtml }) {
  const loc = ['en', 'es', 'fr'].includes(locale) ? locale : 'en';
  const { subject, html } = buildEnquiryReply({
    firstName, propertyTitle, propertyUrl, locale: loc, trackingPixelHtml,
  });
  await sendHtml({ to, subject, html, from: FROM, replyTo: REPLY_TO });
  return { subject };
}
