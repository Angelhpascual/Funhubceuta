'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { LiveMatch } from '@/domain/match/LiveMatch'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { getLocalLogo } from '@/lib/teamLogos'
import type { ScrapedMatch } from '@/domain/match/ScrapedMatch'
import Link from 'next/link'
import { MatchBoard } from '@/components/ui/MatchBoard'

const POLL_INTERVAL_LIVE = 25_000
const POLL_INTERVAL_PRE = 120_000

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  yellowCard: '🟨',
  redCard: '🟥',
  substitution: '🔄',
}

function GoalFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] rounded-[14px] bg-ceuta-red/25 animate-[goalFlash_1.2s_ease-out_forwards]">
      <style>{`@keyframes goalFlash { 0%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  )
}

function LiveBadge({ clock }: { clock: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block size-2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ceuta-red">
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }`}</style>
      </span>
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
        EN VIVO {clock && `· ${clock}`}
      </span>
    </div>
  )
}

function TeamCrest({ name }: { name: string }) {
  const logo = getLocalLogo(name)
  if (logo) {
    return (
      <div className="flex size-[52px] items-center justify-center rounded-full bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="size-9 object-contain" fetchPriority="high" />
      </div>
    )
  }
  return (
    <div className="flex size-[52px] items-center justify-center rounded-full bg-white font-display text-[13px] font-black text-ceuta-black">
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function MatchEvents({ events }: { events: LiveMatch['events'] }) {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0))
  return (
    <div className="mt-3 flex flex-col gap-[5px] border-t border-white/[0.08] pt-2.5">
      {sorted.map((ev, i) => (
        <div key={i} className="grid grid-cols-2">
          <div className="flex items-center gap-1">
            {ev.team === 'home' && (
              <>
                <span className="text-[13px]">{EVENT_ICONS[ev.type]}</span>
                <span className="font-display text-[12px] font-semibold text-white/90">
                  {ev.playerName.split(' ').pop()}
                </span>
                <span className="font-display text-[10px] text-white/40">{ev.minute}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            {ev.team === 'away' && (
              <>
                <span className="font-display text-[10px] text-white/40">{ev.minute}</span>
                <span className="font-display text-[12px] font-semibold text-white/90">
                  {ev.playerName.split(' ').pop()}
                </span>
                <span className="text-[13px]">{EVENT_ICONS[ev.type]}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LineupButton({ eventId, match, score }: { eventId: string; match: string; score?: string }) {
  return (
    <Link
      href={`/alineacion?eventId=${eventId}&match=${encodeURIComponent(match)}${score ? `&score=${encodeURIComponent(score)}` : ''}`}
      className="flex items-center gap-1.5 rounded-full bg-ceuta-red px-3 py-1.5"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
      <span className="font-display text-[10px] font-black uppercase tracking-[0.1em] text-white">
        Alineación
      </span>
    </Link>
  )
}

function MatchCardShell({ children, relative }: { children: React.ReactNode; relative?: boolean }) {
  return (
    <div
      className={`mx-3 overflow-hidden rounded-[14px] bg-ceuta-black px-[18px] pb-[18px] pt-5 text-white ${relative ? 'relative' : ''}`}
    >
      {/* diagonal stripes */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 w-[110px]"
        style={{
          background:
            'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.04) 7px 14px)',
        }}
      />
      {children}
    </div>
  )
}

function Competition() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block size-[6px] rounded-full bg-ceuta-red" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/liga-hypermotion-white.webp" alt="Liga Hypermotion" className="h-[12px] w-auto opacity-70" />
    </div>
  )
}

export function LiveMatchCard() {
  const [match, setMatch] = useState<LiveMatch | null>(null)
  const [nextMatch, setNextMatch] = useState<ScrapedMatch | null>(null)
  const [goalFlash, setGoalFlash] = useState(false)

  const prevScoreRef = useRef<string>('')
  const matchStateRef = useRef<string | undefined>(undefined)
  const { permission, subscribed, subscribe } = usePushNotifications()

  const fetchLive = async () => {
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
  }

  // Fetch next match once on mount
  useEffect(() => {
    fetch('/api/matches/next')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.match) setNextMatch(d.match) })
      .catch(() => {})
  }, [])

  // Live polling — interval adjusts when state changes, but does NOT re-fetch immediately
  useEffect(() => {
    const isFirstMount = matchStateRef.current === undefined
    matchStateRef.current = match?.state

    // Only fetch immediately on first mount, not on state transitions
    if (isFirstMount) fetchLive()

    const interval = setInterval(
      fetchLive,
      match?.state === 'in' ? POLL_INTERVAL_LIVE : POLL_INTERVAL_PRE
    )
    return () => clearInterval(interval)
  }, [match?.state])

  // No ESPN data — show next match from DB
  if (!match) {
    if (!nextMatch)
      return (
        <MatchCardShell>
          <Competition />
          <div className="relative z-[1] mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
            <div className="flex flex-col items-center gap-2">
              <div className="size-[52px] animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
            <div className="text-center">
              <div className="font-display text-[12px] font-black tracking-[0.16em] text-ceuta-muted">VS</div>
              <div className="mt-2 h-6 w-14 animate-pulse rounded bg-white/10 mx-auto" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="size-[52px] animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </MatchCardShell>
      )
    const dateLabel = new Date(`${nextMatch.date}T12:00:00`)
      .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
      .replace(/^\w/, c => c.toUpperCase())
    const hasTime = nextMatch.time && nextMatch.time !== '00:00'
    return (
      <MatchCardShell>
        {/* Header */}
        <div className="relative z-[1] flex items-center justify-between">
          <span className="flex items-center gap-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-ceuta-red">
            <span className="w-[5px] h-[5px] rounded-full bg-ceuta-red" />
            Próximo partido
          </span>
        </div>

        {/* Teams */}
        <div className="relative z-[1] mt-4 grid items-center gap-[10px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="flex flex-col items-center gap-[7px] text-center">
            <TeamCrest name={nextMatch.homeTeam} />
            <div>
              <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
                {nextMatch.homeTeam}
              </div>
              <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
                Local
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="font-display font-black text-[19px] text-white/28 leading-none">VS</div>
            <div className="font-display font-black text-[14px] uppercase tracking-[0.04em] mt-[5px] leading-tight whitespace-nowrap">
              {dateLabel}
            </div>
            {hasTime ? (
              <div className="font-display font-black text-[27px] text-[var(--gold)] leading-none mt-[2px]">
                {nextMatch.time} <span className="text-[12px] font-bold text-white/50">h</span>
              </div>
            ) : (
              <div className="mt-1 inline-block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] bg-[#FFF6CC] text-[#8A6D00] rounded-[3px] px-[6px] py-[2px]">
                Por confirmar
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-[7px] text-center">
            <TeamCrest name={nextMatch.awayTeam} />
            <div>
              <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
                {nextMatch.awayTeam}
              </div>
              <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
                Visitante
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-[1] mt-[18px] border-t border-white/10 pt-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/liga-hypermotion-white.webp" alt="Liga Hypermotion" className="h-[10px] w-auto opacity-40" />
        </div>
      </MatchCardShell>
    )
  }

  return (
    <div className="mx-3 overflow-hidden rounded-[14px]">
      <GoalFlash show={goalFlash} />
      <MatchBoard match={match} showLiveLink />
    </div>
  )
}
