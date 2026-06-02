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

const THUMB_COLORS = ['red', 'black', '', 'red', 'black', '']

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
    if (append) {
      setNews(prev => [...prev, ...items])
    } else {
      setNews(items)
    }
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 12px 0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div>
          <div className="sec-title-small">Actualidad</div>
          <div className="sec-title">Todas las noticias</div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ padding: '20px 16px', fontFamily: 'var(--font-display)', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11 }}>
          Cargando noticias…
        </div>
      ) : (
        <>
          {news.map((n, i) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="news-item" style={{ textDecoration: 'none' }}>
              {n.imageUrl ? (
                <div className="news-thumb" style={{ backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              ) : (
                <div className={`news-thumb ${THUMB_COLORS[i % THUMB_COLORS.length]}`} />
              )}
              <div className="news-body">
                <div className="news-tag" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://www.google.com/s2/favicons?domain=${SOURCES[n.source]?.domain}&sz=16`} alt="" width={12} height={12} style={{ borderRadius: 2 }} />
                  {SOURCES[n.source]?.label ?? n.source}
                </div>
                <div className="news-title">{n.title}</div>
                <div className="news-meta">{timeAgo(n.publishedAt)}</div>
              </div>
            </a>
          ))}

          {hasMore && (
            <div style={{ padding: '12px 12px 8px' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--bg-soft)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 12,
                  color: loadingMore ? 'var(--muted)' : 'var(--black)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: loadingMore ? 'default' : 'pointer',
                }}
              >
                {loadingMore ? 'Cargando…' : 'Cargar más noticias'}
              </button>
            </div>
          )}

          {!hasMore && news.length > 0 && (
            <div style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
              Ya has visto todas las noticias
            </div>
          )}
        </>
      )}

      <div style={{ height: 16 }} />
    </div>
  )
}
