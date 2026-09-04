import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import s from '@/styles/TemplateStudio.module.css'

const LOCALE_NAMES = {
  en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano',
  nl: 'Nederlands', pt: 'Português', da: 'Dansk', no: 'Norsk', sv: 'Svenska',
}

const CATEGORY_LABELS = {
  lead: 'Live automations',
  marketing: 'Marketing',
  reply: 'Reply templates',
  answer: 'Stock answers',
}

const BLOCK_TYPES = [
  ['text', 'Paragraph'],
  ['heading', 'Heading'],
  ['list', 'Bullet list'],
  ['button', 'Button'],
  ['image', 'Image'],
  ['divider', 'Divider'],
  ['spacer', 'Spacer'],
  ['slot', 'Generated block'],
  ['html', 'Raw HTML'],
]

async function api(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
  const r = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(body.error || 'Something went wrong.')
  return body
}

function newBlock(type) {
  switch (type) {
    case 'heading': return { type: 'heading', level: 3, text: 'A heading' }
    case 'list':    return { type: 'list', items: ['First point', 'Second point'] }
    case 'button':  return { type: 'button', label: 'See the home', url: 'https://co-ownership-property.com' }
    case 'image':   return { type: 'image', src: '', alt: '' }
    case 'divider': return { type: 'divider' }
    case 'spacer':  return { type: 'spacer', height: '16px' }
    case 'slot':    return { type: 'slot', slot: 'galleryLinks' }
    case 'html':    return { type: 'html', html: '<p style="margin:0 0 20px;"></p>' }
    default:        return { type: 'text', text: '' }
  }
}

