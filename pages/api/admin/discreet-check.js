/**
 * POST /api/admin/discreet-check
 *
 * Reconciles COP's discreet listings against the partner's own discreet
 * table, which the caller scrapes out of the partner portal and posts here.
 *
 * Why it works this way. Discreet homes exist ONLY inside the partner portal
 * — they are absent from the partner's public site by definition, so the
 * daily listing sync cannot see them. The portal needs a login, and on
 * 17 Sep 2026 MYNE replaced portal passwords with emailed one-time codes, so
 * an unattended cron can no longer sign in at all. The options left were to
 * mail David's father a login code every morning forever, or to lift a
 * session token out of his browser and store it — training someone to tap
 * login codes without reading them, or defeating a control MYNE had just
 * deliberately installed. Neither is worth a price check.
 *
 * So the browser does the reading, where a human is already logged in, and
 * the server does the comparing. No credential is stored anywhere and
 * nothing expires. The trade is that this runs when David fires it rather
 * than at 6am; given the portal sits open on his machine all day, that is a
 * smaller loss than it sounds.
 *
 * Matching is on `properties.partner_ref` — the partner's own name for the
 * home — NOT on price. Matching on price to detect a price change is
 * circular, and it is why this could not be built before the 17 Sep backfill
 * linked all 25 live discreet rows while the two sides still agreed.
 *
 * Katharina Ilgner (MYNE) asked that prices be right and that sold homes come
 * down quickly. If MYNE ever grants read access or a feed, the scrape half of
 * this becomes a cron and everything below is reused unchanged.
 *
 * Body: { discreet: [{name, destination, region, rooms, price}],
 *         open:     [{name, destination, region, rooms, price, signed}],
 *         apply?: boolean }
 *
 * Default is a dry run: it reports and changes nothing.
 *
 * With apply=true it does ONE thing — hides COP rows whose home has left the
 * partner's discreet table. David's rule, verbatim: "not sold out, cus its
 * discreet lets just hide, and if its ever back on market we put it back
 * live." A discreet home that sold is not announced as sold; it disappears.
 * Going the other way is never automatic: re-publishing a home that may have
 * been repriced or re-scoped while it was away is a decision, not a diff.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { requireCrmAdmin } from '@/lib/adminAuth';

/** "399,000 €" / "€399.000" / 399000 → 399000. Null when there is no number. */
function toPrice(v) {
  if (v === null || v === undefined) return null;
  const digits = String(v).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

/**
 * "2+1" → 2, "3" → 3, "4,5" → 4.
 * The partner writes a study or box room as "+1"; COP counts bedrooms, so the
 * leading integer is the comparable figure (their "3+1" homes are COP's
 * 3-beds — checked against Casa Vida and Villa Tyresö).
 * Their Krimml Panorama row carries a DATE in the rooms column, which is why
 * anything unparseable returns null and is skipped rather than flagged.
 */
function toRooms(v) {
  const m = /^\s*(\d+)/.exec(String(v ?? ''));
  return m ? parseInt(m[1], 10) : null;
}

const norm = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const discreetRows = Array.isArray(body.discreet) ? body.discreet : null;
  const openRows = Array.isArray(body.open) ? body.open : [];
  const apply = body.apply === true;

  // An empty scrape must never be read as "everything sold". The portal
  // renders its tables with JavaScript, so a scrape that ran too early
  // returns []. Hiding the whole discreet catalogue on a race is exactly the
  // kind of silent damage this endpoint exists to prevent.
  if (!discreetRows || discreetRows.length === 0) {
    return res.status(400).json({
      error: 'No discreet rows posted. Refusing to treat an empty scrape as an empty table.',
    });
  }

  const db = createSupabaseAdminClient();
  const { data: cop, error } = await db
    .from('properties')
    .select('slug, title, status, price, beds, partner, partner_ref, is_discreet')
    .eq('is_discreet', true);

  if (error) return res.status(500).json({ error: error.message });

  const byRef = new Map();
  discreetRows.forEach((r) => { if (r?.name) byRef.set(norm(r.name), r); });
  const openByRef = new Map();
  openRows.forEach((r) => { if (r?.name) openByRef.set(norm(r.name), r); });

  const out = {
    checkedAt: new Date().toISOString(),
    scraped: { discreet: discreetRows.length, open: openRows.length },
    copDiscreetRows: cop.length,
    priceMismatch: [], roomsMismatch: [],
    wentPublic: [], goneFromPortal: [],
    notOnCop: [], unlinked: [],
    hidden: [],
  };

  for (const row of cop) {
    if (!row.partner_ref) {
      out.unlinked.push({ slug: row.slug, status: row.status });
      continue;
    }
    const ref = norm(row.partner_ref);
    const mine = byRef.get(ref);

    if (!mine) {
      // Left the discreet table. Public now, or gone entirely?
      const entry = { slug: row.slug, partner_ref: row.partner_ref, status: row.status };
      if (openByRef.has(ref)) out.wentPublic.push(entry);
      else out.goneFromPortal.push(entry);
      continue;
    }

    const theirPrice = toPrice(mine.price);
    const ourPrice = toPrice(row.price);
    if (theirPrice && ourPrice && theirPrice !== ourPrice) {
      out.priceMismatch.push({
        slug: row.slug, partner_ref: row.partner_ref, status: row.status,
        cop: ourPrice, partner: theirPrice, delta: theirPrice - ourPrice,
      });
    }

    const theirRooms = toRooms(mine.rooms);
    if (theirRooms && row.beds && theirRooms !== row.beds) {
      out.roomsMismatch.push({
        slug: row.slug, partner_ref: row.partner_ref,
        cop: row.beds, partner: mine.rooms,
      });
    }
  }

  const copRefs = new Set(cop.filter((r) => r.partner_ref).map((r) => norm(r.partner_ref)));
  for (const [ref, r] of byRef) {
    if (!copRefs.has(ref)) {
      out.notOnCop.push({ name: r.name, region: r.region, rooms: r.rooms, price: r.price });
    }
  }

  if (apply) {
    // Hide only. Never "sold" — a discreet home leaving the table is not an
    // announcement we are entitled to make, and the seller's privacy is the
    // whole product. Never auto-publish on the way back either.
    const toHide = [...out.wentPublic, ...out.goneFromPortal]
      .filter((r) => r.status === 'Live')
      .map((r) => r.slug);

    for (const slug of toHide) {
      const { error: upErr } = await db.from('properties')
        .update({ status: 'hidden' }).eq('slug', slug);
      if (upErr) continue;
      out.hidden.push(slug);
      await db.from('listing_changes').insert({
        partner: 'myne', slug, change_type: 'left_discreet_table',
        field: 'status', old_value: 'Live', new_value: 'hidden', applied: true,
        notes: 'Hidden by discreet-check: no longer on the partner discreet table. '
             + 'Not marked sold — discreet homes are withdrawn silently. '
             + 'Re-list by hand if it returns.',
      });
    }

    for (const m of out.priceMismatch) {
      await db.from('listing_changes').insert({
        partner: 'myne', slug: m.slug, change_type: 'price_mismatch', field: 'price',
        old_value: String(m.cop), new_value: String(m.partner), applied: false,
        notes: 'discreet-check: partner portal disagrees with COP. Not applied automatically.',
      });
    }
  }

  out.clean = !out.priceMismatch.length && !out.roomsMismatch.length
    && !out.wentPublic.length && !out.goneFromPortal.length;

  return res.status(200).json(out);
}
