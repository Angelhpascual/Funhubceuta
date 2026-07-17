'use client'

import { useEffect, useRef, useState } from 'react'
import type { LiveMatch, LineupPlayer as LiveLineupPlayer } from '@/domain/match/LiveMatch'
import type { MatchLineup, LineupPlayer } from '@/domain/match/Lineup'
import { getLocalLogo } from '@/lib/teamLogos'
import { LineupField } from '@/features/matches/LineupField'

// Convierte la alineación live (posiciones simples) al formato que espera LineupField
function toMatchLineup(players: LiveLineupPlayer[]): MatchLineup {
  const starters: LineupPlayer[] = players.filter(p => p.starter).map(p => ({
    name: p.name,
    shortName: p.name.split(' ').pop() ?? p.name,
    jersey: p.jersey,
    position: p.position,
    positionAbbr: p.position === 'AM' ? 'CAM' : p.position,
    starter: true,
    photoUrl: null,
  }))
  const bench: LineupPlayer[] = players.filter(p => !p.starter).map(p => ({
    name: p.name,
    shortName: p.name.split(' ').pop() ?? p.name,
    jersey: p.jersey,
    position: p.position,
    positionAbbr: p.position,
    starter: false,
    photoUrl: null,
  }))

  // Inferir formación contando por líneas (excluyendo GK)
  const defs = starters.filter(p => ['CB','RB','LB','WB'].includes(p.positionAbbr)).length
  const mids = starters.filter(p => ['DM','CM','CAM','LM','RM'].includes(p.positionAbbr)).length
  const atta = starters.filter(p => ['RW','LW','ST','CF','FW'].includes(p.positionAbbr)).length
  const formation = `${defs}-${mids}-${atta}`

  return { formation, starters, bench, events: [], available: true }
}

function TeamCrest({ name, size = 58 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logo} alt={name} style={{ width: size * 0.72, height: size * 0.72, objectFit: 'contain' }} />
        : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: size * 0.28, color: 'rgba(255,255,255,0.85)' }}>
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
      <style>{`@keyframes goalFlash{0%{opacity:1}100%{opacity:0}}`}</style>
    </div>
  )
}


function LiveLineupPanel({ lineup }: { lineup: MatchLineup }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ margin: '0 0 0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 4, height: 16, background: 'var(--red)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Alineación Ceuta
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', background: 'var(--bg-soft)', borderRadius: 4, padding: '2px 7px', color: 'var(--muted)' }}>
            {lineup.formation}
          </span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ width: 18, height: 18, color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 20px' }}>
          <LineupField lineup={lineup} />
        </div>
      )}
    </div>
  )
}

