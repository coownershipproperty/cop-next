/**
 * lib/email/templateStore.js
 *
 * The Template Studio runtime.
 *
 * Every automated email COP sends is defined by a row in `message_templates`
 * (moment x locale x channel), edited visually at /admin/templates. This module
 * loads the active row, renders its blocks into email HTML, and hands back
 * { subject, html, text }.
 *
 * Three rules this file exists to enforce:
 *
 *  1. Copy changes must never need a deploy. Dylan edits in the admin; the next
 *     send picks it up (60s cache).
 *  2. A database problem must never stop an email. Every caller passes a
 *     `fallback` builder — the hard-coded copy that was shipping before the
 *     studio existed. If the row is missing, malformed, or Supabase is down,
 *     the fallback sends and the incident is logged, not swallowed silently.
 *  3. No raw user input reaches the HTML unescaped.
 *
 * See docs/template-studio.md.
 */

import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const CACHE_MS = 60 * 1000;
const cache = new Map();          // `${moment}:${locale}:${channel}` -> { row, at }

export function clearTemplateCache() { cache.clear(); }

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_DESIGN = {
  bodyFont:    "Arial,Helvetica,sans-serif",
  headingFont: "Georgia,serif",
  fontSize:    '15px',
  lineHeight:  '1.7',
  textColor:   '#2a2a2a',
  headingColor:'#1E3448',
  linkColor:   '#1E3448',
  accentColor: '#C9A84C',
  background:  '#ffffff',
  padding:     '36px 32px 40px',
  maxWidth:    null,
  signature:   true,
  signatureRole: 'Co-Founder · Co-Ownership Property',
  signatureName: 'Dylan Olsson',
  signaturePhoto:'https://co-ownership-property.com/images/dylan-olsson.jpg',
  signaturePhone:'+44 7901 002763',
  signatureEmail:'dylan@co-ownership-property.com',
  signatureSite: 'co-ownership-property.com',
  paragraphGap:  '20px',
  signatureFont: 'Arial,sans-serif',
  // Every subscriber-facing email needs a way out. {{UNSUB_URL}} is swapped
  // for the recipient's real tokenised link at send time (lib/unsub.js).
  showUnsubscribe:  true,
  footerNote:       'You received this because you asked for photos on co-ownership-property.com.',
  unsubscribeLabel: 'Unsubscribe',
};

// ── Escaping ────────────────────────────────────────────────────────────────

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

// Only http(s) and mailto/tel survive — blocks javascript: in an edited link.
function safeUrl(u) {
  const v = String(u || '').trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#|\{\{)/i.test(v)) return v;
  return '';
}

// ── Interpolation ────────────────────────────────────────────────────────────

/**
 * {{name}}            -> data.name, HTML-escaped
 * {{name|there}}      -> data.name, or "there" when empty
 * {{&name}}           -> data.name inserted as raw HTML (for pre-built blocks
 *                        such as the gallery link list — never for lead input)
 * {{#if name}}…{{/if}} -> block shown only when data.name is non-empty
 */
export function interpolate(str, data) {
  let out = String(str == null ? '' : str);

  out = out.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) => {
    const v = lookup(data, key);
    const empty = v == null || v === '' || v === false || (Array.isArray(v) && !v.length);
    return empty ? '' : inner;
  });

  out = out.replace(/\{\{(&?)\s*([\w.]+)\s*(?:\|([^}]*))?\}\}/g, (_, raw, key, fallback) => {
    let v = lookup(data, key);
    if (v == null || v === '') v = fallback != null ? fallback : '';
    return raw ? String(v) : escapeHtml(v);
  });

  return out;
}

function lookup(data, path) {
  return String(path).split('.').reduce(
    (o, k) => (o && typeof o === 'object' ? o[k] : undefined),
    data || {}
  );
}

