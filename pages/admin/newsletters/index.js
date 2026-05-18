import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import { C, input } from '@/components/admin/newsletter/tokens'
import { Card, StatusBadge, GlobalAnimations, PrimaryButton, GhostButton, Toast } from '@/components/admin/newsletter/Primitives'

/**
 * /admin/newsletters
 *
 * Campaigns list. Filterable by status. Each row links to /admin/newsletters/[id].
 * Top-right CTAs:
 *   - "+ New Campaign"
 *   - "Draft from new listings (last 7 days)" — one-click pre-populated draft.
 */
export default function NewslettersIndex() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [draftingFromListings, setDraftingFromListings] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/admin/login'); return }
    try {
      const res = await fetch('/api/admin/ui/newsletter-list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      setCampaigns(json.campaigns || [])
    } catch (err) {
      setToast({ kind: 'error', text: 'Failed to load campaigns' })
    } finally {
      setLoading(false)
    }
  }

  async function draftFromNewListings() {
    setDraftingFromListings(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/admin/ui/newsletter-new-listings?days=7', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const { properties } = await r.json()
      if (!properties?.length) {
        setToast({ kind: 'error', text: 'No new listings in the last 7 days.' })
        setDraftingFromListings(false)
        return
      }
      const slugs = properties.map(p => p.slug)
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
      const save = await fetch('/api/admin/ui/newsletter-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name: `New listings — week of ${today}`,
          subject: `{{first_name}}, ${properties.length} new homes this week`,
          intro_text: `Fresh on Co-Ownership Property this week — ${properties.length} new homes just added. Have a wander.`,
          template_type: 'new-listings-digest',
          property_slugs: slugs,
          personalize_by_region: true,
          audience_segment: 'all',
          audience_filter: {},
          status: 'draft',
        }),
      })
      const { campaign } = await save.json()
      router.push(`/admin/newsletters/${campaign.id}`)
    } catch (err) {
      setToast({ kind: 'error', text: 'Could not draft campaign' })
    } finally {
      setDraftingFromListings(false)
    }
  }

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search && !(c.name || '').toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom && c.created_at < dateFrom) return false
    if (dateTo && c.created_at > dateTo + 'T23:59:59') return false
    return true
  })

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // ── Empty state — no campaigns ever created ─────────────────────────────────
  if (!loading && campaigns.length === 0) {
    return (
      <AdminLayout>
        <GlobalAnimations />
        <Toast toast={toast} onClose={() => setToast(null)} />
        <Header
          subtitle="No campaigns yet"
          onNew={() => router.push('/admin/newsletters/new')}
          onQuickDraft={draftFromNewListings}
          quickDraftBusy={draftingFromListings}
        />
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
        }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 48, color: C.gold, margin: '0 0 12px', lineHeight: 1,
            fontStyle: 'italic', fontWeight: 300,
          }}>
            ✉
          </div>
          <h2 style={{
            fontFamily: '"Playfair Display", serif', fontSize: 22, color: C.blue,
            margin: '0 0 8px', fontWeight: 500,
          }}>
            Your first newsletter awaits
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 28px' }}>
            Build a curated email in minutes — pick properties, choose an audience, send.
          </p>
          <PrimaryButton onClick={() => router.push('/admin/newsletters/new')} kind="gold">
            Create your first newsletter →
          </PrimaryButton>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <GlobalAnimations />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Header
        subtitle={loading ? 'Loading…' : `${filtered.length} of ${campaigns.length} campaigns`}
        onNew={() => router.push('/admin/newsletters/new')}
        onQuickDraft={draftFromNewListings}
        quickDraftBusy={draftingFromListings}
      />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...input, width: 240 }}
          onFocus={e => e.target.style.borderColor = C.blue}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ ...input, width: 160 }}
        >
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          style={{ ...input, width: 150 }}
          title="Created from"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          style={{ ...input, width: 150 }}
          title="Created to"
        />
      </div>

      {/* Table */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th align="right">Recipients</Th>
                <Th align="right">Sent</Th>
                <Th>Created</Th>
                <Th>Sent at</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7" style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: C.faint }}>Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: C.faint }}>No campaigns match these filters.</td></tr>
              )}
              {filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/newsletters/${c.id}`)}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Td>
                    <div style={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 500,
                      color: C.text,
                      fontSize: 15,
                      letterSpacing: '0.1px',
                    }}>
                      {c.name || 'Untitled'}
                    </div>
                    {c.subject && (
                      <div style={{ fontSize: 12, color: C.faint, marginTop: 3 }}>
                        {c.subject.length > 70 ? c.subject.slice(0, 70) + '…' : c.subject}
                      </div>
                    )}
                  </Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td align="right">
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                      {c.total_recipients?.toLocaleString() || 0}
                    </span>
                  </Td>
                  <Td align="right">
                    {c.status === 'sent' ? (
                      <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                        {c.sent_count?.toLocaleString() || 0}
                      </span>
                    ) : <span style={{ fontSize: 13, color: C.faint }}>—</span>}
                  </Td>
                  <Td><span style={{ fontSize: 13, color: C.muted }}>{formatDate(c.created_at)}</span></Td>
                  <Td><span style={{ fontSize: 13, color: C.muted }}>{formatDate(c.sent_at)}</span></Td>
                  <Td align="right">
                    <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Open →</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  )
}

function Header({ subtitle, onNew, onQuickDraft, quickDraftBusy }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 16, marginBottom: 24, flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: C.blue,
          fontFamily: '"Playfair Display", serif', margin: 0,
        }}>
          Newsletters
        </h1>
        <p style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <GhostButton onClick={onQuickDraft} disabled={quickDraftBusy}>
          {quickDraftBusy ? 'Drafting…' : 'Draft from new listings (7d)'}
        </GhostButton>
        <PrimaryButton onClick={onNew} kind="gold">
          + New Campaign
        </PrimaryButton>
      </div>
    </div>
  )
}

function Th({ children, align }) {
  return (
    <th style={{
      padding: '12px 18px',
      textAlign: align || 'left',
      fontSize: 11,
      fontWeight: 700,
      color: C.faint,
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
    }}>
      {children}
    </th>
  )
}

function Td({ children, align }) {
  return (
    <td style={{
      padding: '14px 18px',
      textAlign: align || 'left',
      verticalAlign: 'middle',
    }}>
      {children}
    </td>
  )
}
