/**
 * lib/signinToken.js
 *
 * Signed, expiring sign-in links, and the long-lived visitor cookie they mint.
 *
 * Why this exists: a visitor who unlocked a gallery on their laptop had to do
 * it again on their phone, because the only record was localStorage. The
 * `?t=` tokens in our own emails deliberately never confer `validated` —
 * they are plain base64 of a name and an address, forgeable by anyone who
 * looks at one. This is the signed version, and it is the only thing on the
 * site that may say "this person is who they say they are".
 *
 * Two tokens, deliberately different:
 *
 *   SIGN-IN LINK   payload.hmac, 30-minute expiry, purpose 'signin'.
 *                  Emailed to the address itself and nowhere else.
 *   VISITOR COOKIE payload.hmac, 180-day expiry, purpose 'visitor'.
 *                  httpOnly, set only after a link is verified.
 *
 * The purpose is inside the signed payload, so an unsubscribe token cannot be
 * replayed as a sign-in and a sign-in link cannot be pasted in as a cookie.
 *
 * The link is not single-use — that would need a store of spent tokens, and a
 * thirty-minute window on an unguessable token sent only to the address it
 * signs in is the usual trade. If we ever need single use, add a `jti` to the
 * payload and a small table; nothing else has to change.
 *
 * Server-side only (Node crypto).
 */
import crypto from 'crypto';

const BASE_URL = 'https://co-ownership-property.com';

export const VISITOR_COOKIE = 'cop_visitor';
export const LINK_TTL_MS    = 30 * 60 * 1000;          // 30 minutes
export const COOKIE_TTL_MS  = 180 * 24 * 3600 * 1000;  // 180 days

/** Signing key. Reuses the secrets that already exist in Vercel rather than
 *  adding another one nobody remembers to set. CRM_SECRET is in the list
 *  because the cron routes accept it as the alternative to CRON_SECRET, so it
 *  is the one most likely to actually be set — on 21 Sep 2026 the admin
 *  gallery preview died with "No signing secret configured" in production. */
function secret() {
  return process.env.SIGNIN_SECRET || process.env.UNSUB_SECRET || process.env.CRON_SECRET || process.env.CRM_SECRET || '';
}

/** Every secret a presented token may have been signed with, preferred first. */
function acceptedSecrets() {
  const out = [];
  for (const s of [process.env.SIGNIN_SECRET, process.env.UNSUB_SECRET, process.env.CRON_SECRET, process.env.CRM_SECRET]) {
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

const b64u  = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

function hmac(payload, key) {
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Mint a token. `purpose` is signed, so tokens cannot cross purposes. */
export function signToken({ email, name = '', purpose, ttlMs }) {
  const key = secret();
  if (!key) throw new Error('No signing secret configured');
  const body = b64u(JSON.stringify({
    e: normalizeEmail(email),
    n: String(name || '').slice(0, 80),
    p: purpose,
    x: Date.now() + ttlMs,
  }));
  return `${body}.${hmac(body, key)}`;
}

/**
 * Verify a token for one purpose. Returns { email, name } or null — null for
 * a bad signature, a wrong purpose, an expired token or anything malformed.
 * Never throws, never explains which of those it was.
 */
export function verifyToken(token, purpose) {
  try {
    const [body, mac] = String(token || '').split('.');
    if (!body || !mac) return null;
    const ok = acceptedSecrets().some(k => safeEqual(mac, hmac(body, k)));
    if (!ok) return null;
    const o = JSON.parse(unb64u(body));
    if (!o || o.p !== purpose || !o.e) return null;
    if (!Number.isFinite(o.x) || Date.now() > o.x) return null;
    return { email: normalizeEmail(o.e), name: o.n || '' };
  } catch (e) {
    return null;
  }
}

export function signinToken(email, name) {
  return signToken({ email, name, purpose: 'signin', ttlMs: LINK_TTL_MS });
}

export function signinUrl(email, name, next) {
  const q = new URLSearchParams({ k: signinToken(email, name) });
  if (next && String(next).startsWith('/')) q.set('next', next);
  return `${BASE_URL}/signin/?${q.toString()}`;
}

export function visitorToken(email, name) {
  return signToken({ email, name, purpose: 'visitor', ttlMs: COOKIE_TTL_MS });
}

export function readVisitorCookie(req) {
  const raw = req && req.cookies ? req.cookies[VISITOR_COOKIE] : null;
  return raw ? verifyToken(raw, 'visitor') : null;
}

/** The Set-Cookie value for a verified visitor. httpOnly: nothing in the
 *  browser needs to read it, and plenty out there would like to. */
export function visitorCookieHeader(email, name) {
  const maxAge = Math.floor(COOKIE_TTL_MS / 1000);
  return `${VISITOR_COOKIE}=${visitorToken(email, name)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearVisitorCookieHeader() {
  return `${VISITOR_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
