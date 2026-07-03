import { supabase } from './client'
import type { Player, Group } from '@/features/club/clubTypes'

const GROUP_ORDER = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']

function mapPlayer(p: Record<string, unknown>): Player {
  return {
    id: p.id as string,
    dorsal: p.dorsal as number | null,
    name: p.name as string,
    position: (p.position as string | null) ?? '',
    position_group: (p.position_group as string | null) ?? '',
    nationality: (p.nationality as string | null) ?? '',
    height: p.height as string | null,
    weight: p.weight as string | null,
    birth_date: p.birth_date as string | null,
    photo_url: p.photo_url as string | null,
    career_history: p.career_history as Player['career_history'],
    bio: p.bio as string | null,
  }
}

export async function fetchSquadBySeason(season: string): Promise<{ grouped: Group[]; total: number }> {
  const { data } = await supabase
    .from('squad')
    .select('*')
    .eq('season', season)
    .order('dorsal', { ascending: true })

  const byGroup: Record<string, Player[]> = {}
  for (const p of data ?? []) {
    const g = (p.position_group as string | null) ?? 'Otros'
    if (!byGroup[g]) byGroup[g] = []
    byGroup[g]!.push(mapPlayer(p))
  }
  const grouped = GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({
    group: g,
    players: byGroup[g]!,
  }))
  return { grouped, total: data?.length ?? 0 }
}

export async function fetchPlayerById(id: string, season: string) {
  const { data } = await supabase
    .from('squad')
    .select('id,dorsal,name,position,position_group,nationality,height,weight,birth_date,photo_url,career_history,bio')
    .eq('id', id)
    .eq('season', season)
    .single()
  return data ?? null
}

export async function fetchPhotosByDorsal(season: string): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('squad')
    .select('dorsal,photo_url')
    .eq('season', season)
    .not('photo_url', 'ilike', '%/default/%')
  const map: Record<string, string> = {}
  for (const r of data ?? []) {
    if (r.dorsal != null && r.photo_url) map[String(r.dorsal)] = r.photo_url
  }
  return map
}
