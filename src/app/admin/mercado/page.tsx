'use client'

import { useEffect, useRef, useState } from 'react'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'
import { PlayerPickerModal } from '@/features/admin/PlayerPickerModal'
import { AdminHero } from '@/features/admin/AdminHero'
import { TransferFormCard } from '@/features/admin/mercado/TransferFormCard'
import { TransferList } from '@/features/admin/mercado/TransferList'
import { EMPTY_FORM, type SquadPlayer } from '@/features/admin/mercado/mercadoShared'

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

  return (
    <div className="font-display min-h-screen">
      <AdminHero
        label="Gestión de contenido"
        title={<>Mercado de <em className="not-italic text-ceuta-gold">fichajes.</em></>}
        badges={[{ color: '#1E9E4B', label: 'Movimientos publicados', value: transfers.length }]}
      />

      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
          <div>
            <TransferFormCard
              formRef={formRef}
              fileInputRef={fileInputRef}
              form={form}
              setForm={setForm}
              editingId={editingId}
              saving={saving}
              uploading={uploading}
              msg={msg}
              showPlayerPicker={showPlayerPicker}
              onSubmit={handleSubmit}
              onCancelEdit={cancelEdit}
              onPhotoUpload={handlePhotoUpload}
              onShowPicker={() => setShowPicker(true)}
            />
          </div>

          <TransferList
            transfers={transfers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            editingId={editingId}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
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
