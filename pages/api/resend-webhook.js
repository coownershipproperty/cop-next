/**
 * POST /api/resend-webhook
 *
 * Receives Resend webhook events (configured in the Resend dashboard →
 * Webhooks → https://co-ownership-property.com/api/resend-webhook, events
 * `email.bounced` + `email.complained`; the signing secret goes into the
 * RESEND_WEBHOOK_SECRET Vercel env var).
 *
 * Signature verification — Resend delivers through svix. The repo has no
 * svix dependency, so verification is implemented manually per the
 * svix/Resend spec:
 *   signedContent = "{svix-id}.{svix-timestamp}.{rawBody}"
 *   expected      = base64( HMAC-SHA256( base64decode(secret minus "whsec_"),
 *                                        signedContent ) )
 *   The svix-signature header holds space-separated "v1,{sig}" entries
 *   (multiple during secret rotation) — any constant-time match passes.
 *   Timestamps more than 5 minutes off are rejected (replay protection).
 *   The raw body is verified BEFORE parsing, so bodyParser is disabled.
 *
 * What a valid event does, per recipient address:
 *   email.bounced (hard/Permanent only — Transient bounces are ignored):
 *     - suppressions row with reason 'bounced' (upgrading a weaker existing
 *       reason: bounced > complained > unsubscribed — an undeliverable
 *       address is the strongest signal, and /api/unlock-drive keys its
 *       "invalidate the saved user" response on reason='bounced')
 *     - every still-pending email_queue row for the address is cancelled
 *     - best-effort `activities` row on the matching contact so the bounce
 *       is visible in the CRM timeline
 *   email.complained: same, with reason 'complained' (never downgrades an
 *     existing 'bounced').
 *
 * NOTE: there is no email_events table (or any code writing one) in this
 * codebase — the CRM timeline entry above is the event log instead.
 */
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { safeStatusUpdate } from '@/lib/followupSequence';
import { logActivity } from '@/lib/crm';
import { tagContactsUnsubscribed } from '@/lib/suppressions';

export const config = { api: { bodyParser: false } };

const TOLERANCE_SEC = 5 * 60; // max clock skew for svix-timestamp

// Stronger reasons overwrite weaker ones; never the other way round.
const REASON_RANK = { bounced: 3, complained: 2, unsubscribed: 1 };

