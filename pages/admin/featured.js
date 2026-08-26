import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

// Admin → Featured. The homepage "Explore Our Properties" carousel now
// ROTATES ITSELF every morning (see /api/cron/rotate-featured): trending
// homes (real enquiries, last 30 days), new listings, and a rotating
// discovery pick. This page shows today's lineup with the reason each home
// is in; drag/add/remove still works as a manual override, but anything
// saved here only holds until the next daily rotation.

export default function AdminFeatured() {
  const [allProps, setAllProps] = useState([])
  const [featured, setFeatured] = useState([])   // ordered slugs
  const [reasons, setReasons] = useState({})     // slug → why it's featured
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const dragIdx = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [propsRes, featRes] = await Promise.all([
        supabase.from('properties')
          .select('slug,title,img,city,country,status')
          .order('title', { ascending: true }),
        supabase.from('featured_properties')
          .select('slug,position,reason')
          .order('position', { ascending: true }),
      ])
      if (propsRes.error) throw propsRes.error
      if (featRes.error) throw featRes.error
      setAllProps(propsRes.data || [])
      setFeatured((featRes.data || []).map(r => r.slug))
      setReasons(Object.fromEntries((featRes.data || []).map(r => [r.slug, r.reason || ''])))
    } catch (e) {
      setError((e && e.message) || 'Could not load properties.')
    } finally {
      setLoading(false)
    }
  }

  const bySlug = {}
  for (const p of allProps) bySlug[p.slug] = p

  const featuredSet = new Set(featured)
  const q = search.trim().toLowerCase()
  const available = allProps.filter(p => {
    if (featuredSet.has(p.slug)) return false
    if (!q) return true
    return (p.title || '').toLowerCase().includes(q)
        || (p.city || '').toLowerCase().includes(q)
        || (p.country || '').toLowerCase().includes(q)
  })

  function addSlug(slug) {
    setFeatured(prev => (prev.includes(slug) ? prev : [...prev, slug]))
    setMsg('')
  }
  function removeSlug(slug) {
    setFeatured(prev => prev.filter(s => s !== slug))
    setMsg('')
  }
  function onDragStart(i) { dragIdx.current = i }
  function onDragEnter(i) {
    const from = dragIdx.current
    if (from === null || from === i) return
    setFeatured(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(i, 0, moved)
      return next
    })
    dragIdx.current = i
    setMsg('')
  }
  function onDragEnd() { dragIdx.current = null }

  async function save() {
    setSaving(true)
    setError(null)
    setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session && session.access_token
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ slugs: featured }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || ('Save failed (' + res.status + ')'))
      setMsg('Saved — ' + (json.count || 0) + ' featured. The homepage has been refreshed.')
    } catch (e) {
      setError((e && e.message) || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function rotateNow() {
    setRotating(true)
    setError(null)
    setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session && session.access_token
      const res = await fetch('/api/cron/rotate-featured', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || ('Rotation failed (' + res.status + ')'))
      setMsg('Rotated — ' + (json.count || 0) + ' homes in today\'s lineup. The homepage has been refreshed.')
      await load()
    } catch (e) {
      setError((e && e.message) || 'Rotation failed.')
    } finally {
      setRotating(false)
    }
  }

  const thumb = {
    width: 52, height: 40, objectFit: 'cover', borderRadius: 6,
    background: '#f0ede8', flex: 'none',
  }
  const row = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 10px', borderBottom: '1px solid #f0ede8',
  }
  const colBox = {
    background: '#fff', border: '1px solid #e8e0d4', borderRadius: 12,
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  }
  const colHead = {
    padding: '12px 14px', borderBottom: '1px solid #e8e0d4', background: '#faf8f3',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: '#6B8A9E',
  }
  const listScroll = { maxHeight: 560, overflowY: 'auto' }
  const propTitle = { fontSize: 13, color: '#1a2533', lineHeight: 1.35 }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C4A5E', fontFamily: '"Playfair Display", serif', margin: 0 }}>
            Featured Properties
          </h1>
          <p style={{ fontSize: 13, color: '#8a9aaa', marginTop: 4 }}>
            Rotates itself every morning — trending homes, new listings and a daily discovery pick.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={rotateNow}
            disabled={rotating || loading}
            style={{
              fontSize: 13, fontFamily: '"Nunito Sans", sans-serif',
              cursor: (rotating || loading) ? 'default' : 'pointer',
              background: '#fff', color: '#2C4A5E', border: '1px solid #2C4A5E', borderRadius: 8,
              padding: '10px 20px', opacity: (rotating || loading) ? 0.6 : 1,
            }}
          >
            {rotating ? 'Rotating…' : '↻ Rotate now'}
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            style={{
              fontSize: 13, fontFamily: '"Nunito Sans", sans-serif',
              cursor: (saving || loading) ? 'default' : 'pointer',
              background: '#2C4A5E', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', opacity: (saving || loading) ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div style={{ margin: '10px 0 0', padding: '10px 14px', borderRadius: 8, background: '#faf8f3', border: '1px solid #e8e0d4', color: '#6B8A9E', fontSize: 12.5, lineHeight: 1.5 }}>
        The carousel refreshes automatically early every morning from live signals — homes with recent
        enquiries, this week's new listings, and a rotating discovery pick — so it changes daily without any
        curation. Manual edits saved here hold until the next automatic rotation.
      </div>

      {msg && (
        <div style={{ margin: '10px 0', padding: '10px 14px', borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600 }}>
          {msg}
        </div>
      )}
      {error && (
        <div style={{ margin: '10px 0', padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#8a9aaa', fontSize: 14, padding: '40px 0' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 14 }}>

          {/* Featured column */}
          <div style={colBox}>
            <div style={colHead}>On the homepage · {featured.length}</div>
            <div style={listScroll}>
              {featured.length === 0 && (
                <p style={{ padding: 20, color: '#8a9aaa', fontSize: 13 }}>
                  Nothing featured yet — add properties from the right.
                </p>
              )}
              {featured.map((slug, i) => {
                const p = bySlug[slug]
                return (
                  <div
                    key={slug}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragEnter={() => onDragEnter(i)}
                    onDragEnd={onDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{ ...row, cursor: 'grab', background: '#fff' }}
                  >
                    <span style={{ color: '#c9c0b2', fontSize: 15, flex: 'none' }} title="Drag to reorder">⠿</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8a9aaa', width: 22, flex: 'none' }}>{i + 1}</span>
                    <img src={p && p.img ? p.img : '/images/placeholder.jpg'} alt="" style={thumb} loading="lazy" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={propTitle}>{p ? p.title : slug}</div>
                      {reasons[slug] ? (
                        <div style={{
                          fontSize: 11, marginTop: 2, fontWeight: 600,
                          color: reasons[slug].startsWith('trending') ? '#C9A84C'
                               : reasons[slug].startsWith('new') ? '#16775d' : '#8a9aaa',
                        }}>
                          {reasons[slug]}
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeSlug(slug)}
                      title="Remove"
                      style={{ flex: 'none', border: 'none', background: 'none', cursor: 'pointer', color: '#b08a8a', fontSize: 16, padding: '2px 6px' }}
                    >✕</button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Available column */}
          <div style={colBox}>
            <div style={colHead}>All properties · {available.length}</div>
            <div style={{ padding: 10, borderBottom: '1px solid #e8e0d4' }}>
              <input
                type="search"
                placeholder="Search title, city, country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', border: '1px solid #e8e0d4', borderRadius: 8,
                  padding: '8px 12px', fontSize: 13, color: '#1a2533', outline: 'none',
                  fontFamily: '"Nunito Sans", sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={listScroll}>
              {available.length === 0 && (
                <p style={{ padding: 20, color: '#8a9aaa', fontSize: 13 }}>No matching properties.</p>
              )}
              {available.map(p => (
                <div key={p.slug} style={row}>
                  <img src={p.img || '/images/placeholder.jpg'} alt="" style={thumb} loading="lazy" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={propTitle}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#8a9aaa' }}>
                      {[p.city, p.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => addSlug(p.slug)}
                    style={{
                      flex: 'none', border: '1px solid #2C4A5E', background: '#fff',
                      color: '#2C4A5E', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      borderRadius: 6, padding: '5px 12px',
                    }}
                  >+ Add</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  )
}
