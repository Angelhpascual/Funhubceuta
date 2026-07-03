export const maxDuration = 60

import { NextResponse } from 'next/server'
import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'
import { logCron } from '@/infrastructure/supabase/logCron'

async function syncSquad() {
  const t0 = Date.now()
  const players = await scrapeSquad()
  if (players.length === 0) {
    await logCron('squad', 'success', Date.now() - t0, { players: 0 })
    return 0
  }

  const { error } = await supabase.from('squad').upsert(
    players.map((p) => ({
      dorsal: p.dorsal,
      name: p.name,
      position: p.position,
      position_group: p.positionGroup,
      nationality: p.nationality,
      height: p.height,
      weight: p.weight,
      birth_date: p.birthDate,
      photo_url: p.photoUrl,
      season: CURRENT_SEASON,
    })),
    { onConflict: 'name,season', ignoreDuplicates: false }
  )

  if (error) {
    await logCron('squad', 'error', Date.now() - t0, { error: error.message })
    throw new Error(`Failed to upsert squad: ${error.message}`)
  }

  await logCron('squad', 'success', Date.now() - t0, { players: players.length })
  return players.length
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}

export async function POST() {
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}
