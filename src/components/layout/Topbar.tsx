'use client'

import { useRouter, usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/components/layout/nav.config'
import { TIENDA_ICON, LIVE_ICON } from '@/components/icons/navIcons'
import { useNavSlot } from '@/hooks/useNavSlot'

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { liveActive, slotHref, slotLabel, slotMode } = useNavSlot()

  return (
    <div className="topbar">
      {/* Desktop: escudo + título a la izquierda */}
      <div className="topbar-logo cursor-pointer desktop-only" onClick={() => router.push('/')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta" className="w-10 h-10 object-contain" />
        <span className="topbar-title">AD CEUTA <b>INFO</b></span>
      </div>
      {/* Móvil: escudo centrado absolutamente — immune a justify-content del padre */}
      <div
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer mobile-only"
        onClick={() => router.push('/')}
      >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta" className="w-10 h-10 object-contain" />
      </div>
      <nav className="top-nav desktop-only">
        {NAV_ITEMS.map((n) => {
          const isDynamicSlot = n.id === '/mercado'
          const isLiveTab = isDynamicSlot && liveActive
          const href = isDynamicSlot ? slotHref : n.id
          const label = isDynamicSlot ? slotLabel : n.label
          const icon = isLiveTab ? LIVE_ICON : isDynamicSlot && slotMode === 'tienda' ? TIENDA_ICON : n.icon
          return (
            <button type="button"
              key={n.id}
              className={`top-nav-item ${pathname === href ? 'active' : ''} ${isLiveTab ? 'text-[var(--red)]' : ''}`}
              onClick={() => router.push(href)}
            >
              {icon}
              <span suppressHydrationWarning>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
