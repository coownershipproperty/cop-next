/**
 * GET/POST /api/cron/rotate-featured
 *
 * Daily cron (see vercel.json) — rebuilds the homepage carousel from live
 * signals via lib/featured-rotation.js and writes the lineup to the
 * `featured_properties` table, then revalidates the cached homepages.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` or the x-vercel-cron marker
 * (same convention as the other cron routes). A logged-in CRM admin may also
 * trigger it manually — the admin → Featured page's "Rotate now" button posts
 * here with the Supabase access token.
 *
 * ?dry=1 → compute and return the lineup WITHOUT writing or revalidating.
 */
import { computeFeaturedLineup } from '@/lib/featured-rotation';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { requireCrmAdmin } from '@/lib/adminAuth';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  const isCron =
    (secret && auth === `Bearer ${secret}`) ||
    req.headers['x-vercel-cron'] === '1';
  if (!isCron) {
    // Fall back to CRM-admin auth (manual "Rotate now" from the admin).
    const admin = await requireCrmAdmin(req, res);
    if (!admin) return; // requireCrmAdmin already sent the 401
  }

  const db = createSupabaseAdminClient();
  const dateStr = new Date().toISOString().slice(0, 10);

  try {
    const lineup = await computeFeaturedLineup(db, dateStr);
    if (!lineup || lineup.length === 0) {
      // Never wipe the carousel on an empty computation — leave as-is.
      return res
        .status(200)
        .json({ ok: false, note: 'Empty lineup — nothing written.' });
    }

    if (req.query.dry === '1') {
      return res.status(200).json({ ok: true, dry: true, date: dateStr, lineup });
    }

    const now = new Date().toISOString();
    const rows = lineup.map((item, i) => ({
      slug: item.slug,
      position: i,
      reason: item.reason,
      updated_at: now,
    }));

    // Replace the whole list (same semantics as /api/admin/featured).
    const { error: delErr } = await db
      .from('featured_properties')
      .delete()
      .neq('slug', '');
    if (delErr) throw delErr;
    const { error: insErr } = await db.from('featured_properties').insert(rows);
    if (insErr) throw insErr;

    for (const path of ['/', '/de', '/es', '/fr']) {
      try {
        await res.revalidate(path);
      } catch (e) {
        console.error(
          '[rotate-featured] revalidate failed for ' + path + ':',
          e.message
        );
      }
    }

    console.log(
      `[rotate-featured] ${dateStr}: wrote ${rows.length} slots (` +
        rows.filter((r) => r.reason.startsWith('trending')).length +
        ' trending, ' +
        rows.filter((r) => r.reason.startsWith('new')).length +
        ' new, ' +
        rows.filter((r) => r.reason.startsWith('discovery')).length +
        ' discovery)'
    );
    return res.status(200).json({ ok: true, date: dateStr, count: rows.length, lineup });
  } catch (e) {
    console.error('[rotate-featured] failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
