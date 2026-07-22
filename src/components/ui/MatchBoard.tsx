'use client'

import Link from 'next/link'
import { getLocalLogo } from '@/lib/teamLogos'
import type { LiveMatch } from '@/domain/match/LiveMatch'

function TeamCrest({ name, size = 52 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  if (logo) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} style={{ width: size * 0.69, height: size * 0.69, objectFit: 'contain' }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, color: '#111' }}>
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

interface MatchBoardProps {
  match: LiveMatch | null
  loading?: boolean
  showLiveLink?: boolean
}

export function MatchBoard({ match, loading = false, showLiveLink = false }: MatchBoardProps) {
  const isLive = match?.state === 'in'
  const isPost = match?.state === 'post'
  const ceutaIsHome = match ? match.homeTeam.toLowerCase().includes('ceuta') : true
  const ceutaScore = match ? (ceutaIsHome ? match.homeScore : match.awayScore) : 0
  const rivalScore = match ? (ceutaIsHome ? match.awayScore : match.homeScore) : 0

  return (
    <div style={{ background: 'var(--black)', color: '#fff', position: 'relative', overflow: 'hidden', padding: '0 20px 20px' }}>
      {/* Diagonal stripes */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 130, background: 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,0.05) 10px 20px)', pointerEvents: 'none' }} />

      {/* Top row: state badge + competition */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, paddingTop: 18 }}>
        {isLive ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
            En directo
          </span>
        ) : isPost ? (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Finalizado</span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
            Día de partido
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/liga-hypermotion-white.webp" alt="Liga Hypermotion" style={{ height: 12, width: 'auto', opacity: 0.55 }} />
      </div>

      {/* Score grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 14, marginTop: 18, position: 'relative', zIndex: 1 }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          {loading
            ? <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            : <TeamCrest name={match?.homeTeam ?? ''} size={52} />
          }
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
            {loading ? '—' : match?.homeTeam}
          </div>
        </div>

        {/* Center: score */}
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <div style={{ width: 76, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 6, margin: '0 auto' }} />
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 48, lineHeight: 1, letterSpacing: '0.02em' }}>
                {isLive || isPost
                  ? <>{match!.homeScore}<span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>{match!.awayScore}</>
                  : <>0<span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>0</>
                }
              </div>
              {isLive && match!.clock && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--gold)' }}>{match!.clock}&apos;</span>
                </div>
              )}
              {isPost && (
                <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
                  {ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota' : 'Empate'}
                </div>
              )}
              {!isLive && !isPost && (
                <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>
                  Esperando alineaciones
                </div>
              )}
            </>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          {loading
            ? <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            : <TeamCrest name={match?.awayTeam ?? ''} size={52} />
          }
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
            {loading ? '—' : match?.awayTeam}
          </div>
        </div>
      </div>

      {/* Footer: venue + optional live link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }}>
        {match?.venue ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, color: 'var(--red)', flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {match.venue}
          </span>
        ) : <span />}
        {showLiveLink && isLive && (
          <Link href="/live" style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red)' }}>
            Ver en directo →
          </Link>
        )}
      </div>
    </div>
  )
}
