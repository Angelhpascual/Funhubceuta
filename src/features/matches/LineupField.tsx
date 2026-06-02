'use client'

import { LineupPlayer, MatchEvent, MatchLineup } from '@/app/api/matches/lineup/route'

// Returns row counts top→bottom: attack first, GK last
// e.g. "4-2-3-1" → [1, 3, 2, 4, 1]
function parseFormation(formation: string): number[] {
  const parts = formation.split('-').map(Number)
  return [...parts.reverse(), 1]
}

const ORDER: Record<string, number> = {
  GK: 0, LB: 1, CB: 1, RB: 1, DM: 2, CM: 2, LM: 2, RM: 2,
  CAM: 3, LW: 3, RW: 3, CF: 4, SUB: 99,
}

function assignRows(starters: LineupPlayer[], formation: string): LineupPlayer[][] {
  const rowCounts = parseFormation(formation)
  const rows: LineupPlayer[][] = []

  // Sort attack→GK (descending order value)
  const sorted = [...starters].sort((a, b) =>
    (ORDER[b.positionAbbr] ?? 5) - (ORDER[a.positionAbbr] ?? 5)
  )

  let idx = 0
  for (const count of rowCounts) {
    rows.push(sorted.slice(idx, idx + count))
    idx += count
  }
  return rows
}

function PlayerDot({ player }: { player: LineupPlayer }) {
  const isGK = player.positionAbbr === 'GK'
  // Show last surname (skip initials like "R." at the start)
  const displayName = player.shortName
    .split(' ')
    .filter(w => w.length > 1 && !w.endsWith('.'))
    .pop() ?? player.shortName.split(' ').pop() ?? player.shortName

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`relative flex size-11 items-center justify-center overflow-hidden rounded-full border-2 ${isGK ? 'border-ceuta-red bg-ceuta-red' : 'border-white/70 bg-white/15'} backdrop-blur-sm`}>
        {player.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt={player.shortName}
            className="size-full rounded-full object-cover object-top"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              const fallback = t.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <span
          className="font-display text-[14px] font-black text-white"
          style={{ display: player.photoUrl ? 'none' : 'flex' }}
        >
          {player.jersey}
        </span>
        <span className="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-ceuta-black font-display text-[9px] font-black text-white">
          {player.jersey}
        </span>
      </div>
      <span className="max-w-[60px] truncate text-center font-display text-[9px] font-bold uppercase tracking-wide text-white drop-shadow">
        {displayName}
      </span>
    </div>
  )
}

const EVENT_ICON: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  'yellow-card': '🟨',
  'red-card': '🟥',
}
const EVENT_LABEL: Record<MatchEvent['type'], string> = {
  goal: 'Gol',
  'yellow-card': 'Amarilla',
  'red-card': 'Roja',
}

export function LineupField({ lineup }: { lineup: MatchLineup }) {
  const rows = assignRows(lineup.starters, lineup.formation)
  const events = [...(lineup.events ?? [])].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0))

  return (
    <div className="flex flex-col gap-4">

      {/* ── PITCH ── */}
      <div>
        {/* formation badge */}
        <div className="mb-2.5 flex items-center justify-between px-1">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Once inicial · AD Ceuta FC
          </span>
          <span className="rounded-full bg-ceuta-black px-3 py-1 font-display text-[11px] font-black tracking-widest text-white">
            {lineup.formation}
          </span>
        </div>

        <div
          className="relative overflow-hidden rounded-[14px]"
          style={{ background: 'linear-gradient(180deg, #2a7a2a 0%, #1a561a 100%)', minHeight: 380 }}
        >
          {/* pitch lines */}
          <svg className="absolute inset-0 size-full opacity-[0.18]" viewBox="0 0 100 160" preserveAspectRatio="none">
            <rect x="3" y="3" width="94" height="154" fill="none" stroke="white" strokeWidth="0.8"/>
            <line x1="3" y1="80" x2="97" y2="80" stroke="white" strokeWidth="0.6"/>
            <circle cx="50" cy="80" r="14" fill="none" stroke="white" strokeWidth="0.6"/>
            <rect x="23" y="3" width="54" height="22" fill="none" stroke="white" strokeWidth="0.6"/>
            <rect x="23" y="135" width="54" height="22" fill="none" stroke="white" strokeWidth="0.6"/>
            <rect x="36" y="3" width="28" height="10" fill="none" stroke="white" strokeWidth="0.6"/>
            <rect x="36" y="147" width="28" height="10" fill="none" stroke="white" strokeWidth="0.6"/>
          </svg>

          <div className="relative z-10 flex h-full flex-col justify-around px-2 py-5" style={{ minHeight: 380 }}>
            {rows.map((row, ri) => (
              <div key={ri} className="flex items-center justify-around">
                {row.map((player, pi) => (
                  <PlayerDot key={pi} player={player} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <div className="overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
          {/* header */}
          <div className="relative overflow-hidden bg-ceuta-black px-[18px] py-[14px]">
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-[80px]"
              style={{ background: 'repeating-linear-gradient(-45deg, white 0 8px, #0A0A0A 8px 16px)', clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-[14px] bg-ceuta-red" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
                Eventos del partido
              </span>
            </div>
          </div>

          {/* event rows */}
          <div className="divide-y divide-ceuta-border">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 px-[18px] py-[13px]">
                <span className="w-7 shrink-0 font-display text-[13px] font-black text-ceuta-black">
                  {ev.minute}
                </span>
                <span className="text-[16px]">{EVENT_ICON[ev.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-display text-[14px] font-bold uppercase tracking-[0.02em] text-ceuta-black">
                    {ev.playerName}
                  </div>
                  <div className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                    {EVENT_LABEL[ev.type]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BENCH ── */}
      {lineup.bench.length > 0 && (
        <div className="overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
          <div className="relative overflow-hidden bg-ceuta-black px-[18px] py-[14px]">
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-[80px]"
              style={{ background: 'repeating-linear-gradient(-45deg, white 0 8px, #0A0A0A 8px 16px)', clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-[14px] bg-ceuta-red" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
                Suplentes
              </span>
            </div>
          </div>
          <div className="divide-y divide-ceuta-border">
            {lineup.bench.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-[18px] py-[11px]">
                <span className="w-7 shrink-0 text-center font-display text-[13px] font-black text-ceuta-muted">
                  #{p.jersey}
                </span>
                <span className="font-display text-[14px] font-bold uppercase tracking-[0.02em] text-ceuta-black">
                  {p.shortName}
                </span>
                <span className="ml-auto font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-ceuta-muted">
                  {p.position}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
