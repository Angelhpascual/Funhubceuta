import { NextResponse } from 'next/server'
import { fetchEspnRoster, scrapeCareerHistory } from '@/infrastructure/scrapers/espnCareerScraper'
import { fetchSquadNames, updateCareerHistory } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { CURRENT_SEASON } from '@/lib/constants'

// Manual overrides for players whose LaLiga abbreviated name ≠ ESPN full name
const MANUAL_MAP: Record<string, string> = {
  'A.romero': '409801', // Adrián Romero
  'Kone K. A': '331653', // Kialy Kone
  Josema: '409297', // José Manuel López Pérez
  'Manu Schez': '214383', // Manuel Sánchez
  'Pery Garcia': '394315', // Peri
  'G.almenara': '331760', // Gonzalo
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
        const lastName = (n: string) => n.trim().split(' ').pop()!.toLowerCase()
        const firstToken = (n: string) => n.trim().split(' ')[0].toLowerCase()
        match = squadPlayers.find((p) => {
          const pl = p.name.toLowerCase()
          const nl = name.toLowerCase()
          return pl === nl || lastName(pl) === lastName(nl) || pl.includes(firstToken(nl))
        })
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
