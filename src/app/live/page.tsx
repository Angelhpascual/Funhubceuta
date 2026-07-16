'use client'

import { useEffect, useRef, useState } from 'react'
import type { LiveMatch, LineupPlayer } from '@/domain/match/LiveMatch'
import { getLocalLogo } from '@/lib/teamLogos'
import Image from 'next/image'
import { MvpBanner } from '@/components/ui/MvpBanner'

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  yellowCard: '🟨',
  redCard: '🟥',
  substitution: '🔄',
}

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol',
  yellowCard: 'Amarilla',
  redCard: 'Roja',
  substitution: 'Cambio',
}

function TeamLogo({ name, size = 64 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  if (logo) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-white"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} style={{ width: size * 0.6, height: size * 0.6 }} className="object-contain" />
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white font-display font-black text-ceuta-black"
      style={{ width: size, height: size, fontSize: size * 0.28 }}
    >
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function LiveBadge({ clock }: { clock: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ceuta-red opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-ceuta-red" />
      </span>
      <span className="font-display text-[12px] font-black uppercase tracking-[0.14em] text-ceuta-red">
        EN VIVO {clock && `· ${clock}`}
      </span>
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
    <div className={`rounded-[14px] overflow-hidden ${isCeuta ? 'bg-ceuta-black' : 'bg-ceuta-bg-soft'}`}>
      <div className={`px-4 py-3 flex items-center gap-2 ${isCeuta ? 'border-b border-white/10' : 'border-b border-black/5'}`}>
        <span className={`font-display text-[11px] font-bold uppercase tracking-[0.12em] ${isCeuta ? 'text-white/50' : 'text-ceuta-muted'}`}>
          Once inicial
        </span>
        <span className={`font-display text-[13px] font-black uppercase ${isCeuta ? 'text-white' : 'text-ceuta-black'}`}>
          {teamLabel}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {starters.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`w-7 text-center font-display text-[13px] font-black ${isCeuta ? 'text-white/30' : 'text-ceuta-muted'}`}>
              {p.jersey}
            </span>
            <span className={`flex-1 font-display text-[14px] font-bold ${isCeuta ? 'text-white' : 'text-ceuta-black'}`}>
              {p.name}
            </span>
            <span className={`rounded px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] ${isCeuta ? 'bg-white/10 text-white/50' : 'bg-black/5 text-ceuta-muted'}`}>
              {p.position}
            </span>
          </div>
        ))}
      </div>
      {bench.length > 0 && (
        <div className={`px-4 py-2 ${isCeuta ? 'border-t border-white/10' : 'border-t border-black/5'}`}>
          <span className={`font-display text-[10px] font-bold uppercase tracking-[0.12em] ${isCeuta ? 'text-white/30' : 'text-ceuta-muted/60'}`}>
            Suplentes: {bench.map(p => p.name).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}

function GoalFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 bg-ceuta-red/20 animate-[goalFlash_1.2s_ease-out_forwards]">
      <style>{`@keyframes goalFlash { 0%{opacity:1} 100%{opacity:0} }`}</style>
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

      {/* ── HERO BANNER ── */}
      <div className="page-hero-full relative overflow-hidden bg-ceuta-black px-[18px] pb-[28px] pt-[22px] text-white">
        {/* Diagonal stripes */}
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />

        {/* Competition + state */}
        <div className="relative z-[1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-[6px] rounded-full bg-ceuta-red" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/liga-hypermotion-white.webp" alt="Liga Hypermotion" className="h-[11px] w-auto opacity-60" />
          </div>
          {isLive && <LiveBadge clock={match!.clock} />}
          {isPost && (
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Finalizado
            </span>
          )}
          {match?.state === 'pre' && (
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Previo
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div className="relative z-[1] mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Home */}
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <div className="size-[64px] animate-pulse rounded-full bg-white/10" />
            ) : (
              <TeamLogo name={match?.homeTeam ?? ''} size={64} />
            )}
            <span className="text-center font-display text-[13px] font-bold uppercase leading-tight tracking-[0.04em]">
              {loading ? '—' : match?.homeTeam}
            </span>
          </div>

          {/* Score / VS */}
          <div className="text-center">
            {loading ? (
              <div className="h-12 w-20 animate-pulse rounded bg-white/10 mx-auto" />
            ) : isLive || isPost ? (
              <>
                <div className="font-display text-[52px] font-black leading-none tracking-[-0.02em]">
                  {match!.homeScore} <span className="text-white/30">–</span> {match!.awayScore}
                </div>
                {isLive && match!.clock && (
                  <div className="mt-1 font-display text-[13px] font-black text-white/50 tracking-[0.06em]">
                    {match!.clock}&apos;
                  </div>
                )}
              </>
            ) : (
              <div className="font-display text-[16px] font-black tracking-[0.16em] text-white/40">VS</div>
            )}
            {isPost && (
              <div className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
                {ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota' : 'Empate'}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <div className="size-[64px] animate-pulse rounded-full bg-white/10" />
            ) : (
              <TeamLogo name={match?.awayTeam ?? ''} size={64} />
            )}
            <span className="text-center font-display text-[13px] font-bold uppercase leading-tight tracking-[0.04em]">
              {loading ? '—' : match?.awayTeam}
            </span>
          </div>
        </div>

        {/* Venue */}
        {match?.venue && (
          <div className="relative z-[1] mt-4 text-center font-display text-[11px] text-white/30 uppercase tracking-[0.1em]">
            {match.venue}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 mt-5">

        {/* No data */}
        {!loading && !match && (
          <div className="rounded-[14px] bg-ceuta-bg-soft p-6 text-center">
            <div className="text-[28px] mb-2">⚽</div>
            <div className="font-display text-[16px] font-black uppercase text-ceuta-black">
              Sin partido en curso
            </div>
            <p className="mt-1 text-[13px] text-ceuta-muted">
              El modo live se activará antes del partido.
            </p>
          </div>
        )}

        {/* Pre-match */}
        {match?.state === 'pre' && (
          <div className="rounded-[14px] bg-ceuta-bg-soft p-5">
            <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red mb-1">
              Próximamente
            </div>
            <div className="font-display text-[20px] font-black uppercase text-ceuta-black leading-tight">
              El partido está a punto de comenzar
            </div>
            <p className="mt-2 text-[13px] text-ceuta-muted">
              Las alineaciones y actualizaciones en tiempo real aparecerán aquí en cuanto empiece.
            </p>
          </div>
        )}

        {/* Lineup */}
        {match && (match.homeLineup || match.awayLineup) && (
          <div className="mt-5">
            <div className="sec-header mb-3">
              <div className="sec-title-small">Alineaciones</div>
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

        {/* Event timeline */}
        {(isLive || isPost) && (
          <div>
            <div className="sec-header mb-3">
              <div className="sec-title-small">Eventos del partido</div>
            </div>

            {sortedEvents.length === 0 ? (
              <p className="text-[13px] text-ceuta-muted py-2">Sin eventos registrados aún.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedEvents.map((ev, i) => {
                  const isCeuta = ev.team === (ceutaIsHome ? 'home' : 'away')
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-[10px] px-4 py-3 ${
                        isCeuta ? 'bg-ceuta-black text-white' : 'bg-ceuta-bg-soft text-ceuta-black'
                      }`}
                    >
                      <span className="text-[20px]">{EVENT_ICONS[ev.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-[13px] font-bold leading-tight">
                          {ev.playerName || EVENT_LABELS[ev.type]}
                        </div>
                        <div className={`font-display text-[11px] uppercase tracking-[0.08em] ${isCeuta ? 'text-white/50' : 'text-ceuta-muted'}`}>
                          {EVENT_LABELS[ev.type]} · {isCeuta ? 'AD Ceuta FC' : rival}
                        </div>
                      </div>
                      <span className={`font-display text-[14px] font-black ${isCeuta ? 'text-white/60' : 'text-ceuta-muted'}`}>
                        {ev.minute}&apos;
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Post-match MVP */}
        {isPost && <div className="mt-5 -mx-4"><MvpBanner /></div>}

      </div>
    </div>
  )
}
