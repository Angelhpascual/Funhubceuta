'use client'

import { useEffect, useRef, useState } from 'react'
import { timeAgo } from '@/lib/formatters'
import { NewsItem } from '@/domain/news/News'
import { SocialLinks } from '@/components/social/TwitterTimeline'
import { LiveMatchCard } from './LiveMatchCard'
import { NotificationBanner } from '@/components/ui/NotificationBanner'
import { MvpBanner } from '@/components/ui/MvpBanner'
import { PredictionBanner } from '@/components/ui/PredictionBanner'
import Link from 'next/link'
import Image, { type ImageLoaderProps } from 'next/image'
import { proxyImage } from '@/lib/proxyImage'

const SOURCES: Record<string, { label: string; domain: string }> = {
  oficial: { label: 'AD Ceuta FC', domain: 'adceutafc.com' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es' },
  faro: { label: 'El Faro de Ceuta', domain: 'elfarodeceuta.es' },
  teleceuta: { label: 'Teleceuta', domain: 'teleceuta.com' },
  ceutatv: { label: 'Ceuta Televisión', domain: 'ceutatv.com' },
  rtvc: { label: 'RTV Ceuta', domain: 'rtvce.es' },
  laverdad: { label: 'La Verdad de Ceuta', domain: 'laverdaddeceuta.com' },
  ceutaactualidad: { label: 'Ceuta Actualidad', domain: 'ceutaactualidad.com' },
  ceutaaldia: { label: 'Ceuta al Día', domain: 'ceutaldia.com' },
  marca: { label: 'Marca', domain: 'marca.com' },
  mundodeportivo: { label: 'Mundo Deportivo', domain: 'mundodeportivo.com' },
  '20minutos': { label: '20 Minutos', domain: '20minutos.es' },
  sport: { label: 'Sport', domain: 'sport.es' },
  as: { label: 'AS', domain: 'as.com' },
  confidencial: { label: 'El Confidencial', domain: 'elconfidencial.com' },
  abc: { label: 'ABC', domain: 'abc.es' },
  lavanguardia: { label: 'La Vanguardia', domain: 'lavanguardia.com' },
  cope: { label: 'COPE', domain: 'cope.es' },
  ser: { label: 'Cadena SER', domain: 'cadenaser.com' },
  onefootball: { label: 'OneFootball', domain: 'onefootball.com' },
  elpais: { label: 'El País', domain: 'elpais.com' },
  rtve: { label: 'RTVE', domain: 'rtve.es' },
  goal: { label: 'Goal.com', domain: 'goal.com' },
  elgoldigital: { label: 'El Gol Digital', domain: 'elgoldigital.com' },
  fondosegunda: { label: 'Fondo Segunda', domain: 'fondosegunda.com' },
  transfermarkt: { label: 'Transfermarkt', domain: 'transfermarkt.es' },
  ceutadeportiva: { label: 'Ceuta Deportiva', domain: 'ceutadeportiva.com' },
  prensa: { label: 'Prensa', domain: 'google.com' },
}


const THUMB_COLORS = [
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
]

function newsImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.startsWith('/api/proxy/image')) return src

  const params = new URLSearchParams(src.split('?')[1] ?? '')
  params.set('w', String(width))
  params.set('q', String(quality ?? 70))
  return `/api/proxy/image?${params.toString()}`
}

function loaderFor(src: string) {
  return src.startsWith('/api/proxy/image') ? newsImageLoader : undefined
}

function isStoredNewsImage(src: string): boolean {
  try {
    const url = new URL(src)
    return url.hostname.endsWith('.supabase.co') && url.pathname.includes('/news-images/')
  } catch {
    return false
  }
}

function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    if (isNear) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '360px 0px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isNear])

  return [ref, isNear] as const
}

