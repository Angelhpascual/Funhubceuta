'use client'

import Link from 'next/link'
import type { CareerEntry, Player } from './clubTypes'

const NAT_FLAGS: Record<string, string> = {
  españa: '🇪🇸', mali: '🇲🇱', senegal: '🇸🇳', guinea: '🇬🇳',
  'guinea-bisáu': '🇬🇼', 'guinea bisáu': '🇬🇼',
  argentina: '🇦🇷', uruguay: '🇺🇾', colombia: '🇨🇴', francia: '🇫🇷',
  marruecos: '🇲🇦', argelia: '🇩🇿', camerún: '🇨🇲', brasil: '🇧🇷',
  portugal: '🇵🇹', ghana: '🇬🇭', nigeria: '🇳🇬',
}

function flag(nat: string): string {
  if (!nat) return ''
  const key = nat.toLowerCase()
  for (const [k, v] of Object.entries(NAT_FLAGS)) {
    if (key.includes(k)) return v
  }
  return ''
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return { first: '', last: parts[0] }
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return { first, last }
}

interface PlayerStats {
  appearances: number | null
  goals: number | null
  assists: number | null
  shots: number | null
  shots_on_target: number | null
  saves: number | null
  yellow_cards: number | null
  red_cards: number | null
}

interface Props {
  player: Player
  stats: PlayerStats | null
}

export function PlayerDetailPage({ player, stats }: Props) {
  const isGK = player.position.toUpperCase().includes('PORTERO')
  const hasNat = player.nationality && !player.nationality.match(/^\d+/)
  const natFlag = hasNat ? flag(player.nationality) : ''
  const { first, last } = splitName(player.name)

  const heroStat = isGK
    ? { label: 'Paradas', value: stats?.saves ?? null }
    : { label: 'Goles', value: stats?.goals ?? null }

  return (
    <div id="app-root">
      <div className="page">

        {/* ── TOP BAR ── */}
        <div className="pd-topbar">
          <Link href="/club?tab=plantilla" className="pd-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Plantilla
          </Link>
        </div>

        {/* ── HERO ── */}
        <div className="pd-hero">
          <div className="pd-hero-bignum">{player.dorsal ?? ''}</div>

          {player.photo_url && (
            <div className="pd-hero-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.photo_url}
                alt={player.name}
                className="pd-hero-photo-img"
              />
            </div>
          )}

          <div className="pd-hero-content">
            <div className="pd-hero-eyebrow">AD Ceuta FC</div>
            {first && <div className="pd-hero-firstname">{first}</div>}
            <div className="pd-hero-lastname">{last}</div>
            <span className="pd-pos-badge">{capitalize(player.position)}</span>
          </div>

          {/* franja roja bottom */}
          <div className="pd-hero-redline" />
        </div>

        {/* ── META STRIP ── */}
        <div className="pd-meta-strip">
          <div className="pd-meta-cell">
            <div className="pd-meta-value">#{player.dorsal ?? '—'}</div>
            <div className="pd-meta-label">Dorsal</div>
          </div>
          <div className="pd-meta-cell">
            <div className="pd-meta-value">{capitalize(player.position)}</div>
            <div className="pd-meta-label">Posición</div>
          </div>
          <div className="pd-meta-cell">
            <div className="pd-meta-value">{player.position_group}</div>
            <div className="pd-meta-label">Grupo</div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="pd-body">

          {/* ── FICHA FÍSICA ── */}
          {(player.height || player.weight || hasNat) && (
            <>
              <div className="pd-sec-eyebrow">Ficha técnica</div>
              <div className="pd-bio-grid">
                {player.height && (
                  <div className="pd-bio-tile">
                    <div className="pd-bio-value">{player.height.replace(/\s*(cm|CM)/i, '')}<span className="pd-bio-unit">cm</span></div>
                    <div className="pd-bio-label">Altura</div>
                  </div>
                )}
                {player.weight && (
                  <div className="pd-bio-tile">
                    <div className="pd-bio-value">{player.weight.replace(/\s*(kg|KG)/i, '')}<span className="pd-bio-unit">kg</span></div>
                    <div className="pd-bio-label">Peso</div>
                  </div>
                )}
                {hasNat && (
                  <div className="pd-bio-tile">
                    <div className="pd-bio-flag">{natFlag}</div>
                    <div className="pd-bio-label">{player.nationality}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {stats && (
            <div className="pd-stats-card">
              <div className="pd-stats-eyebrow">Estadísticas · 2025–26</div>
              <div className="pd-stat-hero">
                <div className="pd-stat-hero-v">{heroStat.value ?? 0}</div>
                <div className="pd-stat-hero-l">{heroStat.label}</div>
              </div>
              <div className="pd-stat-row">
                {stats.appearances != null && (
                  <div className="pd-stat-mini">
                    <div className="pd-stat-mini-v">{stats.appearances}</div>
                    <div className="pd-stat-mini-l">Partidos</div>
                  </div>
                )}
                {!isGK && stats.assists != null && (
                  <div className="pd-stat-mini">
                    <div className="pd-stat-mini-v">{stats.assists}</div>
                    <div className="pd-stat-mini-l">Asistencias</div>
                  </div>
                )}
                {stats.yellow_cards != null && (
                  <div className="pd-stat-mini">
                    <div className="pd-stat-mini-v pd-stat-mini-v--gold">{stats.yellow_cards}</div>
                    <div className="pd-stat-mini-l">Amarillas</div>
                  </div>
                )}
                {stats.red_cards != null && (
                  <div className="pd-stat-mini">
                    <div className="pd-stat-mini-v">{stats.red_cards}</div>
                    <div className="pd-stat-mini-l">Rojas</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TRAYECTORIA ── */}
          {player.career_history && player.career_history.length > 0 && (
            <>
              <div className="pd-sec-eyebrow">Trayectoria · Equipos anteriores</div>
              <div className="pd-timeline">
                {(player.career_history as CareerEntry[]).map((entry, i) => {
                  const isCurrent = i === 0
                  return (
                    <div key={i} className={`pd-tl-item${isCurrent ? ' pd-tl-item--current' : ''}`}>
                      <div className="pd-tl-marker">
                        <div className="pd-tl-dot" />
                        <div className="pd-tl-years">{entry.seasons}</div>
                      </div>
                      <div className="pd-tl-body">
                        {entry.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.logo} alt={entry.club} className="pd-tl-crest-img" />
                        ) : (
                          <div className="pd-tl-crest">
                            {entry.club.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="pd-tl-info">
                          <div className="pd-tl-club">{entry.club}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
