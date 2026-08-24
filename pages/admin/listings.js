import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS = {
  Live: { label: 'Live', color: '#16775d', bg: '#e5f5ef' },
  for_sale: { label: 'For sale', color: '#16775d', bg: '#e5f5ef' },
  sold: { label: 'Sold', color: '#66727d', bg: '#edf0f2' },
  hidden: { label: 'Hidden', color: '#986813', bg: '#fff2d6' },
}

function formatPrice(price, currency = 'EUR') {
  if (!price) return 'Price on request'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminListings() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [partner, setPartner] = useState('')
  const [status, setStatus] = useState('')
  const [visibleCount, setVisibleCount] = useState(100)

  useEffect(() => {
    supabase.from('properties')
      .select('slug,title,city,region,country,price,currency,beds,status,partner,img,images,date_added,updated_at')
      .order('date_added', { ascending: false, nullsFirst: false })
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message)
        setProperties(data || [])
        setLoading(false)
      })
  }, [])

  const partners = useMemo(() => [...new Set(properties.map((p) => p.partner).filter(Boolean))].sort(), [properties])
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return properties.filter((p) => {
      if (partner && p.partner !== partner) return false
      if (status && p.status !== status) return false
      if (!needle) return true
      return [p.title, p.slug, p.city, p.region, p.country, p.partner].some((value) => value?.toLowerCase().includes(needle))
    })
  }, [properties, search, partner, status])

  useEffect(() => setVisibleCount(100), [search, partner, status])

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
          <button className={!status ? 'active' : ''} onClick={() => setStatus('')}>All <span>{properties.length}</span></button>
          <button className={status === 'Live' ? 'active' : ''} onClick={() => setStatus('Live')}>Live</button>
          <button className={status === 'sold' ? 'active' : ''} onClick={() => setStatus('sold')}>Sold</button>
          <button className={status === 'hidden' ? 'active' : ''} onClick={() => setStatus('hidden')}>Hidden</button>
        </div>
        <div className="admin-listing-filters">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listing, destination or reference…" />
          <select value={partner} onChange={(e) => setPartner(e.target.value)}>
            <option value="">All partners</option>
            {partners.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {error && <div className="admin-table-message error">{error}</div>}
        <div className="admin-responsive-table">
          <table className="admin-listings-table">
            <thead><tr><th>Listing</th><th>Destination</th><th>Partner</th><th>Status</th><th>Price</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {filtered.slice(0, visibleCount).map((property) => {
                const badge = STATUS[property.status] || STATUS.Live
                const image = property.img || (Array.isArray(property.images) ? property.images[0] : '')
                return (
                  <tr key={property.slug}>
                    <td>
                      <Link href={`/admin/property/${property.slug}`} className="admin-listing-name">
                        <span style={image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } : undefined} />
                        <div><strong>{property.title || 'Untitled listing'}</strong><small>{property.slug}{property.beds ? ` · ${property.beds} beds` : ''}</small></div>
                      </Link>
                    </td>
                    <td>{[property.city, property.region, property.country].filter(Boolean).join(', ') || '—'}</td>
                    <td>{property.partner || 'COP'}</td>
                    <td><i style={{ color: badge.color, background: badge.bg }}>{badge.label}</i></td>
                    <td><strong>{formatPrice(property.price, property.currency)}</strong></td>
                    <td>{formatDate(property.updated_at || property.date_added)}</td>
                    <td><Link href={`/admin/property/${property.slug}`} aria-label={`Edit ${property.title}`}>›</Link></td>
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