const POLL_MS = 25_000
const PTR_THRESHOLD = 70 // px to pull before triggering refresh

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

  // Pull-to-refresh
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
  const ceutaScore = match ? (ceutaIsHome ? match.homeScore : match.awayScore) : 0
  const rivalScore = match ? (ceutaIsHome ? match.awayScore : match.homeScore) : 0
  const sortedEvents = match
    ? [...match.events].sort((a, b) => (parseInt(b.minute) || 0) - (parseInt(a.minute) || 0))
    : []

  return (
    <div ref={scrollRef} className="page pb-24">
      <GoalFlash show={goalFlash} />

      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', background: 'var(--bg)' }}>
          <svg style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite', color: 'var(--red)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ══ LIVE BOARD ══ */}
      <div style={{ background: 'var(--black)', color: '#fff', position: 'relative', overflow: 'hidden', padding: '0 20px 22px' }}>
        {/* Diagonal stripes right */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 130,
          background: 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,0.05) 10px 20px)',
          pointerEvents: 'none',
        }} />

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, paddingTop: 18 }}>
          {isLive ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
              En directo
            </span>
          ) : isPost ? (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Finalizado</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Previo</span>
          )}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
            Liga Hypermotion
          </span>
        </div>

        {/* Score grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 14, marginTop: 18, position: 'relative', zIndex: 1 }}>
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            {loading ? <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} /> : <TeamCrest name={match?.homeTeam ?? ''} size={58} />}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
              {loading ? '—' : match?.homeTeam}
            </div>
          </div>

          {/* Center */}
          <div style={{ textAlign: 'center' }}>
            {loading ? (
              <div style={{ width: 80, height: 52, background: 'rgba(255,255,255,0.1)', borderRadius: 6, margin: '0 auto' }} />
            ) : isLive || isPost ? (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 52, lineHeight: 1, letterSpacing: '0.02em' }}>
                  {match!.homeScore}<span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>{match!.awayScore}
                </div>
                {isLive && match!.clock && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--gold)' }}>{match!.clock}&apos;</span>
                  </div>
                )}
                {isPost && (
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
                    {ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota' : 'Empate'}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.16em' }}>VS</div>
            )}
          </div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            {loading ? <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} /> : <TeamCrest name={match?.awayTeam ?? ''} size={58} />}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
              {loading ? '—' : match?.awayTeam}
            </div>
          </div>
        </div>

        {/* Meta: venue */}
        {match?.venue && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13, color: 'var(--red)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {match.venue}
            </span>
          </div>
        )}
      </div>

      {/* ══ CONTENT ══ */}
      <div>

        {/* No data */}
        {!loading && !match && (
          <div style={{ margin: '16px 16px 0', background: 'var(--bg-soft)', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚽</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: 'var(--black)' }}>Sin partido en curso</div>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>El modo live se activará antes del partido.</p>
          </div>
        )}

        {/* Pre-match */}
        {match?.state === 'pre' && (
          <div style={{ margin: '16px 16px 0', background: 'var(--bg-soft)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--red)', marginBottom: 4 }}>Próximamente</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>El partido está a punto de comenzar</div>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Las alineaciones y actualizaciones aparecerán aquí en cuanto empiece.</p>
          </div>
        )}

        {/* ── Timeline ── */}
        {(isLive || isPost) && (
          <div style={{ padding: '18px 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 4, height: 16, background: 'var(--red)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Minuto a minuto</span>
            </div>
            {sortedEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>Sin eventos registrados aún.</p>
            ) : (
              <div>
                {sortedEvents.map((ev, i) => {
                  const isCeuta = ev.team === (ceutaIsHome ? 'home' : 'away')
                  const isGoal = ev.type === 'goal'
                  const isYellow = ev.type === 'yellowCard'
                  const isRed = ev.type === 'redCard'
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 30px 1fr', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--border)' }}
                      className="last:border-none">
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: isGoal && isCeuta ? 'var(--red)' : 'var(--muted)', textAlign: 'right' }}>
                        {ev.minute}&apos;
                      </span>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                        background: ev.photoUrl && isCeuta ? 'transparent' : isGoal ? (isCeuta ? 'var(--red)' : 'var(--black)') : (isYellow || isRed) ? 'transparent' : 'var(--bg-soft)',
                        color: isGoal ? '#fff' : 'var(--black)',
                      }}>
                        {ev.photoUrl && isCeuta ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ev.photoUrl} alt={ev.playerName} style={{ width: 28, height: 28, objectFit: 'cover', objectPosition: 'top' }} />
                        ) : (
                          <>
                            {isGoal && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><path d="M12 7l4.75 3.45-1.81 5.6h-5.88l-1.81-5.6z" fill="currentColor" stroke="none" /></svg>}
                            {isYellow && (
                              <div style={{ width: 14, height: 20, background: '#F5C518', borderRadius: 3, border: '1.5px solid rgba(0,0,0,0.18)', transform: 'rotate(-8deg)' }} />
                            )}
                            {isRed && (
                              <div style={{ width: 14, height: 20, background: '#E01020', borderRadius: 3, border: '1.5px solid rgba(0,0,0,0.18)', transform: 'rotate(-8deg)' }} />
                            )}
                            {ev.type === 'substitution' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>}
                          </>
                        )}
                      </span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                          {ev.playerName || (isGoal ? (isCeuta ? '¡Gol del Ceuta!' : `Gol del ${rival}`) : ev.type === 'yellowCard' ? 'Tarjeta amarilla' : ev.type === 'redCard' ? 'Tarjeta roja' : 'Cambio')}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                          {isCeuta ? 'AD Ceuta FC' : rival}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Estadísticas ── */}
        {(isLive || isPost) && match?.stats && match.stats.length > 0 && (
          <div style={{ padding: '18px 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 4, height: 16, background: 'var(--red)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estadísticas</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {match.stats.map((stat) => {
                const isPct = stat.name === 'possessionPct' || stat.name === 'passPct'
                const homeRaw = parseFloat(stat.home) || 0
                const awayRaw = parseFloat(stat.away) || 0
                const total = homeRaw + awayRaw || 1

                // For percentages ESPN gives 0–100 directly; for counts use proportion
                const homePct = isPct ? homeRaw : (homeRaw / total) * 100
                const awayPct = isPct ? awayRaw : (awayRaw / total) * 100

                // Display values: percentages show %, counts show raw
                const homeDisplay = isPct ? `${Math.round(homeRaw)}%` : String(Math.round(homeRaw))
                const awayDisplay = isPct ? `${Math.round(awayRaw)}%` : String(Math.round(awayRaw))

                const ceutaIsHomeLocal = match.homeTeam.toLowerCase().includes('ceuta')
                const ceutaPct = ceutaIsHomeLocal ? homePct : awayPct
                const rivalPct = ceutaIsHomeLocal ? awayPct : homePct
                const ceutaDisplay = ceutaIsHomeLocal ? homeDisplay : awayDisplay
                const rivalDisplay = ceutaIsHomeLocal ? awayDisplay : homeDisplay

                return (
                  <div key={stat.name}>
                    {/* Label centrado */}
                    <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 6 }}>
                      {stat.displayName}
                    </div>
                    {/* Valores + barra */}
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, textAlign: 'right', color: 'var(--red)' }}>{ceutaDisplay}</span>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border)' }}>
                        <div style={{ width: `${ceutaPct}%`, background: 'var(--red)', borderRadius: '3px 0 0 3px', transition: 'width 0.6s ease' }} />
                        <div style={{ width: `${rivalPct}%`, background: 'var(--black)', borderRadius: '0 3px 3px 0', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, textAlign: 'left', color: 'var(--black)' }}>{rivalDisplay}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Alineación Ceuta (campo visual, colapsable) ── */}
        {match && (() => {
          const ceutaLineup = ceutaIsHome ? match.homeLineup : match.awayLineup
          if (!ceutaLineup?.length) return null
          return <LiveLineupPanel lineup={toMatchLineup(ceutaLineup)} />
        })()}


      </div>
    </div>
  )
}
