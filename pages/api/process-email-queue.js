/**
 * GET /api/process-email-queue
 * Cron job (see vercel.json).
 * Picks up pending emails whose send_after time has passed and sends them.
 * Authorization: Bearer <CRON_SECRET>
 *
 * EVERY due row is checked against the `suppressions` table right before
 * sending (the /unsubscribe page writes that table — an unsubscribed address
 * must never receive another queued email, whatever queued it). Follow-up
 * sequence rows (sequence_type 'gallery_nurture' / 'enquiry_check')
 * additionally get late cancellation (enquiry after queueing / lead
 * progressed / reply logged) and the 48h frequency cap (skip + reschedule).
 * Successful sequence sends are logged to email_sends with the step id
 * (e.g. 'nurture_d2_single').
 *
 * BUG FIX (see docs/email-automation-blueprint.md, "Bug 2"): a failed send
 * used to write status='error' without checking the result. On databases
 * where the email_queue status CHECK constraint predates the 'error' value,
 * Postgres rejected the UPDATE, the error was silently discarded, and the row
 * stayed 'pending' — so a permanently failing send (bad address, template
 * error) was retried on every cron run, indefinitely. Status writes are now
 * verified, with a fallback to 'rejected' (allowed by every version of the
 * constraint), so a failed row always leaves the 'pending' pool.
 */
import { sendHtml, FROM_ADDRESS, REPLY_TO } from '@/lib/resend';
import { resolveUnsubPlaceholder, listUnsubHeaders } from '@/lib/unsub';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { createEmailSend } from '@/lib/crm';
import { preflightSequenceEmail, MANAGED_SEQUENCE_TYPES } from '@/lib/followupSequence';

function getDb() {
  return createSupabaseAdminClient();
}

/**
 * Write a status and verify it stuck; fall back to 'rejected' if the DB
 * rejects the preferred value. Guarantees the row never stays 'pending'.
 */
async function markStatus(db, id, status, fields = {}) {
  for (const s of [status, 'rejected']) {
    const { error } = await db.from('email_queue').update({ status: s, ...fields }).eq('id', id);
    if (!error) return true;
    console.error(`[process-email-queue] status '${s}' update failed for ${id}:`, error.message);
    if (s === 'rejected') break;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth — the same rule as every other cron in this app: a Vercel cron call
  // (x-vercel-cron header, or a plain GET) or an internal Bearer secret.
  // This handler used to demand `Bearer CRON_SECRET` and nothing else, so
  // when Vercel called it without that header it answered 401 on every run —
  // the queue sender had not sent a single email since 13 May 2026, and the
  // first approved reply from /admin/replies sat at 'pending' (6 Sep 2026).
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.method === 'GET';
  const auth = req.headers['authorization'] || '';
  const isAuthed = (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
                || (process.env.CRM_SECRET  && auth === `Bearer ${process.env.CRM_SECRET}`);
  if (!isVercelCron && !isAuthed) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const db  = getDb();
  const now = new Date().toISOString();

  // Fetch pending emails that are due
  const { data: due, error } = await db
    .from('email_queue')
    .select('id, created_at, to_email, subject, html, template_props, contact_id, lead_id, sequence_type')
    .eq('status', 'pending')
    .not('send_after', 'is', null)
    .lte('send_after', now)
    .limit(20);

  if (error) {
    console.error('[process-email-queue] fetch error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!due || due.length === 0) {
    return res.status(200).json({ ok: true, sent: 0 });
  }

  let sent = 0, failed = 0, cancelled = 0, rescheduled = 0;
  for (const row of due) {
    const isSequenceRow = MANAGED_SEQUENCE_TYPES.includes(row.sequence_type);

    // ── Guard rails: suppression check for every row; late cancel and the
    //    48h cap for sequence rows (see preflightSequenceEmail) ─────────────
    let pf;
    try {
      pf = await preflightSequenceEmail(db, row);
    } catch (e) {
      // Preflight failure → leave the row pending for the next run.
      console.error(`[process-email-queue] preflight failed for ${row.id}:`, e.message);
      continue;
    }
    if (pf.action === 'cancel') {
      await markStatus(db, row.id, 'cancelled', {
        rejected_at: new Date().toISOString(),
        notes: pf.notes,
      });
      cancelled++;
      continue;
    }
    if (pf.action === 'reschedule') {
      const { error: rErr } = await db.from('email_queue')
        .update({ send_after: pf.sendAfter, notes: pf.notes })
        .eq('id', row.id);
      if (rErr) console.error(`[process-email-queue] reschedule failed for ${row.id}:`, rErr.message);
      rescheduled++;
      continue;
    }

    try {
      const from    = row.template_props?.from    || FROM_ADDRESS;
      const replyTo = row.template_props?.replyTo || REPLY_TO;

      await sendHtml({
        to:      row.to_email,
        subject: row.subject,
        // Rows staged outside the app carry {{UNSUB_URL}}; no-op for the rest.
        html:    resolveUnsubPlaceholder(row.html, row.to_email),
        from,
        replyTo,
        headers: listUnsubHeaders(row.to_email), // RFC 8058 one-click — see lib/unsub.js
      });

      const { error: uErr } = await db.from('email_queue').update({
        status:  'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', row.id);
      if (uErr) console.error(`[process-email-queue] sent-status update failed for ${row.id}:`, uErr.message);

      // Log sequence sends to email_sends with the step id from the contract.
      if (isSequenceRow) {
        try {
          await createEmailSend({
            contactId:     row.contact_id || null,
            leadId:        row.lead_id    || null,
            type:          row.template_props?.step || row.sequence_type,
            subject:       row.subject,
            toEmail:       row.to_email,
            propertyTitle: row.template_props?.propertyTitle || null,
            propertyUrl:   row.template_props?.propertyUrl   || null,
          });
        } catch (e) {
          console.error(`[process-email-queue] email_sends log failed for ${row.id}:`, e.message);
        }
      }

      sent++;
    } catch (e) {
      console.error(`[process-email-queue] send failed for ${row.id}:`, e.message);
      await markStatus(db, row.id, 'error', { notes: `send failed: ${e.message}` });
      failed++;
    }
  }

  return res.status(200).json({ ok: true, sent, failed, cancelled, rescheduled });
}
