'use client'

import { useEffect, useState, useCallback } from 'react'
import { NewsItem } from '@/domain/news/News'
import Link from 'next/link'

const SOURCES: Record<string, { label: string; domain: string; color: string }> = {
  oficial:         { label: 'AD Ceuta FC',        domain: 'adceutafc.com',          color: '#DA1A22' },
  elpueblo:        { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es',     color: '#0E0E0E' },
  faro:            { label: 'El Faro de Ceuta',   domain: 'elfarodeceuta.es',       color: '#0E0E0E' },
  ceutatv:         { label: 'Ceuta Televisión',   domain: 'ceutatv.es',             color: '#0E0E0E' },
  rtvc:            { label: 'RTV Ceuta',          domain: 'rtvc.es',                color: '#0E0E0E' },
  laverdad:        { label: 'La Verdad de Ceuta', domain: 'laverdaddeceuta.com',    color: '#0E0E0E' },
  ceutaactualidad: { label: 'Ceuta Actualidad',   domain: 'ceutaactualidad.com',    color: '#0E0E0E' },
  marca:           { label: 'Marca',              domain: 'marca.com',              color: '#6B7280' },
  mundodeportivo:  { label: 'Mundo Deportivo',    domain: 'mundodeportivo.com',     color: '#6B7280' },
  '20minutos':     { label: '20 Minutos',         domain: '20minutos.es',           color: '#6B7280' },
  sport:           { label: 'Sport',              domain: 'sport.es',               color: '#6B7280' },
  as:              { label: 'AS',                 domain: 'as.com',                 color: '#6B7280' },
  confidencial:    { label: 'El Confidencial',    domain: 'elconfidencial.com',     color: '#6B7280' },
  abc:             { label: 'ABC',                domain: 'abc.es',                 color: '#6B7280' },
  lavanguardia:    { label: 'La Vanguardia',      domain: 'lavanguardia.com',       color: '#6B7280' },
  cope:            { label: 'COPE',               domain: 'cope.es',                color: '#6B7280' },
  ser:             { label: 'Cadena SER',         domain: 'cadenaser.com',          color: '#6B7280' },
  onefootball:     { label: 'OneFootball',        domain: 'onefootball.com',        color: '#6B7280' },
  prensa:          { label: 'Prensa',             domain: 'google.com',             color: '#6B7280' },
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
    <div id="app-root">
    <div className="page">

      {/* ── HERO ── */}
      <div className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        {/* back arrow */}
        <Link href="/" className="mb-3 flex items-center gap-1.5 text-ceuta-muted no-underline" style={{ width: 'fit-content' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Volver</span>
        </Link>
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          AD Ceuta FC · Actualidad
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          TODAS LAS<br />
          <em className="not-italic text-ceuta-gold">NOTICIAS</em>
        </div>
      </div>

      {/* ── NEWS LIST CARD ── */}
      <div className="relative z-[2] -mt-7 mx-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white shadow-[6px_6px_0_#D62027]">
        {loading ? (
          <div className="px-[18px] py-6 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">
            Cargando noticias…
          </div>
        ) : (
          <>
            {news.map((n) => {
              const src = SOURCES[n.source]
              return (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border-b border-ceuta-border px-[14px] py-[12px] active:bg-ceuta-bg-soft"
                  style={{ textDecoration: 'none', borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: src?.color ?? '#6B7280' }}
                >
                  {/* thumbnail */}
                  {n.imageUrl ? (
                    <div
                      className="size-[48px] shrink-0 rounded-[8px]"
                      style={{ backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  ) : (
                    <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-ceuta-bg-soft font-display text-[10px] font-black uppercase text-ceuta-muted">
                      {src?.label.slice(0, 3) ?? '···'}
                    </div>
                  )}

                  {/* body */}
                  <div className="min-w-0 flex-1">
                    {/* source tag */}
                    <div className="mb-0.5 flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${src?.domain}&sz=16`}
                        alt=""
                        width={11}
                        height={11}
                        className="rounded-[2px]"
                      />
                      <span
                        className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: src?.color ?? '#6B7280' }}
                      >
                        {src?.label ?? n.source}
                      </span>
                    </div>
                    {/* title */}
                    <div className="font-display text-[13.5px] font-bold uppercase leading-[1.25] tracking-[0.01em] text-ceuta-black line-clamp-2">
                      {n.title}
                    </div>
                    {/* time */}
                    <div className="mt-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-ceuta-muted">
                      {timeAgo(n.publishedAt)}
                    </div>
                  </div>

                  {/* arrow */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ceuta-muted">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              )
            })}

            {hasMore && (
              <div className="px-[14px] py-3">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full rounded-[10px] bg-ceuta-bg-soft py-[13px] font-display text-[12px] font-black uppercase tracking-[0.1em]"
                  style={{ border: 'none', color: loadingMore ? '#6B7280' : '#0A0A0A', cursor: loadingMore ? 'default' : 'pointer' }}
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más noticias'}
                </button>
              </div>
            )}

            {!hasMore && news.length > 0 && (
              <div className="px-[14px] py-4 text-center font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                Ya has visto todas las noticias
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-6" />
    </div>
    </div>
  )
}
