'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { SocialLinks } from '@/components/social/TwitterTimeline'
import { LiveMatchCard } from './LiveMatchCard'
import { MvpBanner } from '@/components/ui/MvpBanner'
import { NotificationBanner } from '@/components/ui/NotificationBanner'
import { PredictionBanner } from '@/components/ui/PredictionBanner'
import { useHomeNews } from '@/hooks/useHomeNews'
import { useNearViewport } from '@/hooks/useNearViewport'
import { FeaturedNewsCard, FeaturedNewsPlaceholder } from './FeaturedNewsCard'
import { NewsListItem } from './NewsListItem'
import { NewsCarouselCard } from './NewsCarouselCard'

export function HomePage({
  onReady,
  onOpenHimno,
}: {
  onReady?: () => void
  onOpenHimno?: () => void
}) {
  const { news, loading, featuredImage, setFeaturedImageReady, reportFeaturedImageLoad } = useHomeNews()
  const [olderRef] = useNearViewport<HTMLDivElement>()

  useEffect(() => {
    if (!loading) onReady?.()
  }, [loading, onReady])

  const featured = news[0]
  const recent = news.slice(1, 5)
  const older = news.slice(5)

  return (
    <div className="page">
      {/* ── CABECERA ── */}
      <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">Temporada 2026–27 ·</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/liga-hypermotion.webp" alt="Liga Hypermotion" className="h-[10px] w-auto" />
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          AD CEUTA,<br /><em className="not-italic text-ceuta-gold">AL DÍA</em>
        </div>
      </div>

      {/* ── HERO ── */}
      {featured ? (
        <FeaturedNewsCard
          item={featured}
          image={featuredImage ?? ''}
          loading={loading}
          onImageLoad={reportFeaturedImageLoad}
          onImageReady={() => setFeaturedImageReady(true)}
        />
      ) : (
        <FeaturedNewsPlaceholder loading={loading} />
      )}

      <NotificationBanner />
      <PredictionBanner />

      {/* ── PRÓXIMO PARTIDO ── */}
      <MvpBanner />
      <div className="flex items-end justify-between px-4 pb-3 pt-6">
        <div>
          <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            Próximo encuentro
          </div>
          <div className="font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-ceuta-black">
            En el campo
          </div>
        </div>
      </div>
      <LiveMatchCard />

      {/* ── NOTICIAS RECIENTES ── */}
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
            className="flex items-center gap-1 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ceuta-black underline"
          >
            Ver todas →
          </Link>
        )}
      </div>

      {loading && (
        <div className="px-4 py-5 font-display text-[11px] uppercase tracking-[0.1em] text-ceuta-muted">
          Cargando noticias…
        </div>
      )}

      {recent.map((n, i) => <NewsListItem key={n.id} item={n} index={i} />)}

      {/* ── ANTERIORES (carrusel) ── */}
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
            {older.map((n, i) => <NewsCarouselCard key={n.id} item={n} index={i} />)}
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
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
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
