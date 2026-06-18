'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/AdminShell'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL']
const TYPE_LABELS: Record<TransferType, string> = { in: 'Fichaje', out: 'Salida', rumor: 'Rumor', renew: 'Renovación' }
const TYPE_COLORS: Record<TransferType, string> = {
  in: '#166534',
  out: 'var(--red)',
  rumor: 'var(--muted)',
  renew: '#92700a',
}

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

export default function AdminMercadoPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/admin/transfers')
    const data = await res.json()
    setTransfers(data.transfers ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        clubFrom: form.clubFrom || null,
        clubTo: form.clubTo || null,
        photoUrl: form.photoUrl || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      setForm(EMPTY_FORM)
      setMsg('✓ Añadido')
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

  return (
    <AdminShell>
      <div style={{ fontFamily: 'var(--font-display)' }}>
        <div style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>
          Mercado de Fichajes
        </div>

        {/* Form */}
        <form onSubmit={handleAdd} style={C.card}>
          <div style={secTitle}>Añadir movimiento</div>

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
              <label style={C.label}>Tipo</label>
              <select style={C.select} value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TransferType })}>
                <option value="in">✅ Fichaje</option>
                <option value="renew">🔄 Renovación</option>
                <option value="out">🚪 Salida</option>
                <option value="rumor">🔥 Rumor</option>
              </select>
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

          {form.type === 'rumor' && (
            <div style={C.row}>
              <label style={C.label}>Fiabilidad del rumor</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 2, 3] as const).map((v) => (
                  <button key={v} type="button"
                    onClick={() => setForm({ ...form, reliability: v })}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                      background: form.reliability >= v ? 'var(--black)' : 'var(--bone-2)',
                      color: form.reliability >= v ? 'var(--white)' : 'var(--muted)',
                      cursor: 'pointer', fontFamily: 'var(--font-display)',
                      fontSize: 16, fontWeight: 800,
                    }}>
                    {'🔥'.repeat(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={C.row}>
            <label style={C.label}>URL foto (laliga.es, etc.)</label>
            <input style={C.input} value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..." type="url" />
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
              background: saving ? 'var(--bone-2)' : 'var(--black)', color: 'var(--white)',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: saving ? 'default' : 'pointer',
            }}>
            {saving ? 'Guardando...' : 'Añadir movimiento'}
          </button>

          {msg && (
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, fontWeight: 700,
              color: msg.startsWith('✓') ? '#166534' : 'var(--red)' }}>
              {msg}
            </p>
          )}
        </form>

        {/* List */}
        <div style={secTitle}>Movimientos registrados ({transfers.length})</div>
        {transfers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
            Sin movimientos aún
          </div>
        ) : (
          transfers.map((t) => (
            <div key={t.id} style={{
              ...C.card, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            }}>
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
          ))
        )}
      </div>
    </AdminShell>
  )
}
