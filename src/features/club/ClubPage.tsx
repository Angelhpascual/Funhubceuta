"use client";

import { useState, useEffect } from "react";
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

export function ClubPage() {
  const [tab, setTab] = useState("stats");
  const [grouped, setGrouped] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ceuta, setCeuta] = useState<StandingEntry | null>(null);
  const [form, setForm] = useState<string[]>([]);
  const [leaders, setLeaders] = useState<LeadersMap | null>(null);

  useEffect(() => {
    fetch('/api/squad')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.grouped) setGrouped(d.grouped)
        if (d?.total) setTotal(d.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/standings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.entries) {
          const c = d.entries.find((e: StandingEntry) => e.teamName.toLowerCase().includes('ceuta'))
          if (c) setCeuta(c)
        }
      })
      .catch(() => {})

    fetch('/api/matches/results')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.form) setForm(d.form) })
      .catch(() => {})

    fetch('/api/stats/player-leaders')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.leaders) setLeaders(d.leaders) })
      .catch(() => {})
  }, [])

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
      {tab === 'plantilla' && <PlantillaTab grouped={grouped} total={total} loading={loading} />}
      {tab === 'historia'  && <HistoriaTab />}

      <div className="h-2" />
    </div>
  );
}
