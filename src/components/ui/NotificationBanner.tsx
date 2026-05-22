'use client'

import { useEffect, useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

function useIsIos() {
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches
    setIsIos(ios)
    setIsStandalone(standalone)
  }, [])
  return { isIos, isStandalone }
}

export function NotificationBanner() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const { isIos, isStandalone } = useIsIos()
  const [dismissed, setDismissed] = useState(false)

  // Already subscribed — hide banner
  if (subscribed || dismissed) return null

  // iOS sin instalar como PWA — pide instalar primero
  if (isIos && !isStandalone) {
    return (
      <Banner
        icon="📲"
        title="Instala la app"
        subtitle='Safari → Compartir → "Añadir a inicio" para recibir alertas de goles'
        actionLabel="Entendido"
        onAction={() => setDismissed(true)}
        onDismiss={() => setDismissed(true)}
        accent="var(--gold)"
      />
    )
  }

  // Navegador no soporta push
  if (permission === 'unsupported') return null

  // Usuario ya denegó — no molestar
  if (permission === 'denied') return null

  // Caso normal — pedir permiso
  return (
    <Banner
      icon="🔔"
      title="Alertas de goles"
      subtitle="Recibe notificaciones de goles y tarjetas rojas"
      actionLabel="Activar"
      onAction={subscribe}
      onDismiss={() => setDismissed(true)}
      accent="var(--red)"
    />
  )
}

function Banner({
  icon, title, subtitle, actionLabel, onAction, onDismiss, accent,
}: {
  icon: string
  title: string
  subtitle: string
  actionLabel: string
  onAction: () => void
  onDismiss: () => void
  accent: string
}) {
  return (
    <div style={{
      margin: '12px 12px 0',
      padding: '14px 16px',
      background: 'var(--black)',
      borderRadius: 'var(--radius)',
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', zIndex: 1, fontSize: 18,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--white)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.4 }}>
          {subtitle}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: 1 }}>
        <button
          onClick={onAction}
          style={{
            background: accent, color: 'white', border: 'none', borderRadius: 6,
            padding: '7px 12px', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {actionLabel}
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'none', color: 'rgba(255,255,255,0.3)', border: 'none',
            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center',
          }}
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
