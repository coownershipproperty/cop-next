import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/AdminDashboardHome.module.css'

/**
 * The 24-hour reply rule, made visible.
 *
 * David's rule: every enquiry gets a human reply and an offer to register,
 * inside a day. This is the list of the ones that have not had one — worked
 * out server-side in lib/unansweredEnquiries.js, which also explains exactly
 * what counts as an enquiry and what counts as a reply.
 *
 * "Answered" clears a row for good, because a reply typed straight into Gmail
 * leaves no trace in the CRM and there has to be a way to say so. Nothing
 * here sends anything.
 */

async function authed(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'That did not work.')
  return payload
}

function waitedLabel(hours) {
  if (hours < 1) return 'Just in'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day' : `${days} days`
}

export default function UnansweredEnquiries({ onCount }) {
  const [items, setItems] = useState([])
  const [overdue, setOverdue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    authed('/api/admin/ui/unanswered-enquiries')
      .then((payload) => {
        if (!active) return
        setItems(payload.items || [])
        setOverdue(payload.overdue || 0)
        if (onCount) onCount({ overdue: payload.overdue || 0, waiting: payload.waiting || 0 })
      })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAnswered(item) {
    if (busy) return
    setBusy(item.key); setError('')
    try {
      await authed('/api/admin/ui/unanswered-enquiries', {
        method: 'POST',
        body: JSON.stringify({ contactId: item.contactId, leadId: item.leadId }),
      })
      setItems((current) => {
        const next = current.filter((row) => row.key !== item.key)
        const nextOverdue = next.filter((row) => row.overdue).length
        setOverdue(nextOverdue)
        if (onCount) onCount({ overdue: nextOverdue, waiting: next.length })
        return next
      })
    } catch (e) {
      setError(e.message)
    } finally { setBusy('') }
  }

  if (loading || (!items.length && !error)) return null

  return (
    <section className={styles.leadSection} id="unanswered-enquiries">
      <header className={styles.leadSectionHeader}>
        <div>
          <span className={styles.sectionIcon}>!</span>
          <div>
            <h2>Waiting on a reply</h2>
            <p>
              {overdue > 0
                ? `${overdue} ${overdue === 1 ? 'enquiry has' : 'enquiries have'} been waiting longer than a day`
                : 'Everything here is still inside the 24-hour window'}
            </p>
          </div>
        </div>
        <Link href="/admin/replies">Reply desk →</Link>
      </header>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.replyQueue}>
        {items.map((item) => (
          <article key={item.key} className={item.overdue ? styles.replyRowOverdue : styles.replyRow}>
            <div className={styles.replyWho}>
              <strong>{item.name}</strong>
              <small>{item.email}{item.phone ? ` · ${item.phone}` : ''}</small>
            </div>
            <div className={styles.replySaid}>
              {item.message
                ? <p>{item.message}</p>
                : <p className={styles.replyNoWords}>No message — {item.kind === 'gallery_enquiry' ? 'enquired from a gallery' : 'submitted the enquiry form'}</p>}
              {(item.propertyTitle || item.drafted) && (
                <small>
                  {item.propertyTitle}
                  {item.propertyTitle && item.drafted ? ' · ' : ''}
                  {item.drafted && <em className={styles.replyDrafted}>a reply is drafted and waiting</em>}
                </small>
              )}
            </div>
            <div className={styles.replyWaited}>
              <strong>{waitedLabel(item.hoursWaiting)}</strong>
              <small>{item.count > 1 ? `${item.count} enquiries` : 'waiting'}</small>
            </div>
            <div className={styles.replyActions}>
              {item.leadId && <Link href={`/admin/leads/${item.leadId}`}>Open</Link>}
              <button type="button" onClick={() => markAnswered(item)} disabled={busy === item.key}>
                {busy === item.key ? '…' : 'Answered'}
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className={styles.taskFootnote}>
        A reply sent straight from Gmail leaves no trace in the CRM — mark those answered here and they will not come back.
      </p>
    </section>
  )
}
