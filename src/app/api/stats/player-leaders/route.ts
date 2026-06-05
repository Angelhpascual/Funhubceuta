import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

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

// Manual overrides: ESPN name → squad name fragment to match
const NAME_OVERRIDES: Record<string, string> = {
  'guillermo': 'vallejo',
  'peri':      'pery',
  'curro':     'curro',
  'aisar':     'aisar',
  'matos':     'matos',
  'anuar':     'anuar',
  'salvi':     'salvi',
  'yeyo':      'yeyo',
}

function norm(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// Extract significant words (>3 chars, not abbreviations like "hdez.")
function sigWords(name: string): string[] {
  return norm(name).split(/[\s.]+/).filter(w => w.length > 3 && /^[a-z]+$/.test(w))
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

  // Build photo lookup: for each squad player, store their significant words → photo
  const squadPhotos: { words: string[]; url: string }[] = (squadData ?? [])
    .filter(p => p.photo_url)
    .map(p => ({ words: sigWords(p.name), url: p.photo_url }))

  function getPhoto(espnName: string, espnPhoto: string | null): string {
    if (espnPhoto) return espnPhoto
    const normEspn = norm(espnName)
    // Check manual overrides first
    const override = NAME_OVERRIDES[normEspn]
    if (override) {
      const match = squadPhotos.find(sq => sq.words.includes(override) || norm(sq.url).includes(override))
      // search by override word in squad names
      const found = squadData?.find(p => norm(p.name).includes(override))
      if (found?.photo_url) return found.photo_url
    }
    const espnWords = sigWords(espnName)
    for (const sq of squadPhotos) {
      if (espnWords.some(w => sq.words.includes(w))) return sq.url
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
