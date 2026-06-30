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
  is_home: boolean
  home_score: number | null
  away_score: number | null
  result: string | null
  tickets_url: string | null
  espn_event_id: string | null
}

const RESULT_CONFIG = {
  W: { label: 'Victoria', bg: '#1E7F47', color: '#fff', short: 'V' },
  D: { label: 'Empate',   bg: 'var(--gold)', color: '#000', short: 'E' },
  L: { label: 'Derrota',  bg: 'var(--red)', color: '#fff', short: 'D' },
} as const

interface Props {
  upcoming?: MatchRow[]
  results?: MatchRow[]
  logos?: Record<string, string>
}

export function PartidosPage({ upcoming = [], results = [], logos = {} }: Props) {
  const [tab, setTab] = useState('proximos')

  useEffect(() => {
    const stored = sessionStorage.getItem('partidosTab')
    if (stored) setTab(stored)
  }, [])

  function changeTab(t: string) {
    sessionStorage.setItem('partidosTab', t)
    setTab(t)
  }

  function findLogo(name: string): string | null {
    return findLogoUtil(logos, name)
  }

  const nextMatch = upcoming[0]
  const nextDate = nextMatch
    ? new Date(nextMatch.date).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
      }).replace(/^\w/, c => c.toUpperCase())
    : null

  return (
    <div className="page">
      {/* ── HERO ── */}
      <div
        className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white"
        style={{ position: 'relative' }}
      >
        {/* diagonal stripes */}
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 0.07,
          }}
        />

        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Temporada 2025–26
        </div>

        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          CAL<em className="not-italic text-ceuta-gold">EN</em>DARIO
          <br />
          <span className="text-[28px]">& RESULTADOS</span>
        </div>

        {nextDate && (
          <div className="mt-3 flex items-center gap-2 font-body text-[12px] text-white/60">
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%', background: '#1E7F47',
                boxShadow: '0 0 0 3px rgba(30,127,71,0.25)', flexShrink: 0,
                display: 'inline-block',
              }}
            />
            Próximo · {nextDate}{nextMatch?.time ? ` · ${nextMatch.time}` : ''}
          </div>
        )}
      </div>

      {/* ── STATS PILLS ── */}
      {results.length > 0 && (() => {
        const w = results.filter(r => r.result === 'W').length
        const d = results.filter(r => r.result === 'D').length
        const l = results.filter(r => r.result === 'L').length
        const pills = [
          { label: 'Victorias', count: w, color: '#1E7F47', textColor: '#fff' },
          { label: 'Empates',   count: d, color: 'var(--gold)', textColor: '#000' },
          { label: 'Derrotas',  count: l, color: 'var(--red)', textColor: '#fff' },
          { label: 'Próximos',  count: upcoming.length, color: 'var(--black)', textColor: '#fff' },
        ]
        return (
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6,
              margin: '-44px 12px 0', position: 'relative', zIndex: 3,
            }}
          >
            {pills.map(p => (
              <div
                key={p.label}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '13px 6px 11px',
                  textAlign: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: 0, height: 4,
                  background: p.color,
                }} />
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28,
                  lineHeight: 0.9, color: 'var(--black)',
                }}>
                  {p.count}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5,
                  color: 'var(--muted)',
                }}>
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ── TABS ── */}
      <div style={{ padding: '20px 12px 8px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'proximos', label: 'Próximos', count: upcoming.length },
            { id: 'resultados', label: 'Resultados', count: results.length },
          ].map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => changeTab(t.id)}
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  border: active ? '1.5px solid var(--black)' : '1.5px solid var(--border)',
                  background: active ? 'var(--black)' : 'var(--white)',
                  color: active ? '#fff' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                {t.label}
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
                  padding: '2px 6px', borderRadius: 4,
                  background: active ? 'rgba(255,255,255,0.15)' : 'var(--bone)',
                  color: active ? '#fff' : 'var(--muted)',
                }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PRÓXIMOS ── */}
      {tab === 'proximos' && (
        <div style={{ padding: '0 12px 24px' }}>
          {upcoming.length === 0 ? (
            <div style={{
              padding: '48px 0', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)',
            }}>
              No hay próximos partidos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map((m, i) => {
                const dateStr = new Date(m.date).toLocaleDateString('es-ES', {
                  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
                }).replace(/^\w/, c => c.toUpperCase())
                const isHome = m.is_home

                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* top accent bar */}
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: 0, height: 4,
                      background: 'var(--red)',
                    }} />

                    <div style={{ padding: '18px 16px 14px' }}>
                      {/* meta row */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 14,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
                        }}>
                          Liga Hypermotion
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--black)',
                        }}>
                          {dateStr}{m.time ? ` · ${m.time}` : ''}
                        </span>
                      </div>

                      {/* teams row */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                        alignItems: 'center', gap: 12,
                      }}>
                        {/* home */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          {findLogo(m.home_team) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={findLogo(m.home_team)!} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bone)' }} />
                          )}
                          <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                            textTransform: 'uppercase', letterSpacing: '0.02em',
                            color: isHome ? 'var(--red)' : 'var(--black)',
                            textAlign: 'center', lineHeight: 1.1,
                          }}>
                            {shortTeamName(m.home_team)}
                          </div>
                        </div>

                        {/* vs */}
                        <div style={{
                          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18,
                          color: 'var(--border)', letterSpacing: '0.05em',
                        }}>
                          VS
                        </div>

                        {/* away */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          {findLogo(m.away_team) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={findLogo(m.away_team)!} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bone)' }} />
                          )}
                          <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                            textTransform: 'uppercase', letterSpacing: '0.02em',
                            color: !isHome ? 'var(--red)' : 'var(--black)',
                            textAlign: 'center', lineHeight: 1.1,
                          }}>
                            {shortTeamName(m.away_team)}
                          </div>
                        </div>
                      </div>

                      {/* footer */}
                      {(isHome || m.tickets_url) && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border)',
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
                          }}>
                            {isHome ? '🏟 A. Murube' : ''}
                          </span>
                          {m.tickets_url && (
                            <a
                              href={m.tickets_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                background: 'var(--red)', color: '#fff',
                                padding: '5px 12px', borderRadius: 6, textDecoration: 'none',
                              }}
                            >
                              Entradas
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {tab === 'resultados' && (
        <div style={{ padding: '0 12px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => {
              const { day, mon } = formatMatchDate(r.date)
              const ceutaHome = r.home_team.toLowerCase().includes('ceuta')
              const res = r.result as 'W' | 'D' | 'L' | null
              const cfg = res ? RESULT_CONFIG[res] : null

              const homeScoreHighlight = ceutaHome
                ? (res === 'W' ? 'win' : res === 'L' ? 'lose' : '')
                : (res === 'L' ? 'win' : res === 'W' ? 'lose' : '')
              const awayScoreHighlight = !ceutaHome
                ? (res === 'W' ? 'win' : res === 'L' ? 'lose' : '')
                : (res === 'L' ? 'win' : res === 'W' ? 'lose' : '')

              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* left result bar */}
                  {cfg && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                      background: cfg.bg,
                    }} />
                  )}

                  <div style={{ padding: '12px 14px 12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* date */}
                    <div style={{
                      flexShrink: 0, textAlign: 'center', minWidth: 32,
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
                        lineHeight: 1, color: 'var(--black)',
                      }}>
                        {day}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)',
                        marginTop: 1,
                      }}>
                        {mon}
                      </div>
                    </div>

                    {/* teams + score */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {[
                        { name: r.home_team, score: r.home_score, scoreClass: homeScoreHighlight, bold: ceutaHome },
                        { name: r.away_team, score: r.away_score, scoreClass: awayScoreHighlight, bold: !ceutaHome },
                      ].map((team, ti) => (
                        <div
                          key={ti}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            paddingBottom: ti === 0 ? 7 : 0,
                            paddingTop: ti === 1 ? 7 : 0,
                            borderTop: ti === 1 ? '1px solid var(--border)' : undefined,
                          }}
                        >
                          {findLogo(team.name) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={findLogo(team.name)!} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 18, height: 18, flexShrink: 0 }} />
                          )}
                          <div style={{
                            flex: 1, minWidth: 0,
                            fontFamily: 'var(--font-display)', fontWeight: team.bold ? 800 : 600,
                            fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.02em',
                            color: team.bold ? 'var(--black)' : 'var(--muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {shortTeamName(team.name)}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18,
                            color: team.scoreClass === 'win' ? '#1E7F47'
                              : team.scoreClass === 'lose' ? 'var(--red)'
                              : 'var(--black)',
                            minWidth: 20, textAlign: 'right',
                          }}>
                            {team.score ?? '—'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* result badge + alineación */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      {cfg && (
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '4px 8px', borderRadius: 5,
                          background: cfg.bg, color: cfg.color,
                        }}>
                          {cfg.label}
                        </div>
                      )}
                      {r.espn_event_id && (
                        <Link
                          href={`/alineacion?eventId=${r.espn_event_id}&match=${encodeURIComponent(`${shortTeamName(r.home_team)} vs ${shortTeamName(r.away_team)}`)}&score=${r.home_score}-${r.away_score}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'var(--bone)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '4px 8px', textDecoration: 'none',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M3 15h18M9 3v18" />
                          </svg>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900,
                            color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.08em',
                            whiteSpace: 'nowrap',
                          }}>
                            Alineación
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
