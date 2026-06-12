'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MatchLineup } from '@/app/api/matches/lineup/route'
import { LineupField } from '@/features/matches/LineupField'

function LineupContent() {
  const params = useSearchParams()
  const router = useRouter()
  const eventId = params.get('eventId')
  const matchLabel = params.get('match') ?? 'Alineación'
  const score = params.get('score') // e.g. "1-0"

  const [lineup, setLineup] = useState<MatchLineup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setError(true)
      setLoading(false)
      return
    }
    fetch(`/api/matches/lineup?eventId=${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.available) setLineup(d)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <div className="page">
        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
          {/* rayas — sólo esquina derecha, no invaden el texto */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 w-[120px]"
            style={{
              background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
              clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* todo el contenido con z-10 para quedar por encima de las rayas */}
          <div className="relative z-10">
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Volver
            </button>
            <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
              <div className="h-0.5 w-[18px] bg-ceuta-red" />
              Once inicial{score && <span className="text-ceuta-gold"> · {score.replace('-', '–')}</span>}
            </div>

            <div className="mt-2 pr-[70px] font-display text-[32px] font-black uppercase leading-[0.95]">
              {matchLabel.includes(' vs ') ? (
                <>
                  {matchLabel.split(' vs ')[0]}
                  <em className="not-italic text-ceuta-gold"> vs </em>
                  {matchLabel.split(' vs ')[1]}
                </>
              ) : (
                matchLabel
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="relative z-[2] -mt-7 mx-3">
          {loading && (
            <div className="rounded-[14px] border-2 border-ceuta-black bg-white p-8 text-center">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
                Cargando alineación…
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[14px] border-2 border-ceuta-black bg-white p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-display text-[16px] font-black uppercase tracking-[0.04em] text-ceuta-black">
                Alineación no disponible
              </div>
              <div className="mt-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                Se publicará ~30 min antes del partido
              </div>
            </div>
          )}

          {!loading && lineup && <LineupField lineup={lineup} />}
        </div>

        <div className="h-6" />
      </div>
  )
}

export default function AlineacionPage() {
  return (
    <Suspense>
      <LineupContent />
    </Suspense>
  )
}
