'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'idle' | 'loading' | 'ok' | 'error'

function useAction() {
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [results, setResults] = useState<Record<string, string>>({})

  async function trigger(key: string, action: string, payload?: unknown) {
    setStatus((s) => ({ ...s, [key]: 'loading' }))
    try {
      const res = await fetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      const info = data.result?.sent != null
        ? `${data.result.sent} enviadas`
        : data.result?.newArticles != null
          ? `${data.result.newArticles} nuevas`
          : data.result?.count != null
            ? `${data.result.count} partidos`
            : 'OK'
      setResults((r) => ({ ...r, [key]: info }))
      setStatus((s) => ({ ...s, [key]: 'ok' }))
    } catch (e) {
      setResults((r) => ({ ...r, [key]: (e as Error).message }))
      setStatus((s) => ({ ...s, [key]: 'error' }))
    }
    setTimeout(() => setStatus((s) => ({ ...s, [key]: 'idle' })), 4000)
  }

  return { status, results, trigger }
}

const TEST_NOTIFICATIONS = [
  {
    key: 'n-kickoff',
    label: 'Saque inicial',
    emoji: '⚽',
    payload: {
      title: '⚽ ¡Arranca el partido, caballas!',
      body: 'AD Ceuta vs Albacete. 90 minutos de corazón blanquinegro. ¡Vamos! 🖤⚪',
      tag: 'kickoff',
      url: '/partidos',
    },
  },
  {
    key: 'n-goal-ceuta',
    label: 'Gol del Ceuta',
    emoji: '🚨',
    payload: {
      title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
      body: '¡Bodiger! ¡Qué locura! Marcador: 1-0 (23) ¡VAMOS CABALLAS! 🖤⚪',
      tag: 'goal-ceuta',
      url: '/partidos',
    },
  },
  {
    key: 'n-goal-rival',
    label: 'Gol rival',
    emoji: '😤',
    payload: {
      title: '😤 Gol en contra... (1-1)',
      body: 'Nos han marcado. Pero esto no ha terminado. ¡A por ellos! 💪',
      tag: 'goal-rival',
      url: '/partidos',
    },
  },
  {
    key: 'n-red-ceuta',
    label: 'Roja Ceuta',
    emoji: '🟥',
    payload: {
      title: '🟥 Nos quedamos con 10...',
      body: 'Roja para Manu Sánchez en el 55. ¡El Ceuta no se rinde! 🖤⚪',
      tag: 'red-ceuta',
      url: '/partidos',
    },
  },
  {
    key: 'n-red-rival',
    label: 'Roja rival',
    emoji: '🟥',
    payload: {
      title: '🟥 ¡Roja para el rival!',
      body: 'Expulsado Torres (67). ¡Con uno más, a aprovechar! 💪🔥',
      tag: 'red-rival',
      url: '/partidos',
    },
  },
  {
    key: 'n-win',
    label: 'Victoria',
    emoji: '🏆',
    payload: {
      title: '🏆 ¡¡VICTORIA CABALLAS!! (2-1)',
      body: '¡Lo hemos conseguido! Tres puntos de oro. ¡Gracias por estar siempre con nosotros! 🖤⚪🔥',
      tag: 'win',
      url: '/partidos',
    },
  },
  {
    key: 'n-loss',
    label: 'Derrota',
    emoji: '😔',
    payload: {
      title: '😔 Derrota... pero seguimos juntos (0-1)',
      body: 'No era el día. Esto es el fútbol. El Ceuta siempre se levanta. 🖤⚪',
      tag: 'loss',
      url: '/partidos',
    },
  },
  {
    key: 'n-draw',
    label: 'Empate',
    emoji: '🤝',
    payload: {
      title: '🤝 Empate final (1-1)',
      body: 'Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas! 🖤⚪',
      tag: 'draw',
      url: '/partidos',
    },
  },
  {
    key: 'n-matchday',
    label: 'Día de partido',
    emoji: '📅',
    payload: {
      title: '📅 ¡Hoy jugamos, caballas!',
      body: 'AD Ceuta vs Albacete a las 18:00. 🏠 En casa. ¡A por los tres puntos! 🖤⚪',
      tag: 'match-day',
      url: '/partidos',
    },
  },
]

