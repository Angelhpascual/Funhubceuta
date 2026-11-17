'use client'

import type React from 'react'
import Image from 'next/image'
import type { TransferType } from '@/infrastructure/supabase/TransfersRepository'
import { proxyImage } from '@/lib/proxyImage'
import { POSITIONS, INPUT_CLS, LABEL_CLS, CARD_CLS, type TransferForm } from './mercadoShared'

interface Props {
  formRef: React.RefObject<HTMLFormElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  form: TransferForm
  setForm: React.Dispatch<React.SetStateAction<TransferForm>>
  editingId: string | null
  saving: boolean
  uploading: boolean
  msg: string
  showPlayerPicker: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancelEdit: () => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onShowPicker: () => void
}

export function TransferFormCard({
  formRef, fileInputRef, form, setForm, editingId, saving, uploading, msg,
  showPlayerPicker, onSubmit, onCancelEdit, onPhotoUpload, onShowPicker,
}: Props) {
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={`${CARD_CLS} border-t-[3px] ${editingId ? 'border-t-ceuta-gold' : 'border-t-ceuta-black'}`}
    >
      <div className="flex justify-between items-center mb-3.5">
        <span className={LABEL_CLS}>{editingId ? '✏️ Editando jugador' : 'Añadir movimiento'}</span>
        {editingId && (
          <button type="button"
            onClick={onCancelEdit}
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
            onClick={onShowPicker}
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
          onChange={onPhotoUpload}
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
                src={proxyImage(form.photoUrl) ?? form.photoUrl}
                alt="preview"
                fill
                sizes="56px"
                className="object-cover object-top"
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
  )
}
