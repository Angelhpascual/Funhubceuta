"use client";

import { useState, useEffect } from "react";
import { findLogo as findLogoUtil } from "@/lib/findLogo";
import { formatMatchDate, shortTeamName, resultLabel } from "./matchUtils";
import Link from "next/link";

interface MatchRow {
  home_team: string
  away_team: string
  date: string
  time: string
  weekday: string
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
  logos?: Record<string, string>
}

export function PartidosPage({ upcoming = [], results = [], logos = {} }: Props) {
  const [tab, setTab] = useState('proximos');

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

  return (
    <div className="page">
      <div className="sec-header" style={{ paddingTop: 20 }}>
        <div>
          <div className="sec-title-small">Temporada 2025–26</div>
          <div className="sec-title">Partidos</div>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 8 }}>
        {[{ id: "proximos", l: "Próximos" }, { id: "resultados", l: "Resultados" }].map(t => (
          <button key={t.id} className={`chip ${tab === t.id ? "active" : ""}`} onClick={() => changePartidosTab(t.id)}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "proximos" && (
        <>
          <div className="month-label">
            {upcoming[0]
              ? new Date(upcoming[0].date).toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toUpperCase())
              : 'Próximos partidos'}
          </div>
          {upcoming.length === 0 ? (
            <div style={{ padding: '20px 16px', fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              No hay próximos partidos
            </div>
          ) : upcoming.map((m, i) => (
            <div key={i} className="fixt-card">
              <div className="fixt-head">
                <div className="fixt-comp">Liga Hypermotion</div>
                <div className="fixt-date">{m.weekday} · {m.time}</div>
              </div>
              <div className="fixt-teams" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {findLogo(m.home_team)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={findLogo(m.home_team)!} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    : <div style={{ width: 28, height: 28, background: 'var(--bg-mid)', borderRadius: '50%' }} />
                  }
                  <div className={`fixt-tname ${m.is_home ? 'mine' : ''}`}>{shortTeamName(m.home_team)}</div>
                </div>
                <div className="fixt-vs">VS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <div className={`fixt-tname away ${!m.is_home ? 'mine' : ''}`}>{shortTeamName(m.away_team)}</div>
                  {findLogo(m.away_team)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={findLogo(m.away_team)!} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    : <div style={{ width: 28, height: 28, background: 'var(--bg-mid)', borderRadius: '50%' }} />
                  }
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {new Date(m.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                  {m.is_home ? ' · A. Murube' : ''}
                </span>
                {m.tickets_url && (
                  <a href={m.tickets_url} target="_blank" rel="noopener noreferrer" className="match-cta" style={{ fontSize: 10, padding: '4px 10px' }}>
                    Entradas
                  </a>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "resultados" && (
        <>
          <div className="month-label">Últimos partidos</div>
          {results.map((r, i) => {
            const { day, mon } = formatMatchDate(r.date)
            const ceutaHome = r.home_team.toLowerCase().includes('ceuta')
            const cls = r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : 'draw'
            const homeScoreCls = ceutaHome ? (r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : '') : (r.result === 'L' ? 'win' : r.result === 'W' ? 'lose' : '')
            const awayScoreCls = !ceutaHome ? (r.result === 'W' ? 'win' : r.result === 'L' ? 'lose' : '') : (r.result === 'L' ? 'win' : r.result === 'W' ? 'lose' : '')
            return (
              <div key={i} className={`result-card ${cls}`}>
                <div className="result-card-row">
                  <div className="result-date-col">
                    <div className="result-day">{day}</div>
                    <div className="result-mon">{mon}</div>
                  </div>
                  <div className="result-teams-col">
                    <div className="result-team-row">
                      {findLogo(r.home_team)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={findLogo(r.home_team)!} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                        : <div style={{ width: 18, height: 18, flexShrink: 0 }} />
                      }
                      <div className={`result-team-name ${ceutaHome ? 'bold' : ''}`}>{shortTeamName(r.home_team)}</div>
                      <div className={`result-score ${homeScoreCls}`}>{r.home_score}</div>
                    </div>
                    <div className="result-team-row">
                      {findLogo(r.away_team)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={findLogo(r.away_team)!} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                        : <div style={{ width: 18, height: 18, flexShrink: 0 }} />
                      }
                      <div className={`result-team-name ${!ceutaHome ? 'bold' : ''}`}>{shortTeamName(r.away_team)}</div>
                      <div className={`result-score ${awayScoreCls}`}>{r.away_score}</div>
                    </div>
                  </div>
                  {resultBadge(r.result)}
                </div>
                {r.espn_event_id && (
                  <Link
                    href={`/alineacion?eventId=${r.espn_event_id}&match=${encodeURIComponent(`${shortTeamName(r.home_team)} vs ${shortTeamName(r.away_team)}`)}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--black)', padding: '10px 14px', textDecoration: 'none',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 14, background: 'var(--red)', borderRadius: 2, flexShrink: 0 }} />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                      </svg>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ver alineación</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, color: 'var(--red)' }}>→</span>
                  </Link>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  );
}
