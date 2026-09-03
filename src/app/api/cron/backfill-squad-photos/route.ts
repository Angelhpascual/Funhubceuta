import { NextRequest, NextResponse } from 'next/server'
import { backfillSquadPhotos } from '@/infrastructure/squad/backfillSquadPhotos'
import { logCron } from '@/infrastructure/supabase/logCron'
import { checkCronAuth, cronUnauthorized } from '@/infrastructure/cron/auth'
import { withApi } from '@/lib/apiError'

export const maxDuration = 60

async function backfillPhotos() {
  const t0 = Date.now()
  const result = await backfillSquadPhotos()
  await logCron('backfill-squad-photos', 'success', Date.now() - t0, result)
  return result
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
