'use client'

import { useEffect, useRef, useState } from 'react'
import type { LiveMatch, LineupPlayer as LiveLineupPlayer } from '@/domain/match/LiveMatch'
import type { MatchLineup, LineupPlayer } from '@/domain/match/Lineup'
import { LineupField } from '@/features/matches/LineupField'
import { MatchBoard } from '@/components/ui/MatchBoard'

// Convierte la alineación live (posiciones simples) al formato que espera LineupField
function toMatchLineup(players: LiveLineupPlayer[]): MatchLineup {
  const starters: LineupPlayer[] = players.filter(p => p.starter).map(p => ({
    name: p.name,
    shortName: p.name.split(' ').pop() ?? p.name,
    jersey: p.jersey,
    position: p.position,
    positionAbbr: p.position === 'AM' ? 'CAM' : p.position,
    starter: true,
    photoUrl: p.photoUrl ?? null,
  }))
  const bench: LineupPlayer[] = players.filter(p => !p.starter).map(p => ({
    name: p.name,
    shortName: p.name.split(' ').pop() ?? p.name,
    jersey: p.jersey,
    position: p.position,
    positionAbbr: p.position,
    starter: false,
    photoUrl: p.photoUrl ?? null,
  }))

  const defs = starters.filter(p => ['CB','RB','LB','WB'].includes(p.positionAbbr)).length
  const mids = starters.filter(p => ['DM','CM','CAM','LM','RM'].includes(p.positionAbbr)).length
  const atta = starters.filter(p => ['RW','LW','ST','CF','FW'].includes(p.positionAbbr)).length
  const formation = `${defs}-${mids}-${atta}`

  return { formation, starters, bench, events: [], available: true }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-block h-4 w-1 shrink-0 rounded-[2px] bg-[var(--red)]" />
      <span className="font-display text-[16px] font-extrabold uppercase tracking-[0.05em]">{title}</span>
    </div>
  )
}

function GoalFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[var(--red)]/20 animate-[goalFlash_1.2s_ease-out_forwards]">
      <style>{`@keyframes goalFlash{0%{opacity:1}100%{opacity:0}}`}</style>
    </div>
  )
}

