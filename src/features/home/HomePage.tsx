'use client'

import { useEffect, useState } from 'react'
import { NewsItem } from '@/domain/news/News'
import { SocialLinks } from '@/components/social/TwitterTimeline'
import { LiveMatchCard } from './LiveMatchCard'
import { NotificationBanner } from '@/components/ui/NotificationBanner'
import Link from 'next/link'

const SOURCES: Record<string, { label: string; domain: string }> = {
  oficial:  { label: 'AD Ceuta FC',        domain: 'adceutafc.com' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es' },
  faro:     { label: 'El Faro de Ceuta',   domain: 'elfarodeceuta.es' },
  marca:    { label: 'Marca',              domain: 'marca.com' },
}

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

const THUMB_COLORS = [
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
]

function SourceTag({ source }: { source: string }) {
  const s = SOURCES[source]
  if (!s) return <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">{source}</span>
  return (
    <span className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=16`} alt="" width={12} height={12} className="rounded-[2px]" />
      {s.label}
    </span>
  )
}

export function HomePage({ onReady, onOpenHimno }: { onReady?: () => void; onOpenHimno?: () => void }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news?limit=10')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.news) setNews(data.news) })
      .catch(() => {})
      .finally(() => { setLoading(false); onReady?.() })
  }, [])

  const featured = news[0]
  const recent = news.slice(1, 5)
  const older = news.slice(5)

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured.imageUrl!}
            alt={featured.title}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: 'center 20%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2.5 flex w-fit items-center gap-1.5 bg-ceuta-red px-[9px] py-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?domain=${SOURCES[featured.source]?.domain}&sz=16`} alt="" width={14} height={14} className="rounded-[2px]" />
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
            <div className="mb-2.5 w-fit bg-ceuta-red px-[9px] py-[3px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">Destacado</div>
            <div className="font-display text-[24px] font-black uppercase leading-[1.05] text-white">Bienvenido a AD Ceuta Info</div>
            <div className="mt-2 text-[12px] text-white/70">Noticias próximamente</div>
          </div>
        </div>
      )}

      <NotificationBanner />

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
      {recent.map((n, i) => (
        <a
          key={n.id}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-start gap-3 border-b border-ceuta-border px-4 py-[14px] transition-colors active:bg-ceuta-bg-soft"
        >
          {n.imageUrl ? (
            <div
              className="relative size-[88px] shrink-0 overflow-hidden rounded-[8px]"
              style={{ backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ) : (
            <div className={`relative size-[88px] shrink-0 overflow-hidden rounded-[8px] ${THUMB_COLORS[i % THUMB_COLORS.length]}`} />
          )}
          <div className="min-w-0 flex-1">
            <SourceTag source={n.source} />
            <div className="mt-1 font-display text-[16px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-ceuta-black">
              {n.title}
            </div>
            <div className="mt-[5px] text-[11.5px] text-ceuta-muted">{timeAgo(n.publishedAt)}</div>
          </div>
        </a>
      ))}

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
          <div className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]">
            {older.map((n, i) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[220px] shrink-0 overflow-hidden rounded-[14px] border border-ceuta-border bg-white [scroll-snap-align:start]"
              >
                {n.imageUrl ? (
                  <div className="h-[110px] w-full shrink-0" style={{ backgroundImage: `url(${n.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                  <div className={`h-[110px] w-full shrink-0 ${THUMB_COLORS[i % THUMB_COLORS.length]}`} />
                )}
                <div className="flex flex-1 flex-col gap-1 p-[8px_10px_10px]">
                  <SourceTag source={n.source} />
                  <div className="line-clamp-3 font-display text-[12px] font-bold uppercase leading-[1.35] text-ceuta-black">
                    {n.title}
                  </div>
                  <div className="mt-auto text-[11px] text-ceuta-muted">{timeAgo(n.publishedAt)}</div>
                </div>
              </a>
            ))}
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
              style={{ background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)' }}
            />
            <div className="h-[42px] w-1 shrink-0 rounded-[2px] bg-ceuta-red" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
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
