export const maxDuration = 60

import { NextResponse } from 'next/server'
import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

async function syncSquad() {
  const players = await scrapeSquad()
  if (players.length === 0) return 0

  // Clear current season squad and replace
  await supabase.from('squad').delete().eq('season', CURRENT_SEASON)

  const { error } = await supabase.from('squad').insert(
    players.map(p => ({
      dorsal: p.dorsal,
      name: p.name,
      position: p.position,
      position_group: p.positionGroup,
      nationality: p.nationality,
      photo_url: p.photoUrl,
      season: CURRENT_SEASON,
    }))
  )

  if (error) throw new Error(`Failed to insert squad: ${error.message}`)
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
