import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

/**
 * Admin → Follow-ups. The handover black hole, closed.
 *
 * Every lead registered with a partner sits here until it has an outcome.
 * Buckets: needs a 7-day nudge, needs a 21-day chase, fresh, and outcomes.
 * Per partner, one click composes a polite status-request email listing the
 * due leads — opened in your own mail client, so nothing is ever auto-sent.
 *
 * Guard rail Dylan asked for: leads with CRM activity in the last 7 days are
 * flagged "active conversation" and excluded from the default selection, so
 * we never chase a partner about someone we're mid-thread with.
 */

const PARTNER_EMAILS = {
  // Fill in as partners confirm their preferred status-update contact.
  myne: 'katharina.luecke@myne-homes.de',
}

function daysAgo(v) {
  if (!v) return null
  return Math.floor((Date.now() - new Date(v).getTime()) / 864e5)
}
function fmtDate(v) {
  return v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'
}

async function fetchAllPages(build) {
  const PAGE = 1000
  let from = 0
  let out = []
  for (;;) {
    const { data, error } = await build().range(from, from + PAGE - 1)
    if (error) throw error
    out = out.concat(data || [])
    if (!data || data.length < PAGE) return out
    from += PAGE
  }
}

export default function AdminFollowups() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState({}) // lead_id → bool
  const [outcomes, setOutcomes] = useState({ won: 0, lost: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [pipeline, merged, outcomeRows] = await Promise.all([
        fetchAllPages(() => supabase.from('lead_pipeline').select('*').eq('status', 'registered')),
        fetchAllPages(() => supabase.from('leads').select('id').not('merged_into_lead_id', 'is', null)),
        supabase.from('leads').select('status').in('status', ['won', 'lost', 'reservation_confirmed']).then(r => r.data || []),
      ])
      const mergedSet = new Set(merged.map(m => m.id))
      const live = pipeline.filter(r => !mergedSet.has(r.lead_id))

      // Derive partner from the property when the lead has none recorded
      const slugs = [...new Set(live.map(r => r.property_slug).filter(Boolean))]
      let partnerBySlug = {}
      if (slugs.length) {
        const props = await fetchAllPages(() =>
          supabase.from('properties').select('slug,partner').in('slug', slugs))
        partnerBySlug = Object.fromEntries(props.map(p => [p.slug, p.partner]))
      }
      const enriched = live.map(r => ({
        ...r,
        partnerKey: (r.partner || partnerBySlug[r.property_slug] || 'unknown').toLowerCase(),
        staleDays: daysAgo(r.lead_updated) ?? 0,
        activeDays: daysAgo(r.last_activity),
      }))
      setRows(enriched)
      setOutcomes({
        won: outcomeRows.filter(o => o.status === 'won' || o.status === 'reservation_confirmed').length,
        lost: outcomeRows.filter(o => o.status === 'lost').length,
      })
      // Default selection: everything due, except active conversations
      const sel = {}
      for (const r of enriched) {
        if (r.staleDays >= 7 && !(r.activeDays != null && r.activeDays < 7)) sel[r.lead_id] = true
      }
      setSelected(sel)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function setOutcome(leadId, status) {
    setRows(rs => rs.filter(r => r.lead_id !== leadId))
    const { error: err } = await supabase.from('leads').update({ status }).eq('id', leadId)
    if (err) { setError(err.message); load() }
  }

  const byPartner = useMemo(() => {
    const groups = {}
    for (const r of rows) (groups[r.partnerKey] = groups[r.partnerKey] || []).push(r)
    for (const k of Object.keys(groups)) groups[k].sort((a, b) => b.staleDays - a.staleDays)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [rows])

  const dueCount = rows.filter(r => r.staleDays >= 7).length

  function composeChaser(partnerKey, leads) {
    const chosen = leads.filter(l => selected[l.lead_id])
    if (chosen.length === 0) return
    const partnerName = partnerKey.charAt(0).toUpperCase() + partnerKey.slice(1)
    const lines = chosen.map(l =>
      `  • ${l.name || l.email}${l.property_title ? ` — ${l.property_title}` : ''} (registered ${fmtDate(l.lead_created)})`
    ).join('\n')
    const body =
      `Hi,\n\nA quick status check on the ${chosen.length === 1 ? 'lead' : `${chosen.length} leads`} below that we registered with you — could you let us know where each one stands (in conversation / viewing booked / gone quiet / closed)?\n\n${lines}\n\nIf any have gone cold on your side, just say — we'll take them back into our own nurture so nothing is wasted.\n\nThanks!\nDylan\nCo-Ownership Property\n`
    const to = PARTNER_EMAILS[partnerKey] || ''
    const href = `mailto:${to}?subject=${encodeURIComponent(`Quick status on our recent leads (${chosen.length})`)}&body=${encodeURIComponent(body)}`
    window.location.href = href
  }

  return (
    <AdminLayout>
      <Head><title>Follow-ups — COP Admin</title></Head>
      <div className="admin-page-heading">
        <div>
          <h1>Follow-ups</h1>
          <p>{loading ? 'Loading…' : `${rows.length} leads registered with partners, no outcome yet — ${dueCount} due a chase. All-time: ${outcomes.won} won · ${outcomes.lost} lost.`}</p>
        </div>
      </div>

      <div style={{ margin: '10px 0 0', padding: '10px 14px', borderRadius: 8, background: '#faf8f3', border: '1px solid #e8e0d4', color: '#6B8A9E', fontSize: 12.5, lineHeight: 1.5 }}>
        Leads sit here from the moment they're registered with a partner until you record an outcome.
        ⚠ marks an active conversation (CRM activity in the last 7 days) — those are excluded from
        chasers by default so you never nudge a partner about someone mid-thread. "Compose chaser"
        opens the email in your own mail client; nothing is ever sent automatically.
      </div>

      {error && <div className="admin-table-message error">{error}</div>}

      {byPartner.map(([partnerKey, leads]) => {
        const due = leads.filter(l => l.staleDays >= 7)
        return (
          <section key={partnerKey} className="admin-listing-card" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f0ede8' }}>
              <strong style={{ fontSize: 15, color: '#2C4A5E', textTransform: 'capitalize' }}>
                {partnerKey} <span style={{ color: '#8a9aaa', fontWeight: 400 }}>· {leads.length} open{due.length ? ` · ${due.length} due` : ''}</span>
              </strong>
              <button
                onClick={() => composeChaser(partnerKey, leads)}
                disabled={leads.filter(l => selected[l.lead_id]).length === 0}
                className="admin-secondary-button"
                style={{ cursor: 'pointer' }}
              >
                ✉ Compose chaser ({leads.filter(l => selected[l.lead_id]).length})
              </button>
            </div>
            <div className="admin-responsive-table">
              <table className="admin-listings-table">
                <thead><tr><th style={{ width: 30 }} /><th>Lead</th><th>Home</th><th>Registered</th><th>Silent for</th><th>Outcome</th></tr></thead>
                <tbody>
                  {leads.map(l => {
                    const active = l.activeDays != null && l.activeDays < 7
                    return (
                      <tr key={l.lead_id} style={l.staleDays >= 21 ? { background: '#fffbf2' } : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selected[l.lead_id]}
                            onChange={e => setSelected(s => ({ ...s, [l.lead_id]: e.target.checked }))}
                          />
                        </td>
                        <td>
                          <strong>{l.name || l.email}</strong>
                          {active && <span title={`CRM activity ${l.activeDays}d ago — active conversation`} style={{ marginLeft: 6 }}>⚠</span>}
                          <br /><small style={{ color: '#8a9aaa' }}>{l.email}</small>
                        </td>
                        <td>{l.property_title || l.main_region || '—'}</td>
                        <td>{fmtDate(l.lead_created)}</td>
                        <td style={{ color: l.staleDays >= 21 ? '#986813' : l.staleDays >= 7 ? '#2C4A5E' : '#8a9aaa', fontWeight: l.staleDays >= 7 ? 700 : 400 }}>
                          {l.staleDays}d
                        </td>
                        <td>
                          <select defaultValue="" onChange={e => e.target.value && setOutcome(l.lead_id, e.target.value)} style={{ border: '1px solid #e8e0d4', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>
                            <option value="">registered…</option>
                            <option value="won">won 🎉</option>
                            <option value="reservation_confirmed">reservation confirmed</option>
                            <option value="lost">lost — recycle to nurture</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {!loading && rows.length === 0 && (
        <div className="admin-table-message">No leads awaiting partner outcomes — the black hole is empty. 🎉</div>
      )}
    </AdminLayout>
  )
}
