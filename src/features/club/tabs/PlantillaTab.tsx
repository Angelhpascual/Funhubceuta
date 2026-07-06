'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Group, Player } from '../clubTypes'

const NAT_FLAGS: Record<string, string> = {
  España: '🇪🇸',
  Mali: '🇲🇱',
  Senegal: '🇸🇳',
  Guinea: '🇬🇳',
  Bisau: '🇬🇼',
  Argentina: '🇦🇷',
  Uruguay: '🇺🇾',
  Colombia: '🇨🇴',
  Francia: '🇫🇷',
  Marruecos: '🇲🇦',
  Argelia: '🇩🇿',
  Camerún: '🇨🇲',
  Brasil: '🇧🇷',
  Portugal: '🇵🇹',
  Ghana: '🇬🇭',
  Nigeria: '🇳🇬',
  'Costa de Marfil': '🇨🇮',
  'Ivory Coast': '🇨🇮',
  'Estados Unidos': '🇺🇸',
  'United States': '🇺🇸',
  'Burkina Faso': '🇧🇫',
}

const STAFF = [
  {
    name: 'José Juan Romero',
    role: 'Entrenador',
    photo:
      'https://assets.laliga.com/squad/2025/t14705/man53081/512x512/man53081_t14705_2025_1_003_000.png',
  },
  {
    name: 'Antonio José Sánchez',
    role: 'Segundo entrenador',
    photo:
      'https://assets.laliga.com/squad/2025/t14705/man67065/512x512/man67065_t14705_2025_1_003_000.png',
  },
]

function flag(nationality: string): string {
  for (const [key, emoji] of Object.entries(NAT_FLAGS)) {
    if (nationality.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return ''
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function PlayerSilhouette() {
  return (
    <svg
      viewBox="0 0 24 26"
      fill="currentColor"
      className="w-[78px] h-[88px] text-ceuta-muted opacity-40"
    >
      <circle cx="12" cy="7" r="5" />
      <path d="M2 26v-3a10 10 0 0120 0v3z" />
    </svg>
  )
}

function AvatarSilhouette() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[26px] h-[26px] text-ceuta-muted">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={`text-ceuta-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StaffCard({ name, role, photo }: { name: string; role: string; photo?: string }) {
  return (
    <div className="relative flex items-center gap-[14px] rounded-[14px] border border-ceuta-border bg-white overflow-hidden px-[14px] py-3">
      <div className="absolute left-0 top-0 w-1 h-full bg-ceuta-black" />
      <div className="ml-1 size-12 shrink-0 rounded-full bg-ceuta-bg-mid border-2 border-ceuta-border flex items-center justify-center overflow-hidden">
        {photo ? (
          <Image src={photo} alt={name} width={48} height={48} className="size-12 object-cover object-top" />
        ) : (
          <AvatarSilhouette />
        )}
      </div>
      <div>
        <div className="font-display text-[16px] font-extrabold uppercase leading-none tracking-[0.02em] text-ceuta-black">
          {name}
        </div>
        <div className="mt-[3px] text-[12.5px] text-ceuta-muted">{role}</div>
      </div>
    </div>
  )
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <Link href={`/jugador/${player.id}`} className="block no-underline">
      <div className="rounded-[16px] border border-ceuta-border bg-white overflow-hidden shadow-[var(--shadow-card)]">
        {/* Media area */}
        <div className="relative h-[132px] bg-ceuta-bg-mid overflow-hidden flex items-end justify-center">
          {/* Diagonal stripes */}
          <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(-45deg,white_0_12px,transparent_12px_24px)]" />
          {/* Large faded dorsal */}
          {player.dorsal != null && (
            <span className="absolute top-[6px] left-3 font-display font-black text-[52px] leading-[0.8] text-ceuta-black opacity-[0.12] z-[1] tracking-[-0.02em]">
              {player.dorsal}
            </span>
          )}
          {/* Flag */}
          <span className="absolute top-[11px] right-[11px] text-[19px] z-[2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {flag(player.nationality)}
          </span>
          {/* Photo or silhouette */}
          <div className="relative z-[2] w-24 h-[104px] flex items-end justify-center">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.name}
                width={96}
                height={104}
                sizes="96px"
                quality={75}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <PlayerSilhouette />
            )}
          </div>
        </div>
        {/* Info area */}
        <div className="border-t-2 border-ceuta-black px-[13px] pt-[11px] pb-[13px]">
          <div className="font-display text-[16px] font-extrabold uppercase leading-none tracking-[0.01em] text-ceuta-black truncate">
            {player.name}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11.5px] text-ceuta-muted">
            <span>{capitalize(player.position)}</span>
            {player.dorsal != null && (
              <span className="font-display text-[12px] font-extrabold text-ceuta-muted tracking-[0.04em]">
                #{player.dorsal}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function GroupHeader({
  label,
  count,
  open,
  onClick,
}: {
  label: string
  count: number
  open: boolean
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-[11px] py-[18px] px-0">
      <span className="w-1 h-[19px] bg-ceuta-red rounded-[2px] shrink-0" />
      <span className="font-display text-[18px] font-extrabold uppercase tracking-[0.04em] text-ceuta-black">
        {label}
      </span>
      <span className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-ceuta-muted">
        {count} {count === 1 ? 'miembro' : 'jugadores'}
      </span>
      <span className="ml-auto">
        <ChevronIcon open={open} />
      </span>
    </button>
  )
}

function StaffSection() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <GroupHeader
        label="Cuerpo técnico"
        count={STAFF.length}
        open={open}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="flex flex-col gap-[10px] pb-4">
          {STAFF.map((s, i) => (
            <StaffCard key={i} name={s.name} role={s.role} photo={s.photo} />
          ))}
        </div>
      )}
    </div>
  )
}

function GroupSection({
  group,
  players,
  defaultOpen,
}: {
  group: string
  players: Player[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div>
      <GroupHeader
        label={group}
        count={players.length}
        open={open}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlantillaTab({
  grouped,
  total,
  loading,
}: {
  grouped: Group[]
  total: number
  previousGrouped?: Group[]
  previousTotal?: number
  loading: boolean
}) {
  const [season, setSeason] = useState<'2526' | '2627'>('2526')

  return (
    <>
      <div className="chips chips-center mb-3 mt-1">
        <button className={`chip ${season === '2526' ? 'active' : ''}`} onClick={() => setSeason('2526')}>
          Temp. 25/26
        </button>
        <button className={`chip ${season === '2627' ? 'active' : ''}`} onClick={() => setSeason('2627')}>
          Temp. 26/27
        </button>
      </div>

      {season === '2627' ? (
        <div className="flex flex-col items-center gap-3 px-3 py-12">
          <span className="text-3xl">🔜</span>
          <p className="font-display text-[13px] font-bold uppercase tracking-widest text-ceuta-muted text-center">
            Plantilla por determinar
          </p>
          <p className="text-[12px] text-ceuta-muted text-center">
            La plantilla 26/27 se anunciará próximamente
          </p>
        </div>
      ) : (
        <div className="px-5">
          <StaffSection />
          {loading ? (
            <p className="py-8 text-center font-display text-[11px] uppercase tracking-widest text-ceuta-muted">
              Cargando plantilla…
            </p>
          ) : (
            <>
              {grouped.map((g, i) => (
                <GroupSection
                  key={g.group}
                  group={g.group}
                  players={g.players}
                  defaultOpen={i === 0}
                />
              ))}
              <p className="py-5 text-center font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ceuta-muted">
                Jugadores · {total} · toca un grupo para plegar
              </p>
            </>
          )}
        </div>
      )}
    </>
  )
}
