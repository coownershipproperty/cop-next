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
 * Tidy a stored first name for use in a greeting: "gloria" / "GLORIA" → "Gloria",
 * "jean-paul" → "Jean-Paul". Contacts are often saved lower- or upper-case.
 */
function capitalizeName(name) {
  return String(name || '').trim().toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Deduplicate the properties referenced by a batch of floor-plan-request
 * activities. Returns [{ title, url }] in first-seen order.
 */
export function dedupeProperties(activities) {
  const seen = new Set();
  const out = [];
  for (const a of activities || []) {
    const title = a.metadata && a.metadata.propertyTitle;
    const url   = (a.metadata && a.metadata.propertyUrl) || null;
    if (!title) continue;
    const key = String(url || title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, url });
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
const GALLERY_FOLLOWUP_COPY = {
  en: {
    role: 'Co-Founder · Co-Ownership Property',
    subjectSingle: (p) => `Questions about ${p}?`,
    subjectMulti:  ()  => `Questions about the homes you've been viewing?`,
    greetingName:  (n) => `Hi ${n},`,
    greetingNoName: 'Hi there,',
    intro: (links) => `Thanks for your interest in ${links}!`,
    offerSingle: `I'd love to connect you with the specialist team behind it — before I do, do you have any questions I can pass along to them about the property or the co-ownership model?`,
    offerMulti:  `I'd love to connect you with the specialist teams behind them — before I do, do you have any questions I can pass along about these homes or the co-ownership model?`,
    close: `Once I hear back I'll make the introduction straight away.`,
    sign: 'Dylan',
    and: ' and ',
  },
  es: {
    role: 'Cofundador · Co-Ownership Property',
    subjectSingle: (p) => `¿Alguna pregunta sobre ${p}?`,
    subjectMulti:  ()  => `¿Alguna pregunta sobre las propiedades que has visto?`,
    greetingName:  (n) => `Hola ${n},`,
    greetingNoName: 'Hola,',
    intro: (links) => `¡Gracias por tu interés en ${links}!`,
    offerSingle: `Me encantaría ponerte en contacto con el equipo especialista que hay detrás — antes de hacerlo, ¿tienes alguna pregunta que pueda trasladarles sobre la propiedad o el modelo de copropiedad?`,
    offerMulti:  `Me encantaría ponerte en contacto con los equipos especialistas que hay detrás — antes de hacerlo, ¿tienes alguna pregunta que pueda trasladarles sobre estas propiedades o el modelo de copropiedad?`,
    close: `En cuanto me respondas, haré la presentación de inmediato.`,
    sign: 'Dylan',
    and: ' y ',
  },
  fr: {
    role: 'Cofondateur · Co-Ownership Property',
    subjectSingle: (p) => `Des questions sur ${p} ?`,
    subjectMulti:  ()  => `Des questions sur les biens que vous avez consultés ?`,
    greetingName:  (n) => `Bonjour ${n},`,
    greetingNoName: 'Bonjour,',
    intro: (links) => `Merci de l'intérêt que vous portez à ${links} !`,
    offerSingle: `Je serais ravi de vous mettre en contact avec l'équipe spécialisée qui s'en occupe — avant cela, avez-vous des questions que je pourrais leur transmettre sur le bien ou sur le modèle de copropriété ?`,
    offerMulti:  `Je serais ravi de vous mettre en contact avec les équipes spécialisées qui s'en occupent — avant cela, avez-vous des questions que je pourrais leur transmettre sur ces biens ou sur le modèle de copropriété ?`,
    close: `Dès que vous me répondez, je fais l'introduction sans tarder.`,
    sign: 'Dylan',
    and: ' et ',
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
    const title = escapeHtml(p.title);
    return p.url
      ? `<a href="${escapeHtml(p.url)}" style="color:#1E3448;text-decoration:underline;">${title}</a>`
      : `<strong>${title}</strong>`;
  });
  const links = joinList(linkParts, t.and);

  const subject  = single ? t.subjectSingle(list[0].title) : t.subjectMulti();
  const greeting = firstName
    ? t.greetingName(escapeHtml(capitalizeName(firstName)))
    : t.greetingNoName;
  const offer    = single ? t.offerSingle : t.offerMulti;

  const body = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;">${t.intro(links)}</p>
    <p style="margin:0 0 20px;">${offer}</p>
    <p style="margin:0 0 32px;">${t.close}</p>
    <p style="margin:0;">${t.sign}</p>`;

  return { subject, html: emailShell(body, locale, t.role) };
}
