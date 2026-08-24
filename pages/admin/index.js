import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS = {
  new_lead: 'New lead', contacted: 'Contacted', lead_replied: 'Replied', hot_lead: 'Hot lead',
  qualified: 'Qualified', passive_interest: 'Passive', registered: 'Registered',
  reservation_confirmed: 'Reserved', transferred_to_partner: 'Transferred', won: 'Won', lost: 'Lost',
}

function leadName(lead) {
  const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
  return [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || contact?.email || 'Unnamed lead'
}

function relativeDate(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.max(0, Math.floor(diff / 3600000))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([])
  const [properties, setProperties] = useState([])
  const [partnerLeads, setPartnerLeads] = useState([])
  const [counts, setCounts] = useState({ leads: 0, properties: 0, contacts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [leadRows, propertyRows, partnerRows, leadCount, propertyCount, contactCount] = await Promise.all([
        supabase.from('leads').select('id,contact_id,status,property_slug,property_title,main_region,subregion,partner,created_at,updated_at,contacts(first_name,last_name,email),properties(partner)').order('created_at', { ascending: false }).limit(8),
        supabase.from('properties').select('slug,title,img,images,city,region,country,partner,status,price,currency,date_added').order('date_added', { ascending: false, nullsFirst: false }).limit(6),
        supabase.from('partner_hub_leads').select('id,first_name,last_name,partner_id,stage,destinations,created_at,updated_at').order('updated_at', { ascending: false }).limit(6),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('slug', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
      ])
      setLeads(leadRows.data || [])
      setProperties(propertyRows.data || [])
      setPartnerLeads(partnerRows.data || [])
      setCounts({ leads: leadCount.count || 0, properties: propertyCount.count || 0, contacts: contactCount.count || 0 })
      setLoading(false)
    })()
  }, [])

  const newLeads = leads.filter((lead) => lead.status === 'new_lead').length
  const activePartnerLeads = partnerLeads.filter((lead) => !['won', 'lost'].includes(lead.stage)).length

  return (
    <AdminLayout>
      <Head><title>Dashboard — COP Admin</title></Head>
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">COP CRM</p><h1>Good morning, David</h1><p>Leads, partner follow-up and COP listings in one workspace.</p></div>
        <div className="admin-page-actions">
          <Link href="/admin/partners" className="admin-primary-button">Open Partner Hub</Link>
        </div>
      </div>

      <section className="admin-dashboard-hero">
        <div><small>CRM WORKSPACE</small><h2>Keep every opportunity moving.</h2><p>Open the lead, add suitable COP listings, and keep the handover visible to both teams.</p></div>
        <div><Link href="/admin/crm">Open all leads <span>→</span></Link><Link href="/admin/listings">Browse inventory <span>→</span></Link></div>
      </section>

      <section className="admin-stat-grid">
        <article><i>↗</i><p><small>TOTAL LEADS</small><strong>{counts.leads.toLocaleString()}</strong><span>{counts.contacts.toLocaleString()} contacts</span></p></article>
        <article><i>◫</i><p><small>COP LISTINGS</small><strong>{counts.properties.toLocaleString()}</strong><span>Live inventory</span></p></article>
        <article><i>!</i><p><small>NEEDS ATTENTION</small><strong>{newLeads}</strong><span>Among recent CRM leads</span></p></article>
        <article><i>✓</i><p><small>PARTNER PIPELINE</small><strong>{activePartnerLeads}</strong><span>Recent active handovers</span></p></article>
      </section>

      <section className="admin-dashboard-panel">
        <header><div><h2>Latest leads</h2><p>Most recently created opportunities</p></div><Link href="/admin/crm">View all →</Link></header>
        <div className="admin-responsive-table">
          <table className="admin-dashboard-table">
            <thead><tr><th>Lead</th><th>Destination</th><th>Partner</th><th>Stage</th><th>Created</th><th /></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td><Link href={`/admin/leads/${lead.id}`}><strong>{leadName(lead)}</strong><small>{lead.property_title || 'General enquiry'}</small></Link></td>
                  <td>{lead.main_region || lead.subregion || '—'}</td>
                  <td>{lead.partner || (Array.isArray(lead.properties) ? lead.properties[0]?.partner : lead.properties?.partner) || '—'}</td>
                  <td><i className={`status-${lead.status}`}>{STATUS_LABELS[lead.status] || lead.status || 'New lead'}</i></td>
                  <td>{relativeDate(lead.created_at)}</td>
                  <td><Link href={`/admin/leads/${lead.id}`}>›</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && leads.length === 0 && <div className="admin-table-message">No leads yet.</div>}
      </section>

      <div className="admin-dashboard-columns">
        <section className="admin-dashboard-panel compact">
          <header><div><h2>Recent listings</h2><p>Newest COP inventory</p></div><Link href="/admin/listings">View all →</Link></header>
          <div className="admin-inventory-list">
            {properties.slice(0, 4).map((property) => {
              const image = property.img || (Array.isArray(property.images) ? property.images[0] : '')
              return <Link href={`/admin/property/${property.slug}`} key={property.slug}><span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} /><p><strong>{property.title}</strong><small>{[property.city, property.region].filter(Boolean).join(', ')} · {property.partner || 'COP'}</small></p><b>›</b></Link>
            })}
          </div>
        </section>
        <section className="admin-dashboard-panel compact">
          <header><div><h2>Partner activity</h2><p>Latest handover updates</p></div><Link href="/admin/partners">Open Hub →</Link></header>
          <div className="admin-partner-activity">
            {partnerLeads.slice(0, 5).map((lead) => <div key={lead.id}><i>{(lead.first_name || 'L').slice(0, 1)}</i><p><strong>{[lead.first_name, lead.last_name].filter(Boolean).join(' ')}</strong><small>{lead.partner_id} · {lead.stage?.replaceAll('_', ' ')}</small></p><time>{relativeDate(lead.updated_at || lead.created_at)}</time></div>)}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
