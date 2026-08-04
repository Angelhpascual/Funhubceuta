'use client'

import Link from 'next/link'
import { getLocalLogo } from '@/lib/teamLogos'
import type { LiveMatch } from '@/domain/match/LiveMatch'

function TeamCrest({ name, size = 52 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  const sizeClass = size === 52 ? 'w-[52px] h-[52px]' : `w-[${size}px] h-[${size}px]`
  const innerSize = Math.round(size * 0.69)
  if (logo) {
    return (
      <div className={`${sizeClass} rounded-full bg-white flex items-center justify-center shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className={`w-[${innerSize}px] h-[${innerSize}px] object-contain`} />
      </div>
    )
  }
  return (
    <div className={`${sizeClass} rounded-full bg-white flex items-center justify-center shrink-0 font-display text-[13px] font-black text-[var(--black)]`}>
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
    <div className="bg-[var(--black)] text-white relative overflow-hidden px-5 pb-5">
      {/* Diagonal stripes */}
      <div className="absolute top-0 right-0 bottom-0 w-[130px] pointer-events-none"
        style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 10px,rgba(255,255,255,0.05) 10px 20px)' }} />

      {/* Top row: state badge + competition */}
      <div className="flex items-center justify-between relative z-[1] pt-[18px]">
        {isLive ? (
          <span className="inline-flex items-center gap-[7px] bg-[var(--red)] text-white font-display text-[11px] font-extrabold tracking-[0.14em] uppercase px-[11px] py-[5px] rounded">
            <span className="w-[7px] h-[7px] rounded-full bg-white inline-block animate-pulse" />
            En directo
          </span>
        ) : isPost ? (
          <span className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-white/55">Finalizado</span>
        ) : (
          <span className="inline-flex items-center gap-[6px] font-display text-[11px] font-extrabold tracking-[0.14em] uppercase text-white/60">
            <span className="w-[7px] h-[7px] rounded-full bg-white/40 inline-block" />
            Día de partido
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/liga-hypermotion-white.webp" alt="Liga Hypermotion" className="h-3 w-auto opacity-55" />
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[14px] mt-[18px] relative z-[1]">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 text-center">
          {loading
            ? <div className="w-[52px] h-[52px] rounded-full bg-white/10" />
            : <TeamCrest name={match?.homeTeam ?? ''} size={52} />
          }
          <div className="font-display font-extrabold text-[14px] tracking-[0.04em] uppercase leading-none">
            {loading ? '—' : match?.homeTeam}
          </div>
        </div>

        {/* Center: score */}
        <div className="text-center">
          {loading ? (
            <div className="w-[76px] h-12 bg-white/10 rounded-md mx-auto" />
          ) : (
            <>
              <div className="font-display font-black text-[48px] leading-none tracking-[0.02em]">
                {isLive || isPost
                  ? <>{match!.homeScore}<span className="text-white/30">–</span>{match!.awayScore}</>
                  : <>0<span className="text-white/30">–</span>0</>
                }
              </div>
              {isLive && match!.clock && (
                <div className="inline-flex items-center gap-[6px] mt-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[var(--gold)] inline-block animate-pulse" />
                  <span className="font-display font-extrabold text-[14px] text-[var(--gold)]">{match!.clock}&apos;</span>
                </div>
              )}
              {isPost && (
                <div className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
                  {ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota' : 'Empate'}
                </div>
              )}
              {!isLive && !isPost && (
                <div className="mt-[6px] font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                  Esperando alineaciones
                </div>
              )}
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 text-center">
          {loading
            ? <div className="w-[52px] h-[52px] rounded-full bg-white/10" />
            : <TeamCrest name={match?.awayTeam ?? ''} size={52} />
          }
          <div className="font-display font-extrabold text-[14px] tracking-[0.04em] uppercase leading-none">
            {loading ? '—' : match?.awayTeam}
          </div>
        </div>
      </div>

      {/* Footer: venue + optional live link */}
      <div className="flex items-center justify-between mt-4 pt-[14px] border-t border-white/10 relative z-[1]">
        {match?.venue ? (
          <span className="flex items-center gap-[6px] font-display text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[var(--red)] shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {match.venue}
          </span>
        ) : <span />}
        {showLiveLink && isLive && (
          <Link href="/live" className="font-display text-[10px] font-black uppercase tracking-[0.1em] text-[var(--red)]">
            Ver en directo →
          </Link>
        )}
      </div>
    </div>
  )
}
