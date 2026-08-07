'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { STAFF as STAFF_DATA } from '@/data/staff'

interface SquadPlayer {
  id: string
  name: string
  position: string
  photo_url: string | null
  dorsal: number | null
}

const STAFF_PLAYERS: SquadPlayer[] = STAFF_DATA.map((s) => ({
  id: s.id,
  name: s.name,
  position: s.role,
  photo_url: s.photo,
  dorsal: null,
}))

export function PlayerPickerModal({
  onSelect,
  onClose,
  players: playersProp,
}: {
  onSelect: (p: SquadPlayer) => void
  onClose: () => void
  players?: SquadPlayer[]
}) {
  const [players, setPlayers] = useState<SquadPlayer[]>(() =>
    playersProp ? [...STAFF_PLAYERS, ...playersProp] : []
  )
  const [loading, setLoading] = useState(!playersProp)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (playersProp) return
    fetch('/api/squad')
      .then((r) => r.json())
      .then((data) => {
        const all: SquadPlayer[] = [
          ...STAFF_PLAYERS,
          ...(data.grouped ?? []).flatMap((g: { players: SquadPlayer[] }) => g.players),
        ]
        setPlayers(all)
        setLoading(false)
      })
  }, [playersProp])

  const filtered = players.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[1000] flex items-end">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[80vh] bg-white rounded-t-[20px] overflow-hidden flex flex-col"
      >
        <div className="px-4 pt-4 pb-3 border-b border-ceuta-border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.08em] font-display">
              Seleccionar jugador
            </span>
            <button type="button"
              onClick={onClose}
              className="text-[18px] text-ceuta-muted leading-none bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-[10px] rounded-[10px] border border-ceuta-border text-[14px] bg-ceuta-bg-soft outline-none"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-ceuta-muted text-[13px]">Cargando plantilla…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-ceuta-muted text-[13px]">Sin resultados</div>
          ) : (
            filtered.map((p) => (
              <button type="button"
                key={p.id}
                onClick={() => onSelect(p)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b border-ceuta-border cursor-pointer text-left"
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-ceuta-bg-mid shrink-0 relative">
                  {p.photo_url ? (
                    <Image
                      src={p.photo_url}
                      alt={p.name}
                      fill
                      sizes="44px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[20px]">👤</div>
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-ceuta-black font-display uppercase">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-ceuta-muted mt-0.5">
                    {p.position}{p.dorsal != null ? ` · #${p.dorsal}` : ''}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
