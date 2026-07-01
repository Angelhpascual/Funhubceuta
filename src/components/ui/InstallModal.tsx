'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Platform = 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
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
  const [platform, setPlatform] = useState<Platform>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const forceShow = new URLSearchParams(window.location.search).get('install') === '1'
    const show = shouldShow()
    const p = detectPlatform()
    console.log('[InstallModal]', { forceShow, show, p, standalone: isStandalone(), ua: navigator.userAgent.slice(0, 80) })
    if (!show) return
    if (p === 'other' && !forceShow) return
    setPlatform(p === 'other' ? 'android' : p)
    setVisible(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
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
      {/* Backdrop — cursor:pointer needed for iOS Safari to fire onClick */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 cursor-pointer"
        onClick={dismiss}
      />

      {/* Modal — bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] max-h-[92dvh] overflow-y-auto rounded-t-[24px] bg-ceuta-black" onClick={e => e.stopPropagation()}>
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
                La app del ceutí
              </div>
              <div className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white/70">
                FunHub · AD Ceuta FC
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
              { icon: '📋', text: 'Fichajes y mercado al instante' },
              { icon: '📅', text: 'Día de partido, sin perdértelo' },
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
          {platform === 'ios' ? (
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
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">
                    1
                  </div>
                  <p className="font-body text-[14px] leading-[1.45] text-white/80">
                    Pulsa el icono{' '}
                    <span className="inline-block rounded-[4px] bg-white/15 px-1.5 py-0.5 font-display text-[12px] font-bold text-white">
                      ⎋ Compartir
                    </span>{' '}
                    abajo en Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ceuta-red font-display text-[11px] font-black text-white">
                    2
                  </div>
                  <p className="font-body text-[14px] leading-[1.45] text-white/80">
                    Elige{' '}
                    <strong className="text-white">«Añadir a pantalla de inicio»</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-ceuta-red">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em]">
                  Búscalo aquí abajo
                </span>
                <span className="text-[14px]">↓</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  Añádela a tu móvil
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  1 toque
                </span>
              </div>

              <button
                onClick={handleAndroidInstall}
                disabled={installing || !deferredPrompt}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-ceuta-red py-4 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_20px_rgba(218,26,34,0.4)] disabled:opacity-60"
              >
                {installing ? (
                  '...'
                ) : (
                  <>
                    <span className="text-[18px]">⬇</span>
                    Añadir a pantalla de inicio
                  </>
                )}
              </button>

              {!deferredPrompt && (
                <div className="mt-3 rounded-[10px] bg-white/8 p-3">
                  <p className="font-body text-[12px] leading-[1.45] text-white/60">
                    Si no aparece el botón: pulsa{' '}
                    <strong className="text-white">⋮</strong> en Chrome →{' '}
                    <strong className="text-white">Añadir a pantalla de inicio</strong>
                  </p>
                </div>
              )}

              <p className="mt-3 text-center font-body text-[12px] text-white/40">
                Se instala en segundos. No ocupa espacio ni necesita la Play Store.
              </p>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="mt-5 w-full py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/30"
          >
            Ahora no
          </button>
        </div>
      </div>
    </>
  )
}
