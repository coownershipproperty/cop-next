import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  width: '100%',
  border: '1px solid #e8e0d4',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: '#1a2533',
  outline: 'none',
  background: '#faf9f7',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#2C4A5E',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('info@co-ownership-property.com')
  const [password, setPassword] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError || !data?.session) {
      setError('Email or password not recognised.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    })
    if (!response.ok) {
      await supabase.auth.signOut()
      setError('This email does not have admin access.')
      setLoading(false)
      return
    }
    router.replace('/admin/')
  }

  async function sendPasswordReset() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setResetSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F2EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Nunito Sans", sans-serif',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#2C4A5E',
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '-0.5px',
          }}>
            COP Admin
          </div>
          <p style={{ fontSize: 14, color: '#8a9aaa', marginTop: 6 }}>
            Co-Ownership Properties
          </p>
        </div>

        {resetSent ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(44,74,94,0.08)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a2533', marginBottom: 8 }}>
              Check your inbox
            </p>
            <p style={{ fontSize: 14, color: '#5a6a7a', lineHeight: 1.6 }}>
              We sent a password reset link to{' '}
              <span style={{ fontWeight: 600, color: '#2C4A5E' }}>{email}</span>.
              Open it to choose and confirm your new password.
            </p>
            <button
              onClick={() => setResetSent(false)}
              style={{
                marginTop: 24,
                fontSize: 13,
                color: '#8a9aaa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleLogin}
            style={{
              background: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 16,
              padding: '40px 32px',
              boxShadow: '0 4px 24px rgba(44,74,94,0.08)',
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2C4A5E'}
                onBlur={e => e.target.style.borderColor = '#e8e0d4'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2C4A5E'}
                onBlur={e => e.target.style.borderColor = '#e8e0d4'}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#8a9aaa' : '#2C4A5E',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#3a5f78' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#2C4A5E' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>

            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 14,
                fontSize: 13,
                color: '#8a9aaa',
                background: 'none',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
              }}
            >
              Forgotten password?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
