import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS = {
  for_sale: { label: 'For sale', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  sold: { label: 'Sold', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  hidden: { label: 'Hidden', bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
}

export default function AdminIndex() {
  const [properties, setProperties] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [partners, setPartners] = useState([])
  // Sort options:
  //   'newest'      — date_added DESC (default; matches the SQL order)
  //   'oldest'      — date_added ASC
  //   'price_desc'  — most expensive first
  //   'price_asc'   — cheapest first
  //   'title_asc'   — alphabetical
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    supabase
      .from('properties')
      .select('slug,title,city,country,price,currency,beds,status,partner,img,extra_photos,total_images,date_added,created_at')
      .order('date_added', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setProperties(data || [])
        setPartners([...new Set((data || []).map(p => p.partner).filter(Boolean))])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let result = properties
    if (search) result = result.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.country?.toLowerCase().includes(search.toLowerCase())
    )
    if (partnerFilter) result = result.filter(p => p.partner === partnerFilter)
    if (statusFilter) result = result.filter(p => p.status === statusFilter)

    // Apply sort. The clone keeps the source array stable so subsequent
    // changes don't re-sort an already-sorted slice.
    const sorted = [...result]
    const dateVal = (p) => p.date_added || p.created_at || ''
    if (sortBy === 'newest')      sorted.sort((a, b) => dateVal(b).localeCompare(dateVal(a)))
    if (sortBy === 'oldest')      sorted.sort((a, b) => dateVal(a).localeCompare(dateVal(b)))
    if (sortBy === 'price_desc')  sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    if (sortBy === 'price_asc')   sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    if (sortBy === 'title_asc')   sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))

    setFiltered(sorted)
  }, [properties, search, partnerFilter, statusFilter, sortBy])

  // Format a date as "8 May" / "26 Apr" — short, locale-stable.
  const formatAddedDate = (value) => {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const inputStyle = {
    border: '1px solid #e8e0d4',
    borderRadius: 10,
    padding: '9px 14px',
    fontSize: 13,
    color: '#1a2533',
    background: '#ffffff',
    outline: 'none',
    fontFamily: '"Nunito Sans", sans-serif',
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#2C4A5E',
            fontFamily: '"Playfair Display", serif',
            margin: 0,
          }}>
            Properties
          </h1>
          <p style={{ fontSize: 13, color: '#8a9aaa', marginTop: 4 }}>
            {loading ? 'Loading…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        <input
          type="search"
          placeholder="Search title, city, country…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 260 }}
        />
        <select
          value={partnerFilter}
          onChange={e => setPartnerFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="">All partners</option>
          {partners.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="">All statuses</option>
          <option value="for_sale">For sale</option>
          <option value="sold">Sold</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={inputStyle}
          title="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price_desc">Price: high to low</option>
          <option value="price_asc">Price: low to high</option>
          <option value="title_asc">Title: A → Z</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <div style={{ paddingTop: '75%', background: '#f0ede8' }} />
              <div style={{ padding: 14 }}>
                <div style={{ height: 12, background: '#f0ede8', borderRadius: 4, marginBottom: 8, width: '75%' }} />
                <div style={{ height: 12, background: '#f0ede8', borderRadius: 4, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(p => {
            const st = STATUS[p.status] || STATUS.for_sale
            return (
              <Link
                key={p.slug}
                href={`/admin/property/${p.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e8e0d4',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(44,74,94,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', paddingTop: '75%', background: '#f0ede8' }}>
                    {p.img ? (
                      <img
                        src={p.img}
                        alt={p.title}
                        style={{
                          position: 'absolute', inset: 0,
                          width: '100%', height: '100%', objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#bdb5aa', fontSize: 12,
                      }}>
                        No image
                      </div>
                    )}
                    {p.partner && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'rgba(44,74,94,0.85)',
                        color: '#ffffff',
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 20,
                        backdropFilter: 'blur(4px)',
                      }}>
                        {p.partner}
                      </span>
                    )}
                    {p.extra_photos?.length === 0 && p.partner === 'myne' && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#C9A84C',
                        color: '#ffffff',
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 20,
                      }}>
                        No brochure
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1a2533',
                      lineHeight: 1.4,
                      margin: '0 0 8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {p.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#8a9aaa' }}>
                        {p.beds}bd · {p.price?.toLocaleString()} {p.currency}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 20,
                        background: st.bg, color: st.color,
                        border: `1px solid ${st.border}`,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 6,
                      gap: 8,
                    }}>
                      <span style={{ fontSize: 11, color: '#bdb5aa' }}>
                        {p.total_images > 0 ? `${p.total_images} photos` : ''}
                      </span>
                      {formatAddedDate(p.date_added || p.created_at) && (
                        <span style={{
                          fontSize: 11,
                          color: '#8a9aaa',
                          fontWeight: 600,
                        }}>
                          Added {formatAddedDate(p.date_added || p.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8a9aaa' }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No properties found</p>
          <p style={{ fontSize: 14 }}>Try adjusting your search or filters</p>
        </div>
      )}
    </AdminLayout>
  )
}
