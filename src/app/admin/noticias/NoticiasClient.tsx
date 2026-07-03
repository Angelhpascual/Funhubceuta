'use client'

import { useState } from 'react'

type NewsItem = {
  id: string
  title: string
  source: string
  published_at: string | null
  image_url: string | null
  url: string | null
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
}

const SOURCE_COLORS: Record<string, string> = {
  oficial: 'bg-ceuta-red text-white',
  faro: 'bg-blue-100 text-blue-800',
  elpueblo: 'bg-orange-100 text-orange-800',
  ceutadeportiva: 'bg-green-100 text-green-800',
  marca: 'bg-purple-100 text-purple-800',
  mundodeportivo: 'bg-yellow-100 text-yellow-800',
}

export function NoticiasClient({
  news: initialNews,
  sourceLabels,
}: {
  news: NewsItem[]
  sourceLabels: Record<string, string>
}) {
  const [news, setNews] = useState(initialNews)
  const [filter, setFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [notifying, setNotifying] = useState<Set<string>>(new Set())
  const [notifResult, setNotifResult] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const sources = [...new Set(initialNews.map((n) => n.source))].sort()

  const filtered = news.filter((n) => {
    const matchSource = filter === 'all' || n.source === filter
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase())
    return matchSource && matchSearch
  })

  async function sendNotif(id: string) {
    setNotifying((s) => new Set(s).add(id))
    try {
      const res = await fetch('/api/admin/notify-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'send' }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotifResult((r) => ({ ...r, [id]: `✓ ${data.sent}` }))
        setTimeout(() => setNotifResult((r) => { const next = { ...r }; delete next[id]; return next }), 3000)
      } else {
        setNotifResult((r) => ({ ...r, [id]: `✗ ${data.error ?? 'Error'}` }))
        setTimeout(() => setNotifResult((r) => { const next = { ...r }; delete next[id]; return next }), 3000)
      }
    } catch {
      setNotifResult((r) => ({ ...r, [id]: '✗ Error' }))
    } finally {
      setNotifying((s) => { const next = new Set(s); next.delete(id); return next })
    }
  }

  async function deleteNews(id: string) {
    if (!confirm('¿Borrar esta noticia?')) return
    setDeleting((s) => new Set(s).add(id))
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
      setDeleting((s) => { const next = new Set(s); next.delete(id); return next })
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none"
        >
          <option value="all">Todas las fuentes</option>
          {sources.map((s) => (
            <option key={s} value={s}>{sourceLabels[s] ?? s}</option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-ceuta-muted mb-3">{filtered.length} artículos</p>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((n) => (
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
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${SOURCE_COLORS[n.source] ?? 'bg-ceuta-bg-mid text-ceuta-muted'}`}>
                  {sourceLabels[n.source] ?? n.source}
                </span>
                <span className="text-[10px] text-ceuta-muted">{fmt(n.published_at)}</span>
              </div>
              <p className="text-[13px] font-semibold text-ceuta-black leading-tight line-clamp-2 mb-0">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {n.title}
                  </a>
                ) : n.title}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              {notifResult[n.id] ? (
                <span className="text-[10px] font-bold text-ceuta-black">{notifResult[n.id]}</span>
              ) : (
                <button
                  onClick={() => sendNotif(n.id)}
                  disabled={notifying.has(n.id)}
                  className="text-ceuta-muted hover:text-ceuta-black text-[16px] leading-none disabled:opacity-40 transition-colors"
                  title="Enviar notificación"
                >
                  {notifying.has(n.id) ? '⏳' : '🔔'}
                </button>
              )}
              <button
                onClick={() => deleteNews(n.id)}
                disabled={deleting.has(n.id)}
                className="text-ceuta-muted hover:text-ceuta-red text-[16px] leading-none disabled:opacity-40 transition-colors"
                title="Borrar"
              >
                {deleting.has(n.id) ? '⏳' : '🗑'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-[13px] text-ceuta-muted text-center py-8">Sin noticias que coincidan</p>
        )}
      </div>
    </div>
  )
}
