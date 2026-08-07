'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'
import { PlayerPickerModal } from '@/features/admin/PlayerPickerModal'
import { AdminHero } from '@/features/admin/AdminHero'

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL', 'ENT']
const TYPE_LABELS: Record<TransferType, string> = { in: 'Fichaje', out: 'Salida', rumor: 'Rumor', renew: 'Renovación' }
const TYPE_BADGE: Record<TransferType, string> = {
  in:    'bg-[#E7F6EC] text-[#166534]',
  out:   'bg-ceuta-red-soft text-ceuta-red',
  rumor: 'bg-ceuta-bg-mid text-ceuta-muted',
  renew: 'bg-ceuta-gold-soft text-[#8A6D00]',
}
const TABS: { id: TransferType; label: string }[] = [
  { id: 'renew', label: 'Renovados' },
  { id: 'in',    label: 'Fichados'  },
  { id: 'out',   label: 'Salidas'   },
  { id: 'rumor', label: 'Rumores'   },
]

const EMPTY_FORM = {
  name: '',
  position: 'DEL',
  type: 'in' as TransferType,
  clubFrom: '',
  clubTo: '',
  reliability: 1 as 1 | 2 | 3,
  photoUrl: '',
  notes: '',
}

const INPUT_CLS = 'w-full px-3 py-[10px] rounded-[10px] border border-ceuta-border text-[14px] bg-ceuta-bg-soft outline-none'
const LABEL_CLS = 'block text-[10px] font-extrabold uppercase tracking-[0.1em] text-ceuta-muted mb-1.5 font-display'
const CARD_CLS = 'bg-white rounded-[14px] p-5 mb-4 border border-ceuta-border'

interface SquadPlayer {
  id: string
  name: string
  position: string
  photo_url: string | null
  dorsal: number | null
}

