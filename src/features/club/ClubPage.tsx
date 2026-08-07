'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { StandingEntry } from '@/domain/standings/Standings'
import { EstadisticasTab } from './tabs/EstadisticasTab'
import { PlantillaTab } from './tabs/PlantillaTab'
import { HistoriaTab } from './tabs/HistoriaTab'
import { EstadioTab } from './tabs/EstadioTab'
import { CaballatiTab } from './tabs/CaballatiTab'
import type { Group, LeadersMap } from './clubTypes'

const TABS = [
  { id: 'stats', label: 'Estadísticas' },
  { id: 'plantilla', label: 'Plantilla' },
  { id: 'historia', label: 'Historia' },
  { id: 'estadio', label: 'Estadio' },
  { id: 'mascota', label: 'Mascota' },
]

interface Props {
  grouped?: Group[]
  total?: number
  previousGrouped?: Group[]
  previousTotal?: number
  ceuta?: StandingEntry | null
  ceutaPrevious?: StandingEntry | null
  form?: string[]
  leaders?: LeadersMap | null
  previousLeaders?: LeadersMap | null
}

export function ClubPage({
  grouped = [],
  total = 0,
  previousGrouped = [],
  previousTotal = 0,
  ceuta = null,
  ceutaPrevious = null,
  form = [],
  leaders = null,
  previousLeaders = null,
}: Props) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('tab') ?? 'stats')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  return (
    <>
      <div className="chips mt-4 mb-3">
        {TABS.map((t) => (
          <button type="button"
            key={t.id}
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <EstadisticasTab ceuta={ceuta} ceutaPrevious={ceutaPrevious} form={form} leaders={leaders} previousLeaders={previousLeaders} />}
      {tab === 'plantilla' && <PlantillaTab grouped={grouped} total={total} previousGrouped={previousGrouped} previousTotal={previousTotal} loading={false} />}
      {tab === 'historia' && <HistoriaTab />}
      {tab === 'estadio' && <EstadioTab />}
      {tab === 'mascota' && <CaballatiTab />}

      <div className="h-2" />
    </>
  )
}