function LiveLineupPanel({ lineup }: { lineup: MatchLineup }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full cursor-pointer items-center justify-between border-none border-t border-[var(--border)] bg-transparent px-4 py-[14px]"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-1 shrink-0 rounded-[2px] bg-[var(--red)]" />
          <span className="font-display text-[16px] font-extrabold uppercase tracking-[0.05em]">
            Alineación AD Ceuta FC
          </span>
          <span className="rounded-[4px] bg-[var(--bg-soft)] px-[7px] py-[2px] font-display text-[11px] font-bold tracking-[0.1em] text-[var(--muted)]">
            {lineup.formation}
          </span>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`size-[18px] text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-5">
          <LineupField lineup={lineup} />
        </div>
      )}
    </div>
  )
}

const POLL_MS = 60_000
const PTR_THRESHOLD = 70

export default function LivePage() {
  const [match, setMatch] = useState<LiveMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalFlash, setGoalFlash] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const prevScoreRef = useRef('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartY = useRef(0)
  const ptrActive = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function fetchMatch(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/live', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const m: LiveMatch | null = data.match
      if (m) {
        const key = `${m.homeScore}-${m.awayScore}`
        if (prevScoreRef.current && prevScoreRef.current !== key) {
          setGoalFlash(true)
          setTimeout(() => setGoalFlash(false), 1500)
        }
        prevScoreRef.current = key
      }
      setMatch(m)
      setLoading(false)
    } finally {
      if (showRefreshing) setTimeout(() => setRefreshing(false), 400)
    }
  }

  useEffect(() => {
    fetchMatch()
    intervalRef.current = setInterval(() => fetchMatch(), POLL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      ptrActive.current = el.scrollTop === 0
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!ptrActive.current) return
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (dy > PTR_THRESHOLD) fetchMatch(true)
      ptrActive.current = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const isLive = match?.state === 'in'
  const isPost = match?.state === 'post'
  const ceutaIsHome = match ? match.homeTeam.toLowerCase().includes('ceuta') : true
  const rival = match ? (ceutaIsHome ? match.awayTeam : match.homeTeam) : ''
  const sortedEvents = match
    ? [...match.events].sort((a, b) => (parseInt(b.minute) || 0) - (parseInt(a.minute) || 0))
    : []

  return (
    <div ref={scrollRef} className="page pb-24">
      <GoalFlash show={goalFlash} />

      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center bg-[var(--bg)] py-[10px]">
          <svg className="size-5 animate-spin text-[var(--red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ══ LIVE BOARD ══ */}
      <MatchBoard match={match} loading={loading} />

      {/* ══ CONTENT ══ */}
      <div>

        {/* No data */}
        {!loading && !match && (
          <div className="mx-4 mt-4 rounded-[14px] bg-[var(--bg-soft)] px-5 py-6 text-center">
            <div className="mb-2 text-[28px]">⚽</div>
            <div className="font-display text-[16px] font-black uppercase text-[var(--black)]">Sin partido en curso</div>
            <p className="mt-1 text-[13px] text-[var(--muted)]">El modo live se activará antes del partido.</p>
          </div>
        )}

        {/* Pre-match */}
        {match?.state === 'pre' && (
          <div className="mx-4 mt-4 rounded-[14px] bg-[var(--bg-soft)] p-5">
            <div className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)]">Próximamente</div>
            <div className="font-display text-[20px] font-black uppercase leading-[1.1]">El partido está a punto de comenzar</div>
            <p className="mt-2 text-[13px] text-[var(--muted)]">Las alineaciones y actualizaciones aparecerán aquí en cuanto empiece.</p>
          </div>
        )}

        {/* ── Timeline ── */}
        {(isLive || isPost) && (
          <div className="px-4 pb-[6px] pt-[18px]">
            <SectionHeader title="Minuto a minuto" />
            {sortedEvents.length === 0 ? (
              <p className="py-2 text-[13px] text-[var(--muted)]">Sin eventos registrados aún.</p>
            ) : (
              <div>
                {/* Cabecera equipos */}
                <div className="mb-2 grid grid-cols-[1fr_40px_1fr] items-center border-b border-[var(--border)] pb-2">
                  <span className={`font-display text-[11px] font-extrabold uppercase tracking-[0.08em] ${ceutaIsHome ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                    {match.homeTeam}
                  </span>
                  <span />
                  <span className={`text-right font-display text-[11px] font-extrabold uppercase tracking-[0.08em] ${!ceutaIsHome ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                    {match.awayTeam}
                  </span>
                </div>
                {sortedEvents.map((ev, i) => {
                  const isCeuta = ev.team === (ceutaIsHome ? 'home' : 'away')
                  const isHome = ev.team === 'home'
                  const isGoal = ev.type === 'goal'
                  const isYellow = ev.type === 'yellowCard'
                  const isRed = ev.type === 'redCard'

                  const EventIcon = () => {
                    if (isGoal && isCeuta) {
                      if (ev.photoUrl) {
                        // eslint-disable-next-line @next/next/no-img-element
                        return <img src={ev.photoUrl} alt={ev.playerName} className="size-7 rounded-full object-cover object-top" />
                      }
                      return <span className="font-display text-[11px] font-black text-white">{ev.minute}&apos;</span>
                    }
                    if (isGoal) return <span className="text-[16px]">⚽</span>
                    if (isYellow) return <div className="h-[17px] w-3 -rotate-[8deg] rounded-[2px] border-[1.5px] border-black/[0.18] bg-[#F5C518]" />
                    if (isRed) return <div className="h-[17px] w-3 -rotate-[8deg] rounded-[2px] border-[1.5px] border-black/[0.18] bg-[#E01020]" />
                    if (ev.type === 'substitution') return (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[13px]">
                        <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
                        <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                    )
                    return null
                  }

                  const playerLabel = ev.playerName || (isGoal ? (isCeuta ? '¡Gol AD Ceuta FC!' : `Gol ${rival}`) : ev.type === 'yellowCard' ? 'Amarilla' : ev.type === 'redCard' ? 'Roja' : 'Cambio')

                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_40px_1fr] items-center gap-1 border-b border-[var(--border)] py-2 last:border-none"
                    >
                      {/* Columna izquierda (home) */}
                      {isHome ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${isGoal && isCeuta ? 'bg-[var(--red)]' : 'bg-[var(--bg-soft)]'}`}>
                            <EventIcon />
                          </span>
                          <div className={`font-display text-[13px] font-bold uppercase leading-[1.2] ${isGoal && isCeuta ? 'text-[var(--red)]' : 'text-[var(--black)]'}`}>
                            {playerLabel}
                          </div>
                        </div>
                      ) : <div />}

                      {/* Minuto central */}
                      <div className="text-center">
                        <span className={`font-display text-[12px] font-extrabold ${isGoal ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                          {ev.minute}&apos;
                        </span>
                      </div>

                      {/* Columna derecha (away) */}
                      {!isHome ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className={`text-right font-display text-[13px] font-bold uppercase leading-[1.2] ${isGoal && isCeuta ? 'text-[var(--red)]' : 'text-[var(--black)]'}`}>
                            {playerLabel}
                          </div>
                          <span className={`flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${isGoal && isCeuta ? 'bg-[var(--red)]' : 'bg-[var(--bg-soft)]'}`}>
                            <EventIcon />
                          </span>
                        </div>
                      ) : <div />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Estadísticas ── */}
        {(isLive || isPost) && match?.stats && match.stats.length > 0 && (
          <div className="px-4 pb-[6px] pt-[18px]">
            <SectionHeader title="Estadísticas" />
            <div className="flex flex-col gap-[14px]">
              {match.stats.map((stat) => {
                const isPct = stat.name === 'possessionPct' || stat.name === 'passPct'
                const homeRaw = parseFloat(stat.home) || 0
                const awayRaw = parseFloat(stat.away) || 0
                const total = homeRaw + awayRaw || 1

                const homePct = isPct ? homeRaw : (homeRaw / total) * 100
                const awayPct = isPct ? awayRaw : (awayRaw / total) * 100

                const homeDisplay = isPct ? `${Math.round(homeRaw)}%` : String(Math.round(homeRaw))
                const awayDisplay = isPct ? `${Math.round(awayRaw)}%` : String(Math.round(awayRaw))

                const ceutaIsHomeLocal = match.homeTeam.toLowerCase().includes('ceuta')
                const ceutaPct = ceutaIsHomeLocal ? homePct : awayPct
                const rivalPct = ceutaIsHomeLocal ? awayPct : homePct
                const ceutaDisplay = ceutaIsHomeLocal ? homeDisplay : awayDisplay
                const rivalDisplay = ceutaIsHomeLocal ? awayDisplay : homeDisplay

                return (
                  <div key={stat.name}>
                    <div className="mb-[6px] text-center font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {stat.displayName}
                    </div>
                    <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
                      <span className="text-right font-display text-[15px] font-extrabold text-[var(--red)]">{ceutaDisplay}</span>
                      <div className="flex h-[6px] overflow-hidden rounded-[3px] bg-[var(--border)]">
                        <div className="rounded-l-[3px] bg-[var(--red)] transition-[width] duration-[600ms] ease-out" style={{ width: `${ceutaPct}%` }} />
                        <div className="rounded-r-[3px] bg-[var(--black)] transition-[width] duration-[600ms] ease-out" style={{ width: `${rivalPct}%` }} />
                      </div>
                      <span className="font-display text-[15px] font-extrabold text-[var(--black)]">{rivalDisplay}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Alineación AD Ceuta FC (campo visual, colapsable) ── */}
        {match && (() => {
          const ceutaLineup = ceutaIsHome ? match.homeLineup : match.awayLineup
          if (!ceutaLineup?.length) return null
          return <LiveLineupPanel lineup={toMatchLineup(ceutaLineup)} />
        })()}

      </div>
    </div>
  )
}