// ── Inline markdown (deliberately tiny) ──────────────────────────────────────
// Runs AFTER escaping, so the editor gets **bold**, *italic* and [text](url)
// without any HTML injection surface.
function inlineMarkdown(escaped) {
  return escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
      const u = safeUrl(url);
      if (!u) return text;
      return `<a href="${escapeAttr(u)}" style="color:{{__linkColor}};text-decoration:underline;">${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

// ── Block rendering ──────────────────────────────────────────────────────────

function renderBlock(block, data, design) {
  const type = String(block && block.type || 'text');
  const rawGap = block.gap != null ? String(block.gap) : design.paragraphGap;
  const gap  = rawGap;
  // A zero gap collapses to `margin:0` — email clients treat them the same,
  // but keeping the short form means studio output matches the hand-written
  // HTML it replaced, byte for byte.
  const margin = (rawGap === '0' || rawGap === '0px' || rawGap === '') ? '0' : `0 0 ${rawGap}`;

  switch (type) {
    case 'text': {
      const html = inlineMarkdown(interpolate(block.text, data))
        .replace(/\{\{__linkColor\}\}/g, design.linkColor);
      if (!html.trim()) return '';
      const align = block.align ? `text-align:${escapeAttr(block.align)};` : '';
      const size  = block.size ? `font-size:${escapeAttr(block.size)};` : '';
      return `<p style="margin:${escapeAttr(margin)};${align}${size}">${html}</p>`;
    }

    case 'heading': {
      const html = inlineMarkdown(interpolate(block.text, data))
        .replace(/\{\{__linkColor\}\}/g, design.linkColor);
      if (!html.trim()) return '';
      const level = block.level === 2 ? 'h2' : 'h3';
      const size  = block.level === 2 ? '22px' : '18px';
      return `<${level} style="margin:0 0 12px;font-family:${design.headingFont};font-size:${size};font-weight:700;color:${design.headingColor};line-height:1.35;">${html}</${level}>`;
    }

    case 'button': {
      const url   = safeUrl(interpolate(block.url, data));
      const label = interpolate(block.label, data);
      if (!url || !label) return '';
      const bg = block.background || design.accentColor;
      const fg = block.color || '#ffffff';
      return `
<table cellpadding="0" cellspacing="0" border="0" style="margin:${escapeAttr(margin)};">
  <tr><td style="background:${escapeAttr(bg)};border-radius:4px;">
    <a href="${escapeAttr(url)}" style="display:inline-block;padding:13px 26px;font-family:${design.bodyFont};font-size:15px;font-weight:700;color:${escapeAttr(fg)};text-decoration:none;">${label}</a>
  </td></tr>
</table>`;
    }

    case 'list': {
      const items = Array.isArray(block.items) ? block.items : [];
      const lis = items
        .map(i => inlineMarkdown(interpolate(i, data)).replace(/\{\{__linkColor\}\}/g, design.linkColor))
        .filter(s => s.trim())
        .map(s => `<li style="margin:0 0 6px;">${s}</li>`)
        .join('');
      if (!lis) return '';
      return `<ul style="margin:${escapeAttr(margin)};padding-left:22px;">${lis}</ul>`;
    }

    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e0e0e0;margin:${escapeAttr(margin)};">`;

    case 'spacer':
      return `<div style="height:${escapeAttr(block.height || '16px')};line-height:1px;font-size:1px;">&nbsp;</div>`;

    case 'image': {
      const src = safeUrl(interpolate(block.src, data));
      if (!src) return '';
      const w = block.width ? ` width="${escapeAttr(block.width)}"` : '';
      return `<img src="${escapeAttr(src)}"${w} alt="${escapeAttr(block.alt || '')}" style="display:block;max-width:100%;height:auto;margin:${escapeAttr(margin)};border-radius:${escapeAttr(block.radius || '0')};">`;
    }

    // A block of HTML assembled by the sending code (gallery links, answer
    // lists). `data[block.slot]` must be trusted, pre-escaped HTML.
    case 'slot': {
      const v = lookup(data, block.slot);
      return v ? String(v) : '';
    }

    // Escape hatch for the one-off case the blocks above cannot express.
    case 'html':
      return interpolate(block.html, data);

    default:
      return '';
  }
}

// ── Shell ────────────────────────────────────────────────────────────────────

