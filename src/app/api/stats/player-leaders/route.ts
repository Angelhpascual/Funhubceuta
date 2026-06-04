import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

const CURRENT_SEASON = '2025-2026'

const CATEGORIES = [
  { key: 'appearances',      label: 'Partidos jugados', icon: '📋', min: 1 },
  { key: 'goals',            label: 'Goles',            icon: '⚽', min: 1 },
  { key: 'assists',          label: 'Asistencias',      icon: '🎯', min: 1 },
  { key: 'shots',            label: 'Tiros totales',    icon: '🔫', min: 1 },
  { key: 'shots_on_target',  label: 'Tiros a puerta',   icon: '🎯', min: 1 },
  { key: 'saves',            label: 'Paradas',          icon: '🧤', min: 1 },
  { key: 'yellow_cards',     label: 'Tarjetas amarillas', icon: '🟨', min: 1 },
  { key: 'red_cards',        label: 'Tarjetas rojas',   icon: '🟥', min: 1 },
]

function normalize(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export async function GET() {
  const [{ data, error }, { data: squadData }] = await Promise.all([
    supabase
      .from('player_stats')
      .select('name, photo_url, appearances, goals, assists, shots, shots_on_target, saves, yellow_cards, red_cards')
      .eq('season', CURRENT_SEASON),
    supabase.from('squad').select('name, photo_url'),
  ])

  if (error || !data) return NextResponse.json({ leaders: null })

  // Build photo lookup from squad table (LaLiga photos)
  const photoByName = new Map<string, string>()
  for (const p of squadData ?? []) {
    if (p.photo_url) photoByName.set(normalize(p.name), p.photo_url)
  }

  function getPhoto(espnName: string, espnPhoto: string | null): string {
    if (espnPhoto) return espnPhoto
    // Try exact normalized match
    const exact = photoByName.get(normalize(espnName))
    if (exact) return exact
    // Try partial match (ESPN may use full name, squad may use short name)
    const norm = normalize(espnName)
    for (const [key, url] of photoByName) {
      if (norm.includes(key) || key.includes(norm)) return url
    }
    return ''
  }

  const leaders: Record<string, { label: string; icon: string; leaders: { name: string; value: number; photo: string }[] }> = {}

  for (const cat of CATEGORIES) {
    const sorted = data
      .filter(p => (p[cat.key as keyof typeof p] as number) >= cat.min)
      .sort((a, b) => (b[cat.key as keyof typeof b] as number) - (a[cat.key as keyof typeof a] as number))
      .slice(0, 5)

    if (sorted.length === 0) continue

    leaders[cat.key] = {
      label: cat.label,
      icon: cat.icon,
      leaders: sorted.map(p => ({
        name: p.name,
        value: p[cat.key as keyof typeof p] as number,
        photo: getPhoto(p.name, p.photo_url),
      })),
    }
  }

  return NextResponse.json({ leaders })
}
