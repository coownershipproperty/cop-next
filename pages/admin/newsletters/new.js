import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import CampaignEditor from '@/components/admin/newsletter/CampaignEditor'
import { C } from '@/components/admin/newsletter/tokens'

/**
 * /admin/newsletters/new
 *
 * Blank compose page. The first save (or send/schedule) creates the campaign
 * row in supabase and we redirect to /admin/newsletters/[id].
 */
export default function NewCampaign() {
  const router = useRouter()

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: C.faint, marginBottom: 20,
      }}>
        <Link href="/admin/newsletters" style={{ color: C.faint, textDecoration: 'none' }}>Newsletters</Link>
        <span>/</span>
        <span style={{ color: C.muted, fontWeight: 500 }}>New campaign</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: C.blue,
          fontFamily: '"Playfair Display", serif', margin: '0 0 6px',
        }}>
          Compose newsletter
        </h1>
        <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>
          Pick a template, curate properties, choose an audience, send.
        </p>
      </div>

      <CampaignEditor
        initialCampaign={null}
        onSaved={(c) => {
          // On first save, redirect to the edit URL so refreshes work.
          if (c?.id && router.pathname === '/admin/newsletters/new') {
            router.replace(`/admin/newsletters/${c.id}`)
          }
        }}
        readOnly={false}
      />
    </AdminLayout>
  )
}
