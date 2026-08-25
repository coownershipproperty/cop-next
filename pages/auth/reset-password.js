import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  width: '100%',
  border: '1px solid #e8e0d4',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#1a2533',
  outline: 'none',
  background: '#faf9f7',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  marginBottom: 18,
  color: '#2C4A5E',
  fontSize: 13,
  fontWeight: 700,
}

function safeNext(value) {
  if (typeof value !== 'string') return '/admin/'
  return value.startsWith('/partner/') || value.startsWith('/admin/') ? value : '/admin/'
}

export default function ResetPassword() {
  const router = useRouter()
  const next = useMemo(() => safeNext(router.query.next), [router.query.next])
  const [status, setStatus] = useState('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    let timeout

    function acceptSession(session) {
      if (!active || !session?.user) return false
      setEmail(session.user.email || '')
      setStatus('ready')
      if (timeout) window.clearTimeout(timeout)
      return true
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        acceptSession(session)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (acceptSession(session)) return
      timeout = window.setTimeout(() => {
        if (active) setStatus('expired')
      }, 3500)
    })

    return () => {
      active = false
      if (timeout) window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function savePassword(event) {
    event.preventDefault()
    setError('')
    if (password.length < 10 || password.length > 72) {
      setError('Use a password between 10 and 72 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The two passwords do not match.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message || 'Your password could not be changed. Please request a new reset link.')
      return
    }
    setPassword('')
    setConfirmation('')
    setStatus('success')
  }

  return (
    <>
      <Head><title>Set password — COP Admin</title></Head>
      <main style={{ minHeight: '100vh', padding: 24, display: 'grid', placeItems: 'center', background: '#F5F2EC', fontFamily: '"Nunito Sans", sans-serif' }}>
        <section style={{ width: '100%', maxWidth: 430, padding: '38px 34px', border: '1px solid #e8e0d4', borderRadius: 16, background: '#fff', boxShadow: '0 4px 24px rgba(44,74,94,0.08)' }}>
          <p style={{ margin: '0 0 8px', color: '#A69052', fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>Account security</p>
          <h1 style={{ margin: '0 0 10px', color: '#143047', fontFamily: '"Playfair Display", serif', fontSize: 32 }}>Set your password</h1>

          {status === 'checking' && <p style={{ margin: '22px 0 0', color: '#667788', fontSize: 15 }}>Checking your secure reset link…</p>}

          {status === 'expired' && <div>
            <p style={{ margin: '18px 0', color: '#667788', fontSize: 15, lineHeight: 1.6 }}>This reset session has expired or was opened in a different browser. Request a fresh link from the COP Admin login.</p>
            <Link href="/admin/login" style={{ display: 'block', padding: '13px 18px', borderRadius: 10, color: '#fff', background: '#143047', textAlign: 'center', fontWeight: 700 }}>Return to COP Admin login</Link>
          </div>}

          {status === 'ready' && <form onSubmit={savePassword}>
            <p style={{ margin: '0 0 24px', color: '#667788', fontSize: 14, lineHeight: 1.6 }}>Choose a private password for <strong style={{ color: '#2C4A5E' }}>{email}</strong>.</p>
            <label style={labelStyle}>New password
              <input required minLength={10} maxLength={72} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
            </label>
            <label style={labelStyle}>Confirm new password
              <input required minLength={10} maxLength={72} autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
            </label>
            {error && <p role="alert" style={{ margin: '0 0 16px', color: '#b42318', fontSize: 13, lineHeight: 1.5 }}>{error}</p>}
            <button disabled={saving} style={{ width: '100%', padding: '13px 18px', border: 0, borderRadius: 10, color: '#fff', background: saving ? '#8a9aaa' : '#143047', fontSize: 15, fontWeight: 750, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving new password…' : 'Save new password'}</button>
          </form>}

          {status === 'success' && <div>
            <div aria-hidden="true" style={{ width: 48, height: 48, margin: '22px 0 16px', display: 'grid', placeItems: 'center', borderRadius: 14, color: '#087f5b', background: '#e8f7f1', fontSize: 24 }}>✓</div>
            <h2 style={{ margin: '0 0 8px', color: '#143047', fontSize: 20 }}>Password updated</h2>
            <p style={{ margin: '0 0 22px', color: '#667788', fontSize: 15, lineHeight: 1.6 }}>Your new password is active. You can continue securely to COP Admin.</p>
            <button type="button" onClick={() => router.replace(next)} style={{ width: '100%', padding: '13px 18px', border: 0, borderRadius: 10, color: '#fff', background: '#143047', fontSize: 15, fontWeight: 750, cursor: 'pointer' }}>Continue to COP Admin</button>
          </div>}
        </section>
      </main>
    </>
  )
}
