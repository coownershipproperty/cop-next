/**
 * GET /api/process-email-queue
 * Cron job — runs every minute.
 * Picks up pending emails whose send_after time has passed and sends them.
 */
import { createClient } from '@supabase/supabase-js';
import { sendHtml } from '@/lib/resend';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  // Allow Vercel cron (GET) or internal POST with secret
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.method === 'GET';
  const isAuthed     = req.headers['authorization'] === `Bearer ${process.env.CRM_SECRET}`;
  if (!isVercelCron && !isAuthed) return res.status(401).json({ error: 'Unauthorised' });

  const db  = getDb();
  const now = new Date().toISOString();

  // Fetch pending emails that are due
  const { data: due, error } = await db
    .from('email_queue')
    .select('id, to_email, subject, html, template_props')
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

  let sent = 0, failed = 0;
  for (const row of due) {
    try {
      const from    = row.template_props?.from    || 'Co-Ownership Property <info@co-ownership-property.com>';
      const replyTo = row.template_props?.replyTo || 'info@co-ownership-property.com';

      await sendHtml({ to: row.to_email, subject: row.subject, html: row.html, from, replyTo });

      await db.from('email_queue').update({
        status:  'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', row.id);

      sent++;
    } catch (e) {
      console.error(`[process-email-queue] send failed for ${row.id}:`, e.message);
      await db.from('email_queue').update({ status: 'error' }).eq('id', row.id);
      failed++;
    }
  }

  return res.status(200).json({ ok: true, sent, failed });
}
