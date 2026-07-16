'use client'

import { useEffect, useRef, useState } from 'react'
import type { LiveMatch, LineupPlayer } from '@/domain/match/LiveMatch'
import { getLocalLogo } from '@/lib/teamLogos'
import { MvpBanner } from '@/components/ui/MvpBanner'

const EVENT_ICONS: Record<string, React.ReactNode> = {
  goal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7l4.75 3.45-1.81 5.6h-5.88l-1.81-5.6z" fill="currentColor" stroke="none" />
    </svg>
  ),
  yellowCard: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <rect x="7" y="3" width="10" height="18" rx="2" />
    </svg>
  ),
  redCard: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <rect x="7" y="3" width="10" height="18" rx="2" />
    </svg>
  ),
  substitution: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  ),
}

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol',
  yellowCard: 'Amarilla',
  redCard: 'Roja',
  substitution: 'Cambio',
}

function TeamCrest({ name, size = 58 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      {logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logo} alt={name} style={{ width: size * 0.72, height: size * 0.72 }} className="object-contain" />
        : <span className="font-display font-black text-white/85" style={{ fontSize: size * 0.28 }}>
            {name.slice(0, 3).toUpperCase()}
          </span>
      }
    </div>
  )
}

function GoalFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 bg-[var(--red)]/20 animate-[goalFlash_1.2s_ease-out_forwards]">
      <style>{`@keyframes goalFlash { 0%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  )
}

const POSITION_ORDER: Record<string, number> = { GK: 0, RB: 1, CB: 2, LB: 3, DM: 4, CM: 5, AM: 6, RW: 7, LW: 8, ST: 9, FW: 9 }

function LineupSection({ players, teamName, teamLabel }: { players: LineupPlayer[]; teamName: string; teamLabel: string }) {
  const starters = players.filter(p => p.starter).sort(
    (a, b) => (POSITION_ORDER[a.position] ?? 5) - (POSITION_ORDER[b.position] ?? 5)
  )
  const bench = players.filter(p => !p.starter)
  if (starters.length === 0) return null
  const isCeuta = teamLabel === 'AD Ceuta FC'
  return (
    <div className={`rounded-[14px] overflow-hidden ${isCeuta ? 'bg-[var(--black)]' : 'bg-[var(--bg-soft)]'}`}>
      <div className={`px-4 py-3 flex items-center gap-2 ${isCeuta ? 'border-b border-white/10' : 'border-b border-black/5'}`}>
        <span className={`font-display text-[11px] font-bold uppercase tracking-[0.12em] ${isCeuta ? 'text-white/50' : 'text-[var(--muted)]'}`}>
          Once inicial
        </span>
        <span className={`font-display text-[13px] font-black uppercase ${isCeuta ? 'text-white' : 'text-[var(--black)]'}`}>
          {teamLabel}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {starters.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`w-7 text-center font-display text-[13px] font-black ${isCeuta ? 'text-white/30' : 'text-[var(--muted)]'}`}>
              {p.jersey}
            </span>
            <span className={`flex-1 font-display text-[14px] font-bold ${isCeuta ? 'text-white' : 'text-[var(--black)]'}`}>
              {p.name}
            </span>
            <span className={`rounded px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] ${isCeuta ? 'bg-white/10 text-white/50' : 'bg-black/5 text-[var(--muted)]'}`}>
              {p.position}
            </span>
          </div>
        ))}
      </div>
      {bench.length > 0 && (
        <div className={`px-4 py-2 ${isCeuta ? 'border-t border-white/10' : 'border-t border-black/5'}`}>
          <span className={`font-display text-[10px] font-bold uppercase tracking-[0.12em] ${isCeuta ? 'text-white/30' : 'text-[var(--muted)]/60'}`}>
            Suplentes: {bench.map(p => p.name).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}

export default function LivePage() {
  const [match, setMatch] = useState<LiveMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalFlash, setGoalFlash] = useState(false)
  const prevScoreRef = useRef('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchMatch() {
    const res = await fetch('/api/live', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    const m: LiveMatch | null = data.match
    if (m) {
      const scoreKey = `${m.homeScore}-${m.awayScore}`
      if (prevScoreRef.current && prevScoreRef.current !== scoreKey) {
        setGoalFlash(true)
        setTimeout(() => setGoalFlash(false), 1500)
      }
      prevScoreRef.current = scoreKey
    }
    setMatch(m)
    setLoading(false)
  }

  useEffect(() => {
    fetchMatch()
    intervalRef.current = setInterval(fetchMatch, 60_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const isLive = match?.state === 'in'
  const isPost = match?.state === 'post'
  const ceutaIsHome = match ? match.homeTeam.toLowerCase().includes('ceuta') : true
  const rival = match ? (ceutaIsHome ? match.awayTeam : match.homeTeam) : ''
  const ceutaScore = match ? (ceutaIsHome ? match.homeScore : match.awayScore) : 0
  const rivalScore = match ? (ceutaIsHome ? match.awayScore : match.homeScore) : 0

  const sortedEvents = match
    ? [...match.events].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0))
    : []

  return (
    <div className="page pb-24">
      <GoalFlash show={goalFlash} />

      {/* ── LIVE BOARD ── */}
      <div className="relative overflow-hidden bg-[var(--black)] text-white px-5 pt-0 pb-[22px]">
        {/* Diagonal stripes */}
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-[130px] opacity-[0.06]"
          style={{ background: 'repeating-linear-gradient(-45deg, #fff 0 10px, transparent 10px 20px)' }}
        />

        {/* Top row: badge + jornada */}
        <div className="relative z-[1] flex items-center justify-between pt-[18px]">
          {isLive ? (
            <span className="inline-flex items-center gap-[7px] bg-[var(--red)] text-white font-display text-[11px] font-black uppercase tracking-[0.14em] px-[11px] py-[5px] rounded-[4px]">
              <span className="w-[7px] h-[7px] rounded-full bg-white animate-[pulse_1.2s_infinite]" />
              En directo
            </span>
          ) : isPost ? (
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">Finalizado</span>
          ) : match?.state === 'pre' ? (
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">Previo</span>
          ) : (
            <span />
          )}
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
            Liga Hypermotion
          </span>
        </div>

        {/* Score grid */}
        <div className="relative z-[1] mt-[18px] grid grid-cols-[1fr_auto_1fr] items-center gap-[14px]">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 text-center">
            {loading
              ? <div className="w-[58px] h-[58px] rounded-full bg-white/10 animate-pulse" />
              : <TeamCrest name={match?.homeTeam ?? ''} size={58} />
            }
            <span className="font-display font-black text-[15px] uppercase tracking-[0.04em] leading-tight">
              {loading ? '—' : match?.homeTeam}
            </span>
          </div>

          {/* Center: score */}
          <div className="text-center">
            {loading ? (
              <div className="h-12 w-20 bg-white/10 animate-pulse rounded mx-auto" />
            ) : isLive || isPost ? (
              <>
                <div className="font-display font-black text-[52px] leading-none tracking-[0.02em]">
                  {match!.homeScore}<span className="text-white/30"> – </span>{match!.awayScore}
                </div>
                {isLive && match!.clock && (
                  <div className="inline-flex items-center gap-[6px] mt-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-[var(--gold)] animate-[pulse_1.2s_infinite]" />
                    <span className="font-display font-black text-[15px] text-[var(--gold)]">{match!.clock}&apos;</span>
                  </div>
                )}
                {isPost && (
                  <div className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
                    {ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota' : 'Empate'}
                  </div>
                )}
              </>
            ) : (
              <div className="font-display font-black text-[19px] text-white/28 tracking-[0.16em]">VS</div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2 text-center">
            {loading
              ? <div className="w-[58px] h-[58px] rounded-full bg-white/10 animate-pulse" />
              : <TeamCrest name={match?.awayTeam ?? ''} size={58} />
            }
            <span className="font-display font-black text-[15px] uppercase tracking-[0.04em] leading-tight">
              {loading ? '—' : match?.awayTeam}
            </span>
          </div>
        </div>

        {/* Meta row: venue + TV */}
        {match?.venue && (
          <div className="relative z-[1] mt-4 pt-[14px] border-t border-white/10 flex justify-center gap-4">
            <span className="flex items-center gap-[6px] font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px] text-[var(--red)]">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {match.venue}
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 mt-5 flex flex-col gap-5">

        {/* No data */}
        {!loading && !match && (
          <div className="rounded-[14px] bg-[var(--bg-soft)] p-6 text-center">
            <div className="text-[28px] mb-2">⚽</div>
            <div className="font-display text-[16px] font-black uppercase text-[var(--black)]">
              Sin partido en curso
            </div>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              El modo live se activará antes del partido.
            </p>
          </div>
        )}

        {/* Pre-match */}
        {match?.state === 'pre' && (
          <div className="rounded-[14px] bg-[var(--bg-soft)] p-5">
            <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)] mb-1">
              Próximamente
            </div>
            <div className="font-display text-[20px] font-black uppercase text-[var(--black)] leading-tight">
              El partido está a punto de comenzar
            </div>
            <p className="mt-2 text-[13px] text-[var(--muted)]">
              Las alineaciones y actualizaciones en tiempo real aparecerán aquí en cuanto empiece.
            </p>
          </div>
        )}

        {/* Timeline */}
        {(isLive || isPost) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-[var(--red)] rounded-full" />
              <span className="font-display font-black text-[16px] uppercase tracking-[0.05em]">Minuto a minuto</span>
            </div>
            {sortedEvents.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)] py-2">Sin eventos registrados aún.</p>
            ) : (
              <div>
                {[...sortedEvents].reverse().map((ev, i) => {
                  const isCeuta = ev.team === (ceutaIsHome ? 'home' : 'away')
                  const isGoal = ev.type === 'goal'
                  const isYellow = ev.type === 'yellowCard'
                  return (
                    <div
                      key={i}
                      className="grid items-center gap-2 py-[9px] border-b border-[var(--border)] last:border-none"
                      style={{ gridTemplateColumns: '44px 30px 1fr' }}
                    >
                      <span className={`font-display font-black text-[14px] text-right ${isGoal && isCeuta ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                        {ev.minute}&apos;
                      </span>
                      <span
                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
                        style={{
                          background: isGoal
                            ? (isCeuta ? 'var(--red)' : 'var(--black)')
                            : isYellow
                              ? '#FFF6CC'
                              : 'var(--bg-soft)',
                          color: isGoal ? '#fff' : isYellow ? '#8A6D00' : 'var(--black)',
                        }}
                      >
                        {EVENT_ICONS[ev.type]}
                      </span>
                      <div>
                        <div className="font-display font-bold text-[15px] uppercase tracking-[0.02em] leading-tight">
                          {ev.playerName || EVENT_LABELS[ev.type]}
                        </div>
                        <div className="text-[11.5px] text-[var(--muted)] mt-0.5">
                          {EVENT_LABELS[ev.type]} · {isCeuta ? 'AD Ceuta FC' : rival}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Lineup */}
        {match && (match.homeLineup || match.awayLineup) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-[var(--red)] rounded-full" />
              <span className="font-display font-black text-[16px] uppercase tracking-[0.05em]">Alineaciones</span>
            </div>
            <div className="flex flex-col gap-3">
              {match.homeLineup && (
                <LineupSection
                  players={match.homeLineup}
                  teamName={match.homeTeam}
                  teamLabel={ceutaIsHome ? 'AD Ceuta FC' : match.homeTeam}
                />
              )}
              {match.awayLineup && (
                <LineupSection
                  players={match.awayLineup}
                  teamName={match.awayTeam}
                  teamLabel={!ceutaIsHome ? 'AD Ceuta FC' : match.awayTeam}
                />
              )}
            </div>
          </div>
        )}

        {/* MVP CTA when live */}
        {isLive && (
          <div className="relative overflow-hidden rounded-[var(--radius)] bg-[var(--black)] text-white flex items-center gap-3 px-4 py-[14px]">
            <div
              className="pointer-events-none absolute top-0 right-0 bottom-0 w-[90px]"
              style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 8px,rgba(255,255,255,.06) 8px 16px)' }}
            />
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(244,195,0,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-[var(--gold)]">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
            </div>
            <div className="flex-1 relative z-[1]">
              <div className="font-display font-black text-[15px] uppercase tracking-[0.03em] leading-tight">El MVP, al pitido final</div>
              <div className="text-[12px] text-white/60 mt-0.5">La votación se abre cuando acabe el partido</div>
            </div>
          </div>
        )}

        {/* Post-match MVP */}
        {isPost && <div className="-mx-4"><MvpBanner /></div>}

      </div>
    </div>
  )
}
