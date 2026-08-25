import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import type { Player, Group } from '@/features/club/clubTypes'
import type { ScrapedPlayer } from '@/infrastructure/scrapers/squadScraper'

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

const SUPABASE_HOST_RE = /\.supabase\.co$/i
function isStoredUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try { return SUPABASE_HOST_RE.test(new URL(url).hostname) } catch { return false }
}

export async function upsertSquad(players: ScrapedPlayer[], season: string): Promise<void> {
  // Preserve already-optimized Supabase photo URLs so the scraper doesn't overwrite them
  const { data: existing } = await supabaseAdmin
    .from('squad')
    .select('name,photo_url')
    .eq('season', season)
  const storedPhotos = new Map<string, string>()
  for (const row of existing ?? []) {
    if (isStoredUrl(row.photo_url)) storedPhotos.set(row.name as string, row.photo_url as string)
  }

  const { error } = await supabaseAdmin.from('squad').upsert(
    players.map((p) => ({
      dorsal: p.dorsal,
      name: p.name,
      position: p.position,
      position_group: p.positionGroup,
      nationality: p.nationality,
      height: p.height,
      weight: p.weight,
      birth_date: p.birthDate,
      photo_url: storedPhotos.get(p.name) ?? p.photoUrl,
      season,
    })),
    { onConflict: 'name,season', ignoreDuplicates: false }
  )
  if (error) throw new Error(`Failed to upsert squad: ${error.message}`)
}

export async function updatePlayerPhotoUrl(id: string, url: string): Promise<void> {
  await supabaseAdmin.from('squad').update({ photo_url: url }).eq('id', id)
}

export async function getPlayersWithExternalPhotos(season: string): Promise<{ id: string; photo_url: string }[]> {
  const { data } = await supabaseAdmin
    .from('squad')
    .select('id,photo_url')
    .eq('season', season)
    .not('photo_url', 'is', null)
    .not('photo_url', 'ilike', '%supabase.co%')
    .not('photo_url', 'ilike', '%/default/%')
  return (data ?? []) as { id: string; photo_url: string }[]
}

export async function fetchSquadNames(season: string): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from('squad')
    .select('id, name')
    .eq('season', season)
  return data ?? []
}

export async function updateCareerHistory(
  id: string,
  career: unknown[],
  espnId: string
): Promise<void> {
  await supabaseAdmin
    .from('squad')
    .update({ career_history: career, espn_id: espnId })
    .eq('id', id)
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
