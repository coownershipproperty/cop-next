/**
 * lib/unsub.js
 *
 * Tokenised unsubscribe links — the one place that knows how they are built,
 * so every email footer and the /api/unsubscribe validator always agree.
 *
 * Link format:  https://co-ownership-property.com/unsubscribe/?e={email}&t={token}
 * Token:        HMAC-SHA256(lowercased trimmed email) as hex, keyed with
 *               UNSUB_SECRET (falls back to CRON_SECRET, which is already set
 *               in Vercel). The token stops anyone unsubscribing an address
 *               that didn't come from their own email — /api/unsubscribe
 *               refuses to write a suppression without a valid token.
 *
 * NOTE ON SECRETS: new links are always signed with the *preferred* secret
 * (UNSUB_SECRET when set, else CRON_SECRET). Verification, however, accepts a
 * token signed with EITHER secret. That asymmetry is deliberate: every link in
 * already-delivered mail was signed with CRON_SECRET, so introducing
 * UNSUB_SECRET for the first time would otherwise silently break one-click
 * unsubscribe for every recipient who still has an old email in their inbox —
 * exactly the people most likely to click it. Accepting both keeps those links
 * working while new mail moves onto the dedicated secret.
 *
 * Rotating UNSUB_SECRET *away* from a value that has been used in the wild
 * still invalidates the links signed with it (those recipients fall back to the
 * polite mailto on /unsubscribe). So: set it once, and leave it alone.
 *
 * Server-side only (Node crypto) — import from API routes / email builders,
 * never from client components.
 */
import crypto from 'crypto';

const BASE_URL = 'https://co-ownership-property.com';

/** The secret new tokens are signed with. */
function unsubSecret() {
  return process.env.UNSUB_SECRET || process.env.CRON_SECRET || '';
}

/**
 * Every secret a presented token is allowed to have been signed with, most
 * preferred first. De-duplicated so the common case (only CRON_SECRET set, or
 * both set to the same value) does exactly one comparison.
 */
function acceptedSecrets() {
  const out = [];
  for (const s of [process.env.UNSUB_SECRET, process.env.CRON_SECRET]) {
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/** Timing-safe hex-digest comparison that tolerates length mismatch. */
function safeEqual(presented, expected) {
  const a = Buffer.from(String(presented), 'utf8');
  const b = Buffer.from(String(expected), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Canonical form of an address — the form that is signed and stored. */
export function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

/** HMAC token for an address. Returns '' when no secret is configured. */
export function unsubToken(email) {
  const secret = unsubSecret();
  if (!secret) {
    console.error('[unsub] Neither UNSUB_SECRET nor CRON_SECRET is set — unsubscribe links will be tokenless');
    return '';
  }
  return crypto.createHmac('sha256', secret).update(normalizeEmail(email)).digest('hex');
}

/**
 * Constant-time check of a presented token. Accepts a token signed with ANY
 * configured secret (see the note at the top of this file) so that introducing
 * UNSUB_SECRET never invalidates the links already sitting in people's inboxes.
 */
export function verifyUnsubToken(email, token) {
  if (!token) return false;
  const secrets = acceptedSecrets();
  if (!secrets.length) return false;
  const clean = normalizeEmail(email);
  // Every candidate is checked — no early return — so the work done does not
  // depend on which secret matched.
  let ok = false;
  for (const secret of secrets) {
    const expected = crypto.createHmac('sha256', secret).update(clean).digest('hex');
    if (safeEqual(token, expected)) ok = true;
  }
  return ok;
}

/** Absolute unsubscribe URL for an email footer. */
export function unsubUrl(email) {
  const clean = normalizeEmail(email);
  const token = unsubToken(clean);
  return `${BASE_URL}/unsubscribe/?e=${encodeURIComponent(clean)}${token ? `&t=${token}` : ''}`;
}

/**
 * A placeholder for the unsubscribe URL, resolved at send time.
 *
 * The token is per-recipient and needs a secret that only exists in the server
 * environment, so a campaign staged straight into `email_queue` — by SQL, by a
 * one-off script, or by admin tooling that never sees process.env — cannot build
 * the real link at the moment the row is written. Those rows put this literal
 * string in their `html` instead, and every path that sends a queued row swaps it
 * for the recipient's real URL on the way out.
 *
 * Without this, a bulk campaign staged outside the app has only two options: a
 * tokenless link (which /api/unsubscribe correctly refuses, dead-ending the
 * recipient on a mailto) or no link at all. Both are the exact failure the
 * tokenised-unsubscribe work was done to end.
 */
export const UNSUB_PLACEHOLDER = '{{UNSUB_URL}}';

/**
 * Swap {{UNSUB_URL}} for the recipient's real unsubscribe URL.
 *
 * A no-op for html that doesn't contain the placeholder, which is every email
 * built by queueEmail() — those already have a real link rendered into their
 * template. Safe to call on any queued row unconditionally.
 */
export function resolveUnsubPlaceholder(html, email) {
  const body = String(html ?? '');
  if (!body.includes(UNSUB_PLACEHOLDER)) return body;
  // split/join rather than String.replace: replace() with a string pattern swaps
  // only the FIRST occurrence, and one link in the body plus one in the footer is
  // an ordinary shape for a campaign email.
  return body.split(UNSUB_PLACEHOLDER).join(unsubUrl(email));
}
