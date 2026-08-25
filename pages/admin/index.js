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

function leadContact(lead) {
  return Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
}

function leadPartner(lead) {
  return lead.partner || (Array.isArray(lead.properties) ? lead.properties[0]?.partner : lead.properties?.partner) || '—'
}

function budgetLabel(lead) {
  if (!lead.budget_min && !lead.budget_max) return ''
  const format = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }).format(value)
  if (lead.budget_min && lead.budget_max) return `${format(lead.budget_min)}–${format(lead.budget_max)}`
  return lead.budget_min ? `${format(lead.budget_min)}+` : `Up to ${format(lead.budget_max)}`
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

function LeadCard({ lead, note, engagement, pinBusy, onTogglePin }) {
  const name = leadName(lead)
  const contact = leadContact(lead)
  const budget = budgetLabel(lead)
  const destination = lead.main_region || lead.subregion || ''
  const source = lead.attribution_source || leadPartner(lead)
  const engagementLabel = engagement?.click_count
    ? `${engagement.click_count} tracked click${engagement.click_count === 1 ? '' : 's'}`
    : engagement?.open_count
      ? `${engagement.open_count} tracked open${engagement.open_count === 1 ? '' : 's'}`
      : ''

  return (
    <article className={`${styles.leadCard}${engagement ? ` ${styles.engagedLeadCard}` : ''}`}>
      <Link href={`/admin/leads/${lead.id}`} aria-label={`Open ${name}`}>
        <div className={styles.cardTop}>
          <em className={styles[`status_${lead.status}`]}>{STATUS_LABELS[lead.status] || lead.status || 'New lead'}</em>
          <time>{relativeDate(engagement?.last_open_at || lead.updated_at || lead.created_at)}</time>
        </div>
        <strong className={styles.cardName}>{name}</strong>
        <span className={styles.cardEmail}>{leadEmail(lead)}</span>
        <div className={styles.cardSignals}>
          <span className={contact?.phone ? styles.signalOn : ''}>Phone</span>
          <span className={budget ? styles.signalOn : ''}>Budget</span>
          <span className={destination ? styles.signalOn : ''}>Destination</span>
        </div>
        {(engagementLabel || note || lead.message) && <p className={styles.cardNote}>{engagementLabel ? `↗ ${engagementLabel}${engagement?.subject ? ` · ${engagement.subject}` : ''}` : (note || lead.message)}</p>}
        <small className={styles.cardSource}>{source}</small>
      </Link>
      <button type="button" className={lead.pinned_at ? styles.pinActive : styles.pinButton} disabled={pinBusy === lead.id} onClick={() => onTogglePin(lead)} aria-label={lead.pinned_at ? `Unpin ${name}` : `Pin ${name}`}>{lead.pinned_at ? '●' : '○'}</button>
    </article>
  )
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([])
  const [pinnedLeads, setPinnedLeads] = useState([])
  const [followUpLeads, setFollowUpLeads] = useState([])
  const [latestNotes, setLatestNotes] = useState({})
  const [pinBusy, setPinBusy] = useState('')
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
      const followUpSince = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString()
      const leadSelect = 'id,contact_id,status,property_slug,property_title,main_region,subregion,partner,budget_min,budget_max,message,attribution_source,created_at,updated_at,pinned_at,contacts(first_name,last_name,email,phone),properties(partner)'

      try {
        const results = await Promise.all([
          supabase.from('leads').select(leadSelect).is('pinned_at', null).order('created_at', { ascending: false }).limit(15),
          supabase.from('leads').select(leadSelect).not('pinned_at', 'is', null).order('pinned_at', { ascending: false }).limit(30),
          supabase.from('properties').select('slug,title,img,images,city,region,country,partner,status,price,currency,date_added').order('date_added', { ascending: false, nullsFirst: false }).limit(6),
          supabase.from('partner_hub_leads').select('id,first_name,last_name,partner_id,status,destination,created_at,updated_at').order('updated_at', { ascending: false }).limit(6),
          supabase.from('partner_hub_partners').select('id,display_name,active'),
          supabase.from('tracked_emails').select('recipient_email,subject,open_count,click_count,last_open_at,sent_at').gte('last_open_at', followUpSince).order('last_open_at', { ascending: false }).limit(80),
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

        const [leadRows, pinnedRows, propertyRows, partnerRows, partnerDirectory, trackingRows, weeklyRows, leadCount, propertyCount, contactCount, todayCount, attentionCount, partnerCount, partnerLeadCount] = results
        const recentTracking = trackingRows.data || []
        const trackingEmails = [...new Set(recentTracking.map((row) => row.recipient_email?.trim().toLowerCase()).filter(Boolean))]
        let trackedLeadRows = []
        if (trackingEmails.length) {
          const contactQuery = await supabase.from('contacts').select('id,email').in('email', trackingEmails)
          if (contactQuery.error) throw contactQuery.error
          const contactIds = (contactQuery.data || []).map((contact) => contact.id)
          if (contactIds.length) {
            const trackedLeadQuery = await supabase.from('leads').select(leadSelect).in('contact_id', contactIds).order('updated_at', { ascending: false }).limit(100)
            if (trackedLeadQuery.error) throw trackedLeadQuery.error
            trackedLeadRows = trackedLeadQuery.data || []
          }
        }

        const engagementByEmail = new Map()
        recentTracking.forEach((row) => {
          const email = row.recipient_email?.trim().toLowerCase()
          if (email && !engagementByEmail.has(email)) engagementByEmail.set(email, row)
        })
        const followCandidates = [...trackedLeadRows, ...(leadRows.data || []).filter((lead) => lead.status === 'new_lead')]
        const seenFollow = new Set()
        const priorityRows = followCandidates.filter((lead) => {
          const email = leadContact(lead)?.email?.trim().toLowerCase()
          const identity = email || lead.contact_id || lead.id
          if (seenFollow.has(identity) || ['won', 'lost'].includes(lead.status)) return false
          if (!engagementByEmail.has(email) && lead.status !== 'new_lead') return false
          seenFollow.add(identity)
          return true
        }).slice(0, 10).map((lead) => ({ ...lead, engagement: engagementByEmail.get(leadContact(lead)?.email?.trim().toLowerCase()) || null }))

        const visibleLeadIds = [...new Set([...(leadRows.data || []), ...(pinnedRows.data || []), ...priorityRows].map((lead) => lead.id))]
        const noteMap = {}
        if (visibleLeadIds.length) {
          const noteQuery = await supabase.from('activities').select('lead_id,description,created_at').in('lead_id', visibleLeadIds).order('created_at', { ascending: false }).limit(500)
          if (noteQuery.error) throw noteQuery.error
          ;(noteQuery.data || []).forEach((activity) => {
            if (activity.lead_id && !noteMap[activity.lead_id] && activity.description) noteMap[activity.lead_id] = activity.description
          })
        }

        setLeads(leadRows.data || [])
        setPinnedLeads(pinnedRows.data || [])
        setFollowUpLeads(priorityRows)
        setLatestNotes(noteMap)
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

  async function togglePin(lead) {
    if (pinBusy) return
    setPinBusy(lead.id); setError('')
    const nextPinned = !lead.pinned_at
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ pinned: nextPinned }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not update the pinned lead.')
      const updatedLead = { ...lead, pinned_at: payload.lead?.pinned_at || null }
      setFollowUpLeads((current) => current.map((item) => item.id === lead.id ? { ...item, pinned_at: updatedLead.pinned_at } : item))
      if (nextPinned) {
        setPinnedLeads((current) => [updatedLead, ...current.filter((item) => item.id !== lead.id)])
        setLeads((current) => current.filter((item) => item.id !== lead.id))
      } else {
        setPinnedLeads((current) => current.filter((item) => item.id !== lead.id))
        setLeads((current) => [updatedLead, ...current.filter((item) => item.id !== lead.id)].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15))
      }
    } catch (pinError) {
      setError(pinError.message || 'Could not update the pinned lead.')
    } finally { setPinBusy('') }
  }

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

        {!loading && followUpLeads.length > 0 && <section className={`${styles.leadSection} ${styles.prioritySection}`}>
          <header className={styles.leadSectionHeader}>
            <div><span className={styles.sectionIcon}>↗</span><div><h2>Follow-up priority</h2><p>Recent tracked engagement and new enquiries waiting for contact</p></div></div>
            <Link href="/admin/leads">Review all →</Link>
          </header>
          <div className={styles.leadCardGrid}>
            {followUpLeads.map((lead) => <LeadCard key={`priority-${lead.id}`} lead={lead} engagement={lead.engagement} note={latestNotes[lead.id]} pinBusy={pinBusy} onTogglePin={togglePin} />)}
          </div>
        </section>}

        {!loading && pinnedLeads.length > 0 && <section className={styles.leadSection}>
          <header className={styles.leadSectionHeader}>
            <div><span className={styles.sectionIcon}>●</span><div><h2>Pinned leads</h2><p>Important opportunities kept in view</p></div></div>
            <Link href="/admin/leads">All leads →</Link>
          </header>
          <div className={styles.leadCardGrid}>
            {pinnedLeads.map((lead) => <LeadCard key={`pinned-${lead.id}`} lead={lead} note={latestNotes[lead.id]} pinBusy={pinBusy} onTogglePin={togglePin} />)}
          </div>
        </section>}

        <section className={styles.leadSection}>
          <header className={styles.leadSectionHeader}>
            <div><span className={styles.sectionIcon}>＋</span><div><h2>Latest 15 leads</h2><p>Newest opportunities across COP</p></div></div>
            <Link href="/admin/leads">All leads →</Link>
          </header>
          <div className={styles.leadCardGrid}>
            {leads.map((lead) => <LeadCard key={lead.id} lead={lead} note={latestNotes[lead.id]} pinBusy={pinBusy} onTogglePin={togglePin} />)}
          </div>
          {!loading && leads.length === 0 && <div className={styles.empty}>No unpinned leads yet.</div>}
        </section>

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
