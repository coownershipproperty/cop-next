/**
 * /admin/crm — Leads view (phase 1 of moving the CRM into the admin).
 *
 * Reads the SAME `lead_pipeline` view as cop-crm.vercel.app and reuses its
 * exact derivations (buyer country from phone prefix, partner from lead or
 * property, price in EUR, last activity, emails/opens), so the numbers match
 * the standalone CRM 1:1. Grouping, filtering and sorting all happen
 * client-side over the full dataset — every column header sorts.
 *
 * The contact drawer is a full workbench, ported from the standalone CRM:
 * editable lead status, Telnyx browser calling (same /api/admin/telnyx/*
 * routes), WhatsApp / email shortcuts, per-lead cards with price + estimated
 * commission, notes, and the outbound email history.
 *
 * One deliberate difference: the standalone CRM's unbounded select silently
 * caps at 1,000 rows (most recent leads only). This page pages through the
 * view and loads ALL leads.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const C = {
  ink: '#1F2F3B', navy: '#2C4A5E', gold: '#C9A84C', cream: '#F5F2EC',
  line: '#E3DDD2', sub: '#7A8794', white: '#FFFFFF',
}

const STATUS_LABELS = {
  new_lead: 'New lead', contacted: 'Contacted', lead_replied: 'Replied',
  hot_lead: 'Hot lead', qualified: 'Qualified', passive_interest: 'Passive interest',
  registered: 'Registered', reservation_confirmed: 'Reserved',
  transferred_to_partner: 'Transferred', won: 'Won', lost: 'Lost',
}
const STATUS_COLORS = {
  new_lead: '#2563eb', contacted: '#d97706', lead_replied: '#7c3aed',
  hot_lead: '#dc2626', qualified: '#0891b2', passive_interest: '#6b7280',
  registered: '#16a34a', reservation_confirmed: '#16a34a',
  transferred_to_partner: '#0d9488', won: '#15803d', lost: '#6b7280',
}
const PARTNER_LABEL = {
  pacaso: 'Pacaso', myne: 'MYNE', vivla: 'Vivla', andhamlet: '&Hamlet',
  parispropertygroup: 'Paris PG', abitaro: 'Abitaro', '21-5': '21-5',
}

// Same table as the standalone CRM, longest prefix first.
const PHONE_CC = [
  ['+1', 'USA/Canada'], ['+7', 'Russia'], ['+20', 'Egypt'], ['+27', 'South Africa'], ['+30', 'Greece'],
  ['+31', 'Netherlands'], ['+32', 'Belgium'], ['+33', 'France'], ['+34', 'Spain'], ['+351', 'Portugal'],
  ['+352', 'Luxembourg'], ['+353', 'Ireland'], ['+354', 'Iceland'], ['+356', 'Malta'], ['+357', 'Cyprus'],
  ['+358', 'Finland'], ['+36', 'Hungary'], ['+39', 'Italy'], ['+40', 'Romania'], ['+41', 'Switzerland'],
  ['+420', 'Czechia'], ['+421', 'Slovakia'], ['+43', 'Austria'], ['+44', 'UK'], ['+45', 'Denmark'],
  ['+46', 'Sweden'], ['+47', 'Norway'], ['+48', 'Poland'], ['+49', 'Germany'], ['+52', 'Mexico'],
  ['+54', 'Argentina'], ['+55', 'Brazil'], ['+60', 'Malaysia'], ['+61', 'Australia'], ['+64', 'New Zealand'],
  ['+65', 'Singapore'], ['+66', 'Thailand'], ['+81', 'Japan'], ['+82', 'South Korea'], ['+852', 'Hong Kong'],
  ['+853', 'Macau'], ['+86', 'China'], ['+90', 'Turkey'], ['+91', 'India'], ['+92', 'Pakistan'],
  ['+960', 'Maldives'], ['+961', 'Lebanon'], ['+962', 'Jordan'], ['+965', 'Kuwait'], ['+966', 'Saudi Arabia'],
  ['+968', 'Oman'], ['+971', 'UAE'], ['+972', 'Israel'], ['+973', 'Bahrain'], ['+974', 'Qatar'],
].sort((a, b) => b[0].length - a[0].length)

const KNOWN_COUNTRY_CODES = PHONE_CC.map(([cc]) => cc.slice(1))

function phoneCountry(raw) {
  if (!raw) return ''
  let p = String(raw).replace(/[\s\-().]/g, '')
  if (p.startsWith('00')) p = '+' + p.slice(2)
  if (p.startsWith('+')) {
    for (const [cc, name] of PHONE_CC) if (p.startsWith(cc)) return name
    return 'Other'
  }
  if (/^07\d{9}$/.test(p)) return 'UK'
  if (/^0[1-9]\d{8,9}$/.test(p)) return ''
  if (/^[2-9]\d{9}$/.test(p)) return 'USA/Canada'
  return ''
}

// Same normalisation as the standalone CRM (default +44 for national formats).
function normalizePhone(raw, defaultCountryCode = '+44') {
  if (!raw) return null
  const compact = String(raw).replace(/[^\d+]/g, '')
  if (!compact) return null
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return '+' + compact.slice(2)
  if (/^[2-9]\d{9}$/.test(compact)) return '+1' + compact
  if (compact.startsWith('0')) return defaultCountryCode + compact.slice(1)
  if (KNOWN_COUNTRY_CODES.some((code) => compact.startsWith(code))) return '+' + compact
  return defaultCountryCode + compact
}

/** Dynamic import that the bundler leaves alone (runtime browser import). */
const dynImport = (u) => new Function('u', 'return import(u)')(u)

