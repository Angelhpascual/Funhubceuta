export const maxDuration = 60

import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { scrapeNextMatches, scrapeRecentForm, scrapeRecentResults } from '@/infrastructure/scrapers/adceutaScraper'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'

const repo = new MatchesSupabaseRepository()

async function syncMatches() {
  const [matches, form, results] = await Promise.all([
    scrapeNextMatches(),
    scrapeRecentForm(),
    scrapeRecentResults(10),
  ])

  await repo.upsertMatches(matches)

  // Store finished results in matches table
  if (results.length > 0) {
    await supabase.from('matches').upsert(
      results.map(r => ({
        external_id: `result-${r.date}-${r.homeTeam}-${r.awayTeam}`.toLowerCase().replace(/\s+/g, '-'),
        home_team: r.homeTeam,
        away_team: r.awayTeam,
        date: r.date,
        time: '',
        weekday: r.weekday,
        is_home: r.isHome,
        tickets_url: null,
        status: 'finished',
        season: '2025-2026',
        competition: 'Liga Hypermotion',
        home_score: r.homeScore,
        away_score: r.awayScore,
        result: r.result,
      })),
      { onConflict: 'external_id', ignoreDuplicates: true }
    )
  }

  // Cache form in app_config
  if (form.length > 0) {
    await supabase.from('app_config').upsert(
      { key: 'ceuta_form', value: form.join(','), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  return { matches: matches.length, form }
}

// QStash (producción)
export async function POST(request: Request) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver.verify({
    signature: request.headers.get('Upstash-Signature') ?? '',
    body,
  }).catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await syncMatches()
  return NextResponse.json({ ok: true, count })
}

// Manual en local/dev
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncMatches()
  return NextResponse.json({ ok: true, count })
}
