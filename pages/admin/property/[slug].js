import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white'
const labelCls = 'block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wide'

function Section({ title, children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function PropertyEdit() {
  const router = useRouter()
  const { slug } = router.query

  const [property, setProperty] = useState(null)
  const [form, setForm] = useState(null)
  const [extraPhotos, setExtraPhotos] = useState([])
  const [saveState, setSaveState] = useState('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!slug) return
    supabase.from('properties').select('*').eq('slug', slug).single()
      .then(({ data }) => {
        if (!data) return
        setProperty(data)
        setExtraPhotos(data.extra_photos || [])
        setForm({
          title: data.title || '',
          status: data.status || 'for_sale',
          price: data.price || 0,
          currency: data.currency || 'EUR',
          beds: data.beds || 0,
          baths: data.baths || 0,
          city: data.city || '',
          region: data.region || '',
          country: data.country || '',
          property_type: data.property_type || '',
          property_style: data.property_style || '',
          description: data.description || '',
          partner_url: data.partner_url || '',
          lat: data.lat || '',
          lng: data.lng || '',
          amenities: (data.amenities || []).join(', '),
        })
      })
  }, [slug])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaveState('saving')
    const amenitiesArray = form.amenities.split(',').map(s => s.trim()).filter(Boolean)
    const { error } = await supabase.from('properties').update({
      title: form.title,
      status: form.status,
      price: Number(form.price),
      currency: form.currency,
      beds: Number(form.beds),
      baths: Number(form.baths),
      city: form.city,
      region: form.region || null,
      country: form.country,
      property_type: form.property_type || null,
      property_style: form.property_style || null,
      description: form.description || null,
      partner_url: form.partner_url || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      amenities: amenitiesArray,
      extra_photos: extraPhotos,
      total_images: (property.photos?.length || 0) + extraPhotos.length,
    }).eq('slug', slug)

    if (error) {
      setSaveState('error')
      setSaveMsg(error.message)
    } else {
      setSaveState('saved')
      setSaveMsg('Saved — site updates in ~2 min')
      setTimeout(() => { setSaveState('idle'); setSaveMsg('') }, 4000)
    }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)

    const { data: { session } } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append('slug', slug)
    files.forEach(f => formData.append('files', f))

    const res = await fetch('/api/admin/upload-photo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    })
    const { urls } = await res.json()
    setExtraPhotos(prev => [...prev, ...urls])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(url) {
    setExtraPhotos(prev => prev.filter(u => u !== url))
  }

  if (!form) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-stone-400">Loading property…</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
        <Link href="/admin" className="hover:text-stone-700">Properties</Link>
        <span>/</span>
        <span className="text-stone-700 font-medium truncate max-w-xs">{property.title}</span>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-stone-800 leading-snug">{property.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-stone-400">{slug}</span>
            <Link href={`/property/${slug}`} target="_blank" className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">
              View on site ↗
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveMsg && (
            <span className={`text-xs ${saveState === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form fields */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Listing info">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="for_sale">For sale</option>
                  <option value="sold">Sold</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Property type</label>
                <select className={inputCls} value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                  <option value="">—</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="house">House</option>
                  <option value="chalet">Chalet</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="finca">Finca</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Style</label>
                <input className={inputCls} placeholder="garden / terrace / modern…" value={form.property_style} onChange={e => set('property_style', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Partner URL</label>
                <input className={inputCls} placeholder="https://…" value={form.partner_url} onChange={e => set('partner_url', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Pricing & specs">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Price</label>
                <input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="SEK">SEK</option>
                </select>
              </div>
              <div />
              <div>
                <label className={labelCls}>Beds</label>
                <input type="number" className={inputCls} value={form.beds} onChange={e => set('beds', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Baths</label>
                <input type="number" className={inputCls} value={form.baths} onChange={e => set('baths', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Location">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Region</label>
                <input className={inputCls} value={form.region} onChange={e => set('region', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Latitude</label>
                <input type="number" step="any" className={inputCls} value={form.lat} onChange={e => set('lat', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Longitude</label>
                <input type="number" step="any" className={inputCls} value={form.lng} onChange={e => set('lng', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Description">
            <textarea
              rows={10}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Property description — use **bold** for key terms…"
            />
            <p className="text-xs text-stone-400 mt-1">{form.description.length} chars</p>
          </Section>

          <Section title="Amenities">
            <input className={inputCls} value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="Pool, Sea view, Air conditioning…" />
            <p className="text-xs text-stone-400 mt-1">Comma-separated</p>
            {form.amenities && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.amenities.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                  <span key={a} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full border border-stone-200">{a}</span>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right: images */}
        <div className="space-y-6">
          <Section title="Hero image">
            {property.img
              ? <img src={property.img} alt="Hero" className="w-full aspect-[4/3] object-cover rounded-lg border border-stone-200" />
              : <div className="w-full aspect-[4/3] bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-xs">No hero image</div>
            }
            <p className="text-xs text-stone-400 mt-1.5">Used on listing cards</p>
          </Section>

          <Section title={`Gallery (${property.images?.length || 0} visible)`}>
            <div className="grid grid-cols-3 gap-2">
              {(property.images || []).map((url, i) => (
                <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg border border-stone-200" />
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-1.5">Shown before unlock</p>
          </Section>

          <Section title={`All photos (${property.photos?.length || 0})`}>
            <div className="grid grid-cols-4 gap-1.5">
              {(property.photos || []).slice(0, 8).map((url, i) => (
                <img key={i} src={url} alt="" className="aspect-square object-cover rounded border border-stone-200" />
              ))}
              {(property.photos?.length || 0) > 8 && (
                <div className="aspect-square bg-stone-100 rounded border border-stone-200 flex items-center justify-center text-xs text-stone-500">
                  +{property.photos.length - 8}
                </div>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1.5">Full unlocked gallery</p>
          </Section>

          <Section title={`Brochure / extras (${extraPhotos.length})`}>
            {extraPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {extraPhotos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="aspect-square object-cover rounded-lg border border-stone-200" />
                    <button
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full items-center justify-center hidden group-hover:flex"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border border-dashed border-stone-300 rounded-lg py-3 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading…' : '+ Upload brochure screenshots'}
            </button>
            <p className="text-xs text-stone-400 mt-1.5">Remember to Save after uploading</p>
          </Section>
        </div>
      </div>
    </AdminLayout>
  )
}
