'use client'

import { usePathname, useRouter } from 'next/navigation'

const ADMIN_NAV = [
  {
    id: '/admin',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: '/admin/noticias',
    label: 'Noticias',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="10" y1="7" x2="16" y2="7" /><line x1="10" y1="11" x2="16" y2="11" /><line x1="10" y1="15" x2="13" y2="15" />
      </svg>
    ),
  },
  {
    id: '/admin/mercado',
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
    id: '/admin/partidos',
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
    id: '/admin/analytics',
    label: 'Analíticas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div id="app-root">
      {/* Topbar — mismo patrón que AppShell */}
      <div className="topbar">
        {/* Móvil: escudo centrado + badge Admin */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 mobile-only">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta FC" className="w-10 h-10 object-contain" />
          <span className="font-display text-[10px] font-extrabold tracking-[0.14em] uppercase bg-ceuta-red text-white px-[7px] py-[3px] rounded">
            Admin
          </span>
        </div>

        {/* Desktop: logo + título */}
        <div
          className="topbar-logo cursor-pointer desktop-only"
          onClick={() => router.push('/admin')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta FC" className="w-10 h-10 object-contain" />
          <span className="topbar-title">
            AD CEUTA <b>Info</b>
          </span>
          <span className="font-display text-[10px] font-extrabold tracking-[0.14em] uppercase bg-ceuta-red text-white px-[7px] py-[3px] rounded ml-1">
            Admin
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="top-nav desktop-only">
          {ADMIN_NAV.map((n) => (
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

      {/* Content */}
      <div className="scroll-area">{children}</div>

      {/* Bottom nav: mobile only — mismo patrón que AppShell */}
      <div className="bottom-nav">
        {ADMIN_NAV.map((n) => (
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
