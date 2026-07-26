/**
 * POST /api/unsubscribe
 * Body: { email, token }
 *
 * Called by the public /unsubscribe page. The token must be the HMAC-SHA256
 * of the lowercased email (see lib/unsub.js) — it comes from the link in the
 * email footer, so only the recipient of that email can produce it.
 *
 * On a valid token:
 *   1. Records the opt-out via lib/suppressions.js `suppress()`, which writes
 *      BOTH registers — the `suppressions` row AND the `unsubscribed` tag on
 *      any matching contact.
 *   2. Cancels every still-pending email_queue row addressed to them, using
 *      the same verified status write ('cancelled', falling back to
 *      'rejected') as the rest of the sequence code.
 *
 * WHY BOTH REGISTERS (fixed 26 Jul 2026)
 * --------------------------------------
 * This route used to write the `suppressions` row only, and its comment here
 * wrongly claimed "every sender path checks this table". That was false: the
 * sequence engine checks `suppressions`, but the newsletter audience resolver
 * and /api/admin/newsletter/send checked ONLY `contacts.tags @> {unsubscribed}`.
 * So everyone who clicked this link stayed in the newsletter audience and kept
 * being mailed — seven real people, two of whom had asked in writing to be
 * removed. Writing through `suppress()` keeps the two registers in lockstep.
 *
 * Idempotent — clicking the link twice, or after a manual suppression, is a
 * no-op that still returns 200.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { normalizeEmail, verifyUnsubToken } from '@/lib/unsub';
import { safeStatusUpdate } from '@/lib/followupSequence';
import { suppress } from '@/lib/suppressions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = normalizeEmail(req.body?.email);
  const token = String(req.body?.token || '').trim();

  if (!email || !EMAIL_RE.test(email) || !token || !verifyUnsubToken(email, token)) {
    return res.status(400).json({ error: 'Invalid unsubscribe link' });
  }

  const db = getDb();

  // ── 1. Record the opt-out in BOTH registers ──────────────────────────────
  // suppress() upserts the suppressions row (ignoreDuplicates, so repeat
  // clicks keep the original reason/note) and mirrors the `unsubscribed` tag
  // onto every matching contact, which is what the newsletter filters on.
  const { ok, error: supErr } = await suppress(db, email, {
    reason: 'unsubscribed',
    scope:  'all',
    note:   'Via /unsubscribe link',
  });
  if (!ok) {
    console.error('[unsubscribe] suppression write failed:', supErr);
    return res.status(500).json({ error: 'Could not save your preference' });
  }

  // ── 2. Cancel everything still pending for this address ──────────────────
  // Best-effort: the suppression row above already guarantees nothing sends
  // (the queue processor re-checks it at send time), this just tidies the
  // queue. ilike (with wildcards escaped) catches rows stored in mixed case.
  let cancelled = 0;
  try {
    const pattern = email.replace(/([\\%_])/g, '\\$1');
    const { data: rows, error: qErr } = await db
      .from('email_queue')
      .select('id')
      .eq('status', 'pending')
      .ilike('to_email', pattern);
    if (qErr) throw new Error(qErr.message);

    for (const row of rows || []) {
      const ok = await safeStatusUpdate(db, { id: row.id }, 'cancelled', {
        rejected_at: new Date().toISOString(),
        notes: 'Cancelled — recipient unsubscribed',
      });
      if (ok) cancelled++;
    }
  } catch (e) {
    console.error('[unsubscribe] queue cancellation failed:', e.message);
  }

  return res.status(200).json({ ok: true, cancelled });
}
