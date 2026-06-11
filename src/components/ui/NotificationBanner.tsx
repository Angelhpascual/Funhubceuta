'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationBanner() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (subscribed || dismissed || permission === 'denied') return null

  const handleActivate = async () => {
    setError(null)
    setLoading(true)
    const sw = 'serviceWorker' in navigator
    const pm = 'PushManager' in window
    const notif = 'Notification' in window
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const debug = `SW:${sw} PM:${pm} N:${notif} SA:${standalone} P:${permission}`
    const result = await subscribe()
    if (!result.ok) setError(`${result.error} [${debug}]`)
    setLoading(false)
  }

  return (
    <div
      style={{
        margin: '12px 12px 0',
        padding: '14px 16px',
        background: 'var(--black)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
          fontSize: 18,
        }}
      >
        🔔
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 14,
            color: 'var(--white)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Alertas de goles
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: error ? 'var(--red)' : 'rgba(255,255,255,0.5)',
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {error ?? 'Goles, noticias, tarjetas rojas y resultado final'}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          onClick={handleActivate}
          disabled={loading}
          style={{
            background: 'var(--red)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '7px 12px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : 'Activar'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            color: 'rgba(255,255,255,0.3)',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
