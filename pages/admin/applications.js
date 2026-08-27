import { useEffect, useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

// Admin → Applications. Review queue for the public "List with COP" page:
// private-owner resales and operator/developer partnership applications.
// Dylan's personal vetting is the quality bar — this page just makes the
// queue visible and trackable.

const STATUSES = ['new', 'reviewing', 'approved', 'rejected']
const STATUS_STYLE = {
  new:       { color: '#986813', bg: '#fff2d6' },
  reviewing: { color: '#2C4A5E', bg: '#e8eef2' },
  approved:  { color: '#16775d', bg: '#e5f5ef' },
  rejected:  { color: '#66727d', bg: '#edf0f2' },
}

function fmtDate(v) {
  return v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

export default function AdminApplications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('listing_applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    setRows(data || [])
    setLoading(false)
  }

  async function setRowStatus(id, next) {
    setRows(rs => rs.map(r => (r.id === id ? { ...r, status: next } : r)))
    const { error: err } = await supabase
      .from('listing_applications')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) { setError(err.message); load() }
  }

  async function saveNotes(id, notes) {
    const { error: err } = await supabase
      .from('listing_applications')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) setError(err.message)
  }

  const filtered = rows.filter(r => (!kind || r.kind === kind) && (!status || r.status === status))
  const counts = { new: rows.filter(r => r.status === 'new').length }

  return (
    <AdminLayout>
      <Head><title>Applications — COP Admin</title></Head>
      <div className="admin-page-heading">
        <div>
          <h1>Applications</h1>
          <p>{loading ? 'Loading…' : `${filtered.length} of ${rows.length} — resales & partner applications from the List With COP page`}</p>
        </div>
      </div>

      <section className="admin-listing-card">
        <div className="admin-listing-tabs">
          <button className={!status ? 'active' : ''} onClick={() => setStatus('')}>All <span>{rows.length}</span></button>
          <button className={status === 'new' ? 'active' : ''} onClick={() => setStatus('new')}>New <span>{counts.new}</span></button>
          <button className={status === 'reviewing' ? 'active' : ''} onClick={() => setStatus('reviewing')}>Reviewing</button>
          <button className={status === 'approved' ? 'active' : ''} onClick={() => setStatus('approved')}>Approved</button>
          <button className={status === 'rejected' ? 'active' : ''} onClick={() => setStatus('rejected')}>Rejected</button>
        </div>
        <div className="admin-listing-filters">
          <select value={kind} onChange={e => setKind(e.target.value)}>
            <option value="">All types</option>
            <option value="resale">Resales</option>
            <option value="partner">Partners</option>
          </select>
        </div>

        {error && <div className="admin-table-message error">{error}</div>}
        <div className="admin-responsive-table">
          <table className="admin-listings-table">
            <thead><tr><th>Applicant</th><th>Type</th><th>Location / Company</th><th>Details</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {filtered.map(r => {
                const st = STATUS_STYLE[r.status] || STATUS_STYLE.new
                const open = openId === r.id
                return (
                  <>
                    <tr key={r.id} onClick={() => setOpenId(open ? null : r.id)} style={{ cursor: 'pointer' }}>
                      <td><strong>{r.name || r.company || '—'}</strong><br /><small style={{ color: '#8a9aaa' }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</small></td>
                      <td>{r.kind === 'resale' ? 'Resale' : 'Partner'}</td>
                      <td>{r.kind === 'resale' ? (r.property_location || '—') : (r.company || '—')}</td>
                      <td>
                        {r.kind === 'resale'
                          ? [r.share_fraction, r.asking_price].filter(Boolean).join(' · ') || '—'
                          : [r.portfolio_size && `${r.portfolio_size} homes`, r.website].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={r.status}
                          onChange={e => setRowStatus(r.id, e.target.value)}
                          style={{ color: st.color, background: st.bg, border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 700, fontSize: 12 }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>{fmtDate(r.created_at)}</td>
                    </tr>
                    {open && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={6} style={{ background: '#faf8f3', padding: '14px 18px' }}>
                          {r.message && <p style={{ fontSize: 13, color: '#1a2533', margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{r.message}</p>}
                          {r.website && <p style={{ fontSize: 12, margin: '0 0 10px' }}><a href={r.website.startsWith('http') ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer" style={{ color: '#C9A84C' }}>{r.website} ↗</a></p>}
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <a href={`mailto:${r.email}`} className="admin-secondary-button" onClick={e => e.stopPropagation()}>Reply by email</a>
                            <input
                              defaultValue={r.notes || ''}
                              placeholder="Internal notes… (saves on blur)"
                              onBlur={e => saveNotes(r.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{ flex: 1, border: '1px solid #e8e0d4', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className="admin-table-message">Loading applications…</div>}
        {!loading && filtered.length === 0 && <div className="admin-table-message">No applications yet — they'll appear here the moment someone applies via /list-with-cop.</div>}
      </section>
    </AdminLayout>
  )
}
