/**
 * lib/email/templates.js
 *
 * HTML builders for emails sent by the automation engine.
 * Self-contained — no React, no database, no side effects. Pure functions
 * that turn data into { subject, html }, so they are trivial to unit-test
 * and to preview.
 *
 * See docs/email-automation-blueprint.md.
 */

// ── Dylan sender identity ────────────────────────────────────────────────────
export const DYLAN_FROM  = 'Dylan Olsson <dylan@co-ownership-property.com>';
export const DYLAN_REPLY = 'dylan@co-ownership-property.com';
const DYLAN_PHOTO = 'https://co-ownership-property.com/images/dylan-olsson.jpg';

// ── Small helpers ────────────────────────────────────────────────────────────
export function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function joinList(items, andWord) {
  if (items.length <= 1) return items[0] || '';
  return items.slice(0, -1).join(', ') + andWord + items[items.length - 1];
}

/**
 * Per-property "photos & floor plans" links block. Rapid multi-unlocks SKIP
 * the individual per-property gallery emails (see /api/unlock-drive's 24h
 * batching), so the gallery follow-up is what delivers the gallery links —
 * every property in the batch with a known gallery URL is listed here.
 */
// Full SEO title ("Rosemary Beach, Florida, USA — 6-Bed House…") → short human
// name for prose ("the Rosemary Beach home") so emails don't read like a machine
// repeating a listing title. Falls back to the raw title for non-standard formats.
function friendlyName(title, t) {
  const raw = String(title || '').trim();
  const structured = raw.includes(',') || /\s[—–-]\s/.test(raw);
  if (!structured) return raw;
  const city = raw.split(/\s[—–-]\s/)[0].split(',')[0].trim();
  return city ? t.home(city) : raw;
}

function galleryLinksHtml(properties, t) {
  const withLinks = (properties || []).filter(p => p.galleryUrl);
  if (!withLinks.length) return '';
  const items = withLinks.map(p =>
    `<li style="margin:0 0 6px;">${escapeHtml(friendlyName(p.title, t).replace(/^./, c => c.toUpperCase()))} — <a href="${escapeHtml(p.galleryUrl)}" style="color:#C9A84C;text-decoration:underline;">${t.galleryLinkLabel}</a></li>`
  ).join('');
  return `
    <p style="margin:0 0 8px;">${t.galleryLinksIntro}</p>
    <ul style="margin:0 0 20px;padding-left:22px;">${items}</ul>`;
}

/**
 * Tidy a stored first name for use in a greeting: "gloria" / "GLORIA" → "Gloria",
 * "jean-paul" → "Jean-Paul". Contacts are often saved lower- or upper-case.
 */
function capitalizeName(name) {
  return String(name || '').trim().toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Deduplicate the properties referenced by a batch of floor-plan-request
 * activities. Returns [{ title, url, galleryUrl }] in first-seen order.
 */
export function dedupeProperties(activities) {
  const seen = new Set();
  const out = [];
  for (const a of activities || []) {
    const title = a.metadata && a.metadata.propertyTitle;
    const url   = (a.metadata && a.metadata.propertyUrl) || null;
    // Written by /api/unlock-drive since the 24h email batching landed;
    // older activities fall back to the slug, or carry no gallery link.
    const galleryUrl = (a.metadata && a.metadata.galleryUrl)
      || (a.metadata && a.metadata.propertySlug
          ? `https://co-ownership-property.com/gallery/${a.metadata.propertySlug}`
          : null);
    if (!title) continue;
    const key = String(url || title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, url, galleryUrl });
  }
  return out;
}

// ── Shared email shell ───────────────────────────────────────────────────────
function signatureHtml(role) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;">
  <tr>
    <td width="108" valign="top" style="padding-right:18px;">
      <img src="${DYLAN_PHOTO}" width="90" height="90"
        style="border-radius:50%;display:block;object-fit:cover;" alt="Dylan Olsson">
    </td>
    <td valign="middle">
      <p style="margin:0 0 3px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1E3448;">Dylan Olsson</p>
      <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">${role}</p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#555;">+44 7901 002763</p>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#555;">dylan@co-ownership-property.com</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;">
        <a href="https://co-ownership-property.com" style="color:#C9A84C;text-decoration:none;">co-ownership-property.com</a>
      </p>
    </td>
  </tr>
</table>`;
}

function emailShell(body, locale, role) {
  return `<!DOCTYPE html>
<html lang="${locale || 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2a2a2a;line-height:1.7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:36px 32px 40px;">${body}${signatureHtml(role)}</td></tr>
  </table>
