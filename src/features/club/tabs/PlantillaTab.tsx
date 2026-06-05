"use client";

import { useState } from "react";
import type { Group, Player } from "../clubTypes";

const NAT_FLAGS: Record<string, string> = {
  España: '🇪🇸', Mali: '🇲🇱', Senegal: '🇸🇳', Guinea: '🇬🇳', Bisau: '🇬🇼',
  Argentina: '🇦🇷', Uruguay: '🇺🇾', Colombia: '🇨🇴', Francia: '🇫🇷',
  Marruecos: '🇲🇦', Argelia: '🇩🇿', Camerún: '🇨🇲', Brasil: '🇧🇷',
}

const STAFF = [
  { name: 'José Juan Romero', role: 'Entrenador', photo: 'https://assets.laliga.com/squad/2025/t14705/man53081/512x512/man53081_t14705_2025_1_003_000.png' },
  { name: 'Antonio José Sánchez', role: 'Segundo entrenador', photo: 'https://assets.laliga.com/squad/2025/t14705/man67065/512x512/man67065_t14705_2025_1_003_000.png' },
]

function flag(nationality: string): string {
  for (const [key, emoji] of Object.entries(NAT_FLAGS)) {
    if (nationality.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🏴'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function CollapsibleStaff() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between bg-ceuta-bg-soft px-4 py-3 ${open ? 'rounded-t-[10px]' : 'rounded-[10px]'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-[3px] rounded-sm bg-ceuta-red" />
          <span className="font-display text-[12px] font-extrabold uppercase tracking-widest text-ceuta-black">Cuerpo técnico</span>
          <span className="font-display text-[10px] tracking-wide text-ceuta-muted">{STAFF.length} miembros</span>
        </div>
        <span className={`text-[14px] text-ceuta-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="overflow-hidden rounded-b-[10px] bg-ceuta-bg-soft">
          {STAFF.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ceuta-border' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photo} alt={s.name} className="size-[38px] shrink-0 rounded-full object-cover object-top" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] font-bold uppercase tracking-wide text-ceuta-black">{s.name}</div>
                <div className="text-[12px] text-ceuta-muted">{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsibleGroup({ group, players, defaultOpen }: { group: string; players: Player[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between bg-ceuta-bg-soft px-4 py-3 ${open ? 'rounded-t-[10px]' : 'rounded-[10px]'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-[3px] rounded-sm bg-ceuta-red" />
          <span className="font-display text-[12px] font-extrabold uppercase tracking-widest text-ceuta-black">{group}</span>
          <span className="font-display text-[10px] tracking-wide text-ceuta-muted">{players.length} jugadores</span>
        </div>
        <span className={`text-[14px] text-ceuta-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="overflow-hidden rounded-b-[10px] bg-ceuta-bg-soft">
          {players.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ceuta-border' : ''}`}>
              <div className="min-w-[32px] text-center font-display text-[22px] font-black text-ceuta-bg-mid">{p.dorsal ?? '—'}</div>
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={p.name} className="size-[38px] shrink-0 rounded-full object-cover object-top" />
              ) : (
                <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-ceuta-bg-mid font-display text-[12px] font-extrabold text-ceuta-muted">{initials(p.name)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] font-bold uppercase tracking-wide text-ceuta-black">{p.name}</div>
                <div className="text-[12px] text-ceuta-muted">{capitalize(p.position)}</div>
              </div>
              <div className="text-[16px]">{flag(p.nationality)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlantillaTab({ grouped, total, loading }: {
  grouped: Group[]
  total: number
  loading: boolean
}) {
  return (
    <>
      <div className="px-3 mb-1">
        <CollapsibleStaff />
      </div>
      <p className="px-3 pb-1.5 font-display text-[10px] uppercase tracking-widest text-ceuta-muted">
        Jugadores · {total} · toca para expandir
      </p>
      {loading ? (
        <p className="py-8 text-center font-display text-[11px] uppercase tracking-widest text-ceuta-muted">
          Cargando plantilla…
        </p>
      ) : (
        <div className="flex flex-col gap-1 px-3">
          {grouped.map((g, i) => (
            <CollapsibleGroup key={g.group} group={g.group} players={g.players} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </>
  )
}
