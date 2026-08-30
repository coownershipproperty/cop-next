/**
 * lib/watchAlertEmail.js
 *
 * Rendering for the "notify me" bell emails. Lives here rather than inside the
 * cron so that the cron and the preview route render byte-identical email —
 * a preview that drifts from what actually sends is worse than no preview.
 */
import { propertyHref } from '@/lib/i18n';
import { copyFor } from '@/lib/watchAlertCopy';
import { unsubUrl } from '@/lib/unsub';

const SITE = 'https://co-ownership-property.com';
const SYM = { EUR: '\u20ac', USD: '$', GBP: '\u00a3' };
export const fmt = (price, ccy = 'EUR') =>
  `${SYM[ccy] || ccy}${Number(price).toLocaleString('en-GB')}`;

export function shell(bodyHtml, email) {
  return `
  <div style="background:#F7F4EE;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;color:#1E3448">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E8E3DC">
      <div style="background:#1E3448;padding:26px 32px;text-align:center">
        <span style="color:#F4EFE4;font-size:20px;letter-spacing:0.35em;font-weight:400">C O P</span><br/>
        <span style="color:#C9A84C;font-size:10px;letter-spacing:0.2em;text-transform:uppercase">Co-Ownership Properties</span>
      </div>
      <div style="padding:36px 32px 28px">
        <div style="width:36px;border-top:2px solid #C9A84C;margin:0 0 18px"></div>
        ${bodyHtml}
      </div>
      <div style="padding:18px 32px;border-top:1px solid #E8E3DC">
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#8a9aaa;margin:0">
          Co-Ownership Properties · co-ownership-property.com<br/>
          <a href="${unsubUrl(email)}" style="color:#8a9aaa">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>`;
}

export function propCard(p, locale = 'en', perLabel = 'per share') {
  const href = `${SITE}${propertyHref(p.slug, locale)}`;
  return `
  <div style="border:1px solid #E8E3DC;margin:0 0 14px">
    ${p.img ? `<a href="${href}"><img src="${p.img}" width="100%" style="display:block;max-height:220px;object-fit:cover" alt=""/></a>` : ''}
    <div style="padding:14px 16px">
      <p style="font-size:15px;margin:0 0 6px"><a href="${href}" style="color:#1E3448;text-decoration:none"><strong>${p.title}</strong></a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a9aaa;margin:0">${p.price ? `${fmt(p.price, p.currency)} ${perLabel}` : ''}${p.beds ? ` · ${p.beds} beds` : ''}</p>
    </div>
  </div>`;
}

/** The ask that turns an alert into a conversation, plus a signed-off close. */
export function askBlock(t, href) {
  return `
  <p style="font-size:15px;line-height:1.7;margin:0 0 22px">${t.ask}</p>
  <p style="margin:0 0 26px">
    <a href="${href}" style="display:inline-block;background:#1E3448;color:#F4EFE4;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.08em;padding:12px 22px">${t.cta}</a>
  </p>
  <p style="font-size:15px;line-height:1.7;margin:0">${t.sign}<br/>
    <span style="font-family:Arial,sans-serif;font-size:12px;color:#8a9aaa">${t.role}</span></p>`;
}

/**
 * Build one watch alert.
 *   kind: 'sold' | 'drop' | 'rise'
 * Returns { subject, html } ready to hand to Resend.
 */
export function buildWatchEmail({ property, email, locale = 'en', kind, oldPrice }) {
  const t = copyFor(locale);
  const title = property[`title_${locale}`] || property.title_en || property.title || '';
  const href = `${SITE}${propertyHref(property.slug, locale)}`;
  const now = fmt(property.price, property.currency);

  const subject =
    kind === 'sold' ? t.subjSold(title)
    : kind === 'drop' ? t.subjDrop(title, now)
    : t.subjRise(title, now);

  const lead =
    kind === 'sold' ? `${t.sold(title)} ${t.soldNext}`
    : kind === 'drop' ? t.drop(title, fmt(oldPrice, property.currency), now)
    : t.rise(title, fmt(oldPrice, property.currency), now);

  const body =
    `<p style="font-family:Arial,sans-serif;font-size:12px;color:#8a9aaa;margin:0 0 14px">${t.intro}</p>` +
    `<p style="font-size:15px;line-height:1.7;margin:0 0 20px">${lead}</p>` +
    propCard({ ...property, title }, locale, t.per) +
    askBlock(t, href);

  return { subject, html: shell(body, email) };
}
