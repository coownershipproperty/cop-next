/**
 * /api/unsubscribe — records an opt-out. Three callers land here:
 *
 *   1. The /unsubscribe page, tokenised link:   POST { email, token }
 *   2. The /unsubscribe page, confirm button:   POST { email, confirmed: true }
 *   3. A mailbox provider doing RFC 8058
 *      one-click (Gmail/Yahoo "Unsubscribe"
 *      button next to the sender name):         POST ?e=..&t=.. with the
 *                                               form body "List-Unsubscribe=One-Click"
 *
 * GET requests 302-redirect to the human /unsubscribe page — some mail
 * clients open the List-Unsubscribe URL as a plain link.
 *
 * WHY TOKENLESS OPT-OUTS ARE NOW ACCEPTED (fixed 23 Aug 2026)
 * -----------------------------------------------------------
 * The HMAC token (see lib/unsub.js) proves the request came from a link we
 * signed. But neither UNSUB_SECRET nor CRON_SECRET has ever been set in the
 * production runtime, so unsubUrl() has emitted TOKENLESS links in every
 * campaign footer to date — and this route refused all of them (400), landing
 * every clicker on the page's 'legacy' mailto dead-end. The suppressions
 * table proves the result: every row in it was written by hand; not one
 * person ever managed to unsubscribe themselves. One recipient (23 Aug 2026)
 * had to email us to say his repeated attempts did nothing.
 *
 * So: a request that positively signals intent — the page's confirm button
 * ({ confirmed: true }) or a provider's one-click POST — is honoured WITHOUT
 * a token. The only thing an attacker gains from that is the ability to
 * unsubscribe someone else's address, a nuisance strictly smaller than the
 * harm of real recipients being unable to leave (which is also the
 * CAN-SPAM/GDPR exposure). Tokenised links remain the preferred path and are
 * verified when present; a *wrong* token without one of the two explicit
 * signals is still refused.
 *
 * On any accepted request:
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
  // Mail clients sometimes follow the List-Unsubscribe URL as a plain link.
  // Hand the human to the interactive page; the POST below is for machines.
  if (req.method === 'GET') {
    const e = typeof req.query.e === 'string' ? req.query.e : '';
    const t = typeof req.query.t === 'string' ? req.query.t : '';
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, `/unsubscribe/?e=${encodeURIComponent(e)}${t ? `&t=${encodeURIComponent(t)}` : ''}`);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // One-click POSTs put e/t in the query string and the assertion in a
  // form-encoded body, which Next parses into req.body just like JSON.
  const body = req.body || {};
  const isOneClick = body['List-Unsubscribe'] === 'One-Click';
  const email = normalizeEmail(body.email || req.query.e || req.query.email);
  const token = String(body.token || req.query.t || '').trim();
  const confirmed = body.confirmed === true;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid unsubscribe link' });
  }

  let note;
  if (token && verifyUnsubToken(email, token)) {
    note = isOneClick
      ? 'Via one-click unsubscribe (List-Unsubscribe header)'
      : 'Via /unsubscribe link';
  } else if (isOneClick) {
    // Header URLs sent while no signing secret was configured are tokenless;
    // refusing them would break the provider Unsubscribe button all over again.
    note = 'Via one-click unsubscribe (List-Unsubscribe header, untokenised)';
  } else if (confirmed) {
    note = 'Via /unsubscribe page (tokenless link, confirmed by click)';
  } else {
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
    note,
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
