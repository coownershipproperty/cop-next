import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const STATUS_COLORS = {
  for_sale: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sold: 'bg-stone-100 text-stone-500 border-stone-200',
  hidden: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function AdminIndex() {
  const [properties, setProperties] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [partners, setPartners] = useState([])

  useEffect(() => {
    supabase
      .from('properties')
      .select('slug,title,city,country,price,currency,beds,status,partner,img,extra_photos,total_images')
      .order('date_added', { ascending: false })
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
    setFiltered(result)
  }, [properties, search, partnerFilter, statusFilter])

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Properties</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search title, city, country…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 w-64 bg-white"
        />
        <select
          value={partnerFilter}
          onChange={e => setPartnerFilter(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
        >
          <option value="">All partners</option>
          {partners.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
        >
          <option value="">All statuses</option>
          <option value="for_sale">For sale</option>
          <option value="sold">Sold</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-stone-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <Link
              key={p.slug}
              href={`/admin/property/${p.slug}`}
              className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                {p.img ? (
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">No image</div>
                )}
                {p.partner && (
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {p.partner}
                  </span>
                )}
                {p.extra_photos?.length === 0 && p.partner === 'myne' && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    No brochure
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2">{p.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-stone-500">
                    {p.beds}bd · {p.price?.toLocaleString()} {p.currency}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status] || STATUS_COLORS.for_sale}`}>
                    {p.status}
                  </span>
                </div>
                {p.total_images > 0 && (
                  <p className="text-xs text-stone-400 mt-1">{p.total_images} photos</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg">No properties found</p>
          <p className="text-sm mt-1">Try adjusting your search</p>
        </div>
      )}
    </AdminLayout>
  )
}
