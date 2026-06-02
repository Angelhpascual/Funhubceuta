'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MatchLineup } from '@/app/api/matches/lineup/route'
import { LineupField } from '@/features/matches/LineupField'
import Link from 'next/link'

function LineupContent() {
  const params = useSearchParams()
  const eventId = params.get('eventId')
  const matchLabel = params.get('match') ?? 'Alineación'

  const [lineup, setLineup] = useState<MatchLineup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
  }, [eventId])

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-4 pb-2">
        <Link href="/" className="flex items-center text-ceuta-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div>
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
            Once inicial
          </div>
          <div className="font-display text-[20px] font-black uppercase leading-none text-ceuta-black">
            {matchLabel}
          </div>
        </div>
      </div>

      <div className="px-3 pb-4">
        {loading && (
          <div className="py-12 text-center font-display text-[11px] uppercase tracking-[0.1em] text-ceuta-muted">
            Cargando alineación…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[14px] bg-ceuta-bg-soft p-6 text-center">
            <div className="text-3xl mb-3">📋</div>
            <div className="font-display text-[14px] font-bold uppercase tracking-wide text-ceuta-black">
              Alineación no disponible
            </div>
            <div className="mt-1 font-display text-[11px] uppercase tracking-wide text-ceuta-muted">
              Se publicará ~30 min antes del partido
            </div>
          </div>
        )}

        {!loading && lineup && <LineupField lineup={lineup} />}
      </div>
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
