'use client'

import { useState, useCallback, useMemo } from 'react'
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

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all',       label: 'Todas'      },
  { id: 'queued',    label: 'En cola'    },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'published', label: 'Publicadas' },
]

function HideIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}

function NewsRow({
  n,
  idx,
  total,
  sourceLabels,
  acting,
  actionResult,
  onAction,
  onDelete,
}: {
  n: NewsItem
  idx: number
  total: number
  sourceLabels: Record<string, string>
  acting: Record<string, string>
  actionResult: Record<string, string>
  onAction: (id: string, action: 'send' | 'publish' | 'discard') => void
  onDelete: (id: string) => void
}) {
  const busy = acting[n.id]
  const result = actionResult[n.id]
  const isPending = !n.published && !n.notify_queued
  const isQueued = n.notify_queued

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ceuta-bg-soft ${idx < total - 1 ? 'border-b border-ceuta-border' : ''}`}
    >
      {/* Thumb */}
      <div
        className={`w-[92px] h-[60px] rounded-lg shrink-0 relative overflow-hidden ${!n.image_url ? (isQueued ? 'bg-ceuta-gold' : isPending ? 'bg-ceuta-black' : 'bg-ceuta-bg-mid') : 'bg-ceuta-bg-mid'}`}
        style={n.image_url ? { backgroundImage: `url(${n.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
          <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-ceuta-red">
            {sourceLabels[n.source] ?? n.source}
          </span>
          {isQueued && (
            <span className="font-display text-[10px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded bg-ceuta-gold-soft text-[#8A6D00]">En cola</span>
          )}
          {!isQueued && n.published && (
            <span className="font-display text-[10px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded bg-[#E7F6EC] text-[#1E9E4B]">Publicada</span>
          )}
          {!isQueued && !n.published && (
            <span className="font-display text-[10px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded bg-ceuta-bg-mid text-ceuta-muted">Sin publicar</span>
          )}
          <span className="text-[11.5px] text-ceuta-muted">{fmtDate(n.published_at)}</span>
        </div>
        <div className="font-display font-bold text-[18px] tracking-[0.01em] uppercase text-ceuta-black leading-[1.1] truncate">
          {n.url ? (
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:text-ceuta-red transition-colors">
              {n.title}
            </a>
          ) : n.title}
        </div>
        <div className="text-[12px] text-ceuta-muted mt-0.5">
          {sourceLabels[n.source] ?? n.source}
          {n.published && !n.notify_queued && ' · Publicada en el feed'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {result ? (
          <span className="font-display text-[11px] font-bold text-ceuta-black">{result}</span>
        ) : isPending ? (
          <>
            <button type="button"
              onClick={() => onAction(n.id, 'send')}
              disabled={!!busy}
              className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-4 py-2.5 rounded-lg bg-ceuta-red text-white disabled:opacity-40 hover:bg-ceuta-red-dark transition-colors"
            >
              {busy === 'send' ? '⏳' : 'Notificar'}
            </button>
            <button type="button"
              onClick={() => onAction(n.id, 'publish')}
              disabled={!!busy}
              className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-4 py-2.5 rounded-lg border-[1.5px] border-ceuta-border text-ceuta-black bg-white hover:border-ceuta-black transition-colors disabled:opacity-40"
            >
              {busy === 'publish' ? '⏳' : 'Editar'}
            </button>
          </>
        ) : (
          <button type="button"
            onClick={() => onAction(n.id, 'publish')}
            disabled={!!busy}
            className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-4 py-2.5 rounded-lg border-[1.5px] border-ceuta-border text-ceuta-black bg-white hover:border-ceuta-black transition-colors disabled:opacity-40"
          >
            {busy === 'publish' ? '⏳' : 'Editar'}
          </button>
        )}
        <button type="button"
          onClick={() => n.published ? onAction(n.id, 'discard') : onDelete(n.id)}
          disabled={!!busy}
          className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-ceuta-border text-ceuta-muted flex items-center justify-center hover:border-ceuta-red hover:text-ceuta-red hover:bg-ceuta-red-soft transition-all disabled:opacity-40"
          title={n.published ? 'Ocultar del feed' : 'Eliminar'}
        >
          {(busy === 'delete' || busy === 'discard') ? <span className="text-[14px]">⏳</span> : <HideIcon />}
        </button>
      </div>
    </div>
  )
}

export function NoticiasClient({
  news: initialNews,
  sourceLabels,
}: {
  news: NewsItem[]
  sourceLabels: Record<string, string>
}) {
  const [news, setNews] = useState(initialNews)
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

  const counts = useMemo(() => ({
    all:       news.length,
    queued:    news.filter((n) => n.notify_queued).length,
    published: news.filter((n) => n.published && !n.notify_queued).length,
    pending:   news.filter((n) => !n.published && !n.notify_queued).length,
  }), [news])

  const filtered = useMemo(() => news.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'queued'    && n.notify_queued) ||
      (statusFilter === 'published' && n.published && !n.notify_queued) ||
      (statusFilter === 'pending'   && !n.published && !n.notify_queued)
    return matchSearch && matchStatus
  }), [news, search, statusFilter])

  function clearResult(id: string) {
    setTimeout(() => setActionResult((r) => { const next = { ...r }; delete next[id]; return next }), 3000)
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
      const msg = res.ok
        ? action === 'send'    ? `✓ Pub. y enviada (${data.sent})`
        : action === 'publish' ? '✓ Publicada'
        :                        '✓ Descartada'
        : `✗ ${data.error ?? 'Error'}`

      setActionResult((r) => ({ ...r, [id]: msg }))
      if (res.ok) {
        setNews((prev) => prev.map((n) => {
          if (n.id !== id) return n
          if (action === 'discard') return { ...n, published: false, notify_queued: false }
          return { ...n, published: true, notify_queued: false }
        }))
      }
      clearResult(id)
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
      {/* Toolbar */}
      <div className="flex items-center gap-3.5 flex-wrap py-6">
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-ceuta-border rounded-full px-4 py-2.5 flex-1 min-w-[240px] focus-within:border-ceuta-black transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-ceuta-muted shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none bg-transparent font-body text-[14px] text-ceuta-black w-full placeholder:text-[#A9A69E]"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-ceuta-muted hover:text-ceuta-black text-[16px] leading-none">×</button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button type="button"
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-display text-[12.5px] font-bold tracking-[0.08em] uppercase border-[1.5px] transition-all
                ${statusFilter === f.id
                  ? 'bg-ceuta-black text-white border-ceuta-black'
                  : 'bg-white text-ceuta-muted border-ceuta-border hover:border-ceuta-black hover:text-ceuta-black'}`}
            >
              {f.label}
              <b className={`font-extrabold opacity-70 text-[12px] ${statusFilter === f.id ? 'text-white' : 'text-ceuta-black'}`}>
                {counts[f.id]}
              </b>
            </button>
          ))}
          <button type="button"
            onClick={refresh}
            disabled={refreshing}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-display text-[12.5px] font-bold tracking-[0.08em] uppercase border-[1.5px] border-ceuta-border text-ceuta-muted bg-white hover:border-ceuta-black hover:text-ceuta-black transition-all disabled:opacity-40"
          >
            {refreshing ? '⏳' : '↻'} Actualizar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border border-ceuta-border rounded-[14px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center font-display text-[14px] text-ceuta-muted uppercase tracking-[0.08em]">
            Sin noticias que coincidan
          </div>
        ) : (
          filtered.map((n, idx) => (
            <NewsRow
              key={n.id}
              n={n}
              idx={idx}
              total={filtered.length}
              sourceLabels={sourceLabels}
              acting={acting}
              actionResult={actionResult}
              onAction={doAction}
              onDelete={deleteNews}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 pb-16 text-[13px] text-ceuta-muted">
        <span>Mostrando {filtered.length} de {news.length} noticias</span>
        <button type="button"
          onClick={refresh}
          disabled={refreshing}
          className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-4 py-2.5 rounded-lg border-[1.5px] border-ceuta-border text-ceuta-black bg-white hover:border-ceuta-black transition-colors disabled:opacity-40"
        >
          {refreshing ? '⏳' : 'Cargar más'}
        </button>
      </div>
    </div>
  )
}
