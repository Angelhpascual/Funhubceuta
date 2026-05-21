import { NextResponse } from 'next/server'
import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { supabase } from '@/infrastructure/supabase/client'

async function syncSquad() {
  const players = await scrapeSquad()
  if (players.length === 0) return 0

  // Clear current season squad and replace
  await supabase.from('squad').delete().eq('season', '2025-2026')

  const { error } = await supabase.from('squad').insert(
    players.map(p => ({
      dorsal: p.dorsal,
      name: p.name,
      position: p.position,
      position_group: p.positionGroup,
      nationality: p.nationality,
      season: '2025-2026',
    }))
  )

  if (error) throw new Error(`Failed to insert squad: ${error.message}`)
  return players.length
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}

export async function POST() {
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}
