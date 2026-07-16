'use client'

import { usePathname, useRouter } from 'next/navigation'

const ADMIN_NAV = [
  { id: '/admin', label: 'Dashboard' },
  { id: '/admin/noticias', label: 'Noticias' },
  { id: '/admin/mercado', label: 'Mercado' },
  { id: '/admin/partidos', label: 'Partidos' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-ceuta-bg-soft font-body">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-ceuta-black text-white">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 h-16 flex items-center gap-3 md:gap-7">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/escudo.webp" alt="AD Ceuta FC" className="w-8 h-8 md:w-[38px] md:h-[38px] object-contain" />
            <span className="hidden sm:block font-display font-extrabold text-xl tracking-widest uppercase leading-none">
              AD Ceuta <b className="text-ceuta-red">Info</b>
            </span>
            <span className="font-display font-extrabold text-[11px] tracking-[0.14em] uppercase bg-ceuta-red text-white px-2 py-1 rounded-[4px]">
              Admin
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-stretch h-16 gap-1 flex-1">
            {ADMIN_NAV.map((n) => {
              const active = pathname === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => router.push(n.id)}
                  className={`relative flex items-center px-4 font-display text-[13.5px] font-bold tracking-[0.1em] uppercase transition-colors
                    ${active ? 'text-white' : 'text-white/55 hover:text-white'}`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-ceuta-red rounded-t-[3px]" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4 shrink-0 ml-auto">
            <span className="flex items-center gap-2 font-display text-[12.5px] font-semibold tracking-[0.08em] uppercase text-white/65">
              <span className="w-[7px] h-[7px] rounded-full bg-[#1E9E4B] shadow-[0_0_0_3px_rgba(30,158,75,0.25)]" />
              Sistema activo
            </span>
            <button
              onClick={() => router.push('/admin/login')}
              className="font-display text-[12px] font-bold tracking-[0.1em] uppercase text-white/70 border border-white/25 px-3.5 py-2 rounded-lg transition-all hover:border-ceuta-red hover:text-white hover:bg-ceuta-red"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-ceuta-black border-t border-white/10 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {ADMIN_NAV.map((n) => {
          const active = pathname === n.id
          return (
            <button
              key={n.id}
              onClick={() => router.push(n.id)}
              className={`flex-1 flex items-center justify-center py-4 relative font-display text-[12px] font-bold tracking-[0.08em] uppercase transition-colors
                ${active ? 'text-white' : 'text-white/55'}`}
            >
              {active && (
                <span className="absolute top-0 left-[22%] right-[22%] h-[3px] bg-ceuta-red rounded-b-[3px]" />
              )}
              {n.label}
            </button>
          )
        })}
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-[calc(58px+env(safe-area-inset-bottom))]" />
    </div>
  )
}
