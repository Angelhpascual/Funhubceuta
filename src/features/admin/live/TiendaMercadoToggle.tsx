'use client'

interface Props {
  tiendaActive: boolean | null
  savingTienda: boolean
  onToggle: () => void
}

export function TiendaMercadoToggle({ tiendaActive, savingTienda, onToggle }: Props) {
  return (
    <div className="mt-4 rounded-[12px] border border-ceuta-border bg-white p-4">
      <div className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
        Slot nav (cuando no hay partido)
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-display text-[15px] font-black uppercase leading-tight text-ceuta-black">
            {tiendaActive === null ? '…' : tiendaActive ? 'Tienda activa' : 'Mercado activo'}
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-ceuta-muted">
            {tiendaActive
              ? 'Nav muestra "Tienda" → /merchan'
              : 'Nav muestra "Mercado" → /mercado'}
          </p>
        </div>
        <button type="button"
          onClick={onToggle}
          disabled={savingTienda || tiendaActive === null}
          className={`relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${tiendaActive ? 'bg-[#f2c300]' : 'bg-[#111111]'}`}
          aria-label="Toggle tienda/mercado"
        >
          <span className={`absolute size-6 rounded-full bg-white shadow transition-transform ${
            tiendaActive ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  )
}
