import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

/**
 * /admin/listings — inventory table, rebuilt 26 Aug 2026 for customisability
 * (same playbook as /admin/crm): sort presets incl. "Newest", sortable column
 * headers, country / beds / price filters, a column picker, density toggle and
 * CSV export — with columns, density and sort persisted per browser.
 */

const STATUS = {
  Live: { label: 'Live', color: '#16775d', bg: '#e5f5ef' },
  for_sale: { label: 'For sale', color: '#16775d', bg: '#e5f5ef' },
  sold: { label: 'Sold', color: '#66727d', bg: '#edf0f2' },
  hidden: { label: 'Hidden', color: '#986813', bg: '#fff2d6' },
}

const SORTS = {
  newest:    { label: 'Newest first',      fn: (a, b) => (b.date_added || '').localeCompare(a.date_added || '') },
  oldest:    { label: 'Oldest first',      fn: (a, b) => (a.date_added || '').localeCompare(b.date_added || '') },
  updated:   { label: 'Recently updated',  fn: (a, b) => (b.updated_at || b.date_added || '').localeCompare(a.updated_at || a.date_added || '') },
  price_hi:  { label: 'Price: high → low', fn: (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0) },
  price_lo:  { label: 'Price: low → high', fn: (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0) },
  beds:      { label: 'Most bedrooms',     fn: (a, b) => (b.beds || 0) - (a.beds || 0) },
  title:     { label: 'Title A–Z',         fn: (a, b) => (a.title || '').localeCompare(b.title || '') },
}

// Column registry. `listing` is always on; the rest toggle in the picker.
const COLUMNS = [
  { key: 'listing',     label: 'Listing', always: true },
  { key: 'destination', label: 'Destination' },
  { key: 'partner',     label: 'Partner' },
  { key: 'status',      label: 'Status' },
  { key: 'price',       label: 'Price' },
  { key: 'beds',        label: 'Beds' },
  { key: 'baths',       label: 'Baths' },
  { key: 'size',        label: 'Size' },
  { key: 'photos',      label: 'Photos' },
  { key: 'added',       label: 'Added' },
  { key: 'updated',     label: 'Updated' },
]
const DEFAULT_COLS = ['listing', 'destination', 'partner', 'status', 'price', 'updated']

// Which sort key a header click maps to (second click flips hi/lo where a pair exists).
const HEADER_SORT = {
  destination: ['title', 'title'],
  partner: ['title', 'title'],
  price: ['price_hi', 'price_lo'],
  beds: ['beds', 'beds'],
  added: ['newest', 'oldest'],
  updated: ['updated', 'updated'],
  listing: ['title', 'title'],
}

const PRICE_BANDS = [
  ['', 'Any price'],
  ['0-250000', 'Under 250k'],
  ['250000-500000', '250k – 500k'],
  ['500000-1000000', '500k – 1M'],
  ['1000000-99999999', 'Over 1M'],
]

