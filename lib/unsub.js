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
 * NOTE: rotating the secret invalidates the links in every already-sent email
 * (those recipients get the polite mailto fallback on /unsubscribe instead of
 * one-click). Pick the secret once, before the sequences go live, and leave
 * it alone.
 *
 * Server-side only (Node crypto) — import from API routes / email builders,
 * never from client components.
 */
import crypto from 'crypto';

const BASE_URL = 'https://co-ownership-property.com';

function unsubSecret() {
  return process.env.UNSUB_SECRET || process.env.CRON_SECRET || '';
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

/** Constant-time check of a presented token against the expected one. */
export function verifyUnsubToken(email, token) {
  const expected = unsubToken(email);
  if (!expected || !token) return false;
  const a = Buffer.from(String(token), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Absolute unsubscribe URL for an email footer. */
export function unsubUrl(email) {
  const clean = normalizeEmail(email);
  const token = unsubToken(clean);
  return `${BASE_URL}/unsubscribe/?e=${encodeURIComponent(clean)}${token ? `&t=${token}` : ''}`;
}
