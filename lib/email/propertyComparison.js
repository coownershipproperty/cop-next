/**
 * lib/email/propertyComparison.js
 *
 * The side-by-side block in the gallery follow-up: every home someone looked
 * at in one visit, with the figures aligned so the eye can scan straight down
 * the column and compare them.
 *
 * This is the one thing this email can do that nothing else in the sequence
 * can. Each individual unlock email shows one home; only this one shows the
 * shortlist as a shortlist. That is why it replaced a bare list of links.
 *
 * Design boundary: the STUDIO owns the words around this block, the CODE owns
 * the card. Card layout in an email is table markup with inline styles and
 * Outlook-safe width attributes — not something anyone should be editing in a
 * textarea, and not something that survives being edited by hand.
 *
 * Figures come from `properties` only — price, share denominator, beds, size —
 * all authoritative columns. Nights per year and shares remaining are
 * deliberately absent: those live in property_facts, most rows are still
 * flagged `inferred`, and a guessed figure in front of a EUR 200k buyer is the
 * worst outcome available.
 */

import { BRAND } from './brand';

// Named locally for readability in the markup below; the values live in
// lib/email/brand.js so this block can never drift from the unlock email.
const C = {
  navy:   BRAND.navy,
  navy60: BRAND.navy60,
  gold:   BRAND.gold,
  text:   BRAND.text,
  label:  BRAND.label,
  rule:   BRAND.rule,
  serif:  BRAND.serif,
  sans:   BRAND.sans,
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

const SYMBOL = { EUR: '€', USD: '$', GBP: '£' };

function money(price, currency) {
  if (!price) return null;
  return `${SYMBOL[currency] || '€'}${Number(price).toLocaleString('en-GB')}`;
}

/** "Marbella, Spain" from the listing title, falling back to city/region. */
function placeOf(p) {
  const raw = String(p.title || '').trim();
  const beforeDash = raw.split(/\s[—–-]\s/)[0];
  const parts = beforeDash.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[parts.length - 1]}`;
  return [p.city, p.country].filter(Boolean).join(', ') || beforeDash;
}

/** "6-Bed House" from the listing title — the part after the em dash. */
function nameOf(p) {
  const raw = String(p.title || '').trim();
  const m = raw.split(/\s[—–-]\s/);
  return (m.length > 1 ? m.slice(1).join(' — ') : raw).trim();
}

/** One labelled figure. Same cell width on every card, so they line up. */
function figure(label, value) {
  if (!value) return '';
  return `
<td valign="top" style="padding:0 22px 0 0;">
  <p style="margin:0 0 2px;font-family:${C.sans};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:${C.label};">${esc(label)}</p>
  <p style="margin:0;font-family:${C.sans};font-size:14px;font-weight:700;color:${C.navy};white-space:nowrap;">${esc(value)}</p>
</td>`;
}

function card(p, isLast) {
  const price = money(p.price, p.currency);
  const share = `1/${p.share_denominator || 8}`;
  const beds  = p.beds ? `${p.beds}` : null;
  const size  = p.size ? `${p.size} m²` : null;

  const photo = p.img
    ? `<img src="${esc(p.img)}" width="150" alt="${esc(nameOf(p))}"
         class="cop-cmp-img"
         style="width:150px;max-width:150px;height:auto;display:block;border-radius:3px;border:0;outline:none;text-decoration:none;">`
    : `<div style="width:150px;height:104px;background:${C.rule};border-radius:3px;"></div>`;

  const links = [
    p.galleryUrl ? `<a href="${esc(p.galleryUrl)}" style="color:${C.gold};text-decoration:none;font-weight:700;">See the photos&nbsp;›</a>` : '',
    p.url ? `<a href="${esc(p.url)}" style="color:${C.navy60};text-decoration:none;">View listing</a>` : '',
  ].filter(Boolean).join('<span style="color:#D8D2C8;padding:0 9px;">|</span>');

  return `
<tr>
  <td valign="top" style="padding:0 18px ${isLast ? '4px' : '20px'} 0;">${photo}</td>
  <td valign="top" style="padding:0 0 ${isLast ? '4px' : '20px'} 0;">
    <p style="margin:0 0 3px;font-family:${C.sans};font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:${C.navy60};">${esc(placeOf(p))}</p>
    <p class="cop-cmp-name" style="margin:0 0 12px;font-family:${C.serif};font-size:18px;line-height:1.25;color:${C.navy};">${esc(nameOf(p))}</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;"><tr>
      ${figure('Per share', price)}
      ${figure('Share', share)}
      ${figure('Beds', beds)}
      ${figure('Size', size)}
    </tr></table>
    <p style="margin:0;font-family:${C.sans};font-size:12.5px;">${links}</p>
  </td>
</tr>
${isLast ? '' : `<tr><td colspan="2" style="padding:0 0 20px;"><div style="height:1px;background:${C.rule};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>`}`;
}

/**
 * @param {object[]} rows  property rows plus { url, galleryUrl }
 * @param {string}   heading  small caps heading above the block
 * @returns {string} email-safe HTML, or '' when there is nothing to show
 */
export function buildComparisonHtml(rows, heading) {
  const list = (rows || []).filter(Boolean);
  if (!list.length) return '';

  const head = heading
    ? `<p style="margin:0 0 14px;font-family:${C.sans};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${C.navy60};">${esc(heading)}</p>`
    : '';

  return `
${head}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border-top:1px solid ${C.rule};padding-top:20px;">
  ${list.map((p, i) => card(p, i === list.length - 1)).join('')}
</table>`;
}
