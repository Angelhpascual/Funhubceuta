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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news', filter: 'notify_queued=eq.true' }, () => load())
      .subscribe()

    const interval = setInterval(load, 30_000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
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
        action === 'notify'  ? `✓ Notificada a ${data.sent} suscriptores` :
        action === 'publish' ? '✓ Publicada en noticias' : '✓ Descartada'
      setFeedback(f => ({ ...f, [id]: msg }))
      setTimeout(() => setItems(prev => prev.filter(a => a.id !== id)), 1200)
    } else {
      setFeedback(f => ({ ...f, [id]: `✗ ${data.error}` }))
    }
    setBusy(null)
  }

  if (loading || items.length === 0) return null

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-ceuta-red animate-pulse shrink-0" />
        <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-ceuta-red">
          Cola de notificaciones
        </span>
        <span className="font-display text-[11px] font-bold text-ceuta-black bg-ceuta-red/10 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {items.map(article => (
        <div key={article.id} className="bg-white rounded-[14px] border-2 border-ceuta-red overflow-hidden">
          {/* Article info */}
          <div className="flex gap-3 p-3.5">
            {article.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.image_url} alt="" className="w-[72px] h-[56px] object-cover rounded-xl shrink-0" />
            ) : (
              <div className="w-[72px] h-[56px] rounded-xl bg-ceuta-bg-mid shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-ceuta-red mb-1">
                {SOURCE_LABELS[article.source] ?? article.source}
              </div>
              <div className="font-display font-bold text-[14px] uppercase leading-tight text-ceuta-black line-clamp-2">
                {article.title}
              </div>
            </div>
          </div>

          {/* Actions / feedback */}
          {feedback[article.id] ? (
            <div className="px-4 py-3 border-t border-ceuta-border">
              <span className="font-display text-[12px] font-bold text-ceuta-black">{feedback[article.id]}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 border-t border-ceuta-border">
              <button
                onClick={() => act(article.id, 'discard')}
                disabled={busy === article.id}
                className="py-3 font-display text-[11px] font-bold tracking-[0.08em] uppercase text-ceuta-muted border-r border-ceuta-border hover:bg-ceuta-bg-soft transition-colors disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                onClick={() => act(article.id, 'publish')}
                disabled={busy === article.id}
                className="py-3 font-display text-[11px] font-bold tracking-[0.08em] uppercase text-ceuta-black hover:bg-ceuta-bg-soft transition-colors disabled:opacity-40"
              >
                {busy === article.id ? '⏳' : 'Solo publicar'}
              </button>
              <button
                onClick={() => act(article.id, 'notify')}
                disabled={busy === article.id}
                className="py-3 font-display text-[11px] font-bold tracking-[0.08em] uppercase text-ceuta-black border-r border-t border-ceuta-border hover:bg-ceuta-bg-soft transition-colors disabled:opacity-40"
              >
                {busy === article.id ? '⏳' : 'Solo notificar'}
              </button>
              <button
                onClick={() => act(article.id, 'send')}
                disabled={busy === article.id}
                className="py-3 font-display text-[11px] font-bold tracking-[0.08em] uppercase border-t border-ceuta-border bg-ceuta-red text-white hover:bg-ceuta-red-dark transition-colors disabled:opacity-40"
              >
                {busy === article.id ? '⏳' : 'Pub. y notificar'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
