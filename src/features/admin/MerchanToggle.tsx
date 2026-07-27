'use client'

import { useEffect, useState } from 'react'

export function MerchanToggle() {
  const [mercadoActive, setMercadoActive] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/merchan-toggle')
      .then((r) => r.json())
      .then((d) => setMercadoActive(d.mercadoActive))
  }, [])

  async function toggle() {
    if (mercadoActive === null) return
    setSaving(true)
    const next = !mercadoActive
    await fetch('/api/admin/merchan-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mercadoActive: next }),
    })
    setMercadoActive(next)
    setSaving(false)
  }

  const isStore = mercadoActive === false

  return (
    <div className="rounded-[14px] border border-ceuta-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Slot dinámico nav
          </div>
          <div className="mt-1 font-display text-[17px] font-black uppercase leading-tight text-ceuta-black">
            {mercadoActive === null ? '…' : isStore ? 'Tienda activa' : 'Mercado activo'}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ceuta-muted">
            {isStore
              ? 'La pestaña de nav muestra "Tienda" → /merchan'
              : 'La pestaña de nav muestra "Mercado" → /mercado'}
          </p>
        </div>

        <button
          onClick={toggle}
          disabled={saving || mercadoActive === null}
          className={`relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            isStore ? 'bg-ceuta-gold' : 'bg-ceuta-border'
          }`}
          aria-label="Toggle mercado/tienda"
        >
          <span
            className={`absolute size-6 rounded-full bg-white shadow transition-transform ${
              isStore ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`size-2 rounded-full ${isStore ? 'bg-ceuta-gold' : 'bg-ceuta-border'}`}
        />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">
          {isStore ? 'Tienda visible en nav' : 'Mercado visible en nav'}
        </span>
      </div>
    </div>
  )
}
