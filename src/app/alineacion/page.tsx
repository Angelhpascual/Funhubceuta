'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MatchLineup } from '@/app/api/matches/lineup/route'
import { LineupField } from '@/features/matches/LineupField'
import { findLogo } from '@/lib/findLogo'
import Link from 'next/link'

function TeamCrest({ name, logos }: { name: string; logos: Record<string, string> }) {
  const logo = findLogo(logos, name)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex size-14 items-center justify-center rounded-full bg-white/10 p-1.5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="size-full object-contain" />
        ) : (
          <span className="font-display text-[11px] font-black text-white">{name.slice(0, 3).toUpperCase()}</span>
        )}
      </div>
      <span className="max-w-[90px] text-center font-display text-[10px] font-bold uppercase leading-tight tracking-[0.06em] text-white/80">
        {name}
      </span>
    </div>
  )
}

function LineupContent() {
  const params = useSearchParams()
  const eventId = params.get('eventId')
  const matchLabel = params.get('match') ?? 'Alineación'

  const [lineup, setLineup] = useState<MatchLineup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [logos, setLogos] = useState<Record<string, string>>({})

  const [homeTeam, awayTeam] = matchLabel.includes(' vs ')
    ? matchLabel.split(' vs ')
    : [matchLabel, '']

  useEffect(() => {
    if (!eventId) { setError(true); setLoading(false); return }
    fetch(`/api/matches/lineup?eventId=${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.available) setLineup(d)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    fetch('/api/teams')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.teams) {
          const map: Record<string, string> = {}
          for (const t of d.teams) if (t.logoUrl) map[t.name] = t.logoUrl
          setLogos(map)
        }
      })
      .catch(() => {})
  }, [eventId])

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[56px] pt-[22px] text-white">
        {/* rayas diagonales — solo en la esquina, no invaden el contenido */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-[100px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 10px, #0A0A0A 10px 20px)',
            clipPath: 'polygon(50px 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 0.35,
          }}
        />

        {/* volver */}
        <Link href="/" className="relative z-10 mb-4 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver
        </Link>

        {/* badge */}
        <div className="relative z-10 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Once inicial · Liga Hypermotion
        </div>

        {/* escudos + VS */}
        <div className="relative z-10 mt-4 flex items-center justify-between pr-[80px]">
          <TeamCrest name={homeTeam.trim()} logos={logos} />
          <div className="font-display text-[22px] font-black tracking-[0.12em] text-white/30">VS</div>
          <TeamCrest name={awayTeam.trim()} logos={logos} />
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