function signatureHtml(design) {
  if (!design.signature) return '';
  const photo = design.signaturePhoto
    ? `<td width="108" valign="top" style="padding-right:18px;">
      <img src="${escapeAttr(design.signaturePhoto)}" width="90" height="90" style="border-radius:50%;display:block;object-fit:cover;" alt="${escapeAttr(design.signatureName)}">
    </td>` : '';
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;">
  <tr>
    ${photo}
    <td valign="middle">
      <p style="margin:0 0 3px;font-family:${design.headingFont};font-size:18px;font-weight:700;color:${design.headingColor};">${escapeHtml(design.signatureName)}</p>
      <p style="margin:0 0 14px;font-family:${design.signatureFont};font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(design.signatureRole)}</p>
      ${design.signaturePhone ? `<p style="margin:0 0 4px;font-family:${design.signatureFont};font-size:13px;color:#555;">${escapeHtml(design.signaturePhone)}</p>` : ''}
      ${design.signatureEmail ? `<p style="margin:0 0 4px;font-family:${design.signatureFont};font-size:13px;color:#555;">${escapeHtml(design.signatureEmail)}</p>` : ''}
      ${design.signatureSite ? `<p style="margin:0;font-family:${design.signatureFont};font-size:13px;">
        <a href="https://${escapeAttr(design.signatureSite)}" style="color:${design.accentColor};text-decoration:none;">${escapeHtml(design.signatureSite)}</a>
      </p>` : ''}
    </td>
  </tr>
</table>`;
}

/**
 * A quiet one-line footer carrying the unsubscribe link.
 *
 * These emails are written as personal notes from Dylan, so this is
 * deliberately small and grey rather than a campaign footer — but it has to be
 * here. Both of these emails previously went out with no unsubscribe of any
 * kind, which leaves a recipient who wants out with only one button: "report
 * spam", against the domain that carries every other COP email.
 */
function unsubscribeHtml(design) {
  if (design.showUnsubscribe === false) return '';
  const note = design.footerNote ? `${escapeHtml(design.footerNote)} ` : '';
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;padding-top:14px;border-top:1px solid #ededed;">
  <tr><td style="font-family:${design.signatureFont};font-size:11px;line-height:1.6;color:#9a9a9a;">
    ${note}<a href="{{UNSUB_URL}}" style="color:#9a9a9a;text-decoration:underline;">${escapeHtml(design.unsubscribeLabel || 'Unsubscribe')}</a>.
  </td></tr>
</table>`;
}

function preheaderHtml(text) {
  if (!text) return '';
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(text)}</div>`;
}

function shell(body, locale, design, preheader) {
  const inner = design.maxWidth
    ? `<table width="${escapeAttr(design.maxWidth)}" cellpadding="0" cellspacing="0" border="0" align="left" style="max-width:100%;"><tr><td style="padding:${escapeAttr(design.padding)};">${body}</td></tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:${escapeAttr(design.padding)};">${body}</td></tr></table>`;
  return `<!DOCTYPE html>
<html lang="${escapeAttr(locale || 'en')}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${escapeAttr(design.background)};font-family:${design.bodyFont};font-size:${escapeAttr(design.fontSize)};color:${escapeAttr(design.textColor)};line-height:${escapeAttr(design.lineHeight)};">
${preheaderHtml(preheader)}${inner}
</body>
</html>`;
}

// ── Public: render ───────────────────────────────────────────────────────────

/**
 * Turn a template row + data into a sendable email.
 * @returns {{subject:string, html:string, text:string, from:string|null, replyTo:string|null}}
 */
export function renderTemplate(row, data = {}) {
  if (!row) throw new Error('renderTemplate: no template row');

  const design  = { ...DEFAULT_DESIGN, ...(row.design || {}) };
  const blocks  = Array.isArray(row.blocks) ? row.blocks : [];
  const body    = blocks.map(b => renderBlock(b, data, design)).join('\n');
  const subject = interpolate(row.subject || '', data).replace(/&amp;/g, '&');
  const pre     = row.preheader ? interpolate(row.preheader, data) : '';

  return {
    subject,
    html: shell(body + signatureHtml(design) + unsubscribeHtml(design), row.locale || data.locale, design, pre),
    text: toPlainText(blocks, data),
    from:    row.from_name && row.from_email ? `${row.from_name} <${row.from_email}>` : (row.from_email || null),
    replyTo: row.reply_to || null,
  };
}

