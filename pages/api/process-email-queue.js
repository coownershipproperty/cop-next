/**
 * GET /api/process-email-queue
 * Cron job — runs every minute.
 * Picks up pending emails whose send_after time has passed and sends them.
 * Authorization: Bearer <CRON_SECRET>
 */
import { sendHtml } from '@/lib/resend';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

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
