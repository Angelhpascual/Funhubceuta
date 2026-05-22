'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationBanner() {
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications()

  if (permission === 'unsupported' || permission === 'denied') return null
  if (subscribed) return null // Ya suscrito — no mostramos nada

  return (
    <div style={{
      margin: '12px 12px 0',
      padding: '14px 16px',
      background: 'var(--black)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fondo diagonal */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)',
        pointerEvents: 'none',
      }} />

      {/* Icono */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', zIndex: 1,
        fontSize: 18,
      }}>
        🔔
      </div>

      {/* Texto */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
          color: 'var(--white)', letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          Alertas de goles
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'rgba(255,255,255,0.5)', marginTop: 2,
        }}>
          Recibe notificaciones de goles y tarjetas
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={subscribe}
        style={{
          flexShrink: 0, position: 'relative', zIndex: 1,
          background: 'var(--red)', color: 'white',
          border: 'none', borderRadius: 6,
          padding: '8px 14px',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Activar
      </button>
    </div>
  )
}