function toPlainText(blocks, data) {
  return blocks
    .map(b => {
      if (b.type === 'text' || b.type === 'heading') return interpolate(b.text, data);
      if (b.type === 'button') return `${interpolate(b.label, data)}: ${interpolate(b.url, data)}`;
      if (b.type === 'list') return (b.items || []).map(i => `- ${interpolate(i, data)}`).join('\n');
      return '';
    })
    .filter(Boolean)
    .join('\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1');
}

// ── Public: load ─────────────────────────────────────────────────────────────

/**
 * Load the active template for a moment. Falls back to English, then to null.
 * Never throws — a null return means "use your fallback builder".
 */
export async function getTemplate(moment, locale = 'en', channel = 'email') {
  const tryLocales = locale && locale !== 'en' ? [locale, 'en'] : ['en'];

  for (const loc of tryLocales) {
    const key = `${moment}:${loc}:${channel}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      if (hit.row) return hit.row;
      continue;
    }
    try {
      const db = createSupabaseAdminClient();
      const { data, error } = await db
        .from('message_templates')
        .select('id,moment,locale,channel,kind,version,tier,subject,preheader,blocks,design,strings,from_name,from_email,reply_to,active')
        .eq('moment', moment).eq('locale', loc).eq('channel', channel).eq('active', true)
        .maybeSingle();
      if (error) throw error;
      cache.set(key, { row: data || null, at: Date.now() });
      if (data) return data;
    } catch (e) {
      console.error(`[templateStore] load failed for ${moment}/${loc}:`, e.message);
      return null;   // do not cache an error — retry on the next send
    }
  }
  return null;
}

/**
 * Record that a template version actually sent.
 *
 * Fire and forget: a counter must never delay or fail an email. Kept here
 * rather than in each caller so every send path is counted the same way, and
 * so `unedited_streak` means one precise thing — how many times this exact
 * wording has gone out without anyone editing it. That is the evidence for
 * promoting a template from "draft for review" to "sends automatically";
 * before this, both columns sat at zero forever.
 */
function bumpSend(templateId) {
  if (!templateId) return;
  try {
    const db = createSupabaseAdminClient();
    Promise.resolve(db.rpc('bump_template_send', { p_id: templateId }))
      .then(({ error }) => { if (error) console.error('[templateStore] bumpSend:', error.message); })
      .catch((e) => console.error('[templateStore] bumpSend:', e.message));
  } catch (e) {
    console.error('[templateStore] bumpSend:', e.message);
  }
}

/**
 * Wording overrides for a copy-only template (kind = 'strings').
 *
 * Returns a flat map of i18n key -> replacement text, holding ONLY what has
 * been changed in the studio. A missing key means "use the bundled
 * translation", so an untouched template returns {} and the email renders
 * exactly as it does today. Never throws — a database problem returns {},
 * which is the safe answer.
 */
export async function getCopy(moment, locale = 'en') {
  try {
    const row = await getTemplate(moment, locale);
    if (row) bumpSend(row.id);
    const strings = row && row.strings;
    return strings && typeof strings === 'object' ? strings : {};
  } catch (e) {
    console.error(`[templateStore] getCopy failed for ${moment}/${locale}:`, e.message);
    return {};
  }
}

/**
 * Resolve one overridable string, falling back to the caller's own default.
 * Used for values built outside the component, such as the subject line.
 */
export function copyOr(copy, key, fallback) {
  const v = copy && copy[key];
  return typeof v === 'string' && v.trim() !== '' ? v : fallback;
}

/**
 * The one function sending code should call.
 *
 * @param {string}   moment
 * @param {string}   locale
 * @param {object}   data
 * @param {Function} fallback  () => ({subject, html}) — the pre-studio copy
 */
export async function buildEmail(moment, locale, data, fallback) {
  try {
    const row = await getTemplate(moment, locale);
    if (row) {
      const out = renderTemplate(row, data);
      if (out.subject && out.html) {
        bumpSend(row.id);
        return { ...out, source: 'studio', version: row.version };
      }
    }
  } catch (e) {
    console.error(`[templateStore] render failed for ${moment}/${locale}:`, e.message);
  }
  const fb = fallback ? fallback() : null;
  if (!fb) throw new Error(`No template and no fallback for ${moment}/${locale}`);
  return { ...fb, source: 'fallback', version: null };
}
