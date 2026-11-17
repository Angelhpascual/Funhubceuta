import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import type { Player, Group } from '@/features/club/clubTypes'
import type { ScrapedPlayer } from '@/infrastructure/scrapers/squadScraper'
import { namesLikelyMatch } from '@/lib/playerNameMatch'

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

// LaLiga's plantilla page renders player names with inconsistent abbreviation
// (e.g. "Joaquín González" one sync, "Joaquin G." the next) — matching on the
// exact name string caused every re-sync to insert a duplicate row for the
// same physical player. Dorsal is the stable identifier when present; when a
// player has no dorsal yet (a brand-new signing not yet listed with a squad
// number), fall back to namesLikelyMatch (shared surname/first-name token).
export async function upsertSquad(players: ScrapedPlayer[], season: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('squad')
    .select('id,name,dorsal,photo_url')
    .eq('season', season)
  const existingRows = (existing ?? []) as { id: string; name: string; dorsal: number | null; photo_url: string | null }[]

  const byDorsal = new Map<number, (typeof existingRows)[number]>()
  for (const row of existingRows) {
    if (row.dorsal != null) byDorsal.set(row.dorsal, row)
  }
  const usedIds = new Set<string>()

  const toUpdate: { id: string; row: Record<string, unknown> }[] = []
  const toInsert: Record<string, unknown>[] = []

  for (const p of players) {
    const match =
      (p.dorsal != null ? byDorsal.get(p.dorsal) : undefined) ??
      existingRows.find((row) => !usedIds.has(row.id) && namesLikelyMatch(row.name, p.name))

    // Preserve an already-optimized Supabase photo URL so the scraper doesn't overwrite it
    const photoUrl = match && isStoredUrl(match.photo_url) ? match.photo_url : p.photoUrl

    const row = {
      dorsal: p.dorsal,
      name: p.name,
      position: p.position,
      position_group: p.positionGroup,
      nationality: p.nationality,
      height: p.height,
      weight: p.weight,
      birth_date: p.birthDate,
      photo_url: photoUrl,
      season,
    }

    if (match) {
      usedIds.add(match.id)
      toUpdate.push({ id: match.id, row })
    } else {
      toInsert.push(row)
    }
  }

  for (const { id, row } of toUpdate) {
    const { error } = await supabaseAdmin.from('squad').update(row).eq('id', id)
    if (error) throw new Error(`Failed to update squad player: ${error.message}`)
  }

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from('squad').insert(toInsert)
    if (error) throw new Error(`Failed to insert squad player: ${error.message}`)
  }
}

export async function updatePlayerPhotoUrl(id: string, url: string): Promise<void> {
  await supabaseAdmin.from('squad').update({ photo_url: url }).eq('id', id)
}

// upsertSquad deliberately preserves an already-optimized Supabase photo_url
// so a re-sync never clobbers it with a raw external URL — but that guard
// also blocks picking up a genuinely new official-site photo for a player
// who already has one stored. This bypasses it on purpose: called right
// after upsertSquad with the official site's raw URLs, keyed by dorsal, it
// resets photo_url back to the raw external URL so backfillSquadPhotos
// re-downloads and re-optimizes the (possibly new) official photo.
export async function overridePhotoUrlsByDorsal(
  season: string,
  photosByDorsal: Map<number, string>
): Promise<void> {
  if (photosByDorsal.size === 0) return
  const { data } = await supabaseAdmin
    .from('squad')
    .select('id,dorsal')
    .eq('season', season)
    .in('dorsal', Array.from(photosByDorsal.keys()))
  for (const row of (data ?? []) as { id: string; dorsal: number }[]) {
    const url = photosByDorsal.get(row.dorsal)
    if (url) await supabaseAdmin.from('squad').update({ photo_url: url }).eq('id', row.id)
  }
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
