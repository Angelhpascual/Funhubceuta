'use client'

import Image from 'next/image'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'
import { TABS, TYPE_LABELS, TYPE_BADGE } from './mercadoShared'

interface Props {
  transfers: Transfer[]
  activeTab: TransferType
  setActiveTab: (tab: TransferType) => void
  editingId: string | null
  onEdit: (t: Transfer) => void
  onDelete: (id: string) => void
}

export function TransferList({ transfers, activeTab, setActiveTab, editingId, onEdit, onDelete }: Props) {
  const visibleTransfers = transfers.filter((t) => t.type === activeTab)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-extrabold text-xl tracking-[0.03em] uppercase text-ceuta-black flex items-center gap-2.5">
          <span className="w-1 h-5 bg-ceuta-red shrink-0 rounded-[2px]" />
          Movimientos
        </h2>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((tab) => {
          const count = transfers.filter((t) => t.type === tab.id).length
          const active = activeTab === tab.id
          return (
            <button type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-display text-[12.5px] font-bold tracking-[0.08em] uppercase border-[1.5px] transition-all
                ${active
                  ? 'bg-ceuta-black text-white border-ceuta-black'
                  : 'bg-white text-ceuta-muted border-ceuta-border hover:border-ceuta-black hover:text-ceuta-black'}`}
            >
              {tab.label}
              <b className={`font-extrabold text-[12px] opacity-70 ${active ? 'text-white' : 'text-ceuta-black'}`}>{count}</b>
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-ceuta-border rounded-[14px] overflow-hidden">
        {visibleTransfers.length === 0 ? (
          <div className="py-12 text-center font-display text-[14px] text-ceuta-muted uppercase tracking-[0.08em]">
            Sin movimientos en esta categoría
          </div>
        ) : (
          visibleTransfers.map((t, idx) => (
            <div
              key={t.id}
              className={`flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-ceuta-bg-soft
                ${editingId === t.id ? 'bg-ceuta-gold-soft' : ''}
                ${idx < visibleTransfers.length - 1 ? 'border-b border-ceuta-border' : ''}`}
            >
              <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-ceuta-bg-mid relative shrink-0 flex items-center justify-center font-display font-extrabold text-[14px] text-ceuta-muted">
                {t.photoUrl ? (
                  <Image
                    src={`/api/proxy/image?url=${encodeURIComponent(t.photoUrl)}&w=88`}
                    alt={t.name}
                    fill
                    sizes="46px"
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  t.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-[18px] tracking-[0.02em] uppercase text-ceuta-black truncate">{t.name}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-[12px] text-ceuta-muted">
                  <span className={`font-display text-[10px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full ${TYPE_BADGE[t.type]}`}>
                    {TYPE_LABELS[t.type]}
                  </span>
                  <span className="font-display font-extrabold text-[11px] text-ceuta-black">{t.position}</span>
                  {t.clubFrom && <span>← {t.clubFrom}</span>}
                  {t.clubTo && <span>→ {t.clubTo}</span>}
                  {t.type === 'rumor' && <span>{'🔥'.repeat(t.reliability)}</span>}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button type="button"
                  onClick={() => onEdit(t)}
                  className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-3.5 py-2 rounded-lg border-[1.5px] border-ceuta-border text-ceuta-black bg-white hover:border-ceuta-black transition-colors"
                >
                  Editar
                </button>
                <button type="button"
                  onClick={() => onDelete(t.id)}
                  className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-ceuta-border text-ceuta-muted flex items-center justify-center hover:border-ceuta-red hover:text-ceuta-red hover:bg-ceuta-red-soft transition-all"
                  title="Eliminar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="pb-16" />
    </div>
  )
}
