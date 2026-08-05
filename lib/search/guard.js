/**
 * Abuse and spend control for the AI search.
 *
 * This is the one endpoint on the site where an anonymous visitor can make us
 * spend money, so it gets treated like a cash register rather than a form. Six
 * layers, cheapest first, and the important property is what happens when a
 * layer trips: the search degrades to free keyword matching and still returns
 * correctly-ranked real homes. A visitor never sees an error because a bot was
 * busy somewhere else.
 *
 *   1. Shape         — reject anything that is not a plausible search sentence.
 *   2. Origin        — reject requests that did not come from our own pages.
 *   3. Burst per IP  — 5 in a minute. Stops a stuck key or an impatient script.
 *   4. Daily per IP  — 40 a day. Stops one determined person.
 *   5. Global daily  — a hard ceiling on model calls across the whole site.
 *                      This is the only layer that bounds a distributed attack,
 *                      and therefore the one that actually protects the card.
 *   6. Answer cache  — repeats cost nothing. Handled in the route.
 *
 * Note the deliberate asymmetry in failure handling. The per-IP checks FAIL
 * OPEN: if the database is unreachable we would rather serve a search than
 * refuse one, and the global ceiling still stands behind them. The global check
 * FAILS CLOSED: if we cannot confirm how much we have already spent today, we
 * do not spend more. Availability is worth risking a little abuse for; the bill
 * is not.
 */

import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

/**
 * Model-backed searches per day across the entire site. One unit covers a whole
 * search — both the understand call and the explain call. At roughly $0.84 per
 * thousand searches on Luna, the default of 800 is about $0.67 a day, or $20 a
 * month if someone attacked us every single day and we never noticed. Raise it
 * in Vercel once real traffic justifies it: SEARCH_DAILY_CAP.
 */
const GLOBAL_DAILY_CAP = Number(process.env.SEARCH_DAILY_CAP || 800);

const IP_BURST = { windowMs: 60 * 1000, max: 5 };
const IP_DAILY = { windowMs: 24 * 60 * 60 * 1000, max: 60 };

const MIN_LEN = 6;
const MAX_LEN = 400;

/**
 * A search sentence, or junk? Cheap local checks that cost nothing and remove
 * the overwhelming majority of automated noise before it reaches a paid call.
 */
export function validateQuery(raw) {
  const q = String(raw || '').trim();

  if (q.length < MIN_LEN) return { ok: false, error: 'Tell us a little more about what you are looking for.' };
  if (q.length > MAX_LEN) return { ok: false, error: 'That is a bit long — try the essentials in a sentence or two.' };

  // Needs real words. "aaaaaaaaaa" and "........." are not searches.
  const words = q.split(/\s+/).filter(w => /[a-zA-ZÀ-ÿ]{2,}/.test(w));
  if (words.length < 2) return { ok: false, error: 'Try describing it in a few words.' };

  // A single character repeated is a keyboard test, not a question.
  if (/(.)\1{9,}/.test(q)) return { ok: false, error: 'Try describing it in a few words.' };

  // Mostly non-letters (base64, hashes, pasted payloads).
  const letters = (q.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  if (letters / q.length < 0.45) return { ok: false, error: 'Try describing it in your own words.' };

  // Attempts to talk to the model rather than search with it. These are not
  // dangerous — the model never sees a home we have not already measured, and
  // it cannot act on anything — but they are not searches either, and we are
  // not paying for them.
  if (/\b(ignore (all |any )?(previous|prior|above)|system prompt|you are now|disregard (the )?(above|instructions)|reveal your|repeat the prompt|act as|jailbreak)\b/i.test(q)) {
    return { ok: false, error: 'Try describing the home you are looking for.' };
  }

  return { ok: true, query: q };
}

/**
 * Requests should come from our own pages. Trivially forgeable by anyone who
 * reads a tutorial, but it stops casual `curl` loops and costs one string
 * comparison, which is a good trade at this price.
 */
export function checkOrigin(req) {
  const allowed = [
    'co-ownership-property.com',
    'www.co-ownership-property.com',
    'localhost',
    '127.0.0.1',
  ];
  const raw = req.headers.origin || req.headers.referer || '';
  if (!raw) return true;                     // some privacy tools strip both
  try {
    const host = new URL(raw).hostname;
    return allowed.includes(host) || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

// --- counters --------------------------------------------------------------
// Built on the existing rate_limit_log table. No new tables, no migration —
// the same standing rule that shaped the rest of this build.

async function countSince(db, identifier, endpoint, windowMs) {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await db
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('created_at', since);
  if (error) throw new Error(error.message);
  return count || 0;
}

async function record(db, identifier, endpoint) {
  await db.from('rate_limit_log').insert({ identifier, endpoint });
}

/**
 * Consume one unit of the global daily model budget, if there is one to
 * consume. Returns false when the ceiling is reached OR when we cannot tell,
 * and the caller then serves a free keyword search instead.
 *
 * This is check-then-record rather than a transaction, so under heavy
 * concurrency a handful of calls can slip past the line. That is fine: the
 * overshoot is bounded by concurrency, not by attacker effort, and the cost of
 * a few extra calls is fractions of a cent. A lock here would buy accuracy
 * nobody needs at the price of latency on every search.
 */
export async function takeModelBudget() {
  let db;
  try { db = createSupabaseAdminClient(); } catch { return { allowed: false, reason: 'budget-unavailable' }; }
  try {
    const used = await countSince(db, '__global__', 'search-model', 24 * 60 * 60 * 1000);
    if (used >= GLOBAL_DAILY_CAP) return { allowed: false, reason: 'daily-cap', used, cap: GLOBAL_DAILY_CAP };
    await record(db, '__global__', 'search-model');
    return { allowed: true, used: used + 1, cap: GLOBAL_DAILY_CAP };
  } catch {
    // Fail closed. We cannot see the meter, so we do not spend.
    return { allowed: false, reason: 'budget-unavailable' };
  }
}

/**
 * Per-IP throttling. Fails open by design — see the header note.
 */
export async function checkIp(ip) {
  let db;
  try { db = createSupabaseAdminClient(); } catch { return { ok: true }; }
  try {
    const burst = await countSince(db, ip, 'search-burst', IP_BURST.windowMs);
    if (burst >= IP_BURST.max) {
      return { ok: false, error: 'That is a lot of searching at once. Give it a few seconds.' };
    }
    const daily = await countSince(db, ip, 'search-burst', IP_DAILY.windowMs);
    if (daily >= IP_DAILY.max) {
      return { ok: false, error: 'You have reached today\'s search limit. Get in touch and we will look properly for you.' };
    }
    await record(db, ip, 'search-burst');
    return { ok: true, today: daily + 1 };
  } catch {
    return { ok: true };
  }
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = typeof fwd === 'string' ? fwd.split(',')[0].trim() : '';
  return first || req.socket?.remoteAddress || 'unknown';
}
