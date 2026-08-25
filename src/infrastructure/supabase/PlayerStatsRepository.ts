import { supabase } from './client'
import type { LeadersMap } from '@/features/club/clubTypes'

export interface PlayerStatRow {
  espn_id: string
  season: string
  name: string
  short_name: string
  position: string
  position_group: string
  photo_url: string | null
  appearances: number
  goals: number
  assists: number
  shots: number
  shots_on_target: number
  yellow_cards: number
  red_cards: number
  saves: number
  goals_conceded: number
  updated_at: string
}

export async function upsertPlayerStats(rows: PlayerStatRow[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase
    .from('player_stats')
    .upsert(rows, { onConflict: 'espn_id,season' })
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`)
}

const CATEGORIES = [
  { key: 'appearances', label: 'Partidos jugados', icon: '📋', min: 1 },
  { key: 'goals', label: 'Goles', icon: '⚽', min: 1 },
  { key: 'assists', label: 'Asistencias', icon: '🎯', min: 1 },
  { key: 'shots', label: 'Tiros totales', icon: '🔫', min: 1 },
  { key: 'shots_on_target', label: 'Tiros a puerta', icon: '🎯', min: 1 },
  { key: 'saves', label: 'Paradas', icon: '🧤', min: 1 },
  { key: 'yellow_cards', label: 'Tarjetas amarillas', icon: '🟨', min: 1 },
  { key: 'red_cards', label: 'Tarjetas rojas', icon: '🟥', min: 1 },
]

const NAME_OVERRIDES: Record<string, string> = {
  guillermo: 'vallejo',
  peri: 'pery',
}

function norm(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

function sigWords(name: string): string[] {
  return norm(name).split(/[\s.]+/).filter((w) => w.length > 3 && /^[a-z]+$/.test(w))
}

export async function fetchLeadersBySeason(season: string): Promise<LeadersMap | null> {
  const [{ data }, { data: squadData }] = await Promise.all([
    supabase
      .from('player_stats')
      .select('name, photo_url, appearances, goals, assists, shots, shots_on_target, saves, yellow_cards, red_cards')
      .eq('season', season),
    supabase.from('squad').select('name, photo_url').eq('season', season),
  ])
  if (!data) return null

  const squadPhotos = (squadData ?? [])
    .filter((p) => p.photo_url)
    .map((p) => ({ words: sigWords(p.name), url: p.photo_url }))

  function getPhoto(espnName: string, espnPhoto: string | null): string {
    if (espnPhoto) return espnPhoto
    const override = NAME_OVERRIDES[norm(espnName)]
    if (override) {
      const found = squadData?.find((p) => norm(p.name).includes(override))
      if (found?.photo_url) return found.photo_url
    }
    const espnWords = sigWords(espnName)
    for (const sq of squadPhotos) {
      if (espnWords.some((w) => sq.words.includes(w))) return sq.url
    }
    return ''
  }

  const leaders: LeadersMap = {}
  for (const cat of CATEGORIES) {
    const sorted = data
      .filter((p) => (p[cat.key as keyof typeof p] as number) >= cat.min)
      .sort((a, b) => (b[cat.key as keyof typeof b] as number) - (a[cat.key as keyof typeof a] as number))
      .slice(0, 5)
    if (!sorted.length) continue
    leaders[cat.key] = {
      label: cat.label,
      icon: cat.icon,
      leaders: sorted.map((p) => ({
        name: p.name,
        value: p[cat.key as keyof typeof p] as number,
        photo: getPhoto(p.name, p.photo_url),
      })),
    }
  }
  return leaders
}

export async function fetchPlayerStatsByName(name: string, season: string) {
  const { data } = await supabase
    .from('player_stats')
    .select('appearances,goals,assists,shots,shots_on_target,saves,yellow_cards,red_cards')
    .eq('season', season)
    .ilike('name', `%${name.split(' ')[0]}%`)
    .single()
  return data ?? null
}