function SourceTag({ source }: { source: string }) {
  const s = SOURCES[source]
  if (!s)
    return (
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
        {source}
      </span>
    )
  return (
    <span className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/proxy/favicon?domain=${s.domain}`}
        alt=""
        width={12}
        height={12}
        loading="lazy"
        decoding="async"
        className="rounded-[2px]"
      />
      {s.label}
    </span>
  )
}

export function HomePage({
  onReady,
  onOpenHimno,
}: {
  onReady?: () => void
  onOpenHimno?: () => void
}) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsFetched, setNewsFetched] = useState(false)
  const [featuredImageReady, setFeaturedImageReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const onReadyRef = useRef(onReady)
  const imagePerfEnabledRef = useRef(false)
  const mountedAtRef = useRef(0)
  const newsFetchStartedAtRef = useRef(0)
  const newsRequestedRef = useRef(false)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  // Minimum time to show loader so TrueFocus animation gets at least 3 full cycles
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 3600)
    return () => clearTimeout(t)
  }, [])

  // Safety timeout — never stay on loading screen more than 8s
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    mountedAtRef.current = performance.now()
    const params = new URLSearchParams(window.location.search)
    const enabled =
      params.get('perfImages') === '1' || window.localStorage.getItem('perfImages') === '1'

    imagePerfEnabledRef.current = enabled
    if (enabled) console.info('[home image perf] tracking enabled')
  }, [])

  useEffect(() => {
    if (newsRequestedRef.current) return
    newsRequestedRef.current = true
    newsFetchStartedAtRef.current = performance.now()
    fetch('/api/news?limit=10')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.news) {
          if (imagePerfEnabledRef.current) {
            console.table([
              {
                step: 'news fetched',
                msFromMount: Math.round(performance.now() - mountedAtRef.current),
                durationMs: Math.round(performance.now() - newsFetchStartedAtRef.current),
                items: data.news.length,
                featuredHasImage: Boolean(data.news[0]?.imageUrl),
              },
            ])
          }
          setNews(data.news)
        }
      })
      .catch(() => {})
      .finally(() => {
        setNewsFetched(true)
      })
  }, [])

  function reportFeaturedImageLoad(img: HTMLImageElement) {
    if (!imagePerfEnabledRef.current) return

    const currentSrc = img.currentSrc
    const resource = performance
      .getEntriesByType('resource')
      .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
      .find((entry) => entry.name === currentSrc)

    console.table([
      {
        step: 'featured image loaded',
        msFromMount: Math.round(performance.now() - mountedAtRef.current),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        transferKb: resource ? Math.round(resource.transferSize / 102.4) / 10 : 'n/a',
        encodedKb: resource ? Math.round(resource.encodedBodySize / 102.4) / 10 : 'n/a',
        requestMs: resource ? Math.round(resource.responseEnd - resource.startTime) : 'n/a',
        url: currentSrc,
      },
    ])
  }

  const featured = news[0]
  const featuredImage = proxyImage(featured?.imageUrl)

  // loading = true until min time passed AND news arrived AND (featured image loaded OR there's no image)
  const loading = !timedOut && (!minTimePassed || !newsFetched || (!!featuredImage && !featuredImageReady))

  useEffect(() => {
    if (!loading) onReadyRef.current?.()
  }, [loading])
  const recent = news.slice(1, 5)
  const older = news.slice(5)
  const [olderRef, olderImagesReady] = useNearViewport<HTMLDivElement>()

  return (
    <div className="page">
      {/* ── HERO ── */}
      {featured ? (
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mx-3 mt-3 block aspect-[16/10] cursor-pointer overflow-hidden rounded-[14px] bg-ceuta-black"
        >
          {featuredImage && (
            <Image
              loader={loaderFor(featuredImage)}
              src={featuredImage}
              alt={featured.title}
              fill
              preload
              sizes="(max-width: 768px) 100vw, 420px"
              quality={70}
              unoptimized={isStoredNewsImage(featuredImage)}
              className="object-cover"
              style={{ objectPosition: 'center 20%' }}
              onLoad={(event) => {
                reportFeaturedImageLoad(event.currentTarget)
                setFeaturedImageReady(true)
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2.5 flex w-fit items-center gap-1.5 bg-ceuta-red px-[9px] py-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/proxy/favicon?domain=${SOURCES[featured.source]?.domain}`}
                alt=""
                width={14}
                height={14}
                loading="eager"
                decoding="async"
                className="rounded-[2px]"
              />
              <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
                {SOURCES[featured.source]?.label ?? featured.source}
              </span>
            </div>
            <div className="font-display text-[24px] font-black uppercase leading-[1.05] tracking-[0.01em] text-white">
              {featured.title}
            </div>
            <div className="mt-2 text-[12px] text-white/70">{timeAgo(featured.publishedAt)}</div>
          </div>
        </a>
      ) : (
        <div className="relative mx-3 mt-3 aspect-[16/10] overflow-hidden rounded-[14px] bg-ceuta-black">
          <div className="flex size-full items-center justify-center font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white/40">
            {loading ? 'CARGANDO…' : 'AD CEUTA'}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2.5 w-fit bg-ceuta-red px-[9px] py-[3px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
              Destacado
            </div>
            <div className="font-display text-[24px] font-black uppercase leading-[1.05] text-white">
              Bienvenido a AD Ceuta Info
            </div>
            <div className="mt-2 text-[12px] text-white/70">Noticias próximamente</div>
          </div>
        </div>
      )}

      <NotificationBanner />
      <PredictionBanner />
      <MvpBanner />

      {/* ── PRÓXIMO PARTIDO ── */}
      <div className="flex items-end justify-between px-4 pb-3 pt-6">
        <div>
          <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            Próximo encuentro
          </div>
          <div className="font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-ceuta-black">
            Próximo partido
          </div>
        </div>
      </div>
      <LiveMatchCard />

      {/* ── NOTICIAS ── */}
      <div className="flex items-end justify-between px-4 pb-3 pt-6">
        <div>
          <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            Actualidad
          </div>
          <div className="font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-ceuta-black">
            Últimas noticias
          </div>
        </div>
        {news.length > 0 && (
          <Link
            href="/noticias"
            className="flex items-center gap-1 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ceuta-black"
          >
            Ver todo <span className="text-[14px]">→</span>
          </Link>
        )}
      </div>

      {loading && (
        <div className="px-4 py-5 font-display text-[11px] uppercase tracking-[0.1em] text-ceuta-muted">
          Cargando noticias…
        </div>
      )}

      {/* Lista vertical — noticias recientes */}
      {recent.map((n, i) => {
        const image = proxyImage(n.imageUrl)

        return (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-start gap-3 border-b border-ceuta-border px-4 py-[14px] transition-colors active:bg-ceuta-bg-soft"
          >
            {image ? (
              <div className="relative size-[88px] shrink-0 overflow-hidden rounded-[8px]">
                <Image
                  loader={loaderFor(image)}
                  src={image}
                  alt=""
                  fill
                  sizes="88px"
                  quality={65}
                  loading="lazy"
                  unoptimized={isStoredNewsImage(image)}
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`relative size-[88px] shrink-0 overflow-hidden rounded-[8px] ${THUMB_COLORS[i % THUMB_COLORS.length]}`}
              />
            )}
            <div className="min-w-0 flex-1">
              <SourceTag source={n.source} />
              <div className="mt-1 font-display text-[16px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-ceuta-black">
                {n.title}
              </div>
              <div className="mt-[5px] text-[11.5px] text-ceuta-muted">
                {timeAgo(n.publishedAt)}
              </div>
            </div>
          </a>
        )
      })}

      {/* Carrusel horizontal — noticias anteriores */}
      {older.length > 0 && (
        <>
          <div className="flex items-end justify-between px-4 pb-3 pt-5">
            <div>
              <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
                Anteriores
              </div>
              <div className="font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-ceuta-black">
                También te puede interesar
              </div>
            </div>
          </div>
          <div
            ref={olderRef}
            className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]"
          >
            {older.map((n, i) => {
              const image = proxyImage(n.imageUrl)

              return (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[220px] shrink-0 overflow-hidden rounded-[14px] border border-ceuta-border bg-white [scroll-snap-align:start]"
                >
                  {image ? (
                    <div className="relative h-[110px] w-full shrink-0">
                      <Image
                        loader={loaderFor(image)}
                        src={image}
                        alt=""
                        fill
                        sizes="220px"
                        quality={65}
                        loading="lazy"
                        unoptimized={isStoredNewsImage(image)}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-[110px] w-full shrink-0 ${THUMB_COLORS[i % THUMB_COLORS.length]}`}
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-1 p-[8px_10px_10px]">
                    <SourceTag source={n.source} />
                    <div className="line-clamp-3 font-display text-[12px] font-bold uppercase leading-[1.35] text-ceuta-black">
                      {n.title}
                    </div>
                    <div className="mt-auto text-[11px] text-ceuta-muted">
                      {timeAgo(n.publishedAt)}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </>
      )}

      {!loading && news.length === 0 && (
        <div className="px-4 py-4 font-display text-[13px] uppercase tracking-[0.05em] text-ceuta-muted">
          No hay noticias aún — ejecuta el sync para cargarlas
        </div>
      )}

      {/* ── HIMNO ── */}
      <div className="px-3 pt-2">
        <button
          onClick={onOpenHimno}
          className="w-full cursor-pointer bg-transparent p-0 text-left"
        >
          <div className="relative flex items-center gap-[14px] overflow-hidden rounded-[14px] bg-ceuta-black px-[18px] py-4">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)',
              }}
            />
            <div className="h-[42px] w-1 shrink-0 rounded-[2px] bg-ceuta-red" />
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <div className="flex-1">
              <div className="font-display text-[15px] font-black uppercase tracking-[0.04em] text-white">
                Himno del AD Ceuta
              </div>
              <div className="mt-0.5 font-display text-[11px] uppercase tracking-[0.08em] text-white/50">
                Ver letra completa
              </div>
            </div>
            <div className="font-display text-[18px] font-bold text-ceuta-red">→</div>
          </div>
        </button>
      </div>

      {/* ── EN REDES ── */}
      <div className="flex items-end justify-between px-4 pb-3 pt-6">
        <div>
          <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            #adceuta
          </div>
          <div className="font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-ceuta-black">
            En redes
          </div>
        </div>
      </div>
      <SocialLinks />

      <div className="h-2" />
    </div>
  )
}
