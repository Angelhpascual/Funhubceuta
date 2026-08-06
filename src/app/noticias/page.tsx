'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { timeAgo } from '@/lib/formatters'
import { NewsItem } from '@/domain/news/News'
import Link from 'next/link'
import Image from 'next/image'
import { proxyImage } from '@/lib/proxyImage'

const SOURCES: Record<string, { label: string; domain: string; color: string }> = {
  oficial: { label: 'AD Ceuta FC', domain: 'adceutafc.com', color: 'var(--red)' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es', color: 'var(--black)' },
  faro: { label: 'El Faro de Ceuta', domain: 'elfarodeceuta.es', color: 'var(--black)' },
  teleceuta: { label: 'Teleceuta', domain: 'teleceuta.com', color: 'var(--black)' },
  ceutatv: { label: 'Ceuta Televisión', domain: 'ceutatv.com', color: 'var(--black)' },
  rtvc: { label: 'RTV Ceuta', domain: 'rtvce.es', color: 'var(--black)' },
  laverdad: { label: 'La Verdad de Ceuta', domain: 'laverdaddeceuta.com', color: 'var(--black)' },
  ceutaactualidad: { label: 'Ceuta Actualidad', domain: 'ceutaactualidad.com', color: 'var(--black)' },
  ceutaaldia: { label: 'Ceuta al Día', domain: 'ceutaldia.com', color: 'var(--black)' },
  marca: { label: 'Marca', domain: 'marca.com', color: 'var(--muted)' },
  mundodeportivo: { label: 'Mundo Deportivo', domain: 'mundodeportivo.com', color: 'var(--muted)' },
  '20minutos': { label: '20 Minutos', domain: '20minutos.es', color: 'var(--muted)' },
  sport: { label: 'Sport', domain: 'sport.es', color: 'var(--muted)' },
  as: { label: 'AS', domain: 'as.com', color: 'var(--muted)' },
  confidencial: { label: 'El Confidencial', domain: 'elconfidencial.com', color: 'var(--muted)' },
  abc: { label: 'ABC', domain: 'abc.es', color: 'var(--muted)' },
  lavanguardia: { label: 'La Vanguardia', domain: 'lavanguardia.com', color: 'var(--muted)' },
  cope: { label: 'COPE', domain: 'cope.es', color: 'var(--muted)' },
  ser: { label: 'Cadena SER', domain: 'cadenaser.com', color: 'var(--muted)' },
  onefootball: { label: 'OneFootball', domain: 'onefootball.com', color: 'var(--muted)' },
  elpais: { label: 'El País', domain: 'elpais.com', color: 'var(--muted)' },
  rtve: { label: 'RTVE', domain: 'rtve.es', color: 'var(--muted)' },
  goal: { label: 'Goal.com', domain: 'goal.com', color: 'var(--muted)' },
  elgoldigital: { label: 'El Gol Digital', domain: 'elgoldigital.com', color: 'var(--muted)' },
  fondosegunda: { label: 'Fondo Segunda', domain: 'fondosegunda.com', color: 'var(--muted)' },
  transfermarkt: { label: 'Transfermarkt', domain: 'transfermarkt.es', color: 'var(--muted)' },
  prensa: { label: 'Prensa', domain: 'google.com', color: 'var(--muted)' },
}

const PAGE_SIZE = 20
const PULL_THRESHOLD = 70

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pullY, setPullY] = useState(0)

  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const offsetRef = useRef(0)

  const fetchNews = useCallback(async (currentOffset: number, append: boolean) => {
    const res = await fetch(`/api/news?limit=${PAGE_SIZE}&offset=${currentOffset}`)
    if (!res.ok) return
    const data = await res.json()
    const items: NewsItem[] = data.news ?? []
    if (append) setNews((prev) => [...prev, ...items])
    else setNews(items)
    const more = items.length === PAGE_SIZE
    setHasMore(more)
    hasMoreRef.current = more
  }, [])

  useEffect(() => {
    fetchNews(0, false).finally(() => setLoading(false))
  }, [fetchNews])

  const loadNextPage = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    const next = offsetRef.current + PAGE_SIZE
    offsetRef.current = next
    fetchNews(next, true).finally(() => {
      loadingMoreRef.current = false
      setLoadingMore(false)
    })
  }, [fetchNews])

  // Infinite scroll — scroll event adaptativo: scroll-area en móvil, window en desktop
  useEffect(() => {
    const scrollEl = document.querySelector('.scroll-area') as HTMLElement | null
    const cs = scrollEl ? window.getComputedStyle(scrollEl) : null
    const isScrollable = cs?.overflowY === 'auto' || cs?.overflowY === 'scroll'
    const target: EventTarget = isScrollable && scrollEl ? scrollEl : window

    const onScroll = () => {
      let scrollTop: number, scrollHeight: number, clientHeight: number
      if (target === window) {
        scrollTop = window.scrollY
        scrollHeight = document.documentElement.scrollHeight
        clientHeight = window.innerHeight
      } else {
        const el = target as HTMLElement
        scrollTop = el.scrollTop
        scrollHeight = el.scrollHeight
        clientHeight = el.clientHeight
      }
      if (scrollTop + clientHeight >= scrollHeight - 400) loadNextPage()
    }

    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [loadNextPage])

  const refresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchNews(0, false)
    offsetRef.current = 0
    hasMoreRef.current = true
    setHasMore(true)
    setRefreshing(false)
  }, [refreshing, fetchNews])

  // Pull-to-refresh — solo en móvil donde .scroll-area tiene overflow-y: auto
  useEffect(() => {
    const scrollEl = document.querySelector('.scroll-area') as HTMLElement | null
    if (!scrollEl) return
    const cs = window.getComputedStyle(scrollEl)
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') return

    const onTouchStart = (e: TouchEvent) => {
      if (scrollEl.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY
        pulling.current = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - touchStartY.current
      if (dy > 0 && scrollEl.scrollTop === 0) {
        setPullY(Math.min(dy * 0.4, PULL_THRESHOLD))
      } else {
        pulling.current = false
        setPullY(0)
      }
    }
    const onTouchEnd = () => {
      if (pulling.current && pullY >= PULL_THRESHOLD) refresh()
      pulling.current = false
      setPullY(0)
    }

    scrollEl.addEventListener('touchstart', onTouchStart as EventListener, { passive: true })
    scrollEl.addEventListener('touchmove', onTouchMove as EventListener, { passive: true })
    scrollEl.addEventListener('touchend', onTouchEnd as EventListener, { passive: true })
    return () => {
      scrollEl.removeEventListener('touchstart', onTouchStart as EventListener)
      scrollEl.removeEventListener('touchmove', onTouchMove as EventListener)
      scrollEl.removeEventListener('touchend', onTouchEnd as EventListener)
    }
  }, [pullY, refresh])

  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1)

  return (
    <div className="page pb-24">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: refreshing ? 44 : pullY > 0 ? pullY : 0 }}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"
          className={refreshing ? 'animate-spin' : ''}
          style={{ opacity: refreshing ? 1 : pullProgress, transform: `rotate(${pullProgress * 180}deg)` }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>

      {/* ── HERO ── */}
      <div className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, var(--white) 0 14px, var(--black) 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <Link
          href="/"
          className="mb-3 flex w-fit items-center gap-1.5 text-ceuta-muted no-underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Volver</span>
        </Link>
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          AD Ceuta FC · Actualidad
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          TODAS LAS
          <br />
          <em className="not-italic text-ceuta-gold">NOTICIAS</em>
        </div>
      </div>

      {/* ── NEWS LIST ── */}
      <div className="relative z-[2] -mt-7 mx-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white shadow-[var(--shadow-hard)]">
        {loading ? (
          <div className="px-[18px] py-6 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">
            Cargando noticias…
          </div>
        ) : (
          <>
            {news.map((n) => {
              const src = SOURCES[n.source]
              const image = proxyImage(n.imageUrl)
              return (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border-b border-ceuta-border no-underline px-[14px] py-[12px] active:bg-ceuta-bg-soft"
                  style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: src?.color ?? 'var(--muted)' }}
                >
                  {image ? (
                    <div className="relative size-[48px] shrink-0 overflow-hidden rounded-[8px]">
                      <Image src={image} alt="" fill sizes="48px" quality={65} className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-ceuta-bg-soft font-display text-[10px] font-black uppercase text-ceuta-muted">
                      {src?.label.slice(0, 3) ?? '···'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {src?.domain && <img src={`/api/proxy/favicon?domain=${src.domain}`} alt="" width={11} height={11} loading="lazy" decoding="async" className="rounded-[2px]" />}
                      <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em]" style={{ color: src?.color ?? 'var(--muted)' }}>
                        {src?.label ?? n.source}
                      </span>
                    </div>
                    <div className="font-display text-[13.5px] font-bold uppercase leading-[1.25] tracking-[0.01em] text-ceuta-black line-clamp-2">
                      {n.title}
                    </div>
                    <div className="mt-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-ceuta-muted">
                      {timeAgo(n.publishedAt)}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ceuta-muted">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              )
            })}

            {!hasMore && news.length > 0 && (
              <div className="px-[14px] py-4 text-center font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                Ya has visto todas las noticias
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky: siempre visible sin llegar al fondo */}
      {!loading && hasMore && !loadingMore && news.length > 0 && (
        <div className="sticky bottom-0 z-10 px-3 pb-3 pt-6" style={{ background: 'linear-gradient(to bottom, transparent, white 40%)' }}>
          <button type="button"
            onClick={loadNextPage}
            className="w-full rounded-[14px] border-2 border-ceuta-black bg-white py-4 font-display text-[12px] font-black uppercase tracking-[0.12em] text-ceuta-black shadow-[4px_4px_0_var(--red)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--red)] transition-all"
          >
            Cargar más noticias
          </button>
        </div>
      )}

      {loadingMore && (
        <div className="flex items-center justify-center py-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
      <div className="h-6" />
    </div>
  )
}
