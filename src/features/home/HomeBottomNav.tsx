'use client'

import { useRouter } from 'next/navigation'
import { TIENDA_ICON, LIVE_ICON, HOME_ICON, SHOP_ICON, TABLE_ICON, MATCHES_ICON, CLUB_ICON } from '@/components/icons/navIcons'
import { useNavSlot } from '@/hooks/useNavSlot'

type NavId = 'inicio' | 'mercado' | 'clasificacion' | 'partidos' | 'club'

const navItems: { id: NavId; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio',        label: 'Inicio',        icon: HOME_ICON },
  { id: 'mercado',       label: 'Mercado',       icon: SHOP_ICON },
  { id: 'clasificacion', label: 'Clasificación', icon: TABLE_ICON },
  { id: 'partidos',      label: 'Partidos',      icon: MATCHES_ICON },
  { id: 'club',          label: 'Club',          icon: CLUB_ICON },
]

const SSR_NAV: NavId[] = ['mercado', 'clasificacion', 'partidos', 'club']

export function HomeBottomNav() {
  const router = useRouter()
  const { slotHref, slotLabel, slotMode } = useNavSlot()

  function handleNav(id: NavId) {
    if (SSR_NAV.includes(id)) router.push(`/${id}`)
  }

  return (
    <div className="bottom-nav">
      {navItems.map((n) => {
        const isDynamic = n.id === 'mercado'
        const href = isDynamic ? slotHref : n.id
        const label = isDynamic ? slotLabel : n.label
        const icon = isDynamic && slotMode === 'tienda' ? TIENDA_ICON : n.icon
        return (
          <button
            type="button"
            key={n.id}
            className={`nav-item ${n.id === 'inicio' ? 'active' : ''} ${isDynamic && slotMode === 'live' ? 'text-[var(--red)]' : ''}`}
            onClick={() => isDynamic ? router.push(href) : handleNav(n.id)}
          >
            {isDynamic && slotMode === 'live' ? (
              <span className="relative">
                {LIVE_ICON}
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
  )
}