export default function TemplateStudio() {
  const [moments, setMoments]     = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [notice, setNotice]       = useState(null)

  const [momentKey, setMomentKey] = useState(null)
  const [locale, setLocale]       = useState('en')

  const [draft, setDraft]     = useState(null)   // { subject, preheader, blocks, design, notes }
  const [baseline, setBaseline] = useState(null)
  const [saving, setSaving]   = useState(false)

  const [preview, setPreview] = useState({ subject: '', html: '', text: '' })
  const [device, setDevice]   = useState('desktop')
  const [showDesign, setShowDesign] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])

  const focusRef = useRef({ index: null, start: 0, end: 0, field: 'text' })

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const { moments, templates } = await api('/api/admin/templates')
      setMoments(moments); setTemplates(templates)
      if (!momentKey && moments.length) setMomentKey(moments[0].key)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const moment = useMemo(() => moments.find(m => m.key === momentKey) || null, [moments, momentKey])

  const activeRow = useMemo(
    () => templates.find(t => t.moment === momentKey && t.locale === locale && t.active) || null,
    [templates, momentKey, locale]
  )

  const localesForMoment = useMemo(() => {
    if (!moment) return []
    const declared = Array.isArray(moment.locales) ? moment.locales : ['en']
    const existing = templates.filter(t => t.moment === moment.key && t.active).map(t => t.locale)
    return Array.from(new Set([...declared, ...existing]))
  }, [moment, templates])

  // Load the selected template into the editor.
  useEffect(() => {
    if (!moment) return
    if (activeRow) {
      const d = {
        subject: activeRow.subject || '',
        preheader: activeRow.preheader || '',
        blocks: JSON.parse(JSON.stringify(activeRow.blocks || [])),
        design: { ...(activeRow.design || {}) },
        notes: activeRow.notes || '',
      }
      setDraft(d); setBaseline(JSON.stringify(d))
    } else {
      setDraft(null); setBaseline(null)
    }
    setShowVersions(false)
  }, [activeRow, moment])

  const dirty = draft && baseline && JSON.stringify(draft) !== baseline

  // ── Live preview ──────────────────────────────────────────────────────
  const renderPreview = useCallback(async (d) => {
    if (!d || !moment) return
    try {
      const out = await api('/api/admin/templates/preview', {
        method: 'POST',
        body: JSON.stringify({
          moment: moment.key, locale,
          subject: d.subject, preheader: d.preheader,
          blocks: d.blocks, design: d.design,
          data: { ...(moment.sample_data || {}), locale },
        }),
      })
      setPreview(out)
    } catch (e) { setPreview(p => ({ ...p, html: `<p style="font:14px Arial;color:#b3261e;padding:20px">${e.message}</p>` })) }
  }, [moment, locale])

  useEffect(() => {
    if (!draft) { setPreview({ subject: '', html: '', text: '' }); return }
    const id = setTimeout(() => renderPreview(draft), 260)
    return () => clearTimeout(id)
  }, [draft, renderPreview])

  // ── Editing ───────────────────────────────────────────────────────────
  const patch = (fields) => setDraft(d => ({ ...d, ...fields }))
  const patchBlock = (i, fields) => setDraft(d => {
    const blocks = d.blocks.slice(); blocks[i] = { ...blocks[i], ...fields }; return { ...d, blocks }
  })
  const moveBlock = (i, dir) => setDraft(d => {
    const j = i + dir; if (j < 0 || j >= d.blocks.length) return d
    const blocks = d.blocks.slice(); const [b] = blocks.splice(i, 1); blocks.splice(j, 0, b); return { ...d, blocks }
  })
  const removeBlock = (i) => setDraft(d => ({ ...d, blocks: d.blocks.filter((_, k) => k !== i) }))
  const addBlock = (type) => setDraft(d => ({ ...d, blocks: [...d.blocks, newBlock(type)] }))

  function insertSlot(token) {
    const f = focusRef.current
    if (f.index == null) { setNotice('Click into the text you want the field added to first.'); return }
    setDraft(d => {
      const blocks = d.blocks.slice()
      const b = { ...blocks[f.index] }
      const cur = String(b[f.field] || '')
      b[f.field] = cur.slice(0, f.start) + token + cur.slice(f.end)
      blocks[f.index] = b
      return { ...d, blocks }
    })
  }

  async function save() {
    if (!draft || !moment) return
    setSaving(true); setError(null); setNotice(null)
    try {
      const { template } = await api('/api/admin/templates', {
        method: 'POST',
        body: JSON.stringify({
          moment: moment.key, locale, channel: 'email', kind: moment.kind || 'blocks',
          tier: moment.tier || 'B', label: activeRow?.label || moment.label,
          subject: draft.subject, preheader: draft.preheader,
          blocks: draft.blocks, design: draft.design, notes: draft.notes,
          from_name: activeRow?.from_name, from_email: activeRow?.from_email, reply_to: activeRow?.reply_to,
        }),
      })
      setTemplates(list => [template, ...list.map(t =>
        (t.moment === template.moment && t.locale === template.locale && t.channel === template.channel)
          ? { ...t, active: false } : t)])
      setNotice(`Saved as v${template.version}. Live on the next send — about a minute.`)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  async function startTranslation() {
    const en = templates.find(t => t.moment === momentKey && t.locale === 'en' && t.active)
    if (!en) { setError('Write the English version first — translations start from it.'); return }
    const d = {
      subject: en.subject || '', preheader: en.preheader || '',
      blocks: JSON.parse(JSON.stringify(en.blocks || [])),
      design: { ...(en.design || {}) },
      notes: `Started from the English v${en.version}. Translate before saving.`,
    }
    setDraft(d); setBaseline('')   // always dirty — it is unsaved by definition
  }

  async function openVersions() {
    setShowVersions(v => !v)
    if (showVersions || !moment) return
    try {
      const { versions } = await api(`/api/admin/templates/history?moment=${encodeURIComponent(moment.key)}&locale=${locale}`)
      setVersions(versions)
    } catch (e) { setError(e.message) }
  }

  async function rollback(id, version) {
    setError(null)
    try {
      await api('/api/admin/templates/activate', { method: 'POST', body: JSON.stringify({ id }) })
      setNotice(`Rolled back to v${version}.`)
      setShowVersions(false)
      await load()
    } catch (e) { setError(e.message) }
  }

  // ── Render ────────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const out = {}
    for (const m of moments) (out[m.category] ||= []).push(m)
    return out
  }, [moments])

  const slotList = Array.isArray(moment?.slots) ? moment.slots : []

  return (
    <AdminLayout fullBleed>
      <div className={s.studio}>

        {/* ── Rail ── */}
        <aside className={s.rail}>
          <div className={s.railHead}>
            <h1>Template Studio</h1>
            <p>Every automated email, editable here. Changes go live within a minute — no deploy.</p>
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div className={s.group} key={cat}>
              <p className={s.groupLabel}>{CATEGORY_LABELS[cat] || cat}</p>
              {items.map(m => {
                const count = templates.filter(t => t.moment === m.key && t.active).length
                return (
                  <button key={m.key}
                    className={`${s.momentBtn} ${m.key === momentKey ? s.active : ''}`}
                    onClick={() => { setMomentKey(m.key); setLocale('en') }}>
                    <span className={s.momentName}>
                      <span className={`${s.dot} ${m.live ? s.dotLive : s.dotDraft}`} />{m.label}
                    </span>
                    <span className={s.momentMeta}>
                      {m.live ? 'Sending now' : 'Not live yet'} · {count}/{(m.locales || []).length} languages
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* ── Editor ── */}
        <section className={s.editor}>
          <div className={s.bar}>
            <div>
              <h2 className={s.barTitle}>{moment?.label || (loading ? 'Loading…' : 'Nothing selected')}</h2>
              <p className={s.barSub}>{moment?.fires_when}</p>
            </div>
            <div className={s.spacer} />
            {moment && (
              <div className={s.locales}>
                {localesForMoment.map(l => {
                  const has = templates.some(t => t.moment === moment.key && t.locale === l && t.active)
                  return (
                    <button key={l} title={LOCALE_NAMES[l] || l}
                      className={`${s.loc} ${l === locale ? s.on : ''} ${has ? '' : s.missing}`}
                      onClick={() => setLocale(l)}>{l}</button>
                  )
                })}
              </div>
            )}
            {activeRow && <span className={`${s.pill} ${moment?.live ? s.pillLive : s.pillDraft}`}>v{activeRow.version}</span>}
            <button className={s.btn} onClick={openVersions} disabled={!activeRow}>History</button>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={save} disabled={!dirty || saving}>
              {saving ? 'Saving…' : dirty ? 'Save & publish' : 'Saved'}
            </button>
          </div>

          <div className={s.scroll}>
            {error  && <p className={s.err}>{error}</p>}
            {notice && <p className={s.ok}>{notice}</p>}

            {!moment && !loading && (
              <div className={s.empty}><h2>Pick a template</h2><p>Choose one from the list on the left.</p></div>
            )}

            {moment && !draft && (
              <div className={s.empty}>
                <h2>No {LOCALE_NAMES[locale] || locale} version yet</h2>
                <p>
                  Leads who write in {LOCALE_NAMES[locale] || locale} currently get the English email.<br />
                  Start from the English wording and translate it.
                </p>
                <p style={{ marginTop: 16 }}>
                  <button className={`${s.btn} ${s.btnPrimary}`} onClick={startTranslation}>
                    Start from English
                  </button>
                </p>
              </div>
            )}

            {showVersions && (
              <div className={s.card}>
                <div className={s.cardHead}><h3>Version history</h3></div>
                <div className={s.cardBody}>
                  <ul className={s.versionList}>
                    {versions.map(v => (
                      <li className={s.versionItem} key={v.id}>
                        <strong>v{v.version}</strong>
                        <span className={s.versionMeta}>
                          {new Date(v.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {v.updated_by ? ` · ${v.updated_by}` : ''}{v.notes ? ` · ${v.notes}` : ''}
                        </span>
                        {v.active
                          ? <span className={`${s.pill} ${s.pillLive}`}>Live</span>
                          : <button className={s.btn} onClick={() => rollback(v.id, v.version)}>Make live</button>}
                      </li>
                    ))}
                    {!versions.length && <li className={s.versionItem}>No earlier versions.</li>}
                  </ul>
                </div>
              </div>
            )}

            {draft && (
              <>
                <div className={s.card}>
                  <div className={s.cardHead}><h3>Subject line</h3></div>
                  <div className={s.cardBody}>
                    <div className={s.field}>
                      <input className={s.input} value={draft.subject}
                        onChange={e => patch({ subject: e.target.value })}
                        onFocus={() => { focusRef.current = { index: null } }}
                        placeholder="What they see in their inbox" />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Preview text</label>
                      <input className={s.input} value={draft.preheader}
                        onChange={e => patch({ preheader: e.target.value })}
                        placeholder="The grey line after the subject in most inboxes — optional" />
                      <p className={s.hint}>Hidden in the email itself. Left empty, inboxes show the first line of the body instead.</p>
                    </div>
                  </div>
                </div>

                <div className={s.card}>
                  <div className={s.cardHead}>
                    <h3>The email</h3>
                    <div className={s.spacer} />
                    <span className={s.momentMeta} style={{ fontSize: 11 }}>{draft.blocks.length} blocks</span>
                  </div>
                  <div className={s.cardBody}>
                    {draft.blocks.map((b, i) => (
                      <BlockEditor key={i} block={b} index={i} last={i === draft.blocks.length - 1}
                        onPatch={patchBlock} onMove={moveBlock} onRemove={removeBlock} focusRef={focusRef} styles={s} />
                    ))}

                    <div className={s.addRow}>
                      {BLOCK_TYPES.map(([t, label]) => (
                        <button key={t} className={s.addBtn} onClick={() => addBlock(t)}>+ {label}</button>
                      ))}
                    </div>

                    {slotList.length > 0 && (
                      <>
                        <p className={s.hint} style={{ marginTop: 16 }}>
                          Click a field to drop it where your cursor is. It is replaced with the real value when the email sends.
                        </p>
                        <div className={s.slots}>
                          {slotList.map(sl => (
                            <button key={sl.key} className={s.slotChip} title={sl.note || sl.label}
                              onClick={() => insertSlot(sl.raw ? `{{&${sl.key}}}` : `{{${sl.key}}}`)}>
                              {sl.label}
                            </button>
                          ))}
                          <button className={s.slotChip} title="Shown only when the field has a value"
                            onClick={() => insertSlot('{{#if firstName}} {{firstName}}{{/if}}')}>only if known</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={s.card}>
                  <div className={s.cardHead}>
                    <h3>Look and feel</h3>
                    <div className={s.spacer} />
                    <button className={`${s.btn} ${s.btnGhost}`} onClick={() => setShowDesign(v => !v)}>
                      {showDesign ? 'Hide' : 'Customise'}
                    </button>
                  </div>
                  {showDesign && (
                    <div className={s.cardBody}>
                      <DesignPanel design={draft.design} onChange={design => patch({ design })} styles={s} />
                    </div>
                  )}
                </div>

                <div className={s.card}>
                  <div className={s.cardHead}><h3>Note for the next person</h3></div>
                  <div className={s.cardBody}>
                    <textarea className={s.textarea} rows={2} value={draft.notes}
                      onChange={e => patch({ notes: e.target.value })}
                      placeholder="Why you changed it — shown in the version history." />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Preview ── */}
        <aside className={s.preview}>
          <div className={s.previewBar}>
            <h3>Preview</h3>
            <div className={s.spacer} />
            <div className={s.seg}>
              <button className={device === 'desktop' ? s.on : ''} onClick={() => setDevice('desktop')}>Desktop</button>
              <button className={device === 'mobile' ? s.on : ''} onClick={() => setDevice('mobile')}>Phone</button>
            </div>
          </div>
          <dl className={s.previewMeta}>
            <dt>Subject</dt><dd>{preview.subject || '—'}</dd>
            <dt>From</dt><dd>Dylan Olsson &lt;dylan@co-ownership-property.com&gt;</dd>
          </dl>
          <div className={s.frameWrap}>
            <iframe title="Email preview" className={`${s.frame} ${device === 'mobile' ? s.mobile : ''}`}
              sandbox="" srcDoc={preview.html || '<p style="font:14px Arial;color:#8b979f;padding:24px">Nothing to preview yet.</p>'} />
          </div>
        </aside>
      </div>
    </AdminLayout>
  )
}

// ── Block editor ─────────────────────────────────────────────────────────────
function BlockEditor({ block, index, last, onPatch, onMove, onRemove, focusRef, styles: s }) {
  const label = (BLOCK_TYPES.find(([t]) => t === block.type) || ['', block.type])[1]

  const track = (field) => (e) => {
    focusRef.current = { index, start: e.target.selectionStart, end: e.target.selectionEnd, field }
  }

  return (
    <div className={s.block}>
      <div className={s.blockHead}>
        <select className={s.blockType} value={block.type} onChange={e => onPatch(index, newBlock(e.target.value))}>
          {BLOCK_TYPES.map(([t, l]) => <option key={t} value={t}>{l}</option>)}
        </select>
        <div className={s.spacer} />
        <button className={s.iconBtn} onClick={() => onMove(index, -1)} disabled={index === 0} title="Move up">↑</button>
        <button className={s.iconBtn} onClick={() => onMove(index, 1)} disabled={last} title="Move down">↓</button>
        <button className={`${s.iconBtn} ${s.danger}`} onClick={() => onRemove(index)} title="Delete">✕</button>
      </div>
      <div className={s.blockBody}>
        {(block.type === 'text' || block.type === 'heading') && (
          <textarea className={s.textarea} rows={block.type === 'heading' ? 1 : 3} value={block.text || ''}
            onChange={e => onPatch(index, { text: e.target.value })}
            onSelect={track('text')} onFocus={track('text')} onClick={track('text')}
            placeholder={label} />
        )}

        {block.type === 'list' && (
          <textarea className={s.textarea} rows={3} value={(block.items || []).join('\n')}
            onChange={e => onPatch(index, { items: e.target.value.split('\n') })}
            placeholder="One bullet per line" />
        )}

        {block.type === 'button' && (
          <div className={s.row}>
            <input className={s.input} value={block.label || ''} placeholder="Button text"
              onChange={e => onPatch(index, { label: e.target.value })} />
            <input className={`${s.input} ${s.mono}`} value={block.url || ''} placeholder="https://…"
              onChange={e => onPatch(index, { url: e.target.value })} />
          </div>
        )}

        {block.type === 'image' && (
          <div className={s.row}>
            <input className={`${s.input} ${s.mono}`} value={block.src || ''} placeholder="Image URL"
              onChange={e => onPatch(index, { src: e.target.value })} />
            <input className={s.input} value={block.alt || ''} placeholder="Describe the image"
              onChange={e => onPatch(index, { alt: e.target.value })} />
          </div>
        )}

        {block.type === 'spacer' && (
          <input className={s.input} value={block.height || '16px'} placeholder="16px"
            onChange={e => onPatch(index, { height: e.target.value })} />
        )}

        {block.type === 'slot' && (
          <>
            <input className={`${s.input} ${s.mono}`} value={block.slot || ''} placeholder="galleryLinks"
              onChange={e => onPatch(index, { slot: e.target.value })} />
            <p className={s.hint}>A block the sending code builds — the photo-links list, for example. You choose where it sits, not what it says.</p>
          </>
        )}

        {block.type === 'html' && (
          <>
            <textarea className={`${s.textarea} ${s.mono}`} rows={4} value={block.html || ''}
              onChange={e => onPatch(index, { html: e.target.value })} />
            <p className={s.hint}>Escape hatch. Anything you write here goes into the email untouched — check the preview in both Desktop and Phone.</p>
          </>
        )}

        {block.type !== 'spacer' && block.type !== 'divider' && (
          <p className={s.hint}>
            **bold**, *italic*, [link text](https://…) all work.
            {block.type === 'text' && ' Gap below: '}
            {block.type === 'text' && (
              <input value={block.gap || ''} placeholder="20px" style={{ width: 60, marginLeft: 4 }}
                onChange={e => onPatch(index, { gap: e.target.value || undefined })} />
            )}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Design panel ─────────────────────────────────────────────────────────────
const COLOR_FIELDS = [
  ['background', 'Background'],
  ['textColor', 'Body text'],
  ['headingColor', 'Headings'],
  ['linkColor', 'Links'],
  ['accentColor', 'Accent / buttons'],
]

function DesignPanel({ design, onChange, styles: s }) {
  const set = (k, v) => onChange({ ...design, [k]: v === '' ? undefined : v })
  const DEFAULTS = {
    background: '#ffffff', textColor: '#2a2a2a', headingColor: '#1E3448',
    linkColor: '#1E3448', accentColor: '#C9A84C',
  }
  return (
    <>
      <div className={s.designGrid}>
        {COLOR_FIELDS.map(([k, label]) => (
          <div className={s.field} key={k}>
            <label className={s.label}>{label}</label>
            <div className={s.swatch}>
              <input type="color" value={design[k] || DEFAULTS[k]} onChange={e => set(k, e.target.value)} />
              <input className={`${s.input} ${s.mono}`} value={design[k] || ''} placeholder={DEFAULTS[k]}
                onChange={e => set(k, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className={s.designGrid} style={{ marginTop: 6 }}>
        <div className={s.field}>
          <label className={s.label}>Body font</label>
          <input className={s.input} value={design.bodyFont || ''} placeholder="Arial,Helvetica,sans-serif"
            onChange={e => set('bodyFont', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Heading font</label>
          <input className={s.input} value={design.headingFont || ''} placeholder="Georgia,serif"
            onChange={e => set('headingFont', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Text size</label>
          <input className={s.input} value={design.fontSize || ''} placeholder="15px"
            onChange={e => set('fontSize', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Line spacing</label>
          <input className={s.input} value={design.lineHeight || ''} placeholder="1.7"
            onChange={e => set('lineHeight', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Outer padding</label>
          <input className={s.input} value={design.padding || ''} placeholder="36px 32px 40px"
            onChange={e => set('padding', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Max width</label>
          <input className={s.input} value={design.maxWidth || ''} placeholder="full width"
            onChange={e => set('maxWidth', e.target.value)} />
        </div>
      </div>

      <div className={s.field} style={{ marginTop: 10 }}>
        <label className={s.check}>
          <input type="checkbox" checked={design.signature !== false}
            onChange={e => set('signature', e.target.checked ? undefined : false)} />
          Show Dylan&apos;s signature block
        </label>
      </div>

      {design.signature !== false && (
        <div className={s.designGrid}>
          <div className={s.field}>
            <label className={s.label}>Name</label>
            <input className={s.input} value={design.signatureName || ''} placeholder="Dylan Olsson"
              onChange={e => set('signatureName', e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Role</label>
            <input className={s.input} value={design.signatureRole || ''} placeholder="Co-Founder · Co-Ownership Property"
              onChange={e => set('signatureRole', e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Phone</label>
            <input className={s.input} value={design.signaturePhone || ''} placeholder="+44 7901 002763"
              onChange={e => set('signaturePhone', e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Photo URL</label>
            <input className={`${s.input} ${s.mono}`} value={design.signaturePhoto || ''} placeholder="leave empty for no photo"
              onChange={e => set('signaturePhoto', e.target.value)} />
          </div>
        </div>
      )}
    </>
  )
}
