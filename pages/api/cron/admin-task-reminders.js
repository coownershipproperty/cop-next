import { formatMadridDateTime } from '@/lib/adminTasks'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

const ADMIN_EMAIL = process.env.ADMIN_TASK_REMINDER_EMAIL || 'info@co-ownership-property.com'

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character])
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  const secret = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  const authorised = req.headers['x-vercel-cron'] === '1' || (secret && auth === `Bearer ${secret}`)
  if (!authorised) return res.status(401).json({ error: 'Unauthorised' })

  const db = createSupabaseAdminClient()
  // Keep Resend lazy so an unauthorised request is rejected before email
  // configuration is loaded, and local read-only checks do not need the key.
  const { sendHtml } = await import('@/lib/resend')
  const now = new Date().toISOString()
  const { data: dueTasks, error } = await db.from('admin_tasks')
    .select('id,task,due_at,reminder_at,reminder_attempts')
    .eq('reminder_status', 'pending')
    .is('completed_at', null)
    .lte('reminder_at', now)
    .lt('reminder_attempts', 5)
    .order('reminder_at', { ascending: true })
    .limit(25)

  if (error) return res.status(500).json({ error: 'Could not load due reminders.' })

  let sent = 0
  let failed = 0
  for (const task of dueTasks || []) {
    const attempt = (task.reminder_attempts || 0) + 1
    const claimedAt = new Date().toISOString()
    const { data: claimed } = await db.from('admin_tasks')
      .update({ reminder_status: 'sending', reminder_attempts: attempt, updated_at: claimedAt })
      .eq('id', task.id)
      .eq('reminder_status', 'pending')
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    try {
      const dueLabel = formatMadridDateTime(task.due_at)
      await sendHtml({
        to: ADMIN_EMAIL,
        from: 'COP Admin <info@co-ownership-property.com>',
        replyTo: 'info@co-ownership-property.com',
        subject: `Reminder: ${task.task}`.slice(0, 150),
        idempotencyKey: `cop-admin-task-${task.id}`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#14252f;line-height:1.55;max-width:620px;margin:auto;padding:32px"><p style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#687983">COP ADMIN TASK</p><h1 style="font-size:26px;line-height:1.2;margin:12px 0 18px">${escapeHtml(task.task)}</h1><p style="font-size:16px">Due <strong>${escapeHtml(dueLabel)}</strong> (Madrid time).</p><p style="margin-top:28px"><a href="https://co-ownership-property.com/admin/" style="display:inline-block;padding:13px 18px;background:#14252f;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Open COP Admin</a></p><p style="margin-top:28px;color:#75858e;font-size:13px">This reminder was scheduled 30 minutes before the task.</p></div>`,
      })
      await db.from('admin_tasks').update({
        reminder_status: 'sent', reminder_sent_at: new Date().toISOString(), reminder_error: null, updated_at: new Date().toISOString(),
      }).eq('id', task.id).eq('reminder_status', 'sending')
      sent += 1
    } catch (sendError) {
      const terminal = attempt >= 5
      await db.from('admin_tasks').update({
        reminder_status: terminal ? 'failed' : 'pending',
        reminder_error: String(sendError.message || sendError).slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq('id', task.id).eq('reminder_status', 'sending')
      failed += 1
    }
  }

  return res.json({ ok: true, checked: (dueTasks || []).length, sent, failed })
}
