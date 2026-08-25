import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '⌂', exact: true },
      { href: '/admin/leads', label: 'Leads', icon: '◫', exclude: ['/admin/leads/sold'] },
      { href: '/admin/leads/sold', label: 'Sold leads', icon: '✓' },
      { href: '/admin/partners/queue', label: 'Needs attention', icon: '!' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { href: '/admin/listings', label: 'Listings', icon: '▦', also: ['/admin/property'] },
      { href: '/admin/featured', label: 'Featured', icon: '◇' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { href: '/admin/newsletters', label: 'Newsletters', icon: '✉' },
      { href: '/admin/emails', label: 'Email campaigns', icon: '↗' },
    ],
  },
  {
    label: 'CONTACTS',
    items: [
      { href: '/admin/partners', label: 'Partner Hub', icon: '◎', exclude: ['/admin/partners/queue'] },
    ],
  },
]

function isActive(item, pathname) {
  if ((item.exclude || []).some((prefix) => pathname.startsWith(prefix))) return false
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href) || (item.also || []).some((prefix) => pathname.startsWith(prefix))
}

export default function AdminLayout({ children, fullBleed = false }) {
  const router = useRouter()
  const isDashboardHome = router.pathname === '/admin'
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function verifyAdmin(session) {
      if (!session) {
        if (active) router.replace('/admin/login')
        return
      }
      try {
        const response = await fetch('/api/admin/session', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!response.ok) throw new Error('Administrator access required')
        if (active) {
          setUser(session.user)
          setLoading(false)
        }
      } catch {
        await supabase.auth.signOut()
        if (active) router.replace('/admin/login?error=access')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => verifyAdmin(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace('/admin/login')
      else verifyAdmin(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => setMenuOpen(false), [router.asPath])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return <div className="cop-admin-loading">Loading COP Admin…</div>

  return (
    <div className={`cop-admin-shell${isDashboardHome ? ' dashboard-home' : ''}`}>
      <header className="cop-admin-mobile-header">
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open admin navigation">☰</button>
        <Link href="/admin">COP Admin</Link>
        <Link href="/our-homes" target="_blank">Site ↗</Link>
      </header>

      {menuOpen && <button className="cop-admin-scrim" type="button" onClick={() => setMenuOpen(false)} aria-label="Close admin navigation" />}

      <aside className={`cop-admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="cop-admin-brand">
          <span>C</span>
          <div><strong>COP Admin</strong><small>Co-Ownership Property</small></div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close admin navigation">×</button>
        </div>

        <nav className="cop-admin-navigation" aria-label="Admin navigation">
          {NAV_GROUPS.map((group) => (
            <section key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={isActive(item, router.pathname) ? 'active' : ''}>
                  <i aria-hidden="true">{item.icon}</i><span>{item.label}</span>
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="cop-admin-account">
          <Link href="/our-homes" target="_blank">View COP website <span>↗</span></Link>
          <div>
            <span>{(user?.email || 'A').slice(0, 1).toUpperCase()}</span>
            <p><strong>{user?.email}</strong><small>Administrator</small></p>
          </div>
          <div className="cop-admin-account-actions">
            <button type="button" onClick={() => router.push('/auth/reset-password?next=/admin/')}>Change password</button>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </aside>

      <main className={`cop-admin-content${fullBleed ? ' full-bleed' : ''}`}>{children}</main>
    </div>
  )
}
