'use client'

import { useEffect, useRef, useState } from 'react'
import { LiveMatch } from '@/app/api/live/route'

const POLL_INTERVAL_LIVE = 60_000   // 60s durante partido
const POLL_INTERVAL_PRE  = 300_000  // 5min antes del partido

function GoalFlash({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 'var(--radius)',
      background: 'rgba(214,32,39,0.25)',
      animation: 'goalFlash 1.2s ease-out forwards',
      pointerEvents: 'none', zIndex: 2,
    }}>
      <style>{`@keyframes goalFlash { 0%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  )
}

function EventBadge({ event }: { event: LiveMatch['events'][0] }) {
  const icons: Record<string, string> = {
    goal: '⚽', yellowCard: '🟨', redCard: '🟥', substitution: '🔄',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
      <span style={{ fontSize: 12 }}>{icons[event.type]}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>
        {event.minute}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
        {event.playerName.split(' ').pop()}
      </span>
    </div>
  )
}

function LiveBadge({ clock }: { clock: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--red)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        EN VIVO {clock && `· ${clock}`}
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }`}</style>
    </div>
  )
}

import { findLogo } from '@/lib/findLogo'

function TeamCrest({ name, logos }: { name: string; logos: Record<string, string> }) {
  const logo = findLogo(logos, name)
  if (logo) {
    return (
      <div className="team-crest with-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
      </div>
    )
  }
  return <div className="team-crest">{name.slice(0, 3).toUpperCase()}</div>
}

export function LiveMatchCard() {
  const [match, setMatch] = useState<LiveMatch | null>(null)
  const [goalFlash, setGoalFlash] = useState(false)
  const [logos, setLogos] = useState<Record<string, string>>({})
  const prevScoreRef = useRef<string>('')

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

    const interval = setInterval(
      fetchLive,
      match?.state === 'in' ? POLL_INTERVAL_LIVE : POLL_INTERVAL_PRE
    )
    return () => clearInterval(interval)
  }, [match?.state])

  if (!match) return null

  const isLive = match.state === 'in'
  const isFinished = match.state === 'post'
  const goalEvents = match.events.filter(e => e.type === 'goal')
  const cardEvents = match.events.filter(e => e.type === 'yellowCard' || e.type === 'redCard')

  return (
    <div className="match-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <GoalFlash show={goalFlash} />

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="match-competition">Liga Hypermotion</div>
        {isLive && <LiveBadge clock={match.clock} />}
        {isFinished && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            FINALIZADO
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="match-teams">
        <div className="team-block">
          <TeamCrest name={match.homeTeam} logos={logos} />
          <div className="team-name">{match.homeTeam}</div>
        </div>

        <div className="match-center">
          {(isLive || isFinished) ? (
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 38,
              color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <>
              <div className="match-vs">VS</div>
              <div className="match-date-time">
                {new Date(match.startDate).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '')}<br />
                {new Date(match.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
              </div>
            </>
          )}
        </div>

        <div className="team-block">
          <TeamCrest name={match.awayTeam} logos={logos} />
          <div className="team-name">{match.awayTeam}</div>
        </div>
      </div>

      {/* Events: goals */}
      {goalEvents.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {goalEvents.map((e, i) => <EventBadge key={i} event={e} />)}
        </div>
      )}

      {/* Events: cards */}
      {cardEvents.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: cardEvents.length ? 4 : 0 }}>
          {cardEvents.map((e, i) => <EventBadge key={i} event={e} />)}
        </div>
      )}

      {/* Footer */}
      <div className="match-foot" style={{ marginTop: 14 }}>
        <span>{match.venue || 'Liga Hypermotion'}</span>
      </div>
    </div>
  )
}
