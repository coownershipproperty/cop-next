/**
 * GET/POST /api/cron/verify-supply
 *
 * Reads a rolling batch of live listings against the partner's own page and
 * takes down the ones the partner has withdrawn.
 *
 * Why this exists. On 18 Sep 2026 Katharina Ilgner (MYNE) emailed to ask COP
 * to remove a listing: "This is an old property — could you please take it
 * off? In general, please have a look at the current listings and update
 * yours." The home was Jardín Sa Riera in Begur, Live on COP at €154,000.
 *
 * The audit that followed found something worse than one stale row. The daily
 * sync writes 'new' and 'price' rows and has never, in the whole history of
 * listing_changes, written a 'removed' one. It reads what the partner
 * publishes and updates COP from it, so a home that disappears from their side
 * simply stops being seen — nothing compares our live set against theirs to
 * ask what is missing. The standing rule had already named the trap: "Is this
 * listing still for sale? → the partner's own site. Our status is a cache of
 * it." It was a cache with no invalidation.
 *
 * Reading the page is the point, not pinging it. MYNE's withdrawn listing
 * still answers HTTP 200; the words "This property is no longer available"
 * are in the body. Any check that asks only whether the URL resolves passes
 * it. The marker is in the server-rendered HTML — confirmed because WebFetch,
 * which does not execute JavaScript, can see it while the same tool sees only
 * the pre-JS shell of /listings — so a plain server-side fetch is enough and
 * no browser is needed.
 *
 * Rotation, not a sweep: the least-recently-verified rows go first, so ~270
 * live listings cycle in about a week at the default batch size. That honours
 * the operating plan's rule that a listing unchecked for 14 days is stale,
 * without a long-running job or a burst of outbound requests.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isCronRequest } from '@/lib/cronAuth';
import { heartbeatHandler } from '@/lib/cronHeartbeat';

const BATCH = 50;          // 294 live listings ÷ 50 ≈ a 6-day cycle, inside the
                           // operating plan's "stale after 14 days" rule with room to spare
const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 9000;

/**
 * An auto-hide is a listing removed from a live sales site, so the bar is an
 * unambiguous phrase on a 200 response. Everything else is flagged for a human.
 *
 * Only MYNE's wording is known. Other partners get 404 detection and nothing
 * more: inventing a marker we have never seen would either never fire or fire
 * on the wrong thing, and the second is much worse than the first.
 */
const GONE_MARKERS = {
  myne: [
    'no longer available',
    'already found its co-owners',
    'nicht mehr verfügbar',
    'nicht mehr verfuegbar',
  ],
};

/**
 * Abitaro is a JavaScript single-page app: every path on ownabitaro.com answers
 * 200 with the same pre-JS shell, so reading the page can never tell us whether
 * a residence is still for sale. Text matching would return "ok" forever, which
 * is worse than not checking — it would look like coverage.
 *
 * They do publish the catalogue their own site reads from, so we ask that
 * instead: two requests per run, and absence from it is the withdrawal signal.
 * Sold residences drop out of this endpoint while coming_soon ones stay in, so
 * "not in the catalogue" means withdrawn or sold — the same class of evidence
 * as MYNE's "no longer available", and it still sits behind the circuit breaker
 * below, because a slug they rename would look identical to one they pulled.
 */
const ABITARO_CATALOGUE = 'https://phplaravel-1627241-6429789.cloudwaysapps.com/api/public/properties';
const ABITARO_MAX_PAGES = 6;

/** More than this many hits in one run means their site changed, not our stock. */
const AUTO_HIDE_CIRCUIT_BREAKER = 5;

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Identify ourselves rather than impersonating a browser: this is a
        // partner checking a partner's public page, not a scraper hiding.
        'User-Agent': 'COP-supply-check/1.0 (+https://co-ownership-property.com)',
        'Accept': 'text/html',
      },
    });
    const body = res.ok ? await res.text() : '';
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, body: '', error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'COP-supply-check/1.0 (+https://co-ownership-property.com)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns slug -> { status, shares }, or null if we could not read the whole
 * catalogue. Null matters: a half-read catalogue would make every residence we
 * did not reach look withdrawn, so any failure has to fall back to "we do not
 * know" rather than to a takedown.
 */
async function loadAbitaroCatalogue() {
  const out = new Map();
  for (let page = 1; page <= ABITARO_MAX_PAGES; page += 1) {
    /* eslint-disable no-await-in-loop */
    const body = await fetchJson(`${ABITARO_CATALOGUE}?page=${page}`);
    /* eslint-enable no-await-in-loop */
    if (!body || !Array.isArray(body.data)) return null;
    for (const p of body.data) {
      if (p && p.slug) out.set(p.slug, { status: p.status, shares: Number(p.available_shares_count ?? 0) });
    }
    if (!body.meta || body.meta.current_page >= body.meta.last_page) break;
  }
  return out.size ? out : null;
}

function classifyAbitaro(row, catalogue) {
  const ref = row.partner_ref || '';
  if (!ref.startsWith('abitaro:')) {
    return { state: 'no_url', note: 'no abitaro:<slug> partner_ref to match against their catalogue' };
  }
  const slug = ref.slice('abitaro:'.length);
  const entry = catalogue.get(slug);
  if (!entry) return { state: 'gone', note: `residence "${slug}" is no longer in Abitaro's catalogue` };
  if (entry.status && !['available', 'coming_soon'].includes(entry.status)) {
    return { state: 'gone', note: `Abitaro marks "${slug}" as ${entry.status}` };
  }
  if (entry.status === 'available' && entry.shares === 0) {
    // Not proof: Villa Tovere is "available" with no shares priced yet. Flag it.
    return { state: 'missing', note: `"${slug}" is listed but shows 0 available shares — check whether it has sold out` };
  }
  return { state: 'ok', note: null };
}

