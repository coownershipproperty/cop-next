import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import {
  EUROPE_DIAL_CODES,
  INTERNATIONAL_DIAL_CODES,
  joinInternationalPhone,
} from '@/lib/internationalDialCodes'
import { LEAD_SOURCE_OPTIONS } from '@/lib/leadSources'
import { buildDestinationGroups, NATIONALITY_GROUPS } from '@/lib/leadFormOptions'

const EMPTY = {
  firstName: '', lastName: '', email: '', phoneDialCode: '+44', phone: '', nationality: '', leadSource: 'Manual entry',
  mainRegion: '', subregion: '', budgetMin: '', budgetMax: '', propertySlug: '', message: '',
}

const BUDGET_MINIMUMS = [50_000, 100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000]
const BUDGET_MAXIMUMS = [100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000]

const priorityDialCodes = [
  EUROPE_DIAL_CODES.find(([country]) => country === 'United Kingdom'),
  INTERNATIONAL_DIAL_CODES.find(([country]) => country === 'United States / Canada'),
].filter(Boolean)
const europeanDialCodes = EUROPE_DIAL_CODES.filter(([country]) => country !== 'United Kingdom')
const otherDialCodes = INTERNATIONAL_DIAL_CODES.filter(([country]) => country !== 'United States / Canada')

function moneyLabel(value, plus = false) {
  return `€${Number(value).toLocaleString('en-GB')}${plus ? '+' : ''}`
}

function propertyPriceLabel(property) {
  const price = Number(property?.price)
  if (!Number.isFinite(price) || price <= 0) return 'Price on request'
  const currency = String(property.currency || 'EUR').toUpperCase()
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
  } catch {
    return `${currency} ${price.toLocaleString('en-GB')}`
  }
}

function DialCodeOptions() {
  const render = ([country, code]) => <option key={`${country}-${code}`} value={code}>{country} ({code})</option>
  return <>
    <optgroup label="UK & USA">{priorityDialCodes.map(render)}</optgroup>
    <optgroup label="Europe">{europeanDialCodes.map(render)}</optgroup>
    <optgroup label="Rest of the world">{otherDialCodes.map(render)}</optgroup>
  </>
}

function NationalityOptions() {
  return <>{NATIONALITY_GROUPS.map((group) => <optgroup key={group.label} label={group.label}>{group.countries.map((country) => <option key={country} value={country}>{country}</option>)}</optgroup>)}</>
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

  const destinationGroups = useMemo(() => buildDestinationGroups(properties), [properties])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const { phoneDialCode, ...leadForm } = form
      const payload = await authedRequest('/api/admin/leads', {
        method: 'POST',
        body: JSON.stringify({ ...leadForm, phone: joinInternationalPhone(phoneDialCode, form.phone) }),
      })
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
            <label>International phone<div className="admin-phone-field"><select aria-label="International dialling code" value={form.phoneDialCode} onChange={(event) => update('phoneDialCode', event.target.value)}><DialCodeOptions /></select><input type="tel" autoComplete="tel-national" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="600 000 000" /></div></label>
            <label>Nationality<select value={form.nationality} onChange={(event) => update('nationality', event.target.value)}><option value="">Select nationality</option><NationalityOptions /></select></label>
            <label>Lead source<select value={form.leadSource} onChange={(event) => update('leadSource', event.target.value)}>{LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
          </div></fieldset>

          <fieldset><legend>Opportunity</legend><div className="admin-edit-form-grid">
            <label>Destination region<select value={form.mainRegion} onChange={(event) => update('mainRegion', event.target.value)}><option value="">Select COP destination</option>{destinationGroups.map((group) => <optgroup key={group.country} label={group.country}>{group.regions.map((region) => <option key={`${group.country}-${region}`} value={region}>{region}</option>)}</optgroup>)}</select></label>
            <label>Destination subregion<input value={form.subregion} onChange={(event) => update('subregion', event.target.value)} placeholder="e.g. Palma" /></label>
            <label>Budget minimum<select value={form.budgetMin} onChange={(event) => setForm((current) => ({ ...current, budgetMin: event.target.value, budgetMax: current.budgetMax && Number(event.target.value) > Number(current.budgetMax) ? '' : current.budgetMax }))}><option value="">No minimum selected</option>{BUDGET_MINIMUMS.map((value) => <option key={value} value={value}>{moneyLabel(value)}</option>)}</select></label>
            <label>Budget maximum<select value={form.budgetMax} onChange={(event) => update('budgetMax', event.target.value)}><option value="">No maximum selected</option>{BUDGET_MAXIMUMS.map((value) => <option key={value} value={value}>{moneyLabel(value, value === 1_000_000)}</option>)}</select></label>
            <label className="admin-edit-message">Original context / notes<textarea value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="What the client wants, next steps, and useful context…" /></label>
          </div></fieldset>

          <fieldset><legend>Optional COP listing</legend>
            <label className="admin-listing-search">Search listings<input value={propertySearch} onChange={(event) => setPropertySearch(event.target.value)} placeholder="Property, destination, partner or slug…" /></label>
            <select className="admin-listing-select" value={form.propertySlug} onChange={(event) => update('propertySlug', event.target.value)}>
              <option value="">General enquiry — no listing selected</option>
              {filteredProperties.map((property) => <option key={property.slug} value={property.slug}>{property.title} — {propertyPriceLabel(property)} — {[property.city, property.region, property.partner].filter(Boolean).join(' · ')}</option>)}
            </select>
            {selectedProperty && <div className="admin-selected-listing"><strong>{selectedProperty.title}</strong><span>{[selectedProperty.city, selectedProperty.region, selectedProperty.country].filter(Boolean).join(', ')} · {propertyPriceLabel(selectedProperty)}</span></div>}
          </fieldset>

          <div className="admin-edit-actions"><Link href="/admin/leads">Cancel</Link><button disabled={busy}>{busy ? 'Creating lead…' : 'Create lead'}</button></div>
        </form>
      </section>
    </AdminLayout>
  )
}
