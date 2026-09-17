/**
 * GET  /api/admin/ui/homes-order?sort=newest&mode=&cap=
 * POST /api/admin/ui/homes-order   { mode, maxPerPage }
 *
 * Shows what /our-homes/ will actually render, and lets David change how the
 * grid treats Discreet Sale cards without a deploy.
 *
 * Why it exists: on 17 Sep 2026 the catalogue's top row was three discreet
 * cards. Those open a popup instead of linking to a listing page, so the page
 * Google treats as the catalogue was passing no link to any home. There was no
 * way to see that from the admin short of loading the public page and counting
 * — and no way to change it short of editing a constant and pushing.
 *
 * It imports the SAME capDiscreet and the SAME window size the public page
 * uses, so the preview cannot drift from the page. That is the point: COP's
 * recurring failure is keeping a second copy of its own state and then reading
 * the copy.
 *
 * GET takes optional mode/cap to preview a change before saving it. Both are
 * read-only against the database.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { requireCrmAdmin } from '@/lib/adminAuth';
import {
  capDiscreet, GRID_PAGE_SIZE, MAX_DISCREET_PER_PAGE, DEFAULT_DISCREET_MODE,
} from '@/lib/discreetMix';

const SETTING = 'discreet_grid';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const db = createSupabaseAdminClient();

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const mode = body.mode === 'tail' ? 'tail' : 'mix';
    const n = parseInt(body.maxPerPage, 10);
    // Reject the settings that would break the grid instead of storing them:
    // at or above the window size is "no cap", zero strands every discreet
    // home at the bottom of 491 results.
    if (!Number.isFinite(n) || n < 1 || n >= GRID_PAGE_SIZE) {
      return res.status(400).json({
        error: `maxPerPage must be between 1 and ${GRID_PAGE_SIZE - 1}`,
      });
    }
    const { error } = await db.from('crm_settings')
      .upsert({ key: SETTING, value: { mode, maxPerPage: n }, updated_at: new Date().toISOString() },
              { onConflict: 'key' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, mode, maxPerPage: n,
      note: '/our-homes/ is ISR on a 1-hour revalidate, so the public grid picks this up within the hour.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: setting } = await db.from('crm_settings')
    .select('value, updated_at').eq('key', SETTING).maybeSingle();
  const saved = (setting && setting.value) || {};

  // ?mode= / ?cap= preview an unsaved change.
  const mode = req.query.mode === 'tail' ? 'tail'
             : req.query.mode === 'mix' ? 'mix'
             : (saved.mode || DEFAULT_DISCREET_MODE);
  const capQ = parseInt(req.query.cap, 10);
  const cap = Number.isFinite(capQ) && capQ > 0 ? capQ
            : (saved.maxPerPage || MAX_DISCREET_PER_PAGE);
  const sort = ['newest', 'asc', 'desc'].includes(req.query.sort) ? req.query.sort : 'newest';

  const { data: rows, error } = await db.from('properties')
    .select('slug, title, price, city, region, country, status, date_added, is_discreet')
    // Same status set the public page uses.
    .in('status', ['Live', 'for_sale', 'sold']);
  if (error) return res.status(500).json({ error: error.message });

  const list = rows.map((p) => ({
    slug: p.slug, title: p.title, price: p.price, place: [p.city, p.country].filter(Boolean).join(', '),
    status: p.status, dateAdded: p.date_added, discreet: !!p.is_discreet,
  }));

  // The public page pushes sold homes to the end so live inventory leads.
  const rank = (p) => (p.status === 'sold' ? 1 : 0);
  const dateVal = (d) => (d ? Date.parse(d) || 0 : 0);
  if (sort === 'newest') list.sort((a, b) => rank(a) - rank(b) || dateVal(b.dateAdded) - dateVal(a.dateAdded));
  if (sort === 'asc') list.sort((a, b) => rank(a) - rank(b) || (a.price || 0) - (b.price || 0));
  if (sort === 'desc') list.sort((a, b) => rank(a) - rank(b) || (b.price || 0) - (a.price || 0));

  const ordered = capDiscreet(list, GRID_PAGE_SIZE, cap, { mode });

  const windows = [];
  for (let w = 0; w * GRID_PAGE_SIZE < ordered.length; w++) {
    const win = ordered.slice(w * GRID_PAGE_SIZE, (w + 1) * GRID_PAGE_SIZE);
    windows.push({
      window: w + 1,
      discreet: win.filter((p) => p.discreet).length,
      firstDiscreetSlot: win.findIndex((p) => p.discreet),
    });
    if (windows.length >= 6) break;
  }

  return res.status(200).json({
    applied: { mode, maxPerPage: cap, sort, pageSize: GRID_PAGE_SIZE },
    saved: { mode: saved.mode || DEFAULT_DISCREET_MODE,
             maxPerPage: saved.maxPerPage || MAX_DISCREET_PER_PAGE,
             updatedAt: setting?.updated_at || null },
    previewingUnsaved: mode !== (saved.mode || DEFAULT_DISCREET_MODE)
                    || cap !== (saved.maxPerPage || MAX_DISCREET_PER_PAGE),
    totals: { all: ordered.length,
              discreet: ordered.filter((p) => p.discreet).length,
              firstDiscreetSlot: ordered.findIndex((p) => p.discreet) },
    windows,
    // The first two windows, card by card — what a visitor actually sees before
    // clicking Load more.
    firstTwoPages: ordered.slice(0, GRID_PAGE_SIZE * 2).map((p, i) => ({
      slot: i + 1, discreet: p.discreet, status: p.status,
      title: p.title, place: p.place, price: p.price, dateAdded: p.dateAdded,
    })),
  });
}
