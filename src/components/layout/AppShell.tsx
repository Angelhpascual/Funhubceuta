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
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: '/mercado',
    label: 'Mercado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
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
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

const SSR_ROUTES = ['/clasificacion', '/mercado', '/club', '/noticias', '/alineacion']

// Topbar rendered on SSR routes AND on home in desktop-only mode
function Topbar({ pathname, router }: { pathname: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="topbar">
      <div className="topbar-logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.png" alt="AD Ceuta" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <span className="topbar-title desktop-only">AD CEUTA <b>INFO</b></span>
      </div>
      <nav className="top-nav desktop-only">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`top-nav-item ${pathname === n.id ? 'active' : ''}`}
            onClick={() => router.push(n.id)}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isSSRRoute = SSR_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // Home page has its own mobile shell; on desktop we inject a topbar above it via CSS
  if (!isSSRRoute) {
    return (
      <>
        {/* Desktop-only topbar overlay for home and other non-SSR pages */}
        <div className="desktop-topbar-overlay">
          <Topbar pathname={pathname} router={router} />
        </div>
        {children}
      </>
    )
  }

  return (
    <div id="app-root">
      <Topbar pathname={pathname} router={router} />

      <div className="scroll-area">{children}</div>

      {/* Bottom nav: mobile only */}
      <div className="bottom-nav">
        {NAV.map((n) => (
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
