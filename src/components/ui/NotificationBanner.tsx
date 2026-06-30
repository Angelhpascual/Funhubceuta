'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationBanner() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (subscribed || dismissed || permission === 'denied' || permission === 'unsupported') return null

  const handleActivate = async () => {
    setError(null)
    setLoading(true)
    const result = await subscribe()
    if (!result.ok) setError(result.error ?? 'Error desconocido')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .notif-banner {
          margin: 12px 12px 0;
          padding: 14px 16px;
          background: var(--black);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .notif-banner-stripe {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px);
          pointer-events: none;
        }
        .notif-banner-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--red);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          font-size: 18px;
        }
        .notif-banner-text {
          flex: 1;
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .notif-banner-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          color: var(--white);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .notif-banner-sub {
          font-family: var(--font-body);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
          line-height: 1.4;
        }
        .notif-banner-sub.error {
          color: #ff6b6b;
        }
        .notif-banner-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .notif-btn-activate {
          background: var(--red);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 7px 14px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .notif-btn-activate:disabled { opacity: 0.6; cursor: default; }
        .notif-btn-dismiss {
          background: none;
          color: rgba(255,255,255,0.3);
          border: none;
          font-family: var(--font-display);
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          text-align: center;
          padding: 2px 0;
        }

        @media (min-width: 768px) {
          .notif-banner {
            margin: 24px 12px 0;
            padding: 16px 24px;
            border-radius: 12px;
            gap: 16px;
          }
          .notif-banner-title { font-size: 15px; }
          .notif-banner-sub { font-size: 13px; }
          .notif-banner-actions { flex-direction: row; align-items: center; gap: 8px; }
          .notif-btn-activate { padding: 9px 20px; font-size: 12px; }
          .notif-btn-dismiss { font-size: 11px; }
        }
      `}</style>

      <div className="notif-banner">
        <div className="notif-banner-stripe" />
        <div className="notif-banner-icon">🔔</div>
        <div className="notif-banner-text">
          <div className="notif-banner-title">Alertas en directo</div>
          <div className={`notif-banner-sub${error ? ' error' : ''}`}>
            {error ?? 'Goles, noticias, tarjetas rojas y resultado final'}
          </div>
        </div>
        <div className="notif-banner-actions">
          <button className="notif-btn-activate" onClick={handleActivate} disabled={loading}>
            {loading ? '...' : 'Activar'}
          </button>
          <button className="notif-btn-dismiss" onClick={() => setDismissed(true)}>
            Ahora no
          </button>
        </div>
      </div>
    </>
  )
}
