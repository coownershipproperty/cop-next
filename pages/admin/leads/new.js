import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', nationality: '', residenceCity: '', residenceCountry: '',
  mainRegion: '', subregion: '', budgetMin: '', budgetMax: '', propertySlug: '', message: '',
}

async function authedRequest(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The lead could not be created.')
  return payload
}

export default function NewAdminLead() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [properties, setProperties] = useState([])
  const [propertySearch, setPropertySearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('properties')
      .select('slug,title,city,region,country,partner,price,currency,status')
      .in('status', ['Live', 'for_sale'])
      .order('date_added', { ascending: false, nullsFirst: false })
      .limit(1000)
      .then(({ data, error: loadError }) => {
        if (loadError) setError('Listings could not be loaded. You can still create a general lead.')
        else setProperties(data || [])
      })
  }, [])

  const filteredProperties = useMemo(() => {
    const needle = propertySearch.trim().toLowerCase()
    if (!needle) return properties.slice(0, 80)
    return properties.filter((property) => [property.title, property.slug, property.city, property.region, property.country, property.partner]
      .some((value) => value?.toLowerCase().includes(needle))).slice(0, 80)
  }, [properties, propertySearch])

  const selectedProperty = properties.find((property) => property.slug === form.propertySlug)

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const payload = await authedRequest('/api/admin/leads', { method: 'POST', body: JSON.stringify(form) })
      await router.push(`/admin/leads/${payload.leadId}`)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <Head><title>New lead — COP Admin</title></Head>
      <div className="admin-lead-back"><Link href="/admin/leads">← Back to all leads</Link></div>
      <section className="admin-new-lead">
        <header><div><small>COP CRM</small><h1>Add a lead manually</h1><p>Create the internal record first. You can review it and send it to a Partner Hub later.</p></div><span>Defaults to New lead</span></header>
        {error && <div className="admin-lead-alert error">{error}</div>}
        <form onSubmit={submit}>
          <fieldset><legend>Contact</legend><div className="admin-edit-form-grid">
            <label>First name<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label>
            <label>Last name<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label>
            <label>Email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
            <label>International phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+34 600 000 000" /></label>
            <label>Nationality<input value={form.nationality} onChange={(event) => update('nationality', event.target.value)} placeholder="e.g. Belgian" /></label>
            <label>Residence city<input value={form.residenceCity} onChange={(event) => update('residenceCity', event.target.value)} /></label>
            <label>Residence country<input value={form.residenceCountry} onChange={(event) => update('residenceCountry', event.target.value)} /></label>
          </div></fieldset>

          <fieldset><legend>Opportunity</legend><div className="admin-edit-form-grid">
            <label>Destination region<input value={form.mainRegion} onChange={(event) => update('mainRegion', event.target.value)} placeholder="e.g. Mallorca" /></label>
            <label>Destination subregion<input value={form.subregion} onChange={(event) => update('subregion', event.target.value)} placeholder="e.g. Palma" /></label>
            <label>Budget minimum<input type="number" min="0" step="1000" value={form.budgetMin} onChange={(event) => update('budgetMin', event.target.value)} /></label>
            <label>Budget maximum<input type="number" min="0" step="1000" value={form.budgetMax} onChange={(event) => update('budgetMax', event.target.value)} /></label>
            <label className="admin-edit-message">Original context / notes<textarea value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="What the client wants, next steps, and useful context…" /></label>
          </div></fieldset>

          <fieldset><legend>Optional COP listing</legend>
            <label className="admin-listing-search">Search listings<input value={propertySearch} onChange={(event) => setPropertySearch(event.target.value)} placeholder="Property, destination, partner or slug…" /></label>
            <select className="admin-listing-select" value={form.propertySlug} onChange={(event) => update('propertySlug', event.target.value)}>
              <option value="">General enquiry — no listing selected</option>
              {filteredProperties.map((property) => <option key={property.slug} value={property.slug}>{property.title} — {[property.city, property.region, property.partner].filter(Boolean).join(' · ')}</option>)}
            </select>
            {selectedProperty && <div className="admin-selected-listing"><strong>{selectedProperty.title}</strong><span>{[selectedProperty.city, selectedProperty.region, selectedProperty.country].filter(Boolean).join(', ')} · {selectedProperty.currency || 'EUR'} {Number(selectedProperty.price || 0).toLocaleString()}</span></div>}
          </fieldset>

          <div className="admin-edit-actions"><Link href="/admin/leads">Cancel</Link><button disabled={busy}>{busy ? 'Creating lead…' : 'Create lead'}</button></div>
        </form>
      </section>
    </AdminLayout>
  )
}
