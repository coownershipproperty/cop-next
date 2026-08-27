/**
 * GET/POST /api/cron/property-watch-alerts
 *
 * Daily cron (see vercel.json). Services the `property_watches` table:
 *
 *   kind 'watch'    — a tracked live home changed price, or sold out
 *                     → send the tracker a short update email
 *   kind 'waitlist' — a NEW live home appeared in the watched region
 *                     → send a "first look" email (each home only once per
 *                       watcher, via notified_slugs)
 *
 * Suppressed addresses are always skipped. Auth mirrors the other crons.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import resend, { FROM_ADDRESS, REPLY_TO } from '@/lib/resend';
import { unsubUrl, listUnsubHeaders } from '@/lib/unsub';
import { filterSuppressed } from '@/lib/suppressions';

export const maxDuration = 120;

const SITE = 'https://co-ownership-property.com';
const SYM = { EUR: '€', USD: '$', GBP: '£' };
const fmt = (price, ccy = 'EUR') => `${SYM[ccy] || ccy}${Number(price).toLocaleString('en-GB')}`;

function shell(bodyHtml, email) {
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

function propCard(p) {
  return `
  <div style="border:1px solid #E8E3DC;margin:0 0 14px">
    ${p.img ? `<a href="${SITE}/property/${p.slug}/"><img src="${p.img}" width="100%" style="display:block;max-height:220px;object-fit:cover" alt=""/></a>` : ''}
    <div style="padding:14px 16px">
      <p style="font-size:15px;margin:0 0 6px"><a href="${SITE}/property/${p.slug}/" style="color:#1E3448;text-decoration:none"><strong>${p.title}</strong></a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a9aaa;margin:0">${p.price ? `${fmt(p.price, p.currency)} per share` : 'Price on request'}${p.beds ? ` · ${p.beds} beds` : ''}</p>
    </div>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  const isCron =
    (secret && auth === `Bearer ${secret}`) || req.headers['x-vercel-cron'] === '1';
  if (!isCron) return res.status(401).json({ error: 'Unauthorised' });

  const db = createSupabaseAdminClient();
  const { data: watches } = await db.from('property_watches').select('*');
  if (!watches || watches.length === 0) return res.status(200).json({ ok: true, sent: 0 });

  const eligible = await filterSuppressed(db, watches);

  // Load every property the watches reference, plus recent arrivals for waitlists.
  const slugs = [...new Set(eligible.map((w) => w.slug))];
  const { data: props } = await db
    .from('properties')
    .select('slug,title,img,price,currency,beds,status,region,country')
    .in('slug', slugs);
  const bySlug = new Map((props || []).map((p) => [p.slug, p]));

  const cutoff = new Date(Date.now() - 3 * 864e5).toISOString();
  const { data: fresh } = await db
    .from('properties')
    .select('slug,title,img,price,currency,beds,region,country,date_added')
    .in('status', ['Live', 'for_sale'])
    .gte('date_added', cutoff);

  let sent = 0;
  for (const w of eligible) {
    try {
      if (w.kind === 'watch') {
        const p = bySlug.get(w.slug);
        if (!p) continue;
        const priceChanged =
          p.price != null && w.last_price != null && Number(p.price) !== Number(w.last_price);
        const nowSold =
          String(p.status).toLowerCase().includes('sold') &&
          !String(w.last_status || '').toLowerCase().includes('sold');
        if (!priceChanged && !nowSold) continue;

        const drop = priceChanged && Number(p.price) < Number(w.last_price);
        const subject = nowSold
          ? `${p.title} — now fully sold`
          : `${p.title} — price ${drop ? 'reduced' : 'updated'} to ${fmt(p.price, p.currency)}`;
        const body = nowSold
          ? `<p style="font-size:15px;line-height:1.7;margin:0 0 20px">The home you were tracking, <strong>${p.title}</strong>, is now fully sold. Homes like this rarely stay available long — here it is for reference, and the collection has more:</p>${propCard(p)}`
          : `<p style="font-size:15px;line-height:1.7;margin:0 0 20px">An update on the home you're tracking: the share price of <strong>${p.title}</strong> ${drop ? 'has been <strong>reduced</strong>' : 'changed'} from ${fmt(w.last_price, p.currency)} to <strong>${fmt(p.price, p.currency)}</strong>.</p>${propCard(p)}`;

        await resend.emails.send({
          from: FROM_ADDRESS,
          reply_to: REPLY_TO,
          to: w.email,
          subject,
          html: shell(body, w.email),
          headers: listUnsubHeaders(w.email),
        });
        await db
          .from('property_watches')
          .update({ last_price: p.price, last_status: p.status })
          .eq('id', w.id);
        sent++;
      } else if (w.kind === 'waitlist') {
        const already = new Set(w.notified_slugs || []);
        const matches = (fresh || []).filter((f) => {
          if (already.has(f.slug) || f.slug === w.slug) return false;
          const hay = `${f.region || ''} ${f.country || ''}`.toLowerCase();
          const needleRegion = String(w.region || '').toLowerCase();
          const needleCountry = String(w.country || '').toLowerCase();
          return (
            (needleRegion && hay.includes(needleRegion)) ||
            (needleCountry && hay.includes(needleCountry))
          );
        });
        if (matches.length === 0) continue;

        const top = matches.slice(0, 3);
        await resend.emails.send({
          from: FROM_ADDRESS,
          reply_to: REPLY_TO,
          to: w.email,
          subject: `First look — new in ${w.region || w.country}`,
          html: shell(
            `<p style="font-size:15px;line-height:1.7;margin:0 0 20px">You asked to be first in line for <strong>${w.region || w.country}</strong>. ${top.length === 1 ? 'A new home just arrived' : `${top.length} new homes just arrived`} — you're seeing ${top.length === 1 ? 'it' : 'them'} before our newsletter goes out:</p>` +
              top.map(propCard).join(''),
            w.email
          ),
          headers: listUnsubHeaders(w.email),
        });
        await db
          .from('property_watches')
          .update({ notified_slugs: [...already, ...top.map((t) => t.slug)] })
          .eq('id', w.id);
        sent++;
      }
    } catch (e) {
      console.error('[watch-alerts] failed for', w.email, w.slug, e.message);
    }
  }

  // ── Daily price-index snapshot (idempotent per day/country) ──
  try {
    const { data: live } = await db
      .from('properties')
      .select('country, price, currency, size, share_denominator')
      .in('status', ['Live', 'for_sale'])
      .gt('price', 0);
    const byCountry = {};
    for (const p of live || []) (byCountry[p.country || 'Other'] = byCountry[p.country || 'Other'] || []).push(p);
    const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
    const today = new Date().toISOString().slice(0, 10);
    const rows = Object.entries(byCountry)
      .filter(([, l]) => l.length >= 3)
      .map(([country, l]) => {
        const prices = l.map((p) => Number(p.price));
        const ws = l.filter((p) => p.size > 0);
        return {
          snap_date: today,
          country,
          homes: l.length,
          median_share: med(prices),
          min_share: Math.min(...prices),
          max_share: Math.max(...prices),
          per_sqm: ws.length >= 3 ? med(ws.map((p) => Math.round((p.price * (p.share_denominator || 8)) / p.size))) : null,
          currency: l[0].currency || 'EUR',
        };
      });
    if (rows.length) await db.from('price_index_snapshots').upsert(rows, { onConflict: 'snap_date,country' });
  } catch (e) {
    console.error('[watch-alerts] price snapshot failed:', e.message);
  }

  console.log(`[watch-alerts] processed ${eligible.length} watches, sent ${sent} emails`);
  return res.status(200).json({ ok: true, watches: eligible.length, sent });
}
