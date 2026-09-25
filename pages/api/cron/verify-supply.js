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

// 25 Pacaso pages at a 4s pace is ~2 minutes on their own; give the run room.
export const maxDuration = 300;

const BATCH = 50;          // 294 live listings ÷ 50 ≈ a 6-day cycle, inside the
                           // operating plan's "stale after 14 days" rule with room to spare
const CONCURRENCY = 8;
const PACASO_PER_RUN = 25;   // pacaso.com's WAF challenges an IP after ~90 pages in a few minutes
const PACASO_PAUSE_MS = 4000;
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
  if (page.status === 202 && page.body.length < 5000) {
    // AWS WAF in front of pacaso.com answers a bot challenge with an empty
    // 202 once an IP asks for too many pages in a few minutes (seen 19 Sep
    // 2026 after ~90 requests). Not a verdict on the listing; try later.
    return { state: 'unreachable', note: 'rate-limited (WAF challenge 202)' };
  }
  if (page.status !== 200) {
    return { state: 'unreachable', note: page.error || `HTTP ${page.status}` };
  }
  if ((row.partner || '').toLowerCase() === 'pacaso') {
    // Structured, not textual: Pacaso keeps sold pages up (200, same layout),
    // so "still for sale" is listingStage + sharesAvailable in the SSR data.
    // Sold-out homes carry a WAITLIST tag and an "(estimated)" resale price —
    // that is not inventory, so they stay sold.
    const seen = readPacaso(page.body);
    // OFF_MARKET pages keep the layout but drop the price block entirely —
    // four of them were Live on COP on 19 Sep 2026. Withdrawn, not sold.
    if (/"listingStage":"OFF_MARKET"/.test(page.body)) {
      return { state: 'gone', note: 'Pacaso page: listingStage OFF_MARKET' };
    }
    if (!seen) return { state: 'unreachable', note: 'no listing data in page' };
    // Stages seen across all 200 Pacaso pages on 19 Sep 2026: PACASO_SOLD
    // (sold out, waitlist), PACASO_RESALE (owners reselling, 1-7 shares),
    // PACASO_LISTING (Pacaso's own inventory), PRE_PACASO (not yet bought by
    // Pacaso; sharesAvailable is 0/absent but the home is very much for sale)
    // and COMING_SOON. So "0 shares" alone is not sold — Florence is
    // PRE_PACASO with 0 and is Live. Sold is the sold stage, or a resale
    // with nothing left.
    if (seen.stage === 'PACASO_SOLD' || (seen.stage === 'PACASO_RESALE' && seen.shares === 0)) {
      return { state: 'sold', note: `Pacaso page: ${seen.stage || 'no stage'}, ${seen.shares ?? '?'} shares available${seen.tag ? `, ${seen.tag}` : ''}` };
    }
    return { state: 'ok', note: null };
  }
  if ((row.partner || '').toLowerCase() === 'myne') {
    // 25 Sep 2026: every MYNE page carries the site's whole UI dictionary,
    // including "This property is no longer available" and the sold banner,
    // so the text markers matched on EVERY listing and the circuit breaker
    // tripped every run — which also blocked genuine Pacaso sold-outs, since
    // the breaker counts both. Read the listing's own data instead: a live
    // page carries the property object with "marketStatus"; a withdrawn page
    // (~240 KB, no property data) does not.
    const seen = readMyne(row.partner_url, page.body);
    if (seen.marketStatus === 'on-market') return { state: 'ok', note: null };
    if (seen.marketStatus) return { state: 'gone', note: `MYNE page: marketStatus ${seen.marketStatus}` };
    if (seen.slugFound === false && page.body.length > 100000) {
      return { state: 'gone', note: 'MYNE page has no listing data for this slug (withdrawn page)' };
    }
    return { state: 'unreachable', note: 'could not read MYNE listing data' };
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

/**
 * MYNE pages embed the listing and several "related" listings, so the first
 * marketStatus on the page is not necessarily ours. The main listing's data
 * follows its own defaultFullSlug; take the first marketStatus after it.
 */
function readMyne(url, body) {
  const slug = String(url || '').replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
  const at = slug ? body.indexOf(`defaultFullSlug\\":\\"listings/${slug}`) : -1;
  if (at < 0) return { slugFound: null, marketStatus: null };
  const rest = body.slice(at);
  const m = rest.match(/marketStatus\\":\\"([a-z-]+)/);
  // Withdrawn pages still name the slug in their metadata but carry no
  // property object, so no marketStatus follows it.
  return { slugFound: !!m, marketStatus: m ? m[1] : null };
}

/**
 * Pacaso server-renders the listing's own data into the HTML, so the page we
 * already fetch to ask "is it still for sale?" also answers "at what price?".
 * We never asked. On 19 Sep 2026 Jane Healey enquired on Rue du Bac at the
 * $600,000 our row had carried since 18 April; Pacaso had relisted the last
 * two shares as owner resales at $729,000 on 31 August. listing_changes had
 * 68 Pacaso rows, every one of them a status — not a single price, ever.
 *
 * Read only what is unambiguous: the share price and shares-available fields
 * of the listing object. Anything else (activity tags, resale flags) is
 * reported in the note for a human, not acted on.
 */
function readPacaso(body) {
  const price = body.match(/"sharePrice":(\d{4,9})\b/);
  const shares = body.match(/"sharesAvailable":(\d{1,2})\b/);
  const tag = body.match(/"primaryActivityTag":\{"key":"([A-Z_]+)"/);
  const stage = body.match(/"listingStage":"([A-Z_]+)"/);
  if (!price) return null;
  return {
    price: Number(price[1]),
    shares: shares ? Number(shares[1]) : null,
    tag: tag ? tag[1] : null,
    stage: stage ? stage[1] : null,
  };
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
    .select('slug, partner, partner_url, partner_ref, status, price, last_verified_at')
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

  // Pacaso sits behind a rate-based WAF rule; fetch those one at a time with a
  // pause, everything else in parallel as before.
  const isPacaso = (r) => (r.partner || '').toLowerCase() === 'pacaso';
  // Pacaso gets its own oldest-first batch rather than whatever share of the
  // mixed batch it happens to have, so every live Pacaso home is read every
  // day across the morning runs (David, 25 Sep 2026: "we need to check the
  // figures every day").
  const { data: pacasoOwn } = await db
    .from('properties')
    .select('slug, partner, partner_url, partner_ref, status, price, last_verified_at')
    .in('status', ['Live', 'for_sale'])
    .eq('partner', 'pacaso')
    .order('last_verified_at', { ascending: true, nullsFirst: true })
    .limit(PACASO_PER_RUN);
  const pacasoRows = pacasoOwn || rows.filter(isPacaso).slice(0, PACASO_PER_RUN);
  const otherRows = rows.filter((r) => !isPacaso(r));
  for (const row of pacasoRows) {
    /* eslint-disable no-await-in-loop */
    const page = await fetchPage(row.partner_url);
    const verdict = classify(row, page);
    if (page.status === 200) {
      const seen = readPacaso(page.body);
      if (seen) {
        verdict.pacaso = seen;
        if (verdict.state === 'ok' && Number(row.price) !== seen.price) {
          verdict.priceChange = { from: Number(row.price), to: seen.price };
          verdict.note = [verdict.note, `price ${row.price} -> ${seen.price}${seen.tag ? ` (${seen.tag})` : ''}`].filter(Boolean).join('; ');
        }
      }
    }
    results.push({ slug: row.slug, partner: row.partner, partner_url: row.partner_url, ...verdict });
    await new Promise((res) => setTimeout(res, PACASO_PAUSE_MS));
    /* eslint-enable no-await-in-loop */
  }

  for (let i = 0; i < otherRows.length; i += CONCURRENCY) {
    const slice = otherRows.slice(i, i + CONCURRENCY);
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
  const sold = results.filter((r) => r.state === 'sold');
  const tripped = (gone.length + sold.length) > AUTO_HIDE_CIRCUIT_BREAKER;

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

    for (const r of sold) {
      // Pacaso says sold out. 'sold' not 'hidden': the site shows sold homes
      // with a badge, and the Pacaso sold sweep has always used this status.
      const apply = !tripped;
      if (apply) await db.from('properties').update({ status: 'sold' }).eq('slug', r.slug);
      await db.from('listing_changes').insert({
        partner: r.partner, slug: r.slug, change_type: 'removed',
        field: 'status', old_value: 'Live', new_value: apply ? 'sold' : 'Live',
        applied: apply,
        notes: apply
          ? `verify-supply: ${r.note}. Marked sold automatically.`
          : `verify-supply: ${r.note}. NOT changed: ${gone.length + sold.length} takedowns in one run, over the ${AUTO_HIDE_CIRCUIT_BREAKER} threshold. Check before acting.`,
      });
    }

    for (const r of results.filter((x) => x.priceChange && x.state === 'ok')) {
      // A price read off the partner's own page is the source of truth for
      // the row (cop-business register: "What does this home cost? →
      // the partner's own site; our price is a cache of it").
      await db.from('properties').update({ price: r.priceChange.to }).eq('slug', r.slug);
      await db.from('property_facts')
        .update({ share_price: r.priceChange.to, shares_remaining: r.pacaso.shares, listing_stage: r.pacaso.stage, availability_checked_at: now, last_verified_at: now, source: r.partner_url })
        .eq('slug', r.slug);
      await db.from('listing_changes').insert({
        partner: r.partner, slug: r.slug, change_type: 'price',
        field: 'price', old_value: String(r.priceChange.from), new_value: String(r.priceChange.to),
        applied: true,
        notes: `verify-supply: read from the Pacaso listing page${r.pacaso.tag ? ` (${r.pacaso.tag}` : ''}${r.pacaso.shares != null ? `${r.pacaso.tag ? ', ' : ' ('}${r.pacaso.shares} shares available)` : (r.pacaso.tag ? ')' : '')}.`,
      });
    }
    for (const r of results.filter((x) => x.pacaso && !x.priceChange)) {
      await db.from('property_facts')
        .update({ ...(r.pacaso.shares != null ? { shares_remaining: r.pacaso.shares } : {}), listing_stage: r.pacaso.stage, availability_checked_at: now, last_verified_at: now })
        .eq('slug', r.slug);
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
    markedSold: dryRun || tripped ? [] : sold.map((r) => r.slug),
    priceChanges: results.filter((r) => r.priceChange).map((r) => ({ slug: r.slug, ...r.priceChange })),
    needsAttention: results.filter((r) => r.state !== 'ok'),
  });
}

export default heartbeatHandler('verify-supply', handler);
