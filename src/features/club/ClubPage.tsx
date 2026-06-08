"use client";

import { useState } from "react";
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
  initialGrouped?: Group[]
  initialTotal?: number
  initialCeuta?: StandingEntry | null
  initialForm?: string[]
  initialLeaders?: LeadersMap | null
}

export function ClubPage({ initialGrouped = [], initialTotal = 0, initialCeuta = null, initialForm = [], initialLeaders = null }: Props) {
  const [tab, setTab] = useState("stats");
  const grouped = initialGrouped
  const total = initialTotal
  const ceuta = initialCeuta
  const form = initialForm
  const leaders = initialLeaders

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
