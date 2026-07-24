'use client'

import { getLocalLogo } from '@/lib/teamLogos'
import { getMatchVenue } from '@/lib/stadiums'

export interface NextMatchData {
  homeTeam: string
  awayTeam: string
  date: string
  time: string | null
  isHome: boolean
  matchday?: number | null
  ticketsUrl?: string | null
}

function TeamCrest({ name, size = 54 }: { name: string; size?: number }) {
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
        ? <img src={logo} alt={name} style={{ width: size * 0.74, height: size * 0.74 }} className="object-contain" />
        : <span className="font-display font-black text-white/85" style={{ fontSize: size * 0.3 }}>
            {name.slice(0, 3).toUpperCase()}
          </span>
      }
    </div>
  )
}

function shortName(name: string): string {
  return name
    .replace('AD CEUTA FC', 'AD Ceuta')
    .replace('CEUTA FC', 'AD Ceuta')
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export function NextMatchBanner({ match }: { match: NextMatchData }) {
  const { homeTeam, awayTeam, date, time, isHome, matchday, ticketsUrl } = match

  const dateLabel = new Date(`${date}T12:00:00`)
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .replace(/^\w/, c => c.toUpperCase())

  const hasTime = !!time && time !== '' && time !== '00:00'
  const venue = getMatchVenue(homeTeam, awayTeam)

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-ceuta-black text-white px-[18px] pb-[18px] pt-4">
      {/* Diagonal stripes */}
      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 w-[110px]"
        style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 9px,rgba(255,255,255,.05) 9px 18px)' }}
      />

      {/* Header */}
      <div className="relative z-[1] flex items-center justify-between">
        <span className="flex items-center gap-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-ceuta-red">
          <span className="w-[5px] h-[5px] rounded-full bg-ceuta-red" />
          Próximo partido
        </span>
        {matchday && (
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/50">
            Jornada {matchday}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="relative z-[1] mt-4 grid items-center gap-[10px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        {/* Home team */}
        <div className="flex flex-col items-center gap-[7px] text-center">
          <TeamCrest name={homeTeam} size={54} />
          <div>
            <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
              {shortName(homeTeam)}
            </div>
            <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
              {isHome ? 'Local' : 'Visitante'}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="text-center">
          <div className="font-display font-black text-[19px] text-white/28 leading-none">VS</div>
          <div className="font-display font-black text-[14px] uppercase tracking-[0.04em] mt-[5px] leading-tight whitespace-nowrap">
            {dateLabel}
          </div>
          {hasTime ? (
            <div className="font-display font-black text-[27px] text-[var(--gold,#FFD700)] leading-none mt-[2px]">
              {time} <span className="text-[12px] font-bold text-white/50">h</span>
            </div>
          ) : (
            <div className="mt-1 inline-block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] bg-[#FFF6CC] text-[#8A6D00] rounded-[3px] px-[6px] py-[2px]">
              Por confirmar
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-[7px] text-center">
          <TeamCrest name={awayTeam} size={54} />
          <div>
            <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
              {shortName(awayTeam)}
            </div>
            <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
              {!isHome ? 'Local' : 'Visitante'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-[1] mt-[15px] pt-3 border-t border-white/10 flex justify-center gap-[14px] flex-wrap items-center">
        {venue && (
          <span className="flex items-center gap-[5px] font-display text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-ceuta-red">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {venue}
          </span>
        )}
        {ticketsUrl && (
          <a
            href={ticketsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[10.5px] font-black uppercase tracking-[0.1em] bg-ceuta-red text-white px-3 py-1.5 rounded-[6px] no-underline"
          >
            Entradas
          </a>
        )}
      </div>
    </div>
  )
}
