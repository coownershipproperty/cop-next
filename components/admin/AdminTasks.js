import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/AdminDashboardHome.module.css'

async function authedRequest(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The task could not be saved.')
  return payload
}

function dueLabel(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value))
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    authedRequest('/api/admin/tasks').then((payload) => {
      if (active) setTasks(payload.tasks || [])
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const scheduledCount = useMemo(() => tasks.filter((task) => task.due_at).length, [tasks])

  async function addTask(event) {
    event.preventDefault()
    if (!draft.trim() || saving) return
    const submitted = new FormData(event.currentTarget)
    const submittedDate = String(submitted.get('dueDate') || '')
    const submittedTime = String(submitted.get('dueTime') || '')
    setSaving(true)
    setError('')
    try {
      const payload = await authedRequest('/api/admin/tasks', {
        method: 'POST', body: JSON.stringify({ task: draft, dueDate: submittedDate, dueTime: submittedTime }),
      })
      setTasks((current) => [...current, payload.task].sort((a, b) => {
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        return new Date(a.due_at) - new Date(b.due_at)
      }))
      setDraft('')
      setDueDate('')
      setDueTime('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function completeTask(id) {
    setError('')
    const previous = tasks
    setTasks((current) => current.filter((task) => task.id !== id))
    try {
      await authedRequest('/api/admin/tasks', { method: 'PATCH', body: JSON.stringify({ id }) })
    } catch (requestError) {
      setTasks(previous)
      setError(requestError.message)
    }
  }

  return (
    <section className={styles.tasks} aria-labelledby="admin-tasks-heading">
      <header>
        <div><h2 id="admin-tasks-heading">Tasks</h2><p>Madrid time · email reminder 30 minutes before</p></div>
        <span>{loading ? '—' : tasks.length}</span>
      </header>
      <form onSubmit={addTask} className={styles.taskForm}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a task or note" aria-label="Task or note" maxLength={220} />
        <input type="date" name="dueDate" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Task date" />
        <input type="time" name="dueTime" value={dueTime} onChange={(event) => setDueTime(event.target.value)} aria-label="Task time" />
        <button type="submit" disabled={!draft.trim() || saving}>{saving ? 'Saving…' : 'Add'}</button>
      </form>
      {error && <p className={styles.taskError} role="alert">{error}</p>}
      {!loading && tasks.length === 0 ? <p className={styles.taskEmpty}>No open tasks.</p> : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <article key={task.id}>
              <div><strong>{task.task}</strong>{task.due_at ? <small>{dueLabel(task.due_at)} · Email {task.reminder_status === 'sent' ? 'sent' : '30 min before'}</small> : <small>Note · no reminder</small>}</div>
              <button type="button" onClick={() => completeTask(task.id)}>Done</button>
            </article>
          ))}
        </div>
      )}
      {scheduledCount > 0 && <p className={styles.taskFootnote}>🔔 {scheduledCount} email {scheduledCount === 1 ? 'reminder' : 'reminders'} scheduled to info@co-ownership-property.com</p>}
    </section>
  )
}