</body>
</html>`;
}

// ── Gallery follow-up email (en / es / fr) ───────────────────────────────────
// A short personal note from Dylan, sent ~10 minutes after a visitor unlocks
// one or more property galleries. Copy approved by David.
// Exported so pages/api/process-gallery-followups.js can use this table
// rather than keeping a second, byte-identical copy of it. The two drifted
// apart for exactly as long as nothing enforced that they matched.
export const GALLERY_FOLLOWUP_COPY = {
  en: {
    role: 'Co-Founder · Co-Ownership Property',
    subjectSingle: (p) => `Questions about ${p}?`,
    subjectMulti:  ()  => `Questions about the homes you've been viewing?`,
    greetingName:  (n) => `Hi ${n},`,
    greetingNoName: 'Hi there,',
    intro: (links) => `Thanks for taking a look at ${links}!`,
    home: (city) => `the ${city} home`,
    offerSingle: `Is there anything I can help with — questions about the home, or how co-ownership actually works? Just reply to this email.`,
    offerMulti:  `Is there anything I can help with — questions about the homes, or how co-ownership actually works? Just reply to this email.`,
    closeSingle: `And whenever you're ready, I'm happy to connect you directly with the team that manages it.`,
    closeMulti:  `And whenever you're ready, I'm happy to connect you directly with the teams that manage them.`,
    sign: 'Dylan',
    and: ' and ',
    galleryLinksIntro: 'Here are your photo links, in case you need them again:',
    galleryLinkLabel: 'photos',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subjectSingle: (p) => `¿Alguna pregunta sobre ${p}?`,
    subjectMulti:  ()  => `¿Alguna pregunta sobre las propiedades que has visto?`,
    greetingName:  (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    intro: (links) => `¡Gracias por echar un vistazo a ${links}!`,
    home: (city) => `la propiedad en ${city}`,
    offerSingle: `¿Hay algo en lo que pueda ayudarte — alguna duda sobre la propiedad o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    offerMulti:  `¿Hay algo en lo que pueda ayudarte — alguna duda sobre las propiedades o sobre cómo funciona la copropiedad? Solo tienes que responder a este correo.`,
    closeSingle: `Y cuando quieras, con mucho gusto te pongo en contacto directo con el equipo que la gestiona.`,
    closeMulti:  `Y cuando quieras, con mucho gusto te pongo en contacto directo con los equipos que las gestionan.`,
    sign: 'Dylan',
    and: ' y ',
    galleryLinksIntro: 'Aquí tienes tus enlaces a las fotos, por si los necesitas de nuevo:',
    galleryLinkLabel: 'fotos',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subjectSingle: (p) => `Des questions sur ${p} ?`,
    subjectMulti:  ()  => `Des questions sur les biens que vous avez consultés ?`,
    greetingName:  (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    intro: (links) => `Merci d'avoir jeté un œil à ${links} !`,
    home: (city) => `la propriété à ${city}`,
    offerSingle: `Puis-je vous aider en quoi que ce soit — une question sur le bien, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    offerMulti:  `Puis-je vous aider en quoi que ce soit — une question sur les biens, ou sur le fonctionnement de la copropriété ? Il vous suffit de répondre à cet e-mail.`,
    closeSingle: `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec l'équipe qui le gère.`,
    closeMulti:  `Et quand vous le souhaitez, je vous mets volontiers en relation directe avec les équipes qui les gèrent.`,
    sign: 'Dylan',
    and: ' et ',
    galleryLinksIntro: 'Voici vos liens vers les photos, si vous en avez encore besoin :',
    galleryLinkLabel: 'photos',
  },
  de: {
    role: "Mitgründer · Co-Ownership Property",
    subjectSingle: (p) => `Fragen zu ${p}?`,
    subjectMulti:  ()  => "Fragen zu den Immobilien, die Sie sich angesehen haben?",
    greetingName:  (n) => `Hallo ${n},`,
    greetingNoName: "Hallo,",
    intro: (links) => `Danke, dass Sie sich ${links} angesehen haben!`,
    home: (city) => `die Immobilie in ${city}`,
    offerSingle: "Kann ich Ihnen bei etwas helfen — Fragen zur Immobilie oder dazu, wie Miteigentum in der Praxis funktioniert? Antworten Sie einfach auf diese E-Mail.",
    offerMulti:  "Kann ich Ihnen bei etwas helfen — Fragen zu den Immobilien oder dazu, wie Miteigentum in der Praxis funktioniert? Antworten Sie einfach auf diese E-Mail.",
    closeSingle: "Und wann immer Sie möchten, bringe ich Sie gern direkt mit dem Team zusammen, das die Immobilie betreut.",
    closeMulti:  "Und wann immer Sie möchten, bringe ich Sie gern direkt mit den Teams zusammen, die die Immobilien betreuen.",
    sign: "Dylan",
    and: " und ",
    galleryLinksIntro: "Hier sind Ihre Foto-Links, falls Sie sie noch einmal brauchen:",
    galleryLinkLabel: "Fotos",
  },
  it: {
    role: "Cofondatore · Co-Ownership Property",
    subjectSingle: (p) => `Domande su ${p}?`,
    subjectMulti:  ()  => "Domande sulle case che ha visto?",
    greetingName:  (n) => `Salve ${n},`,
    greetingNoName: "Salve,",
    intro: (links) => `Grazie per aver guardato ${links}!`,
    home: (city) => `la casa di ${city}`,
    offerSingle: "Posso aiutarLa con qualcosa — domande sulla casa, o su come funziona davvero la comproprietà? Basta rispondere a questa email.",
    offerMulti:  "Posso aiutarLa con qualcosa — domande sulle case, o su come funziona davvero la comproprietà? Basta rispondere a questa email.",
    closeSingle: "E quando vuole, La metto volentieri in contatto diretto con il team che gestisce la casa.",
    closeMulti:  "E quando vuole, La metto volentieri in contatto diretto con i team che gestiscono le case.",
    sign: "Dylan",
    and: " e ",
    galleryLinksIntro: "Ecco i link alle Sue foto, nel caso Le servissero di nuovo:",
    galleryLinkLabel: "foto",
  },
  nl: {
    role: "Medeoprichter · Co-Ownership Property",
    subjectSingle: (p) => `Vragen over ${p}?`,
    subjectMulti:  ()  => "Vragen over de woningen die u heeft bekeken?",
    greetingName:  (n) => `Hallo ${n},`,
    greetingNoName: "Hallo,",
    intro: (links) => `Bedankt dat u een kijkje heeft genomen bij ${links}!`,
    home: (city) => `de woning in ${city}`,
    offerSingle: "Kan ik u ergens mee helpen — vragen over de woning, of over hoe mede-eigendom in de praktijk werkt? Beantwoord deze e-mail gerust.",
    offerMulti:  "Kan ik u ergens mee helpen — vragen over de woningen, of over hoe mede-eigendom in de praktijk werkt? Beantwoord deze e-mail gerust.",
    closeSingle: "En wanneer het u uitkomt, breng ik u graag rechtstreeks in contact met het team dat de woning beheert.",
    closeMulti:  "En wanneer het u uitkomt, breng ik u graag rechtstreeks in contact met de teams die deze woningen beheren.",
    sign: "Dylan",
    and: " en ",
    galleryLinksIntro: "Hier zijn uw fotolinks, voor het geval u ze nog eens nodig heeft:",
    galleryLinkLabel: "foto's",
  },
  pt: {
    role: "Cofundador · Co-Ownership Property",
    subjectSingle: (p) => `Alguma dúvida sobre ${p}?`,
    subjectMulti:  ()  => "Alguma dúvida sobre as casas que tem estado a ver?",
    greetingName:  (n) => `Olá ${n},`,
    greetingNoName: "Olá,",
    intro: (links) => `Obrigado por ter espreitado ${links}!`,
    home: (city) => `a casa de ${city}`,
    offerSingle: "Há alguma coisa em que possa ajudar — dúvidas sobre a casa, ou sobre como funciona a compropriedade na prática? Basta responder a este e-mail.",
    offerMulti:  "Há alguma coisa em que possa ajudar — dúvidas sobre as casas, ou sobre como funciona a compropriedade na prática? Basta responder a este e-mail.",
    closeSingle: "E quando quiser, é com todo o gosto que ponho a equipa que gere a casa em contacto direto consigo.",
    closeMulti:  "E quando quiser, é com todo o gosto que ponho as equipas que gerem as casas em contacto direto consigo.",
    sign: "Dylan",
    and: " e ",
    galleryLinksIntro: "Aqui ficam os links para as suas fotos, caso precise deles outra vez:",
    galleryLinkLabel: "fotos",
  },
};

