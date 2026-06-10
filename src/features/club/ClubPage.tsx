"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { StandingEntry } from "@/domain/standings/Standings";
import { EstadisticasTab } from "./tabs/EstadisticasTab";
import { PlantillaTab } from "./tabs/PlantillaTab";
import { HistoriaTab } from "./tabs/HistoriaTab";
import type { Group, LeadersMap } from "./clubTypes";

const TABS = [
  { id: 'stats',     label: 'Estadísticas' },
  { id: 'plantilla', label: 'Plantilla' },
  { id: 'historia',  label: 'Historia' },
]

interface Props {
  grouped?: Group[]
  total?: number
  ceuta?: StandingEntry | null
  form?: string[]
  leaders?: LeadersMap | null
}

export function ClubPage({ grouped = [], total = 0, ceuta = null, form = [], leaders = null }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') ?? 'stats');

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams]);

  return (
    <div className="page">
      <div className="clas-hero-eyebrow px-4 pb-1.5 pt-5">Temporada 2025–26</div>
      <h1 className="font-display px-4 pb-3.5 text-[26px] font-black uppercase tracking-tight text-ceuta-black">
        AD CEUTA FC
      </h1>

      <div className="chips mb-3">
        {TABS.map(t => (
          <button key={t.id} className={`chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats'     && <EstadisticasTab ceuta={ceuta} form={form} leaders={leaders} />}
      {tab === 'plantilla' && <PlantillaTab grouped={grouped} total={total} loading={false} />}
      {tab === 'historia'  && <HistoriaTab />}

      <div className="h-2" />
    </div>
  );
}
