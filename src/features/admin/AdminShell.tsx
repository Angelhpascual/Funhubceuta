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
    <div className="min-h-screen bg-ceuta-bg-soft font-display">
      <nav className="admin-navbar">
        <div className="admin-navbar-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta" className="w-7 h-7 object-contain" />
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

      <div className="max-w-[640px] mx-auto px-4 pt-6 pb-10">
        {children}
      </div>
    </div>
  )
}
