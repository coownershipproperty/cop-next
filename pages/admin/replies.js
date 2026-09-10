/**
 * /admin/replies — the review desk for Claude-drafted enquiry replies.
 *
 * Drafts sit in email_queue as 'pending_review' and go nowhere until they are
 * approved here. Approving flips the row to 'pending' and the existing
 * five-minute sender picks it up, so this page never sends anything itself.
 *
 * Deliberately dressed as a Gmail reply window (David, 11 Sep 2026). Not
 * decoration: reviewing a reply is the same act as reviewing a Gmail draft,
 * and borrowing the layout people already read fluently — who it is going to,
 * what they wrote above it, the body editable in place, one blue Send — means
 * no one has to learn a second review surface. The lead's own message sits
 * above the compose box for the same reason it does in Gmail: the rule that
 * matters most is that every question actually asked gets answered, and you
 * cannot check that against a subject line.
 *
 * The body is contentEditable because the drafter writes bare <p> paragraphs
 * (see pages/api/admin/ui/reply-drafts.js) — Dylan's signature shell is
 * applied at approval, so what is edited here is exactly what the API expects
 * back.
 */
import { useEffect, useRef, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

// Gmail's own palette, so the page reads as the thing it is imitating.
const G = {
  ink:     '#202124',
  soft:    '#5f6368',
  faint:   '#80868b',
  line:    '#dadce0',
  hover:   '#f1f3f4',
  blue:    '#0b57d0',
  blueInk: '#ffffff',
  chip:    '#e8f0fe',
  chipInk: '#174ea6',
  paper:   '#ffffff',
  shell:   '#f6f8fc',
  warn:    '#fef7e0',
  warnInk: '#7a5900',
  danger:  '#d93025',
}
const FONT = "Roboto, 'Helvetica Neue', Arial, sans-serif"

const AVATAR_COLOURS = ['#1a73e8', '#d93025', '#f9ab00', '#1e8e3e', '#9334e6', '#e8710a', '#0d9488']
function avatarColour(seed = '') {
  let n = 0
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % AVATAR_COLOURS.length
  return AVATAR_COLOURS[n]
}

function initial(name = '', email = '') {
  const s = (name || email || '?').trim()
  return (s[0] || '?').toUpperCase()
}

// Gmail shows "20:46" today, "9 Sept" this year, "09/09/2025" beyond.
function gmailTime(value) {
  if (!value) return ''
  const d = new Date(value)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB')
}

function relTime(value) {
  if (!value) return ''
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const dys = Math.round(h / 24)
  return `${dys} day${dys === 1 ? '' : 's'} ago`
}

function Avatar({ name, email, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColour(email || name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 500, fontFamily: FONT,
    }}>{initial(name, email)}</div>
  )
}

/** The lead's own message, laid out as Gmail lays out a received message. */
function IncomingMessage({ ctx, d }) {
  const name = d.to_name || d.to_email
  const when = ctx.askedAt || d.created_at
  return (
    <div style={{ display: 'flex', gap: 14, padding: '16px 8px 20px' }}>
      <Avatar name={name} email={d.to_email} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: G.ink }}>{name}</span>
          <span style={{ fontSize: 12, color: G.faint }}>&lt;{d.to_email}&gt;</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: G.faint, whiteSpace: 'nowrap' }}>
            {gmailTime(when)} <span style={{ color: G.line }}>·</span> {relTime(when)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: G.soft, margin: '2px 0 10px' }}>to me</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: G.ink, whiteSpace: 'pre-wrap' }}>
          {ctx.message?.trim() || (
            <em style={{ color: G.faint }}>No message — they submitted the form without writing anything.</em>
          )}
        </div>
        {ctx.property && (
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
            background: G.chip, color: G.chipInk, borderRadius: 4, padding: '4px 10px', fontSize: 12 }}>
            {ctx.property}
          </div>
        )}
      </div>
    </div>
  )
}

/** Gmail's formatting bar. Inert — it is here so the window reads as a compose box. */
function FormatBar() {
  const item = { fontSize: 13, color: G.soft, padding: '2px 6px', borderRadius: 4, userSelect: 'none' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 12px',
      borderTop: `1px solid ${G.line}`, flexWrap: 'wrap' }}>
      <span style={{ ...item, border: `1px solid ${G.line}`, borderRadius: 4, padding: '2px 8px' }}>Sans Serif ▾</span>
      <span style={{ width: 1, height: 18, background: G.line, margin: '0 6px' }} />
      <b style={item}>B</b>
      <i style={item}>I</i>
      <u style={item}>U</u>
      <span style={{ width: 1, height: 18, background: G.line, margin: '0 6px' }} />
      <span style={item}>≡</span>
      <span style={item}>“</span>
      <span style={item}>🔗</span>
    </div>
  )
}

