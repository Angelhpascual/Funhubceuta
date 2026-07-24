'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { InstallModal } from '@/components/ui/InstallModal'
import { MvpBanner } from '@/components/ui/MvpBanner'

const NAV_MOBILE = [
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
    id: '/mercado',
    label: 'Mercado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
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
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

const NAV_DESKTOP = [
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
    id: '/mercado',
    label: 'Mercado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
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
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

const SSR_ROUTES = ['/clasificacion', '/partidos', '/club', '/noticias', '/alineacion', '/mercado', '/live', '/merchan']

// Topbar rendered on SSR routes AND on home in desktop-only mode
function Topbar({ pathname, router }: { pathname: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="topbar">
      {/* Desktop: escudo + título a la izquierda */}
      <div className="topbar-logo cursor-pointer desktop-only" onClick={() => router.push('/')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.webp" alt="AD Ceuta" className="w-10 h-10 object-contain" />
        <span className="topbar-title">AD CEUTA <b>INFO</b></span>
      </div>
      {/* Móvil: escudo centrado absolutamente */}
      <div
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer mobile-only"
        onClick={() => router.push('/')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.webp" alt="AD Ceuta" className="w-10 h-10 object-contain" />
      </div>
      <nav className="top-nav desktop-only">
        {NAV_DESKTOP.map((n) => (
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

function removeHtmlLoader() {
  const el = document.getElementById('html-loader')
  if (!el) return
  el.style.opacity = '0'
  el.style.pointerEvents = 'none'
  el.style.transition = 'opacity 0.3s ease'
}

const TIENDA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
)

const LIVE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </svg>
)

export function AppShell({ children, liveActive, mercadoActive }: { children: React.ReactNode; liveActive: boolean; mercadoActive: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  // SSR routes + admin: remove loader immediately on hydration (page is ready)
  useEffect(() => {
    const isSSR = SSR_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
    if (isSSR || pathname.startsWith('/admin')) removeHtmlLoader()
    // Home: LoadingScreen handles it
  }, [pathname])

  if (pathname.startsWith('/admin')) return <>{children}</>

  const isSSRRoute = SSR_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // Home page has its own mobile shell; on desktop we inject a topbar above it via CSS
  if (!isSSRRoute) {
    return (
      <>
        <InstallModal />
        <div className="desktop-topbar-overlay">
          <Topbar pathname={pathname} router={router} />
        </div>
        {children}
      </>
    )
  }

  return (
    <div id="app-root">
      <InstallModal />
      <Topbar pathname={pathname} router={router} />

      <div className="scroll-area">{children}</div>

      <MvpBanner />

      {/* Bottom nav: mobile only */}
      <div className="bottom-nav">
        {NAV_MOBILE.map((n) => {
          // Slot dinámico: Live > Mercado > Tienda
          const isDynamicSlot = n.id === '/mercado'
          const isLiveTab = isDynamicSlot && liveActive
          const href = isLiveTab ? '/live' : isDynamicSlot && !mercadoActive ? '/merchan' : n.id
          const label = isLiveTab ? 'Live' : isDynamicSlot && !mercadoActive ? 'Tienda' : n.label
          const icon = isLiveTab ? LIVE_ICON : isDynamicSlot && !mercadoActive ? TIENDA_ICON : n.icon
          const isActive = pathname === href || (isDynamicSlot && !mercadoActive && pathname === '/merchan')
          return (
            <button
              key={n.id}
              className={`nav-item ${isActive ? 'active' : ''} ${isLiveTab ? 'text-[var(--red)]' : ''}`}
              onClick={() => router.push(href)}
            >
              {isLiveTab ? (
                <span className="relative">
                  {icon}
                  <span className="absolute -right-0.5 -top-0.5 flex size-2 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--red)] opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[var(--red)]" />
                  </span>
                </span>
              ) : icon}
              <span className="nav-label">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
