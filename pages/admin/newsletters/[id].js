import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import CampaignEditor from '@/components/admin/newsletter/CampaignEditor'
import { supabase } from '@/lib/supabase'
import { C } from '@/components/admin/newsletter/tokens'
import { Card, StatusBadge, PrimaryButton, GhostButton, Toast, GlobalAnimations } from '@/components/admin/newsletter/Primitives'

/**
 * /admin/newsletters/[id]
 *
 * Loads an existing campaign and renders it in CampaignEditor.
 * Read-only for status=sent; shows analytics block on top.
 */
export default function CampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/admin/login'); return }
    try {
      const r = await fetch(`/api/admin/ui/newsletter-load?id=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const j = await r.json()
      if (j.error) {
        setToast({ kind: 'error', text: j.error })
      } else {
        setCampaign(j.campaign)
        setStats(j.stats)
      }
    } finally {
      setLoading(false)
    }
  }

  async function duplicate() {
    setDuplicating(true)
    const { data: { session } } = await supabase.auth.getSession()
    const r = await fetch('/api/admin/ui/newsletter-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        name: `${campaign.name} (copy)`,
        subject: campaign.subject,
        intro_text: campaign.intro_text,
        template_type: campaign.template_type,
        property_slugs: campaign.property_slugs,
        personalize_by_region: campaign.personalize_by_region,
        audience_segment: campaign.audience_segment,
        audience_filter: campaign.audience_filter,
        status: 'draft',
      }),
    })
    const j = await r.json()
    setDuplicating(false)
    if (j.campaign?.id) router.push(`/admin/newsletters/${j.campaign.id}`)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '80px 0', textAlign: 'center', fontSize: 14, color: C.faint }}>Loading campaign…</div>
      </AdminLayout>
    )
  }
  if (!campaign) {
    return (
      <AdminLayout>
        <div style={{ padding: '80px 0', textAlign: 'center', fontSize: 14, color: C.faint }}>Campaign not found.</div>
      </AdminLayout>
    )
  }

  const isSent = campaign.status === 'sent'
  const formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB') : '—'

  return (
    <AdminLayout>
      <GlobalAnimations />
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: C.faint, marginBottom: 16,
      }}>
        <Link href="/admin/newsletters" style={{ color: C.faint, textDecoration: 'none' }}>Newsletters</Link>
        <span>/</span>
        <span style={{
          color: C.muted, fontWeight: 500,
          maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {campaign.name || 'Untitled'}
        </span>
      </div>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: C.blue,
            fontFamily: '"Playfair Display", serif',
            margin: '0 0 6px', lineHeight: 1.3,
          }}>
            {campaign.name || 'Untitled campaign'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StatusBadge status={campaign.status} />
            <span style={{ fontSize: 12, color: C.faint }}>Created {formatDate(campaign.created_at)}</span>
            {campaign.sent_at && <span style={{ fontSize: 12, color: C.faint }}>· Sent {formatDate(campaign.sent_at)}</span>}
          </div>
        </div>
        {isSent && (
          <div style={{ display: 'flex', gap: 10 }}>
            <GhostButton onClick={duplicate} disabled={duplicating}>
              {duplicating ? 'Duplicating…' : '⎘ Duplicate as draft'}
            </GhostButton>
          </div>
        )}
      </div>

      {/* Post-send analytics — sent campaigns only */}
      {isSent && (
        <div style={{ marginBottom: 18 }}>
          <Card title="Send summary">
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            }}>
              <Stat label="Recipients" value={campaign.total_recipients?.toLocaleString() || '0'} />
              <Stat label="Sent OK"    value={stats?.sent?.toLocaleString() || campaign.sent_count?.toLocaleString() || '0'} color={C.green} />
              <Stat label="Failed"     value={stats?.failed?.toLocaleString() || '0'} color={stats?.failed ? C.red : C.faint} />
              <Stat label="Opens"      value="—" hint="(open-tracking pending)" />
            </div>
            <div style={{
              marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 10,
            }}>
              <GhostButton disabled title="Coming soon">
                ↺ Re-send to non-openers
              </GhostButton>
              <GhostButton onClick={duplicate} disabled={duplicating}>
                {duplicating ? 'Duplicating…' : '⎘ Duplicate campaign'}
              </GhostButton>
            </div>
          </Card>
        </div>
      )}

      <CampaignEditor
        initialCampaign={campaign}
        onSaved={(c) => setCampaign(c)}
        readOnly={isSent}
      />
    </AdminLayout>
  )
}

function Stat({ label, value, hint, color }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.faint,
        textTransform: 'uppercase', letterSpacing: '0.6px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700,
        color: color || C.blue,
        fontFamily: '"Playfair Display", serif',
        margin: '4px 0 0', lineHeight: 1.1,
      }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{hint}</div>}
    </div>
  )
}
