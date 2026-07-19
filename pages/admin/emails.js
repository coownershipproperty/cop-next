import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

// Friendly labels for the email_queue.trigger / template values.
const KIND_LABELS = {
  floor_plan_requested: 'Gallery sent',
  gallery_followup: 'Gallery follow-up',
  gallery_autoreply: 'Enquiry reply',
  enquiry_autoreply: 'Enquiry reply',
  floor_plan_nurture: 'Old follow-up (retired)',
  enquiry_submitted: 'Old nurture (retired)',
  newsletter_signup: 'Welcome',
  new_listings_campaign: 'New listings',
  new_listings_may_2026: 'New listings',
  new_listings_may_2026_preview: 'New listings (preview)',
  reengagement_cron: 'Re-engagement',
  manual_test: 'Test',
}

// Status -> display label, grouping (for the filter) and badge colours.
const STATUS_META = {
  sent:       { label: 'Sent',     group: 'sent',    bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  approved:   { label: 'Approved', group: 'sent',    bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  pending:    { label: 'Queued',   group: 'sent',    bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  cancelled:  { label: 'Stopped',  group: 'stopped', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  rejected:   { label: 'Not sent', group: 'stopped', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  expired:    { label: 'Expired',  group: 'stopped', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  superseded: { label: 'Replaced', group: 'stopped', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  error:      { label: 'Failed',   group: 'failed',  bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

function kindLabel(k) {
  if (!k) return '—'
  return KIND_LABELS[k] || String(k).replace(/_/g, ' ')
}

function relTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const m = Math.round((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.round(h / 24)
  if (days < 7) return `${days} d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Time until a gallery follow-up is due — sent ~10 min after the first unlock.
function dueText(firstUnlock) {
  if (!firstUnlock) return 'sending now'
  const ageMin = (Date.now() - new Date(firstUnlock).getTime()) / 60000
  const left = 10 - ageMin
  if (left > 0.5) return `sends in ~${Math.ceil(left)} min`
  return 'sending now'
}

// The subject the follow-up email will actually use — deliberately different
// from the gallery-delivery email ("Your Photo Gallery — …"). Mirrors the
// builder in process-gallery-followups.js. `subjects` holds the delivery
// subjects; the property title is the part after the first " — ".
function followupSubject(subjects) {
  if (!subjects || subjects.length !== 1) return "Questions about the homes you've been viewing?"
  const parts = String(subjects[0]).split(' — ')
  const prop = parts.length > 1 ? parts.slice(1).join(' — ') : subjects[0]
  return `Questions about ${prop}?`
}

export default function AdminEmails() {
  const [emails, setEmails] = useState([])
  const [pending, setPending] = useState([])
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const dayAgo = new Date(Date.now() - 86400000).toISOString()
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const STOPPED = ['cancelled', 'rejected', 'expired', 'superseded']
      // Enquiry auto-replies live in email_sends, not email_queue. The legacy
      // email_queue copies (template_name 'enquiry-autoreply') are excluded from
      // the email_queue side so email_sends is the single source — no double count.
      const NOT_LEGACY_REPLY = 'template_name.is.null,template_name.neq.enquiry-autoreply'
      const cnt  = (build) => build(supabase.from('email_queue').select('*', { count: 'exact', head: true }))
      const sCnt = (build) => build(supabase.from('email_sends').select('*', { count: 'exact', head: true }).eq('type', 'enquiry_auto'))

      // For the "Pending — about to send" view: recent gallery unlocks, and the
      // gallery_followup markers that show which contacts are already handled.
      const unlockWindow = new Date(Date.now() - 25 * 60000).toISOString()
      const cooldownAgo  = new Date(Date.now() - 30 * 86400000).toISOString()

      const [list, sends, sentTotal, sentWeek, sentDay, stoppedWeek, queued, failed, replyTotal, replyWeek, replyDay, unlocks, markers, activity] = await Promise.all([
        supabase.from('email_queue')
          .select('to_email,to_name,subject,status,trigger,template_name,sequence_type,created_at,sent_at')
          .order('created_at', { ascending: false })
          .limit(250),
        supabase.from('email_sends')
          .select('to_email,subject,sent_at')
          .eq('type', 'enquiry_auto')
          .order('sent_at', { ascending: false })
          .limit(250),
        cnt(q => q.eq('status', 'sent').or(NOT_LEGACY_REPLY)),
        cnt(q => q.eq('status', 'sent').or(NOT_LEGACY_REPLY).gte('created_at', weekAgo)),
        cnt(q => q.eq('status', 'sent').or(NOT_LEGACY_REPLY).gte('created_at', dayAgo)),
        cnt(q => q.in('status', STOPPED).gte('created_at', weekAgo)),
        cnt(q => q.eq('status', 'pending')),
        cnt(q => q.eq('status', 'error')),
        sCnt(q => q),
        sCnt(q => q.gte('sent_at', weekAgo)),
        sCnt(q => q.gte('sent_at', dayAgo)),
        supabase.from('email_queue')
          .select('to_email,to_name,subject,created_at,contact_id')
          .eq('trigger', 'floor_plan_requested')
          .gte('created_at', unlockWindow)
          .order('created_at', { ascending: true }),
        supabase.from('email_queue')
          .select('contact_id')
          .eq('trigger', 'gallery_followup')
          .gte('created_at', cooldownAgo)
          .not('contact_id', 'is', null),
        // Open tracking — the email_activity view (email_sends × email_opens).
        supabase.from('email_activity')
          .select('to_email,subject,sent_at,opened,open_count,first_opened_at')
          .order('sent_at', { ascending: false })
          .limit(500),
      ])

      if (list.error) throw list.error

      // email_queue rows, minus the legacy enquiry-reply copies (shown via email_sends).
      const queueRows = (list.data || []).filter(r => r.template_name !== 'enquiry-autoreply')
      // email_sends enquiry replies, normalised into the email_queue row shape.
      const replyRows = (sends && !sends.error ? (sends.data || []) : []).map(r => ({
        to_email:      r.to_email,
        to_name:       null,
        subject:       r.subject,
        status:        'sent',
        trigger:       'enquiry_autoreply',
        template_name: null,
        sequence_type: null,
        created_at:    r.sent_at,
        sent_at:       r.sent_at,
      }))
      const merged = [...queueRows, ...replyRows]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 250)

      // Attach open-tracking to each row. email_queue rows aren't linked to
      // email_sends by id, so this is a display-level join: recipient +
      // subject, nearest send time wins when the same email went out twice.
      const actRows = (activity && !activity.error ? (activity.data || []) : [])
      const actKey = (em, su) => `${String(em || '').toLowerCase()}||${String(su || '')}`
      const actMap = new Map()
      for (const a of actRows) {
        const k = actKey(a.to_email, a.subject)
        if (!actMap.has(k)) actMap.set(k, [])
        actMap.get(k).push(a)
      }
      const withOpens = merged.map(r => {
        const candidates = actMap.get(actKey(r.to_email, r.subject)) || []
        const t = new Date(r.sent_at || r.created_at || 0).getTime()
        let best = null
        for (const a of candidates) {
          const dt = Math.abs(new Date(a.sent_at || 0).getTime() - t)
          if (!best || dt < best.dt) best = { a, dt }
        }
        return { ...r, open_info: best ? best.a : null }
      })

      setEmails(withOpens)
      setCounts({
        sentTotal:   (sentTotal.count || 0) + (replyTotal.count || 0),
        sentWeek:    (sentWeek.count  || 0) + (replyWeek.count  || 0),
        sentDay:     (sentDay.count   || 0) + (replyDay.count   || 0),
        stoppedWeek: stoppedWeek.count || 0,
        queued:      queued.count || 0,
        failed:      failed.count || 0,
      })

      // Pending gallery follow-ups: contacts who unlocked inside the ~10-min
      // window and have no gallery_followup marker yet (not sent/skipped).
      const handled = new Set(((markers && markers.data) || []).map(m => m.contact_id))
      const burst = new Map()
      for (const u of ((unlocks && unlocks.data) || [])) {
        if (!u.contact_id || handled.has(u.contact_id)) continue
        const ex = burst.get(u.contact_id)
        if (!ex) {
          burst.set(u.contact_id, {
            first: u.created_at,
            to_email: u.to_email,
            to_name: u.to_name,
            subjects: u.subject ? [u.subject] : [],
          })
        } else {
          if (new Date(u.created_at) < new Date(ex.first)) ex.first = u.created_at
          if (u.subject && !ex.subjects.includes(u.subject)) ex.subjects.push(u.subject)
        }
      }
      setPending([...burst.values()].sort((a, b) => new Date(a.first) - new Date(b.first)))

      setUpdatedAt(new Date())
    } catch (e) {
      setError((e && e.message) ? e.message : 'Could not load email data.')
    } finally {
      setLoading(false)
    }
  }

  const visible = emails.filter(e => {
    if (filter === 'all') return true
    const meta = STATUS_META[e.status]
    return meta ? meta.group === filter : false
  })

  const failed = counts ? counts.failed : 0
  const healthy = failed === 0

  const cardData = counts ? [
    { n: counts.sentDay, lbl: 'Sent today' },
    { n: counts.sentWeek, lbl: 'Sent this week' },
    { n: counts.sentTotal, lbl: 'Sent all-time' },
    { n: counts.stoppedWeek, lbl: 'Stopped this week', hint: 'duplicates & cancellations blocked' },
    { n: counts.queued, lbl: 'Queued', color: counts.queued ? '#92400e' : '#2C4A5E' },
    { n: counts.failed, lbl: 'Failed', color: counts.failed ? '#991b1b' : '#065f46', hint: counts.failed ? 'needs a look' : 'all clear' },
  ] : []

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'sent', label: 'Sent' },
    { key: 'stopped', label: 'Stopped' },
    { key: 'failed', label: 'Failed' },
  ]

  const cardStyle = {
    background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '15px 16px',
  }
  const thStyle = {
    textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
    color: '#8a9aaa', padding: '11px 14px', borderBottom: '1px solid #e8e0d4',
    background: '#faf8f3', whiteSpace: 'nowrap',
  }
  const tdStyle = { padding: '11px 14px', borderBottom: '1px solid #f0ede8', verticalAlign: 'top', fontSize: 13 }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C4A5E', fontFamily: '"Playfair Display", serif', margin: 0 }}>
            Emails
          </h1>
          <p style={{ fontSize: 13, color: '#8a9aaa', marginTop: 4 }}>
            {loading
              ? 'Loading…'
              : `${visible.length} shown${updatedAt ? ` · updated ${updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            fontSize: 13, fontFamily: '"Nunito Sans", sans-serif', cursor: loading ? 'default' : 'pointer',
            background: '#2C4A5E', color: '#ffffff', border: 'none', borderRadius: 8,
            padding: '9px 16px', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Health banner */}
      {counts && (
        <div style={{
          marginBottom: 22, padding: '13px 18px', borderRadius: 12,
          borderLeft: `4px solid ${healthy ? '#2E7D52' : '#C0392B'}`,
          background: healthy ? '#ecfdf5' : '#fef2f2',
          color: healthy ? '#1E5236' : '#8E2A20',
          fontWeight: 600, fontSize: 13.5,
        }}>
          {healthy
            ? 'All healthy — no emails have failed. Nothing is going out by accident.'
            : `${failed} email${failed > 1 ? 's' : ''} failed to send — worth a look.`}
        </div>
      )}

      {/* Summary cards */}
      {counts && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {cardData.map(c => (
            <div key={c.lbl} style={cardStyle}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: c.color || '#2C4A5E' }}>
                {c.n}
              </div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8a9aaa', marginTop: 4 }}>
                {c.lbl}
              </div>
              {c.hint && <div style={{ fontSize: 11, color: '#bdb5aa', marginTop: 6 }}>{c.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Pending follow-ups — gallery unlocks inside the 10-minute window */}
      {!loading && !error && (
        <div style={{
          marginBottom: 22, background: '#ffffff', borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${pending.length ? '#fcd34d' : '#e8e0d4'}`,
        }}>
          <div style={{
            padding: '11px 16px',
            background: pending.length ? '#fffbeb' : '#faf8f3',
            borderBottom: `1px solid ${pending.length ? '#fcd34d' : '#e8e0d4'}`,
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: pending.length ? '#92400e' : '#8a9aaa',
          }}>
            {pending.length
              ? `Pending — about to send (${pending.length})`
              : 'Pending — about to send'}
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: '13px 16px', fontSize: 13, color: '#8a9aaa' }}>
              No gallery follow-ups in the 10-minute window right now — all caught up.
            </div>
          ) : (
            pending.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '11px 16px',
                borderBottom: i < pending.length - 1 ? '1px solid #f0ede8' : 'none',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#2C4A5E', fontSize: 13 }}>
                    {(p.to_name || '').trim() || p.to_email}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#8a949a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {followupSubject(p.subjects)}
                  </div>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', whiteSpace: 'nowrap',
                }}>
                  {dueText(p.first)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: 12, fontFamily: '"Nunito Sans", sans-serif', cursor: 'pointer',
              border: '1px solid ' + (filter === f.key ? '#2C4A5E' : '#e8e0d4'),
              background: filter === f.key ? '#2C4A5E' : '#ffffff',
              color: filter === f.key ? '#ffffff' : '#5A6B73',
              padding: '6px 14px', borderRadius: 8,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>When</th>
                <th style={thStyle}>To</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Opened</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8a9aaa', padding: '40px 14px' }}>Loading recent emails…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#991b1b', padding: '40px 14px' }}>
                  {error}<br /><br />Try the Refresh button above.
                </td></tr>
              )}
              {!loading && !error && visible.length === 0 && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8a9aaa', padding: '40px 14px' }}>No emails in this view.</td></tr>
              )}
              {!loading && !error && visible.map((e, i) => {
                const meta = STATUS_META[e.status] || { label: e.status || '?', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' }
                const kind = e.trigger || e.template_name || e.sequence_type || ''
                const name = (e.to_name || '').trim()
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: '#8a9aaa', whiteSpace: 'nowrap' }} title={e.created_at || ''}>
                      {relTime(e.created_at)}
                    </td>
                    <td style={tdStyle}>
                      {name && <div style={{ fontWeight: 600, color: '#2C4A5E' }}>{name}</div>}
                      <div style={{ fontSize: 12, color: '#8a949a' }}>{e.to_email || ''}</div>
                    </td>
                    <td style={{ ...tdStyle, color: '#44535B', maxWidth: 380 }}>{e.subject || ''}</td>
                    <td style={{ ...tdStyle, color: '#6B8A9E', whiteSpace: 'nowrap' }}>{kindLabel(kind)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 9px',
                        borderRadius: 20, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {(() => {
                        const wasSent = e.status === 'sent' || e.status === 'approved'
                        const oi = e.open_info
                        if (!wasSent || !oi) return <span style={{ color: '#c2bcb2' }}>—</span>
                        if (oi.opened) {
                          return (
                            <span
                              title={oi.first_opened_at ? `First opened ${new Date(oi.first_opened_at).toLocaleString('en-GB')}` : ''}
                              style={{
                                display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 9px',
                                borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Opened{oi.open_count > 1 ? ` ×${oi.open_count}` : ''}
                            </span>
                          )
                        }
                        return <span style={{ fontSize: 12, color: '#8a9aaa' }}>Not yet</span>
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#8a9aaa', lineHeight: 1.7 }}>
        <strong style={{ color: '#5A6B73' }}>Sent</strong> — delivered to the recipient.{' '}
        <strong style={{ color: '#5A6B73' }}>Stopped</strong> — the system deliberately did not send: a duplicate prevented,
        a follow-up cancelled because the person enquired, or a retired email switched off. This is the spam protection working.{' '}
        <strong style={{ color: '#5A6B73' }}>Failed</strong> — a genuine send error worth a look (you want this at zero).{' '}
        <strong style={{ color: '#5A6B73' }}>Queued</strong> — scheduled, not yet due.{' '}
        <strong style={{ color: '#5A6B73' }}>Opened</strong> — the recipient opened the email at least once (tracking pixel).
        &ldquo;Not yet&rdquo; or &ldquo;—&rdquo; can also mean their mail app blocks tracking, so treat it as a floor, not an exact count.
      </div>
    </AdminLayout>
  )
}
