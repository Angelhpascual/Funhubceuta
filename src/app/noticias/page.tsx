'use client'

import { useEffect, useState, useCallback } from 'react'
import { NewsItem } from '@/domain/news/News'
import Link from 'next/link'

const SOURCES: Record<string, { label: string; domain: string }> = {
  oficial:  { label: 'AD Ceuta FC',        domain: 'adceutafc.com' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es' },
  faro:     { label: 'El Faro de Ceuta',   domain: 'elfarodeceuta.es' },
  marca:    { label: 'Marca',              domain: 'marca.com' },
}

const PAGE_SIZE = 20

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const fetchNews = useCallback(async (currentOffset: number, append: boolean) => {
    const res = await fetch(`/api/news?limit=${PAGE_SIZE}&offset=${currentOffset}`)
    if (!res.ok) return
    const data = await res.json()
    const items: NewsItem[] = data.news ?? []
    if (append) setNews(prev => [...prev, ...items])
    else setNews(items)
    setHasMore(items.length === PAGE_SIZE)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchNews(0, false).finally(() => setLoading(false))
  }, [fetchNews])

  const loadMore = async () => {
    const next = offset + PAGE_SIZE
    setLoadingMore(true)
    await fetchNews(next, true)
    setOffset(next)
    setLoadingMore(false)
  }

  return (
    <div className="page">

      {/* ── TOPBAR con escudo ── */}
      <div className="topbar" style={{ justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.png" alt="AD Ceuta" style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </div>

      {/* ── HERO ── */}
      <div className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-[120px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 0.4,
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Volver
          </Link>
          <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
            <div className="h-0.5 w-[18px] bg-ceuta-red" />
            Actualidad
          </div>
          <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
            TODAS LAS<br />
            <em className="not-italic text-ceuta-gold">NOTICIAS</em>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="relative z-[2] -mt-7 mx-3">
        {loading ? (
          <div className="rounded-[14px] border-2 border-ceuta-black bg-white p-8 text-center">
            <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
              Cargando noticias…
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
            <div className="divide-y divide-ceuta-border">
              {news.map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 active:bg-ceuta-bg-soft"
                  style={{ textDecoration: 'none' }}
                >
                  {/* thumbnail */}
                  {n.imageUrl ? (
                    <div
                      className="size-[52px] shrink-0 rounded-[8px] bg-ceuta-bg-soft"
                      style={{ backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  ) : (
                    <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[8px] bg-ceuta-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/escudo.png" alt="" className="size-8 object-contain opacity-60" />
                    </div>
                  )}

                  {/* body */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${SOURCES[n.source]?.domain}&sz=16`}
                        alt=""
                        width={12}
                        height={12}
                        className="rounded-[2px]"
                      />
                      <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-ceuta-red">
                        {SOURCES[n.source]?.label ?? n.source}
                      </span>
                    </div>
                    <div className="line-clamp-2 font-display text-[13px] font-bold leading-[1.3] tracking-[0.01em] text-ceuta-black">
                      {n.title}
                    </div>
                    <div className="mt-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-ceuta-muted">
                      {timeAgo(n.publishedAt)}
                    </div>
                  </div>

                  {/* arrow */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ceuta-muted">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full border-t border-ceuta-border py-4 font-display text-[11px] font-black uppercase tracking-[0.12em] text-ceuta-black disabled:text-ceuta-muted active:bg-ceuta-bg-soft"
              >
                {loadingMore ? 'Cargando…' : 'Cargar más noticias'}
              </button>
            )}

            {!hasMore && news.length > 0 && (
              <div className="border-t border-ceuta-border py-4 text-center font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                Ya has visto todas las noticias
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  )
}