/**
 * Build the gallery follow-up email.
 * @param {object}  opts
 * @param {string|null} opts.firstName
 * @param {{title:string,url:string|null}[]} opts.properties  — already deduplicated
 * @param {'en'|'es'|'fr'} opts.locale
 * @returns {{subject:string, html:string}}
 */
export function buildGalleryFollowupEmail({ firstName, properties, locale }) {
  const t = GALLERY_FOLLOWUP_COPY[locale] || GALLERY_FOLLOWUP_COPY.en;
  const list = Array.isArray(properties) ? properties : [];
  const single = list.length === 1;

  const linkParts = list.map(p => {
    const label = escapeHtml(friendlyName(p.title, t));
    return p.url
      ? `<a href="${escapeHtml(p.url)}" style="color:#1E3448;text-decoration:underline;">${label}</a>`
      : `<strong>${label}</strong>`;
  });
  const links = joinList(linkParts, t.and);

  const subject  = single ? t.subjectSingle(friendlyName(list[0].title, t)) : t.subjectMulti();
  const greeting = firstName
    ? t.greetingName(escapeHtml(capitalizeName(firstName)))
    : t.greetingNoName;
  const offer    = single ? t.offerSingle : t.offerMulti;

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${t.intro(links)}</p>${galleryLinksHtml(list, t)}
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${single ? t.closeSingle : t.closeMulti}</p>
    <p style="margin:0;">${t.sign}</p>`;

  return { subject, html: emailShell(body, locale, t.role) };
}
