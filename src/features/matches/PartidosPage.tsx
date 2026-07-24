'use client'

import { useState, useEffect } from 'react'
import { getLocalLogo } from '@/lib/teamLogos'
import { shortTeamName } from './matchUtils'
import Link from 'next/link'

interface MatchRow {
  home_team: string
  away_team: string
  date: string
  time: string
  weekday: string
  matchday: number | null
  is_home: boolean
  home_score: number | null
  away_score: number | null
  result: string | null
  tickets_url: string | null
  espn_event_id: string | null
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

function SmallCrest({ name, size = 32 }: { name: string; size?: number }) {
  const logo = getLocalLogo(name)
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'var(--bg-soft)',
        border: '1px solid var(--border)',
      }}
    >
      {logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logo} alt={name} style={{ width: size * 0.68, height: size * 0.68 }} className="object-contain" />
        : <span className="font-display font-black text-[var(--muted)]" style={{ fontSize: size * 0.3 }}>
            {name.slice(0, 3).toUpperCase()}
          </span>
      }
    </div>
  )
}

// Featured next match card (dark, design-style)
function NextMatchCard({ m }: { m: MatchRow }) {
  const dateLabel = new Date(m.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).replace(/^\w/, c => c.toUpperCase())

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] bg-[var(--black)] text-white mx-0 mb-4 px-[18px] pb-[18px] pt-4">
      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 w-[110px]"
        style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 9px,rgba(255,255,255,.05) 9px 18px)' }}
      />
      {/* Top */}
      <div className="relative z-[1] flex items-center justify-between">
        <span className="flex items-center gap-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--red)]">
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--red)]" />
          Próximo partido
        </span>
        {m.matchday && (
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/50">
            Jornada {m.matchday}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="relative z-[1] mt-4 grid items-center gap-[10px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <div className="flex flex-col items-center gap-[7px] text-center">
          <TeamCrest name={m.home_team} size={54} />
          <div>
            <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
              {shortTeamName(m.home_team)}
            </div>
            <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
              {m.is_home ? 'Local' : 'Visitante'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-display font-black text-[19px] text-white/28 leading-none">VS</div>
          <div className="font-display font-black text-[14px] uppercase tracking-[0.04em] mt-[5px] leading-tight whitespace-nowrap">
            {dateLabel}
          </div>
          {m.time && m.time !== '' ? (
            <div className="font-display font-black text-[27px] text-[var(--gold)] leading-none mt-[2px]">
              {m.time} <span className="text-[12px] font-bold text-white/50">h</span>
            </div>
          ) : (
            <div className="mt-1 inline-block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] bg-[var(--gold-soft,#FFF6CC)] text-[#8A6D00] rounded-[3px] px-[6px] py-[2px]">
              Por confirmar
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-[7px] text-center">
          <TeamCrest name={m.away_team} size={54} />
          <div>
            <div className="font-display font-black text-[14px] uppercase tracking-[0.03em] leading-tight">
              {shortTeamName(m.away_team)}
            </div>
            <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mt-0.5">
              {!m.is_home ? 'Local' : 'Visitante'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-[1] mt-[15px] pt-3 border-t border-white/10 flex justify-center gap-[14px] flex-wrap">
        {m.is_home && (
          <span className="flex items-center gap-[5px] font-display text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-[var(--red)]">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Alfonso Murube
          </span>
        )}
        {m.tickets_url && (
          <a
            href={m.tickets_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[10.5px] font-black uppercase tracking-[0.1em] bg-[var(--red)] text-white px-3 py-1.5 rounded-[6px] no-underline"
          >
            Entradas
          </a>
        )}
      </div>
    </div>
  )
}

// Compact upcoming match row
function UpcomingRow({ m }: { m: MatchRow }) {
  return (
    <div className="mx-0 mb-2 bg-white border border-[var(--border)] rounded-[var(--radius)] px-[14px] py-3 grid items-center gap-2"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}>
      {/* Home */}
      <div className="flex items-center gap-2 min-w-0">
        <SmallCrest name={m.home_team} size={32} />
        <div className="min-w-0">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.02em] leading-tight truncate">
            {shortTeamName(m.home_team)}
          </div>
          <div className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mt-0.5">Local</div>
        </div>
      </div>

      {/* Center */}
      <div className="text-center min-w-[74px]">
        <div className="font-display font-black text-[12px] uppercase tracking-[0.05em] leading-tight">
          {new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
        </div>
        {m.time && m.time !== '' ? (
          <div className="font-display font-black text-[17px] text-[var(--red)] leading-tight mt-0.5">{m.time}</div>
        ) : (
          <div className="mt-1 inline-block font-display text-[7.5px] font-bold uppercase tracking-[0.08em] bg-[#FFF6CC] text-[#8A6D00] rounded-[3px] px-[5px] py-[2px]">
            Por confirmar
          </div>
        )}
        {m.matchday && (
          <div className="font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] mt-0.5">
            Jornada {m.matchday}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center justify-end gap-2 min-w-0">
        <div className="min-w-0 text-right">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.02em] leading-tight truncate">
            {shortTeamName(m.away_team)}
          </div>
          <div className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mt-0.5">Visitante</div>
        </div>
        <SmallCrest name={m.away_team} size={32} />
      </div>
    </div>
  )
}

function ResultCard({ r }: { r: MatchRow }) {
  return (
    <div className="mx-0 mb-2 bg-white border border-[var(--border)] rounded-[var(--radius)] px-[14px] py-3 grid items-center gap-2"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}>
      {/* Home */}
      <div className="flex items-center gap-2 min-w-0">
        <SmallCrest name={r.home_team} size={32} />
        <div className="min-w-0">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.02em] leading-tight truncate">
            {shortTeamName(r.home_team)}
          </div>
          <div className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mt-0.5">Local</div>
        </div>
      </div>

      {/* Score */}
      <div className="text-center min-w-[74px]">
        <div className="font-display font-black text-[11.5px] uppercase tracking-[0.05em] text-[var(--muted)] leading-tight">
          {new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
        </div>
        <div className="font-display font-black text-[24px] text-[var(--black)] leading-tight mt-0.5 tracking-[0.04em]">
          {r.home_score}<span className="text-[16px] text-[var(--muted)] mx-[3px]">–</span>{r.away_score}
        </div>
        {r.espn_event_id && (
          <Link
            href={`/alineacion?eventId=${r.espn_event_id}&match=${encodeURIComponent(`${shortTeamName(r.home_team)} vs ${shortTeamName(r.away_team)}`)}&score=${r.home_score}-${r.away_score}`}
            className="mt-1 inline-flex items-center gap-1 border border-[var(--border)] rounded-[5px] px-[7px] py-[3px] no-underline bg-[var(--bg-soft)]"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
            <span className="font-display text-[8.5px] font-black uppercase tracking-[0.08em] text-[var(--black)]">Alineación</span>
          </Link>
        )}
        {!r.espn_event_id && (
          <div className="mt-1 font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            {r.matchday ? `J${r.matchday}` : ''}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center justify-end gap-2 min-w-0">
        <div className="min-w-0 text-right">
          <div className="font-display font-bold text-[13px] uppercase tracking-[0.02em] leading-tight truncate">
            {shortTeamName(r.away_team)}
          </div>
          <div className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mt-0.5">Visitante</div>
        </div>
        <SmallCrest name={r.away_team} size={32} />
      </div>
    </div>
  )
}

interface Props {
  upcoming?: MatchRow[]
  results?: MatchRow[]
  previousSeason?: MatchRow[]
}

export function PartidosPage({ upcoming = [], results = [], previousSeason = [] }: Props) {
  const [tab, setTab] = useState('proximos')

  useEffect(() => {
    const stored = sessionStorage.getItem('partidosTab')
    if (stored) setTab(stored)
  }, [])

  function changePartidosTab(t: string) {
    sessionStorage.setItem('partidosTab', t)
    setTab(t)
  }

  const tabs = [
    { id: 'proximos', l: 'Próximos' },
    { id: 'resultados', l: 'Resultados' },
    ...(previousSeason.length > 0 ? [{ id: 'temporada-anterior', l: 'Temp. 25/26' }] : []),
  ]

  // Group matches by month
  function groupByMonth(matches: MatchRow[]) {
    const groups: { label: string; matches: MatchRow[] }[] = []
    for (const m of matches) {
      const label = new Date(m.date)
        .toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .replace(/^\w/, c => c.toUpperCase())
      const existing = groups.find(g => g.label === label)
      if (existing) existing.matches.push(m)
      else groups.push({ label, matches: [m] })
    }
    return groups
  }

  const upcomingGroups = groupByMonth(upcoming.slice(1)) // skip first (featured)
  const prevByMonth = groupByMonth(previousSeason)

  return (
    <div className="page">
      {/* ── HERO ── */}
      <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Temporada 2026–27 · Liga Hypermotion
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          PARTIDOS <em className="not-italic text-ceuta-gold">Y</em>
          <br />
          <em className="not-italic text-ceuta-gold">RESULTADOS</em>
        </div>
      </div>

      <div className="chips mt-4 mb-2">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => changePartidosTab(t.id)}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2 pb-8">
        {tab === 'proximos' && (
          <>
            {upcoming.length === 0 ? (
              <p className="py-5 font-display text-[13px] uppercase tracking-[0.06em] text-[var(--muted)]">
                No hay próximos partidos
              </p>
            ) : (
              <>
                {/* Featured next match */}
                <NextMatchCard m={upcoming[0]} />

                {/* Remaining by month */}
                {upcomingGroups.map(group => (
                  <div key={group.label}>
                    <div className="month-label">{group.label}</div>
                    {group.matches.map((m, i) => <UpcomingRow key={i} m={m} />)}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'resultados' && (
          <>
            {results.length === 0 ? (
              <p className="py-5 font-display text-[13px] uppercase tracking-[0.06em] text-[var(--muted)]">
                No hay resultados todavía
              </p>
            ) : (
              results.map((r, i) => <ResultCard key={i} r={r} />)
            )}
          </>
        )}

        {tab === 'temporada-anterior' && (
          <>
            <div className="py-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Temporada 2025–26
            </div>
            {previousSeason.length === 0 ? (
              <p className="py-5 font-display text-[13px] uppercase tracking-[0.06em] text-[var(--muted)]">
                No hay datos de la temporada anterior
              </p>
            ) : (
              prevByMonth.map(group => (
                <div key={group.label}>
                  <div className="month-label">{group.label}</div>
                  {group.matches.map((r, i) => <ResultCard key={i} r={r} />)}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
