'use client'

import { useState, useEffect, useCallback } from 'react'
import { Suspense } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HomePage } from '@/features/home/HomePage'
import { HimnoPage } from '@/features/himno/HimnoPage'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { usePullToRefresh, PULL_THRESHOLD, PULL_MAX } from '@/hooks/usePullToRefresh'
import { HomeBottomNav } from '@/features/home/HomeBottomNav'

type Modal = 'himno' | null

function AppInner() {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [ready, setReady] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

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
            <Image
              src="/escudo.webp"
              alt="AD Ceuta"
              width={40} height={40}
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
          <Image
            src="/escudo.webp"
            alt="AD Ceuta"
            width={40} height={40}
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

        <HomeBottomNav />
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
