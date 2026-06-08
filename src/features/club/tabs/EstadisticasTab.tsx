"use client";

import React from "react";
import { StandingEntry } from "@/domain/standings/Standings";
import { Tile, TileValue, TileLabel } from "../components/ClubTiles";
import type { Leader, LeadersMap } from "../clubTypes";

function StatLeaderSection({ title, icon, leaders, max }: {
  title: string
  icon: string
  leaders: Leader[]
  max: number
}) {
  return (
    <div className="mx-3 mb-2 rounded-[14px] bg-ceuta-bg-soft p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[13px]">{icon}</span>
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {leaders.map((l, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className={`w-3.5 shrink-0 font-display text-[11px] font-black ${i === 0 ? 'text-ceuta-red' : 'text-ceuta-muted'}`}>{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.photo} alt={l.name}
              className={`size-8 shrink-0 rounded-full object-cover object-top ${i === 0 ? 'outline outline-2 outline-ceuta-red outline-offset-1' : ''}`}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[12px] font-bold text-ceuta-black">{l.name}</div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-sm bg-black/10">
                <div
                  className={`h-full rounded-sm ${i === 0 ? 'bg-ceuta-red' : 'bg-black/25'}`}
                  style={{ width: `${Math.round((l.value / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className={`shrink-0 font-display text-[18px] font-black ${i === 0 ? 'text-ceuta-black' : 'text-ceuta-muted'}`}>{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getZoneLabel(pos: number): string {
  if (pos <= 2) return 'Ascenso directo'
  if (pos <= 6) return 'Zona play-off'
  if (pos >= 19) return 'Zona descenso'
  return 'Zona media'
}

const STAT_TILES = [
  { key: 'played',        label: 'Partidos jugados' },
  { key: 'won',           label: 'Victorias' },
  { key: 'drawn',         label: 'Empates' },
  { key: 'lost',          label: 'Derrotas' },
  { key: 'goalsFor',      label: 'Goles a favor' },
  { key: 'goalsAgainst',  label: 'Goles en contra' },
  { key: 'goalDiff',      label: 'Diferencia de goles' },
] as const

export function EstadisticasTab({ ceuta, form, leaders }: {
  ceuta: StandingEntry | null
  form: string[]
  leaders: LeadersMap | null
}) {
  const goalDiff = ceuta
    ? (ceuta.goalDifference > 0 ? `+${ceuta.goalDifference}` : ceuta.goalDifference)
    : '—'

  const tileValues: Record<string, unknown> = {
    played: ceuta?.played, won: ceuta?.won, drawn: ceuta?.drawn, lost: ceuta?.lost,
    goalsFor: ceuta?.goalsFor, goalsAgainst: ceuta?.goalsAgainst, goalDiff,
  }

  return (
    <>
      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        <Tile className="min-h-[110px] bg-ceuta-red">
          <TileValue className="text-[54px] text-white">
            {ceuta?.position ?? '—'}<span className="align-super text-[22px]">º</span>
          </TileValue>
          <TileLabel className="text-white/75">{ceuta ? getZoneLabel(ceuta.position) : 'Clasificación'}</TileLabel>
        </Tile>
        <Tile className="min-h-[110px] bg-ceuta-black">
          <TileValue className="text-[54px] text-white">{ceuta?.points ?? '—'}</TileValue>
          <TileLabel className="text-white/75">Puntos</TileLabel>
        </Tile>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        {STAT_TILES.map(({ key, label }) => (
          <Tile key={key}>
            <TileValue className="text-[42px] text-ceuta-black">{(tileValues[key] as React.ReactNode) ?? '—'}</TileValue>
            <TileLabel className="text-ceuta-muted">{label}</TileLabel>
          </Tile>
        ))}
        {form.length > 0 && (
          <Tile>
            <div className="flex flex-wrap gap-1">
              {form.slice(-5).map((f, i) => <div key={i} className={`form-pill ${f}`}>{f}</div>)}
            </div>
            <TileLabel className="text-ceuta-muted">Últimos 5</TileLabel>
          </Tile>
        )}
      </div>

      {leaders ? (
        ['appearances', 'goals', 'assists', 'shots', 'shots_on_target', 'saves', 'yellow_cards', 'red_cards']
          .map(key => leaders[key])
          .filter(Boolean)
          .map(cat => (
            <StatLeaderSection key={cat.label} title={cat.label} icon={cat.icon} leaders={cat.leaders} max={cat.leaders[0]?.value ?? 1} />
          ))
      ) : (
        <p className="mx-3 py-6 text-center font-display text-[10px] uppercase tracking-widest text-ceuta-muted">
          No hay estadísticas disponibles
        </p>
      )}
    </>
  )
}
