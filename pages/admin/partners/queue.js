/**
 * /admin/partners/queue — the 21-5 referral queue.
 *
 * Every collection enquiry / gallery request on a 21-5 property lands here
 * automatically as a pending_review row (see lib/partnerReferrals.js).
 * Flow: review → edit/qualify → Send to partner. Nothing reaches the partner
 * until "Send" is clicked, and routing stays on the internal test address
 * until PARTNER_215_EMAIL is configured (banner shows which mode is active).
 */
import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const C = {
  ink: '#1F2F3B', navy: '#2C4A5E', gold: '#C9A84C', cream: '#F5F2EC',
  line: '#E3DDD2', sub: '#7A8794', white: '#FFFFFF',
  green: '#16a34a', amber: '#d97706', red: '#b91c1c', blue: '#2563eb',
}

const STATUS_META = {
  pending_review: { label: 'Pending review', color: C.amber, bg: '#FDF3E3' },
  qualified:      { label: 'Qualified',      color: C.blue,  bg: '#E8EFFD' },
  sent_to_partner:{ label: 'Sent to 21-5',   color: C.green, bg: '#E6F6EC' },
  rejected:       { label: 'Rejected',       color: C.red,   bg: '#FBEAEA' },
}

const SOURCE_LABEL = {
  collection_enquiry: 'Collection enquiry',
  gallery_request: 'Gallery request',
  manual: 'Manual',
}

const TABS = ['pending_review', 'qualified', 'sent_to_partner', 'rejected']