export default function ReplyDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [edits, setEdits] = useState({})
  const [source, setSource] = useState({})   // per-draft: show raw HTML instead of the editor
  const bodies = useRef({})

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
      setEdits({})
      bodies.current = {}
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
      <div style={{ fontFamily: FONT, maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: G.ink }}>
              Replies to review{drafts.length ? <span style={{ color: G.faint }}> ({drafts.length})</span> : null}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: G.soft, lineHeight: 1.6, maxWidth: 620 }}>
              Nothing here has been sent. Read the lead&rsquo;s message, edit the reply straight in the box,
              and press Send — it goes out through the normal sender with tracking and an unsubscribe header.
            </p>
          </div>
          <button onClick={load} style={ghostBtn}>Refresh</button>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c5221f', padding: '10px 14px',
            borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>
        )}

        {loading && <p style={{ color: G.faint, fontSize: 14 }}>Loading…</p>}

        {!loading && !drafts.length && (
          <div style={{ background: G.paper, border: `1px solid ${G.line}`, borderRadius: 12,
            padding: '56px 40px', textAlign: 'center', color: G.faint, fontSize: 14 }}>
            Nothing waiting. Replies appear here as enquiries come in.
          </div>
        )}

        {drafts.map(d => {
          const ctx = d.context || {}
          const e = edits[d.id] || {}
          const subject = e.subject ?? d.subject ?? ''
          const baseHtml = d.html || ''
          const html = e.html ?? baseHtml
          const dirty = e.subject !== undefined || e.html !== undefined
          const showSource = !!source[d.id]
          const gmailDraft = d.template_props?.gmail_draft_id

          return (
            <div key={d.id} style={{ marginBottom: 34 }}>
              {/* What they wrote */}
              <div style={{ background: G.paper, border: `1px solid ${G.line}`, borderRadius: '12px 12px 0 0', borderBottom: 0 }}>
                <IncomingMessage ctx={ctx} d={d} />
              </div>

              {ctx.unanswered?.length > 0 && (
                <div style={{ background: G.warn, color: G.warnInk, borderLeft: `1px solid ${G.line}`,
                  borderRight: `1px solid ${G.line}`, padding: '10px 16px', fontSize: 13, lineHeight: 1.5 }}>
                  <strong>Not answered from the fact tables:</strong> {ctx.unanswered.join('; ')}
                </div>
              )}

              {/* The reply, as a Gmail compose window */}
              <div style={{ background: G.paper, border: `1px solid ${G.line}`, borderRadius: '0 0 16px 16px',
                boxShadow: '0 1px 3px rgba(60,64,67,.16)', overflow: 'hidden' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderTop: `1px solid ${G.line}`, background: G.shell }}>
                  <span style={{ fontSize: 18, color: G.soft, lineHeight: 1 }}>↩</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: G.chip, color: G.chipInk, borderRadius: 12, padding: '3px 10px', fontSize: 12 }}>
                    {d.to_email}
                  </div>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: G.faint }}>from dylan@co-ownership-property.com</span>
                </div>

                <div style={{ padding: '0 16px' }}>
                  <input
                    value={subject}
                    onChange={ev => setEdits(s => ({ ...s, [d.id]: { ...s[d.id], subject: ev.target.value } }))}
                    placeholder="Subject"
                    style={{ width: '100%', padding: '11px 0', border: 0, borderBottom: `1px solid ${G.line}`,
                      fontSize: 14, fontFamily: FONT, color: G.ink, outline: 'none', background: 'transparent' }}
                  />
                </div>

                {showSource ? (
                  <textarea
                    value={html}
                    onChange={ev => setEdits(s => ({ ...s, [d.id]: { ...s[d.id], html: ev.target.value } }))}
                    spellCheck={false}
                    style={{ width: '100%', height: 340, padding: '14px 16px', border: 0, outline: 'none',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.6,
                      color: G.ink, resize: 'vertical', display: 'block' }}
                  />
                ) : (
                  <div
                    ref={el => { if (el && !bodies.current[d.id]) { el.innerHTML = html; bodies.current[d.id] = el } }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={ev => {
                      const v = ev.currentTarget.innerHTML
                      setEdits(s => ({ ...s, [d.id]: { ...s[d.id], html: v } }))
                    }}
                    style={{ minHeight: 240, padding: '14px 16px', outline: 'none',
                      fontSize: 14, lineHeight: 1.7, color: G.ink, fontFamily: FONT }}
                  />
                )}

                <FormatBar />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', flexWrap: 'wrap' }}>
                  {gmailDraft ? (
                    <a href="https://mail.google.com/mail/u/0/#drafts" target="_blank" rel="noreferrer"
                      style={{ ...sendBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Open in Gmail
                    </a>
                  ) : (
                    <button
                      disabled={busy === d.id}
                      onClick={() => act(d.id, 'approve', dirty ? { subject, html } : {})}
                      style={{ ...sendBtn, opacity: busy === d.id ? 0.6 : 1 }}
                    >
                      {busy === d.id ? 'Sending…' : 'Send'}
                    </button>
                  )}

                  {dirty && !gmailDraft && (
                    <button disabled={busy === d.id} onClick={() => act(d.id, 'update', { subject, html })} style={ghostBtn}>
                      Save draft
                    </button>
                  )}

                  <button onClick={() => setSource(s => ({ ...s, [d.id]: !s[d.id] }))} style={ghostBtn}>
                    {showSource ? 'Rich text' : 'Edit HTML'}
                  </button>

                  <span style={{ flex: 1 }} />

                  {dirty && <span style={{ fontSize: 12, color: G.faint }}>Edited — signature is added on send</span>}

                  <button
                    title="Discard this reply"
                    disabled={busy === d.id}
                    onClick={() => {
                      const reason = window.prompt('Why not send this one? (optional — it helps the drafting improve)')
                      if (reason !== null) act(d.id, 'reject', { reason })
                    }}
                    style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18,
                      color: G.soft, padding: '4px 8px', borderRadius: 4 }}
                  >🗑</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}

const sendBtn = {
  background: G.blue, color: G.blueInk, border: 0, borderRadius: 18,
  padding: '9px 26px', fontSize: 14, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
}

const ghostBtn = {
  background: '#fff', color: G.soft, border: `1px solid ${G.line}`, borderRadius: 18,
  padding: '8px 16px', fontSize: 13, fontFamily: FONT, cursor: 'pointer',
}
