import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminTasks from '@/components/admin/AdminTasks'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/AdminDashboardHome.module.css'

const STATUS_LABELS = {
  new_lead: 'New lead', contacted: 'Contacted', lead_replied: 'Replied', hot_lead: 'Hot lead',
  qualified: 'Qualified', passive_interest: 'Passive', registered: 'Registered',
  reservation_confirmed: 'Reserved', transferred_to_partner: 'Transferred', won: 'Won', lost: 'Lost',
}

function leadName(lead) {
  const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
  return [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || contact?.email || 'Unnamed lead'
}

function leadEmail(lead) {
  const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
  return contact?.email || 'No email supplied'
}

function initials(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'L'
}

function relativeDate(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function buildWeeklyTrend(rows) {
  const week = 7 * 24 * 60 * 60 * 1000
  const end = new Date()
  const start = new Date(end.getTime() - (8 * week))
  const buckets = Array.from({ length: 8 }, (_, index) => ({
    label: new Date(start.getTime() + (index * week)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: 0,
  }))

  rows.forEach((row) => {
    const index = Math.floor((new Date(row.created_at).getTime() - start.getTime()) / week)
    if (index >= 0 && index < buckets.length) buckets[index].count += 1
  })
  return buckets
}

function LeadVelocityChart({ points }) {
  const width = 620
  const height = 170
  const max = Math.max(...points.map((point) => point.count), 1)
  const coordinates = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * width,
    y: height - 24 - ((point.count / max) * (height - 52)),
  }))
  const line = coordinates.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const area = `${line} L${width} ${height} L0 ${height} Z`

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lead creation during the last eight weeks">
        <defs><linearGradient id="adminLeadTrend" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#246bfd" stopOpacity=".3" /><stop offset="1" stopColor="#246bfd" stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill="url(#adminLeadTrend)" />
        <path d={line} fill="none" stroke="#246bfd" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="5" fill="#f4f7f9" stroke="#246bfd" strokeWidth="4" />)}
      </svg>
      <div><span>{points[0]?.label || '—'}</span><span>{points.at(-1)?.label || '—'}</span></div>
    </div>
  )
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([])
  const [properties, setProperties] = useState([])
  const [partnerLeads, setPartnerLeads] = useState([])
  const [partners, setPartners] = useState({})
  const [trendRows, setTrendRows] = useState([])
  const [counts, setCounts] = useState({ leads: 0, properties: 0, contacts: 0, newToday: 0, needsAttention: 0, activePartners: 0, activePartnerLeads: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const trendStart = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000)).toISOString()

      try {
        const results = await Promise.all([
          supabase.from('leads').select('id,contact_id,status,property_slug,property_title,main_region,subregion,partner,created_at,updated_at,contacts(first_name,last_name,email),properties(partner)').order('created_at', { ascending: false }).limit(8),
          supabase.from('properties').select('slug,title,img,images,city,region,country,partner,status,price,currency,date_added').order('date_added', { ascending: false, nullsFirst: false }).limit(6),
          supabase.from('partner_hub_leads').select('id,first_name,last_name,partner_id,status,destination,created_at,updated_at').order('updated_at', { ascending: false }).limit(6),
          supabase.from('partner_hub_partners').select('id,display_name,active'),
          supabase.from('leads').select('created_at').gte('created_at', trendStart).order('created_at', { ascending: true }).limit(5000),
          supabase.from('leads').select('id', { count: 'exact', head: true }),
          supabase.from('properties').select('slug', { count: 'exact', head: true }),
          supabase.from('contacts').select('id', { count: 'exact', head: true }),
          supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new_lead').gte('created_at', startOfToday),
          supabase.from('partner_hub_partners').select('id', { count: 'exact', head: true }).eq('active', true),
          supabase.from('partner_hub_leads').select('id', { count: 'exact', head: true }).not('status', 'in', '(Won,Lost)'),
        ])

        const failed = results.find((result) => result.error)
        if (failed) throw failed.error
        if (!mounted) return

        const [leadRows, propertyRows, partnerRows, partnerDirectory, weeklyRows, leadCount, propertyCount, contactCount, todayCount, attentionCount, partnerCount, partnerLeadCount] = results
        setLeads(leadRows.data || [])
        setProperties(propertyRows.data || [])
        setPartnerLeads(partnerRows.data || [])
        setPartners(Object.fromEntries((partnerDirectory.data || []).map((partner) => [partner.id, partner.display_name])))
        setTrendRows(weeklyRows.data || [])
        setCounts({
          leads: leadCount.count || 0,
          properties: propertyCount.count || 0,
          contacts: contactCount.count || 0,
          newToday: todayCount.count || 0,
          needsAttention: attentionCount.count || 0,
          activePartners: partnerCount.count || 0,
          activePartnerLeads: partnerLeadCount.count || 0,
        })
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'The dashboard could not be loaded.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => { mounted = false }
  }, [])

  const weeklyTrend = useMemo(() => buildWeeklyTrend(trendRows), [trendRows])
  const currentFourWeeks = weeklyTrend.slice(4).reduce((total, week) => total + week.count, 0)
  const previousFourWeeks = weeklyTrend.slice(0, 4).reduce((total, week) => total + week.count, 0)
  const velocity = previousFourWeeks ? Math.round(((currentFourWeeks - previousFourWeeks) / previousFourWeeks) * 100) : currentFourWeeks ? 100 : 0
  const todayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()

  return (
    <AdminLayout>
      <Head><title>Dashboard — COP Admin</title></Head>
      <div className={styles.dashboard}>
        <header className={styles.heading}>
          <div><p>{todayLabel}</p><h1>Good morning, David.</h1></div>
          <div><Link href="/admin/leads" className={styles.secondaryAction}>Search leads</Link><Link href="/admin/partners" className={styles.primaryAction}>＋ Add lead</Link></div>
        </header>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <AdminTasks />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span>LIVE PIPELINE</span>
            <h2>{loading ? '—' : counts.leads.toLocaleString()} opportunities</h2>
            <p>{counts.needsAttention.toLocaleString()} need an action. Prioritise new introductions and stalled conversations.</p>
            <div><Link href="/admin/partners/queue">Review priority leads</Link><Link href="/admin/leads">Open leads →</Link></div>
          </div>
          <div className={styles.chartCard}>
            <header><div><span>LEAD VELOCITY</span><strong className={velocity < 0 ? styles.negative : ''}>{velocity >= 0 ? '+' : ''}{velocity}%</strong></div><small>LAST 8 WEEKS</small></header>
            <LeadVelocityChart points={weeklyTrend} />
          </div>
        </section>

        <section className={styles.metrics} aria-label="Dashboard metrics">
          <article><span>TOTAL LEADS</span><strong>{loading ? '—' : counts.leads.toLocaleString()}</strong><small>{counts.contacts.toLocaleString()} contacts</small></article>
          <article><span>NEW TODAY</span><strong>{loading ? '—' : counts.newToday.toLocaleString()}</strong><small>{counts.needsAttention.toLocaleString()} awaiting first contact</small></article>
          <article><span>ACTIVE PARTNERS</span><strong>{loading ? '—' : counts.activePartners.toLocaleString()}</strong><small>{counts.activePartnerLeads.toLocaleString()} open handovers</small></article>
          <article><span>COP LISTINGS</span><strong>{loading ? '—' : counts.properties.toLocaleString()}</strong><small>Inventory inside the CRM</small></article>
        </section>

        <div className={styles.mainGrid}>
          <section className={styles.panel}>
            <header><div><h2>Latest leads</h2><p>Most recent opportunities across COP</p></div><Link href="/admin/leads">View all →</Link></header>
            <div className={styles.tableWrap}>
              <table className={styles.leadTable}>
                <thead><tr><th>Lead</th><th>Destination</th><th>Partner</th><th>Stage</th><th>Created</th><th /></tr></thead>
                <tbody>
                  {leads.map((lead) => {
                    const name = leadName(lead)
                    const partner = lead.partner || (Array.isArray(lead.properties) ? lead.properties[0]?.partner : lead.properties?.partner) || '—'
                    return (
                      <tr key={lead.id}>
                        <td><Link href={`/admin/leads/${lead.id}`}><i>{initials(name)}</i><span><strong>{name}</strong><small>{leadEmail(lead)}</small></span></Link></td>
                        <td>{lead.main_region || lead.subregion || '—'}</td>
                        <td>{partner}</td>
                        <td><em className={styles[`status_${lead.status}`]}>{STATUS_LABELS[lead.status] || lead.status || 'New lead'}</em></td>
                        <td>{relativeDate(lead.created_at)}</td>
                        <td><Link href={`/admin/leads/${lead.id}`} aria-label={`Open ${name}`}>›</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!loading && leads.length === 0 && <div className={styles.empty}>No leads yet.</div>}
          </section>

          <aside className={styles.attention}>
            <header><span>NEEDS ATTENTION</span><strong>{loading ? '—' : counts.needsAttention.toLocaleString()}</strong></header>
            <Link href="/admin/leads"><i>1</i><span><b>New enquiries today</b><small>Awaiting first contact</small></span><strong>{counts.needsAttention.toLocaleString()}</strong></Link>
            <Link href="/admin/partners"><i>2</i><span><b>Partner pipeline</b><small>Open handovers</small></span><strong>{counts.activePartnerLeads.toLocaleString()}</strong></Link>
            <Link href="/admin/partners/queue"><i>3</i><span><b>Partner requests</b><small>Review follow-up queue</small></span><strong>→</strong></Link>
            <Link href="/admin/partners/queue" className={styles.attentionFooter}>Review all priorities →</Link>
          </aside>
        </div>

        <div className={styles.lowerGrid}>
          <section className={styles.panel}>
            <header><div><h2>Recent listings</h2><p>Newest COP inventory</p></div><Link href="/admin/listings">View all →</Link></header>
            <div className={styles.inventory}>
              {properties.slice(0, 4).map((property) => {
                const image = property.img || (Array.isArray(property.images) ? property.images[0] : '')
                return <Link href={`/admin/property/${property.slug}`} key={property.slug}><span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} /><p><strong>{property.title}</strong><small>{[property.city, property.region].filter(Boolean).join(', ')} · {property.partner || 'COP'}</small></p><b>›</b></Link>
              })}
            </div>
          </section>
          <section className={styles.panel}>
            <header><div><h2>Partner activity</h2><p>Latest handover updates</p></div><Link href="/admin/partners">Open Hub →</Link></header>
            <div className={styles.partnerActivity}>
              {partnerLeads.slice(0, 5).map((lead) => {
                const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
                return <div key={lead.id}><i>{initials(name)}</i><p><strong>{name}</strong><small>{partners[lead.partner_id] || lead.partner_id} · {(lead.status || 'New').replaceAll('_', ' ')}</small></p><time>{relativeDate(lead.updated_at || lead.created_at)}</time></div>
              })}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
