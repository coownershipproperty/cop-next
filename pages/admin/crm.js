/**
 * /admin/crm — Leads (rebuilt 25 Aug 2026 to full parity with the standalone
 * CRM at cop-crm.vercel.app, plus the customisation it never had).
 *
 * WHY THE REBUILD
 * ---------------------------------------------------------------------------
 * Phase 1 of this page queried contacts + an embedded leads relation, which
 * lost most of what the CRM shows: no subregion, no buyer country, no property
 * price (it showed raw budget_max instead — hence "€100" budgets), no
 * timeframe, no last-activity, no email counts, and a drawer with no actions.
 * The CRM reads the `lead_pipeline` VIEW, which already joins contacts ×
 * leads × email counts. This page now reads the same view, so the two can
 * never drift apart again, and adds:
 *
 *   · every CRM column + property title, all sortable, with a column picker
 *   · saved views (filters + columns + sort), column set, density and page
 *     size all persisted per-browser in localStorage
 *   · live search-as-you-type over name / email / phone / region (client-side
 *     over the full pipeline — same as the CRM, no round-trip per keystroke)
 *   · a real contact drawer: Call / WhatsApp / Email / Open-in-Gmail actions,
 *     status editing, per-contact lead switcher, property price + estimated
 *     commission, buyer country derived from the phone code, the email_queue
 *     timeline, activities, and notes with an add-note box
 *
 * Derived-field logic (phoneCountry, partnerOf, price→EUR, commission) is
 * ported verbatim from crm/index.html so both UIs agree; commission rates come
 * from crm_settings with the same defaults.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const C = {
  ink: '#1F2F3B', navy: '#2C4A5E', gold: '#C9A84C', cream: '#F5F2EC',
  line: '#E3DDD2', sub: '#7A8794', white: '#FFFFFF', wa: '#20bf5a',
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
  transferred_to_partner: '#0e7490', won: '#15803d', lost: '#6b7280',
}

const PARTNER_LABEL = {
  pacaso: 'Pacaso', myne: 'MYNE', vivla: 'Vivla', andhamlet: '&Hamlet',
  parispropertygroup: 'Paris PG', abitaro: 'Abitaro',
}
// Partner-side outcome of a referral (partner_referrals.outcome, rolled up
// from the MYNE portal / Pacaso dashboard / partner emails — Sep 2026).
const OUTCOME_META = {
  won:       { label: 'Won',       color: '#15803d', rank: 4 },
  open:      { label: 'Open',      color: '#2563eb', rank: 3 },
  duplicate: { label: 'Duplicate', color: '#d97706', rank: 2 },
  lost:      { label: 'Lost',      color: '#6b7280', rank: 1 },
}
const OUTCOME_FILTERS = [
  ['won', 'Won'], ['open', 'Open with partner'], ['duplicate', 'Duplicate at partner'],
  ['lost', 'Lost'], ['none', 'Never referred'],
]

const DEFAULT_RATES = { myne: 2.5, pacaso: 3, vivla: 3, parispropertygroup: 3, andhamlet: 5, abitaro: 7, default: 3 }

// Longest prefix first — ported from crm/index.html so both UIs agree.
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

function partnerKey(lead, propIndex) {
  const p = (lead.partner || propIndex[lead.property_slug]?.partner || '').toLowerCase().replace(/[^a-z]/g, '')
  if (p.includes('pacaso')) return 'pacaso'
  if (p.includes('myne')) return 'myne'
  if (p.includes('vivla')) return 'vivla'
  if (p.includes('hamlet')) return 'andhamlet'
  if (p.includes('paris')) return 'parispropertygroup'
  if (p.includes('abitaro')) return 'abitaro'
  return p || ''
}

function fmtDate(iso, withTime = false) {
  if (!iso) return '—'
  const opts = withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(iso).toLocaleString('en-GB', opts)
}
const fmtEUR = (v) => (v == null || !Number(v)) ? '—' : '€' + Math.round(Number(v)).toLocaleString('en-GB')
const initials = (name) => (name || '?').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const waUrl = (phone) => phone ? 'https://wa.me/' + String(phone).replace(/[^\d]/g, '') : null

/** Page through a query until exhausted (PostgREST caps unbounded selects at 1,000). */
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

