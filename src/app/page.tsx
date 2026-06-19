'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { HomePage } from '@/features/home/HomePage'
import { HimnoPage } from '@/features/himno/HimnoPage'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

type Modal = 'himno' | null

const navItems: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: '/',
    label: 'Noticias',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
      </svg>
    ),
  },
  {
    href: '/mercado',
    label: 'Mercado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    href: '/club',
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

function AppInner() {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [ready, setReady] = useState(false)

  return (
    <div id="app-root" className="home-shell">
      {!ready && <LoadingScreen />}

      {/* Modal views — slide over the main content */}
      {modal === 'himno' && (
        <>
          <div className="topbar home-topbar-mobile" style={{ justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/escudo.png"
              alt="AD Ceuta"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          </div>
          <div className="scroll-area">
            <HimnoPage onBack={() => setModal(null)} />
          </div>
        </>
      )}

      {/* Main app */}
      <div style={{ display: modal ? 'none' : 'contents' }}>
        <div className="topbar home-topbar-mobile" style={{ justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo.png"
            alt="AD Ceuta"
            style={{ width: 40, height: 40, objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => router.push('/')}
          />
        </div>

        <div className="scroll-area">
          <HomePage onReady={() => setReady(true)} onOpenHimno={() => setModal('himno')} />
        </div>

        <div className="bottom-nav">
          {navItems.map((n) => (
            <button
              key={n.href}
              className={`nav-item ${n.href === '/' ? 'active' : ''}`}
              onClick={() => router.push(n.href)}
            >
              {n.icon}
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
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
