'use client'

import { useEffect, useRef, useState } from 'react'
import { LiveMatch } from '@/app/api/live/route'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { findLogo } from '@/lib/findLogo'
import { ScrapedMatch } from '@/infrastructure/scrapers/adceutaScraper'

const POLL_INTERVAL_LIVE = 60_000
const POLL_INTERVAL_PRE  = 300_000

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', yellowCard: '🟨', redCard: '🟥', substitution: '🔄',
}

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

function MatchEvents({ events }: { events: LiveMatch['events'] }) {
  if (events.length === 0) return null

  const sorted = [...events].sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0))

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {sorted.map((ev, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Equipo local — izquierda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-start' }}>
            {ev.team === 'home' && (
              <>
                <span style={{ fontSize: 13 }}>{EVENT_ICONS[ev.type]}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {ev.playerName.split(' ').pop()}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {ev.minute}
                </span>
              </>
            )}
          </div>
          {/* Equipo visitante — derecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            {ev.team === 'away' && (
              <>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {ev.minute}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {ev.playerName.split(' ').pop()}
                </span>
                <span style={{ fontSize: 13 }}>{EVENT_ICONS[ev.type]}</span>
              </>
            )}
          </div>
        </div>
      ))}
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

  // No ESPN data — show next match from DB if available
  if (!match) {
    if (!nextMatch) return null
    const dateStr = `${nextMatch.date}T${nextMatch.time}:00`
    return (
      <div className="match-card">
        <div className="match-competition">Liga Hypermotion</div>
        <div className="match-teams" style={{ marginTop: 10 }}>
          <div className="team-block">
            <TeamCrest name={nextMatch.homeTeam} logos={logos} />
            <div className="team-name">{nextMatch.homeTeam}</div>
          </div>
          <div className="match-center">
            <div className="match-vs">VS</div>
            <div className="match-date-time">
              {new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '')}<br />
              {nextMatch.time}
            </div>
          </div>
          <div className="team-block">
            <TeamCrest name={nextMatch.awayTeam} logos={logos} />
            <div className="team-name">{nextMatch.awayTeam}</div>
          </div>
        </div>
        <div className="match-foot" style={{ marginTop: 14 }}>
          <span>Liga Hypermotion</span>
        </div>
      </div>
    )
  }

  const isLive = match.state === 'in'
  const isFinished = match.state === 'post'

  return (
    <div className="match-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <GoalFlash show={goalFlash} />

      {/* Status */}
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
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 38, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1 }}>
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

      {/* Events — home izquierda, away derecha */}
      <MatchEvents events={match.events} />

      {/* Footer */}
      <div className="match-foot" style={{ marginTop: 14 }}>
        <span>{match.venue || 'Liga Hypermotion'}</span>
      </div>
    </div>
  )
}
