import { NextResponse } from 'next/server'
import { getTransfersWithExternalPhotos, updateTransferPhotoUrl } from '@/infrastructure/supabase/TransfersRepository'
import { downloadAndUploadImage, PLAYER_BUCKET } from '@/infrastructure/storage/imageUploader'
import { logCron } from '@/infrastructure/supabase/logCron'

export const maxDuration = 60

const BATCH_SIZE = 15

async function backfillTransferPhotos() {
  const t0 = Date.now()
  const transfers = await getTransfersWithExternalPhotos()
  const batch = transfers.slice(0, BATCH_SIZE)

  let optimized = 0
  let failed = 0

  await Promise.all(
    batch.map(async ({ id, photo_url }) => {
      const stored = await downloadAndUploadImage(photo_url, `transfers/${id}`, {
        bucket: PLAYER_BUCKET,
        maxWidth: 220,
        maxHeight: 240,
        quality: 80,
      })
      if (stored) {
        await updateTransferPhotoUrl(id, stored)
        optimized++
      } else {
        failed++
      }
    })
  )

  await logCron('backfill-transfer-photos', 'success', Date.now() - t0, {
    pending: transfers.length,
    optimized,
    failed,
  })

  return { pending: transfers.length, optimized, failed }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') === process.env.TEST_SECRET) {
    const result = await backfillTransferPhotos()
    return NextResponse.json({ ok: true, ...result })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
