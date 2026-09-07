import { useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

/**
 * /admin/sent — every email that left COP, laid out like Gmail's Sent folder.
 *
 * Why this exists: replies approved in /admin/replies, gallery photos, alerts
 * and auto-replies all go out through Resend, not Gmail, so Gmail's own Sent
 * folder never shows them (David, 6 Sep 2026). This is that folder.
 *
 * Reads email_queue (status = sent — the stored HTML is exactly what went out)
 * plus the legacy enquiry auto-replies that only exist in email_sends (no copy
 * of the body was kept before 6 Sep 2026). Open tracking comes from the
 * email_activity view, matched on recipient + subject + nearest send time.
 * Selecting a row shows the whole conversation with that person: every email
 * we sent them, newest expanded, the rest collapsed — the way a Gmail thread
 * reads. (Their replies live in Gmail; they are not in this database yet.)
 */

const KIND = {
  floor_plan_requested: { label: 'Gallery',     color: '#5f6368' },
  gallery_followup:     { label: 'Follow-up',   color: '#5f6368' },
  gallery_autoreply:    { label: 'Auto-reply',  color: '#5f6368' },
  enquiry_submitted:    { label: 'Auto-reply',  color: '#5f6368' },
  enquiry_autoreply:    { label: 'Auto-reply',  color: '#5f6368' },
  enquiry_reply:        { label: 'Reply',       color: '#1a73e8' },
  enquiry_reply_draft:  { label: 'Reply',       color: '#1a73e8' },
  search_saved:         { label: 'Alert set',   color: '#5f6368' },
  new_property_match:   { label: 'Alert',       color: '#5f6368' },
  property_watch_alert: { label: 'Alert',       color: '#5f6368' },
  sold_waitlist:        { label: 'Waitlist',    color: '#5f6368' },
  property_watch:       { label: 'Watch',       color: '#5f6368' },
  newsletter_signup:    { label: 'Welcome',     color: '#5f6368' },
  listing_application:  { label: 'Application', color: '#5f6368' },
  partner_contact_check:{ label: 'Check-in',    color: '#5f6368' },
}
const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'reply',   label: 'Replies', match: (t) => ['enquiry_reply', 'enquiry_reply_draft'].includes(t) },
  { key: 'auto',    label: 'Auto-replies', match: (t) => ['gallery_autoreply', 'enquiry_submitted', 'enquiry_autoreply'].includes(t) },
  { key: 'gallery', label: 'Galleries', match: (t) => ['floor_plan_requested', 'gallery_followup'].includes(t) },
  { key: 'alerts',  label: 'Alerts', match: (t) => ['search_saved', 'new_property_match', 'property_watch_alert', 'sold_waitlist', 'property_watch'].includes(t) },
]

