'use client'

import { LineupPlayer, MatchEvent, MatchLineup } from '@/app/api/matches/lineup/route'
import { parseFormation, assignRows } from './lineupUtils'

function PlayerDot({ player }: { player: LineupPlayer }) {
  const isGK = player.positionAbbr === 'GK'
  const displayName = player.shortName
    .split(' ')
    .filter(w => w.length > 1 && !w.endsWith('.'))
    .pop() ?? player.shortName.split(' ').pop() ?? player.shortName

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* shadow ring */}
        <div className={`absolute -inset-[3px] rounded-full ${isGK ? 'bg-ceuta-red/40' : 'bg-black/30'} blur-[3px]`} />
        <div className={`relative flex size-[46px] items-center justify-center overflow-hidden rounded-full border-2 ${isGK ? 'border-ceuta-red bg-ceuta-red' : 'border-white bg-white/20'}`}>
          {player.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt={player.shortName}
              className="size-full object-cover object-top"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                const fallback = t.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <span
            className="font-display text-[15px] font-black text-white"
            style={{ display: player.photoUrl ? 'none' : 'flex' }}
          >
            {player.jersey}
          </span>
        </div>
        {/* dorsal badge */}
        <span className="absolute -bottom-1 -right-1 flex size-[17px] items-center justify-center rounded-full bg-ceuta-black ring-1 ring-white/30 font-display text-[8px] font-black text-white">
          {player.jersey}
        </span>
      </div>
      <span className="max-w-[58px] truncate text-center font-display text-[9px] font-black uppercase tracking-wide text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        {displayName}
      </span>
    </div>
  )
}

const EVENT_ICON: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  'yellow-card': '🟨',
  'red-card': '🟥',
  substitution: '🔄',
}
const EVENT_LABEL: Record<MatchEvent['type'], string> = {
  goal: 'Gol',
  'yellow-card': 'Amarilla',
  'red-card': 'Roja',
  substitution: 'Cambio',
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-ceuta-black px-4 py-3">
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 w-[60px]"
        style={{ background: 'repeating-linear-gradient(-45deg, white 0 7px, #0A0A0A 7px 14px)', clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%)' }}
      />
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-3 bg-ceuta-red" />
        <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-red">{title}</span>
      </div>
    </div>
  )
}

export function LineupField({ lineup }: { lineup: MatchLineup }) {
  const rows = assignRows(lineup.starters, lineup.formation)
  const events = [...(lineup.events ?? [])].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0))
  const highlights = events.filter(e => e.type !== 'substitution')
  const subs = events.filter(e => e.type === 'substitution')

  return (
    <div className="flex flex-col gap-4">

      {/* ── PITCH ── */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Once inicial · AD Ceuta FC
          </span>
          <span className="rounded-full bg-ceuta-black px-3 py-1 font-display text-[11px] font-black tracking-widest text-white">
            {lineup.formation}
          </span>
        </div>

        <div
          className="relative overflow-hidden rounded-[16px]"
          style={{
            background: '#1a7a1a',
            minHeight: 420,
          }}
        >
          {/* base grass */}
          <div className="absolute inset-0" style={{
            background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 22px, transparent 22px, transparent 44px)',
          }} />

          {/* pitch lines SVG */}
          <svg
            className="absolute inset-0 size-full"
            viewBox="0 0 100 160"
            preserveAspectRatio="none"
            style={{ opacity: 0.55 }}
          >
            {/* outer border */}
            <rect x="3" y="3" width="94" height="154" fill="none" stroke="white" strokeWidth="1.2" rx="0.5"/>
            {/* halfway line */}
            <line x1="3" y1="80" x2="97" y2="80" stroke="white" strokeWidth="0.8"/>
            {/* centre spot */}
            <circle cx="50" cy="80" r="1" fill="white"/>
            {/* centre circle */}
            <circle cx="50" cy="80" r="14" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* penalty area top */}
            <rect x="21" y="3" width="58" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* goal area top */}
            <rect x="35" y="3" width="30" height="10" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* penalty spot top */}
            <circle cx="50" cy="19" r="0.8" fill="white"/>
            {/* penalty area bottom */}
            <rect x="21" y="133" width="58" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* goal area bottom */}
            <rect x="35" y="147" width="30" height="10" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* penalty spot bottom */}
            <circle cx="50" cy="141" r="0.8" fill="white"/>
            {/* corner arcs */}
            <path d="M3,7 A4,4 0 0,0 7,3" fill="none" stroke="white" strokeWidth="0.7"/>
            <path d="M93,3 A4,4 0 0,0 97,7" fill="none" stroke="white" strokeWidth="0.7"/>
            <path d="M3,153 A4,4 0 0,0 7,157" fill="none" stroke="white" strokeWidth="0.7"/>
            <path d="M97,153 A4,4 0 0,0 93,157" fill="none" stroke="white" strokeWidth="0.7"/>
            {/* goals */}
            <rect x="40" y="0" width="20" height="3" fill="none" stroke="white" strokeWidth="0.7" opacity="0.6"/>
            <rect x="40" y="157" width="20" height="3" fill="none" stroke="white" strokeWidth="0.7" opacity="0.6"/>
          </svg>


          {/* players */}
          <div className="relative z-10 flex h-full flex-col justify-around px-3 py-5" style={{ minHeight: 420 }}>
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
        <div className="grid grid-cols-2 gap-3">

          {highlights.length > 0 && (
            <div className="overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
              <SectionHeader title="Goles y tarjetas" />
              <div className="divide-y divide-ceuta-border">
                {highlights.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2.5">
                    <span className="mt-0.5 w-7 shrink-0 font-display text-[11px] font-black text-ceuta-black">{ev.minute}</span>
                    <span className="mt-0.5 shrink-0 text-[13px]">{EVENT_ICON[ev.type]}</span>
                    <div className="min-w-0">
                      <div className="truncate font-display text-[12px] font-bold uppercase tracking-[0.02em] text-ceuta-black">
                        {ev.playerName}
                      </div>
                      <div className="font-display text-[9px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                        {EVENT_LABEL[ev.type]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subs.length > 0 && (
            <div className="overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
              <SectionHeader title="Cambios" />
              <div className="divide-y divide-ceuta-border">
                {subs.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2.5">
                    <span className="mt-0.5 w-7 shrink-0 font-display text-[11px] font-black text-ceuta-black">{ev.minute}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-ceuta-red">▲</span>
                        <span className="truncate font-display text-[12px] font-bold uppercase tracking-[0.02em] text-ceuta-black">{ev.playerName}</span>
                      </div>
                      {ev.playerOut && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-ceuta-muted">▼</span>
                          <span className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.02em] text-ceuta-muted">{ev.playerOut}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
