'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { HomePage } from '@/features/home/HomePage'
import { HimnoPage } from '@/features/himno/HimnoPage'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useNavSlot } from '@/hooks/useNavSlot'
import { TIENDA_ICON, LIVE_ICON } from '@/components/icons/navIcons'

const PULL_THRESHOLD = 64
const PULL_MAX = 80

// Rubber-band resistance: feels natural like native iOS
function rubberBand(dy: number): number {
  return Math.min(PULL_MAX, Math.sqrt(dy) * 5.5)
}

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const refreshingRef = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = document.querySelector('.scroll-area')
    if ((scrollEl?.scrollTop ?? 0) === 0) {
      touchStartY.current = e.touches[0].clientY
      pulling.current = true
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshingRef.current) return
    const scrollEl = document.querySelector('.scroll-area')
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0 && (scrollEl?.scrollTop ?? 0) === 0) {
      setPullY(rubberBand(dy))
    } else {
      pulling.current = false
      setPullY(0)
    }
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (pullY >= PULL_THRESHOLD && !refreshingRef.current) {
      pulling.current = false
      refreshingRef.current = true
      setRefreshing(true)
      setPullY(PULL_THRESHOLD) // snap to threshold while refreshing
      await onRefresh()
      setRefreshing(false)
      refreshingRef.current = false
      setPullY(0)
    } else {
      pulling.current = false
      setPullY(0)
    }
  }, [pullY, onRefresh])

  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd }
}

type NavId = 'inicio' | 'mercado' | 'clasificacion' | 'partidos' | 'club'
type Modal = 'himno' | null

const navItems: { id: NavId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'mercado',
    label: 'Mercado',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    id: 'clasificacion',
    label: 'Clasificación',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
    id: 'partidos',
    label: 'Partidos',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    id: 'club',
    label: 'Club',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

const SSR_NAV: NavId[] = ['mercado', 'clasificacion', 'partidos', 'club']

function AppInner() {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [ready, setReady] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { slotHref, slotLabel, slotMode } = useNavSlot()

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1)
    await new Promise(r => setTimeout(r, 600))
  }, [])

  const { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh)

  // Safari bfcache: when restored from cache, force a full reload so React re-initialises
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  function handleNav(id: NavId) {
    if (SSR_NAV.includes(id)) router.push(`/${id}`)
  }

  return (
    <div
      id="app-root"
      className="home-shell"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {loaderVisible && <LoadingScreen fadeOut={ready} onFadeOutDone={() => setLoaderVisible(false)} />}

      {/* Modal views — slide over the main content */}
      {modal === 'himno' && (
        <>
          <div className="topbar home-topbar-mobile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/escudo.webp"
              alt="AD Ceuta"
              className="absolute left-1/2 -translate-x-1/2 w-10 h-10 object-contain"
            />
          </div>
          <div className="scroll-area">
            <HimnoPage onBack={() => setModal(null)} />
          </div>
        </>
      )}

      {/* Main app */}
      <div className={modal ? 'hidden' : 'contents'}>
        <div className="topbar home-topbar-mobile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo.webp"
            alt="AD Ceuta"
            className="absolute left-1/2 -translate-x-1/2 w-10 h-10 object-contain cursor-pointer"
            onClick={() => router.push('/')}
          />
        </div>

        {/* Pull-to-refresh indicator */}
        {(pullY > 0 || refreshing) && (
          <div
            className="absolute left-0 right-0 z-50 flex items-center justify-center bg-[var(--black)] will-change-transform"
            style={{
              top: 'var(--top-h)',
              height: PULL_MAX,
              transform: `translateY(${refreshing ? 0 : pullY - PULL_MAX}px)`,
              transition: refreshing || pullY > 0 ? 'none' : 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          >
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              style={{
                opacity: refreshing ? 1 : Math.min(pullY / PULL_THRESHOLD, 1),
                transform: refreshing ? undefined : `rotate(${Math.min(pullY / PULL_THRESHOLD, 1) * 220}deg)`,
                animation: refreshing ? 'spin 0.7s linear infinite' : undefined,
                transition: refreshing ? undefined : 'opacity 0.1s',
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        <div className="scroll-area">
          <HomePage key={refreshKey} onReady={() => setReady(true)} onOpenHimno={() => setModal('himno')} />
        </div>

        <div className="bottom-nav">
          {navItems.map((n) => {
            const isDynamic = n.id === 'mercado'
            const href = isDynamic ? slotHref : n.id
            const label = isDynamic ? slotLabel : n.label
            const icon = isDynamic && slotMode === 'tienda' ? TIENDA_ICON : n.icon
            return (
              <button
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
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense>
      <AppInner />
    </Suspense>
  )
}
