import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'

// Two legitimate callers hit a cron POST in production: QStash's own
// scheduled delivery (which signs every request — verified below) and the
// admin panel's manual "sync now" buttons, which call the route directly
// with `?secret=TEST_SECRET` and no signature. Accept either.
export async function verifyCronRequest(request: Request): Promise<boolean> {
  const secret = new URL(request.url).searchParams.get('secret')
  if (secret && secret === process.env.TEST_SECRET) return true

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })
  const body = await request.text()
  return receiver
    .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
    .catch(() => false)
}

export function cronUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
