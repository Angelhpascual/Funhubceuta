import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'

// Two legitimate callers hit a cron POST in production: QStash's own
// scheduled delivery (which signs every request — verified below) and the
// admin panel's manual "sync now" buttons, which call the route directly
// with `?secret=TEST_SECRET` and no signature. Accept either.
export async function verifyCronRequest(request: Request): Promise<boolean> {
  const secret = new URL(request.url).searchParams.get('secret')
  if (secret && secret === process.env.TEST_SECRET) return true

  // Missing signing keys (an env without them) must read as "not authorized"
  // (401), not crash the route with a 500.
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!currentSigningKey || !nextSigningKey) return false
  try {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey })
    const body = await request.text()
    return await receiver.verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
  } catch {
    return false
  }
}

export function cronUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
