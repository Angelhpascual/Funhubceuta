'use client'

import { useState } from 'react'

type Match = {
  id: string
  home_team: string
  away_team: string
  date: string
  time: string
  weekday: string
  is_home: boolean
}

type RowState = { date: string; time: string; saving: boolean; saved: boolean }

export function PartidosClient({ matches }: { matches: Match[] }) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        { date: String(m.date).slice(0, 10), time: m.time ?? '', saving: false, saved: false },
      ])
    )
  )

  const update = (id: string, field: 'date' | 'time', value: string) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], [field]: value, saved: false } }))

  const save = async (id: string) => {
    setRows((r) => ({ ...r, [id]: { ...r[id], saving: true } }))
    await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, date: rows[id].date, time: rows[id].time }),
    })
    setRows((r) => ({ ...r, [id]: { ...r[id], saving: false, saved: true } }))
  }

  const rival = (m: Match) => m.is_home ? m.away_team : m.home_team

  return (
    <div className="min-h-screen bg-ceuta-black p-4 pb-24">
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red">Admin</div>
        <div className="font-display text-[24px] font-black uppercase text-white">Calendario</div>
        <div className="mt-1 text-[13px] text-white/40">
          Actualiza el día y hora de cada partido conforme se confirmen
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {matches.map((m, i) => {
          const row = rows[m.id]
          const confirmed = !!row.time && row.time !== ''
          return (
            <div key={m.id} className="rounded-[12px] bg-white/[0.05] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-ceuta-red font-display text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="font-display text-[13px] font-bold uppercase text-white">
                    {m.is_home ? 'vs' : '@'} {rival(m)}
                  </span>
                </div>
                {confirmed ? (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-green-400">
                    Confirmado
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-white/40">
                    Por confirmar
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => update(m.id, 'date', e.target.value)}
                  className="flex-1 rounded-[8px] border border-white/10 bg-white/10 px-3 py-2 text-[13px] text-white outline-none focus:ring-1 focus:ring-ceuta-red [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={row.time}
                  onChange={(e) => update(m.id, 'time', e.target.value)}
                  className="w-[90px] rounded-[8px] border border-white/10 bg-white/10 px-3 py-2 text-[13px] text-white outline-none focus:ring-1 focus:ring-ceuta-red [color-scheme:dark]"
                />
                <button
                  onClick={() => save(m.id)}
                  disabled={row.saving}
                  className="rounded-[8px] bg-ceuta-red px-4 py-2 font-display text-[12px] font-black uppercase text-white disabled:opacity-50 shrink-0"
                >
                  {row.saving ? '...' : row.saved ? '✓' : 'Guardar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
