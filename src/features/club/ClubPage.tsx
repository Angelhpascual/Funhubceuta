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
      <div className="page-hero-full relative mt-2 flex min-h-[200px] flex-col justify-end overflow-hidden bg-ceuta-black px-[18px] pb-[40px] pt-[22px] text-white">
        {/* diagonal stripes */}
        <div
          className="pointer-events-none absolute bottom-0 right-[-30px] top-0 w-[230px] opacity-[0.07]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 12px, #0E0E0E 12px 24px)',
            clipPath: 'polygon(70px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        {/* ghost year */}
        <div className="pointer-events-none absolute right-[14px] top-[-6px] font-display text-[120px] font-black leading-[0.8] tracking-[-0.02em] text-white/[0.05]">
          1956
        </div>
        <div className="relative flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          Orgullo caballa
        </div>
        <div className="relative mt-[10px] font-display text-[40px] font-black uppercase leading-[0.95]">
          70 años de <em className="not-italic text-ceuta-gold">fútbol</em> en Ceuta
        </div>
        <div className="relative mt-3 text-[14px] leading-[1.5] text-white/70">
          Del primer balón que rodó frente al Estrecho al debut en el fútbol profesional.
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