function getDb() {
  return createSupabaseAdminClient();
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function header(req, name) {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : (v || '');
}

/** Manual svix verification (see file header). Returns true only for a valid,
 *  fresh signature. Any malformed input returns false — never throws. */
function verifySvixSignature({ secret, id, timestamp, signature, payload }) {
  try {
    if (!secret || !id || !timestamp || !signature) return false;

    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return false;
    if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SEC) return false;

    const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
    if (!key.length) return false;

    const expected = crypto
      .createHmac('sha256', key)
      .update(`${id}.${timestamp}.${payload}`, 'utf8')
      .digest('base64');
    const expectedBuf = Buffer.from(expected, 'utf8');

    for (const part of String(signature).split(' ')) {
      const [version, sig] = part.split(',');
      if (version !== 'v1' || !sig) continue;
      const sigBuf = Buffer.from(sig, 'utf8');
      if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Insert or upgrade a suppressions row (bounced > complained > unsubscribed),
 * then mirror the opt-out onto contacts.tags.
 *
 * The tag mirror was added 26 Jul 2026. Until then this route wrote the
 * suppressions row only — which the sequence engine honours but the newsletter
 * does not, since the newsletter audience filters on
 * contacts.tags @> {unsubscribed}. A hard-bounced or complaining address was
 * therefore still mailed by every subsequent newsletter. See lib/suppressions.js.
 *
 * This keeps its own row logic rather than calling suppress(): the reason
 * ladder below must be able to UPGRADE an existing row, whereas suppress()
 * deliberately preserves the first reason recorded.
 */
async function suppressAddress(db, email, reason, note) {
  const { data: existing, error: selErr } = await db
    .from('suppressions')
    .select('email, reason')
    .eq('email', email)
    .maybeSingle();
  if (selErr) {
    console.error('[resend-webhook] suppression lookup failed:', selErr.message);
    return false;
  }

  if (!existing) {
    const { error } = await db
      .from('suppressions')
      .insert({ email, reason, scope: 'all', note });
    // 23505 = unique violation: a concurrent delivery of the same webhook won.
    if (error && error.code !== '23505') {
      console.error('[resend-webhook] suppression insert failed:', error.message);
      return false;
    }
  } else if ((REASON_RANK[reason] || 0) > (REASON_RANK[existing.reason] || 0)) {
    const { error } = await db
      .from('suppressions')
      .update({ reason, note })
      .eq('email', email);
    if (error) {
      console.error('[resend-webhook] suppression upgrade failed:', error.message);
      return false;
    }
  }
  // else: already suppressed at an equal/stronger level — idempotent.

  // Mirror to the tag register every time, including on the idempotent path:
  // the row may predate this fix and have no tag written for it.
  await tagContactsUnsubscribed(db, email, reason);
  return true;
}

/** Cancel every still-pending email_queue row for an address. Returns count. */
async function cancelPendingForAddress(db, email, notes) {
  let cancelled = 0;
  const pattern = email.replace(/([\\%_])/g, '\\$1');
  const { data: rows, error } = await db
    .from('email_queue')
    .select('id')
    .eq('status', 'pending')
    .ilike('to_email', pattern);
  if (error) {
    console.error('[resend-webhook] pending-rows lookup failed:', error.message);
    return 0;
  }
  for (const row of rows || []) {
    const ok = await safeStatusUpdate(db, { id: row.id }, 'cancelled', {
      rejected_at: new Date().toISOString(),
      notes,
    });
    if (ok) cancelled++;
  }
  return cancelled;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET is not set — event rejected');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let payload;
  try {
    payload = (await readRawBody(req)).toString('utf8');
  } catch {
    return res.status(400).json({ error: 'Unreadable body' });
  }

  const valid = verifySvixSignature({
    secret,
    id:        header(req, 'svix-id'),
    timestamp: header(req, 'svix-timestamp'),
    signature: header(req, 'svix-signature'),
    payload,
  });
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  let evt;
  try {
    evt = JSON.parse(payload);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const type = evt?.type;
  if (type !== 'email.bounced' && type !== 'email.complained') {
    // Acknowledge anything else so Resend doesn't retry it.
    return res.status(200).json({ ok: true, ignored: type || 'unknown' });
  }

  // Hard bounces only — a Transient/soft bounce (full mailbox, greylisting)
  // must not permanently invalidate the address.
  const bounce = evt?.data?.bounce || null;
  if (type === 'email.bounced') {
    const bounceType = String(bounce?.type || '').toLowerCase();
    if (bounceType && bounceType !== 'permanent' && bounceType !== 'hard') {
      return res.status(200).json({ ok: true, ignored: `soft bounce (${bounce.type})` });
    }
  }

  const reason = type === 'email.complained' ? 'complained' : 'bounced';
  const note = type === 'email.complained'
    ? `Resend webhook: spam complaint${evt?.data?.subject ? ` on "${evt.data.subject}"` : ''}`
    : `Resend webhook: hard bounce${bounce?.subType ? ` (${bounce.subType})` : ''}${bounce?.message ? ` — ${String(bounce.message).slice(0, 300)}` : ''}`;
  const cancelNote = reason === 'complained'
    ? 'Cancelled — recipient filed a spam complaint (Resend webhook)'
    : 'Cancelled — address hard-bounced (Resend webhook)';

  const recipients = [].concat(evt?.data?.to || [])
    .map(a => String(a || '').toLowerCase().trim())
    .filter(a => a.includes('@'));
  if (!recipients.length) return res.status(200).json({ ok: true, ignored: 'no recipients in payload' });

  const db = getDb();
  let suppressed = 0;
  let cancelled  = 0;

  for (const address of recipients) {
    if (await suppressAddress(db, address, reason, note)) suppressed++;

    cancelled += await cancelPendingForAddress(db, address, cancelNote);

    // Best-effort CRM timeline entry (there is no email_events table in this
    // codebase — activities is the event log the admin UI reads).
    try {
      const { data: contact } = await db
        .from('contacts')
        .select('id')
        .eq('email', address)
        .maybeSingle();
      if (contact) {
        await logActivity({
          contactId:   contact.id,
          type:        reason === 'complained' ? 'email_complained' : 'email_bounced',
          description: reason === 'complained'
            ? `Spam complaint from ${address} — all emails suppressed`
            : `Hard bounce for ${address} — address suppressed, pending emails cancelled`,
          metadata: {
            email_id: evt?.data?.email_id || null,
            subject:  evt?.data?.subject  || null,
            bounce:   bounce || undefined,
            webhook_event: type,
          },
        });
      }
    } catch (e) {
      console.error('[resend-webhook] activity log failed:', e.message);
    }
  }

  return res.status(200).json({ ok: true, type, suppressed, cancelled });
}
