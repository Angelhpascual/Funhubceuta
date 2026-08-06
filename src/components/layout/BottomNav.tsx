'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NAV_ITEMS } from '@/components/layout/nav.config'
import { TIENDA_ICON, LIVE_ICON } from '@/components/icons/navIcons'
import { useNavSlot } from '@/hooks/useNavSlot'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { liveActive, slotHref, slotLabel, slotMode } = useNavSlot()

  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map((n) => {
        const isDynamicSlot = n.id === '/mercado'
        const isLiveTab = isDynamicSlot && liveActive
        const href = isDynamicSlot ? slotHref : n.id
        const label = isDynamicSlot ? slotLabel : n.label
        const icon = isLiveTab ? LIVE_ICON : isDynamicSlot && slotMode === 'tienda' ? TIENDA_ICON : n.icon
        const isActive = pathname === href || (isDynamicSlot && pathname === slotHref)

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
            <span className="nav-label" suppressHydrationWarning>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
