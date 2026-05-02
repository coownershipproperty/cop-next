import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin/login')
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace('/admin/login')
      else setUser(session.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-stone-800 tracking-tight">
              COP Admin
            </Link>
            <Link
              href="/admin"
              className={`text-sm ${router.pathname === '/admin' ? 'text-stone-800 font-medium' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Properties
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/our-homes" target="_blank" className="text-xs text-stone-400 hover:text-stone-600">
              View site ↗
            </Link>
            <div className="h-4 w-px bg-stone-200" />
            <span className="text-xs text-stone-400">{user?.email}</span>
            <button onClick={signOut} className="text-xs text-stone-400 hover:text-stone-600">
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
