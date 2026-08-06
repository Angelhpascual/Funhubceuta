'use client'

import React, { useState } from 'react'
import { StandingEntry } from '@/domain/standings/Standings'
import type { LeadersMap } from '../clubTypes'

const LB_KEYS = [
  { key: 'goals',           label: 'Goles',       unit: '⚽ Goles en liga' },
  { key: 'assists',         label: 'Asistencias', unit: '🎯 Asistencias' },
  { key: 'appearances',    label: 'Partidos',     unit: '🏟️ Partidos jugados' },
  { key: 'shots',          label: 'Tiros',        unit: '💥 Tiros totales' },
  { key: 'shots_on_target', label: 'A puerta',    unit: '🎳 Tiros a puerta' },
  { key: 'saves',          label: 'Paradas',      unit: '🧤 Paradas' },
  { key: 'yellow_cards',   label: 'Amarillas',    unit: '🟨 Tarjetas amarillas' },
  { key: 'red_cards',      label: 'Rojas',        unit: '🟥 Tarjetas rojas' },
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function getZoneLabel(pos: number) {
  if (pos <= 2) return 'Ascenso directo'
  if (pos <= 6) return 'Zona play-off'
  if (pos >= 19) return 'Zona descenso'
  return 'Zona media'
}

function GoalsBar({ value, max, variant }: { value: number; max: number; variant: 'black' | 'red' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mt-1.5 h-[8px] overflow-hidden rounded-full bg-[var(--bg-mid)]">
      <div
        className={`h-full rounded-full ${variant === 'black' ? 'bg-[var(--black)]' : 'bg-[var(--red)]'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Leaderboard({ leaders }: { leaders: LeadersMap }) {
  const [activeKey, setActiveKey] = useState('goals')
  const visibleKeys = LB_KEYS.filter(({ key }) => leaders[key]?.leaders?.length)
  if (visibleKeys.length === 0) return null
  const active = visibleKeys.find(k => k.key === activeKey) ?? visibleKeys[0]
  const cat = leaders[active.key]
  const top = cat?.leaders[0]
  const rest = cat?.leaders.slice(1) ?? []
  const max = top?.value ?? 1

  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--white)]">
      {/* Tabs — scrollable */}
      <div className="flex overflow-x-auto border-b border-[var(--border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleKeys.map(({ key, label }) => (
          <button type="button"
            key={key}
            onClick={() => setActiveKey(key)}
            className={[
              'relative shrink-0 px-4 py-3.5 font-display text-[11px] font-bold uppercase tracking-wide transition-colors',
              key === active.key
                ? 'text-[var(--black)] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:rounded-t-[3px] after:bg-[var(--red)] after:content-[""]'
                : 'text-[var(--muted)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-[20px] font-black uppercase tracking-tight text-[var(--black)]">
            {active.unit}
          </h3>
          <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Temp. 25/26
          </span>
        </div>

        {/* Featured #1 */}
        {top && (
          <div className="relative mb-3 flex items-center gap-3 overflow-hidden rounded-[12px] bg-[var(--black)] p-4">
            <div className="absolute right-0 top-0 h-full w-24 opacity-[0.06]"
              style={{ background: 'repeating-linear-gradient(-45deg,#fff 0 10px,transparent 10px 20px)' }} />
            <span className="relative font-display text-[18px] font-black text-[var(--red)]">1</span>
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--red)] bg-[#1c1c1c]">
              {top.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={top.photo} alt={top.name} className="size-full object-cover object-top" />
              ) : (
                <span className="font-display text-[15px] font-black text-white">{initials(top.name)}</span>
              )}
            </div>
            <div className="relative min-w-0 flex-1">
              <p className="truncate font-display text-[17px] font-black uppercase tracking-tight text-white">
                {top.name}
              </p>
            </div>
            <span className="relative font-display text-[44px] font-black leading-none text-white">{top.value}</span>
          </div>
        )}

        {/* Rows 2–5 */}
        <div className="flex flex-col">
          {rest.map((r, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--border)] py-3 last:border-0">
              <span className="w-5 shrink-0 text-center font-display text-[13px] font-black text-[var(--muted-2)]">
                {i + 2}
              </span>
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-mid)]">
                {r.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo} alt={r.name} className="size-full object-cover object-top" />
                ) : (
                  <span className="font-display text-[11px] font-black text-[var(--muted)]">{initials(r.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[13px] font-bold uppercase tracking-tight text-[var(--black)]">
                  {r.name}
                </p>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-[var(--bg-mid)]">
                  <div
                    className="h-full rounded-full bg-[var(--black)]"
                    style={{ width: `${Math.round((r.value / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-10 shrink-0 text-right font-display text-[20px] font-black text-[var(--black)]">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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

  const activeCeuta   = season === '2526' ? ceutaPrevious ?? null : null
  const activeLeaders = season === '2526' ? (leaders ?? previousLeaders) : null
  const activeForm    = season === '2526' ? form : []

  /* ─── 26/27 empty state ─── */
  if (season === '2627') {
    return (
      <div className="pb-8">
        {/* Season chips */}
        <div className="chips chips-center mb-4 mt-1 px-3">
          <button type="button" className="chip" onClick={() => setSeason('2526')}>Temp. 25/26</button>
          <button type="button" className="chip active" onClick={() => setSeason('2627')}>Temp. 26/27</button>
        </div>

        {/* Pre-season hero */}
        <div className="relative mx-3 overflow-hidden rounded-[16px] bg-[var(--black)] p-6 shadow-[6px_6px_0_var(--red)]">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-40 opacity-[0.06]"
            style={{ background: 'repeating-linear-gradient(-45deg,#fff 0 16px,transparent 16px 32px)', clipPath: 'polygon(60px 0,100% 0,100% 100%,0 100%)' }} />
          <div className="relative">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--red)]">
              Temporada 2026–27
            </p>
            <h2 className="mt-2 font-display text-[36px] font-black uppercase leading-[0.92] text-white">
              LA NUEVA<br /><span className="text-[var(--gold)]">TEMPORADA</span><br />ESTÁ A PUNTO.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">
              Todavía no se ha disputado ningún partido oficial. En cuanto ruede el balón verás el balance jornada a jornada.
            </p>
            <button type="button"
              onClick={() => setSeason('2526')}
              className="mt-5 flex items-center gap-2 rounded-[10px] bg-[var(--red)] px-5 py-3 font-display text-[12px] font-bold uppercase tracking-wide text-white"
            >
              Ver balance de la 25/26
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ─── 25/26 full stats ─── */
  const c = activeCeuta
  const gfMax = Math.max(c?.goalsFor ?? 0, c?.goalsAgainst ?? 0, 1)
  const totalGames = (c?.played ?? 0)
  // WDL: Victoria=blanco, Empate=negro, Derrota=rojo (--win/--draw/--loss)
  const lossPct  = totalGames > 0 ? ((c?.lost  ?? 0) / totalGames) * 360 : 0
  const wdPct    = totalGames > 0 ? (((c?.lost ?? 0) + (c?.drawn ?? 0)) / totalGames) * 360 : 0

  const goalDiffStr = c
    ? (c.goalDifference > 0 ? `+${c.goalDifference}` : String(c.goalDifference))
    : '—'

  // Protagonistas: top scorer, top assister, top keeper
  const al = activeLeaders
  const topScorer  = al?.goals?.leaders?.[0]    ?? null
  const topAssist  = al?.assists?.leaders?.[0]  ?? null
  const topKeeper  = al?.saves?.leaders?.[0]    ?? null

  const protagonistas = [
    topScorer  && { label: 'Máximo goleador',  sub: `${topScorer.value} goles`,     player: topScorer,  gold: true  },
    topAssist  && { label: 'Máx. asistente',   sub: `${topAssist.value} asistencias`, player: topAssist, gold: false },
    topKeeper  && { label: 'La muralla',        sub: `${topKeeper.value} paradas`,    player: topKeeper,  gold: false },
  ].filter(Boolean) as { label: string; sub: string; player: typeof topScorer; gold: boolean }[]

  return (
    <div className="pb-8">
      {/* ── Season chips ── */}
      <div className="chips chips-center mb-4 mt-1 px-3">
        <button type="button" className="chip active" onClick={() => setSeason('2526')}>Temp. 25/26</button>
        <button type="button" className="chip" onClick={() => setSeason('2627')}>Temp. 26/27</button>
      </div>

      <div className="flex flex-col gap-3 px-3">

        {/* ── HERO SUMMARY CARD ── */}
        <div className="relative overflow-hidden rounded-[16px] bg-[var(--black)] p-5 shadow-[6px_6px_0_var(--red)]">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-36 opacity-[0.06]"
            style={{ background: 'repeating-linear-gradient(-45deg,#fff 0 12px,transparent 12px 24px)' }} />
          <div className="relative">
            {/* Position */}
            <div className="flex items-end gap-3">
              <span className="font-display text-[80px] font-black leading-[0.85] text-white">
                {c?.position ?? '—'}<sup className="align-super text-[30px]">º</sup>
              </span>
              <div className="pb-2">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
                  {c ? getZoneLabel(c.position) : ''}
                </p>
                <p className="mt-0.5 text-[12px] text-white/50">
                  Liga Hypermotion · Temp. 25/26
                </p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { v: c?.played ?? '—', l: 'Jugados' },
                { v: c?.won    ?? '—', l: 'Victorias' },
                { v: c?.lost   ?? '—', l: 'Derrotas' },
              ].map(({ v, l }) => (
                <div key={l} className="rounded-[10px] bg-white/[0.06] p-3">
                  <span className="block font-display text-[24px] font-black leading-none text-white">{v}</span>
                  <span className="mt-1 block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/50">{l}</span>
                </div>
              ))}
            </div>

            {/* Points */}
            <div className="mt-4 flex items-baseline gap-2 border-t border-white/[0.12] pt-4">
              <span className="font-display text-[40px] font-black leading-none text-white">{c?.points ?? '—'}</span>
              <span className="font-display text-[12px] font-bold uppercase tracking-[0.14em] text-white/55">Puntos</span>
            </div>
          </div>
        </div>

        {/* ── WDL + GOALS (2 col) ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* WDL card */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--white)] p-4">
            <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Resultados · {c?.played ?? 0} PJ
            </p>

            {/* Donut: derrota=rojo, empate=negro, victoria=borde-suave (blanco puro sería invisible sobre fondo blanco) */}
            <div className="relative mx-auto mb-4 size-[90px] rounded-full"
              style={{ background: `conic-gradient(var(--loss) 0deg ${lossPct}deg, var(--draw) ${lossPct}deg ${wdPct}deg, var(--border) ${wdPct}deg 360deg)` }}>
              <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="font-display text-[20px] font-black leading-none">{c?.played ?? 0}</span>
                <span className="font-display text-[7px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">PJ</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Victorias', val: c?.won   ?? 0, color: 'var(--win)',  border: true  },
                { label: 'Empates',   val: c?.drawn ?? 0, color: 'var(--draw)', border: false },
                { label: 'Derrotas',  val: c?.lost  ?? 0, color: 'var(--loss)', border: false },
              ].map(({ label, val, color, border }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="size-[9px] shrink-0 rounded-[2px]" style={{ background: color, border: border ? '1.5px solid var(--black)' : 'none' }} />
                  <span className="flex-1 font-display text-[11px] font-bold uppercase tracking-wide text-[var(--black)]">{label}</span>
                  <span className="font-display text-[15px] font-black">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals card */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--white)] p-4">
            <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Goles</p>

            <div className="mb-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">A favor</span>
                <span className="font-display text-[20px] font-black">{c?.goalsFor ?? 0}</span>
              </div>
              <GoalsBar value={c?.goalsFor ?? 0} max={gfMax} variant="black" />
            </div>

            <div className="mb-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">En contra</span>
                <span className="font-display text-[20px] font-black">{c?.goalsAgainst ?? 0}</span>
              </div>
              <GoalsBar value={c?.goalsAgainst ?? 0} max={gfMax} variant="red" />
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t border-[var(--border)] pt-3">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Diferencia</span>
              <span className={`font-display text-[22px] font-black ${(c?.goalDifference ?? 0) >= 0 ? 'text-[var(--black)]' : 'text-[var(--red)]'}`}>
                {goalDiffStr}
              </span>
            </div>
          </div>
        </div>

        {/* ── FORM CARD ── */}
        {activeForm.length > 0 && (
          <div className="flex items-center gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--white)] px-4 py-4">
            <div>
              <p className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Últimos 5</p>
              <div className="flex gap-1.5">
                {activeForm.slice(-5).map((f, i) => {
                  const label = f === 'W' ? 'V' : f === 'L' ? 'D' : 'E'
                  return (
                    <div
                      key={i}
                      className={`form-pill ${f} flex size-9 items-center justify-center rounded-[8px] font-display text-[14px] font-black`}
                    >
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PROTAGONISTAS ── */}
        {protagonistas.length > 0 && (
          <>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="size-[13px] shrink-0 rounded-[3px] bg-[var(--black)]" />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--black)]">
                Los protagonistas de la 25/26
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {protagonistas.map(({ label, sub, player, gold }) => (
                <div
                  key={label}
                  className={`relative flex items-center gap-4 overflow-hidden rounded-[14px] border bg-[var(--white)] p-4 ${gold ? 'border-[var(--gold)]' : 'border-[var(--border)]'}`}
                >
                  {/* Left accent bar */}
                  <span
                    className={`absolute left-0 top-0 h-full w-[5px] ${gold ? 'bg-[var(--gold)]' : 'bg-[var(--red)]'}`}
                  />

                  {/* Avatar */}
                  <div
                    className={`ml-2 flex size-[56px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-[var(--bg-mid)] ${gold ? 'border-[var(--gold)]' : 'border-[var(--border)]'}`}
                  >
                    {player?.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photo} alt={player.name} className="size-full object-cover object-top" />
                    ) : (
                      <span className="font-display text-[18px] font-black text-[var(--muted)]">
                        {initials(player?.name ?? '')}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`font-display text-[10px] font-bold uppercase tracking-[0.14em] ${gold ? 'text-[#7A6100]' : 'text-[var(--red)]'}`}>
                      {label}
                    </p>
                    <p className="truncate font-display text-[19px] font-black uppercase leading-tight text-[var(--black)]">
                      {player?.name ?? '—'}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">{sub}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="block font-display text-[42px] font-black leading-none text-[var(--black)]">
                      {player?.value ?? '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LEADERBOARD ── */}
        {activeLeaders && (
          <>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="size-[13px] shrink-0 rounded-[3px] bg-[var(--red)]" />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
                Rankings individuales
              </span>
            </div>
            <Leaderboard leaders={activeLeaders} />
          </>
        )}

        {!activeLeaders && (
          <p className="py-6 text-center font-display text-[10px] uppercase tracking-widest text-[var(--muted)]">
            No hay estadísticas disponibles
          </p>
        )}
      </div>
    </div>
  )
}