const AVATAR_COLORS = ['#1E3448', '#7c4dff', '#0b8043', '#c5221f', '#e37400', '#00897b', '#3949ab', '#ad1457']
function avatarColor(s) {
  let h = 0
  for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function initials(name, email) {
  const n = String(name || '').trim()
  if (n) return n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return String(email || '?')[0].toUpperCase()
}
function gmailDate(value, long = false) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  if (long) {
    return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function snippet(html, n = 110) {
  const text = String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > n ? text.slice(0, n - 1) + '…' : text
}

// The email itself, rendered in a sandbox that grows to fit the content.
function MailBody({ html }) {
  const ref = useRef(null)
  const [h, setH] = useState(240)
  const doc = html || '<p style="font:14px Arial;color:#888">No copy of this email was kept — it was sent before 6 September 2026, when every send started being recorded.</p>'
  return (
    <iframe
      ref={ref}
      title="Email"
      sandbox="allow-same-origin"
      srcDoc={doc}
      onLoad={() => {
        try {
          const d = ref.current?.contentDocument
          const next = Math.max(120, Math.min(4000, (d?.documentElement?.scrollHeight || d?.body?.scrollHeight || 240) + 16))
          setH(next)
        } catch { /* cross-origin never happens with srcDoc, but stay quiet */ }
      }}
      style={{ width: '100%', height: h, border: 0, display: 'block', background: '#fff' }}
    />
  )
}

const CSS = `
        .gm { display: flex; flex-direction: column; height: calc(100vh - 24px); background: #fff; font-family: 'Google Sans', Roboto, -apple-system, 'Segoe UI', Arial, sans-serif; color: #202124; }
        .gm-top { display: flex; align-items: center; gap: 14px; padding: 12px 20px; border-bottom: 1px solid #e0e0e0; flex-wrap: wrap; }
        .gm-title { font-size: 22px; font-weight: 400; color: #202124; min-width: 60px; }
        .gm-search { flex: 1 1 380px; display: flex; align-items: center; gap: 10px; background: #eaf1fb; border-radius: 24px; padding: 0 16px; height: 46px; }
        .gm-search span { color: #5f6368; font-size: 18px; }
        .gm-search input { flex: 1; border: 0; background: transparent; font-size: 15px; outline: none; color: #202124; }
        .gm-search button { border: 0; background: transparent; font-size: 20px; color: #5f6368; cursor: pointer; }
        .gm-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .gm-chips button { border: 1px solid #dadce0; background: #fff; border-radius: 16px; padding: 6px 12px; font-size: 13px; color: #3c4043; cursor: pointer; }
        .gm-chips button.on { background: #c2e7ff; border-color: #c2e7ff; color: #001d35; }
        .gm-count { font-size: 12px; color: #5f6368; margin-left: auto; }
        .gm-refresh { border: 0; background: transparent; font-size: 18px; color: #5f6368; cursor: pointer; padding: 6px; border-radius: 50%; }
        .gm-refresh:hover { background: #f1f3f4; }
        .gm-error { margin: 12px 20px; padding: 10px 14px; background: #fce8e6; color: #c5221f; border-radius: 8px; font-size: 13px; }
        .gm-split { display: grid; grid-template-columns: 1fr; flex: 1; min-height: 0; }
        .gm-split.has-reading { grid-template-columns: minmax(360px, 42%) 1fr; }
        .gm-list { overflow: auto; border-right: 1px solid #e0e0e0; }
        .gm-empty { padding: 40px; text-align: center; color: #5f6368; }
        .gm-row { display: grid; grid-template-columns: 40px 190px 1fr auto; align-items: center; gap: 12px; padding: 0 16px; height: 44px; border-bottom: 1px solid #f1f3f4; cursor: pointer; font-size: 14px; }
        .gm-row:hover { box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); z-index: 1; position: relative; }
        .gm-row.active { background: #c2dbff; }
        .gm-avatar { width: 32px; height: 32px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; flex: none; }
        .gm-avatar.dylan { background: #1E3448; width: 40px; height: 40px; font-size: 16px; }
        .gm-who { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #202124; }
        .gm-subj { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #202124; }
        .gm-kind { display: inline-block; font-size: 11px; font-weight: 500; letter-spacing: .02em; text-transform: uppercase; margin-right: 8px; padding: 1px 6px; border-radius: 4px; background: #f1f3f4; }
        .gm-snip { color: #5f6368; }
        .gm-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5f6368; white-space: nowrap; }
        .gm-open { color: #188038; font-weight: 500; }
        .gm-more { display: block; width: 100%; padding: 14px; border: 0; background: #f8f9fa; color: #1a73e8; font-size: 13px; cursor: pointer; }
        .gm-read { overflow: auto; padding: 0 28px 40px; }
        .gm-read-head { display: flex; align-items: center; gap: 12px; padding: 18px 0 8px; flex-wrap: wrap; }
        .gm-read-head h1 { font-size: 22px; font-weight: 400; margin: 0; color: #202124; flex: 1 1 auto; }
        .gm-back { border: 0; background: transparent; font-size: 20px; cursor: pointer; color: #5f6368; padding: 4px 8px; border-radius: 50%; }
        .gm-back:hover { background: #f1f3f4; }
        .gm-thread-count { font-size: 12px; color: #5f6368; flex-basis: 100%; }
        .gm-msg { border: 1px solid #e0e0e0; border-radius: 8px; margin: 8px 0; background: #fff; }
        .gm-msg-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; }
        .gm-msg-from { flex: 1; min-width: 0; font-size: 14px; }
        .gm-addr { color: #5f6368; font-size: 12px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .gm-msg:not(.open) .gm-msg-head { opacity: .85; }
        .gm-msg-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #5f6368; white-space: nowrap; }
        .gm-msg-body { border-top: 1px solid #f1f3f4; }
        .gm-recs { padding: 8px 16px 12px; font-size: 12px; color: #5f6368; border-top: 1px dashed #e0e0e0; }
        .gm-note { font-size: 12px; color: #5f6368; margin: 18px 0 0; }
        @media (max-width: 900px) {
          .gm-split.has-reading { grid-template-columns: 1fr; }
          .gm-split.has-reading .gm-list { display: none; }
          .gm-row { grid-template-columns: 36px 1fr auto; }
          .gm-who { display: none; }
        }
`

export default function SentMail() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [limit, setLimit] = useState(150)

  async function load() {
    setLoading(true); setError('')
    try {
      const [queue, sends, activity] = await Promise.all([
        supabase.from('email_queue')
          .select('id,to_email,to_name,subject,html,trigger,template_name,sent_at,created_at,contact_id,template_props,notes')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        supabase.from('email_sends')
          .select('id,to_email,subject,sent_at,contact_id,property_title')
          .eq('type', 'enquiry_auto')
          .order('sent_at', { ascending: false })
          .limit(limit),
        supabase.from('email_activity')
          .select('to_email,subject,sent_at,opened,open_count,first_opened_at')
          .order('sent_at', { ascending: false })
          .limit(1000),
      ])
      if (queue.error) throw queue.error

      // Every queue row stays — including the enquiry auto-reply copies
      // recorded since 6 Sep 2026 (a filter here used to drop them, so the
      // page showed "no copy kept" for the very emails it was built to show).
      const queueRows = (queue.data || [])
        .map((r) => ({ ...r, id: `q_${r.id}`, when: r.sent_at || r.created_at, kind: r.trigger }))

      // Legacy auto-replies: only those without a stored copy in email_queue
      // (from 6 Sep 2026 the auto-reply is recorded there with its HTML).
      const nearQueue = (email, t) => queueRows.some((r) =>
        r.kind === 'enquiry_submitted' && r.to_email?.toLowerCase() === String(email).toLowerCase() &&
        Math.abs(new Date(r.when) - new Date(t)) < 3 * 60000)
      const sendRows = (sends.data || [])
        .filter((s) => !nearQueue(s.to_email, s.sent_at))
        .map((s) => ({
          id: `s_${s.id}`, to_email: s.to_email, to_name: null, subject: s.subject, html: null,
          kind: 'enquiry_autoreply', when: s.sent_at, contact_id: s.contact_id, template_props: null,
        }))

      // Open tracking — display-level join on recipient + subject, nearest send.
      const actMap = new Map()
      for (const a of (activity.data || [])) {
        const k = `${String(a.to_email || '').toLowerCase()}||${a.subject || ''}`
        if (!actMap.has(k)) actMap.set(k, [])
        actMap.get(k).push(a)
      }
      const withOpens = [...queueRows, ...sendRows].map((r) => {
        const cands = actMap.get(`${String(r.to_email || '').toLowerCase()}||${r.subject || ''}`) || []
        const t = new Date(r.when || 0).getTime()
        let best = null
        for (const a of cands) {
          const dt = Math.abs(new Date(a.sent_at || 0).getTime() - t)
          if (!best || dt < best.dt) best = { a, dt }
        }
        return { ...r, opens: best ? best.a : null }
      })
      withOpens.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0))

      // Names: fill from any row that knows this address.
      const nameByEmail = new Map()
      for (const r of withOpens) if (r.to_name && !nameByEmail.has(r.to_email)) nameByEmail.set(r.to_email, r.to_name)
      setRows(withOpens.map((r) => ({ ...r, to_name: r.to_name || nameByEmail.get(r.to_email) || null })))
    } catch (e) {
      setError(e.message || 'Could not load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [limit]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (f?.match && !f.match(r.kind)) return false
      if (!needle) return true
      return [r.to_name, r.to_email, r.subject, snippet(r.html, 400)].some((v) => String(v || '').toLowerCase().includes(needle))
    })
  }, [rows, filter, q])

  const selected = rows.find((r) => r.id === selectedId) || null
  const thread = useMemo(() => {
    if (!selected) return []
    const em = String(selected.to_email || '').toLowerCase()
    return rows.filter((r) => String(r.to_email || '').toLowerCase() === em)
      .sort((a, b) => new Date(a.when || 0) - new Date(b.when || 0))
  }, [rows, selected])

  useEffect(() => { if (selected) setExpanded({ [selected.id]: true }) }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AdminLayout fullBleed>
      <div className="gm">
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="gm-top">
          <div className="gm-title">Sent</div>
          <div className="gm-search">
            <span aria-hidden="true">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sent mail — name, email, subject, words in the email" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search">×</button>}
          </div>
          <div className="gm-chips">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
          <div className="gm-count">{loading ? 'Loading…' : `${visible.length} of ${rows.length}`}</div>
          <button type="button" className="gm-refresh" onClick={load} title="Refresh">↻</button>
        </div>

        {error && <div className="gm-error">{error}</div>}

        <div className={`gm-split${selected ? ' has-reading' : ''}`}>
          {/* ── Message list ────────────────────────────────────────── */}
          <div className="gm-list" role="list">
            {!loading && visible.length === 0 && <div className="gm-empty">Nothing here.</div>}
            {visible.map((r) => {
              const k = KIND[r.kind] || { label: r.kind || '—', color: '#5f6368' }
              const active = r.id === selectedId
              return (
                <div key={r.id} role="listitem" className={`gm-row${active ? ' active' : ''}`} onClick={() => setSelectedId(r.id)}>
                  <div className="gm-avatar" style={{ background: avatarColor(r.to_email) }}>{initials(r.to_name, r.to_email)}</div>
                  <div className="gm-who">
                    <span className="gm-to">To: {r.to_name || r.to_email}</span>
                  </div>
                  <div className="gm-subj">
                    <span className="gm-kind" style={{ color: k.color }}>{k.label}</span>
                    <span className="gm-subject">{r.subject || '(no subject)'}</span>
                    {r.html && <span className="gm-snip"> — {snippet(r.html)}</span>}
                  </div>
                  <div className="gm-meta">
                    {r.opens?.opened && <span className="gm-open" title={r.opens.first_opened_at ? `First opened ${gmailDate(r.opens.first_opened_at, true)}` : 'Opened'}>✓{r.opens.open_count > 1 ? `×${r.opens.open_count}` : ''}</span>}
                    <span className="gm-date">{gmailDate(r.when)}</span>
                  </div>
                </div>
              )
            })}
            {!loading && rows.length >= limit && (
              <button type="button" className="gm-more" onClick={() => setLimit(limit + 150)}>Load older</button>
            )}
          </div>

          {/* ── Reading pane: the conversation with this person ─────── */}
          {selected && (
            <div className="gm-read">
              <div className="gm-read-head">
                <button type="button" className="gm-back" onClick={() => setSelectedId(null)} aria-label="Close">←</button>
                <h1>{selected.subject || '(no subject)'}</h1>
                <span className="gm-thread-count">{thread.length} email{thread.length === 1 ? '' : 's'} to {selected.to_name || selected.to_email}</span>
              </div>

              {thread.map((m) => {
                const open = !!expanded[m.id]
                const k = KIND[m.kind] || { label: m.kind || '—', color: '#5f6368' }
                return (
                  <div key={m.id} className={`gm-msg${open ? ' open' : ''}`}>
                    <div className="gm-msg-head" onClick={() => setExpanded((s) => ({ ...s, [m.id]: !open }))}>
                      <div className="gm-avatar dylan">D</div>
                      <div className="gm-msg-from">
                        <div><strong>Dylan Olsson</strong> <span className="gm-addr">&lt;dylan@co-ownership-property.com&gt;</span></div>
                        {open
                          ? <div className="gm-addr">to {m.to_name ? `${m.to_name} <${m.to_email}>` : m.to_email}</div>
                          : <div className="gm-addr gm-collapsed-snip">{m.subject}{m.html ? ` — ${snippet(m.html, 90)}` : ''}</div>}
                      </div>
                      <div className="gm-msg-meta">
                        <span className="gm-kind" style={{ color: k.color }}>{k.label}</span>
                        {m.opens?.opened && <span className="gm-open" title={m.opens.first_opened_at ? `First opened ${gmailDate(m.opens.first_opened_at, true)}` : 'Opened'}>Opened{m.opens.open_count > 1 ? ` ×${m.opens.open_count}` : ''}</span>}
                        <span className="gm-date">{gmailDate(m.when, open)}</span>
                      </div>
                    </div>
                    {open && (
                      <div className="gm-msg-body">
                        <MailBody html={m.html} />
                        {m.template_props?.recommended?.length > 0 && (
                          <div className="gm-recs">
                            Homes recommended in this email: {m.template_props.recommended.map((p) => p.title || p.slug).join(' · ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <p className="gm-note">Their replies arrive in Gmail and are not in this database yet — this shows only what COP sent.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </AdminLayout>
  )
}
