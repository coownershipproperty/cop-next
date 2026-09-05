/**
 * /admin/replies — the review desk for Claude-drafted enquiry replies.
 *
 * Drafts sit in email_queue as 'pending_review' and go nowhere until they are
 * approved here. Approving flips the row to 'pending' and the existing
 * five-minute sender picks it up, so this page never sends anything itself.
 *
 * The lead's own words sit beside the draft on purpose: the rule that matters
 * most is that every question actually asked gets answered, and you cannot
 * check that against a subject line.
 */
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const NAVY = '#2C4A5E'
const BORDER = '#e8e0d4'
const MUTED = '#8a9aaa'

function relTime(value) {
  if (!value) return '—'
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

// The draft body is our own HTML, built from our own templates — but it is
// still rendered in an iframe so a stray tag can never touch the admin page.
function DraftPreview({ html }) {
  return (
    <iframe
      title="Draft preview"
      sandbox=""
      srcDoc={html || '<p style="font:14px sans-serif;color:#888">Empty draft</p>'}
      style={{ width: '100%', height: 320, border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff' }}
    />
  )
}

export default function ReplyDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [edits, setEdits] = useState({})
  const [editing, setEditing] = useState({})

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function load() {
    setLoading(true); setError('')
    try {
      const t = await token()
      const r = await fetch('/api/admin/ui/reply-drafts?status=pending_review', {
        headers: { Authorization: `Bearer ${t}` },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not load drafts')
      setDrafts(j.drafts || [])
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function act(id, action, extra = {}) {
    setBusy(id)
    try {
      const t = await token()
      const r = await fetch('/api/admin/ui/reply-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ id, action, ...extra }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'That did not work')
      await load()
    } catch (e) { setError(e.message) } finally { setBusy(null) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: NAVY }}>Replies to review</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
            Nothing here has been sent. Approving one hands it to the sender, which goes out within five minutes.
          </p>
        </div>
        <button onClick={load} style={btn(false)}>Refresh</button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
          padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>
      )}

      {loading && <p style={{ color: MUTED }}>Loading…</p>}

      {!loading && !drafts.length && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40, textAlign: 'center', color: MUTED }}>
          Nothing waiting. Drafts appear here as enquiries come in.
        </div>
      )}

      {drafts.map(d => {
        const ctx = d.context || {}
        const subject = edits[d.id]?.subject ?? d.subject ?? ''
        const html = edits[d.id]?.html ?? d.html ?? ''
        const dirty = !!edits[d.id]
        const isEditing = !!editing[d.id]
        return (
          <div key={d.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{d.to_name || d.to_email}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{d.to_email}</div>
              </div>
              <div style={{ fontSize: 12, color: MUTED, textAlign: 'right' }}>
                <div>Asked {relTime(ctx.askedAt || d.created_at)}</div>
                {ctx.property && <div style={{ color: '#6B8A9E', maxWidth: 320 }}>{ctx.property}</div>}
              </div>
            </div>

            {/* What they actually wrote. The whole point of reviewing. */}
            <div style={{ background: '#F7F4EE', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: MUTED, marginBottom: 6 }}>
                They wrote
              </div>
              <div style={{ fontSize: 14, color: '#44535B', whiteSpace: 'pre-wrap' }}>
                {ctx.message?.trim() || <em style={{ color: MUTED }}>No message — they submitted the form without writing anything.</em>}
              </div>
            </div>

            {ctx.unanswered?.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400e' }}>
                <strong>Could not answer from the fact tables:</strong> {ctx.unanswered.join('; ')}
              </div>
            )}

            <label style={lbl}>Subject</label>
            <input
              value={subject}
              onChange={e => setEdits(s => ({ ...s, [d.id]: { ...s[d.id], subject: e.target.value, html } }))}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, marginBottom: 12 }}
            />

            <label style={lbl}>Draft</label>
            {isEditing ? (
              <textarea
                value={html}
                onChange={e => setEdits(s => ({ ...s, [d.id]: { ...s[d.id], html: e.target.value, subject } }))}
                style={{ width: '100%', height: 320, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 8,
                  fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.5 }}
              />
            ) : (
              <DraftPreview html={html} />
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                disabled={busy === d.id}
                onClick={() => act(d.id, 'approve', dirty ? { subject, html } : {})}
                style={btn(true)}
              >
                {busy === d.id ? 'Working…' : dirty ? 'Save and send' : 'Approve and send'}
              </button>
              <button onClick={() => setEditing(s => ({ ...s, [d.id]: !s[d.id] }))} style={btn(false)}>
                {isEditing ? 'Preview' : 'Edit'}
              </button>
              {dirty && (
                <button disabled={busy === d.id} onClick={() => act(d.id, 'update', { subject, html })} style={btn(false)}>
                  Save for later
                </button>
              )}
              <button
                disabled={busy === d.id}
                onClick={() => {
                  const reason = window.prompt('Why not send this one? (optional — it helps the drafting improve)')
                  if (reason !== null) act(d.id, 'reject', { reason })
                }}
                style={{ ...btn(false), color: '#991b1b', borderColor: '#fecaca' }}
              >
                Don&apos;t send
              </button>
            </div>
          </div>
        )
      })}
    </AdminLayout>
  )
}

const lbl = { display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#8a9aaa', marginBottom: 5 }

function btn(primary) {
  return {
    fontSize: 13, fontFamily: '"Nunito Sans", sans-serif', cursor: 'pointer',
    padding: '8px 16px', borderRadius: 8,
    border: `1px solid ${primary ? NAVY : BORDER}`,
    background: primary ? NAVY : '#fff',
    color: primary ? '#fff' : '#5A6B73',
  }
}
