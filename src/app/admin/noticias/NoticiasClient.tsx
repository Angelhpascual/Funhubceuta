'use client'

import { useState, useCallback } from 'react'
import { fmtDate } from '@/lib/formatters'

type NewsItem = {
  id: string
  title: string
  source: string
  published_at: string | null
  image_url: string | null
  url: string | null
  published: boolean
  notify_queued: boolean
}

type StatusFilter = 'all' | 'queued' | 'published' | 'pending'

const SOURCE_COLORS: Record<string, string> = {
  oficial: 'bg-ceuta-red text-white',
  faro: 'bg-blue-100 text-blue-800',
  elpueblo: 'bg-orange-100 text-orange-800',
  ceutadeportiva: 'bg-green-100 text-green-800',
  marca: 'bg-purple-100 text-purple-800',
  mundodeportivo: 'bg-yellow-100 text-yellow-800',
}

function StatusBadge({ item }: { item: NewsItem }) {
  if (item.notify_queued)
    return <span className="text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">En cola</span>
  if (item.published)
    return <span className="text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Publicada</span>
  return <span className="text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full bg-ceuta-bg-mid text-ceuta-muted">Pendiente</span>
}

export function NoticiasClient({
  news: initialNews,
  sourceLabels,
}: {
  news: NewsItem[]
  sourceLabels: Record<string, string>
}) {
  const [news, setNews] = useState(initialNews)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [acting, setActing] = useState<Record<string, string>>({})
  const [actionResult, setActionResult] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/news')
      if (res.ok) {
        const data = await res.json()
        setNews(data.items ?? [])
      }
    } finally {
      setRefreshing(false)
    }
  }, [])

  const sources = [...new Set(initialNews.map((n) => n.source))].sort()

  const filtered = news.filter((n) => {
    const matchSource = sourceFilter === 'all' || n.source === sourceFilter
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'queued' && n.notify_queued) ||
      (statusFilter === 'published' && n.published && !n.notify_queued) ||
      (statusFilter === 'pending' && !n.published && !n.notify_queued)
    return matchSource && matchSearch && matchStatus
  })

  const counts = {
    queued: news.filter((n) => n.notify_queued).length,
    published: news.filter((n) => n.published && !n.notify_queued).length,
    pending: news.filter((n) => !n.published && !n.notify_queued).length,
  }

  async function doAction(id: string, action: 'send' | 'publish' | 'discard') {
    setActing((s) => ({ ...s, [id]: action }))
    try {
      const res = await fetch('/api/admin/notify-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (res.ok) {
        const msg =
          action === 'send' ? `✓ Pub. y enviada (${data.sent})` :
          action === 'publish' ? '✓ Publicada' :
          '✓ Descartada'
        setActionResult((r) => ({ ...r, [id]: msg }))
        setNews((prev) => prev.map((n) => {
          if (n.id !== id) return n
          if (action === 'discard') return { ...n, published: false, notify_queued: false }
          if (action === 'publish') return { ...n, published: true, notify_queued: false }
          return { ...n, published: true, notify_queued: false }
        }))
        setTimeout(() => setActionResult((r) => { const next = { ...r }; delete next[id]; return next }), 3000)
      } else {
        setActionResult((r) => ({ ...r, [id]: `✗ ${data.error ?? 'Error'}` }))
        setTimeout(() => setActionResult((r) => { const next = { ...r }; delete next[id]; return next }), 3000)
      }
    } finally {
      setActing((s) => { const next = { ...s }; delete next[id]; return next })
    }
  }

  async function deleteNews(id: string) {
    if (!confirm('¿Borrar esta noticia permanentemente?')) return
    setActing((s) => ({ ...s, [id]: 'delete' }))
    try {
      const res = await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Error al borrar')
      setNews((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setActing((s) => { const next = { ...s }; delete next[id]; return next })
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none"
        >
          <option value="all">Todas las fuentes</option>
          {sources.map((s) => (
            <option key={s} value={s}>{sourceLabels[s] ?? s}</option>
          ))}
        </select>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] text-ceuta-black disabled:opacity-50 transition-opacity"
        >
          {refreshing ? '⏳' : '↻'}
        </button>
      </div>

      {/* Filtro de estado */}
      <div className="flex gap-2 flex-wrap mb-4">
        {([
          { id: 'all', label: 'Todas', count: news.length },
          { id: 'queued', label: '📬 En cola', count: counts.queued },
          { id: 'pending', label: '⏳ Pendiente', count: counts.pending },
          { id: 'published', label: '✅ Publicadas', count: counts.published },
        ] as { id: StatusFilter; label: string; count: number }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.06em] border transition-colors ${
              statusFilter === f.id
                ? 'bg-ceuta-black text-white border-ceuta-black'
                : 'bg-ceuta-bg-soft text-ceuta-muted border-ceuta-border'
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-ceuta-bg-mid text-ceuta-black'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-ceuta-muted mb-3">{filtered.length} artículos</p>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((n) => {
          const busy = acting[n.id]
          const result = actionResult[n.id]
          return (
            <div key={n.id} className="bg-ceuta-bg-soft rounded-[14px] p-3 flex gap-3 items-start">
              {n.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.image_url}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${SOURCE_COLORS[n.source] ?? 'bg-ceuta-bg-mid text-ceuta-muted'}`}>
                    {sourceLabels[n.source] ?? n.source}
                  </span>
                  <StatusBadge item={n} />
                  <span className="text-[10px] text-ceuta-muted">{fmtDate(n.published_at)}</span>
                </div>
                <p className="text-[13px] font-semibold text-ceuta-black leading-tight line-clamp-2 mb-2">
                  {n.url ? (
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {n.title}
                    </a>
                  ) : n.title}
                </p>
                {result ? (
                  <span className="text-[11px] font-bold text-ceuta-black">{result}</span>
                ) : !n.published && !n.notify_queued ? (
                  /* Pendiente — mostrar acciones rápidas */
                  <div className="flex gap-2">
                    <button
                      onClick={() => doAction(n.id, 'publish')}
                      disabled={!!busy}
                      className="text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-1 rounded-lg bg-ceuta-black text-white disabled:opacity-40"
                    >
                      {busy === 'publish' ? '⏳' : 'Publicar'}
                    </button>
                    <button
                      onClick={() => doAction(n.id, 'send')}
                      disabled={!!busy}
                      className="text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-1 rounded-lg bg-ceuta-red text-white disabled:opacity-40"
                    >
                      {busy === 'send' ? '⏳' : 'Pub. + notif.'}
                    </button>
                    <button
                      onClick={() => doAction(n.id, 'discard')}
                      disabled={!!busy}
                      className="text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-1 rounded-lg border border-ceuta-border text-ceuta-muted disabled:opacity-40"
                    >
                      {busy === 'discard' ? '⏳' : 'Descartar'}
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => deleteNews(n.id)}
                disabled={!!busy}
                className="text-ceuta-muted hover:text-ceuta-red text-[16px] leading-none disabled:opacity-40 transition-colors shrink-0"
                title="Eliminar"
              >
                {busy === 'delete' ? '⏳' : '🗑'}
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-ceuta-muted text-center py-8">Sin noticias que coincidan</p>
        )}
      </div>
    </div>
  )
}
