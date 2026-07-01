'use client'

import React, { useState } from 'react'
import { StandingEntry } from '@/domain/standings/Standings'
import { Tile, TileValue, TileLabel } from '../components/ClubTiles'
import type { Leader, LeadersMap } from '../clubTypes'

function StatLeaderSection({
  title,
  icon,
  leaders,
  max,
}: {
  title: string
  icon: string
  leaders: Leader[]
  max: number
}) {
  return (
    <div className="mx-3 mb-2 rounded-[14px] bg-ceuta-bg-soft p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[13px]">{icon}</span>
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {leaders.map((l, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className={`w-3.5 shrink-0 font-display text-[11px] font-black ${i === 0 ? 'text-ceuta-red' : 'text-ceuta-muted'}`}
            >
              {i + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.photo}
              alt={l.name}
              className={`size-8 shrink-0 rounded-full object-cover object-top ${i === 0 ? 'outline outline-2 outline-ceuta-red outline-offset-1' : ''}`}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[12px] font-bold text-ceuta-black">
                {l.name}
              </div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-sm bg-black/10">
                <div
                  className={`h-full rounded-sm ${i === 0 ? 'bg-ceuta-red' : 'bg-black/25'}`}
                  style={{ width: `${Math.round((l.value / max) * 100)}%` }}
                />
              </div>
            </div>
            <span
              className={`shrink-0 font-display text-[18px] font-black ${i === 0 ? 'text-ceuta-black' : 'text-ceuta-muted'}`}
            >
              {l.value}
            </span>
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
  { key: 'played', label: 'Partidos jugados' },
  { key: 'won', label: 'Victorias' },
  { key: 'drawn', label: 'Empates' },
  { key: 'lost', label: 'Derrotas' },
  { key: 'goalsFor', label: 'Goles a favor' },
  { key: 'goalsAgainst', label: 'Goles en contra' },
  { key: 'goalDiff', label: 'Diferencia de goles' },
] as const

export function EstadisticasTab({
  ceuta,
  ceutaPrevious,
  form,
  leaders,
  previousLeaders,
}: {
  ceuta: StandingEntry | null
  ceutaPrevious?: StandingEntry | null
  form: string[]
  leaders: LeadersMap | null
  previousLeaders?: LeadersMap | null
}) {
  const [season, setSeason] = useState<'2526' | '2627'>('2526')

  const activeCeuta = season === '2526' ? ceutaPrevious : null
  const activeLeaders = season === '2526' ? leaders : null
  const activeForm = season === '2526' ? form : []

  const goalDiff = activeCeuta
    ? activeCeuta.goalDifference > 0
      ? `+${activeCeuta.goalDifference}`
      : activeCeuta.goalDifference
    : '—'

  const tileValues: Record<string, unknown> = {
    played: activeCeuta?.played,
    won: activeCeuta?.won,
    drawn: activeCeuta?.drawn,
    lost: activeCeuta?.lost,
    goalsFor: activeCeuta?.goalsFor,
    goalsAgainst: activeCeuta?.goalsAgainst,
    goalDiff,
  }

  if (season === '2627') {
    return (
      <>
        <div className="chips mb-2 mt-1 px-3">
          <button className="chip" onClick={() => setSeason('2526')}>Temp. 25/26</button>
          <button className="chip active" onClick={() => setSeason('2627')}>Temp. 26/27</button>
        </div>
        <div className="flex flex-col items-center gap-3 px-3 py-12">
          <span className="text-3xl">🔜</span>
          <p className="font-display text-[13px] font-bold uppercase tracking-widest text-ceuta-muted text-center">
            Sin datos por el momento
          </p>
          <p className="font-body text-[12px] text-ceuta-muted text-center">
            La temporada 26/27 aún no ha comenzado
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── SEASON SELECTOR ── */}
      <div className="chips mb-2 mt-1 px-3">
        <button className="chip active" onClick={() => setSeason('2526')}>Temp. 25/26</button>
        <button className="chip" onClick={() => setSeason('2627')}>Temp. 26/27</button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        <Tile className="min-h-[110px] bg-ceuta-red">
          <TileValue className="text-[54px] text-white">
            {activeCeuta?.position ?? '—'}
            <span className="align-super text-[22px]">º</span>
          </TileValue>
          <TileLabel className="text-white/75">
            {activeCeuta ? getZoneLabel(activeCeuta.position) : 'Clasificación'}
          </TileLabel>
        </Tile>
        <Tile className="min-h-[110px] bg-ceuta-black">
          <TileValue className="text-[54px] text-white">{activeCeuta?.points ?? '—'}</TileValue>
          <TileLabel className="text-white/75">Puntos</TileLabel>
        </Tile>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        {STAT_TILES.map(({ key, label }) => (
          <Tile key={key}>
            <TileValue className="text-[42px] text-ceuta-black">
              {(tileValues[key] as React.ReactNode) ?? '—'}
            </TileValue>
            <TileLabel className="text-ceuta-muted">{label}</TileLabel>
          </Tile>
        ))}
        <Tile>
          {activeForm.length > 0 && (activeCeuta?.played ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-1">
              {activeForm.slice(-5).map((f, i) => (
                <div key={i} className={`form-pill ${f}`}>{f}</div>
              ))}
            </div>
          ) : (
            <TileValue className="text-[42px] text-ceuta-black">–</TileValue>
          )}
          <TileLabel className="text-ceuta-muted">Últimos 5</TileLabel>
        </Tile>
      </div>

      {activeLeaders ? (
        ['appearances', 'goals', 'assists', 'shots', 'shots_on_target', 'saves', 'yellow_cards', 'red_cards']
          .map((key) => activeLeaders[key])
          .filter(Boolean)
          .map((cat) => (
            <StatLeaderSection
              key={cat.label}
              title={cat.label}
              icon={cat.icon}
              leaders={cat.leaders}
              max={cat.leaders[0]?.value ?? 1}
            />
          ))
      ) : (
        <p className="mx-3 py-6 text-center font-display text-[10px] uppercase tracking-widest text-ceuta-muted">
          No hay estadísticas disponibles
        </p>
      )}
    </>
  )
}
