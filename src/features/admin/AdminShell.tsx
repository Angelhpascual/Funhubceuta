'use client'

import { usePathname, useRouter } from 'next/navigation'

const ADMIN_NAV = [
  { id: '/admin', label: 'Dashboard' },
  { id: '/admin/noticias', label: 'Noticias' },
  { id: '/admin/mercado', label: 'Mercado' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)', fontFamily: 'var(--font-display)' }}>
      <nav className="admin-navbar">
        <div className="admin-navbar-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.png" alt="AD Ceuta" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span>Admin</span>
        </div>

        {ADMIN_NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => router.push(n.id)}
            className={`admin-nav-tab${pathname === n.id ? ' active' : ''}`}
          >
            {n.label}
          </button>
        ))}

        <div className="admin-navbar-spacer" />
        <span className="admin-navbar-brand">AD Ceuta FC Info</span>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 40px' }}>
        {children}
      </div>
    </div>
  )
}
