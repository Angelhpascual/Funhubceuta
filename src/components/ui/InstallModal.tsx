'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Platform = 'ios' | 'android' | 'desktop'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).get('install') === '1') return true
  if (isStandalone()) return false
  const snoozed = localStorage.getItem('install_snoozed')
  if (snoozed && Date.now() < parseInt(snoozed)) return false
  return true
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallModal() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const forceShow = params.get('install') === '1'
    const forcePlatform = params.get('platform') as Platform | null
    const show = shouldShow()
    const p = forcePlatform ?? detectPlatform()
    console.log('[InstallModal]', { forceShow, show, p, standalone: isStandalone(), ua: navigator.userAgent.slice(0, 80) })
    if (!show) return
    setPlatform(p)
    setVisible(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setVisible(false)
  }

  function snooze() {
    localStorage.setItem('install_snoozed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
    setVisible(false)
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('install_snoozed', String(Date.now() + 365 * 24 * 60 * 60 * 1000))
      setVisible(false)
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  // Shared install button
  const InstallButton = ({ label }: { label: string }) => (
    <button
      onClick={handleAndroidInstall}
      disabled={installing}
      style={{ backgroundColor: 'var(--red)', boxShadow: '0 4px 20px rgba(218,26,34,0.4)' }}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] py-4 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white disabled:opacity-60"
    >
      <span>{installing ? '...' : label}</span>
    </button>
  )

  // Shared copy column
  const CopyColumn = () => (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Image src="/icon-192.png" alt="AD Ceuta Info" width={44} height={44} className="rounded-[10px]" unoptimized />
        <div>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">La app Caballa</div>
          <div className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/70">AD CEUTA INFO</div>
        </div>
      </div>
      <div className="font-display text-[44px] font-black uppercase leading-[0.92] tracking-[-0.01em] text-white">
        CADA GOL.<br />EN TU <em className="not-italic text-ceuta-red">BOLSILLO.</em>
      </div>
      <p className="mt-3 font-body text-[14px] leading-[1.5] text-white/60">
        Todo sobre nuestra AD Ceuta. <strong className="text-white">Tú te enteras primero.</strong>
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {[
          { icon: '⏱', text: 'Goles y resultado en vivo' },
          { icon: '📰', text: 'Noticias y mercado al instante' },
          { icon: '📋', text: 'Plantilla, fichajes y clasificación' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-ceuta-red/20 text-[16px]">{icon}</div>
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/80">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (platform === 'desktop') {
    return (
      <>
        <div className="fixed inset-0 z-[200] cursor-pointer bg-black/70" onClick={dismiss} />
        <div
          className="fixed left-1/2 top-1/2 z-[201] w-full max-w-[760px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] bg-ceuta-black shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={snooze}
            className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-white/10 font-body text-[16px] text-white/50 hover:bg-white/20"
          >
            ✕
          </button>

          <div className="grid grid-cols-2">
            {/* Left — copy */}
            <div className="p-10 pr-6">
              <CopyColumn />
            </div>

            {/* Right — install + divider */}
            <div className="flex flex-col justify-center border-l border-white/10 p-10 pl-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  Instálala ahora
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  {deferredPrompt ? '1 clic' : '2 pasos'}
                </span>
              </div>

              {deferredPrompt ? (
                <InstallButton label="⬇ Instalar app" />
              ) : (
                <div className="flex flex-col gap-4 rounded-[16px] bg-white/8 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">1</div>
                    <p className="font-body text-[14px] leading-[1.45] text-white/80">
                      Busca el icono <span className="inline-flex items-center rounded-[4px] bg-white/15 px-1.5 py-0.5 font-display text-[11px] font-bold text-white">⊕</span> en la barra de direcciones
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">2</div>
                    <p className="font-body text-[14px] leading-[1.45] text-white/80">
                      Haz clic en <strong className="text-white">«Instalar»</strong>
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-5 font-body text-[12px] text-white/40">Funciona sin conexión. Acceso directo desde el escritorio.</p>

              <button
                onClick={snooze}
                className="mt-6 w-full py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-white/50"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop — z-[200] to sit above topbar (z-100) */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 cursor-pointer"
        onClick={dismiss}
        onTouchEnd={dismiss}
      />

      {/* Modal — bottom sheet mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[201] max-h-[92dvh] overflow-y-auto rounded-t-[24px] bg-ceuta-black"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
        onTouchEnd={e => {
          e.stopPropagation()
          const delta = e.changedTouches[0].clientY - touchStartY.current
          if (delta > 60) dismiss()
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Content */}
        <div className="px-5 pt-3 pb-8">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <Image src="/icon-192.png" alt="AD Ceuta Info" width={44} height={44} className="rounded-[10px]" unoptimized />
            <div>
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">La app Caballa</div>
              <div className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/70">AD CEUTA INFO</div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mb-5">
            <div className="font-display text-[44px] font-black uppercase leading-[0.92] tracking-[-0.01em] text-white">
              CADA GOL.<br />EN TU <em className="not-italic text-ceuta-red">BOLSILLO.</em>
            </div>
            <p className="mt-3 font-body text-[14px] leading-[1.5] text-white/60">
              Todo sobre nuestra AD Ceuta. <strong className="text-white">Tú te enteras primero.</strong>
            </p>
          </div>

          {/* Feature list */}
          <div className="mb-6 flex flex-col gap-3">
            {[
              {
                // Soccer ball — circle + pentagon + 5 lines
                icon: (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, color: 'var(--red)' }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="12,8 14.5,10 13.5,13 10.5,13 9.5,10" fill="none"/>
                    <line x1="12" y1="2" x2="12" y2="8"/>
                    <line x1="20.5" y1="6.5" x2="14.5" y2="10"/>
                    <line x1="17.5" y1="19" x2="13.5" y2="13"/>
                    <line x1="6.5" y1="19" x2="10.5" y2="13"/>
                    <line x1="3.5" y1="6.5" x2="9.5" y2="10"/>
                  </svg>
                ),
                text: 'Goles y resultado en vivo',
              },
              {
                // Bell
                icon: (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, color: 'var(--red)' }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                ),
                text: 'Noticias y mercado al instante',
              },
              {
                // Trophy
                icon: (
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, color: 'var(--red)' }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H3V4h3"/>
                    <path d="M18 9h3V4h-3"/>
                    <path d="M6 4h12v7a6 6 0 0 1-12 0V4z"/>
                    <path d="M9 21h6"/>
                    <path d="M12 17v4"/>
                  </svg>
                ),
                text: 'Plantilla, fichajes y clasificación',
              },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>{icon}</div>
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/80">{text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-5 h-px bg-white/10" />

          {/* Platform-specific instructions */}
          {platform === 'ios' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">Instálala en Safari</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">2 pasos</span>
              </div>
              <div className="flex flex-col gap-3 rounded-[16px] bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">1</div>
                  <p className="font-body text-[14px] leading-[1.45] text-white/80">
                    Pulsa{' '}
                    <span className="inline-flex items-center gap-1 rounded-[4px] bg-white/15 px-1.5 py-0.5">
                      <svg width="13" height="13" viewBox="0 0 50 50" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M25 3 L15 13 L17.5 15.5 L23.5 9.5 L23.5 34 L26.5 34 L26.5 9.5 L32.5 15.5 L35 13 Z"/>
                        <path d="M10 20 L10 44 L40 44 L40 20 L34 20 L34 23 L37 23 L37 41 L13 41 L13 23 L16 23 L16 20 Z"/>
                      </svg>
                      <span className="font-display text-[11px] font-bold text-white">Compartir</span>
                    </span>{' '}
                    abajo en Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">2</div>
                  <p className="font-body text-[14px] leading-[1.45] text-white/80">
                    Elige <strong className="text-white">«Añadir a pantalla de inicio»</strong>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col items-center gap-1 text-ceuta-red">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em]">Búscalo aquí abajo</span>
                <span className="text-[18px]">↓</span>
              </div>
            </div>
          )}

          {platform === 'android' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">Instálala en Chrome</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  {deferredPrompt ? '1 toque' : '2 pasos'}
                </span>
              </div>
              {deferredPrompt ? (
                <InstallButton label="⬇ Añadir a pantalla de inicio" />
              ) : (
                <div className="flex flex-col gap-3 rounded-[16px] bg-white/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">1</div>
                    <p className="font-body text-[14px] leading-[1.45] text-white/80">
                      Pulsa <span className="inline-flex items-center rounded-[4px] bg-white/15 px-1.5 py-0.5 font-display text-[13px] font-bold text-white">⋮</span> arriba a la derecha en Chrome
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">2</div>
                    <p className="font-body text-[14px] leading-[1.45] text-white/80">
                      Elige <strong className="text-white">«Añadir a pantalla de inicio»</strong>
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-4 text-center font-body text-[12px] text-white/40">Sin Play Store. No ocupa espacio.</p>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={snooze}
            className="mt-5 w-full py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/30"
          >
            Ahora no
          </button>
        </div>
      </div>
    </>
  )
}
