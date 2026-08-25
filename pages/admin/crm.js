/**
 * Canonical COP Admin Leads view, exposed at /admin/leads.
 *
 * Reads the same Supabase tables as cop-crm.vercel.app (contacts / leads /
 * activities / partner_referrals) through the browser session — access is
 * gated by the crm_admins RLS policy, same as the standalone CRM.
 * All list queries are paged; nothing relies on an unbounded select
 * (PostgREST silently caps those at 1,000 rows — the old newsletter bug).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const C = {
  ink: '#1F2F3B', navy: '#2C4A5E', gold: '#C9A84C', cream: '#F5F2EC',
  line: '#E3DDD2', sub: '#7A8794', white: '#FFFFFF',
}

const STATUS_LABELS = {
  new_lead: 'New lead', contacted: 'Contacted', lead_replied: 'Replied',
  hot_lead: 'Hot lead', qualified: 'Qualified', passive_interest: 'Passive interest',
  registered: 'Registered', reservation_confirmed: 'Reserved',
  transferred_to_partner: 'Transferred', won: 'Won', lost: 'Lost',
}
const STATUS_COLORS = {
  new_lead: '#2563eb', contacted: '#d97706', lead_replied: '#7c3aed',
  hot_lead: '#dc2626', qualified: '#0891b2', registered: '#16a34a',
  reservation_confirmed: '#16a34a', won: '#15803d', lost: '#6b7280',
}

const PAGE_SIZE = 50

const s = {
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 },
  h1: { fontFamily: '"Playfair Display", serif', fontSize: 26, color: C.ink, margin: 0 },
  stats: { display: 'flex', gap: 22, fontSize: 13, color: C.sub, marginBottom: 18, flexWrap: 'wrap' },
  statNum: { color: C.ink, fontWeight: 700 },
  bar: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  input: { fontSize: 13.5, padding: '9px 12px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink, minWidth: 230 },
  select: { fontSize: 13.5, padding: '9px 10px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink },
  btn: { fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${C.line}`, background: C.white, color: C.ink },
  tableWrap: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 900 },
  th: { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.sub, padding: '12px 14px', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', borderBottom: `1px solid #F0EBE2`, color: C.ink, verticalAlign: 'top' },
  rowName: { fontWeight: 600, cursor: 'pointer', color: C.navy },
  dim: { color: C.sub, fontSize: 12.5 },
  chip: (color) => ({ fontSize: 11.5, fontWeight: 700, color: color || C.sub, background: `${color || C.sub}18`, padding: '2px 9px', borderRadius: 11, whiteSpace: 'nowrap', display: 'inline-block' }),
  queueChip: { fontSize: 11, fontWeight: 700, color: '#8a5a00', background: '#FDF3E3', padding: '2px 8px', borderRadius: 10, marginLeft: 6, whiteSpace: 'nowrap' },
  pager: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 2px', fontSize: 13, color: C.sub },
  drawerWrap: { position: 'fixed', inset: 0, background: 'rgba(31,47,59,0.35)', zIndex: 60 },
  drawer: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 94vw)', background: C.white, zIndex: 61, boxShadow: '-12px 0 40px rgba(0,0,0,0.18)', overflowY: 'auto', padding: '26px 28px' },
  drawerH: { fontFamily: '"Playfair Display", serif', fontSize: 22, color: C.ink, margin: '0 0 2px' },
  section: { margin: '20px 0 0' },
  sectionH: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.sub, marginBottom: 8 },
  leadRow: { border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, fontSize: 13 },
  actRow: { display: 'flex', gap: 10, fontSize: 12.5, color: C.ink, padding: '7px 0', borderBottom: '1px dashed #F0EBE2' },
  empty: { padding: '48px 0', textAlign: 'center', color: C.sub, fontSize: 14 },
}

function fmtDate(iso, withTime = false) {
  if (!iso) return '—'
  const opts = withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(iso).toLocaleString('en-GB', opts)
}

function fullName(c) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || '—'
}

/** Page through a query builder until exhausted (respects the 1,000-row cap). */
async function fetchAllPages(makeQuery, pageSize = 1000) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