const COLUMNS = [
  { key: '_name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'main_region', label: 'Region' },
  { key: '_subregion', label: 'Subregion' },
  { key: '_buyer_country', label: 'Buyer Country', title: 'Derived from phone country code' },
  { key: '_partner', label: 'Partner' },
  { key: '_price_eur', label: 'Price', title: 'Share price of the property they enquired about' },
  { key: 'timeframe', label: 'Timeframe' },
  { key: 'source', label: 'Source' },
  { key: '_first_seen', label: 'First seen' },
  { key: 'last_activity', label: 'Last activity' },
  { key: '_emails', label: 'Emails / Opens', noSort: true },
]

const s = {
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 },
  h1: { fontFamily: '"Playfair Display", serif', fontSize: 26, color: C.ink, margin: 0 },
  stats: { display: 'flex', gap: 22, fontSize: 13, color: C.sub, marginBottom: 18, flexWrap: 'wrap' },
  statNum: { color: C.ink, fontWeight: 700 },
  bar: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  input: { fontSize: 13.5, padding: '9px 12px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink, minWidth: 250 },
  select: { fontSize: 13.5, padding: '9px 10px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink },
  btn: { fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${C.line}`, background: C.white, color: C.ink },
  tableWrap: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1240 },
  th: { textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.sub, padding: '11px 12px', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' },
  td: { padding: '11px 12px', borderBottom: `1px solid #F0EBE2`, color: C.ink, verticalAlign: 'top', whiteSpace: 'nowrap' },
  rowName: { fontWeight: 600, cursor: 'pointer', color: C.navy },
  dim: { color: C.sub, fontSize: 12 },
  chip: (color) => ({ fontSize: 11.5, fontWeight: 700, color: color || C.sub, background: `${color || C.sub}18`, padding: '2px 9px', borderRadius: 11, whiteSpace: 'nowrap', display: 'inline-block' }),
  queueChip: { fontSize: 10.5, fontWeight: 700, color: '#8a5a00', background: '#FDF3E3', padding: '2px 7px', borderRadius: 10, marginLeft: 6, whiteSpace: 'nowrap' },
  pager: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 2px', fontSize: 13, color: C.sub },
  drawerWrap: { position: 'fixed', inset: 0, background: 'rgba(31,47,59,0.35)', zIndex: 60 },
  drawer: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(580px, 94vw)', background: C.white, zIndex: 61, boxShadow: '-12px 0 40px rgba(0,0,0,0.18)', overflowY: 'auto', padding: '26px 28px' },
  drawerH: { fontFamily: '"Playfair Display", serif', fontSize: 22, color: C.ink, margin: '0 0 2px' },
  drawerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 0', padding: '12px', background: '#FCFBF8', border: `1px solid ${C.line}`, borderRadius: 9 },
  actBtn: (bg, fg, border) => ({ fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 7, cursor: 'pointer', border: border || 'none', background: bg, color: fg }),
  callChip: { fontSize: 12, color: C.sub, marginLeft: 4 },
  section: { margin: '20px 0 0' },
  sectionH: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.sub, marginBottom: 8 },
  leadRow: { border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, fontSize: 13 },
  actRow: { display: 'flex', gap: 10, fontSize: 12.5, color: C.ink, padding: '7px 0', borderBottom: '1px dashed #F0EBE2' },
  noteBox: { width: '100%', fontSize: 13, padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 7, minHeight: 54, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', background: '#FCFBF8' },
  miniSelect: { fontSize: 12, padding: '4px 6px', border: `1px solid ${C.line}`, borderRadius: 6, background: C.white, color: C.ink },
  empty: { padding: '48px 0', textAlign: 'center', color: C.sub, fontSize: 14 },
}

function fmtDate(iso, withTime = false) {
  if (!iso) return '—'
  const opts = withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(iso).toLocaleString('en-GB', opts)
}

function fmtEUR(v) {
  return v ? '€' + Math.round(v).toLocaleString() : '—'
}

/** Page through a query builder until exhausted (respects the 1,000-row cap). */
async function fetchAllPages(makeQuery, pageSize = 1000) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

const PAGE_SIZE = 50

export default function CrmLeads() {
  const [allLeads, setAllLeads] = useState([])
  const [propIndex, setPropIndex] = useState({})
  const [usdEur, setUsdEur] = useState(0.86)
  const [crmSettings, setCrmSettings] = useState({})
  const [queueContacts, setQueueContacts] = useState(new Set())
  const [queueCount, setQueueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [partner, setPartner] = useState('')
  const [source, setSource] = useState('')
  const [sortCol, setSortCol] = useState('last_activity')
  const [sortDir, setSortDir] = useState(-1)
  const [page, setPage] = useState(0)

  const [openRow, setOpenRow] = useState(null)
  const [detail, setDetail] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [callState, setCallState] = useState(null)
  const telnyxRef = useRef({ client: null, call: null, logged: new Set() })

  useEffect(() => {
    (async () => {
      try {
        const [leads, props, queue, fx, settings] = await Promise.all([
          // Same source + same internal-address exclusion as the standalone
          // CRM, but paged so ALL leads load (the CRM caps at 1,000).
          fetchAllPages(() => supabase
            .from('lead_pipeline')
            .select('*')
            .not('email', 'ilike', '%@co-ownership-property.com')
            .order('lead_id')),
          fetchAllPages(() => supabase.from('properties').select('slug, title, price, currency, partner').order('slug')),
          supabase.from('partner_referrals').select('contact_id, status').in('status', ['pending_review', 'qualified']).limit(1000),
          supabase.from('exchange_rates').select('rates').limit(1),
          supabase.from('crm_settings').select('key,value'),
        ])
        setAllLeads(leads)
        setPropIndex(Object.fromEntries(props.map((p) => [p.slug, p])))
        setQueueContacts(new Set((queue.data || []).map((r) => r.contact_id)))
        setQueueCount((queue.data || []).length)
        setCrmSettings(Object.fromEntries((settings.data || []).map((r) => [r.key, r.value])))
        const usd = Number(fx.data?.[0]?.rates?.USD)
        if (usd) {
          const rate = usd > 1 ? 1 / usd : usd // stored either direction; EUR≈0.8–0.95 per USD
          if (rate > 0.5 && rate < 1.5) setUsdEur(rate)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Tear down any live call/client when the drawer closes or page unmounts.
  useEffect(() => {
    if (openRow) return
    const t = telnyxRef.current
    try { t.call?.hangup?.() } catch (_) {}
    try { t.client?.disconnect?.() } catch (_) {}
    t.client = null; t.call = null; t.logged = new Set()
    setCallState(null)
  }, [openRow])

  const partnerOf = useCallback((l) => {
    const p = (l.partner || propIndex[l.property_slug]?.partner || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (p.includes('pacaso')) return 'pacaso'
    if (p.includes('myne')) return 'myne'
    if (p.includes('vivla')) return 'vivla'
    if (p.includes('hamlet')) return 'andhamlet'
    if (p.includes('paris')) return 'parispropertygroup'
    if (p.includes('abitaro')) return 'abitaro'
    if (p.includes('215')) return '21-5'
    return p || ''
  }, [propIndex])

  const leadPriceEUR = useCallback((l) => {
    const prop = propIndex[l.property_slug]
    if (!prop || !prop.price) return null
    const v = Number(prop.price)
    if (!v) return null
    return prop.currency === 'USD' ? Math.round(v * usdEur) : v
  }, [propIndex, usdEur])

  const commissionEUR = useCallback((l) => {
    const price = leadPriceEUR(l)
    if (!price) return null
    const rates = crmSettings.commission_rates || {}
    const rate = rates[partnerOf(l)] ?? rates.default ?? 3
    return price * (Number(rate) / 100)
  }, [leadPriceEUR, crmSettings, partnerOf])

  // Group leads by contact — same derivations as the standalone CRM.
  const grouped = useMemo(() => {
    const byContact = new Map()
    for (const l of allLeads) {
      if (!byContact.has(l.contact_id)) byContact.set(l.contact_id, [])
      byContact.get(l.contact_id).push(l)
    }
    const rows = []
    for (const leads of byContact.values()) {
      leads.sort((a, b) => String(b.last_activity || b.lead_updated || '').localeCompare(String(a.last_activity || a.lead_updated || '')))
      const best = leads[0]
      const partners = [...new Set(leads.map((l) => partnerOf(l)).filter(Boolean))]
      const prices = leads.map((l) => leadPriceEUR(l)).filter(Boolean)
      rows.push({
        ...best,
        _name: best.name || best.email || '',
        _lead_count: leads.length,
        _leads: leads,
        _all_regions: [...new Set(leads.map((l) => l.main_region).filter(Boolean))],
        _subregion: [...new Set(leads.map((l) => l.subregion).filter(Boolean))].slice(0, 3).join(' / '),
        _first_seen: leads.map((l) => l.contact_created).filter(Boolean).sort()[0] || null,
        last_activity: leads.map((l) => l.last_activity || l.lead_updated).filter(Boolean).sort().reverse()[0] || null,
        _total_emails_sent: leads.reduce((sum, l) => sum + (l.emails_sent || 0), 0),
        _total_opens: leads.reduce((sum, l) => sum + (l.total_opens || 0), 0),
        _buyer_country: phoneCountry(leads.map((l) => l.phone).find(Boolean)) || '',
        phone: leads.map((l) => l.phone).find(Boolean) || '',
        _partners: partners,
        _partner: partners.map((p) => PARTNER_LABEL[p] || p).join(' / '),
        _price_eur: prices.length ? Math.max(...prices) : 0,
        main_region: [...new Set(leads.map((l) => l.main_region).filter(Boolean))].slice(0, 2).join(' / '),
      })
    }
    return rows
  }, [allLeads, partnerOf, leadPriceEUR])

  const regionOptions = useMemo(() => [...new Set(allLeads.map((l) => l.main_region).filter(Boolean))].sort(), [allLeads])
  const sourceOptions = useMemo(() => [...new Set(allLeads.map((l) => l.source).filter(Boolean))].sort(), [allLeads])
  const partnerOptions = useMemo(() => [...new Set(grouped.flatMap((r) => r._partners))].sort(), [grouped])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = grouped.filter((r) => {
      if (q && !(`${r._name} ${r.email} ${r._all_regions.join(' ')} ${r._subregion}`.toLowerCase().includes(q))) return false
      if (status && !r._leads.some((l) => l.status === status)) return false
      if (region && !r._leads.some((l) => l.main_region === region)) return false
      if (partner && !r._partners.includes(partner)) return false
      if (source && r.source !== source) return false
      return true
    })
    rows.sort((a, b) => {
      let av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
      if (sortCol === '_price_eur' || sortCol === '_lead_count') { av = Number(av) || 0; bv = Number(bv) || 0 }
      return av < bv ? -sortDir : av > bv ? sortDir : 0
    })
    return rows
  }, [grouped, search, status, region, partner, source, sortCol, sortDir])

  useEffect(() => { setPage(0) }, [search, status, region, partner, source])

  function clickSort(col) {
    if (col === sortCol) setSortDir((d) => -d)
    else { setSortCol(col); setSortDir(-1) }
  }

  async function openDrawer(row) {
    setOpenRow(row)
    setDetail(null)
    setNoteText('')
    const [acts, referrals, notes, emails] = await Promise.all([
      supabase.from('activities').select('*').eq('contact_id', row.contact_id).order('created_at', { ascending: false }).limit(50),
      supabase.from('partner_referrals').select('id,status,partner,source,created_at,sent_at').eq('contact_id', row.contact_id).order('created_at', { ascending: false }).limit(10),
      supabase.from('notes').select('*').eq('contact_id', row.contact_id).order('created_at', { ascending: false }).limit(30),
      supabase.from('email_queue').select('id,subject,template_name,status,sent_at,send_after,sequence_type,created_at').eq('contact_id', row.contact_id).order('created_at', { ascending: false }).limit(30),
    ])
    setDetail({ activities: acts.data || [], referrals: referrals.data || [], notes: notes.data || [], emails: emails.data || [] })
  }

  async function updateLeadStatus(leadId, newStatus) {
    const { error: err } = await supabase.from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    if (err) { setError('Status update failed: ' + err.message); return }
    setAllLeads((rows) => rows.map((l) => (l.lead_id === leadId ? { ...l, status: newStatus } : l)))
    setOpenRow((r) => r && {
      ...r,
      status: r._leads[0]?.lead_id === leadId ? newStatus : r.status,
      _leads: r._leads.map((l) => (l.lead_id === leadId ? { ...l, status: newStatus } : l)),
    })
  }

  async function addNote(row) {
    const body = noteText.trim()
    if (!body) return
    const { data: { session } } = await supabase.auth.getSession()
    const { error: err } = await supabase.from('notes').insert({
      contact_id: row.contact_id,
      lead_id: row._leads[0]?.lead_id || null,
      body,
      created_by: session?.user?.email || 'admin',
    })
    if (err) { setError('Note failed: ' + err.message); return }
    setNoteText('')
    openDrawer(row)
  }

  async function logCall(row, dial, callerId, callObj, callStatus, extra = {}) {
    const key = `${callObj?.id || 'call'}:${callStatus}`
    if (telnyxRef.current.logged.has(key)) return
    telnyxRef.current.logged.add(key)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/admin/telnyx/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          leadId: row._leads[0]?.lead_id,
          contactId: row.contact_id,
          destinationNumber: dial,
          callerNumber: callerId || null,
          telnyxCallId: callObj?.id || null,
          status: callStatus,
          ...extra,
        }),
      })
    } catch (e) { console.error('[call-log]', e.message) }
  }

  async function startCall(row) {
    const dial = normalizePhone(row.phone)
    if (!dial) { setCallState('error: no dialable number'); return }
    setCallState('connecting…')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/admin/telnyx/token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const tok = await r.json()
      if (!r.ok) throw new Error(tok.error || 'Could not get a calling token')

      const mod = await dynImport('https://esm.sh/@telnyx/webrtc@2.26.4?bundle')
      const TelnyxRTC = mod.TelnyxRTC || mod.default?.TelnyxRTC || mod.default
      if (!TelnyxRTC) throw new Error('Could not load the Telnyx client')

      const clientOptions = tok.auth?.type === 'token'
        ? { login_token: tok.auth.loginToken }
        : { login: tok.auth?.login, password: tok.auth?.password }
      const client = new TelnyxRTC(clientOptions)
      client.remoteElement = 'telnyx-remote-audio'
      telnyxRef.current.client = client

      await new Promise((resolve, reject) => {
        let settled = false
        const timeout = window.setTimeout(() => { if (!settled) { settled = true; reject(new Error('Telnyx connection timed out')) } }, 12000)
        client.on('telnyx.ready', () => { if (!settled) { settled = true; window.clearTimeout(timeout); resolve() } })
        client.on('telnyx.error', () => { if (!settled) { settled = true; window.clearTimeout(timeout); reject(new Error('Telnyx connection error')) } })
        client.connect()
      })

      client.on('telnyx.notification', (n) => {
        if (n?.type !== 'callUpdate' || !n.call) return
        telnyxRef.current.call = n.call
        const st = n.call.state
        if (st === 'active') { setCallState('connected'); logCall(row, dial, tok.callerId, n.call, 'answered', { state: st }) }
        else if (st === 'hangup' || st === 'destroy') { setCallState('call ended'); logCall(row, dial, tok.callerId, n.call, 'ended', { state: st }) }
        else if (st === 'ringing' || st === 'trying' || st === 'requesting') setCallState('calling…')
      })

      const call = client.newCall({
        destinationNumber: dial,
        callerNumber: tok.callerId,
        callerName: 'Co-Ownership Property',
        remoteElement: 'telnyx-remote-audio',
        audio: true,
        video: false,
      })
      telnyxRef.current.call = call
      setCallState('calling…')
      logCall(row, dial, tok.callerId, call, 'started')
    } catch (e) {
      setCallState('error: ' + e.message)
    }
  }

  function hangup() {
    try { telnyxRef.current.call?.hangup?.() } catch (_) {}
    setCallState('call ended')
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const lines = ['name,email,phone,status,regions,subregions,buyer_country,partner,price_eur,timeframe,source,first_seen,last_activity,leads,emails_sent,opens']
    for (const r of filtered) {
      lines.push([
        esc(r._name), esc(r.email), esc(r.phone), esc(STATUS_LABELS[r.status] || r.status),
        esc(r._all_regions.join('; ')), esc(r._subregion), esc(r._buyer_country), esc(r._partner),
        esc(r._price_eur || ''), esc(r.timeframe), esc(r.source),
        esc((r._first_seen || '').slice(0, 10)), esc((r.last_activity || '').slice(0, 10)),
        esc(r._lead_count), esc(r._total_emails_sent), esc(r._total_opens),
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cop-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const newWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400e3
    return grouped.filter((r) => r._first_seen && new Date(r._first_seen).getTime() > cutoff).length
  }, [grouped])

  const waLink = openRow?.phone ? `https://wa.me/${(normalizePhone(openRow.phone) || '').replace(/[^\d]/g, '')}` : null
  const inCall = callState && !callState.startsWith('error') && callState !== 'call ended'

  return (
    <AdminLayout>
      <Head><title>CRM — COP Admin</title></Head>
      <div style={s.header}>
        <h1 style={s.h1}>CRM — Leads</h1>
        <Link href="/admin/partners/queue" style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>
          → 21-5 referral queue{queueCount ? ` (${queueCount} open)` : ''}
        </Link>
      </div>
      <div style={s.stats}>
        <span><span style={s.statNum}>{grouped.length.toLocaleString()}</span> contacts</span>
        <span><span style={s.statNum}>{allLeads.length.toLocaleString()}</span> leads</span>
        <span><span style={s.statNum}>{newWeek.toLocaleString()}</span> new this week</span>
        <span><span style={s.statNum}>{queueCount.toLocaleString()}</span> in referral queue</span>
        <span><span style={s.statNum}>{filtered.length.toLocaleString()}</span> matching filters</span>
      </div>

      <div style={s.bar}>
        <input style={s.input} placeholder="Search name, email, region…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={s.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.select} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={s.select} value={partner} onChange={(e) => setPartner(e.target.value)}>
          <option value="">All partners</option>
          {partnerOptions.map((p) => <option key={p} value={p}>{PARTNER_LABEL[p] || p}</option>)}
        </select>
        <select style={s.select} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          {sourceOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button style={s.btn} onClick={exportCsv}>↓ CSV</button>
      </div>

      {error && <div style={{ ...s.empty, color: '#b91c1c', padding: '12px 0' }}>{error}</div>}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ ...s.th, cursor: col.noSort ? 'default' : 'pointer' }}
                  title={col.title || undefined}
                  onClick={col.noSort ? undefined : () => clickSort(col.key)}
                >
                  {col.label}{sortCol === col.key ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.contact_id}>
                <td style={s.td}>
                  <span style={s.rowName} onClick={() => openDrawer(r)}>{r._name}</span>
                  {r._lead_count > 1 && <span style={{ ...s.dim, marginLeft: 6 }}>{r._lead_count}</span>}
                  {queueContacts.has(r.contact_id) && <span style={s.queueChip}>21-5 queue</span>}
                  <div style={s.dim}>{r.email}</div>
                </td>
                <td style={s.td}>{r.phone || '—'}</td>
                <td style={s.td}>
                  {r.status
                    ? <span style={s.chip(STATUS_COLORS[r.status])}>{STATUS_LABELS[r.status] || r.status}</span>
                    : <span style={s.dim}>—</span>}
                </td>
                <td style={s.td}>{r.main_region || '—'}</td>
                <td style={s.td}><span style={s.dim}>{r._subregion || '—'}</span></td>
                <td style={s.td}>{r._buyer_country || '—'}</td>
                <td style={s.td}>{r._partner || '—'}</td>
                <td style={s.td}>{fmtEUR(r._price_eur)}</td>
                <td style={s.td}><span style={s.dim}>{r.timeframe || '—'}</span></td>
                <td style={s.td}><span style={s.dim}>{r.source || '—'}</span></td>
                <td style={s.td}><span style={s.dim}>{fmtDate(r._first_seen)}</span></td>
                <td style={s.td}><span style={s.dim}>{fmtDate(r.last_activity)}</span></td>
                <td style={s.td}><span style={s.dim}>{r._total_emails_sent} / {r._total_opens}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={s.empty}>Loading all leads…</div>}
        {!loading && visible.length === 0 && <div style={s.empty}>No contacts match.</div>}
      </div>

      <div style={s.pager}>
        <button style={s.btn} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {page + 1} of {pages} · {filtered.length.toLocaleString()} contacts</span>
        <button style={s.btn} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>

      <audio id="telnyx-remote-audio" autoPlay style={{ display: 'none' }} />

      {openRow && (
        <>
          <div style={s.drawerWrap} onClick={() => setOpenRow(null)} />
          <div style={s.drawer}>
            <div style={s.drawerTop}>
              <div>
                <h2 style={s.drawerH}>{openRow._name}</h2>
                <div style={s.dim}>
                  {openRow.email}{openRow.phone ? ` · ${openRow.phone}` : ''}
                  {openRow._buyer_country ? ` · ${openRow._buyer_country}` : ''}
                  {' · '}first seen {fmtDate(openRow._first_seen)}
                </div>
              </div>
              <select
                style={s.select}
                value={openRow._leads[0]?.status || 'new_lead'}
                onChange={(e) => updateLeadStatus(openRow._leads[0]?.lead_id, e.target.value)}
                title="Status of the most recent lead"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div style={s.actionRow}>
              {!inCall
                ? <button style={s.actBtn('#C05B4D', '#fff')} onClick={() => startCall(openRow)} disabled={!openRow.phone}>Call</button>
                : <button style={s.actBtn('#fff', '#C05B4D', `1px solid #C05B4D`)} onClick={hangup}>Hang up</button>}
              <button
                style={s.actBtn('#1FA855', '#fff')}
                disabled={!waLink}
                onClick={() => waLink && window.open(waLink, '_blank')}
              >WhatsApp</button>
              <button
                style={s.actBtn('#fff', C.ink, `1px solid ${C.line}`)}
                onClick={() => { window.location.href = `mailto:${openRow.email}` }}
              >Email</button>
              {callState && <span style={s.callChip}>{callState}</span>}
              {!openRow.phone && <span style={s.callChip}>no phone on file</span>}
            </div>

            {detail?.referrals?.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionH}>Partner referrals</div>
                {detail.referrals.map((r) => (
                  <div key={r.id} style={s.leadRow}>
                    <strong>{r.partner}</strong> · {r.status.replaceAll('_', ' ')} · {r.source.replaceAll('_', ' ')} · {fmtDate(r.sent_at || r.created_at)}
                    {' '}<Link href="/admin/partners/queue" style={{ color: C.navy }}>open queue →</Link>
                  </div>
                ))}
              </div>
            )}

            <div style={s.section}>
              <div style={s.sectionH}>Leads ({openRow._leads.length})</div>
              {openRow._leads.map((l) => {
                const price = leadPriceEUR(l)
                const comm = commissionEUR(l)
                return (
                  <div key={l.lead_id} style={s.leadRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ whiteSpace: 'normal' }}>{l.property_title || l.main_region || 'General enquiry'}</strong>
                      <select
                        style={s.miniSelect}
                        value={l.status || 'new_lead'}
                        onChange={(e) => updateLeadStatus(l.lead_id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
                      </select>
                    </div>
                    <div style={s.dim}>
                      {[l.main_region, l.subregion].filter(Boolean).join(' / ')}
                      {price ? ` · ${fmtEUR(price)}` : (l.budget_max ? ` · up to €${Number(l.budget_max).toLocaleString()}` : '')}
                      {comm ? ` (≈${fmtEUR(comm)} commission)` : ''}
                      {l.timeframe ? ` · ${l.timeframe}` : ''}
                      {` · ${fmtDate(l.lead_created)}`}
                      {` · emails ${l.emails_sent || 0}/${l.total_opens || 0}`}
                    </div>
                    {l.message && <div style={{ marginTop: 4, whiteSpace: 'normal' }}>{l.message}</div>}
                  </div>
                )
              })}
            </div>

            <div style={s.section}>
              <div style={s.sectionH}>Notes</div>
              <textarea style={s.noteBox} placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button style={{ ...s.btn, marginTop: 6 }} onClick={() => addNote(openRow)} disabled={!noteText.trim()}>Add note</button>
              {detail?.notes?.map((n) => (
                <div key={n.id} style={{ ...s.leadRow, marginTop: 8 }}>
                  <div style={{ whiteSpace: 'normal' }}>{n.body}</div>
                  <div style={s.dim}>{n.created_by || '—'} · {fmtDate(n.created_at, true)}</div>
                </div>
              ))}
            </div>

            <div style={s.section}>
              <div style={s.sectionH}>Emails ({detail?.emails?.length ?? '…'})</div>
              {detail?.emails?.map((e) => (
                <div key={e.id} style={s.actRow}>
                  <span style={{ ...s.dim, minWidth: 118 }}>{fmtDate(e.sent_at || e.send_after || e.created_at)}</span>
                  <span style={{ whiteSpace: 'normal', flex: 1 }}>{e.subject || e.template_name}</span>
                  <span style={s.chip(e.status === 'sent' ? '#16a34a' : e.status === 'pending' ? '#d97706' : '#6b7280')}>{e.status}</span>
                </div>
              ))}
              {detail && detail.emails.length === 0 && <div style={s.dim}>No emails yet.</div>}
            </div>

            <div style={s.section}>
              <div style={s.sectionH}>Activity</div>
              {!detail && <div style={s.dim}>Loading…</div>}
              {detail?.activities?.map((a) => (
                <div key={a.id} style={s.actRow}>
                  <span style={{ ...s.dim, minWidth: 118 }}>{fmtDate(a.created_at, true)}</span>
                  <span style={{ whiteSpace: 'normal' }}>{a.description || a.type}</span>
                </div>
              ))}
              {detail && detail.activities.length === 0 && <div style={s.dim}>No activity recorded.</div>}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