// ── Per-browser persistence (customisation survives reloads) ────────────────
const LS = 'copadmin.leads.'
function loadLS(key, fallback) {
  try { const v = localStorage.getItem(LS + key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveLS(key, value) {
  try { localStorage.setItem(LS + key, JSON.stringify(value)) } catch { /* ignore */ }
}

// ── Column registry — every column the pipeline can show ────────────────────
// `sort` extracts the comparable value from a grouped contact row.
const COLUMNS = [
  { key: 'name',        label: 'Name',          always: true, sort: (g) => (g.name || g.email || '').toLowerCase() },
  { key: 'phone',       label: 'Phone',         sort: (g) => g.phone || '' },
  { key: 'status',      label: 'Status',        sort: (g) => g.status || '' },
  { key: 'region',      label: 'Region',        sort: (g) => g._regions.join(' / ') },
  { key: 'subregion',   label: 'Subregion',     sort: (g) => g._subregions.join(' / ') },
  { key: 'buyer',       label: 'Buyer country', sort: (g) => g._buyerCountry },
  { key: 'partner',     label: 'Partner',       sort: (g) => g._partner },
  { key: 'outcome',     label: 'Partner outcome', num: true, sort: (g) => g._outcomeRank },
  { key: 'property',    label: 'Property',      sort: (g) => g.property_title || '' },
  { key: 'price',       label: 'Price',         num: true, sort: (g) => g._priceEur || 0 },
  { key: 'commission',  label: 'Est. commission', num: true, sort: (g) => g._commissionEur || 0 },
  { key: 'budget',      label: 'Budget (stated)', num: true, sort: (g) => Number(g.budget_min || g.budget_max) || 0 },
  { key: 'timeframe',   label: 'Timeframe',     sort: (g) => g.timeframe || '' },
  { key: 'source',      label: 'Source',        sort: (g) => g.source || '' },
  { key: 'first_seen',  label: 'First seen',    sort: (g) => g._firstSeen || '' },
  { key: 'last_activity', label: 'Last activity', sort: (g) => g._lastActivity || '' },
  { key: 'emails',      label: 'Emails / opens', num: true, sort: (g) => g._emailsSent },
]
const DEFAULT_COLS = ['name', 'phone', 'status', 'region', 'subregion', 'buyer', 'partner', 'outcome', 'price', 'timeframe', 'source', 'first_seen', 'last_activity']

const s = {
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 },
  h1: { fontFamily: '"Playfair Display", serif', fontSize: 26, color: C.ink, margin: 0 },
  stats: { display: 'flex', gap: 22, fontSize: 13, color: C.sub, marginBottom: 16, flexWrap: 'wrap' },
  statNum: { color: C.ink, fontWeight: 700 },
  bar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  input: { fontSize: 13.5, padding: '8px 12px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink, minWidth: 230 },
  select: { fontSize: 13, padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, color: C.ink, maxWidth: 170 },
  btn: { fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${C.line}`, background: C.white, color: C.ink },
  btnOn: { borderColor: C.navy, background: C.navy, color: C.white },
  tableWrap: { background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'auto', maxHeight: 'calc(100vh - 250px)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 },
  th: { position: 'sticky', top: 0, zIndex: 2, background: '#FBF9F4', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.sub, padding: '11px 12px', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' },
  rowName: { fontWeight: 600, color: C.navy },
  dim: { color: C.sub, fontSize: 12.5 },
  chip: (color) => ({ fontSize: 11.5, fontWeight: 700, color: color || C.sub, background: `${color || C.sub}18`, padding: '2px 9px', borderRadius: 11, whiteSpace: 'nowrap', display: 'inline-block' }),
  countChip: { fontSize: 10, fontWeight: 700, color: C.gold, background: 'rgba(201,168,76,0.16)', padding: '1px 6px', borderRadius: 4, marginLeft: 5 },
  queueChip: { fontSize: 11, fontWeight: 700, color: '#8a5a00', background: '#FDF3E3', padding: '2px 8px', borderRadius: 10, marginLeft: 6, whiteSpace: 'nowrap' },
  pager: { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 2px', fontSize: 13, color: C.sub, flexWrap: 'wrap' },
  pop: { position: 'absolute', top: '110%', right: 0, zIndex: 40, background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: '0 14px 40px rgba(31,47,59,0.14)', padding: '12px 14px', minWidth: 220 },
  popRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0', color: C.ink, cursor: 'pointer' },
  drawerWrap: { position: 'fixed', inset: 0, background: 'rgba(31,47,59,0.35)', zIndex: 60 },
  drawer: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(620px, 96vw)', background: C.white, zIndex: 61, boxShadow: '-12px 0 40px rgba(0,0,0,0.18)', overflowY: 'auto', padding: '24px 28px 40px' },
  drawerH: { fontFamily: '"Playfair Display", serif', fontSize: 22, color: C.ink, margin: 0 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: C.navy, color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  section: { margin: '20px 0 0' },
  sectionH: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.sub, marginBottom: 8 },
  act: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px 18px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', border: `1px solid ${C.line}`, background: C.white, color: C.ink },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', background: '#FBF9F4', border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' },
  gLabel: { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.sub, marginBottom: 2 },
  leadRow: { border: `1px solid ${C.line}`, borderRadius: 8, padding: '9px 12px', marginBottom: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ehRow: { display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px dashed #F0EBE2', fontSize: 12.5, alignItems: 'baseline' },
  note: { background: '#FBF9F4', border: `1px solid ${C.line}`, borderRadius: 8, padding: '9px 12px', marginBottom: 6, fontSize: 13 },
  empty: { padding: '48px 0', textAlign: 'center', color: C.sub, fontSize: 14 },
}

export default function CrmLeads() {
  // ── Data ──
  const [pipeline, setPipeline] = useState([])          // raw lead_pipeline rows
  const [propIndex, setPropIndex] = useState({})        // slug -> {price,currency,partner,title}
  const [usdEur, setUsdEur] = useState(0.86)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [queueContacts, setQueueContacts] = useState(new Set())
  const [referrals, setReferrals] = useState({})        // contact_id -> [partner_referrals rows sent to a partner]
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Filters / customisation (persisted) ──
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [partner, setPartner] = useState('')
  const [source, setSource] = useState('')
  const [outcome, setOutcome] = useState('')
  const [sortCol, setSortCol] = useState('last_activity')
  const [sortDir, setSortDir] = useState(-1)
  const [colsOn, setColsOn] = useState(DEFAULT_COLS)
  const [density, setDensity] = useState('comfortable')
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(0)
  const [views, setViews] = useState([])
  const [colsOpen, setColsOpen] = useState(false)
  const hydrated = useRef(false)

  // ── Drawer ──
  const [openRow, setOpenRow] = useState(null)          // grouped contact row
  const [activeLeadId, setActiveLeadId] = useState(null)
  const [detail, setDetail] = useState(null)            // {activities, notes, emails}
  const [noteText, setNoteText] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)

  // Hydrate persisted customisation once, client-side only.
  useEffect(() => {
    setColsOn(loadLS('cols', DEFAULT_COLS))
    setDensity(loadLS('density', 'comfortable'))
    setPageSize(loadLS('pageSize', 50))
    setViews(loadLS('views', []))
    hydrated.current = true
  }, [])
  useEffect(() => { if (hydrated.current) saveLS('cols', colsOn) }, [colsOn])
  useEffect(() => { if (hydrated.current) saveLS('density', density) }, [density])
  useEffect(() => { if (hydrated.current) saveLS('pageSize', pageSize) }, [pageSize])
  useEffect(() => { if (hydrated.current) saveLS('views', views) }, [views])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [settings, props, fx, queue, allRows, mergedRows, sentRefs] = await Promise.all([
        supabase.from('crm_settings').select('key,value'),
        fetchAllPages(() => supabase.from('properties').select('slug,price,currency,partner,title').order('slug')),
        supabase.from('exchange_rates').select('rates').limit(1),
        supabase.from('partner_referrals').select('contact_id,status').in('status', ['pending_review', 'qualified']).limit(1000),
        fetchAllPages(() => supabase.from('lead_pipeline').select('*')
          .not('email', 'ilike', '%@co-ownership-property.com')
          .order('lead_created', { ascending: false })),
        // The lead_pipeline view does not know about lead consolidation
        // ("Consolidate duplicate contact leads", Aug 2026) — filter merged-away
        // leads here or every consolidated duplicate reappears as a row.
        fetchAllPages(() => supabase.from('leads').select('id').not('merged_into_lead_id', 'is', null).order('id')),
        fetchAllPages(() => supabase.from('partner_referrals')
          .select('id,contact_id,partner,outcome,partner_stage,partner_stage_source,partner_stage_at,sent_at')
          .eq('status', 'sent_to_partner').order('sent_at', { ascending: false })),
      ])
      const refMap = {}
      for (const r of sentRefs || []) (refMap[r.contact_id] ||= []).push(r)
      setReferrals(refMap)
      const mergedIds = new Set((mergedRows || []).map((r) => r.id))
      const rows = allRows.filter((l) => !mergedIds.has(l.lead_id))
      const rateRow = (settings.data || []).find((r) => r.key === 'commission_rates')
      if (rateRow?.value) setRates({ ...DEFAULT_RATES, ...rateRow.value })
      setPropIndex(Object.fromEntries((props || []).map((p) => [p.slug, p])))
      const eur = fx.data?.[0]?.rates?.EUR
      if (Number(eur) > 0) setUsdEur(Number(eur))
      setQueueContacts(new Set((queue.data || []).map((r) => r.contact_id)))
      setPipeline(rows)

      const weekAgo = new Date(Date.now() - 7 * 86400e3).toISOString()
      const contactIds = new Set(rows.map((r) => r.contact_id))
      setStats({
        contacts: contactIds.size,
        leads: rows.length,
        newWeek: rows.filter((r) => r.lead_created >= weekAgo).length,
        hot: rows.filter((r) => r.status === 'hot_lead').length,
        queue: (queue.data || []).length,
        won: new Set((sentRefs || []).filter((r) => r.outcome === 'won').map((r) => r.contact_id)).size,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

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
    const rate = rates[partnerKey(l, propIndex)] ?? rates.default ?? 3
    return price * (Number(rate) / 100)
  }, [leadPriceEUR, rates, propIndex])

  // ── Group by contact: one row per person, best lead wins (CRM logic) ──────
  const grouped = useMemo(() => {
    const query = q.trim().toLowerCase()
    const filtered = pipeline.filter((l) => {
      const mq = !query
        || (l.name || '').toLowerCase().includes(query)
        || (l.email || '').toLowerCase().includes(query)
        || (l.phone || '').toLowerCase().includes(query)
        || (l.main_region || '').toLowerCase().includes(query)
        || (l.subregion || '').toLowerCase().includes(query)
      return mq
        && (!status || l.status === status)
        && (!region || l.main_region === region)
        && (!partner || partnerKey(l, propIndex) === partner)
        && (!source || l.source === source)
    })
    const byContact = {}
    for (const l of filtered) (byContact[l.contact_id] ||= []).push(l)
    const rows = Object.values(byContact).map((leads) => {
      leads.sort((a, b) => {
        const sa = (a.main_region ? 2 : 0) + (a.subregion ? 1 : 0) + (a.budget_min ? 1 : 0)
        const sb = (b.main_region ? 2 : 0) + (b.subregion ? 1 : 0) + (b.budget_min ? 1 : 0)
        if (sb !== sa) return sb - sa
        return (b.lead_updated || '') > (a.lead_updated || '') ? 1 : -1
      })
      const best = leads[0]
      const prices = leads.map(leadPriceEUR).filter(Boolean)
      const commissions = leads.map(commissionEUR).filter(Boolean)
      const partners = [...new Set(leads.map((l) => partnerKey(l, propIndex)).filter(Boolean))]
      const refs = referrals[best.contact_id] || []
      // One roll-up per person: a win anywhere beats an open referral, which beats a duplicate, which beats lost.
      const bestOutcome = refs.reduce((acc, r) => {
        const m = OUTCOME_META[r.outcome || 'open']
        return !acc || m.rank > OUTCOME_META[acc].rank ? (r.outcome || 'open') : acc
      }, null)
      return {
        ...best,
        _leads: leads,
        _leadCount: leads.length,
        _regions: [...new Set(leads.map((l) => l.main_region).filter(Boolean))],
        _subregions: [...new Set(leads.map((l) => l.subregion).filter(Boolean))],
        _firstSeen: leads.map((l) => l.contact_created).filter(Boolean).sort()[0] || null,
        _lastActivity: leads.map((l) => l.last_activity || l.lead_updated).filter(Boolean).sort().reverse()[0] || null,
        _emailsSent: leads.reduce((sum, l) => sum + (l.emails_sent || 0), 0),
        _opens: leads.reduce((sum, l) => sum + (l.total_opens || 0), 0),
        _buyerCountry: phoneCountry(leads.map((l) => l.phone).find(Boolean)) || best.country || '',
        _partner: partners.map((p) => PARTNER_LABEL[p] || p).join(' / '),
        // Average across the contact's leads (matches the standalone CRM —
        // Dan Prescott's €2,663,989 over 5 leads is an average, not a max).
        _priceEur: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        _commissionEur: commissions.length ? Math.round(commissions.reduce((a, b) => a + b, 0) / commissions.length) : 0,
        _referrals: refs,
        _outcome: bestOutcome,
        _outcomeRank: bestOutcome ? OUTCOME_META[bestOutcome].rank : 0,
      }
    })
    if (!outcome) return rows
    return rows.filter((g) => outcome === 'none' ? !g._referrals.length : g._outcome === outcome)
  }, [pipeline, q, status, region, partner, source, outcome, referrals, propIndex, leadPriceEUR, commissionEUR])

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortCol)
    if (!col) return grouped
    const rows = [...grouped]
    rows.sort((a, b) => {
      let av = col.sort(a), bv = col.sort(b)
      if (col.num) { av = Number(av) || 0; bv = Number(bv) || 0 }
      return av < bv ? sortDir : av > bv ? -sortDir : 0
    })
    return rows
  }, [grouped, sortCol, sortDir])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize)
  useEffect(() => { if (page >= pages) setPage(0) }, [pages, page])

  const regionOptions = useMemo(() => [...new Set(pipeline.map((l) => l.main_region).filter(Boolean))].sort(), [pipeline])
  const sourceOptions = useMemo(() => [...new Set(pipeline.map((l) => l.source).filter(Boolean))].sort(), [pipeline])
  const partnerOptions = useMemo(() => {
    const keys = [...new Set(pipeline.map((l) => partnerKey(l, propIndex)).filter(Boolean))]
    return keys.map((k) => [k, PARTNER_LABEL[k] || k]).sort((a, b) => a[1].localeCompare(b[1]))
  }, [pipeline, propIndex])

  function toggleSort(key) {
    if (sortCol === key) setSortDir((d) => -d)
    else { setSortCol(key); setSortDir(-1) }
  }

  // ── Saved views ──
  function applyView(v) {
    setQ(v.q || ''); setStatus(v.status || ''); setRegion(v.region || '')
    setPartner(v.partner || ''); setSource(v.source || ''); setOutcome(v.outcome || '')
    if (v.cols) setColsOn(v.cols)
    if (v.sortCol) { setSortCol(v.sortCol); setSortDir(v.sortDir || -1) }
    setPage(0)
  }
  function saveView() {
    const name = window.prompt('Name this view (e.g. "Hot MYNE leads"):')
    if (!name) return
    const v = { name, q, status, region, partner, source, outcome, cols: colsOn, sortCol, sortDir }
    setViews((prev) => [...prev.filter((x) => x.name !== name), v])
  }

  function exportCsv() {
    const visible = COLUMNS.filter((c) => colsOn.includes(c.key))
    const esc = (v) => { const t = String(v ?? '').replaceAll('"', '""'); return /[",\n]/.test(t) ? `"${t}"` : t }
    const cell = (g, c) => {
      switch (c.key) {
        case 'name': return `${g.name || ''} <${g.email || ''}>`
        case 'status': return STATUS_LABELS[g.status] || g.status || ''
        case 'region': return g._regions.join(' / ')
        case 'subregion': return g._subregions.join(' / ')
        case 'buyer': return g._buyerCountry
        case 'partner': return g._partner
        case 'outcome': return g._referrals.map((r) => `${PARTNER_LABEL[r.partner] || r.partner}: ${OUTCOME_META[r.outcome || 'open'].label}${r.partner_stage ? ' — ' + r.partner_stage : ''}`).join(' | ')
        case 'property': return g.property_title || ''
        case 'price': return g._priceEur || ''
        case 'commission': return g._commissionEur ? Math.round(g._commissionEur) : ''
        case 'budget': return g.budget_min || g.budget_max || ''
        case 'first_seen': return (g._firstSeen || '').slice(0, 10)
        case 'last_activity': return (g._lastActivity || '').slice(0, 10)
        case 'emails': return `${g._emailsSent} / ${g._opens}`
        default: return g[c.key] || ''
      }
    }
    const lines = [visible.map((c) => c.label).join(',')]
    for (const g of sorted) lines.push(visible.map((c) => esc(cell(g, c))).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cop-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ── Drawer ──
  const openDrawer = useCallback(async (row) => {
    setOpenRow(row)
    setActiveLeadId(row.lead_id)
    setDetail(null)
    setNoteText('')
    const cid = row.contact_id
    const leadIds = row._leads.map((l) => l.lead_id).filter(Boolean)
    const orExpr = leadIds.length ? `contact_id.eq.${cid},lead_id.in.(${leadIds.join(',')})` : `contact_id.eq.${cid}`
    const [acts, notes, emails] = await Promise.all([
      supabase.from('activities').select('*').or(orExpr).order('created_at', { ascending: false }).limit(80),
      supabase.from('notes').select('*').eq('contact_id', cid).order('created_at', { ascending: false }).limit(50),
      supabase.from('email_queue').select('id,subject,template_name,status,sent_at,send_after,sequence_type,created_at').eq('contact_id', cid).order('created_at', { ascending: false }).limit(60),
    ])
    const seen = new Set()
    const activities = (acts.data || []).filter((a) => !seen.has(a.id) && seen.add(a.id))
    setDetail({ activities, notes: notes.data || [], emails: emails.data || [] })
  }, [])

  async function updateStatus(leadId, newStatus) {
    const { error: err } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId)
    if (err) { setError('Status update failed: ' + err.message); return }
    setPipeline((prev) => prev.map((l) => l.lead_id === leadId ? { ...l, status: newStatus } : l))
    setOpenRow((prev) => prev && {
      ...prev,
      status: prev.lead_id === leadId ? newStatus : prev.status,
      _leads: prev._leads.map((l) => l.lead_id === leadId ? { ...l, status: newStatus } : l),
    })
  }

  async function addNote() {
    const body = noteText.trim()
    if (!body || !openRow) return
    setNoteBusy(true)
    const { error: err } = await supabase.from('notes').insert({
      contact_id: openRow.contact_id, lead_id: activeLeadId, body, created_by: 'David',
    })
    setNoteBusy(false)
    if (err) { setError('Note failed: ' + err.message); return }
    setNoteText('')
    openDrawer(openRow)
  }

  const activeLead = openRow?._leads.find((l) => l.lead_id === activeLeadId) || openRow?._leads[0] || null
  const statusOptions = useMemo(() => Object.entries(STATUS_LABELS), [])
  const visibleCols = COLUMNS.filter((c) => colsOn.includes(c.key))
  const pad = density === 'compact' ? '7px 12px' : '12px 12px'
  const td = { padding: pad, borderBottom: '1px solid #F0EBE2', color: C.ink, verticalAlign: 'top', whiteSpace: 'nowrap' }

  function cellFor(g, key) {
    switch (key) {
      case 'name': return (
        <>
          <span style={s.rowName}>{g.name || 'Unknown'}</span>
          {g._leadCount > 1 && <span style={s.countChip}>{g._leadCount}</span>}
          {queueContacts.has(g.contact_id) && <span style={s.queueChip}>21-5 queue</span>}
          <div style={s.dim}>{g.email}</div>
        </>
      )
      case 'phone': return g.phone || <span style={s.dim}>—</span>
      case 'status': return g.status
        ? <span style={s.chip(STATUS_COLORS[g.status])}>{STATUS_LABELS[g.status] || g.status}</span>
        : <span style={s.dim}>—</span>
      case 'region': {
        const r = g._regions
        return r.length ? r.slice(0, 2).join(' / ') + (r.length > 2 ? ` +${r.length - 2}` : '') : <span style={s.dim}>—</span>
      }
      case 'subregion': {
        const r = g._subregions
        return r.length
          ? <span style={s.dim}>{r.slice(0, 2).join(' / ')}{r.length > 2 ? ` +${r.length - 2}` : ''}</span>
          : <span style={s.dim}>—</span>
      }
      case 'buyer': return g._buyerCountry || <span style={s.dim}>—</span>
      case 'partner': return g._partner || <span style={s.dim}>—</span>
      case 'outcome': return g._referrals.length
        ? (
          <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
            {g._referrals.map((r) => {
              const m = OUTCOME_META[r.outcome || 'open']
              return (
                <span key={r.id} style={s.chip(m.color)} title={`${PARTNER_LABEL[r.partner] || r.partner} — ${r.partner_stage || m.label}${r.partner_stage_at ? ' (' + fmtDate(r.partner_stage_at) + ')' : ''}`}>
                  {PARTNER_LABEL[r.partner] || r.partner} · {m.label}
                </span>
              )
            })}
          </span>
        )
        : <span style={s.dim}>—</span>
      case 'property': return g.property_title
        ? <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }}>{g.property_title}</span>
        : <span style={s.dim}>—</span>
      case 'price': return g._priceEur ? <strong>{fmtEUR(g._priceEur)}</strong> : <span style={s.dim}>—</span>
      case 'commission': return g._commissionEur
        ? <span style={{ color: '#8a6a1c', fontWeight: 600 }}>≈{fmtEUR(g._commissionEur)}</span>
        : <span style={s.dim}>—</span>
      case 'budget': {
        const b = g.budget_min || g.budget_max
        return b ? `€${Number(b).toLocaleString('en-GB')}` : <span style={s.dim}>—</span>
      }
      case 'timeframe': return g.timeframe || <span style={s.dim}>—</span>
      case 'source': return <span style={s.dim}>{g.source || '—'}</span>
      case 'first_seen': return <span style={s.dim}>{fmtDate(g._firstSeen)}</span>
      case 'last_activity': return <span style={s.dim}>{fmtDate(g._lastActivity)}</span>
      case 'emails': return <span style={s.dim}>{g._emailsSent} / {g._opens}</span>
      default: return null
    }
  }

  const EH_ICON = { sent: '✓', pending: '⏳', cancelled: '—', rejected: '✕', error: '✕' }
  function emailWhen(e) {
    const st = e.status || 'pending'
    if (st === 'sent' && e.sent_at) return 'Sent ' + fmtDate(e.sent_at)
    if (st === 'pending' && e.send_after) {
      const diff = Math.round((new Date(e.send_after) - Date.now()) / 86400e3)
      return diff <= 0 ? 'Ready to send' : diff === 1 ? 'In 1 day' : `In ${diff} days`
    }
    if (st === 'pending') return 'Awaiting approval'
    return st[0].toUpperCase() + st.slice(1)
  }

  return (
    <AdminLayout>
      <Head><title>Leads — COP Admin</title></Head>
      <div style={s.header}>
        <h1 style={s.h1}>All leads</h1>
        <Link href="/admin/partners/queue" style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>
          → 21-5 referral queue{stats?.queue ? ` (${stats.queue} open)` : ''}
        </Link>
      </div>
      {stats && (
        <div style={s.stats}>
          <span><span style={s.statNum}>{stats.contacts.toLocaleString()}</span> contacts</span>
          <span><span style={s.statNum}>{stats.leads.toLocaleString()}</span> leads</span>
          <span><span style={s.statNum}>{stats.newWeek.toLocaleString()}</span> new this week</span>
          <span><span style={{ ...s.statNum, color: '#dc2626' }}>{stats.hot.toLocaleString()}</span> hot</span>
          <span><span style={s.statNum}>{stats.queue.toLocaleString()}</span> in referral queue</span>
          <span><span style={{ ...s.statNum, color: '#15803d' }}>{(stats.won || 0).toLocaleString()}</span> won with a partner</span>
        </div>
      )}

      <div style={s.bar}>
        <input
          style={s.input}
          placeholder="Search name, email, phone, region…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0) }}
        />
        <select style={s.select} value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}>
          <option value="">All statuses</option>
          {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.select} value={region} onChange={(e) => { setPage(0); setRegion(e.target.value) }}>
          <option value="">All regions</option>
          {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={s.select} value={partner} onChange={(e) => { setPage(0); setPartner(e.target.value) }}>
          <option value="">All partners</option>
          {partnerOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.select} value={source} onChange={(e) => { setPage(0); setSource(e.target.value) }}>
          <option value="">All sources</option>
          {sourceOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={s.select} value={outcome} onChange={(e) => { setPage(0); setOutcome(e.target.value) }} title="Outcome reported by the partner for this contact's referral">
          <option value="">Any partner outcome</option>
          {OUTCOME_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <span style={{ flex: 1 }} />

        <select
          style={s.select}
          value=""
          onChange={(e) => {
            const v = views.find((x) => x.name === e.target.value)
            if (v) applyView(v)
          }}
        >
          <option value="">{views.length ? 'Saved views…' : 'No saved views'}</option>
          {views.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
        </select>
        <button style={s.btn} onClick={saveView} title="Save current filters, columns and sort as a named view">＋ Save view</button>

        <div style={{ position: 'relative' }}>
          <button style={{ ...s.btn, ...(colsOpen ? s.btnOn : {}) }} onClick={() => setColsOpen((o) => !o)}>
            Columns ({visibleCols.length})
          </button>
          {colsOpen && (
            <div style={s.pop}>
              {COLUMNS.map((c) => (
                <label key={c.key} style={{ ...s.popRow, opacity: c.always ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={colsOn.includes(c.key)}
                    disabled={c.always}
                    onChange={() => setColsOn((prev) => prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...COLUMNS.map((x) => x.key).filter((k) => k === c.key || prev.includes(k))])}
                  />
                  {c.label}
                </label>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={{ ...s.btn, padding: '5px 10px', fontSize: 12 }} onClick={() => setColsOn(DEFAULT_COLS)}>Reset</button>
                <button style={{ ...s.btn, padding: '5px 10px', fontSize: 12 }} onClick={() => setColsOn(COLUMNS.map((c) => c.key))}>All</button>
              </div>
            </div>
          )}
        </div>
        <button
          style={s.btn}
          title="Toggle row density"
          onClick={() => setDensity((d) => d === 'compact' ? 'comfortable' : 'compact')}
        >
          {density === 'compact' ? '☰ Compact' : '≡ Comfortable'}
        </button>
        <button style={s.btn} onClick={exportCsv}>↓ CSV</button>
      </div>

      {error && <div style={{ ...s.empty, color: '#b91c1c', padding: '12px 0' }}>{error}</div>}

      <div style={s.tableWrap} onClick={() => colsOpen && setColsOpen(false)}>
        <table style={s.table}>
          <thead>
            <tr>
              {visibleCols.map((c) => (
                <th key={c.key} style={s.th} onClick={() => toggleSort(c.key)}>
                  {c.label}{sortCol === c.key ? (sortDir === -1 ? ' ▼' : ' ▲') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((g) => (
              <tr
                key={g.contact_id}
                style={{ cursor: 'pointer', background: openRow?.contact_id === g.contact_id ? '#FBF6E9' : undefined }}
                onClick={() => openDrawer(g)}
              >
                {visibleCols.map((c) => <td key={c.key} style={td}>{cellFor(g, c.key)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={s.empty}>Loading the pipeline…</div>}
        {!loading && pageRows.length === 0 && <div style={s.empty}>No contacts match.</div>}
      </div>

      <div style={s.pager}>
        <button style={s.btn} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <span>Page {page + 1} of {pages} · {sorted.length.toLocaleString()} contacts</span>
        <button style={s.btn} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          Rows:
          <select style={s.select} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}>
            {[25, 50, 100, 250].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </span>
      </div>

      {openRow && (
        <>
          <div style={s.drawerWrap} onClick={() => setOpenRow(null)} />
          <div style={s.drawer}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={s.avatar}>{initials(openRow.name || openRow.email)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={s.drawerH}>{openRow.name || 'Unknown'}</h2>
                <div style={s.dim}>
                  {openRow.email}
                  {openRow._buyerCountry ? ` · ${openRow._buyerCountry}` : ''}
                  {` · since ${fmtDate(openRow._firstSeen)}`}
                </div>
              </div>
              {activeLead && (
                <select
                  style={s.select}
                  value={activeLead.status || 'new_lead'}
                  onChange={(e) => updateStatus(activeLead.lead_id, e.target.value)}
                >
                  {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {openRow.phone ? (
                <>
                  <a href={`tel:${openRow.phone}`} style={{ ...s.act, background: C.navy, borderColor: C.navy, color: C.white }}>Call</a>
                  <a href={waUrl(openRow.phone)} target="_blank" rel="noopener noreferrer" style={{ ...s.act, background: C.wa, borderColor: C.wa, color: C.white }}>WhatsApp</a>
                </>
              ) : (
                <span style={{ ...s.act, opacity: 0.45, cursor: 'default' }} title="No phone number on this contact">No phone</span>
              )}
              <a href={`mailto:${openRow.email}`} style={s.act}>Email</a>
              <a href={`https://mail.google.com/mail/#search/${encodeURIComponent(openRow.email || '')}`} target="_blank" rel="noopener noreferrer" style={s.act}>Open in Gmail ↗</a>
              {openRow.phone && <span style={{ alignSelf: 'center', fontSize: 13, color: C.sub }}>{openRow.phone}</span>}
            </div>

            {/* Partner referrals — what the partner says happened after handover */}
            {openRow._referrals?.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionH}>Partner referrals ({openRow._referrals.length})</div>
                {openRow._referrals.map((r) => {
                  const m = OUTCOME_META[r.outcome || 'open']
                  return (
                    <div key={r.id} style={{ ...s.leadRow, cursor: 'default', alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>{PARTNER_LABEL[r.partner] || r.partner}
                          <span style={{ ...s.dim, marginLeft: 6 }}>sent {fmtDate(r.sent_at)}</span>
                        </span>
                        {r.partner_stage && <span style={{ fontSize: 12.5, color: C.ink, whiteSpace: 'normal' }}>{r.partner_stage}</span>}
                        {r.partner_stage_at && <span style={s.dim}>as of {fmtDate(r.partner_stage_at)}{r.partner_stage_source ? ` · ${r.partner_stage_source.replace('_', ' ')}` : ''}</span>}
                      </span>
                      <span style={s.chip(m.color)}>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Lead switcher */}
            {openRow._leadCount > 1 && (
              <div style={s.section}>
                <div style={s.sectionH}>{openRow._leadCount} leads for this contact</div>
                {openRow._leads.map((l) => (
                  <div
                    key={l.lead_id}
                    style={{ ...s.leadRow, borderColor: l.lead_id === activeLeadId ? C.gold : C.line, background: l.lead_id === activeLeadId ? '#FDF9EE' : C.white }}
                    onClick={() => setActiveLeadId(l.lead_id)}
                  >
                    <span style={{ fontWeight: l.lead_id === activeLeadId ? 700 : 500 }}>
                      {l.property_title || l.subregion || l.main_region || 'General enquiry'}
                      <span style={{ ...s.dim, marginLeft: 6 }}>({l.source || 'unknown'})</span>
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={s.chip(STATUS_COLORS[l.status])}>{STATUS_LABELS[l.status] || l.status}</span>
                      <span style={s.dim}>{fmtDate(l.lead_created)}</span>
                      <Link
                        href={`/admin/leads/${l.lead_id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: C.navy, fontSize: 12, fontWeight: 700 }}
                      >
                        Open
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Detail grid for the active lead */}
            {activeLead && (
              <div style={s.section}>
                <div style={s.grid}>
                  <div><span style={s.gLabel}>Property</span>{activeLead.property_title || '—'}</div>
                  <div>
                    <span style={s.gLabel}>Region</span>
                    {openRow._regions.join(' / ') || '—'}
                    {openRow._subregions.length > 0 && <span style={{ ...s.dim, marginLeft: 5 }}>({openRow._subregions.join(', ')})</span>}
                  </div>
                  <div>
                    <span style={s.gLabel}>Property price</span>
                    {fmtEUR(leadPriceEUR(activeLead))}
                    {commissionEUR(activeLead) && <span style={{ color: '#8a6a1c', fontSize: 11.5, marginLeft: 6 }}>(≈{fmtEUR(commissionEUR(activeLead))} commission)</span>}
                  </div>
                  <div><span style={s.gLabel}>Partner</span>{PARTNER_LABEL[partnerKey(activeLead, propIndex)] || '—'}</div>
                  <div><span style={s.gLabel}>Budget (stated)</span>{activeLead.budget_min ? `€${Number(activeLead.budget_min).toLocaleString('en-GB')}` : '—'}</div>
                  <div><span style={s.gLabel}>Timeframe</span>{activeLead.timeframe || '—'}</div>
                  <div>
                    <span style={s.gLabel}>Buyer country</span>
                    {phoneCountry(activeLead.phone) || openRow.country || '—'}
                    {activeLead.phone && phoneCountry(activeLead.phone) && <span style={{ ...s.dim, fontSize: 11, marginLeft: 5 }}>(from phone)</span>}
                  </div>
                  <div><span style={s.gLabel}>Source</span>{activeLead.source || '—'}</div>
                  <div><span style={s.gLabel}>Emails sent / opens</span>{activeLead.emails_sent ?? 0} / {activeLead.total_opens ?? 0}</div>
                  <div><span style={s.gLabel}>Last activity</span>{fmtDate(openRow._lastActivity)}</div>
                </div>
                {activeLead.message && (
                  <div style={{ marginTop: 8, fontSize: 13, color: C.ink, fontStyle: 'italic', background: '#FBF9F4', border: `1px solid ${C.line}`, borderRadius: 8, padding: '9px 12px' }}>
                    &ldquo;{activeLead.message}&rdquo;
                  </div>
                )}
                <Link
                  href={`/admin/leads/${activeLead.lead_id}`}
                  style={{ display: 'inline-block', marginTop: 10, color: C.navy, fontSize: 12.5, fontWeight: 700 }}
                >
                  Open lead and select listings
                </Link>
              </div>
            )}

            {/* Emails timeline */}
            <div style={s.section}>
              <div style={s.sectionH}>Emails ({detail ? detail.emails.length : '…'})</div>
              {!detail && <div style={s.dim}>Loading…</div>}
              {detail?.emails.map((e) => (
                <div key={e.id} style={s.ehRow}>
                  <span style={{ width: 18, textAlign: 'center', color: e.status === 'sent' ? '#16a34a' : e.status === 'rejected' || e.status === 'error' ? '#dc2626' : C.sub }}>
                    {EH_ICON[e.status] || '•'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{e.subject || '(no subject)'}</span>
                    <span style={{ ...s.dim, marginLeft: 8 }}>{e.template_name || ''}</span>
                    {e.sequence_type && <span style={{ ...s.countChip, textTransform: 'uppercase' }}>{e.sequence_type}</span>}
                  </span>
                  <span style={s.dim}>{emailWhen(e)}</span>
                </div>
              ))}
              {detail && detail.emails.length === 0 && <div style={s.dim}>No emails yet.</div>}
            </div>

            {/* Activity */}
            <div style={s.section}>
              <div style={s.sectionH}>Activity ({detail ? detail.activities.length : '…'})</div>
              {detail?.activities.map((a) => {
                const tid = a.metadata?.thread_id
                return (
                  <div key={a.id} style={s.ehRow}>
                    <span style={{ ...s.dim, minWidth: 120 }}>{fmtDate(a.created_at, true)}</span>
                    <span style={{ flex: 1 }}>
                      {a.description || a.type}
                      {a.metadata?.snippet && <div style={{ ...s.dim, marginTop: 2 }}>{a.metadata.snippet}</div>}
                    </span>
                    {tid && <a href={`https://mail.google.com/mail/#all/${tid}`} target="_blank" rel="noopener noreferrer" style={{ color: C.navy, fontSize: 12 }}>Gmail ↗</a>}
                  </div>
                )
              })}
              {detail && detail.activities.length === 0 && <div style={s.dim}>No activity recorded.</div>}
            </div>

            {/* Notes */}
            <div style={s.section}>
              <div style={s.sectionH}>Notes ({detail ? detail.notes.length : '…'})</div>
              {detail?.notes.map((n) => (
                <div key={n.id} style={s.note}>
                  {n.body}
                  <div style={{ ...s.dim, marginTop: 3, fontSize: 11.5 }}>{n.created_by ? `${n.created_by} · ` : ''}{fmtDate(n.created_at, true)}</div>
                </div>
              ))}
              <textarea
                style={{ ...s.input, width: '100%', minHeight: 64, marginTop: 6, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button style={{ ...s.btn, marginTop: 6 }} disabled={noteBusy || !noteText.trim()} onClick={addNote}>
                {noteBusy ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
