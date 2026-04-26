/**
 * POST /api/email-queue
 * CRM actions for the email approval queue.
 *
 * Actions:
 *   { action: 'approve', id: '<uuid>' }  → send the email immediately
 *   { action: 'reject',  id: '<uuid>' }  → mark as rejected
 *   { action: 'list'                   }  → return pending emails (for CRM display)
 *
 * Authorization: Bearer <CRM_SECRET>
 */
import { sendQueuedEmail, rejectQueuedEmail } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  // CORS — allow the CRM dashboard
  res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end();

  // Auth check
  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const { action, id, status, limit: pageLimit = 50, offset = 0 } = req.body || {};

  // ── List ──────────────────────────────────────────────────────────────────
  if (action === 'list') {
    const db = getDb();
    let query = db
      .from('email_queue')
      .select('id, created_at, status, to_email, to_name, subject, template_name, trigger, notes, contact_id, lead_id, sent_at, approved_at, rejected_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageLimit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, emails: data });
  }

  // ── Approve ───────────────────────────────────────────────────────────────
  if (action === 'approve') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const result = await sendQueuedEmail(id);
      return res.status(200).json({ ok: true, ...result });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const result = await rejectQueuedEmail(id);
      return res.status(200).json({ ok: true, ...result });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  if (action === 'preview') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const db = getDb();
    const { data, error } = await db
      .from('email_queue')
      .select('id, subject, html, to_email, to_name, template_name, trigger, notes, status, created_at')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true, email: data });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
