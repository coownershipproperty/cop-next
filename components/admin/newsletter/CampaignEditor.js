/**
 * CampaignEditor — the compose UI used on /admin/newsletters/new and /[id].
 *
 * Four vertically stacked sections:
 *   A. Campaign basics — name, template, subject, intro
 *   B. Properties      — search picker + drag-reorder selected list
 *   C. Audience        — all / tag / region / custom
 *   D. Send            — preview / schedule / send now
 *
 * Props:
 *   - initialCampaign: existing campaign row (or null for a brand-new one)
 *   - onSaved(campaign): fired after every successful save
 *   - readOnly: boolean (for sent campaigns)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { C, input, label as labelStyle } from './tokens'
import { Card, Field, Grid, PrimaryButton, GhostButton, Toast, GlobalAnimations, StatusBadge } from './Primitives'

const TEMPLATES = [
  {
    id: 'personalised-newsletter',
    name: 'Personalised Newsletter',
    desc: 'Hero + secondary cards. Best for weekly curated picks.',
    thumb: '🏛',
  },
  {
    id: 'new-listings-digest',
    name: 'New Listings Digest',
    desc: '3–8 fresh properties in a clean grid.',
    thumb: '✨',
  },
  {
    id: 'property-alert',
    name: 'Property Alert',
    desc: 'Saved-search match. 1–4 properties with reasons.',
    thumb: '🔔',
  },
  {
    id: 'seasonal-spotlight',
    name: 'Seasonal Spotlight',
    desc: 'Themed selection — ski Oct / Med Mar.',
    thumb: '❄',
  },
  {
    id: 'viewings-france',
    name: 'Viewings — France',
    desc: 'Upcoming private viewings (Côte d\'Azur & Alps). Pulls from lib/viewings.json.',
    thumb: '🗓',
  },
]

export default function CampaignEditor({ initialCampaign, onSaved, readOnly }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [name, setName] = useState(initialCampaign?.name || '')
  const [subject, setSubject] = useState(initialCampaign?.subject || '')
  const [introText, setIntroText] = useState(initialCampaign?.intro_text || '')
  const [templateType, setTemplateType] = useState(initialCampaign?.template_type || 'personalised-newsletter')
  const [propertySlugs, setPropertySlugs] = useState(initialCampaign?.property_slugs || [])
  const [personalizeByRegion, setPersonalizeByRegion] = useState(initialCampaign?.personalize_by_region ?? true)
  const [audienceSegment, setAudienceSegment] = useState(initialCampaign?.audience_segment || 'all')
  const [audienceFilter, setAudienceFilter] = useState(initialCampaign?.audience_filter || {})
  const [scheduledFor, setScheduledFor] = useState(initialCampaign?.scheduled_for ? initialCampaign.scheduled_for.slice(0, 16) : '')
  const [excludeEnquired, setExcludeEnquired] = useState(true)

  const [campaignId, setCampaignId] = useState(initialCampaign?.id || null)
  const [status, setStatus] = useState(initialCampaign?.status || 'draft')
  const [savedAt, setSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Property picker
  const [propSearch, setPropSearch] = useState('')
  const [propResults, setPropResults] = useState([])
  const [propsLoading, setPropsLoading] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState([]) // ordered full property objects

  // Audience helpers
  const [tagsList, setTagsList] = useState([])
  const [regionsList, setRegionsList] = useState([])
  const [audienceCount, setAudienceCount] = useState(null)
  const [audienceSample, setAudienceSample] = useState([])
  const [audienceBusy, setAudienceBusy] = useState(false)
  const [countAnimKey, setCountAnimKey] = useState(0)

  // Modals
  const [previewModal, setPreviewModal] = useState(false)
  const [previewEmail, setPreviewEmail] = useState('dylan@co-ownership-property.com')
  const [previewBusy, setPreviewBusy] = useState(false)
  const [renderAsModal, setRenderAsModal] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactResults, setContactResults] = useState([])
  const [renderAsContact, setRenderAsContact] = useState(null)
  const [sendConfirmModal, setSendConfirmModal] = useState(false)
  const [sending, setSending] = useState(false)

  // Drag state for the selected-properties list
  const [dragIdx, setDragIdx] = useState(null)
  const debounceRef = useRef(null)
  const auCountRef  = useRef(null)

  // ── Boot: load tags/regions + the selected properties' details ──────────────
  useEffect(() => { loadTagsRegions() }, [])
  useEffect(() => { searchProperties('') }, [])
  useEffect(() => { if (propertySlugs.length) loadSelectedProperties(propertySlugs) }, [])

  // ── Debounced property search ───────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchProperties(propSearch), 250)
    return () => clearTimeout(debounceRef.current)
  }, [propSearch])

  // ── Debounced audience-count refresh ────────────────────────────────────────
  useEffect(() => {
    if (auCountRef.current) clearTimeout(auCountRef.current)
    auCountRef.current = setTimeout(refreshAudienceCount, 300)
    return () => clearTimeout(auCountRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceSegment, audienceFilter, propertySlugs, excludeEnquired])

  // ── API helpers ─────────────────────────────────────────────────────────────
  async function authedFetch(url, opts = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    return fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${session?.access_token}`,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  }

  async function loadTagsRegions() {
    try {
      const r = await authedFetch('/api/admin/ui/newsletter-tags/')
      const j = await r.json()
      setTagsList(j.tags || [])
      setRegionsList(j.regions || [])
    } catch {}
  }

  async function searchProperties(q) {
    setPropsLoading(true)
    try {
      const r = await authedFetch('/api/admin/ui/newsletter-properties-search/', {
        method: 'POST',
        body: JSON.stringify({ q, limit: 500 }),
      })
      const j = await r.json()
      setPropResults(j.properties || [])
    } finally {
      setPropsLoading(false)
    }
  }

  async function loadSelectedProperties(slugs) {
    if (!slugs.length) { setSelectedProperties([]); return }
    const r = await authedFetch('/api/admin/ui/newsletter-properties-search/', {
      method: 'POST',
      body: JSON.stringify({ slugs }),
    })
    const j = await r.json()
    setSelectedProperties(j.properties || [])
  }

  async function refreshAudienceCount() {
    setAudienceBusy(true)
    try {
      const r = await authedFetch('/api/admin/ui/newsletter-audience-count/', {
        method: 'POST',
        body: JSON.stringify({
          audience_segment: audienceSegment,
          audience_filter:  audienceFilter,
          property_slugs:   propertySlugs,
          excludeEnquired:  excludeEnquired && audienceSegment === 'all',
        }),
      })
      const j = await r.json()
      setAudienceCount(j.total)
      setAudienceSample(j.sampleEmails || [])
      setCountAnimKey(k => k + 1)
    } catch (err) {
      setAudienceCount(null)
    } finally {
      setAudienceBusy(false)
    }
  }

  // ── Save (auto-called on schedule/send) ─────────────────────────────────────
  async function saveCampaign(extraPatch = {}) {
    setSaving(true)
    const payload = {
      id: campaignId || undefined,
      name: name || 'Untitled campaign',
      subject,
      intro_text: introText,
      template_type: templateType,
      property_slugs: propertySlugs,
      personalize_by_region: personalizeByRegion,
      audience_segment: audienceSegment,
      audience_filter: audienceFilter,
      scheduled_for: scheduledFor || null,
      ...extraPatch,
    }
    const r = await authedFetch('/api/admin/ui/newsletter-save/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const j = await r.json()
    setSaving(false)
    if (j.error) {
      setToast({ kind: 'error', text: j.error })
      return null
    }
    if (j.campaign) {
      setCampaignId(j.campaign.id)
      setStatus(j.campaign.status)
      setSavedAt(new Date())
      onSaved?.(j.campaign)
    }
    return j.campaign
  }

  async function handleSaveDraft() {
    const c = await saveCampaign({ status: 'draft' })
    if (c) setToast({ kind: 'ok', text: 'Draft saved' })
  }

  async function handleSchedule() {
    if (!scheduledFor) {
      setToast({ kind: 'error', text: 'Pick a date/time first' })
      return
    }
    const c = await saveCampaign({ status: 'scheduled' })
    if (c) setToast({ kind: 'ok', text: `Scheduled for ${new Date(scheduledFor).toLocaleString('en-GB')}` })
  }

  async function handleSendNow() {
    if (!campaignId) {
      const saved = await saveCampaign({ status: 'draft' })
      if (!saved) return
    } else {
      await saveCampaign({ status: 'draft' })
    }
    setSending(true)
    try {
      const r = await authedFetch('/api/admin/ui/newsletter-send/', {
        method: 'POST',
        body: JSON.stringify({ campaignId: campaignId || (await getJustSavedId()), confirm: true, excludeEnquired }),
      })
      const j = await r.json()
      if (j.error) {
        setToast({ kind: 'error', text: j.error })
      } else {
        setToast({ kind: 'ok', text: `Sent to ${j.sent} of ${j.total}. Failed: ${j.failed}.`, duration: 6000 })
        setStatus('sent')
      }
    } catch (err) {
      setToast({ kind: 'error', text: 'Send failed' })
    } finally {
      setSending(false)
      setSendConfirmModal(false)
    }
  }

  async function getJustSavedId() {
    return campaignId
  }

  // ── Property picker actions ─────────────────────────────────────────────────
  function addProperty(p) {
    if (propertySlugs.includes(p.slug)) return
    setPropertySlugs([...propertySlugs, p.slug])
    setSelectedProperties([...selectedProperties, p])
  }
  function removeProperty(slug) {
    setPropertySlugs(propertySlugs.filter(s => s !== slug))
    setSelectedProperties(selectedProperties.filter(p => p.slug !== slug))
  }
  function reorderSelected(fromIdx, toIdx) {
    if (fromIdx === toIdx) return
    const next = [...selectedProperties]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setSelectedProperties(next)
    setPropertySlugs(next.map(p => p.slug))
  }

  // ── Search recipients for "Render as" picker ────────────────────────────────
  async function searchContacts(q) {
    const r = await authedFetch('/api/admin/ui/newsletter-contacts-search/', {
      method: 'POST',
      body: JSON.stringify({ q, limit: 12 }),
    })
    const j = await r.json()
    setContactResults(j.contacts || [])
  }

  // ── Preview send ────────────────────────────────────────────────────────────
  async function handleSendPreview() {
    // saveCampaign returns the freshly-saved campaign row. Use its id directly
    // instead of reading the React state `campaignId`, which won't have updated
    // by the time we kick off the preview fetch (state is async).
    let activeCampaignId = campaignId
    if (!activeCampaignId) {
      const saved = await saveCampaign({ status: 'draft' })
      if (!saved) return
      activeCampaignId = saved.id
    }
    if (!previewEmail) {
      setToast({ kind: 'error', text: 'Enter a preview email address first.' })
      return
    }
    setPreviewBusy(true)
    try {
      const r = await authedFetch('/api/admin/ui/newsletter-preview/', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaignId,
          targetEmail: previewEmail,
          renderAsContactId: renderAsContact?.id,
        }),
      })
      const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
      if (!r.ok || j.error) {
        // Surface errors loudly — they used to be invisible behind the
        // closing modal. 10s so there's time to actually read them.
        setToast({ kind: 'error', text: j.error || `Preview failed (HTTP ${r.status})`, duration: 10000 })
      } else {
        setToast({ kind: 'ok', text: `Preview sent to ${previewEmail}` })
      }
    } catch (err) {
      setToast({ kind: 'error', text: `Preview failed: ${err.message}`, duration: 10000 })
    } finally {
      setPreviewBusy(false)
      setPreviewModal(false)
      setRenderAsModal(false)
    }
  }

  // ── Auto-fill subject + intro when the user picks a template that ships ───
  // with its own opinionated defaults (so they don't have to hand-type and so
  // the leftover "your weekly picks" copy from another template doesn't ship).
  useEffect(() => {
    if (templateType !== 'viewings-france') return;
    // Only overwrite empty / clearly-from-another-template values; never stomp
    // on what the user has already customised for this campaign.
    const defaultSubject = "Private viewings — Côte d'Azur & French Alps";
    const defaultIntro   = "Hi {{first_name}} — we've got six upcoming viewings across France this season. Pick a date, choose on-site or live video, and we'll confirm within hours.";
    const looksDefaultish = !subject ||
      /\{\{\s*region\s*\}\}/i.test(subject) ||
      /weekly|picks|new listings|spotlight|alert/i.test(subject);
    if (looksDefaultish) setSubject(defaultSubject);
    if (!introText) setIntroText(defaultIntro);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateType])

  // ── Subject preview ─────────────────────────────────────────────────────────
  const subjectPreview = useMemo(() => {
    const regions = [...new Set(selectedProperties.map(p => p.region).filter(Boolean))].slice(0, 2)
    const regionStr = regions.length > 1 ? regions[0] + ' & ' + regions[1] : (regions[0] || 'Costa del Sol')
    return (subject || '')
      .replace(/\{\{\s*first_name\s*\}\}/gi, 'Sophie')
      .replace(/\{\{\s*region\s*\}\}/gi, regionStr)
      .replace(/\{\{\s*count\s*\}\}/gi, String(selectedProperties.length))
  }, [subject, selectedProperties])

  // ── Render ──────────────────────────────────────────────────────────────────
  const fieldsDisabled = readOnly
  return (
    <>
      <GlobalAnimations />
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Status row */}
      {campaignId && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          fontSize: 12, color: C.faint,
        }}>
          <StatusBadge status={status} />
          {savedAt && <span>Saved {savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ─── Section A: Basics ─── */}
        <Card title="Campaign basics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field l="Internal name" hint="Not shown to recipients">
              <input
                style={input}
                disabled={fieldsDisabled}
                placeholder="e.g. Costa del Sol weekly — Oct 18"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.blue}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </Field>

            <div>
              <label style={labelStyle}>Template</label>
              <Grid cols={4} gap={10}>
                {TEMPLATES.map(t => {
                  const active = templateType === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => !fieldsDisabled && setTemplateType(t.id)}
                      disabled={fieldsDisabled}
                      style={{
                        textAlign: 'left',
                        background: active ? '#fdf9f0' : C.white,
                        border: `1.5px solid ${active ? C.gold : C.border}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: fieldsDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: '"Nunito Sans", sans-serif',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{t.thumb}</div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: C.blue,
                        marginBottom: 4, fontFamily: '"Playfair Display", serif',
                      }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>
                        {t.desc}
                      </div>
                    </button>
                  )
                })}
              </Grid>
            </div>

            <Field
              l="Subject line"
              hint='Supports {{first_name}}, {{region}} and {{count}} merge tags.'
            >
              <input
                style={input}
                disabled={fieldsDisabled}
                placeholder="{{first_name}}, your weekly {{region}} picks"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.blue}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              {subject && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: C.muted,
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <span style={{ color: C.faint, fontWeight: 700, marginRight: 8 }}>HOW IT'LL LOOK:</span>
                  <span style={{ color: C.text, fontWeight: 600, fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
                    {subjectPreview}
                  </span>
                </div>
              )}
              <button
                disabled
                title="AI suggestions — coming soon"
                style={{
                  marginTop: 10,
                  background: 'transparent',
                  color: C.faint,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'not-allowed',
                  fontFamily: '"Nunito Sans", sans-serif',
                }}
              >
                ✦ AI subject suggestions (coming soon)
              </button>
            </Field>

            <Field l="Intro text" hint='Lead paragraph above the property grid. Supports {{first_name}}, {{region}} and {{count}}.'>
              <textarea
                style={{ ...input, resize: 'vertical', lineHeight: 1.55, fontSize: 13 }}
                rows={3}
                disabled={fieldsDisabled}
                placeholder={`Hi {{first_name}}, fresh on Co-Ownership Property this week — ${selectedProperties.length || 'the latest'} homes hand-picked for you.`}
                value={introText}
                onChange={e => setIntroText(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.blue}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </Field>
          </div>
        </Card>

        {/* ─── Section B: Properties ───
            Hidden for templates whose property list is static (e.g. the
            Viewings — France template pulls from lib/viewings.json, not from
            the per-campaign property picker). */}
        {templateType !== 'viewings-france' && (
        <Card
          title={`Properties (${propertySlugs.length} selected)`}
          right={
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: C.muted, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={personalizeByRegion}
                disabled={fieldsDisabled}
                onChange={e => setPersonalizeByRegion(e.target.checked)}
              />
              <span>Reorder per recipient (smart sort)</span>
            </label>
          }
        >
          <Grid cols="1fr 1fr" gap={20}>
            {/* LEFT — browse */}
            <div>
              <input
                type="search"
                placeholder="Search title, city, country…"
                style={input}
                disabled={fieldsDisabled}
                value={propSearch}
                onChange={e => setPropSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.blue}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <div style={{
                marginTop: 10,
                maxHeight: 460,
                overflowY: 'auto',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.bg,
              }}>
                {propsLoading ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.faint }}>Loading…</div>
                ) : propResults.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.faint }}>No properties match.</div>
                ) : (
                  propResults.map(p => {
                    const inList = propertySlugs.includes(p.slug)
                    return (
                      <div
                        key={p.slug}
                        onClick={() => !fieldsDisabled && !inList && addProperty(p)}
                        style={{
                          display: 'flex', gap: 12, alignItems: 'center',
                          padding: '10px 12px',
                          borderBottom: `1px solid ${C.border}`,
                          cursor: fieldsDisabled || inList ? 'default' : 'pointer',
                          opacity: inList ? 0.5 : 1,
                          background: inList ? '#f5efe2' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!inList && !fieldsDisabled) e.currentTarget.style.background = C.white }}
                        onMouseLeave={e => { if (!inList) e.currentTarget.style.background = 'transparent' }}
                      >
                        <img
                          src={p.img}
                          alt=""
                          style={{
                            width: 60, height: 38, objectFit: 'cover',
                            borderRadius: 4, flexShrink: 0, background: '#eee',
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 600, color: C.text,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>
                            {p.city || p.region} · {p.country}
                            <span style={{ color: C.gold, marginLeft: 6, fontWeight: 600 }}>
                              {p.currency} {Number(p.price).toLocaleString('en-GB')}
                            </span>
                          </div>
                        </div>
                        {inList ? (
                          <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Added</span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>+ Add</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT — selected & reorder */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: C.faint,
                textTransform: 'uppercase', letterSpacing: '0.6px',
                marginBottom: 8,
              }}>
                Selected — drag to reorder
              </div>
              {selectedProperties.length === 0 ? (
                <div style={{
                  padding: '36px 20px', textAlign: 'center',
                  background: C.bg, border: `1px dashed ${C.border}`,
                  borderRadius: 8, fontSize: 12, color: C.faint,
                }}>
                  No properties yet. Click + Add on the left.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedProperties.map((p, i) => (
                    <SelectedRow
                      key={p.slug}
                      p={p}
                      idx={i}
                      isDragging={dragIdx === i}
                      onDragStart={() => setDragIdx(i)}
                      onDragEnd={() => setDragIdx(null)}
                      onDragOver={() => {}}
                      onDrop={(from) => reorderSelected(from, i)}
                      dragIdx={dragIdx}
                      readOnly={fieldsDisabled}
                      onRemove={() => removeProperty(p.slug)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Grid>
        </Card>
        )}

        {/* ─── Section C: Audience ─── */}
        <Card title="Audience">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'all', label: 'All subscribers' },
                { id: 'tag', label: 'By tag' },
                { id: 'region', label: 'By region' },
                { id: 'custom', label: 'Custom emails' },
              ].map(opt => {
                const active = audienceSegment === opt.id
                return (
                  <button
                    key={opt.id}
                    disabled={fieldsDisabled}
                    onClick={() => { setAudienceSegment(opt.id); setAudienceFilter({}) }}
                    style={{
                      background: active ? C.blue : C.white,
                      color: active ? C.white : C.blue,
                      border: `1px solid ${active ? C.blue : C.border}`,
                      borderRadius: 20,
                      padding: '6px 16px',
                      fontSize: 12, fontWeight: 600,
                      cursor: fieldsDisabled ? 'not-allowed' : 'pointer',
                      fontFamily: '"Nunito Sans", sans-serif',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {audienceSegment === 'tag' && (
              <Field l="Pick tags (any match)">
                <TagPicker
                  options={tagsList.map(t => t.tag)}
                  counts={Object.fromEntries(tagsList.map(t => [t.tag, t.count]))}
                  selected={audienceFilter.tags || []}
                  onChange={tags => setAudienceFilter({ tags })}
                  disabled={fieldsDisabled}
                />
              </Field>
            )}

            {audienceSegment === 'region' && (
              <Field l="Pick regions (any match)">
                <TagPicker
                  options={regionsList.map(r => r.region)}
                  counts={Object.fromEntries(regionsList.map(r => [r.region, r.count]))}
                  selected={audienceFilter.regions || []}
                  onChange={regions => setAudienceFilter({ regions })}
                  disabled={fieldsDisabled}
                />
              </Field>
            )}

            {audienceSegment === 'custom' && (
              <Field l="Email addresses (comma or newline separated)">
                <textarea
                  style={{ ...input, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                  rows={4}
                  disabled={fieldsDisabled}
                  placeholder="alice@example.com, bob@example.com"
                  value={(audienceFilter.emails || []).join('\n')}
                  onChange={e => {
                    const emails = e.target.value
                      .split(/[\s,]+/)
                      .map(s => s.trim())
                      .filter(Boolean)
                    setAudienceFilter({ emails })
                  }}
                />
              </Field>
            )}

            {audienceSegment === 'all' && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: C.muted, cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  disabled={fieldsDisabled}
                  checked={excludeEnquired}
                  onChange={e => setExcludeEnquired(e.target.checked)}
                />
                <span>Skip people who have already enquired about a selected property</span>
              </label>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10,
            }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.faint,
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                }}>
                  Live recipient count
                </div>
                <div
                  key={countAnimKey}
                  className="nl-count-pulse"
                  style={{
                    fontSize: 28, fontWeight: 700, color: C.blue,
                    fontFamily: '"Playfair Display", serif',
                    margin: 0, lineHeight: 1.1, marginTop: 2,
                  }}
                >
                  {audienceBusy ? '…' : (audienceCount?.toLocaleString() ?? '—')}
                </div>
              </div>
              {audienceSample.length > 0 && (
                <div style={{ fontSize: 11, color: C.faint, marginLeft: 'auto', textAlign: 'right' }}>
                  Sample: {audienceSample.join(', ')}…
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ─── Section D: Send ─── */}
        <Card title="Send">
          <Grid cols={2} gap={16}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PrimaryButton onClick={() => setPreviewModal(true)} disabled={fieldsDisabled || (templateType !== 'viewings-france' && !propertySlugs.length)}>
                ✉ Send preview to me
              </PrimaryButton>
              <GhostButton onClick={() => setRenderAsModal(true)} disabled={fieldsDisabled || (templateType !== 'viewings-france' && !propertySlugs.length)}>
                ⚭ Render preview as recipient…
              </GhostButton>
              <GhostButton onClick={handleSaveDraft} disabled={fieldsDisabled || saving}>
                {saving ? 'Saving…' : '✎ Save draft'}
              </GhostButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field l="Schedule for">
                <input
                  type="datetime-local"
                  style={input}
                  disabled={fieldsDisabled}
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                />
              </Field>
              <GhostButton onClick={handleSchedule} disabled={fieldsDisabled || !scheduledFor}>
                ⏱ Schedule
              </GhostButton>
              <PrimaryButton
                kind="gold"
                onClick={() => setSendConfirmModal(true)}
                disabled={fieldsDisabled || (templateType !== 'viewings-france' && !propertySlugs.length) || !audienceCount}
                style={{ padding: '14px 22px', fontSize: 15 }}
              >
                ▶ Send now {audienceCount ? `(${audienceCount.toLocaleString()})` : ''}
              </PrimaryButton>
            </div>
          </Grid>
        </Card>
      </div>

      {/* ─── Modals ─── */}
      {previewModal && (
        <Modal onClose={() => setPreviewModal(false)} title="Send preview">
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Sends a one-off preview email rendered with sample personalisation.
          </p>
          <Field l="Recipient email">
            <input
              style={input}
              value={previewEmail}
              onChange={e => setPreviewEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = C.blue}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <GhostButton onClick={() => setPreviewModal(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleSendPreview} disabled={previewBusy || !previewEmail}>
              {previewBusy ? 'Sending…' : 'Send preview'}
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {renderAsModal && (
        <Modal
          onClose={() => { setRenderAsModal(false); setRenderAsContact(null) }}
          title="Render as recipient"
          width={560}
        >
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Pick a real contact — the preview will use their first name and their personalised property order.
          </p>
          <input
            style={input}
            placeholder="Search by name or email…"
            value={contactSearch}
            onChange={e => { setContactSearch(e.target.value); searchContacts(e.target.value) }}
            onFocus={e => { e.target.style.borderColor = C.blue; if (!contactResults.length) searchContacts('') }}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <div style={{
            marginTop: 10, maxHeight: 280, overflowY: 'auto',
            border: `1px solid ${C.border}`, borderRadius: 8,
          }}>
            {contactResults.map(c => {
              const sel = renderAsContact?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setRenderAsContact(c)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    background: sel ? '#fdf9f0' : 'transparent',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {c.first_name || '—'} {c.last_name || ''}
                  </div>
                  <div style={{ fontSize: 12, color: C.faint }}>{c.email}</div>
                </div>
              )
            })}
            {contactResults.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: C.faint }}>
                Start typing to search.
              </div>
            )}
          </div>
          <Field l="Send preview to" >
            <input
              style={{ ...input, marginTop: 8 }}
              value={previewEmail}
              onChange={e => setPreviewEmail(e.target.value)}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <GhostButton onClick={() => { setRenderAsModal(false); setRenderAsContact(null) }}>Cancel</GhostButton>
            <PrimaryButton onClick={handleSendPreview} disabled={!renderAsContact || previewBusy}>
              {previewBusy ? 'Sending…' : `Send as ${renderAsContact?.first_name || '…'}`}
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {sendConfirmModal && (
        <Modal onClose={() => setSendConfirmModal(false)} title="Send campaign?" width={460}>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 18 }}>
            This will send <strong>{audienceCount?.toLocaleString()}</strong> emails using template{' '}
            <strong>{TEMPLATES.find(t => t.id === templateType)?.name}</strong>.
            <br /><br />
            Are you sure?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <GhostButton onClick={() => setSendConfirmModal(false)}>Cancel</GhostButton>
            <PrimaryButton kind="gold" onClick={handleSendNow} disabled={sending}>
              {sending ? 'Sending…' : `Yes, send to ${audienceCount?.toLocaleString()}`}
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── SelectedRow — draggable selected property ─────────────────────────────────
function SelectedRow({ p, idx, isDragging, onDragStart, onDragEnd, onDrop, dragIdx, readOnly, onRemove }) {
  return (
    <div
      draggable={!readOnly}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); if (dragIdx != null) onDrop(dragIdx) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 10px',
        background: C.white,
        border: `1px solid ${isDragging ? C.gold : C.border}`,
        borderRadius: 8,
        cursor: readOnly ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? '0 4px 12px rgba(44,74,94,0.18)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        fontFamily: 'monospace', fontSize: 11, color: C.faint,
        width: 18, textAlign: 'center', flexShrink: 0,
      }}>
        ☰
      </span>
      <img
        src={p.img}
        alt=""
        style={{
          width: 72, height: 45, objectFit: 'cover',
          borderRadius: 4, flexShrink: 0, background: '#eee',
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
          letterSpacing: '0.1px',
        }}>
          {p.title}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2,
          textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
          {p.region || p.city}
          <span style={{ color: C.gold, marginLeft: 8 }}>
            {p.currency} {Number(p.price).toLocaleString('en-GB')}
          </span>
        </div>
      </div>
      {!readOnly && (
        <button
          onClick={onRemove}
          style={{
            background: 'transparent', color: C.faint, border: 'none',
            cursor: 'pointer', fontSize: 18, fontWeight: 300,
            padding: '4px 8px', borderRadius: 4,
          }}
          title="Remove"
          onMouseEnter={e => e.target.style.color = C.red}
          onMouseLeave={e => e.target.style.color = C.faint}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── TagPicker — multiselect chips for tags / regions ──────────────────────────
function TagPicker({ options, counts, selected, onChange, disabled }) {
  if (!options.length) {
    return (
      <div style={{ fontSize: 12, color: C.faint, padding: '8px 0' }}>
        No options available yet.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.slice(0, 80).map(o => {
        const active = selected.includes(o)
        return (
          <button
            key={o}
            disabled={disabled}
            onClick={() => {
              const next = active ? selected.filter(s => s !== o) : [...selected, o]
              onChange(next)
            }}
            style={{
              background: active ? C.blue : '#f0ede8',
              color: active ? C.white : C.muted,
              border: `1px solid ${active ? C.blue : C.border}`,
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12, fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: '"Nunito Sans", sans-serif',
            }}
          >
            {o}{counts?.[o] != null ? <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 11 }}>{counts[o]}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ onClose, title, children, width }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,32,47,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 12,
          padding: '22px 26px 24px',
          width: width || 440,
          maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          fontFamily: '"Nunito Sans", sans-serif',
        }}
      >
        <h3 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 18, color: C.blue, margin: '0 0 14px',
          fontWeight: 600,
        }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
