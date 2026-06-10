import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { fetchEspnRoster, scrapeCareerHistory } from '@/infrastructure/scrapers/espnCareerScraper'
import { CURRENT_SEASON } from '@/lib/constants'

// Manual overrides for players whose LaLiga abbreviated name ≠ ESPN full name
const MANUAL_MAP: Record<string, string> = {
  'A.romero':    '409801', // Adrián Romero
  'Kone K. A':   '331653', // Kialy Kone
  'Josema':      '409297', // José Manuel López Pérez
  'Manu Schez':  '214383', // Manuel Sánchez
  'Pery Garcia': '394315', // Peri
  'G.almenara':  '331760', // Gonzalo
}

// POST /api/squad/career — scrape and store career history for all squad players
// Protected by CRON_SECRET so it can only be triggered manually or by cron
export async function POST(req: Request) {
  const secret = req.headers.get('x-secret') ?? new URL(req.url).searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rosterPlayers = await fetchEspnRoster()
  const { data: squadPlayers } = await supabase
    .from('squad').select('id, name').eq('season', CURRENT_SEASON)

  const results: { name: string; espnId: string; clubs: number; error?: string }[] = []

  // Build combined list: ESPN roster + manual overrides for unmatched players
  const manualEntries = Object.entries(MANUAL_MAP).map(([dbName, espnId]) => ({
    espnId,
    name: dbName,
    isManual: true,
  }))
  const allEntries = [
    ...rosterPlayers.map(p => ({ ...p, isManual: false })),
    ...manualEntries,
  ]

  for (const { espnId, name, isManual } of allEntries) {
    try {
      const career = await scrapeCareerHistory(espnId)

      let match: { id: string; name: string } | undefined

      if (isManual) {
        // Manual: find exact DB name
        match = (squadPlayers ?? []).find(p => p.name === name)
      } else {
        // Auto: multi-strategy fuzzy match
        const lastName = (n: string) => n.trim().split(' ').pop()!.toLowerCase()
        const firstToken = (n: string) => n.trim().split(' ')[0].toLowerCase()
        match = (squadPlayers ?? []).find(p => {
          const pl = p.name.toLowerCase()
          const nl = name.toLowerCase()
          return pl === nl
            || lastName(pl) === lastName(nl)
            || pl.includes(firstToken(nl))
        })
        // Skip if this player is already covered by a manual override
        if (match && Object.keys(MANUAL_MAP).includes(match.name)) match = undefined
      }

      if (match && career.length > 0) {
        await supabase
          .from('squad')
          .update({ career_history: career, espn_id: espnId })
          .eq('id', match.id)
      }

      results.push({ name, espnId, clubs: career.length })
      await new Promise(r => setTimeout(r, 400))
    } catch (e) {
      results.push({ name, espnId, clubs: 0, error: String(e) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
