'use client'
import { SOURCE_LABELS } from '@/lib/constants'
import { supabase } from '@/infrastructure/supabase/client'
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

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/notify-queue')
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('notif-queue-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news', filter: 'notify_queued=eq.true' },
        () => { load() }
      )
      .subscribe()

    // 5s fallback polling in case Realtime is not enabled on this table
    const interval = setInterval(load, 5_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [load])

  async function act(id: string, action: 'send' | 'publish' | 'notify' | 'discard') {
    setBusy(id)
    const res = await fetch('/api/admin/notify-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const data = await res.json()
    if (res.ok) {
      const msg =
        action === 'send'    ? `✓ Publicada y enviada a ${data.sent} suscriptores` :
        action === 'notify'  ? `✓ Notificada a ${data.sent} suscriptores`          :
        action === 'publish' ? '✓ Publicada en noticias'                           :
                               '✓ Descartada'
      setFeedback((f) => ({ ...f, [id]: msg }))
      setTimeout(() => setItems((prev) => prev.filter((a) => a.id !== id)), 1200)
    } else {
      setFeedback((f) => ({ ...f, [id]: `✗ ${data.error}` }))
    }
    setBusy(null)
  }

  if (loading) return null
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-[10px]">
        📬 Notificaciones pendientes — {items.length}
      </p>

      <div className="flex flex-col gap-[10px]">
        {items.map((article) => (
          <div
            key={article.id}
            className="bg-white border-2 border-ceuta-red rounded-[16px] overflow-hidden"
          >
            <div className="flex gap-[10px] p-3">
              {article.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.image_url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-[10px] shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-ceuta-red uppercase mb-[3px]">
                  {SOURCE_LABELS[article.source] ?? article.source}
                </p>
                <p className="text-[13px] font-bold text-ceuta-black leading-[1.3]">
                  {article.title}
                </p>
              </div>
            </div>

            {feedback[article.id] ? (
              <p className="text-[12px] font-semibold text-center text-ceuta-black px-3 py-[10px]">
                {feedback[article.id]}
              </p>
            ) : (
              <div className="grid grid-cols-2 border-t border-ceuta-border">
                <button
                  onClick={() => act(article.id, 'discard')}
                  disabled={busy === article.id}
                  className="py-[11px] text-[11px] font-bold text-ceuta-muted border-r border-b border-ceuta-border disabled:opacity-50"
                >
                  Descartar
                </button>
                <button
                  onClick={() => act(article.id, 'publish')}
                  disabled={busy === article.id}
                  className="py-[11px] text-[11px] font-bold text-ceuta-black border-b border-ceuta-border disabled:opacity-50"
                >
                  {busy === article.id ? '⏳' : '📰 Solo publicar'}
                </button>
                <button
                  onClick={() => act(article.id, 'notify')}
                  disabled={busy === article.id}
                  className="py-[11px] text-[11px] font-bold text-ceuta-black border-r border-ceuta-border disabled:opacity-50"
                >
                  {busy === article.id ? '⏳' : '🔔 Solo notificar'}
                </button>
                <button
                  onClick={() => act(article.id, 'send')}
                  disabled={busy === article.id}
                  className="py-[11px] text-[11px] font-bold bg-ceuta-red text-white disabled:opacity-50"
                >
                  {busy === article.id ? '⏳' : '🔔📰 Pub. y notif.'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
