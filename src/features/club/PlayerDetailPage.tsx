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

function StatBox({ label, value, hero }: { label: string; value: number | null; hero?: boolean }) {
  if (hero) {
    return (
      <div className="col-span-2 flex flex-col items-center justify-center rounded-[12px] py-5" style={{ background: 'var(--red)' }}>
        <span className="font-display text-[52px] font-black leading-none text-white">{value ?? 0}</span>
        <span className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{label}</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] py-4" style={{ background: 'var(--bone)', minHeight: 76 }}>
      <span className="font-display text-[28px] font-black leading-none" style={{ color: 'var(--black)' }}>{value ?? 0}</span>
      <span className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

export function PlayerDetailPage({ player, stats }: Props) {
  const isGK = player.position.toUpperCase().includes('PORTERO')
  const hasNat = player.nationality && !player.nationality.match(/^\d+/)
  const natFlag = hasNat ? flag(player.nationality) : ''

  // Pick the hero stat based on position
  const heroStat = isGK
    ? { label: 'Paradas', value: stats?.saves ?? null }
    : { label: 'Goles', value: stats?.goals ?? null }

  return (
    <div id="app-root">
      <div className="page">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-ceuta-black" style={{ minHeight: 300 }}>

          {/* giant dorsal watermark */}
          <div
            className="pointer-events-none absolute right-0 top-[-10px] select-none font-display font-black leading-none"
            style={{
              fontSize: 260,
              color: 'rgba(255,255,255,0.04)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {player.dorsal ?? ''}
          </div>

          {/* player photo — right, full height */}
          <div className="absolute bottom-0 right-0 z-10" style={{ width: 200, height: 290 }}>
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.name}
                className="h-full w-full object-contain object-bottom"
                style={{ maskImage: 'linear-gradient(to left, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 60%, transparent 100%)' }}
              />
            ) : (
              <div className="flex h-full w-full items-end justify-center pb-6">
                <div className="flex size-[80px] items-center justify-center rounded-full font-display text-[26px] font-black" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}>
                  {initials(player.name)}
                </div>
              </div>
            )}
          </div>

          {/* gradient bottom fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, #0E0E0E, transparent)' }} />

          {/* content */}
          <div className="relative z-20 flex flex-col justify-between" style={{ minHeight: 300 }}>

            {/* back */}
            <div className="px-4 pt-5">
              <Link href="/club?tab=plantilla" className="flex w-fit items-center gap-1.5 no-underline" style={{ color: 'var(--muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Plantilla</span>
              </Link>
            </div>

            {/* name block — bottom left */}
            <div className="px-4 pb-5" style={{ maxWidth: '65%' }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-[2px] w-4" style={{ background: 'var(--red)' }} />
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--red)' }}>
                  AD Ceuta FC
                </span>
              </div>
              <div className="font-display font-black uppercase leading-[0.95] tracking-[0.01em] text-white" style={{ fontSize: 38 }}>
                {player.name}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-[4px] px-[10px] py-[4px] font-display text-[10px] font-black uppercase tracking-[0.1em] text-white"
                  style={{ background: 'var(--red)' }}
                >
                  {capitalize(player.position)}
                </span>
                {hasNat && (
                  <span className="font-display text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {natFlag} {player.nationality}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── KEY STATS STRIP ── */}
        <div className="grid grid-cols-3 border-b-2 border-ceuta-black" style={{ background: 'var(--black)' }}>
          {[
            { label: 'Dorsal', value: `#${player.dorsal ?? '—'}` },
            { label: 'Posición', value: capitalize(player.position) },
            { label: 'Grupo', value: player.position_group },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-3"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <span className="font-display text-[15px] font-black uppercase leading-none text-white">{item.value}</span>
              <span className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* ── FICHA TÉCNICA ── */}
        {(player.height || player.weight || hasNat) && (
          <div className="mx-3 mt-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
            <div className="relative overflow-hidden bg-ceuta-black px-4 py-[10px]">
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[50px]" style={{ background: 'repeating-linear-gradient(-45deg, white 0 6px, #0A0A0A 6px 12px)', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }} />
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-3" style={{ background: 'var(--red)' }} />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>Ficha técnica</span>
              </div>
            </div>
            {player.height && (
              <div className="flex items-center justify-between border-b border-ceuta-border px-4 py-3 last:border-0">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">Altura</span>
                <span className="font-display text-[14px] font-black uppercase text-ceuta-black">{player.height}</span>
              </div>
            )}
            {player.weight && (
              <div className="flex items-center justify-between border-b border-ceuta-border px-4 py-3 last:border-0">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">Peso</span>
                <span className="font-display text-[14px] font-black uppercase text-ceuta-black">{player.weight}</span>
              </div>
            )}
            {hasNat && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">Nacionalidad</span>
                <span className="font-display text-[14px] font-black uppercase text-ceuta-black">{natFlag} {player.nationality}</span>
              </div>
            )}
          </div>
        )}

        {/* ── ESTADÍSTICAS TEMPORADA ── */}
        {stats && (
          <div className="mx-3 mt-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
            <div className="relative overflow-hidden bg-ceuta-black px-4 py-[10px]">
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[50px]" style={{ background: 'repeating-linear-gradient(-45deg, white 0 6px, #0A0A0A 6px 12px)', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }} />
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-3" style={{ background: 'var(--red)' }} />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>Estadísticas · 2025–26</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {/* hero stat spans full width */}
              <StatBox label={heroStat.label} value={heroStat.value} hero />

              {stats.appearances != null && <StatBox label="Partidos" value={stats.appearances} />}
              {!isGK && stats.assists != null && <StatBox label="Asistencias" value={stats.assists} />}
              {!isGK && stats.shots != null && <StatBox label="Tiros" value={stats.shots} />}
              {!isGK && stats.shots_on_target != null && <StatBox label="A puerta" value={stats.shots_on_target} />}
              {stats.yellow_cards != null && <StatBox label="Amarillas" value={stats.yellow_cards} />}
              {stats.red_cards != null && <StatBox label="Rojas" value={stats.red_cards} />}
            </div>
          </div>
        )}

        {/* ── TRAYECTORIA ── */}
        {player.career_history && player.career_history.length > 0 && (
          <div className="mx-3 mt-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
            <div className="relative overflow-hidden bg-ceuta-black px-4 py-[10px]">
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[50px]" style={{ background: 'repeating-linear-gradient(-45deg, white 0 6px, #0A0A0A 6px 12px)', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }} />
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-3" style={{ background: 'var(--red)' }} />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>Trayectoria</span>
              </div>
            </div>
            <div className="divide-y divide-ceuta-border">
              {(player.career_history as CareerEntry[]).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {entry.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.logo} alt={entry.club} className="size-[28px] shrink-0 object-contain" />
                  ) : (
                    <div className="size-[28px] shrink-0 rounded-full bg-ceuta-bg-mid" />
                  )}
                  <span className="flex-1 font-display text-[13px] font-bold uppercase tracking-[0.05em] text-ceuta-black">{entry.club}</span>
                  <span className="font-display text-[11px] font-semibold text-ceuta-muted">{entry.seasons}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
