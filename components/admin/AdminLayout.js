import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const s = {
  root: { minHeight: '100vh', background: '#F5F2EC', fontFamily: '"Nunito Sans", sans-serif' },
  nav: {
    background: '#2C4A5E',
    position: 'sticky', top: 0, zIndex: 30,
    boxShadow: '0 1px 8px rgba(44,74,94,0.15)',
  },
  navInner: {
    maxWidth: 1280, margin: '0 auto', padding: '0 24px',
    height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  brand: {
    fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px',
    textDecoration: 'none', fontFamily: '"Playfair Display", serif',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 6 },
  navLink: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
    padding: '6px 12px', borderRadius: 6, transition: 'all 0.15s',
  },
  navLinkActive: {
    fontSize: 13, color: '#ffffff', textDecoration: 'none',
    padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.12)',
    fontWeight: 600,
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  viewSite: {
    fontSize: 12, color: '#C9A84C', textDecoration: 'none',
    padding: '5px 10px', border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: 6, fontWeight: 600,
  },
  divider: { width: 1, height: 20, background: 'rgba(255,255,255,0.2)' },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  signOut: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'none',
    border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
  },
  main: { maxWidth: 1280, margin: '0 auto', padding: '32px 24px' },
  loading: {
    minHeight: '100vh', background: '#F5F2EC',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Nunito Sans", sans-serif',
  },
  loadingText: { fontSize: 14, color: '#8a9aaa' },
}

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
      <div style={s.loading}>
        <div style={s.loadingText}>Loading…</div>
      </div>
    )
  }

  const isProperties = router.pathname === '/admin' || router.pathname.startsWith('/admin/property')
  const isFeatured = router.pathname.startsWith('/admin/featured')
  const isNewsletters = router.pathname.startsWith('/admin/newsletters')
  const isEmails = router.pathname.startsWith('/admin/emails')

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLinks}>
            <Link href="/admin" style={s.brand}>COP Admin</Link>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 6px' }} />
            <Link href="/admin" style={isProperties ? s.navLinkActive : s.navLink}>
              Properties
            </Link>
            <Link href="/admin/featured" style={isFeatured ? s.navLinkActive : s.navLink}>
              Featured
            </Link>
            <Link href="/admin/newsletters" style={isNewsletters ? s.navLinkActive : s.navLink}>
              Newsletters
            </Link>
            <Link href="/admin/emails" style={isEmails ? s.navLinkActive : s.navLink}>
              Emails
            </Link>
          </div>
          <div style={s.navRight}>
            <Link href="/our-homes" target="_blank" style={s.viewSite}>
              View site ↗
            </Link>
            <div style={s.divider} />
            <span style={s.email}>{user?.email}</span>
            <button onClick={signOut} style={s.signOut}>Sign out</button>
          </div>
        </div>
      </nav>
      <main style={s.main}>
        {children}
      </main>
    </div>
  )
}
