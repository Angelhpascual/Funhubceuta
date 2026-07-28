import { NextRequest, NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { downloadAndUploadImage, newsImageFilename } from '@/infrastructure/storage/imageUploader'
import { fetchOgImage } from '@/infrastructure/rss/fetchOgImage'
import { logCron } from '@/infrastructure/supabase/logCron'

export const maxDuration = 60

const repo = new NewsSupabaseRepository()

async function run() {
  const t0 = Date.now()
  const rows = await repo.getRowsWithExternalImages(30)
  let optimized = 0

  // Migrate articles with external image URLs → Supabase storage
  await Promise.all(
    rows.map(async (row) => {
      const storedUrl = await downloadAndUploadImage(
        row.imageUrl,
        newsImageFilename(row.source, row.externalId ?? row.id)
      )
      if (!storedUrl) return
      await repo.updateImageUrlById(row.id, storedUrl)
      optimized++
    })
  )

  // Recover articles with no image by fetching og:image from the article page
  const noImageRows = await repo.getRowsWithoutImages(20)
  let recovered = 0
  await Promise.all(
    noImageRows.map(async (row) => {
      const ogUrl = await fetchOgImage(row.url)
      if (!ogUrl) return
      const storedUrl = await downloadAndUploadImage(ogUrl, `recovered-${row.id}`)
      const finalUrl = storedUrl ?? ogUrl
      await repo.updateImageUrlById(row.id, finalUrl)
      recovered++
    })
  )

  const result = { optimized, recovered, pending: Math.max(0, rows.length - optimized) }
  await logCron('backfill-images', 'success', Date.now() - t0, result)
  return result
}

async function runSafe() {
  const t0 = Date.now()
  try {
    return await run()
  } catch (err) {
    await logCron('backfill-images', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret === process.env.TEST_SECRET) {
    return NextResponse.json({ ok: true, ...(await runSafe()) })
  }

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver
    .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ ok: true, ...(await runSafe()) })
}
