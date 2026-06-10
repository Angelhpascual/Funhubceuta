'use client'

import Link from 'next/link'
import type { Player } from './clubTypes'

const NAT_FLAGS: Record<string, string> = {
  españa: '🇪🇸', mali: '🇲🇱', senegal: '🇸🇳', guinea: '🇬🇳',
  'guinea-bisáu': '🇬🇼', 'guinea bisáu': '🇬🇼',
  argentina: '🇦🇷', uruguay: '🇺🇾', colombia: '🇨🇴', francia: '🇫🇷',
  marruecos: '🇲🇦', argelia: '🇩🇿', camerún: '🇨🇲', brasil: '🇧🇷',
  portugal: '🇵🇹', ghana: '🇬🇭', nigeria: '🇳🇬',
}

function flag(nat: string): string {
  if (!nat) return '🏴'
  const key = nat.toLowerCase()
  for (const [k, v] of Object.entries(NAT_FLAGS)) {
    if (key.includes(k)) return v
  }
  return '🏴'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
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

function StatTile({ label, value, accent }: { label: string; value: string | number | null; accent?: boolean }) {
  return (
    <div className="stat-tile" style={accent ? { background: 'var(--red)' } : undefined}>
      <div className="stat-value" style={accent ? { color: 'var(--white)' } : undefined}>
        {value ?? '—'}
      </div>
      <div className="stat-label" style={accent ? { color: 'rgba(255,255,255,0.7)' } : undefined}>
        {label}
      </div>
    </div>
  )
}

export function PlayerDetailPage({ player, stats }: Props) {
  const isGK = player.position.toUpperCase().includes('PORTERO')
  const hasNat = player.nationality && !player.nationality.match(/^\d+/)

  return (
    <div id="app-root">
      <div className="page">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-ceuta-black" style={{ paddingBottom: 48 }}>
          {/* diagonal stripes */}
          <div
            className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[200px]"
            style={{
              background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
              clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
              opacity: 0.06,
            }}
          />

          {/* back */}
          <div className="px-4 pt-5">
            <Link href="/club?tab=plantilla" className="flex w-fit items-center gap-1.5 text-ceuta-muted no-underline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Plantilla</span>
            </Link>
          </div>

          {/* dorsal + name */}
          <div className="relative z-10 flex items-end gap-4 px-4 pt-4">
            <div className="font-display text-[96px] font-black leading-none text-white/10 select-none">
              {player.dorsal ?? '—'}
            </div>
            <div className="pb-1">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">
                AD Ceuta FC · {player.position_group}
              </div>
              <div className="font-display text-[32px] font-black uppercase leading-[1] tracking-[0.02em] text-white">
                {player.name}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                  {capitalize(player.position)}
                </span>
                {hasNat && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-[14px]">{flag(player.nationality)}</span>
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                      {player.nationality}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* photo */}
          <div className="absolute bottom-0 right-4 z-10 h-[180px] w-[140px]">
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.name}
                className="h-full w-full object-contain object-bottom"
              />
            ) : (
              <div className="flex h-full w-full items-end justify-center pb-2">
                <div className="flex size-[80px] items-center justify-center rounded-full bg-white/10 font-display text-[28px] font-black text-white/40">
                  {initials(player.name)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FICHA TÉCNICA ── */}
        <div className="relative z-[2] -mt-6 mx-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white shadow-[6px_6px_0_#D62027]">

          {/* header */}
          <div className="relative overflow-hidden bg-ceuta-black px-4 py-3">
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-[60px]"
              style={{ background: 'repeating-linear-gradient(-45deg, white 0 7px, #0A0A0A 7px 14px)', clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-3 bg-ceuta-red" />
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-red">Ficha técnica</span>
            </div>
          </div>

          {/* stat tiles grid */}
          <div className="stats-grid p-3">
            <StatTile label="Dorsal" value={player.dorsal} accent />
            <StatTile label="Posición" value={capitalize(player.position)} />
            {player.height && <StatTile label="Altura" value={player.height} />}
            {player.weight && <StatTile label="Peso" value={player.weight} />}
            {hasNat && <StatTile label="Nacionalidad" value={`${flag(player.nationality)} ${player.nationality}`} />}
          </div>
        </div>

        {/* ── ESTADÍSTICAS TEMPORADA ── */}
        {stats && (
          <div className="relative z-[2] mt-3 mx-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">

            <div className="relative overflow-hidden bg-ceuta-black px-4 py-3">
              <div
                className="pointer-events-none absolute bottom-0 right-0 top-0 w-[60px]"
                style={{ background: 'repeating-linear-gradient(-45deg, white 0 7px, #0A0A0A 7px 14px)', clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%)' }}
              />
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-3 bg-ceuta-red" />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-red">Estadísticas · Temporada 2025–26</span>
              </div>
            </div>

            <div className="stats-grid p-3">
              {stats.appearances != null && <StatTile label="Partidos" value={stats.appearances} />}
              {stats.goals != null && <StatTile label="Goles" value={stats.goals} accent={!!stats.goals} />}
              {stats.assists != null && <StatTile label="Asistencias" value={stats.assists} />}
              {stats.shots != null && <StatTile label="Tiros" value={stats.shots} />}
              {stats.shots_on_target != null && <StatTile label="A puerta" value={stats.shots_on_target} />}
              {isGK && stats.saves != null && <StatTile label="Paradas" value={stats.saves} />}
              {stats.yellow_cards != null && <StatTile label="Amarillas" value={stats.yellow_cards} />}
              {stats.red_cards != null && <StatTile label="Rojas" value={stats.red_cards} />}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}
