'use client'

import { useState, useEffect } from 'react'
import { findLogo as findLogoUtil } from '@/lib/findLogo'
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

function resultBadge(r: string | null) {
  const item = resultLabel(r)
  if (!item) return null
  return <span className={`result-badge ${item.cls}`}>{item.label}</span>
}

interface Props {
  upcoming?: MatchRow[]
  results?: MatchRow[]
  previousSeason?: MatchRow[]
  logos?: Record<string, string>
}

function ResultCard({ r, logos }: { r: MatchRow; logos: Record<string, string> }) {
  function findLogo(name: string): string | null {
    return findLogoUtil(logos, name)
  }
  const { day, mon } = formatMatchDate(r.date)
  const ceutaHome = r.home_team.toLowerCase().includes('ceuta')
  const cls = r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : 'draw'
  const homeScoreCls = ceutaHome
    ? r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : ''
    : r.result === 'L' ? 'win' : r.result === 'W' ? 'lose' : ''
  const awayScoreCls = !ceutaHome
    ? r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : ''
    : r.result === 'L' ? 'win' : r.result === 'W' ? 'lose' : ''

  return (
    <div className={`result-card ${cls}`}>
      <div className="result-card-row">
        <div className="result-date-col">
          <div className="result-day">{day}</div>
          <div className="result-mon">{mon}</div>
        </div>
        <div className="result-teams-col">
          <div className="result-team-row">
            {findLogo(r.home_team) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={findLogo(r.home_team)!} alt="" className="size-[18px] shrink-0 object-contain" />
            ) : (
              <div className="size-[18px] shrink-0" />
            )}
            <div className={`result-team-name ${ceutaHome ? 'bold' : ''}`}>
              {shortTeamName(r.home_team)}
            </div>
            <div className={`result-score ${homeScoreCls}`}>{r.home_score}</div>
          </div>
          <div className="result-team-row">
            {findLogo(r.away_team) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={findLogo(r.away_team)!} alt="" className="size-[18px] shrink-0 object-contain" />
            ) : (
              <div className="size-[18px] shrink-0" />
            )}
            <div className={`result-team-name ${!ceutaHome ? 'bold' : ''}`}>
              {shortTeamName(r.away_team)}
            </div>
            <div className={`result-score ${awayScoreCls}`}>{r.away_score}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {resultBadge(r.result)}
          {r.espn_event_id && (
            <Link
              href={`/alineacion?eventId=${r.espn_event_id}&match=${encodeURIComponent(`${shortTeamName(r.home_team)} vs ${shortTeamName(r.away_team)}`)}&score=${r.home_score}-${r.away_score}`}
              className="flex items-center gap-1.5 rounded-[6px] border-[1.5px] border-ceuta-black bg-ceuta-black px-2 py-1 no-underline"
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

export function PartidosPage({ upcoming = [], results = [], previousSeason = [], logos = {} }: Props) {
  const [tab, setTab] = useState('proximos')

  useEffect(() => {
    const stored = sessionStorage.getItem('partidosTab')
    if (stored) setTab(stored)
  }, [])

  function changePartidosTab(t: string) {
    sessionStorage.setItem('partidosTab', t)
    setTab(t)
  }

  function findLogo(name: string): string | null {
    return findLogoUtil(logos, name)
  }

  // Group previousSeason matches by month label
  const prevByMonth: { label: string; matches: MatchRow[] }[] = []
  for (const m of previousSeason) {
    const label = new Date(m.date)
      .toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .replace(/^\w/, (c) => c.toUpperCase())
    const existing = prevByMonth.find((g) => g.label === label)
    if (existing) existing.matches.push(m)
    else prevByMonth.push({ label, matches: [m] })
  }

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
        {[
          { id: 'proximos', l: 'Próximos' },
          { id: 'resultados', l: 'Resultados' },
          { id: 'temporada-anterior', l: 'Temp. 25/26' },
        ].map((t) => (
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
          <div className="month-label">
            {upcoming[0]
              ? new Date(upcoming[0].date)
                  .toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
                  .replace(/^\w/, (c) => c.toUpperCase())
              : 'Próximos partidos'}
          </div>
          {upcoming.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay próximos partidos
            </p>
          ) : (
            upcoming.map((m, i) => (
              <div key={i} className="fixt-card">
                <div className="fixt-head">
                  <div className="fixt-comp">Liga Hypermotion</div>
                  <div className="fixt-date">
                    {m.matchday ? `Jornada ${m.matchday}` : 'Por confirmar'}
                  </div>
                </div>
                <div className="fixt-teams items-center">
                  <div className="flex items-center gap-2">
                    {findLogo(m.home_team) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={findLogo(m.home_team)!} alt="" className="size-7 object-contain" />
                    ) : (
                      <div className="size-7 rounded-full bg-ceuta-bg-mid" />
                    )}
                    <div className={`fixt-tname ${m.is_home ? 'mine' : ''}`}>
                      {shortTeamName(m.home_team)}
                    </div>
                  </div>
                  <div className="fixt-vs">VS</div>
                  <div className="flex items-center justify-end gap-2">
                    <div className={`fixt-tname away ${!m.is_home ? 'mine' : ''}`}>
                      {shortTeamName(m.away_team)}
                    </div>
                    {findLogo(m.away_team) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={findLogo(m.away_team)!} alt="" className="size-7 object-contain" />
                    ) : (
                      <div className="size-7 rounded-full bg-ceuta-bg-mid" />
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-display text-[11px] uppercase tracking-[0.08em] text-ceuta-muted">
                    {new Date(m.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'UTC',
                    })}
                    {m.is_home ? ' · A. Murube' : ''}
                  </span>
                  {m.tickets_url && (
                    <a
                      href={m.tickets_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="match-cta px-[10px] py-1 text-[10px]"
                    >
                      Entradas
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'resultados' && (
        <>
          <div className="month-label">Últimos partidos</div>
          {results.map((r, i) => (
            <ResultCard key={i} r={r} logos={logos} />
          ))}
        </>
      )}

      {tab === 'temporada-anterior' && (
        <>
          <div className="px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Temporada 2025–26 · Liga Hypermotion
          </div>
          {previousSeason.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay datos de la temporada anterior
            </p>
          ) : (
            prevByMonth.map((group) => (
              <div key={group.label}>
                <div className="month-label">{group.label}</div>
                {group.matches.map((r, i) => (
                  <ResultCard key={i} r={r} logos={logos} />
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
