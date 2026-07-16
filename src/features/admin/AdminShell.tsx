'use client'

import { usePathname, useRouter } from 'next/navigation'

const ADMIN_NAV = [
  {
    id: '/admin',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: '/admin/noticias',
    label: 'Noticias',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="10" y1="7" x2="16" y2="7" /><line x1="10" y1="11" x2="16" y2="11" /><line x1="10" y1="15" x2="13" y2="15" />
      </svg>
    ),
  },
  {
    id: '/admin/mercado',
    label: 'Mercado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-soft)', fontFamily: 'var(--font-barlow)' }}>
      {/* Topbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--black)', color: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/escudo.webp" alt="AD Ceuta FC" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'none' }} className="sm:!inline">
              AD Ceuta <b style={{ color: 'var(--red)' }}>Info</b>
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'var(--red)', color: '#fff', padding: '3px 7px', borderRadius: 4 }}>
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: 'none', alignItems: 'stretch', height: 56, gap: 2, flex: 1 }} className="md:!flex">
            {ADMIN_NAV.map((n) => {
              const active = pathname === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => router.push(n.id)}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', padding: '0 16px',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {n.label}
                  {active && <span style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 3, background: 'var(--red)', borderRadius: '3px 3px 0 0' }} />}
                </button>
              )
            })}
          </nav>

          {/* Desktop right */}
          <div style={{ display: 'none', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }} className="md:!flex">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E9E4B', boxShadow: '0 0 0 3px rgba(30,158,75,0.25)', display: 'inline-block' }} />
              Sistema activo
            </span>
            <button
              onClick={() => router.push('/admin/login')}
              style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: 8, background: 'none', cursor: 'pointer' }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }} className="md:!pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
          background: 'var(--black)', borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {ADMIN_NAV.map((n) => {
          const active = pathname === n.id
          return (
            <button
              key={n.id}
              onClick={() => router.push(n.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 4px', position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.15s',
              }}
            >
              {active && <span style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: 'var(--red)', borderRadius: '0 0 3px 3px' }} />}
              {n.icon}
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
