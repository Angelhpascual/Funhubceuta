'use client'

import { useState, useEffect } from 'react'
import { getLocalLogo } from '@/lib/teamLogos'
import { formatMatchDate, shortTeamName, resultLabel } from './matchUtils'
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

interface Props {
  upcoming?: MatchRow[]
  results?: MatchRow[]
  previousSeason?: MatchRow[]
}

function TeamLogo({ team, size = 20 }: { team: string; size?: number }) {
  const logo = getLocalLogo(team)
  if (logo) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt="" className="shrink-0 object-contain" style={{ width: size, height: size }} />
  )
  return <div className="shrink-0 rounded-full bg-[var(--bg-mid)]" style={{ width: size, height: size }} />
}

function MatchCard({ m }: { m: MatchRow }) {
  const { day, mon } = formatMatchDate(m.date)
  const finished = m.result != null
  const ceutaHome = m.home_team.toLowerCase().includes('ceuta')
  const borderCls = finished
    ? m.result === 'W' ? 'win' : m.result === 'L' ? 'lose' : 'draw'
    : ''
  const badge = finished ? resultLabel(m.result) : null

  const homeScoreCls = finished
    ? (ceutaHome ? (m.result === 'W' ? 'text-[var(--black)]' : 'text-[var(--loss)]') : (m.result === 'L' ? 'text-[var(--black)]' : 'text-[var(--loss)]'))
    : ''
  const awayScoreCls = finished
    ? (!ceutaHome ? (m.result === 'W' ? 'text-[var(--black)]' : 'text-[var(--loss)]') : (m.result === 'L' ? 'text-[var(--black)]' : 'text-[var(--loss)]'))
    : ''

  const dateLabel = new Date(m.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const venueLabel = m.is_home ? ' · A. Murube' : ''

  return (
    <div className={`result-card ${borderCls}`}>
      {/* Teams + score */}
      <div className="result-card-row">
        {/* Date col */}
        <div className="result-date-col">
          <div className="result-day">{day}</div>
          <div className="result-mon">{mon}</div>
        </div>

        {/* Teams col */}
        <div className="result-teams-col">
          <div className="result-team-row">
            <TeamLogo team={m.home_team} size={18} />
            <span className={`result-team-name ${ceutaHome ? 'bold' : ''}`}>
              {shortTeamName(m.home_team)}
            </span>
            {finished && (
              <span className={`font-display text-[26px] font-black leading-none ${homeScoreCls}`}>
                {m.home_score}
              </span>
            )}
          </div>
          <div className="result-team-row">
            <TeamLogo team={m.away_team} size={18} />
            <span className={`result-team-name ${!ceutaHome ? 'bold' : ''}`}>
              {shortTeamName(m.away_team)}
            </span>
            {finished && (
              <span className={`font-display text-[26px] font-black leading-none ${awayScoreCls}`}>
                {m.away_score}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: date/venue + badge + alineación */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
          Liga Hypermotion · {dateLabel}{venueLabel}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {badge && (
            <span className={`result-badge ${badge.cls}`}>{badge.label}</span>
          )}
          {!finished && m.tickets_url && (
            <a
              href={m.tickets_url}
              target="_blank"
              rel="noopener noreferrer"
              className="match-cta px-[10px] py-1 text-[10px]"
            >
              Entradas
            </a>
          )}
          {m.espn_event_id && (
            <Link
              href={`/alineacion?eventId=${m.espn_event_id}&match=${encodeURIComponent(`${shortTeamName(m.home_team)} vs ${shortTeamName(m.away_team)}`)}&score=${m.home_score ?? ''}-${m.away_score ?? ''}`}
              className="flex items-center gap-1 rounded-[6px] border-[1.5px] border-[var(--black)] bg-[var(--black)] px-2 py-[5px] no-underline"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              <span className="whitespace-nowrap font-display text-[9px] font-black uppercase tracking-[0.08em] text-white">
                Alineación
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function groupByMonth(matches: MatchRow[]) {
  const groups: { label: string; matches: MatchRow[] }[] = []
  for (const m of matches) {
    const label = new Date(m.date)
      .toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .replace(/^\w/, (c) => c.toUpperCase())
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.matches.push(m)
    else groups.push({ label, matches: [m] })
  }
  return groups
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
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => changePartidosTab(t.id)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'proximos' && (
        <>
          {upcoming.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay próximos partidos
            </p>
          ) : (
            groupByMonth(upcoming).map((group) => (
              <div key={group.label}>
                <div className="month-label">{group.label}</div>
                {group.matches.map((m, i) => <MatchCard key={i} m={m} />)}
              </div>
            ))
          )}
        </>
      )}

      {tab === 'resultados' && (
        <>
          {results.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay resultados todavía
            </p>
          ) : (
            groupByMonth(results).map((group) => (
              <div key={group.label}>
                <div className="month-label">{group.label}</div>
                {group.matches.map((r, i) => <MatchCard key={i} m={r} />)}
              </div>
            ))
          )}
        </>
      )}

      {tab === 'temporada-anterior' && (
        <>
          {previousSeason.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay datos de la temporada anterior
            </p>
          ) : (
            groupByMonth(previousSeason).map((group) => (
              <div key={group.label}>
                <div className="month-label">{group.label}</div>
                {group.matches.map((r, i) => <MatchCard key={i} m={r} />)}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
