'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  {
    id: '/',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: '/clasificacion',
    label: 'Clasificación',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: '/partidos',
    label: 'Partidos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    id: '/club',
    label: 'Club',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

const SSR_ROUTES = ['/clasificacion', '/partidos', '/club', '/noticias']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const usesNewShell = SSR_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!usesNewShell) return <>{children}</>

  return (
    <div id="app-root">
      <div className="topbar" style={{ justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/escudo.png"
          alt="AD Ceuta"
          style={{ width: 40, height: 40, objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => router.push('/')}
        />
      </div>

      <div className="scroll-area">
        {children}
      </div>

      <div className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item ${pathname === n.id ? 'active' : ''}`}
            onClick={() => router.push(n.id)}
          >
            {n.icon}
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
