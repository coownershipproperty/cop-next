// Daily auto-rotation for the homepage "Explore Our Properties" carousel.
//
// No hand-curation needed: every morning the lineup rebuilds itself from live
// signals and writes the result to the `featured_properties` table (which the
// homepage already reads via lib/featured-properties.js):
//
//   · TRENDING  — homes with real buyer enquiries in the last 30 days
//                 (every enquiry and gallery request creates a lead row, so
//                 `leads` is the single source of interest). Last-7-day
//                 enquiries weigh 3×, so the mix follows what's hot *now*.
//   · NEW       — homes added in the last NEW_WINDOW_DAYS, newest first, so
//                 fresh inventory always gets homepage exposure from day one.
//   · DISCOVERY — a rotating, seeded-random pick from the rest of the live
//                 catalogue, so every home occasionally gets its moment and
//                 generates fresh signal of its own.
//
// The selection is DETERMINISTIC per calendar date (seeded PRNG from the date
// string): running the cron twice on the same day produces the same lineup,
// but every new day genuinely reshuffles. Sold / hidden homes can never
// appear — only status Live / for_sale is considered.

const TARGET_SIZE = 24; // total carousel cards
const TRENDING_SLOTS = 12;
const NEW_SLOTS = 6; // discovery fills whatever remains
const NEW_WINDOW_DAYS = 21;
const TRENDING_POOL = 18; // sample the 12 from the top 18 → daily variety
const ALWAYS_TOP = 3; // the 3 hottest homes are always in, no matter the seed
const COUNTRY_CAP = 8; // max cards per country across the whole lineup

/* ── deterministic PRNG ──────────────────────────────────────────────────── */

function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted sample without replacement. items: [{...,_w}] */
function weightedSample(items, count, rand) {
  const pool = [...items];
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((s, it) => s + it._w, 0);
    let r = rand() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx]._w;
      if (r <= 0) break;
    }
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function seededShuffle(items, rand) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── selection ───────────────────────────────────────────────────────────── */

/**
 * Compute today's carousel lineup.
 *
 * @param {object} db     — a Supabase client (service role or anon with read)
 * @param {string} dateStr — 'YYYY-MM-DD'; the daily seed
 * @returns {Promise<Array<{slug:string, reason:string}>>} ordered lineup
 */
export async function computeFeaturedLineup(db, dateStr) {
  const rand = mulberry32(hashStr('cop-featured-' + dateStr));

  const [{ data: props, error: pErr }, { data: leads, error: lErr }] =
    await Promise.all([
      db
        .from('properties')
        .select('slug,country,date_added')
        .in('status', ['Live', 'for_sale']),
      db
        .from('leads')
        .select('property_slug,created_at')
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 864e5).toISOString()
        )
        .is('merged_into_lead_id', null),
    ]);
  if (pErr) throw pErr;
  if (lErr) throw lErr;

  const live = props || [];
  const liveBySlug = new Map(live.map((p) => [p.slug, p]));

  // Interest per slug: 7-day and 30-day lead counts (live homes only).
  const cutoff7 = Date.now() - 7 * 864e5;
  const stats = new Map(); // slug → {l7, l30}
  for (const l of leads || []) {
    if (!l.property_slug || !liveBySlug.has(l.property_slug)) continue;
    const s = stats.get(l.property_slug) || { l7: 0, l30: 0 };
    s.l30 += 1;
    if (new Date(l.created_at).getTime() >= cutoff7) s.l7 += 1;
    stats.set(l.property_slug, s);
  }

  const chosen = []; // [{slug, reason, country}]
  const chosenSet = new Set();
  const countryCount = {};
  const fits = (p) =>
    !chosenSet.has(p.slug) &&
    (countryCount[p.country || '?'] || 0) < COUNTRY_CAP;
  const take = (p, reason) => {
    chosen.push({ slug: p.slug, reason, country: p.country });
    chosenSet.add(p.slug);
    countryCount[p.country || '?'] =
      (countryCount[p.country || '?'] || 0) + 1;
  };

  /* 1 · TRENDING — weighted daily sample from the hottest pool */
  const scored = live
    .map((p) => {
      const s = stats.get(p.slug) || { l7: 0, l30: 0 };
      return { ...p, _score: 3 * s.l7 + s.l30 };
    })
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score);

  const pool = scored.slice(0, TRENDING_POOL);
  const locked = pool.slice(0, ALWAYS_TOP);
  const sampled = weightedSample(
    pool.slice(ALWAYS_TOP).map((p) => ({ ...p, _w: p._score })),
    Math.max(0, TRENDING_SLOTS - locked.length),
    rand
  );
  const trending = [...locked, ...sampled].sort(
    (a, b) => b._score - a._score
  );
  for (const p of trending) {
    if (fits(p)) take(p, 'trending — recent buyer interest');
  }

  /* 2 · NEW — newest additions inside the window */
  const cutoffNew = Date.now() - NEW_WINDOW_DAYS * 864e5;
  const fresh = live
    .filter((p) => p.date_added && new Date(p.date_added).getTime() >= cutoffNew)
    .sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  let newTaken = 0;
  for (const p of fresh) {
    if (newTaken >= NEW_SLOTS) break;
    if (fits(p)) {
      take(p, `new — added ${String(p.date_added).slice(0, 10)}`);
      newTaken++;
    }
  }

  /* 3 · DISCOVERY — seeded rotation through the rest of the catalogue */
  const rest = seededShuffle(
    live.filter((p) => !chosenSet.has(p.slug)),
    rand
  );
  for (const p of rest) {
    if (chosen.length >= TARGET_SIZE) break;
    if (fits(p)) take(p, 'discovery — daily rotation');
  }

  /* 4 · ORDER — weave so the first screens mix hot, new and fresh faces:
     T T N T D T N T D …, then whatever remains in group order. */
  const groups = {
    t: chosen.filter((c) => c.reason.startsWith('trending')),
    n: chosen.filter((c) => c.reason.startsWith('new')),
    d: chosen.filter((c) => c.reason.startsWith('discovery')),
  };
  const pattern = ['t', 't', 'n', 't', 'd'];
  const woven = [];
  let i = 0;
  while (woven.length < chosen.length) {
    const g = groups[pattern[i % pattern.length]];
    i++;
    const next = g.shift();
    if (next) woven.push(next);
    else if (!groups.t.length && !groups.n.length && !groups.d.length) break;
  }

  return woven.map(({ slug, reason }) => ({ slug, reason }));
}
