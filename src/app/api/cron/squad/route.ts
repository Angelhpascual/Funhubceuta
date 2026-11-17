export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { scrapeOfficialSquadPhotos } from '@/infrastructure/scrapers/officialSquadPhotoScraper'
import { upsertSquad, overridePhotoUrlsByDorsal } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { backfillSquadPhotos } from '@/infrastructure/squad/backfillSquadPhotos'
import { CURRENT_SEASON } from '@/lib/constants'
import { logCron } from '@/infrastructure/supabase/logCron'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'

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

  // El club quiere las fotos de su web oficial, no las de LaLiga — se
  // sobrescribe por dorsal antes del backfill para que éste las descargue
  // y optimice a nuestro storage igual que hacía con las de LaLiga. Un
  // fallo aquí no debe tumbar el sync (dorsal sigue siendo válido con la
  // foto de LaLiga como respaldo).
  try {
    const officialPhotos = await scrapeOfficialSquadPhotos()
    await overridePhotoUrlsByDorsal(
      CURRENT_SEASON,
      new Map(officialPhotos.map((p) => [p.dorsal, p.photoUrl]))
    )
  } catch (err) {
    await logCron('squad', 'error', Date.now() - t0, {
      stage: 'official-photos',
      error: (err as Error).message,
    })
  }

  // Las fotos se descargan y optimizan una sola vez a nuestro storage; solo
  // cambian cuando llega plantilla oficial nueva.
  const backfill = await backfillSquadPhotos()

  // backfill.failed used to be silently dropped here — every run logged
  // 'success' even when several photo downloads failed (dead CDN URL, etc.),
  // so a persistent problem was invisible without manually counting players
  // still missing a migrated photo. Surfacing it as an 'error' status (while
  // the squad sync itself still succeeded) makes it show up in the admin
  // dashboard's error count like any other cron problem.
  await logCron('squad', backfill.failed > 0 ? 'error' : 'success', Date.now() - t0, {
    players: players.length,
    photosBackfilled: backfill.optimized,
    photosFailed: backfill.failed,
  })
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

export async function POST(req: NextRequest) {
  if (!(await verifyCronRequest(req))) return cronUnauthorized()
  const count = await syncSquad()
  return NextResponse.json({ ok: true, count })
}
