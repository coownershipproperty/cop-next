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

  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();

  // Send in batches of BATCH_SIZE via Resend batch API
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

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

  return res.status(200).json({ ok: true, sent, failed, campaignId });
}
