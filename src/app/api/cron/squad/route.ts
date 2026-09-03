export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { upsertSquad } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { backfillSquadPhotos } from '@/infrastructure/squad/backfillSquadPhotos'
import { CURRENT_SEASON } from '@/lib/constants'
import { logCron } from '@/infrastructure/supabase/logCron'
import { checkCronAuth, cronUnauthorized } from '@/infrastructure/cron/auth'

async function syncSquad() {
  const t0 = Date.now()
  const players = await scrapeSquad()
  if (players.length === 0) {
    await logCron('squad', 'success', Date.now() - t0, { players: 0 })
    return 0
  }

  try {
    await upsertSquad(players, CURRENT_SEASON)
  } catch (err) {
    await logCron('squad', 'error', Date.now() - t0, { error: (err as Error).message })
    throw err
  }

  // Las fotos de LaLiga son lentas de servir — se descargan y optimizan una
  // sola vez a nuestro storage; solo cambian cuando llega plantilla oficial nueva.
  const backfill = await backfillSquadPhotos()

  await logCron('squad', 'success', Date.now() - t0, { players: players.length, photosBackfilled: backfill.optimized })
  return players.length
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) return cronUnauthorized()
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}

export async function POST(req: NextRequest) {
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}
