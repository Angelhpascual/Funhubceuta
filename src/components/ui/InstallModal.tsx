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

  return (
    <>
      {/* Backdrop — z-[200] to sit above topbar (z-100) */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 cursor-pointer"
        onClick={dismiss}
        onTouchEnd={dismiss}
      />

      {/* Modal — bottom sheet */}
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
            <Image src="/icon-192.png" alt="FunHub Ceuta" width={44} height={44} className="rounded-[10px]" unoptimized />
            <div>
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">
                La app Caballa
              </div>
              <div className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/70">
                AD CEUTA INFO
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mb-5">
            <div
              className="font-display text-[44px] font-black uppercase leading-[0.92] tracking-[-0.01em] text-white"
            >
              CADA GOL.
              <br />
              EN TU{' '}
              <em className="not-italic text-ceuta-red">BOLSILLO.</em>
            </div>
            <p className="mt-3 font-body text-[14px] leading-[1.5] text-white/60">
              Todo sobre nuestra AD Ceuta.{' '}
              <strong className="text-white">Tú te enteras primero.</strong>
            </p>
          </div>

          {/* Feature list */}
          <div className="mb-6 flex flex-col gap-3">
            {[
              { icon: '⏱', text: 'Goles y resultado en vivo' },
              { icon: '📰', text: 'Noticias y mercado al instante' },
              { icon: '📋', text: 'Plantilla, fichajes y clasificación' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-ceuta-red/20 text-[16px]">
                  {icon}
                </div>
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/80">
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-5 h-px bg-white/10" />

          {/* Platform-specific instructions */}
          {platform === 'ios' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  Instálala en Safari
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  2 pasos
                </span>
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
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  Instálala en Chrome
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  {deferredPrompt ? '1 toque' : '2 pasos'}
                </span>
              </div>
              {deferredPrompt ? (
                <button
                  onClick={handleAndroidInstall}
                  disabled={installing}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-ceuta-red py-4 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(218,26,34,0.4)] disabled:opacity-60"
                >
                  {installing ? '...' : <><span className="text-[18px]">⬇</span> Añadir a pantalla de inicio</>}
                </button>
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

          {platform === 'desktop' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  Instálala en tu ordenador
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  {deferredPrompt ? '1 clic' : '2 pasos'}
                </span>
              </div>
              {deferredPrompt ? (
                <button
                  onClick={handleAndroidInstall}
                  disabled={installing}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-ceuta-red py-4 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(218,26,34,0.4)] disabled:opacity-60"
                >
                  {installing ? '...' : <><span className="text-[18px]">⬇</span> Instalar app</>}
                </button>
              ) : (
                <div className="flex flex-col gap-3 rounded-[16px] bg-white/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">1</div>
                    <p className="font-body text-[14px] leading-[1.45] text-white/80">
                      Busca el icono <span className="inline-flex items-center rounded-[4px] bg-white/15 px-1.5 py-0.5 font-display text-[11px] font-bold text-white">⊕</span> en la barra de direcciones del navegador
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
              <p className="mt-4 text-center font-body text-[12px] text-white/40">Funciona sin conexión. Acceso directo desde el escritorio.</p>
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
