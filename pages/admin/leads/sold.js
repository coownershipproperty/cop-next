import { useCallback, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

function money(value, currency = 'EUR') {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value))
}

function date(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function contactFor(lead) {
  return Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
}

export default function SoldAdminLeads() {
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: loadError } = await supabase.from('leads')
      .select('id,contact_id,property_title,property_slug,main_region,subregion,partner,property_sale_price,commission_rate,invoice_amount,invoice_date,invoice_paid,won_at,created_at,updated_at,contacts(email,first_name,last_name,phone)')
      .eq('status', 'won')
      .order('won_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(1000)
    if (loadError) setError(loadError.message)
    else setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return leads
    return leads.filter((lead) => {
      const contact = contactFor(lead)
      return [contact?.first_name, contact?.last_name, contact?.email, lead.property_title, lead.main_region, lead.partner]
        .some((value) => value?.toLowerCase().includes(needle))
    })
  }, [leads, search])

  const totals = useMemo(() => leads.reduce((summary, lead) => {
    summary.invoiced += Number(lead.invoice_amount || 0)
    if (lead.invoice_paid) summary.paid += Number(lead.invoice_amount || 0)
    else if (lead.invoice_amount) summary.outstanding += Number(lead.invoice_amount)
    return summary
  }, { invoiced: 0, paid: 0, outstanding: 0 }), [leads])

  return (
    <AdminLayout>
      <Head><title>Sold leads — COP Admin</title></Head>
      <div className="admin-sales-heading">
        <div><small>SALES &amp; COMMISSIONS</small><h1>Sold leads</h1><p>Every lead in the Won stage appears here automatically.</p></div>
        <Link href="/admin/leads/new">＋ New lead</Link>
      </div>

      <nav className="admin-lead-tabs" aria-label="Lead views"><Link href="/admin/leads">All leads</Link><Link href="/admin/leads/sold" className="active">Sold leads <span>{leads.length}</span></Link></nav>

      <section className="admin-sales-stats">
        <article><small>WON LEADS</small><strong>{leads.length}</strong><span>Automatically included</span></article>
        <article><small>INVOICED</small><strong>{money(totals.invoiced)}</strong><span>Total invoice value</span></article>
        <article><small>PAID</small><strong>{money(totals.paid)}</strong><span>Confirmed payments</span></article>
        <article><small>OUTSTANDING</small><strong>{money(totals.outstanding)}</strong><span>Issued, not yet paid</span></article>
      </section>

      <div className="admin-sales-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sold leads, email, property or partner…" /><span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span></div>
      {error && <div className="admin-lead-alert error">{error}</div>}

      <div className="admin-sales-table-wrap">
        <table className="admin-sales-table"><thead><tr><th>Lead</th><th>Property</th><th>Partner</th><th>Won</th><th>Sale price</th><th>Commission</th><th>Invoice</th><th>Invoice date</th><th>Paid</th><th /></tr></thead>
          <tbody>{filtered.map((lead) => {
            const contact = contactFor(lead)
            const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || contact?.email || 'Unnamed lead'
            return <tr key={lead.id}>
              <td><strong>{name}</strong><small>{contact?.email}</small></td>
              <td><strong>{lead.property_title || [lead.main_region, lead.subregion].filter(Boolean).join(' / ') || 'General enquiry'}</strong><small>{[lead.main_region, lead.subregion].filter(Boolean).join(' · ')}</small></td>
              <td>{lead.partner || '—'}</td><td>{date(lead.won_at || lead.updated_at)}</td><td>{money(lead.property_sale_price)}</td><td>{lead.commission_rate === null ? '—' : `${Number(lead.commission_rate)}%`}</td><td>{money(lead.invoice_amount)}</td><td>{date(lead.invoice_date)}</td>
              <td><span className={`admin-paid-chip ${lead.invoice_paid ? 'paid' : 'unpaid'}`}>{lead.invoice_paid ? 'Paid' : 'Not paid'}</span></td>
              <td><Link href={`/admin/leads/${lead.id}`}>Edit →</Link></td>
            </tr>
          })}</tbody>
        </table>
        {loading && <div className="admin-table-message">Loading sold leads…</div>}
        {!loading && filtered.length === 0 && <div className="admin-table-message">No sold leads match this view.</div>}
      </div>
    </AdminLayout>
  )
}
