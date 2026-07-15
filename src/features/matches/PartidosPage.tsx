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

function resultBadge(r: string | null) {
  const item = resultLabel(r)
  if (!item) return null
  return <span className={`result-badge ${item.cls}`}>{item.label}</span>
}

interface Props {
  upcoming?: MatchRow[]
  results?: MatchRow[]
  previousSeason?: MatchRow[]

}

function ResultCard({ r }: { r: MatchRow }) {
  const ceutaHome = r.home_team.toLowerCase().includes('ceuta')

  return (
    <div className="fixt-card">
      <div className="fixt-head">
        <div className="fixt-comp">Liga Hypermotion</div>
        <div className="fixt-date">
          {new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
        </div>
      </div>

      <div className="fixt-teams items-center">
        <div className="flex items-center gap-2">
          {getLocalLogo(r.home_team)
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={getLocalLogo(r.home_team) ?? ''} alt="" className="size-7 object-contain" />
            : <div className="size-7 rounded-full bg-ceuta-bg-mid" />}
          <div className={`fixt-tname ${ceutaHome ? 'mine' : ''}`}>{shortTeamName(r.home_team)}</div>
        </div>

        {/* Score centered */}
        <div className="flex items-center gap-3 font-display font-black leading-none">
          <span className={`text-[38px] ${ceutaHome ? 'text-ceuta-red' : 'text-ceuta-black'}`}>{r.home_score}</span>
          <span className="text-[20px] text-ceuta-muted">–</span>
          <span className={`text-[38px] ${!ceutaHome ? 'text-ceuta-red' : 'text-ceuta-black'}`}>{r.away_score}</span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className={`fixt-tname away ${!ceutaHome ? 'mine' : ''}`}>{shortTeamName(r.away_team)}</div>
          {getLocalLogo(r.away_team)
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={getLocalLogo(r.away_team) ?? ''} alt="" className="size-7 object-contain" />
            : <div className="size-7 rounded-full bg-ceuta-bg-mid" />}
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-display text-[11px] uppercase tracking-[0.08em] text-ceuta-muted">
          {r.is_home ? 'A. Murube' : ''}
        </span>
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
  )
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
                    {m.time && m.time !== '' ? m.time : 'Por confirmar'}
                  </div>
                </div>
                <div className="fixt-teams items-center">
                  <div className="flex items-center gap-2">
                    {getLocalLogo(m.home_team) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getLocalLogo(m.home_team) ?? ''} alt="" className="size-7 object-contain" />
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
                    {getLocalLogo(m.away_team) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getLocalLogo(m.away_team) ?? ''} alt="" className="size-7 object-contain" />
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
          {results.length === 0 ? (
            <p className="px-4 py-5 font-display text-[13px] uppercase tracking-[0.06em] text-ceuta-muted">
              No hay resultados todavía
            </p>
          ) : (
            results.map((r, i) => <ResultCard key={i} r={r} />)
          )}
        </>
      )}

      {tab === 'temporada-anterior' && (
        <>
          <div className="px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Temporada 2025–26 · Temporada anterior
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
                  <ResultCard key={i} r={r} />
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
