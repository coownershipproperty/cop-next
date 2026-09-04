/**
 * GET/POST /api/cron/property-watch-alerts
 *
 * Daily cron (see vercel.json). Services the `property_watches` table.
 *
 * Cadence: the job LOOKS every day so a price cut reaches the watcher while
 * it still matters, but each watch can only produce one email every
 * COOLDOWN_DAYS. A home that moves twice in a week sends once. That is the
 * "weekly at most" promise the bell makes, without making someone wait six
 * days to hear that the home they are tracking has sold.
 *
 * Every alert is written in the language the watcher subscribed in
 * (property_watches.locale) and ends by inviting a reply — a watcher asked to
 * hear about one specific home, which makes them the warmest contact we have.
 *
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
import { localeColumns } from '@/lib/i18n';
import { buildWatchEmail, fmt, shell, propCard } from '@/lib/watchAlertEmail';

export const maxDuration = 120;

/* One email per watch per week, however often the job looks. */
const COOLDOWN_DAYS = 7;
const WATCH_LOCALES = new Set(['en', 'es', 'fr', 'de', 'it', 'nl', 'pt', 'sv', 'da', 'no']);

const SITE = 'https://co-ownership-property.com';

/**
 * Write today's price-index snapshot: median / min / max share price and
 * price per sqm per country, from the live catalogue.
 *
 * This is deliberately SEPARATE from the watch alerts and runs first. It used
 * to sit at the end of the handler, after an early return that fires when
 * nobody is watching a property — so the public Price Index page silently
 * depended on an unrelated feature having users, and wrote nothing whenever it
 * did not. Idempotent per (snap_date, country), so running twice is harmless.
 */
async function writePriceIndexSnapshot(db) {
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

  // Runs whether or not anyone is watching a property — the price index is a
  // public page and must not depend on the watch list being non-empty.
  await writePriceIndexSnapshot(db);

  const { data: watches } = await db.from('property_watches').select('*');
  if (!watches || watches.length === 0) {
    return res.status(200).json({ ok: true, sent: 0, snapshot: true });
  }

  const eligible = await filterSuppressed(db, watches);

  // Load every property the watches reference, plus recent arrivals for waitlists.
  const slugs = [...new Set(eligible.map((w) => w.slug))];
  const { data: props } = await db
    .from('properties')
    .select(`slug,img,price,currency,beds,status,region,country,${localeColumns(['title'])}`)
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

        /* Snapshot first, email second. If the cooldown blocks the send we
           still record the new price, so the next email describes the move
           the watcher has not seen rather than replaying this one. */
        const cooled =
          !w.last_notified_at ||
          Date.now() - new Date(w.last_notified_at).getTime() > COOLDOWN_DAYS * 864e5;
        if (!cooled) {
          await db.from('property_watches')
            .update({ last_price: p.price, last_status: p.status })
            .eq('id', w.id);
          continue;
        }

        const locale = w.locale && WATCH_LOCALES.has(w.locale) ? w.locale : 'en';
        const kind = nowSold ? 'sold'
          : (priceChanged && Number(p.price) < Number(w.last_price)) ? 'drop' : 'rise';
        const { subject, html } = buildWatchEmail({
          property: p, email: w.email, locale, kind, oldPrice: w.last_price,
        });

        await resend.emails.send({
          from: FROM_ADDRESS,
          reply_to: REPLY_TO,
          to: w.email,
          subject,
          html,
          headers: listUnsubHeaders(w.email),
        });
        await db
          .from('property_watches')
          .update({ last_price: p.price, last_status: p.status, last_notified_at: new Date().toISOString() })
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

  console.log(`[watch-alerts] processed ${eligible.length} watches, sent ${sent} emails`);
  return res.status(200).json({ ok: true, watches: eligible.length, sent });
}