export default function AdminMercadoPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState<TransferType>('renew')
  const [showPicker, setShowPicker] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch('/api/admin/transfers')
    const data = await res.json()
    setTransfers(data.transfers ?? [])
  }

  useEffect(() => { load() }, [])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', form.name || 'player')
    const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm((f) => ({ ...f, photoUrl: data.url }))
    else setMsg('Error subiendo foto')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startEdit(t: Transfer) {
    setEditingId(t.id)
    setActiveTab(t.type)
    setForm({
      name: t.name,
      position: t.position,
      type: t.type,
      clubFrom: t.clubFrom ?? '',
      clubTo: t.clubTo ?? '',
      reliability: t.reliability,
      photoUrl: t.photoUrl ?? '',
      notes: t.notes ?? '',
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handlePlayerPick(p: SquadPlayer) {
    const posMap: Record<string, string> = {
      portero: 'POR', defensa: 'DEF', centrocampista: 'MED',
      mediocentro: 'MED', delantero: 'DEL', extremo: 'DEL',
      entrenador: 'ENT', 'segundo entrenador': 'ENT',
    }
    setForm((f) => ({
      ...f,
      name: p.name,
      position: posMap[p.position.toLowerCase()] ?? 'DEL',
      photoUrl: p.photo_url ?? '',
      clubFrom: 'AD Ceuta FC',
    }))
    setShowPicker(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    const body = {
      ...form,
      clubFrom: form.clubFrom || null,
      clubTo: form.clubTo || null,
      photoUrl: form.photoUrl || null,
      notes: form.notes || null,
    }

    const res = editingId
      ? await fetch('/api/admin/transfers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
      : await fetch('/api/admin/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    if (res.ok) {
      setForm(EMPTY_FORM)
      setEditingId(null)
      setMsg(editingId ? '✓ Actualizado' : '✓ Añadido')
      await load()
    } else {
      setMsg('Error al guardar')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch('/api/admin/transfers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  const showPlayerPicker = form.type === 'out' || form.type === 'renew'
  const visibleTransfers = transfers.filter((t) => t.type === activeTab)

  return (
    <div className="font-display min-h-screen">
      <AdminHero
        label="Gestión de contenido"
        title={<>Mercado de <em className="not-italic text-ceuta-gold">fichajes.</em></>}
        badges={[{ color: '#1E9E4B', label: 'Movimientos publicados', value: transfers.length }]}
      />

      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">

          {/* Form */}
          <div>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={`${CARD_CLS} border-t-[3px] ${editingId ? 'border-t-ceuta-gold' : 'border-t-ceuta-black'}`}
            >
              <div className="flex justify-between items-center mb-3.5">
                <span className={LABEL_CLS}>{editingId ? '✏️ Editando jugador' : 'Añadir movimiento'}</span>
                {editingId && (
                  <button type="button"
                    
                    onClick={cancelEdit}
                    className="text-[12px] font-bold text-ceuta-muted border border-ceuta-border rounded-lg px-3 py-1 cursor-pointer bg-transparent font-display"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div className="mb-3.5">
                <label className={LABEL_CLS}>Tipo de movimiento</label>
                <select
                  className={INPUT_CLS}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TransferType })}
                >
                  <option value="in">✅ Fichaje</option>
                  <option value="renew">🔄 Renovación</option>
                  <option value="out">🚪 Salida</option>
                  <option value="rumor">🔥 Rumor</option>
                </select>
              </div>

              {showPlayerPicker && (
                <div className="mb-3.5">
                  <button type="button"
                    
                    onClick={() => setShowPicker(true)}
                    className="w-full py-[11px] rounded-[10px] border-2 border-ceuta-red bg-ceuta-red/[0.06] cursor-pointer font-display text-[13px] font-extrabold text-ceuta-red uppercase tracking-[0.06em] flex items-center justify-center gap-2"
                  >
                    👥 {form.name ? `Cambiar jugador (${form.name})` : 'Seleccionar jugador de plantilla'}
                  </button>
                </div>
              )}

              <div className="mb-3.5">
                <label className={LABEL_CLS}>Nombre del jugador</label>
                <input
                  className={INPUT_CLS}
                  value={form.name}
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej. Marcos Acuña"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label className={LABEL_CLS}>Posición</label>
                  <select
                    className={INPUT_CLS}
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  >
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Fiabilidad</label>
                  {form.type === 'rumor' ? (
                    <div className="flex gap-2 h-[42px]">
                      {([1, 2, 3] as const).map((v) => (
                        <button type="button"
                          key={v}
                          
                          onClick={() => setForm({ ...form, reliability: v })}
                          className={`flex-1 rounded-[10px] border-none cursor-pointer font-display text-[16px] font-extrabold ${
                            form.reliability >= v ? 'bg-ceuta-black text-white' : 'bg-ceuta-bg-mid text-ceuta-muted'
                          }`}
                        >
                          {'🔥'.repeat(v)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`${INPUT_CLS} flex items-center text-ceuta-muted text-[12px]`}>N/A</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label className={LABEL_CLS}>Club de origen</label>
                  <input
                    className={INPUT_CLS}
                    value={form.clubFrom}
                    onChange={(e) => setForm({ ...form, clubFrom: e.target.value })}
                    placeholder="ej. Sevilla FC"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Club de destino</label>
                  <input
                    className={INPUT_CLS}
                    value={form.clubTo}
                    onChange={(e) => setForm({ ...form, clubTo: e.target.value })}
                    placeholder="Solo para salidas"
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <label className={LABEL_CLS}>Foto del jugador</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="flex gap-2 mb-2">
                  <button type="button"
                    
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`flex-1 py-[10px] rounded-[10px] border-[1.5px] border-dashed border-ceuta-border bg-ceuta-bg-soft font-display text-[12px] font-bold uppercase tracking-[0.06em] cursor-pointer ${
                      uploading ? 'text-ceuta-muted cursor-default' : 'text-ceuta-black'
                    }`}
                  >
                    {uploading ? 'Subiendo...' : '📁 Subir desde dispositivo'}
                  </button>
                </div>
                <input
                  className={`${INPUT_CLS} text-[12px]`}
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="O pega una URL directamente..."
                  type="url"
                />
                {form.photoUrl && (
                  <div className="mt-2 flex items-center gap-[10px]">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-ceuta-bg-mid relative shrink-0">
                      <Image
                        src={`/api/proxy/image?url=${encodeURIComponent(form.photoUrl)}&w=120`}
                        alt="preview"
                        fill
                        sizes="56px"
                        className="object-cover object-top"
                        unoptimized
                      />
                    </div>
                    <span className="text-[11px] text-ceuta-muted">
                      {form.photoUrl.includes('supabase.co') ? '✅ Guardada en Supabase' : 'Vista previa'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-3.5">
                <label className={LABEL_CLS}>Nota / contexto (opcional)</label>
                <input
                  className={INPUT_CLS}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ej. Interés confirmado por El Faro"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full py-[13px] rounded-[12px] border-none font-display text-[14px] font-extrabold uppercase tracking-[0.08em] ${
                  saving
                    ? 'bg-ceuta-bg-mid text-ceuta-muted cursor-default'
                    : editingId
                      ? 'bg-ceuta-gold text-ceuta-black cursor-pointer'
                      : 'bg-ceuta-black text-white cursor-pointer'
                }`}
              >
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Añadir movimiento'}
              </button>

              {msg && (
                <p className={`text-center mt-[10px] text-[13px] font-bold ${msg.startsWith('✓') ? 'text-green-700' : 'text-ceuta-red'}`}>
                  {msg}
                </p>
              )}
            </form>
          </div>

          {/* Right column — list */}
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
                        onClick={() => startEdit(t)}
                        className="font-display text-[12.5px] font-bold tracking-[0.1em] uppercase px-3.5 py-2 rounded-lg border-[1.5px] border-ceuta-border text-ceuta-black bg-white hover:border-ceuta-black transition-colors"
                      >
                        Editar
                      </button>
                      <button type="button"
                        onClick={() => handleDelete(t.id)}
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

        </div>
      </div>

      {showPicker && (
        <PlayerPickerModal
          onSelect={handlePlayerPick}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
