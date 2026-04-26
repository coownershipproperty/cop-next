/**
 * POST /api/admin/send-campaign
 * Bulk-approves and sends all pending emails for a given campaign (sequenceType).
 * Called from the CRM when the operator clicks "Send Campaign".
 *
 * Authorization: Bearer <CRON_SECRET>
 *
 * Body (JSON):
 *   campaignId — the sequenceType value (e.g. 'new-listings-2026-04-27')
 *   limit      — optional max emails to send in one call (default: 500)
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { FROM_ADDRESS, REPLY_TO } from '@/lib/resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

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

  for (const row of rows) {
    try {
      const { error: sendErr } = await resend.emails.send({
        from:    FROM_ADDRESS,
        to:      [row.to_email],
        subject: row.subject,
        html:    row.html,
        replyTo: REPLY_TO,
      });

      if (sendErr) throw new Error(sendErr.message);

      await db.from('email_queue').update({
        status:      'sent',
        sent_at:     now,
        approved_at: now,
      }).eq('id', row.id);

      sent++;
    } catch (e) {
      console.error(`[Campaign] send failed for ${row.to_email}:`, e.message);
      failed++;
    }
  }

  return res.status(200).json({ ok: true, sent, failed, campaignId });
}
