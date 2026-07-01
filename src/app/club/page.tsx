import { Suspense } from 'react'
import { ClubPage } from '@/features/club/ClubPage'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON, PREVIOUS_SEASON, STANDINGS_CURRENT_SEASON } from '@/lib/constants'
import type { LeadersMap } from '@/features/club/clubTypes'
import { fetchCeutaForm } from '@/lib/serverFetches'

export const revalidate = 300

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
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function sigWords(name: string): string[] {
  return norm(name)
    .split(/[\s.]+/)
    .filter((w) => w.length > 3 && /^[a-z]+$/.test(w))
}

const GROUP_ORDER = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']

async function fetchSquadBySeason(season: string) {
  const { data } = await supabase
    .from('squad')
    .select('*')
    .eq('season', season)
    .order('dorsal', { ascending: true })

  const byGroup: Record<string, typeof data> = {}
  for (const p of data ?? []) {
    const g = p.position_group ?? 'Otros'
    if (!byGroup[g]) byGroup[g] = []
    byGroup[g]!.push(p)
  }
  const grouped = GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({
    group: g,
    players: byGroup[g]!,
  }))
  return { grouped, total: data?.length ?? 0 }
}

async function fetchCeuta() {
  const service = new StandingsService(new StandingsSupabaseRepository())
  const standings = await service.getStandings(STANDINGS_CURRENT_SEASON)
  return standings?.entries?.find((e) => e.teamName.toLowerCase().includes('ceuta')) ?? null
}

async function fetchLeadersBySeason(season: string): Promise<LeadersMap | null> {
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

export default async function ClubServerPage() {
  const [
    { grouped, total },
    { grouped: previousGrouped, total: previousTotal },
    ceuta,
    form,
    leaders,
    previousLeaders,
  ] = await Promise.all([
    fetchSquadBySeason(CURRENT_SEASON),
    fetchSquadBySeason(PREVIOUS_SEASON),
    fetchCeuta(),
    fetchCeutaForm(),
    fetchLeadersBySeason(CURRENT_SEASON),
    fetchLeadersBySeason(PREVIOUS_SEASON),
  ])

  return (
    <Suspense>
      <ClubPage
        grouped={grouped}
        total={total}
        previousGrouped={previousGrouped}
        previousTotal={previousTotal}
        ceuta={ceuta}
        form={form}
        leaders={leaders}
        previousLeaders={previousLeaders}
      />
    </Suspense>
  )
}
