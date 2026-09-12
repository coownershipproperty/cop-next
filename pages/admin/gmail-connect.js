/**
 * /admin/gmail-connect — connect Dylan's Gmail once, so the drafter can put
 * its drafts in the inbox David actually reads (12 Sep 2026).
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

export default function GmailConnect() {
  const router = useRouter()
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function load() {
    const t = await token(); if (!t) return
    const r = await fetch('/api/admin/gmail/status', { headers: { Authorization: `Bearer ${t}` } })
    setStatus(await r.json())
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (router.query.error) setErr(String(router.query.error)) }, [router.query.error])

  async function connect() {
    setBusy(true); setErr('')
    try {
      const t = await token()
      const r = await fetch('/api/admin/gmail/connect', { method: 'POST', headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      window.location.href = j.url
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 4px 40px', fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Gmail drafts</h1>
        <p style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.6 }}>
          Connect <b>{status?.account || 'dylan@co-ownership-property.com'}</b> once and every reply the drafter writes
          appears as a draft in that inbox — inside the existing conversation when there is one. The app can create
          and edit drafts only; it can never send.
        </p>
        {status?.connected ? (
          <div style={{ background: '#e6f4ea', color: '#137333', borderRadius: 8, padding: '12px 14px', fontSize: 14 }}>
            Connected as {status.connected.account_email} · since {new Date(status.connected.updated_at).toLocaleString('en-GB')}
          </div>
        ) : status ? (
          <div style={{ background: '#fef7e0', color: '#7a5900', borderRadius: 8, padding: '12px 14px', fontSize: 14 }}>
            Not connected — drafts are going to the review desk only.
          </div>
        ) : null}
        {router.query.ok && <div style={{ marginTop: 12, color: '#137333', fontSize: 14 }}>Connected. The next drafter run will write to Gmail.</div>}
        {err && <div style={{ marginTop: 12, background: '#fce8e6', color: '#c5221f', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{err}</div>}
        <button onClick={connect} disabled={busy} style={{ marginTop: 18, background: '#0b57d0', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
          {status?.connected ? 'Reconnect' : 'Connect Gmail'}
        </button>
        <p style={{ fontSize: 12, color: '#80868b', marginTop: 16 }}>
          Sign in as the draft account when Google asks. Any other account is refused.
        </p>
      </div>
    </AdminLayout>
  )
}
