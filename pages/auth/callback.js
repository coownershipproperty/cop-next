import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase appends the auth code to the URL — exchangeCodeForSession handles it
    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        console.error('Auth error:', error)
        router.replace('/admin/login?error=1')
      } else {
        router.replace('/admin')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-sm text-stone-400">Signing you in…</p>
    </div>
  )
}