export default function CrmLeads() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [source, setSource] = useState('')
  const [regionOptions, setRegionOptions] = useState([])
  const [sourceOptions, setSourceOptions] = useState([])
  const [partnerBySlug, setPartnerBySlug] = useState({})
  const [queueContacts, setQueueContacts] = useState(new Set())
  const [stats, setStats] = useState(null)
  const [openContact, setOpenContact] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // One-time: filter options, property→partner map, queue badges, stats.
  useEffect(() => {
    (async () => {
      try {
        const [leadMeta, props, queue] = await Promise.all([
          fetchAllPages(() => supabase.from('leads').select('main_region, property_slug').order('id')),
          fetchAllPages(() => supabase.from('properties').select('slug, partner').order('slug')),
          supabase.from('partner_referrals').select('contact_id, status').in('status', ['pending_review', 'qualified']).limit(1000),
        ])
        setRegionOptions([...new Set(leadMeta.map((l) => l.main_region).filter(Boolean))].sort())
        setPartnerBySlug(Object.fromEntries(props.map((p) => [p.slug, p.partner])))
        setQueueContacts(new Set((queue.data || []).map((r) => r.contact_id)))

        const { count: contactCount } = await supabase.from('contacts').select('id', { count: 'exact', head: true })
        const { count: leadCount } = await supabase.from('leads').select('id', { count: 'exact', head: true })
        const weekAgo = new Date(Date.now() - 7 * 86400e3).toISOString()
        const { count: newWeek } = await supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo)
        setStats({ contactCount, leadCount, newWeek, queueCount: (queue.data || []).length })

        const { data: src } = await supabase.from('contacts').select('source').order('source').range(0, 999)
        setSourceOptions([...new Set((src || []).map((r) => r.source).filter(Boolean))].sort())
      } catch (e) {
        console.error('CRM meta load failed:', e.message)
      }
    })()
  }, [])

  const buildQuery = useCallback((forCount = false) => {
    const needInner = status || region
    const embed = needInner
      ? 'leads!inner(id,status,property_slug,property_title,main_region,subregion,budget_max,partner,message,created_at)'
      : 'leads(id,status,property_slug,property_title,main_region,subregion,budget_max,partner,message,created_at)'
    let q = supabase.from('contacts').select(`id,email,first_name,last_name,phone,country,source,locale,score,created_at,updated_at,${embed}`, forCount ? { count: 'exact' } : {})
    if (status) q = q.eq('leads.status', status)
    if (region) q = q.eq('leads.main_region', region)
    if (source) q = q.eq('source', source)
    if (search) {
      const like = `%${search.replaceAll('%', '').replaceAll(',', '')}%`
      q = q.or(`email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`)
    }
    return q.order('created_at', { ascending: false })
  }, [status, region, source, search])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, count, error: err } = await buildQuery(true).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      if (err) throw err
      setRows(data || [])
      setTotal(count || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [buildQuery, page])

  useEffect(() => { load() }, [load])

  async function openDrawer(contact) {
    setOpenContact(contact)
    setDetail(null)
    const [acts, referrals] = await Promise.all([
      supabase.from('activities').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('partner_referrals').select('id,status,partner,source,created_at,sent_at').eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(10),
    ])
    setDetail({ activities: acts.data || [], referrals: referrals.data || [] })
  }

  async function exportCsv() {
    try {
      const all = await fetchAllPages(() => buildQuery(false))
      const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
      const lines = ['email,first_name,last_name,phone,country,source,created,statuses,regions,properties']
      for (const c of all) {
        const leads = c.leads || []
        lines.push([
          esc(c.email), esc(c.first_name), esc(c.last_name), esc(c.phone), esc(c.country),
          esc(c.source), esc((c.created_at || '').slice(0, 10)),
          esc([...new Set(leads.map((l) => l.status).filter(Boolean))].join('; ')),
          esc([...new Set(leads.map((l) => l.main_region).filter(Boolean))].join('; ')),
          esc([...new Set(leads.map((l) => l.property_title).filter(Boolean))].join('; ')),
        ].join(','))
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `cop-leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError('Export failed: ' + e.message)
    }
  }

  function partnersFor(contact) {
    const set = new Set()
    for (const l of contact.leads || []) {
      const p = l.partner || partnerBySlug[l.property_slug]
      if (p) set.add(p)
    }
    return [...set]
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const statusOptions = useMemo(() => Object.entries(STATUS_LABELS), [])

  return (
    <AdminLayout>
      <Head><title>Leads — COP Admin</title></Head>
      <div style={s.header}>
        <h1 style={s.h1}>All leads</h1>
        <Link href="/admin/partners/queue" style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>
          → 21-5 referral queue{stats?.queueCount ? ` (${stats.queueCount} open)` : ''}
        </Link>
      </div>
      {stats && (
        <div style={s.stats}>
          <span><span style={s.statNum}>{stats.contactCount?.toLocaleString()}</span> contacts</span>
          <span><span style={s.statNum}>{stats.leadCount?.toLocaleString()}</span> leads</span>
          <span><span style={s.statNum}>{stats.newWeek?.toLocaleString()}</span> new this week</span>
          <span><span style={s.statNum}>{stats.queueCount?.toLocaleString()}</span> in referral queue</span>
        </div>
      )}

      <div style={s.bar}>
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput.trim()) }}>
          <input style={s.input} placeholder="Search name or email… (enter)" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </form>
        <select style={s.select} value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}>
          <option value="">All statuses</option>
          {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.select} value={region} onChange={(e) => { setPage(0); setRegion(e.target.value) }}>
          <option value="">All regions</option>
          {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={s.select} value={source} onChange={(e) => { setPage(0); setSource(e.target.value) }}>
          <option value="">All sources</option>
          {sourceOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button style={s.btn} onClick={exportCsv}>↓ CSV</button>
      </div>

      {error && <div style={{ ...s.empty, color: '#b91c1c' }}>{error}</div>}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Phone</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Region</th>
              <th style={s.th}>Partner</th>
              <th style={s.th}>Budget</th>
              <th style={s.th}>Source</th>
              <th style={s.th}>First seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const leads = c.leads || []
              const latest = leads.length ? leads.reduce((a, b) => (a.created_at > b.created_at ? a : b)) : null
              const regions = [...new Set(leads.map((l) => l.main_region).filter(Boolean))]
              const budgets = leads.map((l) => l.budget_max).filter(Boolean)
              return (
                <tr key={c.id}>
                  <td style={s.td}>
                    <span style={s.rowName} onClick={() => openDrawer(c)}>{fullName(c)}</span>
                    {leads.length > 1 && <span style={{ ...s.dim, marginLeft: 6 }}>{leads.length}</span>}
                    {queueContacts.has(c.id) && <span style={s.queueChip}>21-5 queue</span>}
                    <div style={s.dim}>{c.email}</div>
                  </td>
                  <td style={s.td}>{c.phone || '—'}</td>
                  <td style={s.td}>
                    {latest
                      ? <span style={s.chip(STATUS_COLORS[latest.status])}>{STATUS_LABELS[latest.status] || latest.status}</span>
                      : <span style={s.dim}>—</span>}
                  </td>
                  <td style={s.td}>{regions.slice(0, 2).join(' / ') || '—'}{regions.length > 2 ? ` +${regions.length - 2}` : ''}</td>
                  <td style={s.td}>{partnersFor(c).join(' / ') || '—'}</td>
                  <td style={s.td}>{budgets.length ? `€${Math.max(...budgets).toLocaleString()}` : '—'}</td>
                  <td style={s.td}><span style={s.dim}>{c.source || '—'}</span></td>
                  <td style={s.td}><span style={s.dim}>{fmtDate(c.created_at)}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {loading && <div style={s.empty}>Loading…</div>}
        {!loading && rows.length === 0 && <div style={s.empty}>No contacts match.</div>}
      </div>

      <div style={s.pager}>
        <button style={s.btn} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {page + 1} of {pages} · {total.toLocaleString()} contacts</span>
        <button style={s.btn} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>

      {openContact && (
        <>
          <div style={s.drawerWrap} onClick={() => setOpenContact(null)} />
          <div style={s.drawer}>
            <h2 style={s.drawerH}>{fullName(openContact)}</h2>
            <div style={s.dim}>
              {openContact.email}{openContact.phone ? ` · ${openContact.phone}` : ''}{openContact.country ? ` · ${openContact.country}` : ''}
              {' · '}score {openContact.score ?? 0} · since {fmtDate(openContact.created_at)}
            </div>

            {detail?.referrals?.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionH}>Partner referrals</div>
                {detail.referrals.map((r) => (
                  <div key={r.id} style={s.leadRow}>
                    <strong>{r.partner}</strong> · {r.status.replaceAll('_', ' ')} · {r.source.replaceAll('_', ' ')} · {fmtDate(r.sent_at || r.created_at)}
                    {' '}<Link href="/admin/partners/queue" style={{ color: C.navy }}>open queue →</Link>
                  </div>
                ))}
              </div>
            )}

            <div style={s.section}>
              <div style={s.sectionH}>Leads ({(openContact.leads || []).length})</div>
              {(openContact.leads || []).map((l) => (
                <div key={l.id} style={s.leadRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/admin/leads/${l.id}`} style={{ color: C.navy, fontWeight: 700 }}>
                      {l.property_title || l.main_region || 'General enquiry'}
                    </Link>
                    <span style={s.chip(STATUS_COLORS[l.status])}>{STATUS_LABELS[l.status] || l.status}</span>
                  </div>
                  <div style={s.dim}>
                    {[l.main_region, l.subregion].filter(Boolean).join(' / ')}
                    {l.budget_max ? ` · up to €${Number(l.budget_max).toLocaleString()}` : ''}
                    {` · ${fmtDate(l.created_at)}`}
                  </div>
                  {l.message && <div style={{ marginTop: 4 }}>{l.message}</div>}
                  <Link href={`/admin/leads/${l.id}`} style={{ display: 'inline-block', marginTop: 7, color: C.navy, fontSize: 12, fontWeight: 700 }}>
                    Open lead and select listings →
                  </Link>
                </div>
              ))}
              {(openContact.leads || []).length === 0 && <div style={s.dim}>No leads.</div>}
            </div>

            <div style={s.section}>
              <div style={s.sectionH}>Activity</div>
              {!detail && <div style={s.dim}>Loading…</div>}
              {detail?.activities?.map((a) => (
                <div key={a.id} style={s.actRow}>
                  <span style={{ ...s.dim, minWidth: 118 }}>{fmtDate(a.created_at, true)}</span>
                  <span>{a.description || a.type}</span>
                </div>
              ))}
              {detail && detail.activities.length === 0 && <div style={s.dim}>No activity recorded.</div>}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
