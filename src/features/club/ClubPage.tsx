'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { StandingEntry } from '@/domain/standings/Standings'
import { EstadisticasTab } from './tabs/EstadisticasTab'
import { PlantillaTab } from './tabs/PlantillaTab'
import { HistoriaTab } from './tabs/HistoriaTab'
import type { Group, LeadersMap } from './clubTypes'

const TABS = [
  { id: 'stats', label: 'Estadísticas' },
  { id: 'plantilla', label: 'Plantilla' },
  { id: 'historia', label: 'Historia' },
]

interface Props {
  grouped?: Group[]
  total?: number
  ceuta?: StandingEntry | null
  form?: string[]
  leaders?: LeadersMap | null
}

export function ClubPage({
  grouped = [],
  total = 0,
  ceuta = null,
  form = [],
  leaders = null,
}: Props) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('tab') ?? 'stats')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  return (
    <div className="page">
      {/* ── HERO ── */}
      <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Temporada 2025–26
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          AD CEUTA <em className="not-italic text-ceuta-gold">FC</em>
          <br />
          <span className="text-[28px]">EL CLUB</span>
        </div>
      </div>

      <div className="chips mt-4 mb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <EstadisticasTab ceuta={ceuta} form={form} leaders={leaders} />}
      {tab === 'plantilla' && <PlantillaTab grouped={grouped} total={total} loading={false} />}
      {tab === 'historia' && <HistoriaTab />}

      <div className="h-2" />
    </div>
  )
}
