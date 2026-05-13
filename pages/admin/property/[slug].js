import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

// ─── shared style tokens ───────────────────────────────────────────────────────
const C = {
  blue: '#2C4A5E', blueLight: '#3a5f78',
  gold: '#C9A84C', cream: '#F5F2EC',
  text: '#1a2533', muted: '#5a6a7a', faint: '#8a9aaa',
  border: '#e8e0d4', bg: '#faf9f7',
  white: '#ffffff',
  green: '#065f46', greenBg: '#ecfdf5', greenBorder: '#a7f3d0',
  red: '#dc2626', redBg: '#fef2f2',
}

const input = {
  width: '100%',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: C.text,
  background: C.white,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: '"Nunito Sans", sans-serif',
  transition: 'border-color 0.15s',
}

const label = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: C.faint,
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

function Field({ l, children }) {
  return (
    <div>
      <label style={label}>{l}</label>
      {children}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 22px',
      boxShadow: '0 1px 4px rgba(44,74,94,0.04)',
    }}>
      {title && (
        <h2 style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.faint,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          margin: '0 0 18px',
          paddingBottom: 12,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

function Grid({ cols, gap, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: gap || 14,
    }}>
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
  const [gallery, setGallery] = useState([])   // pre-unlock gallery (images)
  const [photos, setPhotos] = useState([])     // full unlocked gallery (photos)
  const [dragIdx, setDragIdx] = useState(null) // { list: 'gallery'|'photos'|'extras', i }
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
        setGallery(data.images || [])
        setPhotos(data.photos || [])
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

  // ── Drag-and-drop reorder helpers ────────────────────────────────────────
  function reorder(list, fromIdx, toIdx) {
    if (fromIdx === toIdx) return list
    const next = [...list]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    return next
  }
  function handleDragStart(list, i) { setDragIdx({ list, i }) }
  function handleDragEnd() { setDragIdx(null) }
  function handleDrop(list, toIdx) {
    if (!dragIdx || dragIdx.list !== list) return
    if (list === 'gallery') setGallery(g => reorder(g, dragIdx.i, toIdx))
    if (list === 'photos')  setPhotos(p => reorder(p, dragIdx.i, toIdx))
    if (list === 'extras')  setExtraPhotos(e => reorder(e, dragIdx.i, toIdx))
    setDragIdx(null)
  }
  // Reusable card style for any draggable thumbnail
  function dragProps(list, i) {
    const isDragging = dragIdx?.list === list && dragIdx.i === i
    return {
      draggable: true,
      onDragStart: () => handleDragStart(list, i),
      onDragEnd: handleDragEnd,
      onDragOver: e => { e.preventDefault() },
      onDrop: e => { e.preventDefault(); handleDrop(list, i) },
      style: {
        cursor: 'grab',
        opacity: isDragging ? 0.3 : 1,
        transition: 'opacity 120ms',
      }
    }
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
      images: gallery,
      photos: photos,
      img: gallery[0] || property.img,   // hero follows the first gallery slot
      extra_photos: extraPhotos,
      total_images: photos.length + extraPhotos.length,
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 14, color: C.faint }}>Loading property…</p>
        </div>
      </AdminLayout>
    )
  }

  const saveBtn = {
    background: saveState === 'saved' ? C.green : C.blue,
    color: C.white,
    border: 'none',
    borderRadius: 10,
    padding: '10px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
    opacity: saveState === 'saving' ? 0.7 : 1,
    transition: 'background 0.2s',
    fontFamily: '"Nunito Sans", sans-serif',
    letterSpacing: '0.2px',
  }

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.faint, marginBottom: 24 }}>
        <Link href="/admin" style={{ color: C.faint, textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.color = C.blue}
          onMouseLeave={e => e.target.style.color = C.faint}
        >
          Properties
        </Link>
        <span>/</span>
        <span style={{ color: C.muted, fontWeight: 500, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {property.title}
        </span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.blue,
            fontFamily: '"Playfair Display", serif',
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}>
            {property.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: C.faint, fontFamily: 'monospace' }}>{slug}</span>
            <Link
              href={`/property/${slug}`}
              target="_blank"
              style={{ fontSize: 12, color: C.gold, textDecoration: 'none', fontWeight: 600 }}
            >
              View on site ↗
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {saveMsg && (
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: saveState === 'error' ? C.red : C.green,
              background: saveState === 'error' ? C.redBg : C.greenBg,
              padding: '6px 12px', borderRadius: 8,
            }}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={saveBtn}
            onMouseEnter={e => { if (saveState === 'idle') e.target.style.background = C.blueLight }}
            onMouseLeave={e => { if (saveState === 'idle') e.target.style.background = C.blue }}
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Listing info */}
          <Card title="Listing info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field l="Title">
                <input style={input} value={form.title} onChange={e => set('title', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Grid cols={2}>
                <Field l="Status">
                  <select style={input} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="for_sale">For sale</option>
                    <option value="sold">Sold</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </Field>
                <Field l="Property type">
                  <select style={input} value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                    <option value="">—</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="house">House</option>
                    <option value="chalet">Chalet</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="finca">Finca</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </Field>
                <Field l="Style">
                  <input style={input} placeholder="garden / terrace / modern…" value={form.property_style}
                    onChange={e => set('property_style', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.blue}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </Field>
                <Field l="Partner URL">
                  <input style={input} placeholder="https://…" value={form.partner_url}
                    onChange={e => set('partner_url', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.blue}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </Field>
              </Grid>
            </div>
          </Card>

          {/* Pricing & specs */}
          <Card title="Pricing & specs">
            <Grid cols={4}>
              <div style={{ gridColumn: 'span 2' }}>
                <Field l="Price">
                  <input type="number" style={input} value={form.price}
                    onChange={e => set('price', e.target.value)}
                    onFocus={e => e.target.style.borderColor = C.blue}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </Field>
              </div>
              <Field l="Currency">
                <select style={input} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="SEK">SEK</option>
                </select>
              </Field>
              <div />
              <Field l="Beds">
                <input type="number" style={input} value={form.beds}
                  onChange={e => set('beds', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Field l="Baths">
                <input type="number" style={input} value={form.baths}
                  onChange={e => set('baths', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
            </Grid>
          </Card>

          {/* Location */}
          <Card title="Location">
            <Grid cols={3}>
              <Field l="City">
                <input style={input} value={form.city}
                  onChange={e => set('city', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Field l="Region">
                <input style={input} value={form.region}
                  onChange={e => set('region', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Field l="Country">
                <input style={input} value={form.country}
                  onChange={e => set('country', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Field l="Latitude">
                <input type="number" step="any" style={input} value={form.lat}
                  onChange={e => set('lat', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
              <Field l="Longitude">
                <input type="number" step="any" style={input} value={form.lng}
                  onChange={e => set('lng', e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </Field>
            </Grid>
          </Card>

          {/* Description */}
          <Card title="Description">
            <textarea
              rows={12}
              style={{
                ...input,
                resize: 'vertical',
                fontFamily: '"Courier New", monospace',
                fontSize: 12,
                lineHeight: 1.7,
              }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Property description — use **bold** for key terms…"
              onFocus={e => e.target.style.borderColor = C.blue}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{form.description.length} characters</p>
          </Card>

          {/* Amenities */}
          <Card title="Amenities">
            <input
              style={input}
              value={form.amenities}
              onChange={e => set('amenities', e.target.value)}
              placeholder="Pool, Sea view, Air conditioning…"
              onFocus={e => e.target.style.borderColor = C.blue}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <p style={{ fontSize: 11, color: C.faint, marginTop: 5 }}>Comma-separated list</p>
            {form.amenities && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {form.amenities.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                  <span key={a} style={{
                    background: '#f0ede8',
                    color: C.muted,
                    fontSize: 12, fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${C.border}`,
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Hero image */}
          <Card title="Hero image">
            {property.img
              ? <img src={property.img} alt="Hero" style={{
                  width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                  borderRadius: 8, border: `1px solid ${C.border}`,
                }} />
              : <div style={{
                  width: '100%', aspectRatio: '4/3', background: '#f0ede8',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: C.faint, fontSize: 12,
                }}>
                  No hero image
                </div>
            }
            <p style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Used on listing cards</p>
          </Card>

          {/* Gallery — drag to reorder. First image becomes hero on listing cards. */}
          <Card title={`Gallery (${gallery.length} visible)`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {gallery.map((url, i) => {
                const dp = dragProps('gallery', i)
                return (
                  <div key={url + i} {...dp} title="Drag to reorder">
                    <img src={url} alt="" style={{
                      aspectRatio: '1', objectFit: 'cover',
                      borderRadius: 6, border: `1px solid ${C.border}`,
                      width: '100%', display: 'block',
                    }} />
                    <p style={{
                      fontSize: 10, color: i === 0 ? C.gold : C.faint,
                      fontWeight: i === 0 ? 700 : 500,
                      textAlign: 'center', margin: '4px 0 0',
                    }}>{i === 0 ? '★ HERO' : `Slot ${i + 1}`}</p>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>
              Shown before unlock. Drag to reorder — slot 1 becomes hero on listing cards.
            </p>
          </Card>

          {/* All photos — drag to reorder */}
          <Card title={`All photos (${photos.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {photos.map((url, i) => {
                const dp = dragProps('photos', i)
                return (
                  <div key={url + i} {...dp} title={`#${i + 1} — drag to reorder`}>
                    <img src={url} alt="" style={{
                      aspectRatio: '1', objectFit: 'cover',
                      borderRadius: 5, border: `1px solid ${C.border}`,
                      width: '100%', display: 'block',
                    }} />
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>
              Full unlocked gallery. Drag any photo to reorder.
            </p>
          </Card>

          {/* Brochure / extras — draggable + removable */}
          <Card title={`Brochure / extras (${extraPhotos.length})`}>
            {extraPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                {extraPhotos.map((url, i) => {
                  const dp = dragProps('extras', i)
                  return (
                    <div key={url + i} {...dp}
                      style={{ ...dp.style, position: 'relative' }}
                      onMouseEnter={e => { const b = e.currentTarget.querySelector('button'); if (b) b.style.display = 'flex' }}
                      onMouseLeave={e => { const b = e.currentTarget.querySelector('button'); if (b) b.style.display = 'none' }}
                      title={`#${i + 1} — drag to reorder`}
                    >
                      <img src={url} alt="" style={{
                        aspectRatio: '1', objectFit: 'cover',
                        borderRadius: 6, border: `1px solid ${C.border}`,
                        width: '100%', display: 'block', pointerEvents: 'none',
                      }} />
                      <button
                        onClick={() => removePhoto(url)}
                        style={{
                          display: 'none',
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.7)', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 22, height: 22,
                          alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                border: `2px dashed ${uploading ? C.border : C.gold}`,
                borderRadius: 8,
                padding: '12px',
                fontSize: 13,
                fontWeight: 600,
                color: uploading ? C.faint : C.gold,
                background: 'transparent',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                fontFamily: '"Nunito Sans", sans-serif',
              }}
              onMouseEnter={e => { if (!uploading) e.target.style.background = '#fffbeb' }}
              onMouseLeave={e => { if (!uploading) e.target.style.background = 'transparent' }}
            >
              {uploading ? 'Uploading…' : '+ Upload brochure screenshots'}
            </button>
            <p style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Remember to Save after uploading</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
