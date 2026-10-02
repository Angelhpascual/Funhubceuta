import type { TransferType } from '@/infrastructure/supabase/TransfersRepository'

export const POSITIONS = ['POR', 'DEF', 'MED', 'DEL', 'ENT']
export const TYPE_LABELS: Record<TransferType, string> = { in: 'Fichaje', out: 'Salida', rumor: 'Rumor', renew: 'Renovación' }
export const TYPE_BADGE: Record<TransferType, string> = {
  in:    'bg-[#E7F6EC] text-[#166534]',
  out:   'bg-ceuta-red-soft text-ceuta-red',
  rumor: 'bg-ceuta-bg-mid text-ceuta-muted',
  renew: 'bg-ceuta-gold-soft text-[#8A6D00]',
}
export const TABS: { id: TransferType; label: string }[] = [
  { id: 'renew', label: 'Renovados' },
  { id: 'in',    label: 'Fichados'  },
  { id: 'out',   label: 'Salidas'   },
  { id: 'rumor', label: 'Rumores'   },
]

export const EMPTY_FORM = {
  name: '',
  position: 'DEL',
  type: 'in' as TransferType,
  clubFrom: '',
  clubTo: '',
  reliability: 1 as 1 | 2 | 3,
  photoUrl: '',
  notes: '',
}
export type TransferForm = typeof EMPTY_FORM

export const INPUT_CLS = 'w-full px-3 py-[10px] rounded-[10px] border border-ceuta-border text-[14px] bg-ceuta-bg-soft outline-none'
export const LABEL_CLS = 'block text-[10px] font-extrabold uppercase tracking-[0.1em] text-ceuta-muted mb-1.5 font-display'
export const CARD_CLS = 'bg-white rounded-[14px] p-5 mb-4 border border-ceuta-border'

export interface SquadPlayer {
  id: string
  name: string
  position: string
  photo_url: string | null
  dorsal: number | null
}
