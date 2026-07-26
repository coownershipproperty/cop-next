/**
 * POST /api/admin/send-campaign
 * Bulk-approves and sends all pending emails for a given campaign (sequenceType).
 * Called from the CRM when the operator clicks "Send Campaign".
 *
 * Authorization: Bearer <Supabase access token for CRM admin>
 *
 * Body (JSON):
 *   campaignId — the sequenceType value (e.g. 'new-listings-2026-04-27')
 *   limit      — optional max emails to send in one call (default: 500)
 */
import { Resend } from 'resend';
import { FROM_ADDRESS, REPLY_TO } from '@/lib/resend';
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { filterSuppressed } from '@/lib/suppressions';

const resend = new Resend(process.env.RESEND_API_KEY);
const BATCH_SIZE = 100; // Resend batch limit

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  setCrmCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end();

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const { campaignId, limit = 500 } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

  const db = getDb();

  // Fetch all pending emails for this campaign
  const { data: rows, error } = await db
    .from('email_queue')
    .select('id, to_email, subject, html')
    .eq('sequence_type', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  if (!rows || rows.length === 0) {
    return res.status(200).json({ ok: true, sent: 0, message: 'No pending emails found for this campaign.' });
  }

  // ── Suppression guard (added 26 Jul 2026) ───────────────────────────────────
  // This route is a SECOND, manual drain of the same `email_queue` pending pool
  // that /api/process-email-queue drains on a 5-minute cron. The cron runs every
  // row through preflightSequenceEmail (suppression list, late cancel, frequency
  // cap). This route used to run them through nothing at all — it pushed straight
  // to Resend's batch API — so clicking "Send Campaign" in the CRM bypassed every
  // guard rail the cron applies to the very same rows.
  //
  // TODO: ideally this route should call preflightSequenceEmail so the manual
  // button and the cron are provably identical. The suppression check below is
  // the minimum that stops an opted-out person being mailed.
  const { kept: sendableRows, dropped: suppressedRows } =
    await filterSuppressed(db, rows, r => r.to_email);

  if (suppressedRows.length) {
    await db.from('email_queue').update({
      status:      'cancelled',
      rejected_at: new Date().toISOString(),
      notes:       'Cancelled — recipient is on the suppression list',
    }).in('id', suppressedRows.map(r => r.id));
    console.log(`[Campaign] skipped ${suppressedRows.length} suppressed recipient(s)`);
  }

  if (!sendableRows.length) {
    return res.status(200).json({
      ok: true, sent: 0, suppressed: suppressedRows.length,
      message: 'Every pending recipient for this campaign is on the suppression list.',
    });
  }

  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();

  // Send in batches of BATCH_SIZE via Resend batch API
  for (let i = 0; i < sendableRows.length; i += BATCH_SIZE) {
    const batch = sendableRows.slice(i, i + BATCH_SIZE);

    const batchPayload = batch.map(row => ({
      from:     FROM_ADDRESS,
      to:       [row.to_email],
      subject:  row.subject,
      html:     row.html,
      reply_to: REPLY_TO,
    }));

    try {
      const { data: batchResult, error: batchErr } = await resend.batch.send(batchPayload);

      if (batchErr) throw new Error(batchErr.message || JSON.stringify(batchErr));

      // Mark all emails in this batch as sent
      const ids = batch.map(r => r.id);
      await db.from('email_queue').update({
        status:      'sent',
        sent_at:     now,
        approved_at: now,
      }).in('id', ids);

      sent += batch.length;
    } catch (e) {
      console.error(`[Campaign] batch ${i}–${i + BATCH_SIZE} failed:`, e.message);
      failed += batch.length;
    }
  }

  return res.status(200).json({ ok: true, sent, failed, suppressed: suppressedRows.length, campaignId });
}
