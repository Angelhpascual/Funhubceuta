import { NextResponse } from 'next/server'
import { scrapeAllScheduled } from '@/infrastructure/scrapers/adceutaScraper'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { CURRENT_MATCH_SEASON, COMPETITION } from '@/lib/constants'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matches = await scrapeAllScheduled()
  if (matches.length === 0) {
    return NextResponse.json({ ok: false, error: 'No matches found from ESPN' })
  }

  // Delete all scheduled matches for current season first
  await supabaseAdmin
    .from('matches')
    .delete()
    .eq('status', 'scheduled')
    .eq('season', CURRENT_MATCH_SEASON)

  const { error } = await supabaseAdmin.from('matches').insert(
    matches.map((m) => ({
      external_id: `${m.date}-${m.homeTeam}-${m.awayTeam}`.toLowerCase().replace(/\s+/g, '-'),
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      date: m.date,
      time: m.time,
      weekday: m.weekday,
      is_home: m.isHome,
      tickets_url: m.ticketsUrl,
      status: 'scheduled',
      season: CURRENT_MATCH_SEASON,
      competition: COMPETITION,
      espn_event_id: m.espnEventId,
    }))
  )

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, inserted: matches.length, season: CURRENT_MATCH_SEASON })
})
