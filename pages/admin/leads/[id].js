import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS_OPTIONS = [
  ['new_lead', 'New lead'], ['contacted', 'Contacted'], ['lead_replied', 'Replied'],
  ['hot_lead', 'Hot lead'], ['qualified', 'Qualified'], ['passive_interest', 'Passive interest'],
  ['registered', 'Registered'], ['reservation_confirmed', 'Reserved'],
  ['transferred_to_partner', 'Transferred to partner'], ['won', 'Won'], ['lost', 'Lost'],
]
const GMAIL_CLIENT_ID = '4464630046-jtg9vlnfen2or1u6nhli8h352qanluvl.apps.googleusercontent.com'
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

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

function safeExternalUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value, 'https://co-ownership-property.com')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch (_) { return null }
}

function headerValue(headers, name) {
  return headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || ''
}

function sourceLabel(lead, contact) {
  if (lead?.attribution_source) return lead.attribution_source
  if (lead?.referrer_url) {
    try { return new URL(lead.referrer_url).hostname.replace(/^www\./, '') } catch (_) {}
  }
  return contact?.source || 'Direct / unknown'
}

export default function AdminLeadDetail() {
  const router = useRouter()
  const { id } = router.query
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [shortlist, setShortlist] = useState([])
  const [properties, setProperties] = useState([])
  const [emailSends, setEmailSends] = useState([])
  const [emailOpens, setEmailOpens] = useState([])
  const [trackedEmails, setTrackedEmails] = useState([])
  const [trackedOpens, setTrackedOpens] = useState([])
  const [trackedClicks, setTrackedClicks] = useState([])
  const [gmailToken, setGmailToken] = useState('')
  const [gmailThreads, setGmailThreads] = useState([])
  const [gmailBusy, setGmailBusy] = useState(false)
  const [gmailError, setGmailError] = useState('')
  const gmailClient = useRef(null)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setError('')
    const leadQuery = await supabase
      .from('leads')
      .select('*,contacts(id,email,first_name,last_name,phone,country,source,score,created_at,inferred_nationality,nationality_confidence,nationality_evidence,nationality_inferred_at,first_ip_country_code,first_ip_city,first_ip_region)')
      .eq('id', id)
      .single()
    if (leadQuery.error) { setError(leadQuery.error.message); return }
    const currentLead = leadQuery.data
    const contact = Array.isArray(currentLead?.contacts) ? currentLead.contacts[0] : currentLead?.contacts
    const [activityQuery, shortlistQuery, propertyQuery, sendsQuery, trackingQuery] = await Promise.all([
      supabase.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(100),
      supabase.from('lead_property_shortlists').select('id,lead_id,property_slug,created_at,properties(slug,title,img,images,city,region,country,price,currency,beds,status,partner)').eq('lead_id', id).order('created_at'),
      supabase.from('properties').select('slug,title,img,images,city,region,country,price,currency,beds,status,partner,date_added').in('status', ['Live', 'for_sale']).order('date_added', { ascending: false, nullsFirst: false }).limit(1000),
      supabase.from('email_sends').select('*').or(`lead_id.eq.${id},contact_id.eq.${currentLead.contact_id}`).order('sent_at', { ascending: false }).limit(100),
      contact?.email ? supabase.from('tracked_emails').select('*').ilike('recipient_email', contact.email).order('sent_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
    ])
    const sendIds = (sendsQuery.data || []).map((item) => item.id)
    const trackedIds = (trackingQuery.data || []).map((item) => item.id)
    const [opensQuery, trackedOpensQuery, clicksQuery] = await Promise.all([
      sendIds.length ? supabase.from('email_opens').select('id,email_send_id,opened_at').in('email_send_id', sendIds).order('opened_at', { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
      trackedIds.length ? supabase.from('tracked_email_opens').select('id,email_id,opened_at').in('email_id', trackedIds).order('opened_at', { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
      trackedIds.length ? supabase.from('tracked_email_clicks').select('id,email_id,clicked_at,url').in('email_id', trackedIds).order('clicked_at', { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
    ])
    setLead(currentLead)
    setActivities(activityQuery.data || [])
    setShortlist(shortlistQuery.data || [])
    setProperties(propertyQuery.data || [])
    setEmailSends(sendsQuery.data || [])
    setEmailOpens(opensQuery.data || [])
    setTrackedEmails(trackingQuery.data || [])
    setTrackedOpens(trackedOpensQuery.data || [])
    setTrackedClicks(clicksQuery.data || [])
  }, [id])

  useEffect(() => { load() }, [load])

  const contact = Array.isArray(lead?.contacts) ? lead.contacts[0] : lead?.contacts
  const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || contact?.email || 'Unnamed lead'
  const regions = useMemo(() => [...new Set(properties.map((p) => p.region || p.city).filter(Boolean))].sort(), [properties])
  const selectedSlugs = useMemo(() => new Set(shortlist.map((item) => item.property_slug)), [shortlist])
  const primaryProperty = useMemo(() => {
    const chosen = shortlist.find((item) => item.property_slug === lead?.property_slug) || shortlist[0]
    return Array.isArray(chosen?.properties) ? chosen.properties[0] : chosen?.properties
  }, [lead?.property_slug, shortlist])
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
  const latestNote = activities.find((activity) => activity.type === 'note') || activities[0]
  const propertyUrl = lead?.property_slug ? `https://co-ownership-property.com/property/${encodeURIComponent(lead.property_slug)}` : null

  const initGmail = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || gmailClient.current) return
    gmailClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GMAIL_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: ({ access_token: token, error: tokenError }) => {
        if (tokenError || !token) { setGmailError(tokenError || 'Gmail access was not granted'); return }
        setGmailToken(token)
      },
    })
  }, [])

  useEffect(() => {
    if (!gmailToken || !contact?.email) return
    let cancelled = false
    async function loadGmail() {
      setGmailBusy(true); setGmailError('')
      try {
        const query = encodeURIComponent(`from:${contact.email} OR to:${contact.email}`)
        const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${query}&maxResults=20`, { headers: { Authorization: `Bearer ${gmailToken}` } })
        if (!listResponse.ok) throw new Error(listResponse.status === 401 ? 'Gmail access expired. Reconnect Gmail.' : 'Could not load Gmail conversations.')
        const list = await listResponse.json()
        const threads = await Promise.all((list.threads || []).map(async ({ id: threadId }) => {
          const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${gmailToken}` } })
          if (!response.ok) return null
          const thread = await response.json()
          const newest = thread.messages?.[thread.messages.length - 1]
          return { id: thread.id, count: thread.messages?.length || 0, snippet: newest?.snippet || '', subject: headerValue(newest?.payload?.headers, 'Subject') || '(No subject)', from: headerValue(newest?.payload?.headers, 'From'), date: headerValue(newest?.payload?.headers, 'Date') }
        }))
        if (!cancelled) setGmailThreads(threads.filter(Boolean))
      } catch (gmailLoadError) {
        if (!cancelled) setGmailError(gmailLoadError.message)
      } finally { if (!cancelled) setGmailBusy(false) }
    }
    loadGmail()
    return () => { cancelled = true }
  }, [gmailToken, contact?.email])

  async function changeStatus(nextStatus) {
    if (!lead || nextStatus === lead.status) return
    setBusy('status'); setMessage(''); setError('')
    const previous = lead.status
    const { error: updateError } = await supabase.from('leads').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', lead.id)
    if (updateError) setError(updateError.message)
    else {
      await supabase.from('activities').insert({ contact_id: lead.contact_id, lead_id: lead.id, type: 'status_changed', description: `Lead status changed from ${previous || 'unset'} to ${nextStatus}`, metadata: { previous_status: previous, status: nextStatus } })
      setMessage('Lead status updated'); await load()
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
      setMessage('Property added to this lead'); await load()
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
      setMessage('Property removed from this lead'); await load()
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
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initGmail} />
      <div className="admin-lead-back"><Link href="/admin/leads">← Back to leads</Link><span>COP ADMIN ONLY</span></div>
      {error && <div className="admin-lead-alert error">{error}</div>}
      {message && <div className="admin-lead-alert success">{message}</div>}
      {!lead && !error && <div className="admin-table-message">Loading lead…</div>}

      {lead && <>
        <section className="admin-lead-hero">
          <div className="admin-lead-avatar">{name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</div>
          <div className="admin-lead-title"><small>PRIVATE LEAD RECORD</small><h1>{name}</h1><p>{lead.property_title || [lead.main_region, lead.subregion].filter(Boolean).join(' · ') || 'General co-ownership enquiry'}</p></div>
          <label>Pipeline stage<select value={lead.status || 'new_lead'} disabled={busy === 'status'} onChange={(event) => changeStatus(event.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </section>

        <section className="admin-intelligence-grid">
          <article className="admin-lead-card intelligence-card">
            <small>PROFILE</small><h2>Lead intelligence</h2>
            <dl>
              <div><dt>Nationality</dt><dd>{contact?.inferred_nationality || contact?.country || 'Not inferred'}{contact?.nationality_confidence ? <em>{contact.nationality_confidence}% confidence</em> : null}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${contact?.email}`}>{contact?.email || '—'}</a></dd></div>
              <div><dt>Phone</dt><dd>{contact?.phone || '—'}</dd></div>
              <div><dt>Lead score</dt><dd>{contact?.score ?? '—'}</dd></div>
            </dl>
            <p className="admin-confidence-note">Nationality is an automated estimate from the visit country, phone code and email domain. Confirm it with the client when needed.</p>
          </article>

          <article className="admin-lead-card intelligence-card">
            <small>PROPERTY</small><h2>Enquiry listing</h2>
            <dl>
              <div><dt>Property</dt><dd>{lead.property_title || primaryProperty?.title || 'General enquiry'}</dd></div>
              <div><dt>Location</dt><dd>{[primaryProperty?.city, primaryProperty?.region, primaryProperty?.country].filter(Boolean).join(', ') || [lead.subregion, lead.main_region].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt>Listing</dt><dd>{propertyUrl ? <a href={propertyUrl} target="_blank" rel="noreferrer">Open COP listing ↗</a> : '—'}</dd></div>
              <div><dt>Latest note</dt><dd>{latestNote?.description || 'No note yet'}</dd></div>
            </dl>
          </article>

          <article className="admin-lead-card intelligence-card">
            <small>HOW THEY FOUND US</small><h2>First-touch attribution</h2>
            <dl>
              <div><dt>Enquiry</dt><dd>{formatDate(lead.created_at, true)}</dd></div>
              <div><dt>Came from</dt><dd>{sourceLabel(lead, contact)}</dd></div>
              <div><dt>First visit</dt><dd>{formatDate(lead.first_visit_at, true)}</dd></div>
              <div><dt>Landed on</dt><dd>{lead.landing_url ? <a href={safeExternalUrl(lead.landing_url)} target="_blank" rel="noreferrer">{lead.landing_url}</a> : '—'}</dd></div>
              <div><dt>Location</dt><dd>{[contact?.first_ip_city, contact?.first_ip_region, contact?.first_ip_country_code].filter(Boolean).join(', ') || '—'}</dd></div>
            </dl>
          </article>
        </section>

        <div className="admin-lead-grid">
          <main>
            <section className="admin-lead-card contact-card">
              <header><div><small>ENQUIRY CONTEXT</small><h2>What the client wants</h2></div><span>Created {formatDate(lead.created_at)}</span></header>
              <dl>
                <div><dt>Destination</dt><dd>{[lead.main_region, lead.subregion].filter(Boolean).join(' / ') || '—'}</dd></div>
                <div><dt>Budget</dt><dd>{lead.budget_min || lead.budget_max ? `${lead.budget_min ? money(lead.budget_min) : 'Any'} – ${lead.budget_max ? money(lead.budget_max) : 'open'}` : '—'}</dd></div>
                <div><dt>Enquiry page</dt><dd>{lead.enquiry_page_url ? <a href={safeExternalUrl(lead.enquiry_page_url)} target="_blank" rel="noreferrer">Open page ↗</a> : '—'}</dd></div>
                <div><dt>Referrer</dt><dd>{lead.referrer_url || '—'}</dd></div>
              </dl>
              {lead.message && <div className="admin-lead-context"><small>ORIGINAL MESSAGE</small><p>{lead.message}</p></div>}
            </section>

            <section className="admin-lead-card communication-card">
              <header><div><small>ACTIVITY</small><h2>Tracked email and link activity</h2></div><span>{emailOpens.length + trackedOpens.length} opens · {trackedClicks.length} clicks</span></header>
              <div className="admin-communication-section">
                <h3>Tracked emails</h3>
                {[...trackedEmails, ...emailSends].map((email) => {
                  const opens = 'open_count' in email ? (email.open_count || trackedOpens.filter((item) => item.email_id === email.id).length) : emailOpens.filter((item) => item.email_send_id === email.id).length
                  return <article key={`${'recipient_email' in email ? 'tracked' : 'send'}-${email.id}`}><div><strong>{email.subject || email.type || 'Email'}</strong><small>Sent {formatDate(email.sent_at || email.created_at, true)} · {opens} reliable open{opens === 1 ? '' : 's'}</small></div>{email.property_url && <a href={safeExternalUrl(email.property_url)} target="_blank" rel="noreferrer">Property ↗</a>}</article>
                })}
                {trackedEmails.length + emailSends.length === 0 && <p>No tracked email has been recorded for this lead.</p>}
              </div>
              <div className="admin-communication-section">
                <h3>Tracked link clicks</h3>
                {trackedClicks.map((click) => <article key={click.id}><div><strong>{click.url?.includes('/property/') ? 'Property link' : 'Email link'}</strong><small>{formatDate(click.clicked_at, true)} · {click.url}</small></div><a href={safeExternalUrl(click.url)} target="_blank" rel="noreferrer">Open ↗</a></article>)}
                {trackedClicks.length === 0 && <p>No tracked links have been clicked yet.</p>}
              </div>
            </section>

            <section className="admin-lead-card communication-card">
              <header><div><small>PRIVATE GMAIL</small><h2>Gmail communication</h2></div><span>Read-only · browser session</span></header>
              <div className="gmail-admin-body">
                {!gmailToken && <div className="gmail-connect"><p>Connect the COP Gmail account to show conversations with {contact?.email}. The access token stays in this browser tab and is not stored in COP.</p><button onClick={() => { initGmail(); gmailClient.current?.requestAccessToken({ prompt: 'consent' }) }}>Connect Gmail</button></div>}
                {gmailBusy && <p>Loading Gmail conversations…</p>}
                {gmailError && <div className="admin-lead-alert error">{gmailError}</div>}
                {gmailToken && !gmailBusy && gmailThreads.map((thread) => <article className="gmail-thread-card" key={thread.id}><div><strong>{thread.subject}</strong><small>{thread.from}</small><p>{thread.snippet}</p></div><span>{formatDate(thread.date, true)} · {thread.count} message{thread.count === 1 ? '' : 's'}</span></article>)}
                {gmailToken && !gmailBusy && !gmailThreads.length && !gmailError && <p>No Gmail conversation found for this email address.</p>}
                {gmailToken && <a className="gmail-open-link" href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(contact?.email || '')}`} target="_blank" rel="noreferrer">Open this contact in Gmail ↗</a>}
              </div>
            </section>

            <section className="admin-lead-card shortlist-card">
              <header><div><small>PROPERTY SHORTLIST</small><h2>Homes selected for this lead</h2></div><span>{shortlist.length} selected</span></header>
              <div className="admin-selected-properties">
                {shortlist.map((item) => {
                  const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
                  const image = property?.img || (Array.isArray(property?.images) ? property.images[0] : '')
                  return <article key={item.id}><span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} /><div><small>{[property?.city, property?.region, property?.country].filter(Boolean).join(', ')}</small><strong>{property?.title || item.property_slug}</strong><p>{money(property?.price, property?.currency)}{property?.beds ? ` · ${property.beds} beds` : ''} · {property?.partner || 'COP'}</p></div><Link href={`/property/${item.property_slug}`} target="_blank">View ↗</Link><button disabled={busy === `remove-${item.id}`} onClick={() => removeProperty(item)}>Remove</button></article>
                })}
                {shortlist.length === 0 && <div className="admin-empty-shortlist"><span>⌂</span><div><strong>No homes selected yet</strong><p>Search the live COP inventory below and add the most suitable listings.</p></div></div>}
              </div>
              <div className="admin-property-picker">
                <div><label>Search COP listings<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Property, destination, reference or partner…" /></label><label>Destination<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">All destinations</option>{regions.map((regionName) => <option key={regionName} value={regionName}>{regionName}</option>)}</select></label></div>
                <p>{catalogue.length} matching listings shown</p>
                <div className="admin-property-catalogue">{catalogue.map((property) => { const image = property.img || (Array.isArray(property.images) ? property.images[0] : ''); return <article key={property.slug}><span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} /><div><strong>{property.title}</strong><small>{[property.city, property.region, property.country].filter(Boolean).join(', ')} · {money(property.price, property.currency)}</small></div><button disabled={busy === `add-${property.slug}`} onClick={() => addProperty(property)}>+ Add</button></article> })}</div>
              </div>
            </section>
          </main>

          <aside>
            <section className="admin-lead-card note-card"><header><div><small>PROGRESS</small><h2>Add a note</h2></div></header><form onSubmit={saveNote}><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Conversation, next step or useful context…" /><button disabled={!note.trim() || busy === 'note'}>Save progress note</button></form></section>
            <section className="admin-lead-card activity-card"><header><div><small>AUDIT TRAIL</small><h2>Activity</h2></div></header><div>{activities.map((activity) => <article key={activity.id}><i>✓</i><p><strong>{activity.description || activity.type}</strong><small>{formatDate(activity.created_at, true)}</small></p></article>)}{activities.length === 0 && <p className="admin-no-activity">No activity recorded.</p>}</div></section>
          </aside>
        </div>
      </>}
    </AdminLayout>
  )
}
