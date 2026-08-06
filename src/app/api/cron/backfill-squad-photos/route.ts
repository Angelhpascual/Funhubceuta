import { NextRequest, NextResponse } from 'next/server'
import { CURRENT_SEASON } from '@/lib/constants'
import { getPlayersWithExternalPhotos, updatePlayerPhotoUrl } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { downloadAndUploadImage, PLAYER_BUCKET } from '@/infrastructure/storage/imageUploader'
import { logCron } from '@/infrastructure/supabase/logCron'
import { checkCronAuth, cronUnauthorized } from '@/infrastructure/cron/auth'
import { withApi } from '@/lib/apiError'

export const maxDuration = 60

// Process up to 15 players per run to stay within Vercel function timeout
const BATCH_SIZE = 15

async function backfillPhotos() {
  const t0 = Date.now()
  const players = await getPlayersWithExternalPhotos(CURRENT_SEASON)
  const batch = players.slice(0, BATCH_SIZE)

  let optimized = 0
  let failed = 0

  await Promise.all(
    batch.map(async ({ id, photo_url }) => {
      const filename = `players/${id}`
      const stored = await downloadAndUploadImage(photo_url, filename, {
        bucket: PLAYER_BUCKET,
        maxWidth: 220,
        maxHeight: 240,
        quality: 80,
      })
      if (stored) {
        await updatePlayerPhotoUrl(id, stored)
        optimized++
      } else {
        failed++
      }
    })
  )

  await logCron('backfill-squad-photos', 'success', Date.now() - t0, {
    pending: players.length,
    optimized,
    failed,
  })

  return { pending: players.length, optimized, failed }
}

export const GET = withApi(async (request: Request) => {
  if (!checkCronAuth(request)) return cronUnauthorized()
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const result = await backfillPhotos()
  return NextResponse.json({ ok: true, ...result })
})

export const POST = withApi(async (req: NextRequest) => {
  const result = await backfillPhotos()
  return NextResponse.json({ ok: true, ...result })
})
