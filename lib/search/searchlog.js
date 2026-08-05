/**
 * Search visibility. Two kinds of row go into `search_log`:
 *
 *   'search'    — every question a visitor asks, verbatim, with what we
 *                 understood and what we showed them.
 *   'identify'  — written when a browser that has been searching later submits
 *                 a form with an email address. The shared visitor_id is what
 *                 joins the two, so after an enquiry arrives you can read back
 *                 everything that lead asked before they put their name to it.
 *
 * The join key is a first-party cookie (`cop_vid`) set by the search API the
 * first time a browser searches. HttpOnly, so no script can read it; the forms
 * never see it either — their API routes read it server-side from the request,
 * because same-origin POSTs carry cookies automatically.
 *
 * Everything here is deliberately unable to break the feature it observes:
 * every function swallows its own failures. A logging outage costs a row of
 * analytics, never a search and never an enquiry.
 *
 * The table has RLS enabled with no policies, so the public anon key cannot
 * read a single row. Only the service role writes and reads.
 */

import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const COOKIE = 'cop_vid';
const YEAR = 60 * 60 * 24 * 365;

/**
 * The visitor id for this request, minting one if the browser has none yet.
 * Appends the Set-Cookie header itself (preserving any already set) so callers
 * just take the id.
 */
export function visitorId(req, res) {
  const existing = req.cookies?.[COOKIE];
  // Accept only the shape we mint. A cookie is attacker-controlled input, and
  // this string ends up in a database column and in admin reporting.
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

  const fresh = randomUUID();
  if (res && !res.headersSent) {
    const prev = res.getHeader('Set-Cookie');
    const cookie = `${COOKIE}=${fresh}; Path=/; Max-Age=${YEAR}; SameSite=Lax; HttpOnly; Secure`;
    res.setHeader('Set-Cookie', prev ? [].concat(prev, cookie) : cookie);
  }
  return fresh;
}

/** Read-only variant for form endpoints: never mints, never sets a cookie. */
export function existingVisitorId(req) {
  const v = req.cookies?.[COOKIE];
  return v && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
}

/** Record one search. Awaited by the caller (serverless drops stray work after
 * the response), but a failure only costs the log row. */
export async function logSearch(row) {
  try {
    const db = createSupabaseAdminClient();
    await db.from('search_log').insert({ event: 'search', ...row });
  } catch { /* analytics never outranks the feature */ }
}

/**
 * Tie this browser's search history to an email address. Called by the
 * enquiry / gallery / tour endpoints after a real submission. No cookie means
 * the visitor never searched — nothing to link, nothing to write.
 */
export async function identifyVisitor(req, email, source) {
  try {
    const vid = existingVisitorId(req);
    const addr = String(email || '').toLowerCase().trim();
    if (!vid || !addr) return;
    const db = createSupabaseAdminClient();
    await db.from('search_log').insert({ event: 'identify', visitor_id: vid, email: addr, source });
  } catch { /* same rule */ }
}
