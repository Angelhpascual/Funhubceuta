import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { downloadAndUploadImage, isStoredNewsImage, newsImageFilename } from '@/infrastructure/storage/imageUploader'

export const maxDuration = 60

const repo = new NewsSupabaseRepository()

async function run() {
  const rows = await repo.getLatestRowsWithImages(30)
  let optimized = 0

  await Promise.all(
    rows
      .filter((row) => !isStoredNewsImage(row.imageUrl))
      .slice(0, 8)
      .map(async (row) => {
        const storedUrl = await downloadAndUploadImage(
          row.imageUrl,
          newsImageFilename(row.source, row.externalId)
        )
        if (!storedUrl) return
        await repo.updateImageUrlById(row.id, storedUrl)
        optimized++
      })
  )

  return { optimized }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret === process.env.TEST_SECRET) {
    return NextResponse.json({ ok: true, ...(await run()) })
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

  return NextResponse.json({ ok: true, ...(await run()) })
}
