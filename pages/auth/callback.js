import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    let active = true
    let subscription
    let fallback
    const requested = typeof router.query.next === 'string' ? router.query.next : '/admin/'
    const next = requested.startsWith('/partner/') || requested.startsWith('/admin/') ? requested : '/admin/'
    const login = next.startsWith('/partner/') ? '/partner/login?error=1' : '/admin/login?error=1'
    const recovery = `/auth/reset-password?next=${encodeURIComponent(next)}`
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const isRecoveryLink = hash.get('type') === 'recovery'

    function finish(destination) {
      if (!active) return
      active = false
      if (fallback) window.clearTimeout(fallback)
      subscription?.unsubscribe()
      router.replace(destination)
    }

    // Supabase password-recovery links put tokens in the URL hash (#access_token=...)
    // The client SDK processes these automatically on init — we just need to wait
    const check = async () => {
      // Short wait for SDK to process hash tokens
      await new Promise(r => setTimeout(r, 300))
      if (!active) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { finish(isRecoveryLink ? recovery : next); return }

      // Listen for auth state change as fallback
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
          finish(event === 'PASSWORD_RECOVERY' || isRecoveryLink ? recovery : next)
        }
      })
      subscription = data.subscription

      // Final timeout fallback
      fallback = window.setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        finish(session ? (isRecoveryLink ? recovery : next) : login)
      }, 3000)
    }
    check()

    return () => {
      active = false
      if (fallback) window.clearTimeout(fallback)
      subscription?.unsubscribe()
    }
  }, [router, router.isReady, router.query.next])

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '14px', color: '#a8a29e' }}>Signing you in…</p>
    </div>
  )
}
