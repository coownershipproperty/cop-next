import { requireCrmAdmin } from '@/lib/adminAuth'
import { madridLocalToIso } from '@/lib/adminTasks'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

const TASK_SELECT = 'id,task,due_at,reminder_at,reminder_status,reminder_sent_at,created_at,completed_at'

function cleanTask(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return

  const db = createSupabaseAdminClient()

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('admin_tasks')
      .select(TASK_SELECT)
      .is('completed_at', null)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: 'Could not load tasks.' })
    return res.json({ tasks: data || [] })
  }

  if (req.method === 'POST') {
    const task = cleanTask(req.body?.task)
    const dueDate = String(req.body?.dueDate || '').trim()
    const dueTime = String(req.body?.dueTime || '').trim()
    if (!task || task.length > 220) return res.status(400).json({ error: 'Enter a task of 220 characters or fewer.' })
    if ((dueDate && !dueTime) || (!dueDate && dueTime)) return res.status(400).json({ error: 'Choose both a date and a time for a reminder.' })

    let dueAt = null
    let reminderAt = null
    if (dueDate && dueTime) {
      try {
        dueAt = madridLocalToIso(dueDate, dueTime)
      } catch (error) {
        return res.status(400).json({ error: error.message })
      }
      if (new Date(dueAt).getTime() <= Date.now()) return res.status(400).json({ error: 'Choose a time in the future.' })
      reminderAt = new Date(new Date(dueAt).getTime() - (30 * 60 * 1000)).toISOString()
    }

    const { data, error } = await db.from('admin_tasks').insert({
      task,
      due_at: dueAt,
      reminder_at: reminderAt,
      reminder_status: dueAt ? 'pending' : 'none',
      created_by_email: admin.email,
    }).select(TASK_SELECT).single()

    if (error) return res.status(500).json({ error: 'Could not save the task.' })
    return res.status(201).json({ task: data })
  }

  if (req.method === 'PATCH') {
    const id = String(req.body?.id || '').trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid task.' })
    }

    const now = new Date().toISOString()
    const { data, error } = await db.from('admin_tasks')
      .update({ completed_at: now, updated_at: now })
      .eq('id', id)
      .is('completed_at', null)
      .select(TASK_SELECT)
      .maybeSingle()

    if (error) return res.status(500).json({ error: 'Could not complete the task.' })
    if (!data) return res.status(404).json({ error: 'Task not found.' })
    return res.json({ task: data })
  }

  res.setHeader('Allow', 'GET, POST, PATCH')
  return res.status(405).json({ error: 'Method not allowed.' })
}
