import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase magic links put tokens in the URL hash (#access_token=...)
    // The client SDK processes these automatically on init — we just need to wait
    const check = async () => {
      // Short wait for SDK to process hash tokens
      await new Promise(r => setTimeout(r, 300))
      let { data: { session } } = await supabase.auth.getSession()
      if (session) { router.replace('/admin'); return }

      // Listen for auth state change as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          router.replace('/admin')
        }
      })

      // Final timeout fallback
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        subscription.unsubscribe()
        router.replace(session ? '/admin' : '/admin/login?error=1')
      }, 3000)
    }
    check()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '14px', color: '#a8a29e' }}>Signing you in…</p>
    </div>
  )
}
