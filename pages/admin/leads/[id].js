import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS_OPTIONS = [
  ['new_lead', 'New lead'], ['contacted', 'Contacted'], ['lead_replied', 'Replied'],
  ['hot_lead', 'Hot lead'], ['qualified', 'Qualified'], ['passive_interest', 'Passive interest'],
  ['registered', 'Registered'], ['reservation_confirmed', 'Reserved'],
  ['transferred_to_partner', 'Transferred to partner'], ['won', 'Won'], ['lost', 'Lost'],
]

function money(value, currency = 'EUR') {
  if (!value) return 'Price on request'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDate(value, withTime = false) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminLeadDetail() {
  const router = useRouter()
  const { id } = router.query
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [shortlist, setShortlist] = useState([])
  const [properties, setProperties] = useState([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setError('')
    const [leadQuery, activityQuery, shortlistQuery, propertyQuery] = await Promise.all([
      supabase.from('leads').select('*,contacts(id,email,first_name,last_name,phone,country,source,created_at)').eq('id', id).single(),
      supabase.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('lead_property_shortlists').select('id,lead_id,property_slug,created_at,properties(slug,title,img,images,city,region,country,price,currency,beds,status,partner)').eq('lead_id', id).order('created_at'),
      supabase.from('properties').select('slug,title,img,images,city,region,country,price,currency,beds,status,partner,date_added').in('status', ['Live', 'for_sale']).order('date_added', { ascending: false, nullsFirst: false }).limit(1000),
    ])
    if (leadQuery.error) setError(leadQuery.error.message)
    setLead(leadQuery.data || null)
    setActivities(activityQuery.data || [])
    setShortlist(shortlistQuery.data || [])
    setProperties(propertyQuery.data || [])
  }, [id])

  useEffect(() => { load() }, [load])

  const contact = Array.isArray(lead?.contacts) ? lead.contacts[0] : lead?.contacts
  const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || contact?.email || 'Unnamed lead'
  const regions = useMemo(() => [...new Set(properties.map((p) => p.region || p.city).filter(Boolean))].sort(), [properties])
  const selectedSlugs = useMemo(() => new Set(shortlist.map((item) => item.property_slug)), [shortlist])
  const catalogue = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return properties.filter((property) => {
      if (selectedSlugs.has(property.slug)) return false
      if (region && ![property.region, property.city].includes(region)) return false
      if (!needle) return true
      return [property.title, property.slug, property.city, property.region, property.country, property.partner]
        .some((value) => value?.toLowerCase().includes(needle))
    }).slice(0, 80)
  }, [properties, selectedSlugs, search, region])

  async function changeStatus(nextStatus) {
    if (!lead || nextStatus === lead.status) return
    setBusy('status'); setMessage(''); setError('')
    const previous = lead.status
    const { error: updateError } = await supabase.from('leads').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', lead.id)
    if (updateError) setError(updateError.message)
    else {
      await supabase.from('activities').insert({ contact_id: lead.contact_id, lead_id: lead.id, type: 'status_changed', description: `Lead status changed from ${previous || 'unset'} to ${nextStatus}`, metadata: { previous_status: previous, status: nextStatus } })
      setLead((current) => ({ ...current, status: nextStatus }))
      setMessage('Lead status updated')
      await load()
    }
    setBusy('')
  }

  async function addProperty(property) {
    setBusy(`add-${property.slug}`); setMessage(''); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('lead_property_shortlists').insert({ lead_id: lead.id, property_slug: property.slug, created_by: user?.id || null, created_by_email: user?.email || null })
    if (insertError) setError(insertError.message)
    else {
      await supabase.from('activities').insert({ contact_id: lead.contact_id, lead_id: lead.id, type: 'property_shortlisted', description: `Added ${property.title} to the property shortlist`, metadata: { property_slug: property.slug } })
      setMessage('Property added to this lead')
      await load()
    }
    setBusy('')
  }

  async function removeProperty(item) {
    setBusy(`remove-${item.id}`); setMessage(''); setError('')
    const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
    const { error: deleteError } = await supabase.from('lead_property_shortlists').delete().eq('id', item.id)
    if (deleteError) setError(deleteError.message)
    else {
      await supabase.from('activities').insert({ contact_id: lead.contact_id, lead_id: lead.id, type: 'property_removed', description: `Removed ${property?.title || item.property_slug} from the property shortlist`, metadata: { property_slug: item.property_slug } })
      setMessage('Property removed from this lead')
      await load()
    }
    setBusy('')
  }

  async function saveNote(event) {
    event.preventDefault()
    if (!note.trim()) return
    setBusy('note'); setMessage(''); setError('')
    const { error: noteError } = await supabase.from('activities').insert({ contact_id: lead.contact_id, lead_id: lead.id, type: 'note', description: note.trim(), metadata: { source: 'cop_admin' } })
    if (noteError) setError(noteError.message)
    else { setNote(''); setMessage('Progress note saved'); await load() }
    setBusy('')
  }

  return (
    <AdminLayout>
      <Head><title>{lead ? `${name} — COP Admin` : 'Lead — COP Admin'}</title></Head>
      <div className="admin-lead-back"><Link href="/admin/crm">← Back to leads</Link></div>
      {error && <div className="admin-lead-alert error">{error}</div>}
      {message && <div className="admin-lead-alert success">{message}</div>}
      {!lead && !error && <div className="admin-table-message">Loading lead…</div>}

      {lead && <>
        <section className="admin-lead-hero">
          <div className="admin-lead-avatar">{name.split(/\s+/).slice(0,2).map((word) => word[0]).join('').toUpperCase()}</div>
          <div className="admin-lead-title"><small>LEAD DETAILS</small><h1>{name}</h1><p>{lead.property_title || [lead.main_region, lead.subregion].filter(Boolean).join(' · ') || 'General co-ownership enquiry'}</p></div>
          <label>Pipeline stage<select value={lead.status || 'new_lead'} disabled={busy === 'status'} onChange={(e) => changeStatus(e.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </section>

        <div className="admin-lead-grid">
          <main>
            <section className="admin-lead-card contact-card">
              <header><div><small>CONTACT</small><h2>Client information</h2></div><span>Created {formatDate(lead.created_at)}</span></header>
              <dl>
                <div><dt>Email</dt><dd><a href={`mailto:${contact?.email}`}>{contact?.email || '—'}</a></dd></div>
                <div><dt>Phone</dt><dd>{contact?.phone || '—'}</dd></div>
                <div><dt>Nationality</dt><dd>{contact?.country || '—'}</dd></div>
                <div><dt>Destination</dt><dd>{[lead.main_region, lead.subregion].filter(Boolean).join(' / ') || '—'}</dd></div>
                <div><dt>Budget</dt><dd>{lead.budget_min || lead.budget_max ? `${lead.budget_min ? money(lead.budget_min) : 'Any'} – ${lead.budget_max ? money(lead.budget_max) : 'open'}` : '—'}</dd></div>
                <div><dt>Source</dt><dd>{contact?.source || '—'}</dd></div>
              </dl>
              {lead.message && <div className="admin-lead-context"><small>ORIGINAL CONTEXT</small><p>{lead.message}</p></div>}
            </section>

            <section className="admin-lead-card shortlist-card">
              <header><div><small>PROPERTY SHORTLIST</small><h2>Homes selected for this lead</h2></div><span>{shortlist.length} selected</span></header>
              <div className="admin-selected-properties">
                {shortlist.map((item) => {
                  const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
                  const image = property?.img || (Array.isArray(property?.images) ? property.images[0] : '')
                  return <article key={item.id}><span style={image ? { backgroundImage: `url("${image.replaceAll('"','%22')}")` } : undefined} /><div><small>{[property?.city, property?.region, property?.country].filter(Boolean).join(', ')}</small><strong>{property?.title || item.property_slug}</strong><p>{money(property?.price, property?.currency)}{property?.beds ? ` · ${property.beds} beds` : ''} · {property?.partner || 'COP'}</p></div><Link href={`/property/${item.property_slug}`} target="_blank">View ↗</Link><button disabled={busy === `remove-${item.id}`} onClick={() => removeProperty(item)}>Remove</button></article>
                })}
                {shortlist.length === 0 && <div className="admin-empty-shortlist"><span>⌂</span><div><strong>No homes selected yet</strong><p>Search the live COP inventory below and add the most suitable listings.</p></div></div>}
              </div>

              <div className="admin-property-picker">
                <div><label>Search COP listings<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Property, destination, reference or partner…" /></label><label>Destination<select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All destinations</option>{regions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div>
                <p>{catalogue.length} matching listings shown</p>
                <div className="admin-property-catalogue">
                  {catalogue.map((property) => {
                    const image = property.img || (Array.isArray(property.images) ? property.images[0] : '')
                    return <article key={property.slug}><span style={image ? { backgroundImage: `url("${image.replaceAll('"','%22')}")` } : undefined} /><div><strong>{property.title}</strong><small>{[property.city, property.region, property.country].filter(Boolean).join(', ')} · {money(property.price, property.currency)}</small></div><button disabled={busy === `add-${property.slug}`} onClick={() => addProperty(property)}>+ Add</button></article>
                  })}
                </div>
              </div>
            </section>
          </main>

          <aside>
            <section className="admin-lead-card note-card">
              <header><div><small>PROGRESS</small><h2>Add a note</h2></div></header>
              <form onSubmit={saveNote}><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Conversation, next step or useful context…" /><button disabled={!note.trim() || busy === 'note'}>Save progress note</button></form>
            </section>
            <section className="admin-lead-card activity-card">
              <header><div><small>AUDIT TRAIL</small><h2>Activity</h2></div></header>
              <div>{activities.map((activity) => <article key={activity.id}><i>✓</i><p><strong>{activity.description || activity.type}</strong><small>{formatDate(activity.created_at, true)}</small></p></article>)}{activities.length === 0 && <p className="admin-no-activity">No activity recorded.</p>}</div>
            </section>
          </aside>
        </div>
      </>}
    </AdminLayout>
  )
}
