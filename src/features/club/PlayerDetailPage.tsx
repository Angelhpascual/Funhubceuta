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

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-ceuta-border px-4 py-3 last:border-0">
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">{label}</span>
      <span className="font-display text-[14px] font-black uppercase tracking-[0.02em] text-ceuta-black">{value}</span>
    </div>
  )
}

function StatBox({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[10px] py-4"
      style={{
        background: highlight && value ? 'var(--red)' : 'var(--bone)',
        minHeight: 72,
      }}
    >
      <span
        className="font-display text-[28px] font-black leading-none"
        style={{ color: highlight && value ? 'white' : 'var(--black)' }}
      >
        {value ?? 0}
      </span>
      <span
        className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: highlight && value ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}
      >
        {label}
      </span>
    </div>
  )
}

export function PlayerDetailPage({ player, stats }: Props) {
  const isGK = player.position.toUpperCase().includes('PORTERO')
  const hasNat = player.nationality && !player.nationality.match(/^\d+/)
  const natFlag = hasNat ? flag(player.nationality) : ''

  return (
    <div id="app-root">
      <div className="page">

        {/* ── HERO ── */}
        <div className="relative bg-ceuta-black" style={{ minHeight: 240 }}>

          {/* diagonal pattern */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 18px)',
            }}
          />

          {/* back */}
          <div className="relative z-20 px-4 pt-5">
            <Link href="/club?tab=plantilla" className="flex w-fit items-center gap-1.5 no-underline" style={{ color: 'var(--muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em]">Plantilla</span>
            </Link>
          </div>

          {/* photo — right side, anchored to bottom */}
          <div className="absolute bottom-0 right-0 z-10" style={{ width: 160, height: 210 }}>
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.name}
                className="h-full w-full object-contain object-bottom"
              />
            ) : (
              <div className="flex h-full w-full items-end justify-center pb-4">
                <div
                  className="flex size-[72px] items-center justify-center rounded-full font-display text-[24px] font-black"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
                >
                  {initials(player.name)}
                </div>
              </div>
            )}
          </div>

          {/* text — left side */}
          <div className="relative z-20 px-4 pb-6 pt-3" style={{ maxWidth: 'calc(100% - 150px)' }}>
            {/* eyebrow */}
            <div className="mb-1 flex items-center gap-1.5">
              <div className="h-[2px] w-4" style={{ background: 'var(--red)' }} />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>
                {player.position_group}
              </span>
            </div>

            {/* dorsal */}
            <div className="font-display text-[56px] font-black leading-none" style={{ color: 'rgba(255,255,255,0.12)' }}>
              {player.dorsal ?? '–'}
            </div>

            {/* name */}
            <div className="font-display text-[26px] font-black uppercase leading-[1.05] tracking-[0.02em] text-white" style={{ marginTop: -8 }}>
              {player.name}
            </div>

            {/* position + nationality */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className="rounded-[4px] px-2 py-[3px] font-display text-[10px] font-black uppercase tracking-[0.1em] text-white"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {capitalize(player.position)}
              </span>
              {hasNat && (
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {natFlag} {player.nationality}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── FICHA TÉCNICA ── */}
        <div className="mx-3 mt-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white" style={{ boxShadow: '4px 4px 0 var(--red)' }}>

          {/* header */}
          <div className="relative overflow-hidden bg-ceuta-black px-4 py-[10px]">
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-[50px]"
              style={{
                background: 'repeating-linear-gradient(-45deg, white 0 6px, #0A0A0A 6px 12px)',
                clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />
            <div className="flex items-center gap-2">
              <div className="h-[2px] w-3" style={{ background: 'var(--red)' }} />
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>
                Ficha técnica
              </span>
            </div>
          </div>

          {/* rows */}
          <InfoRow label="Dorsal" value={`# ${player.dorsal ?? '—'}`} />
          <InfoRow label="Posición" value={capitalize(player.position)} />
          <InfoRow label="Demarcación" value={player.position_group} />
          {player.height && <InfoRow label="Altura" value={player.height} />}
          {player.weight && <InfoRow label="Peso" value={player.weight} />}
          {hasNat && <InfoRow label="Nacionalidad" value={`${natFlag} ${player.nationality}`} />}
        </div>

        {/* ── ESTADÍSTICAS TEMPORADA ── */}
        {stats && (
          <div className="mx-3 mt-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">

            <div className="relative overflow-hidden bg-ceuta-black px-4 py-[10px]">
              <div
                className="pointer-events-none absolute bottom-0 right-0 top-0 w-[50px]"
                style={{
                  background: 'repeating-linear-gradient(-45deg, white 0 6px, #0A0A0A 6px 12px)',
                  clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)',
                }}
              />
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-3" style={{ background: 'var(--red)' }} />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--red)' }}>
                  Estadísticas · 2025–26
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {stats.appearances != null && <StatBox label="Partidos" value={stats.appearances} />}
              {stats.goals != null && <StatBox label="Goles" value={stats.goals} highlight />}
              {stats.assists != null && <StatBox label="Asistencias" value={stats.assists} />}
              {stats.shots != null && <StatBox label="Tiros" value={stats.shots} />}
              {stats.shots_on_target != null && <StatBox label="A puerta" value={stats.shots_on_target} />}
              {isGK && stats.saves != null && <StatBox label="Paradas" value={stats.saves} highlight />}
              {stats.yellow_cards != null && <StatBox label="Amarillas" value={stats.yellow_cards} />}
              {stats.red_cards != null && <StatBox label="Rojas" value={stats.red_cards} />}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
