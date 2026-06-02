'use client'

import { LineupPlayer, MatchEvent, MatchLineup } from '@/app/api/matches/lineup/route'

// Formation string → rows of player counts bottom-to-top
// e.g. "4-2-3-1" → [1, 3, 2, 4] (GK always first)
function parseFormation(formation: string): number[] {
  const parts = formation.split('-').map(Number)
  return [1, ...parts.reverse()] // GK at bottom, attack at top
}

// Assign starters to rows based on formation
function assignRows(starters: LineupPlayer[], formation: string): LineupPlayer[][] {
  const rowCounts = parseFormation(formation)
  const rows: LineupPlayer[][] = []

  // Sort by position: GK first, then defenders, mids, forwards
  const ORDER: Record<string, number> = {
    GK: 0, LB: 1, CB: 1, RB: 1, DM: 2, CM: 2, LM: 2, RM: 2,
    CAM: 3, LW: 3, RW: 3, CF: 4, SUB: 99,
  }
  const sorted = [...starters].sort((a, b) =>
    (ORDER[a.positionAbbr] ?? 5) - (ORDER[b.positionAbbr] ?? 5)
  )

  let idx = 0
  for (const count of rowCounts) {
    rows.push(sorted.slice(idx, idx + count))
    idx += count
  }
  return rows
}

function PlayerDot({ player, highlight }: { player: LineupPlayer; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative flex size-10 items-center justify-center rounded-full border-2 ${highlight ? 'border-ceuta-red bg-ceuta-red' : 'border-white/60 bg-white/20'} backdrop-blur-sm`}>
        {player.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt={player.shortName}
            className="size-full rounded-full object-cover object-top"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="font-display text-[13px] font-black text-white">{player.jersey}</span>
        )}
        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-ceuta-black font-display text-[9px] font-black text-white">
          {player.jersey}
        </span>
      </div>
      <span className="max-w-[64px] truncate text-center font-display text-[9.5px] font-bold uppercase tracking-wide text-white drop-shadow-sm">
        {player.shortName.split(' ').pop()}
      </span>
    </div>
  )
}

const EVENT_ICONS: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  'yellow-card': '🟨',
  'red-card': '🟥',
}

function EventsSection({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => {
    const aMin = parseInt(a.minute) || 0
    const bMin = parseInt(b.minute) || 0
    return aMin - bMin
  })
  return (
    <div>
      <div className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">
        Eventos del partido
      </div>
      <div className="flex flex-col gap-1.5 rounded-xl border border-ceuta-border bg-ceuta-bg-soft p-3">
        {sorted.map((ev, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 shrink-0 font-display text-[10px] font-bold text-ceuta-muted">{ev.minute}&apos;</span>
            <span className="text-[13px]">{EVENT_ICONS[ev.type]}</span>
            <span className="font-display text-[12px] font-semibold uppercase tracking-wide text-ceuta-black">
              {ev.playerName.split(' ').pop()}
            </span>
            <span className="font-display text-[10px] text-ceuta-muted capitalize">
              {ev.type === 'goal' ? 'Gol' : ev.type === 'yellow-card' ? 'Amarilla' : 'Roja'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineupField({ lineup }: { lineup: MatchLineup }) {
  const rows = assignRows(lineup.starters, lineup.formation)
  const isCeuta = (p: LineupPlayer) =>
    ['Pedro López', 'Carlos Hernández', 'Kuki Zalazar', 'Marcos Fernández', 'Anuar', 'Aisar'].includes(p.name)

  return (
    <div className="flex flex-col gap-3">
      {/* Formation badge */}
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-ceuta-muted">
          AD Ceuta FC
        </span>
        <span className="rounded-full bg-ceuta-black px-3 py-1 font-display text-[12px] font-black tracking-widest text-white">
          {lineup.formation}
        </span>
      </div>

      {/* Pitch */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #2d7a2d 0%, #1e5c1e 100%)',
          minHeight: 380,
        }}
      >
        {/* Pitch markings */}
        <svg className="absolute inset-0 size-full opacity-20" viewBox="0 0 100 160" preserveAspectRatio="none">
          {/* Outer border */}
          <rect x="3" y="3" width="94" height="154" fill="none" stroke="white" strokeWidth="0.8"/>
          {/* Centre line */}
          <line x1="3" y1="80" x2="97" y2="80" stroke="white" strokeWidth="0.6"/>
          {/* Centre circle */}
          <circle cx="50" cy="80" r="14" fill="none" stroke="white" strokeWidth="0.6"/>
          {/* Penalty areas */}
          <rect x="23" y="3" width="54" height="22" fill="none" stroke="white" strokeWidth="0.6"/>
          <rect x="23" y="135" width="54" height="22" fill="none" stroke="white" strokeWidth="0.6"/>
          {/* Goal areas */}
          <rect x="36" y="3" width="28" height="10" fill="none" stroke="white" strokeWidth="0.6"/>
          <rect x="36" y="147" width="28" height="10" fill="none" stroke="white" strokeWidth="0.6"/>
        </svg>

        {/* Players — attack at top, GK at bottom */}
        <div className="relative z-10 flex h-full flex-col justify-around px-2 py-4" style={{ minHeight: 380 }}>
          {rows.map((row, ri) => (
            <div key={ri} className="flex items-center justify-around">
              {row.map((player, pi) => (
                <PlayerDot key={pi} player={player} highlight={player.positionAbbr === 'GK'} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Match events */}
      <EventsSection events={lineup.events ?? []} />

      {/* Bench */}
      {lineup.bench.length > 0 && (
        <div>
          <div className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">
            Suplentes
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lineup.bench.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-ceuta-border bg-ceuta-bg-soft px-2.5 py-1"
              >
                <span className="font-display text-[11px] font-black text-ceuta-muted">#{p.jersey}</span>
                <span className="font-display text-[11px] font-bold uppercase tracking-wide text-ceuta-black">
                  {p.shortName.split(' ').pop()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