const LS = 'copadmin.listings.'
function loadLS(key, fallback) {
  try { const v = localStorage.getItem(LS + key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveLS(key, value) {
  try { localStorage.setItem(LS + key, JSON.stringify(value)) } catch { /* ignore */ }
}

function formatPrice(price, currency = 'EUR') {
  if (!price) return 'Price on request'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ui = {
  btn: { fontSize: 12.5, fontWeight: 600, padding: '8px 13px', borderRadius: 7, cursor: 'pointer', border: '1px solid #E3DDD2', background: '#fff', color: '#1F2F3B' },
  btnOn: { borderColor: '#2C4A5E', background: '#2C4A5E', color: '#fff' },
  pop: { position: 'absolute', top: '110%', right: 0, zIndex: 40, background: '#fff', border: '1px solid #E3DDD2', borderRadius: 10, boxShadow: '0 14px 40px rgba(31,47,59,0.14)', padding: '12px 14px', minWidth: 190 },
  popRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0', color: '#1F2F3B', cursor: 'pointer' },
  sortHint: { fontSize: 10, color: '#C9A84C', marginLeft: 4 },
}

export default function AdminListings() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [partner, setPartner] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [priceBand, setPriceBand] = useState('')
  const [sort, setSort] = useState('newest')
  const [colsOn, setColsOn] = useState(DEFAULT_COLS)
  const [density, setDensity] = useState('comfortable')
  const [colsOpen, setColsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(100)
  const hydrated = useRef(false)

  useEffect(() => {
    setColsOn(loadLS('cols', DEFAULT_COLS))
    setDensity(loadLS('density', 'comfortable'))
    setSort(loadLS('sort', 'newest'))
    hydrated.current = true
  }, [])
  useEffect(() => { if (hydrated.current) saveLS('cols', colsOn) }, [colsOn])
  useEffect(() => { if (hydrated.current) saveLS('density', density) }, [density])
  useEffect(() => { if (hydrated.current) saveLS('sort', sort) }, [sort])

  useEffect(() => {
    supabase.from('properties')
      .select('slug,title,city,region,country,price,currency,beds,baths,size,status,partner,img,images,total_images,date_added,updated_at')
      .order('date_added', { ascending: false, nullsFirst: false })
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message)
        setProperties(data || [])
        setLoading(false)
      })
  }, [])

  const partners = useMemo(() => [...new Set(properties.map((p) => p.partner).filter(Boolean))].sort(), [properties])
  const countries = useMemo(() => [...new Set(properties.map((p) => p.country).filter(Boolean))].sort(), [properties])
  const counts = useMemo(() => ({
    all: properties.length,
    live: properties.filter((p) => p.status === 'Live' || p.status === 'for_sale').length,
    sold: properties.filter((p) => p.status === 'sold').length,
    hidden: properties.filter((p) => p.status === 'hidden').length,
  }), [properties])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const [pMin, pMax] = priceBand ? priceBand.split('-').map(Number) : [null, null]
    const rows = properties.filter((p) => {
      if (partner && p.partner !== partner) return false
      if (status === 'Live' ? !(p.status === 'Live' || p.status === 'for_sale') : (status && p.status !== status)) return false
      if (country && p.country !== country) return false
      if (minBeds && (p.beds || 0) < Number(minBeds)) return false
      if (pMin !== null && !((Number(p.price) || 0) >= pMin && (Number(p.price) || 0) <= pMax)) return false
      if (!needle) return true
      return [p.title, p.slug, p.city, p.region, p.country, p.partner].some((value) => value?.toLowerCase().includes(needle))
    })
    rows.sort(SORTS[sort]?.fn || SORTS.newest.fn)
    return rows
  }, [properties, search, partner, status, country, minBeds, priceBand, sort])

  useEffect(() => setVisibleCount(100), [search, partner, status, country, minBeds, priceBand, sort])

  function headerSort(key) {
    const pair = HEADER_SORT[key]
    if (!pair) return
    setSort((cur) => (cur === pair[0] && pair[1] !== pair[0] ? pair[1] : pair[0]))
  }

  function exportCsv() {
    const esc = (v) => { const t = String(v ?? '').replaceAll('"', '""'); return /[",\n]/.test(t) ? `"${t}"` : t }
    const lines = ['title,slug,city,region,country,partner,status,price,currency,beds,baths,size,photos,added,updated']
    for (const p of filtered) {
      lines.push([p.title, p.slug, p.city, p.region, p.country, p.partner || 'COP', p.status,
        p.price, p.currency, p.beds, p.baths, p.size, p.total_images,
        (p.date_added || '').slice(0, 10), (p.updated_at || '').slice(0, 10)].map(esc).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cop-listings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const visibleCols = COLUMNS.filter((c) => colsOn.includes(c.key))
  const cellPad = density === 'compact' ? '6px 10px' : undefined

  function cellFor(p, key) {
    switch (key) {
      case 'destination': return [p.city, p.region, p.country].filter(Boolean).join(', ') || '—'
      case 'partner': return p.partner || 'COP'
      case 'status': {
        const badge = STATUS[p.status] || STATUS.Live
        return <i style={{ color: badge.color, background: badge.bg }}>{badge.label}</i>
      }
      case 'price': return <strong>{formatPrice(p.price, p.currency)}</strong>
      case 'beds': return p.beds || '—'
      case 'baths': return p.baths || '—'
      case 'size': return p.size ? `${p.size} m²` : '—'
      case 'photos': return p.total_images ?? (Array.isArray(p.images) ? p.images.length : '—')
      case 'added': return formatDate(p.date_added)
      case 'updated': return formatDate(p.updated_at || p.date_added)
      default: return null
    }
  }

  return (
    <AdminLayout>
      <Head><title>Listings — COP Admin</title></Head>
      <div className="admin-page-heading">
        <div><h1>Listings</h1><p>{loading ? 'Loading inventory…' : `${filtered.length} of ${properties.length} COP listings`}</p></div>
        <div className="admin-page-actions">
          <Link href="/our-homes" target="_blank" className="admin-secondary-button">View public listings ↗</Link>
        </div>
      </div>

      <section className="admin-listing-card">
        <div className="admin-listing-tabs">
          <button className={!status ? 'active' : ''} onClick={() => setStatus('')}>All <span>{counts.all}</span></button>
          <button className={status === 'Live' ? 'active' : ''} onClick={() => setStatus('Live')}>Live <span>{counts.live}</span></button>
          <button className={status === 'sold' ? 'active' : ''} onClick={() => setStatus('sold')}>Sold <span>{counts.sold}</span></button>
          <button className={status === 'hidden' ? 'active' : ''} onClick={() => setStatus('hidden')}>Hidden <span>{counts.hidden}</span></button>
        </div>

        <div className="admin-listing-filters" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listing, destination or reference…" style={{ minWidth: 230, flex: '1 1 230px' }} />
          <select value={partner} onChange={(e) => setPartner(e.target.value)}>
            <option value="">All partners</option>
            {partners.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {countries.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)}>
            <option value="">Any beds</option>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
          </select>
          <select value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
            {PRICE_BANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} title="Sort order">
            {Object.entries(SORTS).map(([v, s]) => <option key={v} value={v}>Sort: {s.label}</option>)}
          </select>

          <span style={{ flex: 1 }} />

          <div style={{ position: 'relative' }}>
            <button type="button" style={{ ...ui.btn, ...(colsOpen ? ui.btnOn : {}) }} onClick={() => setColsOpen((o) => !o)}>
              Columns ({visibleCols.length})
            </button>
            {colsOpen && (
              <div style={ui.pop}>
                {COLUMNS.map((c) => (
                  <label key={c.key} style={{ ...ui.popRow, opacity: c.always ? 0.5 : 1 }}>
                    <input
                      type="checkbox"
                      checked={colsOn.includes(c.key)}
                      disabled={c.always}
                      onChange={() => setColsOn((prev) => prev.includes(c.key)
                        ? prev.filter((k) => k !== c.key)
                        : COLUMNS.map((x) => x.key).filter((k) => k === c.key || prev.includes(k)))}
                    />
                    {c.label}
                  </label>
                ))}
                <button type="button" style={{ ...ui.btn, padding: '5px 10px', fontSize: 12, marginTop: 8 }} onClick={() => setColsOn(DEFAULT_COLS)}>Reset</button>
              </div>
            )}
          </div>
          <button type="button" style={ui.btn} title="Toggle row density" onClick={() => setDensity((d) => d === 'compact' ? 'comfortable' : 'compact')}>
            {density === 'compact' ? '☰ Compact' : '≡ Comfortable'}
          </button>
          <button type="button" style={ui.btn} onClick={exportCsv}>↓ CSV</button>
        </div>

        {error && <div className="admin-table-message error">{error}</div>}
        <div className="admin-responsive-table" onClick={() => colsOpen && setColsOpen(false)}>
          <table className="admin-listings-table">
            <thead>
              <tr>
                {visibleCols.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => headerSort(c.key)}
                    style={HEADER_SORT[c.key] ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                    title={HEADER_SORT[c.key] ? 'Click to sort' : undefined}
                  >
                    {c.label}
                    {HEADER_SORT[c.key] && HEADER_SORT[c.key].includes(sort) && (
                      <span style={ui.sortHint}>{sort.endsWith('_lo') || sort === 'oldest' ? '▲' : '▼'}</span>
                    )}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visibleCount).map((property) => {
                const image = property.img || (Array.isArray(property.images) ? property.images[0] : '')
                return (
                  <tr key={property.slug}>
                    <td style={cellPad ? { padding: cellPad } : undefined}>
                      <Link href={`/admin/property/${property.slug}`} className="admin-listing-name">
                        <span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} />
                        <div><strong>{property.title || 'Untitled listing'}</strong><small>{property.slug}{property.beds ? ` · ${property.beds} beds` : ''}</small></div>
                      </Link>
                    </td>
                    {visibleCols.filter((c) => c.key !== 'listing').map((c) => (
                      <td key={c.key} style={cellPad ? { padding: cellPad } : undefined}>{cellFor(property, c.key)}</td>
                    ))}
                    <td style={cellPad ? { padding: cellPad } : undefined}>
                      <Link href={`/admin/property/${property.slug}`} aria-label={`Edit ${property.title}`}>›</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className="admin-table-message">Loading listings…</div>}
        {!loading && filtered.length === 0 && <div className="admin-table-message">No listings match these filters.</div>}
        {!loading && filtered.length > visibleCount && <div className="admin-listing-more"><span>Showing {visibleCount} of {filtered.length}</span><button onClick={() => setVisibleCount((count) => count + 100)}>Show 100 more</button></div>}
      </section>
    </AdminLayout>
  )
}