const s = {
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 },
  h1: { fontFamily: '"Playfair Display", serif', fontSize: 26, color: C.ink, margin: 0 },
  sub: { fontSize: 13, color: C.sub, marginTop: 4 },
  banner: (test) => ({
    fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 18,
    background: test ? '#FDF3E3' : '#E6F6EC',
    color: test ? '#8a5a00' : '#14532d',
    border: `1px solid ${test ? '#f0d9a8' : '#bbe3c8'}`,
  }),
  tabs: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tab: (active) => ({
    fontSize: 13, padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? C.navy : C.line}`,
    background: active ? C.navy : C.white,
    color: active ? '#fff' : C.ink, fontWeight: active ? 600 : 400,
  }),
  card: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', gap: 12, flexWrap: 'wrap' },
  who: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 220 },
  name: { fontSize: 15, fontWeight: 700, color: C.ink },
  email: { fontSize: 12.5, color: C.sub },
  chip: (meta) => ({
    fontSize: 11.5, fontWeight: 700, color: meta.color, background: meta.bg,
    padding: '3px 10px', borderRadius: 12, whiteSpace: 'nowrap',
  }),
  srcChip: { fontSize: 11.5, color: C.navy, background: '#EDF1F4', padding: '3px 10px', borderRadius: 12, whiteSpace: 'nowrap' },
  meta: { fontSize: 12, color: C.sub, whiteSpace: 'nowrap' },
  body: { borderTop: `1px solid ${C.line}`, padding: '16px 18px', display: 'grid', gap: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 },
  fieldLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.sub, marginBottom: 4, display: 'block' },
  input: { width: '100%', fontSize: 13.5, padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 6, background: '#FCFBF8', color: C.ink, boxSizing: 'border-box' },
  textarea: { width: '100%', fontSize: 13.5, padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 6, background: '#FCFBF8', color: C.ink, minHeight: 64, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  static: { fontSize: 13.5, color: C.ink },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  btn: (kind) => ({
    fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 7, cursor: 'pointer',
    border: kind === 'primary' ? 'none' : `1px solid ${C.line}`,
    background: kind === 'primary' ? C.navy : kind === 'danger' ? '#FBEAEA' : C.white,
    color: kind === 'primary' ? '#fff' : kind === 'danger' ? C.red : C.ink,
  }),
  history: { fontSize: 12, color: C.sub, borderTop: `1px dashed ${C.line}`, paddingTop: 10, display: 'grid', gap: 3 },
  empty: { padding: '48px 0', textAlign: 'center', color: C.sub, fontSize: 14 },
  error: { fontSize: 13, color: C.red, padding: '10px 14px', background: '#FBEAEA', borderRadius: 8, marginBottom: 14 },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PartnerQueue() {
  const [referrals, setReferrals] = useState([])
  const [routing, setRouting] = useState(null)
  const [tab, setTab] = useState('pending_review')
  const [openId, setOpenId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const r = await fetch('/api/admin/ui/partner-referrals?status=all', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await r.json()
    if (!r.ok) { setError(json.error || 'Could not load referrals'); setLoading(false); return }
    setReferrals(json.referrals || [])
    setRouting(json.routing || null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id, action, extra = {}) {
    setBusy(id + action); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/admin/ui/partner-referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, action, ...extra }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || `${action} failed`)
      setReferrals((rows) => rows.map((row) => (row.id === id ? json.referral : row)))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(null)
    }
  }

  function draftFor(r) {
    if (drafts[r.id]) return drafts[r.id]
    const p = r.payload || {}
    const c = r.contacts || {}
    return {
      name: p.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '',
      phone: p.phone || c.phone || '',
      budget: p.budget || '',
      destination: p.destination || '',
      message: p.message || '',
      notes: r.notes || '',
    }
  }

  function setDraft(id, key, value) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || draftFor(referrals.find((r) => r.id === id))), [key]: value } }))
  }

  async function save(r) {
    const d = draftFor(r)
    const ok = await act(r.id, 'update', {
      fields: { name: d.name, phone: d.phone, budget: d.budget, destination: d.destination, message: d.message },
      notes: d.notes,
    })
    if (ok) setDrafts((x) => { const y = { ...x }; delete y[r.id]; return y })
    return ok
  }

  async function send(r) {
    const route = routing?.[r.partner]
    const label = route?.testRouting ? `the internal review address (${route.email})` : `${r.partner} (${route?.email})`
    if (!window.confirm(`Send this lead to ${label}? This is the step that notifies the partner.`)) return
    const saved = await save(r)
    if (!saved) return
    await act(r.id, 'send')
  }

  const counts = TABS.reduce((acc, t) => ({ ...acc, [t]: referrals.filter((r) => r.status === t).length }), {})
  const visible = referrals.filter((r) => r.status === tab)
  const testMode = routing && Object.values(routing).some((r) => r.testRouting)

  return (
    <AdminLayout>
      <Head><title>Referral queue — COP Admin</title></Head>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>21-5 referral queue</h1>
          <div style={s.sub}>Collection enquiries and gallery requests land here automatically. Qualify, then send — nothing reaches the partner before you approve it.</div>
        </div>
      </div>

      {routing && (
        <div style={s.banner(testMode)}>
          {testMode
            ? <>Partner notifications currently route to the internal review address <strong>{routing['21-5']?.email}</strong>. Set <code>PARTNER_215_EMAIL</code> to activate live routing.</>
            : <>Live routing active: sends go to <strong>{routing['21-5']?.email}</strong>.</>}
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      <div style={s.tabs}>
        {TABS.map((t) => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {STATUS_META[t].label} ({counts[t] || 0})
          </button>
        ))}
      </div>

      {loading && <div style={s.empty}>Loading…</div>}
      {!loading && visible.length === 0 && (
        <div style={s.empty}>
          {tab === 'pending_review'
            ? 'No leads waiting. New collection enquiries appear here automatically.'
            : 'Nothing here yet.'}
        </div>
      )}

      {visible.map((r) => {
        const p = r.payload || {}
        const c = r.contacts || {}
        const meta = STATUS_META[r.status]
        const d = draftFor(r)
        const open = openId === r.id
        const editable = r.status === 'pending_review' || r.status === 'qualified'
        return (
          <div key={r.id} style={s.card}>
            <div style={s.cardHead} onClick={() => setOpenId(open ? null : r.id)}>
              <div style={s.who}>
                <span style={s.name}>{d.name || c.email}</span>
                <span style={s.email}>{c.email}{c.country ? ` · ${c.country}` : ''}</span>
              </div>
              <span style={s.srcChip}>{SOURCE_LABEL[r.source] || r.source}</span>
              <span style={{ ...s.meta, flex: 1 }}>{p.collection || p.property || '—'}</span>
              <span style={s.chip(meta)}>{meta.label}</span>
              <span style={s.meta}>{fmtDate(r.created_at)}</span>
            </div>

            {open && (
              <div style={s.body}>
                <div style={s.grid}>
                  <div>
                    <label style={s.fieldLabel}>Name</label>
                    {editable
                      ? <input style={s.input} value={d.name} onChange={(e) => setDraft(r.id, 'name', e.target.value)} />
                      : <div style={s.static}>{d.name || '—'}</div>}
                  </div>
                  <div>
                    <label style={s.fieldLabel}>Phone</label>
                    {editable
                      ? <input style={s.input} value={d.phone} onChange={(e) => setDraft(r.id, 'phone', e.target.value)} placeholder="Required before registration" />
                      : <div style={s.static}>{d.phone || '—'}</div>}
                  </div>
                  <div>
                    <label style={s.fieldLabel}>Budget</label>
                    {editable
                      ? <input style={s.input} value={d.budget} onChange={(e) => setDraft(r.id, 'budget', e.target.value)} />
                      : <div style={s.static}>{d.budget || '—'}</div>}
                  </div>
                  <div>
                    <label style={s.fieldLabel}>Destination</label>
                    {editable
                      ? <input style={s.input} value={d.destination} onChange={(e) => setDraft(r.id, 'destination', e.target.value)} />
                      : <div style={s.static}>{d.destination || '—'}</div>}
                  </div>
                </div>

                <div>
                  <label style={s.fieldLabel}>Their message</label>
                  {editable
                    ? <textarea style={s.textarea} value={d.message} onChange={(e) => setDraft(r.id, 'message', e.target.value)} />
                    : <div style={s.static}>{d.message || '—'}</div>}
                </div>

                <div>
                  <label style={s.fieldLabel}>Qualification notes (goes to the partner on send)</label>
                  {editable
                    ? <textarea style={s.textarea} value={d.notes} onChange={(e) => setDraft(r.id, 'notes', e.target.value)} placeholder="e.g. Budget confirmed by phone, wants Tuscany weeks in summer" />
                    : <div style={s.static}>{r.notes || '—'}</div>}
                </div>

                <div style={s.actions}>
                  {r.status === 'pending_review' && (
                    <>
                      <button style={s.btn()} disabled={!!busy} onClick={() => save(r)}>Save</button>
                      <button style={s.btn('primary')} disabled={!!busy} onClick={async () => { if (await save(r)) act(r.id, 'qualify') }}>Mark qualified</button>
                      <button style={s.btn('danger')} disabled={!!busy} onClick={() => { const why = window.prompt('Reason (optional):') ; act(r.id, 'reject', { reason: why || '' }) }}>Reject</button>
                    </>
                  )}
                  {r.status === 'qualified' && (
                    <>
                      <button style={s.btn()} disabled={!!busy} onClick={() => save(r)}>Save</button>
                      <button style={s.btn('primary')} disabled={!!busy} onClick={() => send(r)}>Send to 21-5</button>
                      <button style={s.btn()} disabled={!!busy} onClick={() => act(r.id, 'unqualify')}>Back to pending</button>
                      <button style={s.btn('danger')} disabled={!!busy} onClick={() => { const why = window.prompt('Reason (optional):'); act(r.id, 'reject', { reason: why || '' }) }}>Reject</button>
                    </>
                  )}
                  {r.status === 'sent_to_partner' && (
                    <span style={s.meta}>Sent {fmtDate(r.sent_at)} by {r.sent_by || '—'}</span>
                  )}
                  {r.status === 'rejected' && (
                    <button style={s.btn()} disabled={!!busy} onClick={() => act(r.id, 'reopen')}>Reopen</button>
                  )}
                </div>

                {Array.isArray(r.history) && r.history.length > 0 && (
                  <div style={s.history}>
                    {r.history.slice(-6).map((h, i) => (
                      <span key={i}>{fmtDate(h.at)} — {h.type}{h.detail ? ` (${h.detail})` : ''}{h.by ? ` · ${h.by}` : ''}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </AdminLayout>
  )
}
