import { supabase } from './client'
import { supabaseAdmin } from './adminClient'

export type TransferType = 'in' | 'out' | 'rumor' | 'renew'

export interface Transfer {
  id: string
  name: string
  position: string
  type: TransferType
  clubFrom: string | null
  clubTo: string | null
  reliability: 1 | 2 | 3
  photoUrl: string | null
  notes: string | null
  createdAt: string
}

function mapRow(row: Record<string, unknown>): Transfer {
  return {
    id: row.id as string,
    name: row.name as string,
    position: row.position as string,
    type: row.type as TransferType,
    clubFrom: (row.club_from as string | null) ?? null,
    clubTo: (row.club_to as string | null) ?? null,
    reliability: (row.reliability as 1 | 2 | 3) ?? 1,
    photoUrl: (row.photo_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

export async function getTransfers(): Promise<Transfer[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function createTransfer(
  input: Omit<Transfer, 'id' | 'createdAt'>
): Promise<Transfer | null> {
  const { data, error } = await supabaseAdmin
    .from('transfers')
    .insert({
      name: input.name,
      position: input.position,
      type: input.type,
      club_from: input.clubFrom,
      club_to: input.clubTo,
      reliability: input.reliability,
      photo_url: input.photoUrl,
      notes: input.notes,
    })
    .select()
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export async function deleteTransfer(id: string): Promise<void> {
  await supabaseAdmin.from('transfers').delete().eq('id', id)
}

export async function getTransfersWithExternalPhotos(): Promise<{ id: string; photo_url: string }[]> {
  const { data } = await supabaseAdmin
    .from('transfers')
    .select('id, photo_url')
    .not('photo_url', 'is', null)
    .not('photo_url', 'like', '%supabase.co%')
  return (data ?? []) as { id: string; photo_url: string }[]
}

export async function updateTransferPhotoUrl(id: string, photoUrl: string): Promise<void> {
  await supabaseAdmin.from('transfers').update({ photo_url: photoUrl }).eq('id', id)
}

export async function updateTransfer(
  id: string,
  input: Partial<Omit<Transfer, 'id' | 'createdAt'>>
): Promise<void> {
  await supabaseAdmin.from('transfers').update({
    name: input.name,
    position: input.position,
    type: input.type,
    club_from: input.clubFrom,
    club_to: input.clubTo,
    reliability: input.reliability,
    photo_url: input.photoUrl,
    notes: input.notes,
  }).eq('id', id)
}