function ActionBtn({
  label,
  emoji,
  status,
  result,
  onClick,
  color = 'black',
}: {
  label: string
  emoji: string
  status: Status
  result?: string
  onClick: () => void
  color?: 'black' | 'red' | 'gray'
}) {
  const bg =
    status === 'ok'
      ? '#166534'
      : status === 'error'
        ? 'var(--red)'
        : color === 'red'
          ? 'var(--red)'
          : color === 'gray'
            ? 'var(--bg-mid)'
            : 'var(--black)'
  const textColor = color === 'gray' && status === 'idle' ? 'var(--black)' : 'var(--white)'

  return (
    <button
      onClick={onClick}
      disabled={status === 'loading'}
      style={{
        background: bg,
        color: textColor,
        border: 'none',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 13,
        fontWeight: 700,
        cursor: status === 'loading' ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        textAlign: 'left',
        opacity: status === 'loading' ? 0.6 : 1,
        transition: 'background 0.2s',
      }}
    >
      <span style={{ fontSize: 18 }}>{status === 'loading' ? '⏳' : emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
      {result && status !== 'idle' && (
        <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>{result}</span>
      )}
    </button>
  )
}

export function AdminActions() {
  const router = useRouter()
  const { status, results, trigger } = useAction()
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [migrateStatus, setMigrateStatus] = useState<Status>('idle')
  const [migrateResult, setMigrateResult] = useState('')

  async function triggerMigrateImages() {
    setMigrateStatus('loading')
    try {
      const res = await fetch('/api/admin/migrate-images', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setMigrateResult(`${data.migrated} migradas, ${data.failed} fallidas / ${data.total} total`)
      setMigrateStatus('ok')
    } catch (e) {
      setMigrateResult((e as Error).message)
      setMigrateStatus('error')
    }
    setTimeout(() => setMigrateStatus('idle'), 8000)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const C = {
    muted: 'var(--muted)',
    border: 'var(--border)',
    bgSoft: 'var(--bg-soft)',
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <style>{`
        .admin-section { margin-bottom: 20px; }
        .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .admin-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .admin-sec-title {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--muted); margin-bottom: 10px;
        }
      `}</style>

      {/* Crons */}
      <div className="admin-section">
        <div className="admin-sec-title">Sincronización de datos</div>
        <div className="admin-grid">
          <ActionBtn
            emoji="📰"
            label="Sync noticias"
            status={status['news'] ?? 'idle'}
            result={results['news']}
            onClick={() => trigger('news', 'news')}
          />
          <ActionBtn
            emoji="⚽"
            label="Sync partidos"
            status={status['matches'] ?? 'idle'}
            result={results['matches']}
            onClick={() => trigger('matches', 'matches')}
          />
        </div>
      </div>

      {/* Match day push */}
      <div className="admin-section">
        <div className="admin-sec-title">Notificación día de partido</div>
        <div className="admin-grid">
          <ActionBtn
            emoji="📅"
            label="Enviar alerta hoy"
            color="red"
            status={status['match-day'] ?? 'idle'}
            result={results['match-day']}
            onClick={() => trigger('match-day', 'match-day')}
          />
        </div>
      </div>

      {/* Mantenimiento */}
      <div className="admin-section">
        <div className="admin-sec-title">Mantenimiento</div>
        <div className="admin-grid">
          <ActionBtn
            emoji="🖼️"
            label="Migrar fotos noticias"
            color="red"
            status={migrateStatus}
            result={migrateResult}
            onClick={triggerMigrateImages}
          />
        </div>
      </div>

      {/* Test notifications */}
      <div className="admin-section">
        <div className="admin-sec-title">Notificaciones de prueba</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {TEST_NOTIFICATIONS.map((n) => (
            <ActionBtn
              key={n.key}
              emoji={n.emoji}
              label={n.label}
              color="gray"
              status={status[n.key] ?? 'idle'}
              result={results[n.key]}
              onClick={() => trigger(n.key, 'push', n.payload)}
            />
          ))}
        </div>
      </div>

      {/* Logout */}
      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          style={{
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: C.muted,
            cursor: 'pointer',
          }}
        >
          {logoutLoading ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}
