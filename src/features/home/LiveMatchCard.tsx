'use client'

import { useEffect, useRef, useState } from 'react'
import { LiveMatch } from '@/app/api/live/route'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { findLogo } from '@/lib/findLogo'
import { ScrapedMatch } from '@/infrastructure/scrapers/adceutaScraper'
import Link from 'next/link'

const POLL_INTERVAL_LIVE = 60_000
const POLL_INTERVAL_PRE  = 300_000

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', yellowCard: '🟨', redCard: '🟥', substitution: '🔄',
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

function TeamCrest({ name, logos }: { name: string; logos: Record<string, string> }) {
  const logo = findLogo(logos, name)
  if (logo) {
    return (
      <div className="flex size-[52px] items-center justify-center rounded-full bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="size-9 object-contain" />
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
                <span className="font-display text-[12px] font-semibold text-white/90">{ev.playerName.split(' ').pop()}</span>
                <span className="font-display text-[10px] text-white/40">{ev.minute}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            {ev.team === 'away' && (
              <>
                <span className="font-display text-[10px] text-white/40">{ev.minute}</span>
                <span className="font-display text-[12px] font-semibold text-white/90">{ev.playerName.split(' ').pop()}</span>
                <span className="text-[13px]">{EVENT_ICONS[ev.type]}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LineupButton({ eventId, match }: { eventId: string; match: string }) {
  return (
    <Link
      href={`/alineacion?eventId=${eventId}&match=${encodeURIComponent(match)}`}
      className="flex items-center gap-1.5 rounded-full bg-ceuta-red px-3 py-1.5"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
      <span className="font-display text-[10px] font-black uppercase tracking-[0.1em] text-white">Alineación</span>
    </Link>
  )
}

function MatchCardShell({ children, relative }: { children: React.ReactNode; relative?: boolean }) {
  return (
    <div className={`mx-3 overflow-hidden rounded-[14px] bg-ceuta-black px-[18px] pb-[18px] pt-5 text-white ${relative ? 'relative' : ''}`}>
      {/* diagonal stripes */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 w-[110px]"
        style={{ background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.04) 7px 14px)' }}
      />
      {children}
    </div>
  )
}

function Competition() {
  return (
    <div className="flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.14em] text-ceuta-red">
      <span className="inline-block size-[6px] rounded-full bg-ceuta-red" />
      Liga Hypermotion
    </div>
  )
}

export function LiveMatchCard() {
  const [match, setMatch] = useState<LiveMatch | null>(null)
  const [nextMatch, setNextMatch] = useState<ScrapedMatch | null>(null)
  const [goalFlash, setGoalFlash] = useState(false)
  const [logos, setLogos] = useState<Record<string, string>>({})
  const prevScoreRef = useRef<string>('')
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

  useEffect(() => {
    fetchLive()
    fetch('/api/matches/next')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.match) setNextMatch(d.match) })
      .catch(() => {})
    fetch('/api/teams')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.teams) {
          const map: Record<string, string> = {}
          for (const t of d.teams) if (t.logoUrl) map[t.name] = t.logoUrl
          setLogos(map)
        }
      })
      .catch(() => {})

    const interval = setInterval(fetchLive, match?.state === 'in' ? POLL_INTERVAL_LIVE : POLL_INTERVAL_PRE)
    return () => clearInterval(interval)
  }, [match?.state])

  // No ESPN data — show next match from DB
  if (!match) {
    if (!nextMatch) return (
      <MatchCardShell>
        <Competition />
        <div className="relative z-[1] mt-5 flex flex-col items-center gap-3 text-center">
          <div className="font-display text-[42px] leading-none">🏆</div>
          <div className="font-display text-[22px] font-black uppercase leading-[1.05] tracking-[0.02em] text-white">
            ¡Permanencia<br />
            <em className="not-italic text-ceuta-gold">conseguida!</em>
          </div>
          <div className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70">
            El AD Ceuta FC estará otra vez en la<br />
            <span className="text-white">Liga Hypermotion 2025–26</span>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 text-center font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Nos vemos la próxima temporada 💪
        </div>
      </MatchCardShell>
    )
    const dateStr = `${nextMatch.date}T${nextMatch.time}:00`
    return (
      <MatchCardShell>
        <Competition />
        <div className="relative z-[1] mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={nextMatch.homeTeam} logos={logos} />
            <div className="text-center font-display text-[15px] font-bold uppercase tracking-[0.04em]">{nextMatch.homeTeam}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-[12px] font-black tracking-[0.16em] text-ceuta-muted">VS</div>
            <div className="mt-1.5 font-display text-[22px] font-black leading-none tracking-[0.04em]">
              {new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '')}<br />
              {nextMatch.time}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TeamCrest name={nextMatch.awayTeam} logos={logos} />
            <div className="text-center font-display text-[15px] font-bold uppercase tracking-[0.04em]">{nextMatch.awayTeam}</div>
          </div>
        </div>
        <div className="mt-[18px] flex items-center justify-between border-t border-white/10 pt-[14px]">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">Liga Hypermotion</span>
          {nextMatch.espnEventId && (
            <LineupButton eventId={nextMatch.espnEventId} match={`${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`} />
          )}
        </div>
      </MatchCardShell>
    )
  }

  const isLive = match.state === 'in'
  const isFinished = match.state === 'post'

  return (
    <MatchCardShell relative>
      <GoalFlash show={goalFlash} />

      <div className="flex items-center justify-between">
        <Competition />
        {isLive && <LiveBadge clock={match.clock} />}
        {isFinished && (
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">FINALIZADO</span>
        )}
      </div>

      <div className="relative z-[1] mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
        <div className="flex flex-col items-center gap-2">
          <TeamCrest name={match.homeTeam} logos={logos} />
          <div className="text-center font-display text-[15px] font-bold uppercase tracking-[0.04em]">{match.homeTeam}</div>
        </div>
        <div className="text-center">
          {(isLive || isFinished) ? (
            <div className="font-display text-[38px] font-black leading-none tracking-[-0.02em] text-white">
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <>
              <div className="mb-1.5 font-display text-[12px] font-black tracking-[0.16em] text-ceuta-muted">VS</div>
              <div className="font-display text-[22px] font-black leading-none tracking-[0.04em]">
                {new Date(match.startDate).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '')}<br />
                {new Date(match.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <TeamCrest name={match.awayTeam} logos={logos} />
          <div className="text-center font-display text-[15px] font-bold uppercase tracking-[0.04em]">{match.awayTeam}</div>
        </div>
      </div>

      <MatchEvents events={match.events} />

      <div className="mt-[18px] flex items-center justify-between border-t border-white/10 pt-[14px]">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
          {match.venue || 'Liga Hypermotion'}
        </span>
        {match.espnId && (
          <LineupButton eventId={match.espnId} match={`${match.homeTeam} vs ${match.awayTeam}`} />
        )}
      </div>
    </MatchCardShell>
  )
}
