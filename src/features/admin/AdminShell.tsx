'use client'

import { usePathname, useRouter } from 'next/navigation'

const ADMIN_NAV = [
  { id: '/admin', label: 'Dashboard' },
  { id: '/admin/mercado', label: 'Mercado' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bone)', fontFamily: 'var(--font-display)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--black)', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 0', borderRight: '1px solid rgba(255,255,255,0.1)',
          paddingRight: 16, marginRight: 4,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.png" alt="AD Ceuta" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{
            color: 'var(--white)', fontSize: 13, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Admin
          </span>
        </div>

        {ADMIN_NAV.map((n) => {
          const active = pathname === n.id
          return (
            <button
              key={n.id}
              onClick={() => router.push(n.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 12px',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: active ? 'var(--white)' : 'rgba(255,255,255,0.45)',
                borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
              }}
            >
              {n.label}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          AD Ceuta FC Info
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 40px' }}>
        {children}
      </div>
    </div>
  )
}
