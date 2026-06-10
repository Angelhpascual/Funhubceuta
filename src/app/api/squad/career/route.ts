import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { fetchEspnRoster, scrapeCareerHistory } from '@/infrastructure/scrapers/espnCareerScraper'
import { CURRENT_SEASON } from '@/lib/constants'

// POST /api/squad/career — scrape and store career history for all squad players
// Protected by CRON_SECRET so it can only be triggered manually or by cron
export async function POST(req: Request) {
  const secret = req.headers.get('x-secret') ?? new URL(req.url).searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rosterPlayers = await fetchEspnRoster()

  const results: { name: string; espnId: string; clubs: number; error?: string }[] = []

  for (const { espnId, name } of rosterPlayers) {
    try {
      const career = await scrapeCareerHistory(espnId)

      // Find matching squad player by name (fuzzy: last name match)
      const { data: squadPlayers } = await supabase
        .from('squad')
        .select('id, name')
        .eq('season', CURRENT_SEASON)

      // Match by last word (surname) — handles "J.g. Campaña" vs "José Campaña"
      const lastName = (n: string) => n.trim().split(' ').pop()!.toLowerCase()
      const match = (squadPlayers ?? []).find(p =>
        p.name.toLowerCase() === name.toLowerCase() ||
        lastName(p.name) === lastName(name)
      )

      if (match && career.length > 0) {
        await supabase
          .from('squad')
          .update({ career_history: career, espn_id: espnId })
          .eq('id', match.id)
      }

      results.push({ name, espnId, clubs: career.length })
      // Be polite to ESPN
      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      results.push({ name, espnId, clubs: 0, error: String(e) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