function classify(row, page) {
  if (page.status === 404 || page.status === 410) {
    // A 404 is not proof of a sale — partners rename URLs. Flag, never hide.
    return { state: 'missing', note: `partner page returned ${page.status}` };
  }
  if (page.status !== 200) {
    return { state: 'unreachable', note: page.error || `HTTP ${page.status}` };
  }
  const markers = GONE_MARKERS[(row.partner || '').toLowerCase()];
  if (!markers) return { state: 'unknown_partner', note: 'no withdrawal marker known for this partner' };

  // A truncated or error body can contain almost anything; require a real page.
  if (page.body.length < 2000) {
    return { state: 'unreachable', note: `body only ${page.body.length} bytes` };
  }
  const hay = page.body.toLowerCase();
  const hit = markers.find((m) => hay.includes(m));
  return hit
    ? { state: 'gone', note: `partner page says "${hit}"` }
    : { state: 'ok', note: null };
}

async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isCronRequest(req)) return res.status(401).json({ error: 'Unauthorised' });

  const dryRun = req.query.dry === '1';
  const limit = Math.min(parseInt(req.query.limit, 10) || BATCH, 120);
  const db = createSupabaseAdminClient();

  const { data: rows, error } = await db
    .from('properties')
    .select('slug, partner, partner_url, partner_ref, status, last_verified_at')
    .in('status', ['Live', 'for_sale'])
    .order('last_verified_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) return res.status(500).json({ error: error.message });

  const now = new Date().toISOString();
  const results = [];

  // Once per run, not once per row — and only if we actually have Abitaro rows.
  const abitaroCatalogue = rows.some((r) => (r.partner || '').toLowerCase() === 'abitaro')
    ? await loadAbitaroCatalogue()
    : null;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const slice = rows.slice(i, i + CONCURRENCY);
    /* eslint-disable no-await-in-loop */
    await Promise.all(slice.map(async (row) => {
      if ((row.partner || '').toLowerCase() === 'abitaro') {
        if (!abitaroCatalogue) {
          results.push({ slug: row.slug, partner: row.partner, state: 'unreachable', note: 'could not read Abitaro catalogue' });
          return;
        }
        results.push({ slug: row.slug, partner: row.partner, ...classifyAbitaro(row, abitaroCatalogue) });
        return;
      }
      if (!row.partner_url || !/^https?:\/\//.test(row.partner_url)) {
        results.push({ slug: row.slug, state: 'no_url', note: 'no partner_url to check' });
        return;
      }
      const page = await fetchPage(row.partner_url);
      const verdict = classify(row, page);
      results.push({ slug: row.slug, partner: row.partner, ...verdict });
    }));
    /* eslint-enable no-await-in-loop */
  }

  const gone = results.filter((r) => r.state === 'gone');
  const tripped = gone.length > AUTO_HIDE_CIRCUIT_BREAKER;

  if (!dryRun) {
    await Promise.all(results.map((r) => db.from('properties')
      .update({ last_verified_at: now, verify_state: r.state, verify_note: r.note })
      .eq('slug', r.slug)));

    for (const r of gone) {
      // The breaker exists because the failure mode of getting this wrong is
      // pulling sellable homes off the site. One withdrawal a day is ordinary;
      // six at once means their wording changed, and a human should look.
      const hide = !tripped;
      if (hide) await db.from('properties').update({ status: 'hidden' }).eq('slug', r.slug);
      await db.from('listing_changes').insert({
        partner: r.partner, slug: r.slug, change_type: 'removed',
        field: 'status', old_value: 'Live', new_value: hide ? 'hidden' : 'Live',
        applied: hide,
        notes: hide
          ? `verify-supply: ${r.note}. Hidden automatically. Hidden not sold — withdrawn and sold are different and the page does not say which.`
          : `verify-supply: ${r.note}. NOT hidden: ${gone.length} listings matched in one run, over the ${AUTO_HIDE_CIRCUIT_BREAKER} threshold, which looks like a change at the partner rather than our stock. Check before acting.`,
      });
    }

    for (const r of results.filter((x) => ['missing', 'no_url'].includes(x.state))) {
      await db.from('listing_changes').insert({
        partner: r.partner || 'unknown', slug: r.slug, change_type: 'fact',
        field: 'partner_url', old_value: null, new_value: r.state, applied: false,
        notes: `verify-supply: ${r.note}. Flagged, not hidden — a 404 is as likely a renamed URL as a sale.`,
      });
    }
  }

  const tally = results.reduce((a, r) => ({ ...a, [r.state]: (a[r.state] || 0) + 1 }), {});
  console.log(`[verify-supply] checked ${results.length}`, tally, tripped ? 'CIRCUIT BREAKER TRIPPED' : '');

  return res.status(200).json({
    ok: true, dryRun, checked: results.length, tally,
    circuitBreakerTripped: tripped,
    hidden: dryRun || tripped ? [] : gone.map((r) => r.slug),
    needsAttention: results.filter((r) => r.state !== 'ok'),
  });
}

export default heartbeatHandler('verify-supply', handler);
