import { NextResponse } from 'next/server'
import { fetchEspnRoster, scrapeCareerHistory } from '@/infrastructure/scrapers/espnCareerScraper'
import { fetchSquadNames, updateCareerHistory } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { CURRENT_SEASON } from '@/lib/constants'
import { namesLikelyMatch } from '@/lib/playerNameMatch'

// Manual overrides for players whose LaLiga abbreviated name ≠ ESPN full name,
// or whose ESPN displayName shares no token with it at all (e.g. ESPN shows
// only a first name/nickname unrelated to our stored surname).
const MANUAL_MAP: Record<string, string> = {
  'A.romero': '409801', // Adrián Romero
  'Kone K. A': '331653', // Kialy Kone
  Josema: '409297', // José Manuel López Pérez
  'Manu Schez': '214383', // Manuel Sánchez
  'Pery Garcia': '394315', // Peri
  'G.almenara': '331760', // Gonzalo
  'G. Vallejo': '218218', // ESPN solo muestra "Guillermo" (portero)
  Josemi: '3128491', // ESPN lo lista como "José Miguel Gómez Bapori"
}

// POST /api/squad/career — scrape and store career history for all squad players
export async function POST(req: Request) {
  const secret = req.headers.get('x-secret') ?? new URL(req.url).searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [rosterPlayers, squadPlayers] = await Promise.all([
    fetchEspnRoster(),
    fetchSquadNames(CURRENT_SEASON),
  ])

  const results: { name: string; espnId: string; clubs: number; error?: string }[] = []

  const manualEntries = Object.entries(MANUAL_MAP).map(([dbName, espnId]) => ({
    espnId, name: dbName, isManual: true,
  }))
  const allEntries = [...rosterPlayers.map((p) => ({ ...p, isManual: false })), ...manualEntries]

  for (const { espnId, name, isManual } of allEntries) {
    try {
      const career = await scrapeCareerHistory(espnId)

      let match: { id: string; name: string } | undefined

      if (isManual) {
        match = squadPlayers.find((p) => p.name === name)
      } else {
        match = squadPlayers.find((p) => namesLikelyMatch(p.name, name))
        if (match && Object.keys(MANUAL_MAP).includes(match.name)) match = undefined
      }

      if (match && career.length > 0) {
        await updateCareerHistory(match.id, career, espnId)
      }

      results.push({ name, espnId, clubs: career.length })
      await new Promise((r) => setTimeout(r, 400))
    } catch (e) {
      results.push({ name, espnId, clubs: 0, error: String(e) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
