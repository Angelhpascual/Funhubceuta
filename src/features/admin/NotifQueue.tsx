'use client'
import { SOURCE_LABELS } from '@/lib/constants'

import { useEffect, useState, useCallback } from 'react'

interface QueuedArticle {
  id: string
  title: string
  source: string
  image_url: string | null
  published_at: string | null
  url: string
}


export function NotifQueue() {
  const [items, setItems] = useState<QueuedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    const res = await fetch('/api/admin/notify-queue')
    const data = await res.json()
    setItems(data.items ?? [])
    if (showSpinner) setLoading(false)
  }, [])

  useEffect(() => { load(true) }, [load])

  async function act(id: string, action: 'send' | 'discard') {
    setBusy(id)
    const res = await fetch('/api/admin/notify-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const data = await res.json()
    if (res.ok) {
      setFeedback((f) => ({
        ...f,
        [id]: action === 'send' ? `✓ Enviada a ${data.sent} suscriptores` : '✓ Descartada',
      }))
      setTimeout(() => load(), 1200)
    } else {
      setFeedback((f) => ({ ...f, [id]: `✗ ${data.error}` }))
    }
    setBusy(null)
  }

  if (loading) return null
  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', margin: 0 }}>
          📬 Notificaciones pendientes — {items.length}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((article) => (
          <div
            key={article.id}
            style={{
              background: 'var(--white)',
              border: '2px solid var(--red)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', gap: 10, padding: 12 }}>
              {article.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.image_url}
                  alt=""
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', margin: '0 0 3px' }}>
                  {SOURCE_LABELS[article.source] ?? article.source}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', margin: 0, lineHeight: 1.3 }}>
                  {article.title}
                </p>
              </div>
            </div>

            {feedback[article.id] ? (
              <p style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '10px 12px', margin: 0, color: 'var(--black)' }}>
                {feedback[article.id]}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => act(article.id, 'discard')}
                  disabled={busy === article.id}
                  style={{
                    background: 'none', border: 'none', borderRight: '1px solid var(--border)',
                    padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  Descartar
                </button>
                <button
                  onClick={() => act(article.id, 'send')}
                  disabled={busy === article.id}
                  style={{
                    background: 'var(--red)', border: 'none',
                    padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    color: 'var(--white)',
                  }}
                >
                  {busy === article.id ? '⏳' : '🔔 Enviar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
