'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL', 'ENT']
const TYPE_LABELS: Record<TransferType, string> = { in: 'Fichaje', out: 'Salida', rumor: 'Rumor', renew: 'Renovación' }
const TYPE_COLORS: Record<TransferType, string> = {
  in: '#166534',
  out: 'var(--red)',
  rumor: 'var(--muted)',
  renew: '#92700a',
}
const TABS: { id: TransferType; label: string; color: string }[] = [
  { id: 'renew', label: 'Renovados', color: '#166534' },
  { id: 'in',    label: 'Fichados',  color: '#166534' },
  { id: 'out',   label: 'Salidas',   color: 'var(--red)' },
  { id: 'rumor', label: 'Rumores',   color: 'var(--muted)' },
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

interface SquadPlayer {
  id: string
  name: string
  position: string
  photo_url: string | null
  dorsal: number | null
}

const STAFF_PLAYERS: SquadPlayer[] = [
  {
    id: 'staff-1',
    name: 'José Juan Romero',
    position: 'Entrenador',
    photo_url: 'https://assets.laliga.com/squad/2025/t14705/man53081/512x512/man53081_t14705_2025_1_003_000.png',
    dorsal: null,
  },
  {
    id: 'staff-2',
    name: 'Antonio José Sánchez',
    position: 'Segundo entrenador',
    photo_url: 'https://assets.laliga.com/squad/2025/t14705/man67065/512x512/man67065_t14705_2025_1_003_000.png',
    dorsal: null,
  },
]

function PlayerPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (p: SquadPlayer) => void
  onClose: () => void
}) {
  const [players, setPlayers] = useState<SquadPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
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
  }, [])

  const filtered = players.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '80vh', background: 'var(--white)',
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>
              Seleccionar jugador
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}
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
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid var(--border)', fontSize: 14,
              background: 'var(--bone)', boxSizing: 'border-box',
              fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Cargando plantilla…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Sin resultados
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 16px', background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                  background: 'var(--bone-2)', flexShrink: 0, position: 'relative',
                }}>
                  {p.photo_url ? (
                    <Image
                      src={p.photo_url}
                      alt={p.name}
                      fill
                      sizes="44px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
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

  async function load() {
    const res = await fetch('/api/admin/transfers')
    const data = await res.json()
    setTransfers(data.transfers ?? [])
  }

  useEffect(() => { load() }, [])

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
    const pos = posMap[p.position.toLowerCase()] ?? 'DEL'
    setForm((f) => ({
      ...f,
      name: p.name,
      position: pos,
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

    let res: Response
    if (editingId) {
      res = await fetch('/api/admin/transfers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...body }),
      })
    } else {
      res = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

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

  const C = {
    card: {
      background: 'var(--white)', borderRadius: 14, padding: 20,
      marginBottom: 16, boxShadow: 'var(--shadow-card)',
    } as React.CSSProperties,
    label: {
      fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const,
      letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6,
      display: 'block', fontFamily: 'var(--font-display)',
    },
    input: {
      width: '100%', padding: '10px 12px', borderRadius: 10,
      border: '1.5px solid var(--border)', fontSize: 14,
      background: 'var(--bone)', boxSizing: 'border-box' as const,
      fontFamily: 'var(--font-body)', outline: 'none',
    },
    select: {
      width: '100%', padding: '10px 12px', borderRadius: 10,
      border: '1.5px solid var(--border)', fontSize: 14,
      background: 'var(--bone)', boxSizing: 'border-box' as const,
      fontFamily: 'var(--font-body)',
    },
    row: { marginBottom: 14 } as React.CSSProperties,
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 } as React.CSSProperties,
  }

  const secTitle = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 14,
    fontFamily: 'var(--font-display)',
  }

  const showPlayerPicker = form.type === 'out' || form.type === 'renew'

  return (
    <div style={{ fontFamily: 'var(--font-display)' }}>
        <div style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>
          Mercado de Fichajes
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} style={{
          ...C.card,
          borderTop: editingId ? '3px solid var(--gold)' : '3px solid var(--black)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={secTitle}>{editingId ? '✏️ Editando jugador' : 'Añadir movimiento'}</div>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                padding: '4px 12px', cursor: 'pointer', fontSize: 12,
                color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700,
              }}>
                Cancelar
              </button>
            )}
          </div>

          {/* Tipo primero para que el picker aparezca según tipo */}
          <div style={C.row}>
            <label style={C.label}>Tipo de movimiento</label>
            <select style={C.select} value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TransferType })}>
              <option value="in">✅ Fichaje</option>
              <option value="renew">🔄 Renovación</option>
              <option value="out">🚪 Salida</option>
              <option value="rumor">🔥 Rumor</option>
            </select>
          </div>

          {/* Player picker para salidas y renovaciones */}
          {showPlayerPicker && (
            <div style={{ marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 10,
                  border: '2px solid var(--red)', background: 'rgba(220,38,38,0.06)',
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  fontSize: 13, fontWeight: 800, color: 'var(--red)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                👥 {form.name ? `Cambiar jugador (${form.name})` : 'Seleccionar jugador de plantilla'}
              </button>
            </div>
          )}

          <div style={C.row}>
            <label style={C.label}>Nombre del jugador</label>
            <input style={C.input} value={form.name} required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej. Marcos Acuña" />
          </div>

          <div style={C.grid2}>
            <div>
              <label style={C.label}>Posición</label>
              <select style={C.select} value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={C.label}>Fiabilidad</label>
              {form.type === 'rumor' ? (
                <div style={{ display: 'flex', gap: 8, height: 42 }}>
                  {([1, 2, 3] as const).map((v) => (
                    <button key={v} type="button"
                      onClick={() => setForm({ ...form, reliability: v })}
                      style={{
                        flex: 1, borderRadius: 10, border: 'none',
                        background: form.reliability >= v ? 'var(--black)' : 'var(--bone-2)',
                        color: form.reliability >= v ? 'var(--white)' : 'var(--muted)',
                        cursor: 'pointer', fontFamily: 'var(--font-display)',
                        fontSize: 16, fontWeight: 800,
                      }}>
                      {'🔥'.repeat(v)}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ ...C.select as React.CSSProperties, display: 'flex', alignItems: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  N/A
                </div>
              )}
            </div>
          </div>

          <div style={C.grid2}>
            <div>
              <label style={C.label}>Club de origen</label>
              <input style={C.input} value={form.clubFrom}
                onChange={(e) => setForm({ ...form, clubFrom: e.target.value })}
                placeholder="ej. Sevilla FC" />
            </div>
            <div>
              <label style={C.label}>Club de destino</label>
              <input style={C.input} value={form.clubTo}
                onChange={(e) => setForm({ ...form, clubTo: e.target.value })}
                placeholder="Solo para salidas" />
            </div>
          </div>

          <div style={C.row}>
            <label style={C.label}>Foto del jugador</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px dashed var(--border)',
                  background: 'var(--bone)', cursor: uploading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  color: uploading ? 'var(--muted)' : 'var(--black)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                {uploading ? 'Subiendo...' : '📁 Subir desde dispositivo'}
              </button>
            </div>
            <input style={{ ...C.input, fontSize: 12 }} value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="O pega una URL directamente..." type="url" />
            {form.photoUrl && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
                  background: 'var(--bone-2)', position: 'relative', flexShrink: 0,
                }}>
                  <Image
                    src={form.photoUrl.includes('supabase.co')
                      ? form.photoUrl
                      : `/api/proxy/image?url=${encodeURIComponent(form.photoUrl)}&w=120`}
                    alt="preview"
                    fill
                    sizes="56px"
                    className="object-cover object-top"
                    unoptimized
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {form.photoUrl.includes('supabase.co') ? '✅ Guardada en Supabase' : 'Vista previa'}
                </span>
              </div>
            )}
          </div>

          <div style={C.row}>
            <label style={C.label}>Nota / contexto (opcional)</label>
            <input style={C.input} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="ej. Interés confirmado por El Faro" />
          </div>

          <button type="submit" disabled={saving}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: saving ? 'var(--bone-2)' : editingId ? 'var(--gold)' : 'var(--black)',
              color: editingId ? 'var(--black)' : 'var(--white)',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: saving ? 'default' : 'pointer',
            }}>
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Añadir movimiento'}
          </button>

          {msg && (
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, fontWeight: 700,
              color: msg.startsWith('✓') ? '#166534' : 'var(--red)' }}>
              {msg}
            </p>
          )}
        </form>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const count = transfers.filter(t => t.type === tab.id).length
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? tab.color : 'var(--bone)',
                color: active ? 'var(--white)' : 'var(--muted)',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {tab.label}
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--bone-2)',
                  color: active ? 'var(--white)' : 'var(--black)',
                  borderRadius: 'var(--r-pill)', padding: '1px 7px', fontSize: 11, fontWeight: 900,
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* List */}
        <div style={secTitle}>
          {TYPE_LABELS[activeTab]} ({transfers.filter(t => t.type === activeTab).length})
        </div>
        {transfers.filter(t => t.type === activeTab).length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
            Sin movimientos en esta categoría
          </div>
        )}
        {transfers.filter(t => t.type === activeTab).map((t) => (
            <div key={t.id} style={{
              ...C.card,
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              outline: editingId === t.id ? '2px solid var(--gold)' : 'none',
            }}>
              {t.photoUrl && (
                <div style={{
                  width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                  background: 'var(--bone-2)', position: 'relative', flexShrink: 0,
                }}>
                  <Image
                    src={`/api/proxy/image?url=${encodeURIComponent(t.photoUrl)}&w=88`}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover object-top"
                    unoptimized
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>
                  {t.name}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px',
                    borderRadius: 'var(--r-pill)', background: TYPE_COLORS[t.type],
                    color: 'var(--white)',
                  }}>
                    {TYPE_LABELS[t.type]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                    {t.position}
                  </span>
                  {t.clubFrom && <span style={{ fontSize: 11, color: 'var(--muted)' }}>← {t.clubFrom}</span>}
                  {t.clubTo && <span style={{ fontSize: 11, color: 'var(--muted)' }}>→ {t.clubTo}</span>}
                  {t.type === 'rumor' && <span style={{ fontSize: 11 }}>{'🔥'.repeat(t.reliability)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => startEdit(t)}
                  style={{
                    background: 'var(--bone)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 12, color: 'var(--black)', fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                  }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(t.id)}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                  }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        }

        {showPicker && (
          <PlayerPickerModal
            onSelect={handlePlayerPick}
            onClose={() => setShowPicker(false)}
          />
        )}
    </div>
  )
}
